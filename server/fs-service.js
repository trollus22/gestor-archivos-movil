import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { config, isSensitive } from './config.js';

const execFileAsync = promisify(execFile);

// Mapa de caché para resolver UID/GID a nombres de usuario y grupo
let userMap = null;
let groupMap = null;

function loadUserAndGroupMaps() {
  if (userMap && groupMap) return;
  userMap = new Map();
  groupMap = new Map();

  try {
    const passwdData = fs.readFileSync('/etc/passwd', 'utf8');
    for (const line of passwdData.split('\n')) {
      const parts = line.split(':');
      if (parts.length >= 3) {
        userMap.set(parseInt(parts[2], 10), parts[0]);
      }
    }
  } catch (err) {
    // Si no se puede leer, usará uid numérico
  }

  try {
    const groupData = fs.readFileSync('/etc/group', 'utf8');
    for (const line of groupData.split('\n')) {
      const parts = line.split(':');
      if (parts.length >= 3) {
        groupMap.set(parseInt(parts[2], 10), parts[0]);
      }
    }
  } catch (err) {
    // Si no se puede leer, usará gid numérico
  }
}

export function getUserName(uid) {
  loadUserAndGroupMaps();
  return userMap.get(uid) || String(uid);
}

export function getGroupName(gid) {
  loadUserAndGroupMaps();
  return groupMap.get(gid) || String(gid);
}

/**
 * Convierte el modo numérico a string rwx tradicional
 */
export function modeToRwx(mode) {
  const flags = [
    (mode & 0o400) ? 'r' : '-',
    (mode & 0o200) ? 'w' : '-',
    (mode & 0o100) ? 'x' : '-',
    (mode & 0o040) ? 'r' : '-',
    (mode & 0o020) ? 'w' : '-',
    (mode & 0o010) ? 'x' : '-',
    (mode & 0o004) ? 'r' : '-',
    (mode & 0o002) ? 'w' : '-',
    (mode & 0o001) ? 'x' : '-',
  ];
  return flags.join('');
}

/**
 * Canonicaliza y valida una ruta para proteger contra Path Traversal y Null Byte Injections.
 * Asegura que la ruta no escape de config.rootDir.
 */
export function resolveSafePath(inputPath, mustExist = false) {
  if (typeof inputPath !== 'string') {
    const err = new Error('Ruta inválida especificada');
    err.statusCode = 400;
    throw err;
  }

  // Rechazar bytes nulos
  if (inputPath.indexOf('\0') !== -1) {
    const err = new Error('Intento de inyección de byte nulo detectado');
    err.statusCode = 400;
    throw err;
  }

  // Rechazar secuencias de path traversal explícitas (..) tanto directas como codificadas
  let decoded = inputPath;
  try {
    decoded = decodeURIComponent(inputPath);
  } catch (e) {
    // Si no se puede decodificar, continuar con inputPath
  }

  const rawSegments = decoded.replace(/\\/g, '/').split('/');
  if (rawSegments.includes('..') || decoded.includes('/../') || decoded.startsWith('../') || decoded.endsWith('/..') || decoded === '..') {
    const err = new Error('Acceso denegado: intento de path traversal detectado (..)');
    err.statusCode = 403;
    throw err;
  }

  // Normalizar separadores y limpiar prefijo de barra
  const cleanPath = inputPath.replace(/\\/g, '/');
  
  // Resolver contra rootDir
  const relativeFromRoot = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  const resolvedPath = path.resolve(config.rootDir, relativeFromRoot);

  // Asegurar que resolvedPath esté contenido en config.rootDir
  const rootNormalized = path.resolve(config.rootDir);
  const isInsideRoot = rootNormalized === '/'
    ? resolvedPath.startsWith('/')
    : (resolvedPath === rootNormalized || resolvedPath.startsWith(rootNormalized + path.sep));

  if (!isInsideRoot) {
    const err = new Error('Acceso denegado: la ruta escapa de la raíz permitida');
    err.statusCode = 403;
    throw err;
  }

  // Comprobar existencia y enlaces simbólicos si existe
  let exists = false;
  let isSymlink = false;
  let symlinkTarget = null;
  let realPath = resolvedPath;

  try {
    const lstats = fs.lstatSync(resolvedPath);
    exists = true;
    isSymlink = lstats.isSymbolicLink();

    if (isSymlink) {
      try {
        symlinkTarget = fs.readlinkSync(resolvedPath);
        realPath = fs.realpathSync(resolvedPath);
        // Verificar que el destino del symlink no escape del root
        const targetInside = realPath === rootNormalized || realPath.startsWith(rootNormalized + path.sep) || rootNormalized === '/';
        if (!targetInside) {
          const err = new Error('Enlace simbólico apunta fuera de la raíz permitida');
          err.statusCode = 403;
          throw err;
        }
      } catch (symErr) {
        // Enlace roto u otro error de lectura
        if (symErr.statusCode === 403) throw symErr;
      }
    }
  } catch (err) {
    if (err.statusCode === 403) throw err;
    if (mustExist) {
      const notFoundErr = new Error(`El archivo o directorio no existe: ${inputPath}`);
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }
  }

  return {
    safePath: resolvedPath,
    realPath,
    exists,
    isSymlink,
    symlinkTarget,
    isSensitive: isSensitive(resolvedPath),
  };
}

/**
 * Obtiene la información detallada de un archivo o carpeta
 */
export async function getFileMetadata(absPath, calculateChecksums = false) {
  let lstat;
  try {
    lstat = await fsp.lstat(absPath);
  } catch (err) {
    if (err.code === 'EACCES') {
      const e = new Error(`Permiso denegado al acceder a ${absPath}`);
      e.statusCode = 403;
      e.code = 'EACCES';
      throw e;
    }
    throw err;
  }

  const isSymlink = lstat.isSymbolicLink();
  let target = null;
  let stat = lstat;

  if (isSymlink) {
    try {
      target = await fsp.readlink(absPath);
      stat = await fsp.stat(absPath);
    } catch (err) {
      // Symlink roto o no accesible
      stat = lstat;
    }
  }

  const isDirectory = stat.isDirectory();
  const mode = stat.mode;
  const octal = (mode & 0o777).toString(8).padStart(3, '0');
  const rwx = modeToRwx(mode);
  const mimeType = isDirectory ? 'directory' : (mime.lookup(absPath) || 'application/octet-stream');
  const diskSize = stat.blocks ? stat.blocks * 512 : stat.size;

  let checksums = null;
  if (!isDirectory && calculateChecksums && stat.size <= 200 * 1024 * 1024) { // límite 200MB para checksum en vivo
    try {
      checksums = await computeChecksums(absPath);
    } catch (e) {
      console.warn('Error calculando checksums:', e);
    }
  }

  return {
    name: path.basename(absPath) || '/',
    path: absPath,
    isDirectory,
    isSymlink,
    symlinkTarget: target,
    size: stat.size,
    diskSize,
    mtime: stat.mtime,
    atime: stat.atime,
    birthtime: stat.birthtime,
    permissionsOctal: octal,
    permissionsRwx: rwx,
    uid: stat.uid,
    gid: stat.gid,
    owner: getUserName(stat.uid),
    group: getGroupName(stat.gid),
    nlink: stat.nlink,
    mimeType,
    checksums,
    isSensitive: isSensitive(absPath),
  };
}

/**
 * Calcula hashes md5, sha1 y sha256 de forma streaming
 */
export async function computeChecksums(filePath) {
  return new Promise((resolve, reject) => {
    const md5 = crypto.createHash('md5');
    const sha1 = crypto.createHash('sha1');
    const sha256 = crypto.createHash('sha256');

    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => {
      md5.update(chunk);
      sha1.update(chunk);
      sha256.update(chunk);
    });

    stream.on('end', () => {
      resolve({
        md5: md5.digest('hex'),
        sha1: sha1.digest('hex'),
        sha256: sha256.digest('hex'),
      });
    });

    stream.on('error', err => reject(err));
  });
}

/**
 * Obtiene el uso de disco del sistema para la raíz
 */
export async function getDiskUsage(targetPath = '/') {
  try {
    const { stdout } = await execFileAsync('df', ['-k', '-P', targetPath]);
    const lines = stdout.trim().split('\n');
    if (lines.length >= 2) {
      const parts = lines[1].trim().split(/\s+/);
      const totalKb = parseInt(parts[1], 10);
      const usedKb = parseInt(parts[2], 10);
      const availKb = parseInt(parts[3], 10);
      const percentStr = parts[4];
      return {
        filesystem: parts[0],
        totalBytes: totalKb * 1024,
        usedBytes: usedKb * 1024,
        freeBytes: availKb * 1024,
        percent: parseInt(percentStr, 10) || Math.round((usedKb / totalKb) * 100),
      };
    }
  } catch (err) {
    console.error('Error al obtener uso de disco:', err);
  }
  return {
    filesystem: '/',
    totalBytes: 100 * 1024 * 1024 * 1024,
    usedBytes: 50 * 1024 * 1024 * 1024,
    freeBytes: 50 * 1024 * 1024 * 1024,
    percent: 50,
  };
}

/**
 * Calcula recursivamente el tamaño de una carpeta
 */
export async function calculateFolderSize(folderPath, onProgress = null) {
  let totalSize = 0;
  let fileCount = 0;
  let folderCount = 0;

  async function walk(dir) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (e) {
      return; // Ignorar carpetas sin permiso
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      try {
        if (entry.isDirectory()) {
          folderCount++;
          await walk(full);
        } else if (entry.isSymbolicLink()) {
          // No seguir symlinks recursivamente para evitar bucles
        } else {
          const stat = await fsp.stat(full);
          totalSize += stat.size;
          fileCount++;
          if (onProgress && fileCount % 100 === 0) {
            onProgress({ totalSize, fileCount, folderCount });
          }
        }
      } catch (err) {
        // Ignorar archivos individuales inaccesibles
      }
    }
  }

  await walk(folderPath);
  return { totalSize, fileCount, folderCount };
}

/**
 * Genera un nombre único cuando se duplica un archivo o carpeta
 */
export function getDuplicateName(parentDir, originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  let counter = 1;
  let candidate = `${base} (copia)${ext}`;
  while (fs.existsSync(path.join(parentDir, candidate))) {
    counter++;
    candidate = `${base} (copia ${counter})${ext}`;
  }
  return candidate;
}
