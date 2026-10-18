import express from 'express';
import { execFile } from 'child_process';
import { config } from '../config.js';
import { logActivity } from '../activity.js';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ enabled: config.enableTerminal });
});

router.post('/toggle', (req, res) => {
  const { enabled } = req.body || {};
  config.enableTerminal = Boolean(enabled);
  logActivity('toggle_terminal', 'system', { enabled: config.enableTerminal }, req.session?.user || 'admin', true);
  res.json({ enabled: config.enableTerminal });
});

router.post('/exec', (req, res) => {
  if (!config.enableTerminal) {
    return res.status(403).json({
      error: 'La consola de terminal está DESACTIVADA por defecto por razones de seguridad. Puede activarla en la Configuración.',
      code: 'TERMINAL_DISABLED',
    });
  }

  const { command, args, cwd } = req.body || {};
  if (!command) {
    return res.status(400).json({ error: 'Comando requerido' });
  }

  // Ejecución segura con execFile (nunca concatenando shell string)
  const cmdArgs = Array.isArray(args) ? args : [];
  const execCwd = cwd || config.rootDir;

  execFile(command, cmdArgs, { cwd: execCwd, timeout: 15000 }, (error, stdout, stderr) => {
    logActivity('terminal_exec', command, { args: cmdArgs, exitCode: error?.code || 0 }, req.session?.user || 'admin', !error);
    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: error ? (error.code || 1) : 0,
      error: error ? error.message : null,
    });
  });
});

export default router;
