import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
const port = Number(process.env.PORT || process.argv[3] || 4173);
const host = process.env.HOST || '0.0.0.0';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

function resolveRequestPath(requestUrl = '/') {
  const pathname = requestUrl.split('?')[0];
  const decodedPathname = decodeURIComponent(pathname);
  const normalizedPathname = normalize(decodedPathname).replace(/^([/\\])+/, '');
  const filePath = resolve(join(root, normalizedPathname));

  if (filePath !== root && !filePath.startsWith(root + sep)) {
    return null;
  }

  return filePath;
}

createServer((request, response) => {
  let filePath = resolveRequestPath(request.url);

  if (!filePath) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`serving ${root} at http://${host}:${port}`);
});
