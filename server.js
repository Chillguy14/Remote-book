const http = require('http');
const fs = require('fs');
const path = require('path');

let taskCode = `console.log('hook aktiv');`;
let reports = [];
let reportId = 0;

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (url === '/task.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    return res.end(taskCode);
  }

  if (url === '/set' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      taskCode = body;
      res.writeHead(200);
      res.end('ok');
    });
    return;
  }

  if (url === '/report' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        reports.push({ id: ++reportId, data, time: Date.now() });
        if (reports.length > 100) reports.shift();
        console.log('[rapport]', data);
      } catch(e){}
      res.writeHead(200);
      res.end('ok');
    });
    return;
  }

  if (url.startsWith('/reports')) {
    const since = parseInt(new URL('http://x' + req.url).searchParams.get('since') || '0');
    const out = reports.filter(r => r.id > since);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(out));
  }

  if (url === '/' || url === '/index.html') {
    try {
      const file = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(file);
    } catch(e){
      res.writeHead(500);
      return res.end('index.html saknas');
    }
  }

  res.writeHead(404);
  res.end('nope');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('server på port ' + PORT);
});
