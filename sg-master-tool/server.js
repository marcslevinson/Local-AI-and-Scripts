const express = require('express');
const multer = require('multer');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');

// Augment PATH so Node can find Homebrew/local binaries
const AUGMENTED_PATH = [
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
  process.env.PATH,
].join(':');

const SHELL_ENV = { ...process.env, PATH: AUGMENTED_PATH };
const HOME = os.homedir();

const app = express();
const PORT = 3000;

// Paths
const PYTHON_SORT_DIR = path.resolve(__dirname, '../python-sort');
const INBOX_DIR = path.join(PYTHON_SORT_DIR, '_inbox');

// Ensure _inbox exists
fs.mkdirSync(INBOX_DIR, { recursive: true });

// Static files
app.use(express.static(__dirname));
app.use(express.json());

// Multer for file uploads → _inbox
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, INBOX_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ─── AI endpoints ────────────────────────────────────────────────────────────

// Check if Ollama is running by hitting its local API
app.get('/api/ai/status', (req, res) => {
  let responded = false;
  const reply = (running) => { if (!responded) { responded = true; res.json({ running }); } };

  const options = { hostname: 'localhost', port: 11434, path: '/api/tags', method: 'GET' };
  const probe = http.request(options, (r) => reply(r.statusCode === 200));
  probe.on('error', () => reply(false));
  probe.setTimeout(1500, () => { probe.destroy(); reply(false); });
  probe.end();
});

// Start Ollama — detach it so it outlives the shell
app.post('/api/ai/start', (req, res) => {
  const log = fs.openSync('/tmp/ollama.log', 'a');
  const child = spawn('ollama', ['serve'], {
    env: SHELL_ENV,
    detached: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  res.json({ ok: true, message: 'Ollama starting…' });
});

// Stop Ollama
app.post('/api/ai/stop', (req, res) => {
  exec('pkill -x ollama', { env: SHELL_ENV }, () => {
    res.json({ ok: true, message: 'Ollama stopped' });
  });
});

// ─── Project folder ───────────────────────────────────────────────────────────
let currentProjectDir = __dirname;

app.get('/api/project/dir', (req, res) => {
  res.json({ dir: currentProjectDir });
});

// Set the project folder by path
app.post('/api/project/dir', (req, res) => {
  const { dir } = req.body;
  if (!dir) return res.json({ ok: false, error: 'No path provided' });
  const expanded = dir.replace(/^~/, HOME);
  if (!fs.existsSync(expanded)) return res.json({ ok: false, error: `Path not found: ${expanded}` });
  currentProjectDir = expanded;
  res.json({ ok: true, dir: currentProjectDir });
});

// Launch an AI tool in a new Terminal window via osascript


const AI_TOOL_CMDS = {
  'ai-code32': (dir) => `cd "${dir}" && aider --model ollama/qwen2.5-coder:32b --no-auto-commits`,
  'ai-code14': (dir) => `cd "${dir}" && aider --model ollama/qwen2.5-coder:14b --no-auto-commits`,
  'ai-deep':   (dir) => `cd "${dir}" && aider --model ollama/deepseek-coder:33b --no-auto-commits`,
  'opencode':  (dir) => `cd "${dir}" && ${HOME}/.opencode/bin/opencode`,
};

app.post('/api/ai/launch/:tool', (req, res) => {
  const builder = AI_TOOL_CMDS[req.params.tool];
  if (!builder) return res.status(400).json({ error: 'Unknown tool' });
  const cmd = builder(currentProjectDir);

  // Escape backslashes and double-quotes for AppleScript string embedding
  const appleCmd = cmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const script = `tell application "Terminal" to do script "${appleCmd}"`;

  const proc = spawn('osascript', ['-e', script], { env: SHELL_ENV });
  let errOut = '';
  proc.stderr.on('data', d => errOut += d.toString());
  proc.on('close', (code) => {
    res.json({ ok: code === 0, message: code === 0 ? `Launched ${req.params.tool}` : errOut.trim() });
  });
});

// ─── Sort endpoints ───────────────────────────────────────────────────────────

// List files currently in _inbox
app.get('/api/sort/inbox', (req, res) => {
  const files = fs.readdirSync(INBOX_DIR)
    .filter(f => !f.startsWith('.'))
    .map(f => {
      const stat = fs.statSync(path.join(INBOX_DIR, f));
      return { name: f, size: stat.size };
    });
  res.json({ files });
});

// Upload files to _inbox
app.post('/api/sort/upload', upload.array('files'), (req, res) => {
  res.json({ uploaded: req.files.map(f => f.originalname) });
});

// Clear _inbox
app.delete('/api/sort/inbox', (req, res) => {
  fs.readdirSync(INBOX_DIR)
    .filter(f => !f.startsWith('.'))
    .forEach(f => fs.unlinkSync(path.join(INBOX_DIR, f)));
  res.json({ ok: true });
});

// Run a sort script — streams output via SSE
const SORT_SCRIPTS = {
  vision:     'sort_by_vision.py',
  ocr:        'sort_by_ocr.py',
  'ocr-vision': 'sort_by_ocr_vision.py',
  burst:      'sort_by_burst.py',
};

app.get('/api/sort/run/:script', (req, res) => {
  const scriptFile = SORT_SCRIPTS[req.params.script];
  if (!scriptFile) return res.status(400).json({ error: 'Unknown script' });

  const scriptPath = path.join(PYTHON_SORT_DIR, scriptFile);
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ error: `Script not found: ${scriptPath}` });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, data })}\n\n`);

  send('info', `Running ${scriptFile}…\n`);

  const proc = spawn('python3', [scriptPath], { cwd: PYTHON_SORT_DIR, env: SHELL_ENV });

  proc.stdout.on('data', (d) => send('stdout', d.toString()));
  proc.stderr.on('data', (d) => send('stderr', d.toString()));
  proc.on('close', (code) => {
    send('done', `\nProcess exited with code ${code}`);
    res.end();
  });

  req.on('close', () => proc.kill());
});

// ─── AI log tail (SSE) ───────────────────────────────────────────────────────
// Tails /tmp/ollama.log and streams new lines to the client.
app.get('/api/ai/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const logFile = '/tmp/ollama.log';

  // Ensure the log file exists so tail doesn't error
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '');

  // Stream last 40 lines immediately, then follow
  const tail = spawn('tail', ['-n', '40', '-F', logFile]);

  tail.stdout.on('data', (d) => {
    res.write(`data: ${JSON.stringify(d.toString())}\n\n`);
  });
  tail.stderr.on('data', (d) => {
    res.write(`data: ${JSON.stringify('[stderr] ' + d.toString())}\n\n`);
  });

  req.on('close', () => tail.kill());
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Master Tool running at http://localhost:${PORT}`);
});
