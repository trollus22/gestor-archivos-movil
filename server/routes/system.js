import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getDiskUsage } from '../fs-service.js';
import { getActivityLog } from '../activity.js';
import { config } from '../config.js';

const router = express.Router();
const BOOKMARKS_FILE = path.join(os.homedir(), '.gestion-bookmarks.json');

const DEFAULT_BOOKMARKS = {
  pinned: [
    { id: 'desktop', name: 'Escritorio', path: path.join(os.homedir(), 'Escritorio'), icon: 'desktop' },
    { id: 'downloads', name: 'Descargas', path: path.join(os.homedir(), 'Descargas'), icon: 'downloads' },
    { id: 'documents', name: 'Documentos', path: path.join(os.homedir(), 'Documentos'), icon: 'documents' },
    { id: 'pictures', name: 'Imágenes', path: path.join(os.homedir(), 'Imágenes'), icon: 'pictures' },
    { id: 'music', name: 'Música', path: path.join(os.homedir(), 'Música'), icon: 'music' },
    { id: 'videos', name: 'Vídeos', path: path.join(os.homedir(), 'Vídeos'), icon: 'videos' },
    { id: 'trash', name: 'Papelera', path: config.trashDir, icon: 'trash' },
  ],
  tags: [
    { id: 'home', name: 'Home', color: '#0078d4', path: os.homedir() },
    { id: 'work', name: 'Trabajo', color: '#d83b01', path: '/var/www' },
    { id: 'photos', name: 'Fotos', color: '#ffb900', path: path.join(os.homedir(), 'Imágenes') },
    { id: 'important', name: 'Importante', color: '#107c10', path: '/etc' },
  ],
  recent: [],
};

function getBookmarks() {
  try {
    if (fs.existsSync(BOOKMARKS_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf8'));
      return { ...DEFAULT_BOOKMARKS, ...data };
    }
  } catch (e) {
    console.error('Error leyendo marcadores:', e);
  }
  return DEFAULT_BOOKMARKS;
}

function saveBookmarks(data) {
  try {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando marcadores:', e);
  }
}

router.get('/disk', async (req, res) => {
  try {
    const usage = await getDiskUsage(config.rootDir);
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al obtener uso de disco' });
  }
});

router.get('/activity', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const logs = getActivityLog(limit);
  res.json({ logs });
});

router.get('/bookmarks', (req, res) => {
  res.json(getBookmarks());
});

router.post('/bookmarks', (req, res) => {
  const { pinned, tags, recent } = req.body || {};
  const current = getBookmarks();
  const updated = {
    pinned: pinned || current.pinned,
    tags: tags || current.tags,
    recent: recent || current.recent,
  };
  saveBookmarks(updated);
  res.json({ success: true, bookmarks: updated });
});

router.post('/recent', (req, res) => {
  const { item } = req.body || {};
  if (!item || !item.path) return res.status(400).json({ error: 'Item requerido' });

  const current = getBookmarks();
  let recent = current.recent.filter(r => r.path !== item.path);
  recent.unshift({
    ...item,
    accessedAt: new Date().toISOString(),
  });
  recent = recent.slice(0, 20); // Mantener 20 más recientes
  current.recent = recent;
  saveBookmarks(current);
  res.json({ success: true, recent });
});

export default router;
