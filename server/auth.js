import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

// Almacén en memoria de sesiones y control de tasa (rate limiting)
const sessions = new Map();
const loginAttempts = new Map();

/**
 * Genera un token aleatorio seguro
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Limpia intentos de login expirados
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.lockedUntil && now > data.lockedUntil) {
      loginAttempts.delete(ip);
    } else if (!data.lockedUntil && now - data.firstAttempt > config.rateLimit.windowMs) {
      loginAttempts.delete(ip);
    }
  }
}

/**
 * Verifica si una IP está bloqueada por demasiados intentos
 */
export function checkRateLimit(ip) {
  cleanupRateLimits();
  const data = loginAttempts.get(ip);
  if (!data) return { allowed: true, remaining: config.rateLimit.maxAttempts };

  const now = Date.now();
  if (data.lockedUntil && now < data.lockedUntil) {
    const minutesLeft = Math.ceil((data.lockedUntil - now) / 60000);
    return {
      allowed: false,
      locked: true,
      minutesLeft,
      error: `Demasiados intentos fallidos. Acceso bloqueado durante ${minutesLeft} minuto(s).`,
    };
  }

  if (now - data.firstAttempt > config.rateLimit.windowMs) {
    loginAttempts.delete(ip);
    return { allowed: true, remaining: config.rateLimit.maxAttempts };
  }

  const remaining = Math.max(0, config.rateLimit.maxAttempts - data.count);
  return { allowed: remaining > 0, remaining };
}

/**
 * Registra un fallo de login para una IP
 */
export function recordLoginFailure(ip) {
  const now = Date.now();
  let data = loginAttempts.get(ip);
  if (!data) {
    data = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    data.count += 1;
  }

  if (data.count >= config.rateLimit.maxAttempts) {
    data.lockedUntil = now + config.rateLimit.lockoutMs;
  }

  loginAttempts.set(ip, data);
}

/**
 * Resetea el historial de intentos tras un login exitoso
 */
export function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

/**
 * Crea una sesión para el usuario autenticado
 */
export function createSession(user) {
  const sessionId = generateToken(32);
  const csrfToken = generateToken(32);
  const session = {
    id: sessionId,
    user,
    csrfToken,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

/**
 * Obtiene una sesión válida
 */
export function getSession(sessionId) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.lastActive = Date.now();
  return session;
}

/**
 * Elimina una sesión activa
 */
export function destroySession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

/**
 * Valida credenciales contra la configuración
 */
export function verifyCredentials(user, password) {
  if (!user || !password) return false;
  if (user !== config.adminUser) return false;
  return bcrypt.compareSync(password, config.adminPasswordHash);
}

/**
 * Middleware para requerir autenticación en todas las rutas protegidas
 */
export function requireAuth(req, res, next) {
  const sessionId = req.cookies?.sid;
  const session = getSession(sessionId);

  if (!session) {
    return res.status(401).json({
      error: 'Sesión no válida o expirada. Por favor inicie sesión.',
      code: 'UNAUTHORIZED',
    });
  }

  req.session = session;
  next();
}

/**
 * Middleware para validar token CSRF en mutaciones (POST, PUT, DELETE, PATCH)
 */
export function requireCsrf(req, res, next) {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const clientCsrf = req.headers['x-csrf-token'];
  if (!clientCsrf || !req.session || clientCsrf !== req.session.csrfToken) {
    return res.status(403).json({
      error: 'Fallo de validación CSRF. Petición no autorizada.',
      code: 'CSRF_INVALID',
    });
  }

  next();
}
