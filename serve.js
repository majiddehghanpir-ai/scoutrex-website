const http = require('http');
const fs   = require('fs');
const path = require('path');

const base = __dirname; // scoutrex-deploy/

const mime = {
  '.html': 'text/html',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.svg' : 'image/svg+xml',
  '.mp4' : 'video/mp4',
  '.webm': 'video/webm',
  '.ico' : 'image/x-icon',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0]; // strip query strings
  const file = path.join(base, urlPath === '/' ? '/index.html' : urlPath);

  console.log(`[${req.method}] ${urlPath} -> ${file} | Range: ${req.headers['range'] || 'none'}`);

  // Security: stay within scoutrex-deploy
  if (!file.startsWith(base)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(file, (err, stat) => {
    if (err) {
      console.log(`  -> 404: ${err.message}`);
      res.writeHead(404); res.end('Not found: ' + urlPath); return;
    }

    const ext         = path.extname(file).toLowerCase();
    const contentType = mime[ext] || 'application/octet-stream';
    const fileSize    = stat.size;
    const rangeHeader = req.headers['range'];

    if (rangeHeader) {
      const parts     = rangeHeader.replace(/bytes=/, '').split('-');
      const start     = parseInt(parts[0], 10);
      const end       = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      console.log(`  -> 206 range ${start}-${end}/${fileSize}`);
      res.writeHead(206, {
        'Content-Range' : `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges' : 'bytes',
        'Content-Length': chunkSize,
        'Content-Type'  : contentType,
      });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      console.log(`  -> 200 full ${fileSize} bytes`);
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type'  : contentType,
        'Accept-Ranges' : 'bytes',
      });
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(8765, () => console.log('Serving on http://localhost:8765'));
