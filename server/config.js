import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'production',
  host: process.env.HOST || '127.0.0.1',
  port: parseInt(process.env.PORT || '3888', 10),
  rootDir: path.resolve(process.env.ROOT_DIR || '/'),
  trashDir: process.env.TRASH_DIR || path.join(os.homedir(), '.gestion-trash'),
  cacheDir: path.join(os.homedir(), '.gestion-cache'),
  activityLogFile: process.env.ACTIVITY_LOG_FILE || path.join(os.homedir(), '.gestion-activity.json'),
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || null,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || null,
  sessionSecret: process.env.SESSION_SECRET || null,
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  maxChunkSizeMb: parseInt(process.env.MAX_CHUNK_SIZE_MB || '25', 10),
  maxFileSizeGb: parseInt(process.env.MAX_FILE_SIZE_GB || '10', 10),
  rateLimit: {
    maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10) * 60 * 1000,
    lockoutMs: parseInt(process.env.RATE_LIMIT_LOCKOUT_MINUTES || '15', 10) * 60 * 1000,
  },
  enableTerminal: process.env.ENABLE_TERMINAL === 'true',
};

// Sin credenciales por defecto: este repositorio es público.
// Si faltan, el proceso NO arranca. Así nunca se publica una contraseña.
if (!config.sessionSecret) {
  throw new Error('SESSION_SECRET no definido. Copia .env.example a .env y genera uno.');
}
if (!config.adminPassword && !config.adminPasswordHash) {
  throw new Error('Define ADMIN_PASSWORD o ADMIN_PASSWORD_HASH en .env.');
}

// Generar hash bcrypt en el inicio si no se proveyó ADMIN_PASSWORD_HASH
if (!config.adminPasswordHash) {
  config.adminPasswordHash = bcrypt.hashSync(config.adminPassword, 10);
}

// Patrones de archivos y carpetas sensibles cuya descarga o manipulación directa queda bloqueada
export const SENSITIVE_PATTERNS = [
  /\/\.env(\..*)?$/i,
  /\/id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/i,
  /\/authorized_keys$/i,
  /\/known_hosts$/i,
  /\/\.ssh(\/.*)?$/i,
  /\/\.gnupg(\/.*)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\/shadow$/i,
  /\/gshadow$/i,
];

export function isSensitive(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  return SENSITIVE_PATTERNS.some(pat => pat.test(norm));
}
