import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { requireAuth, requireCsrf } from './auth.js';

import authRouter from './routes/auth.js';
import filesRouter from './routes/files.js';
import uploadRouter from './routes/upload.js';
import downloadRouter from './routes/download.js';
import archiveRouter from './routes/archive.js';
import trashRouter from './routes/trash.js';
import searchRouter from './routes/search.js';
import thumbnailsRouter from './routes/thumbnails.js';
import systemRouter from './routes/system.js';
import terminalRouter from './routes/terminal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

// Detrás de nginx (que añade X-Forwarded-For), sin esto req.ip es SIEMPRE 127.0.0.1
// y el límite de intentos de login se vuelve GLOBAL: cualquiera bloquea a todos.
// 'loopback' = solo nos fiamos de la cabecera si la petición viene de localhost.
app.set('trust proxy', 'loopback');

// Cabeceras de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self' data:; frame-src 'self';"
  );
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(config.sessionSecret));

// Rutas de autenticación (login no requiere requireAuth)
app.use('/api/auth', authRouter);

// Middleware global de autenticación y CSRF para el resto de la API
app.use('/api', requireAuth);
app.use('/api', requireCsrf);

// Rutas de la API protegidas
app.use('/api/files', filesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/download', downloadRouter);
app.use('/api/archive', archiveRouter);
app.use('/api/trash', trashRouter);
app.use('/api/search', searchRouter);
app.use('/api/thumbnail', thumbnailsRouter);
app.use('/api/system', systemRouter);
app.use('/api/terminal', terminalRouter);

// Servir frontend compilado desde dist
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Frontend en compilación. Ejecute npm run build.');
  });
}

// Iniciar servidor SOLO en 127.0.0.1
const server = app.listen(config.port, config.host, () => {
  console.log(`=======================================================`);
  console.log(` Gestor de Archivos Web iniciado exitosamente`);
  console.log(` Escuchando EXCLUSIVAMENTE en: http://${config.host}:${config.port}`);
  console.log(` Raíz configurada: ${config.rootDir}`);
  console.log(` Entorno: ${config.env}`);
  console.log(` Usuario admin: ${config.adminUser}`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  console.error('Error al iniciar el servidor:', err);
});
