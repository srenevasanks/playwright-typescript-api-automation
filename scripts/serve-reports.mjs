import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('reports', process.env.RUN_ID ?? 'regression');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
http
  .createServer(async (req, res) => {
    try {
      const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(root, `.${name.endsWith('/') ? name + 'index.html' : name}`);
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const data = await readFile(file);
      res
        .writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' })
        .end(data);
    } catch {
      res.writeHead(404).end('Not found');
    }
  })
  .listen(9323, '127.0.0.1', () =>
    console.log('Reports: http://127.0.0.1:9323/playwright/ and /allure/'),
  );
