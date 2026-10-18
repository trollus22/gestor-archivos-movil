import express from 'express';
import {
  verifyCredentials,
  createSession,
  destroySession,
  checkRateLimit,
  recordLoginFailure,
  resetLoginAttempts,
  requireAuth,
} from '../auth.js';
import { config } from '../config.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const rateLimitStatus = checkRateLimit(ip);

  if (!rateLimitStatus.allowed) {
    return res.status(429).json({
      error: rateLimitStatus.error || 'Demasiados intentos fallidos. Bloqueado temporalmente.',
      code: 'RATE_LIMITED',
    });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const isValid = verifyCredentials(username, password);

  if (!isValid) {
    recordLoginFailure(ip);
    return res.status(401).json({
      error: 'Credenciales inválidas. Compruebe el usuario y la contraseña.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  // Login exitoso
  resetLoginAttempts(ip);
  const session = createSession(username);

  // Cookie HttpOnly y SameSite=Strict
  res.cookie('sid', session.id, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });

  return res.json({
    success: true,
    user: session.user,
    csrfToken: session.csrfToken,
  });
});

router.post('/logout', (req, res) => {
  const sessionId = req.cookies?.sid;
  if (sessionId) {
    destroySession(sessionId);
  }
  res.clearCookie('sid');
  res.json({ success: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.session.user,
    csrfToken: req.session.csrfToken,
    enableTerminal: config.enableTerminal,
  });
});

export default router;
