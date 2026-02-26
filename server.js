const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'patients.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

function loadPatients() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function savePatients(patients) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(patients, null, 2));
}

function validatePatient(payload) {
  const required = ['name', 'cancer_type', 'stage', 'last_checkup', 'treatment_plan'];
  for (const field of required) {
    if (!payload[field] || String(payload[field]).trim() === '') {
      return `Missing field: ${field}`;
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.last_checkup)) {
    return 'Invalid date format: last_checkup';
  }
  return null;
}

function addPatient(payload) {
  const err = validatePatient(payload);
  if (err) throw new Error(err);

  const patients = loadPatients();
  const id = patients.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
  const patient = {
    id,
    name: String(payload.name).trim(),
    cancer_type: String(payload.cancer_type).trim(),
    stage: String(payload.stage).trim(),
    last_checkup: String(payload.last_checkup).trim(),
    treatment_plan: String(payload.treatment_plan).trim(),
    created_at: new Date().toISOString().slice(0, 10),
  };
  patients.push(patient);
  savePatients(patients);
  return patient;
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath, contentType = 'text/plain; charset=utf-8') {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(fs.readFileSync(filePath));
}

function createServer() {
  return http.createServer((req, res) => {
    const { method, url } = req;

    if (method === 'GET' && url === '/') {
      return sendFile(res, path.join(__dirname, 'templates', 'index.html'), 'text/html; charset=utf-8');
    }
    if (method === 'GET' && url === '/static/style.css') {
      return sendFile(res, path.join(__dirname, 'static', 'style.css'), 'text/css; charset=utf-8');
    }
    if (method === 'GET' && url === '/static/app.js') {
      return sendFile(res, path.join(__dirname, 'static', 'app.js'), 'application/javascript; charset=utf-8');
    }
    if (method === 'GET' && url === '/api/patients') {
      return sendJson(res, 200, loadPatients());
    }

    if (method === 'POST' && url === '/api/patients') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const patient = addPatient(payload);
          sendJson(res, 201, patient);
        } catch (err) {
          sendJson(res, 400, { error: err.message || 'Invalid request' });
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });
}

if (require.main === module) {
  ensureDataFile();
  createServer().listen(PORT, () => {
    console.log(`OncoApp running at http://localhost:${PORT}`);
  });
}

module.exports = { createServer, validatePatient, addPatient, loadPatients, savePatients, DATA_FILE };
