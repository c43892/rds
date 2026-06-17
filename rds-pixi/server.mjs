// Minimal static file server for the public/ directory.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'public');
const PORT = process.env.PORT ? Number(process.env.PORT) : 5188;

const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.fnt': 'text/plain',
    '.css': 'text/css', '.map': 'application/json',
};

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found: ' + urlPath); return; }
        const ext = path.extname(filePath).toLowerCase();
        // Code/config change on every build; `no-cache` only forces revalidation, and with
        // no ETag/Last-Modified some browsers still serve the stale copy from memory cache
        // (users kept seeing an old egret-shim.js after rebuilds). `no-store` guarantees a
        // fresh fetch for the hot files; bulky immutable assets keep the lighter policy.
        const hot = ext === '.js' || ext === '.mjs' || ext === '.json' || ext === '.html' || ext === '.map';
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': hot ? 'no-store, must-revalidate' : 'no-cache',
        });
        res.end(data);
    });
});

server.listen(PORT, () => console.log('rds-pixi server on http://localhost:' + PORT));
