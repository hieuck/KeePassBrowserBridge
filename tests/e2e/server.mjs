import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const extRoot = path.resolve(root, 'extension');
const port = Number(process.env.PORT || 3000);

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png']
]);

function resolveRequestPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0] || '/');
  let relativePath;
  // Vite modulepreload generates /dist/... paths; rewrite to extension/dist/...
  if (cleanPath === '/') {
    relativePath = 'tests/fixtures/login-page.html';
  } else if (cleanPath.startsWith('/dist/')) {
    const filePath = cleanPath.replace(/^\/+/, '');
    const resolved = path.resolve(extRoot, filePath);
    if (!resolved.startsWith(extRoot + path.sep) && resolved !== extRoot) return null;
    return fs.existsSync(resolved) ? resolved : null;
  } else {
    relativePath = cleanPath.replace(/^\/+/, '');
  }
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    return null;
  }
  return resolved;
}

const server = http.createServer((request, response) => {
  const filePath = resolveRequestPath(request.url || '/');
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream'
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`KeePassBrowserBridge test server listening on http://127.0.0.1:${port}`);
});
