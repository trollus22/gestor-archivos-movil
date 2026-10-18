import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from './config.js';
import { logActivity } from './activity.js';

const TRASH_DIR = config.trashDir;
const FILES_DIR = path.join(TRASH_DIR, 'files');
const META_FILE = path.join(TRASH_DIR, 'metadata.json');

function ensureTrashDirs() {
  if (!fs.existsSync(TRASH_DIR)) {
    fs.mkdirSync(TRASH_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }
  if (!fs.existsSync(META_FILE)) {
    fs.writeFileSync(META_FILE, JSON.stringify([]), 'utf8');
  }
}

function readMetadata() {
  ensureTrashDirs();
  try {
    const raw = fs.readFileSync(META_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeMetadata(data) {
  ensureTrashDirs();
  fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Lista todos los elementos en la papelera
 */
export async function listTrash() {
  ensureTrashDirs();
  const meta = readMetadata();
  return meta;
}

/**
 * Mueve un archivo o carpeta a la papelera
 */
export async function moveToTrash(absPath, user = 'admin') {
  ensureTrashDirs();
  const stat = await fsp.lstat(absPath);
  const id = crypto.randomUUID();
  const targetTrashPath = path.join(FILES_DIR, id);

  // Mover elemento a carpeta de papelera
  await fsp.rename(absPath, targetTrashPath);

  const meta = readMetadata();
  const entry = {
    id,
    originalPath: absPath,
    name: path.basename(absPath),
    isDirectory: stat.isDirectory(),
    size: stat.size,
    deletedAt: new Date().toISOString(),
  };

  meta.unshift(entry);
  writeMetadata(meta);

  logActivity('trash', absPath, { trashId: id }, user, true);
  return entry;
}

/**
 * Restaura un elemento de la papelera a su ruta original
 */
export async function restoreFromTrash(id, user = 'admin') {
  ensureTrashDirs();
  const meta = readMetadata();
  const index = meta.findIndex(m => m.id === id);

  if (index === -1) {
    const err = new Error('Elemento no encontrado en la papelera');
    err.statusCode = 404;
    throw err;
  }

  const item = meta[index];
  const trashPath = path.join(FILES_DIR, id);

  if (!fs.existsSync(trashPath)) {
    // Si el archivo físico ya no está, limpiamos el metadato
    meta.splice(index, 1);
    writeMetadata(meta);
    const err = new Error('El archivo físico en la papelera ya no existe');
    err.statusCode = 404;
    throw err;
  }

  // Asegurar que el directorio padre exista
  const parentDir = path.dirname(item.originalPath);
  if (!fs.existsSync(parentDir)) {
    await fsp.mkdir(parentDir, { recursive: true });
  }

  let finalDestination = item.originalPath;
  if (fs.existsSync(finalDestination)) {
    // Si ya existe algo con ese nombre, añadir sufijo para evitar sobrescribir
    const ext = path.extname(item.originalPath);
    const base = path.basename(item.originalPath, ext);
    finalDestination = path.join(parentDir, `${base} (restaurado ${Date.now()})${ext}`);
  }

  await fsp.rename(trashPath, finalDestination);

  meta.splice(index, 1);
  writeMetadata(meta);

  logActivity('restore', item.originalPath, { restoredPath: finalDestination }, user, true);
  return { success: true, restoredPath: finalDestination };
}

/**
 * Vacía la papelera por completo
 */
export async function emptyTrash(user = 'admin') {
  ensureTrashDirs();
  const meta = readMetadata();

  for (const item of meta) {
    const trashPath = path.join(FILES_DIR, item.id);
    try {
      if (fs.existsSync(trashPath)) {
        await fsp.rm(trashPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.error(`Error borrando ${trashPath} de papelera:`, e);
    }
  }

  writeMetadata([]);
  logActivity('empty_trash', TRASH_DIR, { count: meta.length }, user, true);
  return { success: true, clearedCount: meta.length };
}

/**
 * Borrado permanente de un archivo o carpeta
 */
export async function deletePermanently(absPath, user = 'admin') {
  const stat = await fsp.lstat(absPath);
  await fsp.rm(absPath, { recursive: true, force: true });
  logActivity('permanent_delete', absPath, { isDirectory: stat.isDirectory() }, user, true);
  return { success: true };
}
