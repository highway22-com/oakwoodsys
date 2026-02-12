/**
 * Arranca el servidor HTTP en Node para Angular SSR (Docker / Azure / local).
 * Sirve estáticos desde ./browser (public + build) y el resto con reqHandler.
 */
import '@angular/compiler';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createWebRequestFromNodeRequest, writeResponseToNodeResponse } from '@angular/ssr/node';
import { reqHandler } from './dist/oaw/server/server.mjs';

const port = parseInt(process.env.PORT || '4000', 10);
const host = process.env.HOST || '0.0.0.0';
const BROWSER_DIR = path.join(process.cwd(), 'dist/oaw/browser');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain',
};

function serveStatic(req, res) {
  const urlPath = req.url?.split('?')[0] || '/';
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(BROWSER_DIR, safePath === '/' ? 'index.html' : safePath);
  if (!filePath.startsWith(BROWSER_DIR)) return false;
  try {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      const ext = path.extname(filePath);
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
      return true;
    }
    if (stat.isDirectory() && urlPath.endsWith('/')) {
      const index = path.join(filePath, 'index.html');
      if (fs.existsSync(index)) {
        res.setHeader('Content-Type', 'text/html');
        fs.createReadStream(index).pipe(res);
        return true;
      }
    }
  } catch (_) {}
  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    if (serveStatic(req, res)) return;
    const webReq = createWebRequestFromNodeRequest(req);
    const response = await reqHandler(webReq);
    if (response) {
      await writeResponseToNodeResponse(response, res);
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  } catch (e) {
    console.error('[server-runner]', e);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
