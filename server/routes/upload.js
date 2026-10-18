import express from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { resolveSafePath } from '../fs-service.js';
import { logActivity } from '../activity.js';
import { config } from '../config.js';

const router = express.Router();
const UPLOAD_TEMP_DIR = path.join(config.cacheDir, 'uploads');

if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
}

// Mapa en memoria para seguir el estado de subidas
const activeUploads = new Map();

// Multer para chunks individuales
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadId = req.body.uploadId || req.query.uploadId;
    if (!uploadId) return cb(new Error('uploadId requerido'), null);
    const chunkDir = path.join(UPLOAD_TEMP_DIR, uploadId);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    cb(null, chunkDir);
  },
  filename: (req, file, cb) => {
    const chunkIndex = req.body.chunkIndex || req.query.chunkIndex || '0';
    cb(null, `chunk_${chunkIndex}`);
  },
});

const uploadMiddleware = multer({
  storage: uploadStorage,
  limits: { fileSize: config.maxChunkSizeMb * 1024 * 1024 },
});

/**
 * Inicializar una subida en trozos
 */
router.post('/init', (req, res) => {
  const { fileName, totalSize, chunkSize, totalChunks, targetDir } = req.body || {};

  if (!fileName || !totalSize || !targetDir) {
    return res.status(400).json({ error: 'Parámetros de subida incompletos' });
  }

  try {
    const resolvedTarget = resolveSafePath(targetDir, true);
    const uploadId = crypto.randomUUID();
    const chunkDir = path.join(UPLOAD_TEMP_DIR, uploadId);

    fs.mkdirSync(chunkDir, { recursive: true });

    const uploadInfo = {
      uploadId,
      fileName,
      totalSize: parseInt(totalSize, 10),
      chunkSize: parseInt(chunkSize, 10),
      totalChunks: parseInt(totalChunks || '1', 10),
      targetDir: resolvedTarget.safePath,
      uploadedChunks: new Set(),
      createdAt: Date.now(),
    };

    activeUploads.set(uploadId, uploadInfo);

    res.json({
      success: true,
      uploadId,
      totalChunks: uploadInfo.totalChunks,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al iniciar subida',
    });
  }
});

/**
 * Subir un trozo (chunk)
 */
router.post('/chunk', uploadMiddleware.single('chunk'), (req, res) => {
  const { uploadId, chunkIndex } = req.body || {};
  const cIndex = parseInt(chunkIndex, 10);

  let uploadInfo = activeUploads.get(uploadId);
  if (!uploadInfo) {
    // Si se reinició el servidor pero la carpeta existe
    const chunkDir = path.join(UPLOAD_TEMP_DIR, uploadId);
    if (fs.existsSync(chunkDir)) {
      uploadInfo = { uploadId, uploadedChunks: new Set() };
      activeUploads.set(uploadId, uploadInfo);
    } else {
      return res.status(404).json({ error: 'Sesión de subida no encontrada o expirada' });
    }
  }

  uploadInfo.uploadedChunks.add(cIndex);
  res.json({
    success: true,
    uploadId,
    chunkIndex: cIndex,
    uploadedCount: uploadInfo.uploadedChunks.size,
  });
});

/**
 * Consultar estado de subida para reanudar
 */
router.get('/status/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const chunkDir = path.join(UPLOAD_TEMP_DIR, uploadId);

  if (!fs.existsSync(chunkDir)) {
    return res.status(404).json({ error: 'Sesión de subida no encontrada' });
  }

  const existingChunks = [];
  const files = fs.readdirSync(chunkDir);
  for (const f of files) {
    if (f.startsWith('chunk_')) {
      const idx = parseInt(f.replace('chunk_', ''), 10);
      if (!isNaN(idx)) existingChunks.push(idx);
    }
  }

  res.json({
    uploadId,
    uploadedChunks: existingChunks,
  });
});

/**
 * Completar subida y ensamblar archivo final de forma streaming
 */
router.post('/complete', async (req, res) => {
  const { uploadId } = req.body || {};
  const uploadInfo = activeUploads.get(uploadId);
  const chunkDir = path.join(UPLOAD_TEMP_DIR, uploadId);

  if (!uploadInfo || !fs.existsSync(chunkDir)) {
    return res.status(404).json({ error: 'Sesión de subida no encontrada' });
  }

  const finalPath = path.join(uploadInfo.targetDir, uploadInfo.fileName);
  const safeFinal = resolveSafePath(finalPath);

  try {
    const writeStream = fs.createWriteStream(safeFinal.safePath);

    // Concatenar cada chunk en orden
    for (let i = 0; i < uploadInfo.totalChunks; i++) {
      const chunkFile = path.join(chunkDir, `chunk_${i}`);
      if (!fs.existsSync(chunkFile)) {
        writeStream.destroy();
        return res.status(400).json({ error: `Falta el trozo ${i} para completar el archivo` });
      }

      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkFile);
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', resolve);
        readStream.on('error', reject);
      });
    }

    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Limpiar directorio de chunks
    await fsp.rm(chunkDir, { recursive: true, force: true });
    activeUploads.delete(uploadId);

    logActivity('upload', safeFinal.safePath, { size: uploadInfo.totalSize }, req.session?.user || 'admin', true);

    res.json({
      success: true,
      path: safeFinal.safePath,
      fileName: uploadInfo.fileName,
      size: uploadInfo.totalSize,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error ensamblando el archivo final: ' + err.message,
    });
  }
});

export default router;
