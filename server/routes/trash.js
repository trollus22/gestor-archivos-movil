import express from 'express';
import { listTrash, restoreFromTrash, emptyTrash, deletePermanently } from '../trash.js';
import { resolveSafePath } from '../fs-service.js';

const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const items = await listTrash();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al listar papelera' });
  }
});

router.post('/restore', async (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'ID de elemento requerido' });

  try {
    const result = await restoreFromTrash(id, req.session?.user || 'admin');
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Error al restaurar' });
  }
});

router.post('/empty', async (req, res) => {
  try {
    const result = await emptyTrash(req.session?.user || 'admin');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al vaciar papelera' });
  }
});

router.post('/permanent', async (req, res) => {
  const { path: targetPath } = req.body || {};
  if (!targetPath) return res.status(400).json({ error: 'Ruta requerida' });

  try {
    const resolved = resolveSafePath(targetPath, true);
    const result = await deletePermanently(resolved.safePath, req.session?.user || 'admin');
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Error al eliminar definitivamente' });
  }
});

export default router;
