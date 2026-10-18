import fs from 'fs';
import path from 'path';
import { config } from './config.js';

let activityCache = [];
let isLoaded = false;

function loadActivity() {
  if (isLoaded) return;
  try {
    if (fs.existsSync(config.activityLogFile)) {
      const data = fs.readFileSync(config.activityLogFile, 'utf8');
      activityCache = JSON.parse(data);
      if (!Array.isArray(activityCache)) activityCache = [];
    }
  } catch (err) {
    console.error('Error al cargar registro de actividad:', err);
    activityCache = [];
  }
  isLoaded = true;
}

function saveActivity() {
  try {
    const dir = path.dirname(config.activityLogFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(config.activityLogFile, JSON.stringify(activityCache.slice(0, 500), null, 2), 'utf8');
  } catch (err) {
    console.error('Error al guardar registro de actividad:', err);
  }
}

/**
 * Registra un evento de auditoría/mutación
 */
export function logActivity(operation, targetPath, details = {}, user = 'admin', success = true) {
  loadActivity();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    operation,
    targetPath,
    details,
    user,
    success,
  };

  activityCache.unshift(entry);
  if (activityCache.length > 500) {
    activityCache = activityCache.slice(0, 500);
  }

  saveActivity();
  return entry;
}

/**
 * Devuelve el registro de actividad reciente
 */
export function getActivityLog(limit = 100) {
  loadActivity();
  return activityCache.slice(0, limit);
}
