import express from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolveSafePath } from '../fs-service.js';
import { logActivity } from '../activity.js';

const execFileAsync = promisify(execFile);
const router = express.Router();

/**
 * Comprimir archivos y carpetas
 */
router.post('/compress', async (req, res) => {
  const { sources, targetDir, archiveName, format } = req.body || {};

  if (!Array.isArray(sources) || sources.length === 0 || !targetDir || !archiveName) {
    return res.status(400).json({ error: 'Fuentes, directorio de destino y nombre de archivo requeridos' });
  }

  const fmt = (format || 'zip').toLowerCase();
  let finalName = archiveName;

  if (fmt === 'zip' && !finalName.endsWith('.zip')) finalName += '.zip';
  else if (fmt === 'tar' && !finalName.endsWith('.tar')) finalName += '.tar';
  else if (fmt === 'tar.gz' && !finalName.endsWith('.tar.gz')) finalName += '.tar.gz';
  else if (fmt === 'gz' && !finalName.endsWith('.gz')) finalName += '.gz';

  try {
    const resolvedTargetDir = resolveSafePath(targetDir, true);
    const destArchive = path.join(resolvedTargetDir.safePath, finalName);
    const safeDest = resolveSafePath(destArchive);

    if (fs.existsSync(safeDest.safePath)) {
      return res.status(409).json({ error: `Ya existe un archivo con el nombre ${finalName}` });
    }

    if (fmt === 'gz') {
      // Compresión gzip individual
      if (sources.length > 1) {
        return res.status(400).json({ error: 'Gzip solo admite comprimir un archivo individual. Use tar.gz o zip para múltiples.' });
      }
      const resolvedSrc = resolveSafePath(sources[0], true);
      const stat = fs.statSync(resolvedSrc.safePath);
      if (stat.isDirectory()) {
        return res.status(400).json({ error: 'Gzip simple no comprime directorios. Use tar.gz.' });
      }

      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(resolvedSrc.safePath);
        const writeStream = fs.createWriteStream(safeDest.safePath);
        const gzip = zlib.createGzip();
        readStream.pipe(gzip).pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
      });
    } else {
      // Compresión con archiver (zip, tar, tar.gz)
      const archiveType = (fmt === 'tar.gz' || fmt === 'tar') ? 'tar' : 'zip';
      const archiveOptions = fmt === 'tar.gz'
        ? { gzip: true, gzipOptions: { level: 6 } }
        : (fmt === 'zip' ? { zlib: { level: 6 } } : {});

      const output = fs.createWriteStream(safeDest.safePath);
      const archive = archiver(archiveType, archiveOptions);

      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);

        for (const src of sources) {
          const resolvedSrc = resolveSafePath(src, true);
          const stat = fs.statSync(resolvedSrc.safePath);
          const baseName = path.basename(resolvedSrc.safePath);

          if (stat.isDirectory()) {
            archive.directory(resolvedSrc.safePath, baseName);
          } else {
            archive.file(resolvedSrc.safePath, { name: baseName });
          }
        }

        archive.finalize();
      });
    }

    logActivity('compress', safeDest.safePath, { format: fmt, count: sources.length }, req.session?.user || 'admin', true);
    res.json({ success: true, archivePath: safeDest.safePath });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al comprimir',
    });
  }
});

/**
 * Extraer archivos (zip, tar, tar.gz, gz, rar)
 */
router.post('/extract', async (req, res) => {
  const { archivePath, targetDir } = req.body || {};

  if (!archivePath || !targetDir) {
    return res.status(400).json({ error: 'Ruta del archivo y directorio de destino requeridos' });
  }

  try {
    const resolvedArchive = resolveSafePath(archivePath, true);
    const resolvedTarget = resolveSafePath(targetDir, true);

    const nameLower = resolvedArchive.safePath.toLowerCase();

    if (nameLower.endsWith('.zip')) {
      const zip = new AdmZip(resolvedArchive.safePath);
      zip.extractAllTo(resolvedTarget.safePath, true);
    } else if (nameLower.endsWith('.tar.gz') || nameLower.endsWith('.tgz')) {
      await execFileAsync('tar', ['-xzf', resolvedArchive.safePath, '-C', resolvedTarget.safePath]);
    } else if (nameLower.endsWith('.tar')) {
      await execFileAsync('tar', ['-xf', resolvedArchive.safePath, '-C', resolvedTarget.safePath]);
    } else if (nameLower.endsWith('.gz')) {
      const outName = path.basename(resolvedArchive.safePath, '.gz');
      const outPath = path.join(resolvedTarget.safePath, outName);
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(resolvedArchive.safePath);
        const writeStream = fs.createWriteStream(outPath);
        const gunzip = zlib.createGunzip();
        readStream.pipe(gunzip).pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
      });
    } else if (nameLower.endsWith('.rar')) {
      try {
        await execFileAsync('unrar', ['x', '-o+', resolvedArchive.safePath, resolvedTarget.safePath]);
      } catch (rarErr) {
        return res.status(501).json({
          error: 'No se pudo extraer .rar: la utilidad unrar no está instalada en el servidor.',
        });
      }
    } else {
      return res.status(400).json({ error: 'Formato de archivo comprimido no compatible' });
    }

    logActivity('extract', resolvedArchive.safePath, { targetDir: resolvedTarget.safePath }, req.session?.user || 'admin', true);
    res.json({ success: true, targetDir: resolvedTarget.safePath });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al extraer archivo',
    });
  }
});

/**
 * Listar contenido de un archivo zip/tar sin extraerlo
 */
router.get('/list', async (req, res) => {
  const archivePath = req.query.path;
  if (!archivePath) return res.status(400).json({ error: 'Ruta no especificada' });

  try {
    const resolved = resolveSafePath(archivePath, true);
    const nameLower = resolved.safePath.toLowerCase();

    if (nameLower.endsWith('.zip')) {
      const zip = new AdmZip(resolved.safePath);
      const zipEntries = zip.getEntries();
      const items = zipEntries.map(e => ({
        name: e.entryName,
        size: e.header.size,
        compressedSize: e.header.compressedSize,
        isDirectory: e.isDirectory,
        time: e.header.time,
      }));
      return res.json({ path: resolved.safePath, type: 'zip', items });
    } else if (nameLower.endsWith('.tar') || nameLower.endsWith('.tar.gz') || nameLower.endsWith('.tgz')) {
      const args = nameLower.endsWith('.tar') ? ['-tf', resolved.safePath] : ['-tzf', resolved.safePath];
      const { stdout } = await execFileAsync('tar', args);
      const lines = stdout.trim().split('\n').filter(Boolean);
      const items = lines.map(line => ({
        name: line,
        isDirectory: line.endsWith('/'),
        size: 0,
      }));
      return res.json({ path: resolved.safePath, type: 'tar', items });
    } else {
      return res.status(400).json({ error: 'Formato no compatible para previsualización de contenido' });
    }
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al listar archivo comprimido',
    });
  }
});

export default router;
