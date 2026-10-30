// 방구석 캠핑장 서버 — Node 기본 모듈만 씀 (추가 패키지 없음)
//   public/          → 화면 (index.html 등)
//   /vendor/three/   → node_modules/three (CDN 대신 이 서버가 직접 줌)
// 실행: node server.mjs   (PORT·HOST 환경변수로 바꿈. 기본 127.0.0.1:3000 — 같은 망에서 열려면 HOST=0.0.0.0)
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile, rename } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { CampHub } from './lib/camp-hub.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
// (원본, 2026-10-30 송찬영 [AI]) const PORT = Number(process.env.PORT) || 8080;   — 이 PC 에서 8080 은 EACCES (예약 범위엔 없음, 원인 미확인)
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const MOUNTS = [
  ['/vendor/three/', resolve(ROOT, 'node_modules/three')],
  ['/', resolve(ROOT, 'public')],
];
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2',
};

// 요청 경로 → 실제 파일. 마운트 폴더 밖(../)으로 나가면 null
function toFile(urlPath) {
  for (const [prefix, dir] of MOUNTS) {
    if (!urlPath.startsWith(prefix)) continue;
    let rel = urlPath.slice(prefix.length);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = resolve(dir, rel);
    return file === dir || file.startsWith(dir + sep) ? file : null;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const log = code => console.log(`${new Date().toISOString()} ${code} ${req.method} ${req.url}`);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return log(405); }

  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { res.writeHead(400).end(); return log(400); }

  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }));
    return;
  }

  if (urlPath === '/stats') {
    res.writeHead(200, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}).end(JSON.stringify(hub.getMetrics()));
    return;
  }
  const file = toFile(urlPath);
  if (!file) { res.writeHead(403).end(); return log(403); }
  try {
    const st = await stat(file);
    if (!st.isFile()) throw new Error('not a file');
    const body = await readFile(file);
    const ext = extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
    log(200);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('없는 주소입니다');
    log(404);
  }
});

// ---------- 채팅 — 같은 서버 접속자끼리 (ws://<서버>/chat) ----------
// 이름은 서버가 정해 줌(남 이름 사칭 못 하게). 대화는 저장하지 않음 — 접속한 뒤 오간 것만 보임
const hub = new CampHub();
const metricsFile = join(ROOT, '.data', 'camp-metrics.json');
try {hub.loadMetrics(JSON.parse(await readFile(metricsFile, 'utf8')));} catch { /* first start has no counts */ }
let metricsWrites = Promise.resolve();
function saveMetrics() {
  const json = JSON.stringify(hub.getMetrics());
  metricsWrites = metricsWrites.then(async () => {
    await mkdir(join(ROOT, '.data'), {recursive: true});
    await writeFile(metricsFile + '.tmp', json); await rename(metricsFile + '.tmp', metricsFile);
  }).catch(() => console.error('Aggregate metrics could not be saved.'));
}
const wss = new WebSocketServer({ server, path: '/chat', maxPayload: 4 * 1024 });
wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  ws.isAlive = true;
  hub.join(ws, {room: params.get('server'), visitor: params.get('visitor'), near: params.get('near'), quiet: params.get('quiet') !== '0'});
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data, binary) => {
    const before = hub.metricsRevision;
    hub.message(ws, binary ? '' : data.toString(), binary);
    if (hub.metricsRevision !== before) saveMetrics();
  });
  ws.on('close', () => hub.leave(ws));
});
// 끊긴 연결 정리 — 30초마다 ping, 응답 없으면 닫음
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000).unref();

server.listen(PORT, HOST, () => {
  console.log(`방구석 캠핑장 서버 — http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
});
