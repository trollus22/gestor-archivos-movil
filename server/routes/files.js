import express from 'express';
import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import {
  resolveSafePath,
  getFileMetadata,
  getDuplicateName,
  calculateFolderSize,
} from '../fs-service.js';
import { moveToTrash, deletePermanently } from '../trash.js';
import { logActivity } from '../activity.js';
import { isSensitive } from '../config.js';

const router = express.Router();

// Helper para copiar directorio recursivamente
async function copyRecursive(src, dest) {
  const stat = await fsp.lstat(src);
  if (stat.isDirectory()) {
    await fsp.mkdir(dest, { recursive: true });
    const entries = await fsp.readdir(src);
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isSymbolicLink()) {
    const target = await fsp.readlink(src);
    try {
      await fsp.symlink(target, dest);
    } catch (e) {
      // Si falla symlink, copiar contenido
      await fsp.copyFile(src, dest);
    }
  } else {
    await fsp.copyFile(src, dest);
  }
}

/**
 * Listar contenido de un directorio
 */
router.get('/list', async (req, res) => {
  const targetPath = req.query.path || '/';
  const showHidden = req.query.hidden === 'true';

  try {
    const resolved = resolveSafePath(targetPath, true);
    const stat = await fsp.stat(resolved.safePath);

    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'La ruta indicada no es un directorio' });
    }

    let entries;
    try {
      entries = await fsp.readdir(resolved.safePath, { withFileTypes: true });
    } catch (err) {
      if (err.code === 'EACCES') {
        return res.status(403).json({
          error: `Permiso denegado: el usuario no tiene permisos de lectura sobre ${resolved.safePath}`,
          code: 'EACCES',
          path: resolved.safePath,
        });
      }
      throw err;
    }

    const items = [];
    for (const entry of entries) {
      if (!showHidden && entry.name.startsWith('.')) {
        continue;
      }
      const itemPath = path.join(resolved.safePath, entry.name);
      try {
        const meta = await getFileMetadata(itemPath, false);
        items.push(meta);
      } catch (err) {
        // En caso de que un archivo individual no pueda leerse por permisos
        items.push({
          name: entry.name,
          path: itemPath,
          isDirectory: entry.isDirectory(),
          isSymlink: entry.isSymbolicLink(),
          size: 0,
          error: err.code === 'EACCES' ? 'Permiso denegado' : 'Error al leer metadatos',
        });
      }
    }

    res.json({
      path: resolved.safePath,
      items,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al listar directorio',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Obtener propiedades y metadatos completos
 */
router.get('/stat', async (req, res) => {
  const targetPath = req.query.path;
  const checksums = req.query.checksums === 'true';

  if (!targetPath) {
    return res.status(400).json({ error: 'Ruta no especificada' });
  }

  try {
    const resolved = resolveSafePath(targetPath, true);
    const meta = await getFileMetadata(resolved.safePath, checksums);
    res.json(meta);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al obtener propiedades',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Crear nueva carpeta
 */
router.post('/mkdir', async (req, res) => {
  const { parentDir, name } = req.body || {};
  if (!parentDir || !name) {
    return res.status(400).json({ error: 'Directorio padre y nombre requeridos' });
  }

  try {
    const parent = resolveSafePath(parentDir, true);
    const newDir = path.join(parent.safePath, name);
    const safeTarget = resolveSafePath(newDir);

    if (fs.existsSync(safeTarget.safePath)) {
      return res.status(409).json({ error: 'Ya existe una carpeta o archivo con ese nombre' });
    }

    await fsp.mkdir(safeTarget.safePath, { recursive: true });
    logActivity('mkdir', safeTarget.safePath, {}, req.session?.user || 'admin', true);
    res.json({ success: true, path: safeTarget.safePath });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al crear carpeta',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Crear archivo de texto vacío
 */
router.post('/create-file', async (req, res) => {
  const { parentDir, name } = req.body || {};
  if (!parentDir || !name) {
    return res.status(400).json({ error: 'Directorio padre y nombre requeridos' });
  }

  try {
    const parent = resolveSafePath(parentDir, true);
    const targetFile = path.join(parent.safePath, name);
    const safeTarget = resolveSafePath(targetFile);

    if (fs.existsSync(safeTarget.safePath)) {
      return res.status(409).json({ error: 'Ya existe un archivo con ese nombre' });
    }

    await fsp.writeFile(safeTarget.safePath, '', 'utf8');
    logActivity('create_file', safeTarget.safePath, {}, req.session?.user || 'admin', true);
    res.json({ success: true, path: safeTarget.safePath });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al crear archivo',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Renombrar
 */
router.post('/rename', async (req, res) => {
  const { path: sourcePath, newName } = req.body || {};
  if (!sourcePath || !newName) {
    return res.status(400).json({ error: 'Ruta y nuevo nombre requeridos' });
  }

  try {
    const resolved = resolveSafePath(sourcePath, true);
    const parentDir = path.dirname(resolved.safePath);
    const newPath = path.join(parentDir, newName);
    const safeNewPath = resolveSafePath(newPath);

    if (fs.existsSync(safeNewPath.safePath) && safeNewPath.safePath !== resolved.safePath) {
      return res.status(409).json({ error: 'Ya existe un archivo o carpeta con ese nombre' });
    }

    await fsp.rename(resolved.safePath, safeNewPath.safePath);
    logActivity('rename', resolved.safePath, { newPath: safeNewPath.safePath }, req.session?.user || 'admin', true);
    res.json({ success: true, newPath: safeNewPath.safePath });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al renombrar',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Duplicar archivo o carpeta
 */
router.post('/duplicate', async (req, res) => {
  const { path: sourcePath } = req.body || {};
  if (!sourcePath) return res.status(400).json({ error: 'Ruta requerida' });

  try {
    const resolved = resolveSafePath(sourcePath, true);
    const parentDir = path.dirname(resolved.safePath);
    const originalName = path.basename(resolved.safePath);
    const newName = getDuplicateName(parentDir, originalName);
    const destPath = path.join(parentDir, newName);

    await copyRecursive(resolved.safePath, destPath);
    logActivity('duplicate', resolved.safePath, { duplicatePath: destPath }, req.session?.user || 'admin', true);
    res.json({ success: true, duplicatePath: destPath });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al duplicar',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Mover archivos o carpetas
 */
router.post('/move', async (req, res) => {
  const { sources, targetDir } = req.body || {};
  if (!Array.isArray(sources) || sources.length === 0 || !targetDir) {
    return res.status(400).json({ error: 'Fuentes y directorio destino requeridos' });
  }

  try {
    const resolvedTarget = resolveSafePath(targetDir, true);
    const results = [];

    for (const src of sources) {
      const resolvedSrc = resolveSafePath(src, true);
      const dest = path.join(resolvedTarget.safePath, path.basename(resolvedSrc.safePath));
      const safeDest = resolveSafePath(dest);

      if (safeDest.safePath === resolvedSrc.safePath) {
        continue;
      }

      // Evitar mover una carpeta dentro de sí misma
      if (safeDest.safePath.startsWith(resolvedSrc.safePath + path.sep)) {
        return res.status(400).json({ error: 'No se puede mover un directorio dentro de sí mismo' });
      }

      await fsp.rename(resolvedSrc.safePath, safeDest.safePath);
      results.push({ src: resolvedSrc.safePath, dest: safeDest.safePath });
      logActivity('move', resolvedSrc.safePath, { dest: safeDest.safePath }, req.session?.user || 'admin', true);
    }

    res.json({ success: true, moved: results });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al mover',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Copiar archivos o carpetas
 */
router.post('/copy', async (req, res) => {
  const { sources, targetDir } = req.body || {};
  if (!Array.isArray(sources) || sources.length === 0 || !targetDir) {
    return res.status(400).json({ error: 'Fuentes y directorio destino requeridos' });
  }

  try {
    const resolvedTarget = resolveSafePath(targetDir, true);
    const results = [];

    for (const src of sources) {
      const resolvedSrc = resolveSafePath(src, true);
      let destName = path.basename(resolvedSrc.safePath);
      let dest = path.join(resolvedTarget.safePath, destName);

      // Si copiamos en el mismo directorio, generar nombre con sufijo copia
      if (path.dirname(resolvedSrc.safePath) === resolvedTarget.safePath) {
        destName = getDuplicateName(resolvedTarget.safePath, destName);
        dest = path.join(resolvedTarget.safePath, destName);
      }

      const safeDest = resolveSafePath(dest);
      await copyRecursive(resolvedSrc.safePath, safeDest.safePath);
      results.push({ src: resolvedSrc.safePath, dest: safeDest.safePath });
      logActivity('copy', resolvedSrc.safePath, { dest: safeDest.safePath }, req.session?.user || 'admin', true);
    }

    res.json({ success: true, copied: results });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al copiar',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Cambiar permisos (chmod individual)
 */
router.post('/chmod', async (req, res) => {
  const { path: targetPath, mode } = req.body || {};
  if (!targetPath || !mode) {
    return res.status(400).json({ error: 'Ruta y modo requeridos' });
  }

  try {
    const resolved = resolveSafePath(targetPath, true);
    const octalMode = parseInt(mode, 8);
    if (isNaN(octalMode)) {
      return res.status(400).json({ error: 'Modo octal no válido' });
    }

    await fsp.chmod(resolved.safePath, octalMode);
    logActivity('chmod', resolved.safePath, { mode }, req.session?.user || 'admin', true);
    res.json({ success: true, path: resolved.safePath, mode });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.code === 'EPERM' || err.code === 'EACCES'
        ? `No tiene permisos suficientes para cambiar permisos de ${targetPath}`
        : (err.message || 'Error al cambiar permisos'),
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Cambiar permisos en lote (batch-chmod)
 */
router.post('/batch-chmod', async (req, res) => {
  const { paths, mode } = req.body || {};
  if (!Array.isArray(paths) || paths.length === 0 || !mode) {
    return res.status(400).json({ error: 'Rutas y modo requeridos' });
  }

  const octalMode = parseInt(mode, 8);
  if (isNaN(octalMode)) {
    return res.status(400).json({ error: 'Modo octal no válido' });
  }

  const results = [];
  for (const p of paths) {
    try {
      const resolved = resolveSafePath(p, true);
      await fsp.chmod(resolved.safePath, octalMode);
      results.push({ path: resolved.safePath, success: true });
      logActivity('chmod', resolved.safePath, { mode }, req.session?.user || 'admin', true);
    } catch (err) {
      results.push({ path: p, success: false, error: err.message });
    }
  }

  res.json({ success: true, results });
});

/**
 * Renombrar en lote (batch-rename)
 */
router.post('/batch-rename', async (req, res) => {
  const { paths, find, replace, mode, prefix, suffix } = req.body || {};
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'Rutas requeridas' });
  }

  const results = [];
  for (const p of paths) {
    try {
      const resolved = resolveSafePath(p, true);
      const parentDir = path.dirname(resolved.safePath);
      const oldName = path.basename(resolved.safePath);
      const ext = path.extname(oldName);
      const base = path.basename(oldName, ext);

      let newName = oldName;
      if (mode === 'replace' && find) {
        newName = oldName.replaceAll(find, replace || '');
      } else if (mode === 'prefix' && prefix) {
        newName = `${prefix}${oldName}`;
      } else if (mode === 'suffix' && suffix) {
        newName = `${base}${suffix}${ext}`;
      }

      if (newName !== oldName) {
        const newPath = path.join(parentDir, newName);
        const safeNewPath = resolveSafePath(newPath);
        await fsp.rename(resolved.safePath, safeNewPath.safePath);
        results.push({ oldPath: resolved.safePath, newPath: safeNewPath.safePath, success: true });
        logActivity('rename', resolved.safePath, { newPath: safeNewPath.safePath }, req.session?.user || 'admin', true);
      }
    } catch (err) {
      results.push({ path: p, success: false, error: err.message });
    }
  }

  res.json({ success: true, results });
});

/**
 * Intentar cambiar propietario / grupo (chown)
 */
router.post('/chown', async (req, res) => {
  const { path: targetPath, uid, gid } = req.body || {};
  if (!targetPath) return res.status(400).json({ error: 'Ruta requerida' });

  try {
    const resolved = resolveSafePath(targetPath, true);
    await fsp.chown(resolved.safePath, parseInt(uid, 10), parseInt(gid, 10));
    logActivity('chown', resolved.safePath, { uid, gid }, req.session?.user || 'admin', true);
    res.json({ success: true });
  } catch (err) {
    return res.status(403).json({
      error: `No se puede cambiar propietario/grupo sin permisos de superusuario (sudo/root): ${err.message}`,
      code: err.code || 'EPERM',
    });
  }
});

/**
 * Crear enlace simbólico
 */
router.post('/symlink', async (req, res) => {
  const { target, linkPath } = req.body || {};
  if (!target || !linkPath) {
    return res.status(400).json({ error: 'Destino y ruta del enlace requeridos' });
  }

  try {
    const resolvedTarget = resolveSafePath(target, true);
    const resolvedLink = resolveSafePath(linkPath);

    if (fs.existsSync(resolvedLink.safePath)) {
      return res.status(409).json({ error: 'Ya existe un archivo en la ruta del enlace' });
    }

    await fsp.symlink(resolvedTarget.safePath, resolvedLink.safePath);
    logActivity('symlink', resolvedLink.safePath, { target: resolvedTarget.safePath }, req.session?.user || 'admin', true);
    res.json({ success: true, linkPath: resolvedLink.safePath });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al crear enlace simbólico',
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Eliminar (papelera o permanente)
 */
router.post('/delete', async (req, res) => {
  const { paths, permanent } = req.body || {};
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'Rutas requeridas' });
  }

  const results = [];
  for (const p of paths) {
    try {
      const resolved = resolveSafePath(p, true);
      if (permanent) {
        await deletePermanently(resolved.safePath, req.session?.user || 'admin');
      } else {
        await moveToTrash(resolved.safePath, req.session?.user || 'admin');
      }
      results.push({ path: resolved.safePath, success: true });
    } catch (err) {
      results.push({ path: p, success: false, error: err.message });
    }
  }

  res.json({ success: true, results });
});

/**
 * Leer archivo de texto para el editor
 */
router.get('/read', async (req, res) => {
  const targetPath = req.query.path;
  if (!targetPath) return res.status(400).json({ error: 'Ruta no especificada' });

  try {
    const resolved = resolveSafePath(targetPath, true);

    // Comprobar si es un archivo sensible
    if (resolved.isSensitive || isSensitive(resolved.safePath)) {
      return res.status(403).json({
        error: 'Lectura bloqueada: este archivo contiene información sensible del sistema (.env, claves, ssh).',
        code: 'SENSITIVE_BLOCKED',
      });
    }

    const stat = await fsp.stat(resolved.safePath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'No se puede leer un directorio como texto' });
    }

    if (stat.size > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'El archivo es demasiado grande para editarse en el navegador (> 15 MB)' });
    }

    const content = await fsp.readFile(resolved.safePath, 'utf8');
    res.json({
      path: resolved.safePath,
      size: stat.size,
      mtime: stat.mtime,
      content,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.code === 'EACCES' ? 'Permiso denegado al leer el archivo' : (err.message || 'Error al leer archivo'),
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Guardar contenido en archivo de texto
 */
router.post('/save', async (req, res) => {
  const { path: targetPath, content } = req.body || {};
  if (!targetPath || content === undefined) {
    return res.status(400).json({ error: 'Ruta y contenido requeridos' });
  }

  try {
    const resolved = resolveSafePath(targetPath, true);

    if (resolved.isSensitive || isSensitive(resolved.safePath)) {
      return res.status(403).json({
        error: 'Escritura bloqueada en archivo sensible del sistema.',
        code: 'SENSITIVE_BLOCKED',
      });
    }

    await fsp.writeFile(resolved.safePath, content, 'utf8');
    logActivity('edit', resolved.safePath, { bytes: Buffer.byteLength(content) }, req.session?.user || 'admin', true);
    res.json({ success: true, path: resolved.safePath });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.code === 'EACCES' ? 'Permiso denegado al guardar archivo' : (err.message || 'Error al guardar'),
      code: err.code || 'UNKNOWN',
    });
  }
});

/**
 * Calcular tamaño de carpeta recursivo
 */
router.get('/folder-size', async (req, res) => {
  const targetPath = req.query.path;
  if (!targetPath) return res.status(400).json({ error: 'Ruta requerida' });

  try {
    const resolved = resolveSafePath(targetPath, true);
    const sizeData = await calculateFolderSize(resolved.safePath);
    res.json({ path: resolved.safePath, ...sizeData });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Error al calcular tamaño de carpeta',
    });
  }
});

export default router;
