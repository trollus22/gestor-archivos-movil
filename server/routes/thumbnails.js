import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolveSafePath } from '../fs-service.js';
import { config, isSensitive } from '../config.js';

const execFileAsync = promisify(execFile);
const router = express.Router();
const THUMB_DIR = path.join(config.cacheDir, 'thumbnails');

if (!fs.existsSync(THUMB_DIR)) {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
}

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.ico']);
const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.webm', '.avi', '.mov', '.wmv', '.flv']);

router.get('/', async (req, res) => {
  const targetPath = req.query.path;
  if (!targetPath) return res.status(400).json({ error: 'Ruta no especificada' });

  try {
    const resolved = resolveSafePath(targetPath, true);
    if (resolved.isSensitive || isSensitive(resolved.safePath)) {
      return res.status(403).json({ error: 'No permitido' });
    }

    const ext = path.extname(resolved.safePath).toLowerCase();
    const hash = crypto.createHash('md5').update(resolved.safePath).digest('hex');
    const thumbPath = path.join(THUMB_DIR, `${hash}.jpg`);

    // Comprobar si ya existe en caché
    if (fs.existsSync(thumbPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(thumbPath).pipe(res);
    }

    if (VIDEO_EXTS.has(ext)) {
      try {
        await execFileAsync('ffmpeg', [
          '-ss', '00:00:01',
          '-i', resolved.safePath,
          '-vframes', '1',
          '-vf', 'scale=240:-1',
          '-f', 'image2',
          '-y',
          thumbPath,
        ], { timeout: 10000 });

        if (fs.existsSync(thumbPath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return fs.createReadStream(thumbPath).pipe(res);
        }
      } catch (ffErr) {
        // Fallback si ffmpeg falla en un video corrupto
        return res.status(404).json({ error: 'No se pudo generar miniatura del vídeo' });
      }
    } else if (IMAGE_EXTS.has(ext)) {
      // Para imágenes, podemos servir la imagen o crear miniatura reescalada si ffmpeg está disponible
      try {
        await execFileAsync('ffmpeg', [
          '-i', resolved.safePath,
          '-vf', 'scale=240:-1',
          '-y',
          thumbPath,
        ], { timeout: 8000 });

        if (fs.existsSync(thumbPath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return fs.createReadStream(thumbPath).pipe(res);
        }
      } catch (imgErr) {
        // Fallback: servir archivo directo si es imagen estándar
        const mimeType = mime.lookup(resolved.safePath) || 'image/jpeg';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return fs.createReadStream(resolved.safePath).pipe(res);
      }
    } else {
      return res.status(404).json({ error: 'Tipo de archivo no admite miniatura' });
    }

    res.status(404).json({ error: 'Miniatura no disponible' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
