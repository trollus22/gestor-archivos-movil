import express from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import mime from 'mime-types';
import { resolveSafePath } from '../fs-service.js';
import { isSensitive } from '../config.js';
import { logActivity } from '../activity.js';

const router = express.Router();

/**
 * Descarga de archivo individual
 */
router.get('/file', async (req, res) => {
  const targetPath = req.query.path;
  const inline = req.query.inline === 'true';

  if (!targetPath) {
    return res.status(400).json({ error: 'Ruta no especificada' });
  }

  try {
    const resolved = resolveSafePath(targetPath, true);

    // Bloquear explícitamente archivos sensibles
    if (resolved.isSensitive || isSensitive(resolved.safePath)) {
      return res.status(403).json({
        error: 'Descarga bloqueada: este archivo contiene información sensible del servidor (.env, claves privadas o configuración protegida).',
        code: 'SENSITIVE_BLOCKED',
      });
    }

    const stat = fs.statSync(resolved.safePath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'No se puede descargar un directorio como archivo simple. Use descarga de carpeta.' });
    }

    const fileName = path.basename(resolved.safePath);
    const mimeType = mime.lookup(resolved.safePath) || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stat.size);
    if (inline) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      logActivity('download_file', resolved.safePath, { size: stat.size }, req.session?.user || 'admin', true);
    }

    const stream = fs.createReadStream(resolved.safePath);
    stream.pipe(res);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.code === 'EACCES' ? 'Permiso denegado para leer el archivo' : (err.message || 'Error al descargar'),
    });
  }
});

/**
 * Descarga de carpeta completa comprimida en ZIP mediante streaming
 */
router.get('/folder', async (req, res) => {
  const targetPath = req.query.path;
  if (!targetPath) return res.status(400).json({ error: 'Ruta no especificada' });

  try {
    const resolved = resolveSafePath(targetPath, true);
    const stat = fs.statSync(resolved.safePath);

    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'La ruta debe ser un directorio' });
    }

    const folderName = path.basename(resolved.safePath) || 'carpeta';
    const zipName = `${folderName}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipName)}"`);

    const archive = archiver('zip', {
      zlib: { level: 6 },
    });

    archive.on('warning', (err) => {
      console.warn('Aviso al comprimir en streaming:', err);
    });

    archive.on('error', (err) => {
      console.error('Error al comprimir en streaming:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al generar archivo ZIP' });
      }
    });

    archive.pipe(res);

    // Añadir directorio excluyendo archivos sensibles
    archive.directory(resolved.safePath, false, (entry) => {
      if (isSensitive(entry.name)) {
        return false; // omitir sensible
      }
      return entry;
    });

    await archive.finalize();
    logActivity('download_folder_zip', resolved.safePath, {}, req.session?.user || 'admin', true);
  } catch (err) {
    if (!res.headersSent) {
      res.status(err.statusCode || 500).json({
        error: err.message || 'Error al descargar directorio',
      });
    }
  }
});

export default router;
