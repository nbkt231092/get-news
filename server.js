import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './pipeline/build.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(__dirname, 'site');
const DATA_DIR = path.join(SITE_DIR, 'data');
const SOURCES_FILE = path.join(__dirname, 'pipeline', 'sources.json');
const PORT = Number(process.env.PORT) || 8001;
const HOST = process.env.HOST || '127.0.0.1';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
};

let activeBuild = null;

async function runBuild() {
    if (!activeBuild) {
        activeBuild = (async () => {
            const sources = JSON.parse(await readFile(SOURCES_FILE, 'utf8'));
            const { feeds } = await build({ sources, outDir: DATA_DIR });
            const okCount = feeds.filter(f => f.ok).length;
            return {
                ok: true,
                okCount,
                totalCount: feeds.length,
                generatedAt: new Date().toISOString(),
            };
        })().finally(() => {
            activeBuild = null;
        });
    }
    return activeBuild;
}

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

        if (url.pathname === '/api/build' && (req.method === 'POST' || req.method === 'GET')) {
            try {
                const result = await runBuild();
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
                res.end(JSON.stringify(result));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
            return;
        }

        let reqPath = decodeURIComponent(url.pathname);
        if (reqPath === '/') reqPath = '/index.html';
        const filePath = path.resolve(SITE_DIR, '.' + reqPath);

        if (!filePath.startsWith(SITE_DIR)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        const fileStat = await stat(filePath).catch(() => null);
        if (!fileStat || !fileStat.isFile()) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const content = await readFile(filePath);
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        res.end(content);
    } catch (err) {
        res.writeHead(500);
        res.end(err.message);
    }
});

server.listen(PORT, HOST, () => {
    console.log(`OnlyNews server listening at http://${HOST}:${PORT}`);
});
