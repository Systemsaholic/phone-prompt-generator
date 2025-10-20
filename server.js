const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { existsSync } = require('fs');
const { join } = require('path');
const { validateAndLog } = require('./lib/env-validation.js');

// Validate environment variables before starting
console.log('🔍 Validating environment configuration...');
validateAndLog();

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle audio files explicitly
      if (pathname.startsWith('/audio/')) {
        const filePath = join(__dirname, 'public', pathname);
        if (existsSync(filePath)) {
          const fs = require('fs');
          const stat = fs.statSync(filePath);
          res.writeHead(200, {
            'Content-Type': 'audio/wav',
            'Content-Length': stat.size,
            'Cache-Control': 'public, max-age=31536000'
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});