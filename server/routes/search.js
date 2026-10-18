import express from 'express';
import fsp from 'fs/promises';
import path from 'path';
import { resolveSafePath } from '../fs-service.js';
import { isSensitive } from '../config.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const targetPath = req.query.path || '/';
  const query = (req.query.query || '').trim().toLowerCase();

  if (!query) {
    return res.status(400).json({ error: 'Parámetro de búsqueda query requerido' });
  }

  let resolvedRoot;
  try {
    resolvedRoot = resolveSafePath(targetPath, true);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let isAborted = false;
  let count = 0;
  const maxResults = 1000;

  req.on('close', () => {
    isAborted = true;
  });

  async function searchDir(dir) {
    if (isAborted || count >= maxResults) return;

    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (e) {
      return; // Permiso denegado u otro error en subcarpeta
    }

    for (const entry of entries) {
      if (isAborted || count >= maxResults) return;

      const fullPath = path.join(dir, entry.name);
      if (isSensitive(fullPath)) continue;

      const matches = entry.name.toLowerCase().includes(query);
      if (matches) {
        count++;
        try {
          const stat = await fsp.stat(fullPath);
          const data = {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            isSymlink: entry.isSymbolicLink(),
            size: stat.size,
            mtime: stat.mtime,
          };
          res.write(`data: ${JSON.stringify({ type: 'item', data })}\n\n`);
        } catch (statErr) {
          res.write(`data: ${JSON.stringify({
            type: 'item',
            data: { name: entry.name, path: fullPath, isDirectory: entry.isDirectory(), size: 0 },
          })}\n\n`);
        }
      }

      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        await searchDir(fullPath);
      }
    }
  }

  try {
    await searchDir(resolvedRoot.safePath);
    res.write(`data: ${JSON.stringify({ type: 'done', count })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
