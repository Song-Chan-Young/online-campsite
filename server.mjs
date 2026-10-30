// 숲속 캠핑장 서버 — Node 기본 모듈만 씀 (추가 패키지 없음)
//   public/          → 화면 (index.html 등)
//   /vendor/three/   → node_modules/three (CDN 대신 이 서버가 직접 줌)
// 실행: node server.mjs   (PORT·HOST 환경변수로 바꿈. 기본 127.0.0.1:3000 — 같은 망에서 열려면 HOST=0.0.0.0)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

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
const ADJ = ['고요한', '따뜻한', '푸른', '조용한', '느긋한', '포근한', '반짝이는', '향긋한', '졸린', '단단한'];
const NOUN = ['솔방울', '모닥불', '다람쥐', '반딧불', '도토리', '부엉이', '오솔길', '텐트', '이슬', '장작'];
const CHAT_MAX_LEN = 200;      // 글자 수
const CHAT_PER_SEC = 5;        // 1초에 보낼 수 있는 수 — 넘으면 조용히 버림
const pick = a => a[Math.floor(Math.random() * a.length)];
const names = new Set();
function makeName() {
  for (let i = 0; i < 50; i++) { const n = `${pick(ADJ)} ${pick(NOUN)}`; if (!names.has(n)) return n; }
  return `캠퍼 ${1000 + Math.floor(Math.random() * 9000)}`;
}

const wss = new WebSocketServer({ server, path: '/chat', maxPayload: 4 * 1024 });
function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const c of wss.clients) if (c.readyState === c.OPEN) c.send(s);
}
// 서버(방) — 서버1·2·3 모두 같은 방 사람끼리 보이고 대화함
const ROOMS = new Set(['1', '2', '3']);
function broadcastRoom(room, obj, except = null) {
  const s = JSON.stringify(obj);
  for (const c of wss.clients) if (c !== except && c.room === room && c.readyState === c.OPEN) c.send(s);
}
const POSES = new Set(['sit', 'stand', 'walk', 'lie']), LIE_SPOTS = new Set(['mat', 'hammock']);
const STATE_PER_SEC = 20;      // 자리 알림 — 넘으면 조용히 버림
let nextId = 1;
const NAME_MAX = 12;           // 닉네임 글자 수
// (원본, 2026-10-30 송찬영 [AI]) wss.on('connection', ws => {
wss.on('connection', (ws, req) => {
  // (원본, 2026-10-30 송찬영 [AI]) const name = makeName();   — 닉네임을 바꿀 수 있게 let
  let name = makeName();
  names.add(name);
  ws.isAlive = true;
  let sent = [];
  let stateAt = [];
  const q = new URL(req.url, 'http://x').searchParams.get('server');
  ws.room = ROOMS.has(q) ? q : '2';
  ws.id = nextId++;
  ws.cname = name;
  ws.state = null;
  // (원본, 2026-10-30 송찬영 [AI]) ws.send(JSON.stringify({ type: 'welcome', name }));
  const peers = [...wss.clients].filter(c => c !== ws && c.room === ws.room && c.readyState === c.OPEN)
    .map(c => ({ id: c.id, name: c.cname, ...(c.state || {}) }));
  ws.send(JSON.stringify({ type: 'welcome', name, id: ws.id, room: ws.room, peers }));
  broadcastRoom(ws.room, { type: 'join', id: ws.id, name }, ws);
  console.log(`${new Date().toISOString()} chat join 서버${ws.room} (${wss.clients.size}명)`);

  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }
    // 닉네임 바꾸기 — 겹치면 뒤에 번호
    if (msg?.type === 'name' && typeof msg.name === 'string') {
      const want = msg.name.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
      if (!want || want === name) return;
      let next = want;
      for (let i = 2; names.has(next); i++) next = `${want.slice(0, NAME_MAX - 3)} ${i}`;
      names.delete(name); name = next; names.add(name);
      ws.cname = name;
      ws.send(JSON.stringify({ type: 'renamed', name }));
      broadcastRoom(ws.room, { type: 'name', id: ws.id, name }, ws);   // 같은 방 사람 이름표도 바뀜
      return;
    }
    // 내 자리·자세 — 같은 방 사람에게 전달
    if (msg?.type === 'state') {
      const now = Date.now();
      stateAt = stateAt.filter(at => now - at < 1000);
      if (stateAt.length >= STATE_PER_SEC) return;
      stateAt.push(now);
      const num = v => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1000 ? Math.round(v * 100) / 100 : null);
      const x = num(msg.x), z = num(msg.z), yaw = num(msg.yaw);
      if (x === null || z === null || yaw === null || !POSES.has(msg.pose)) return;
      ws.state = { x, z, yaw, pose: msg.pose, lieSpot: LIE_SPOTS.has(msg.lieSpot) ? msg.lieSpot : 'mat' };
      broadcastRoom(ws.room, { type: 'state', id: ws.id, name, ...ws.state }, ws);
      return;
    }
    // 인사 — 같은 방에 알림 (받는 사람은 to 로 구분, 답례는 reply)
    if (msg?.type === 'act') {
      if (msg.act !== 'hello') return;
      const now = Date.now();
      sent = sent.filter(at => now - at < 1000);
      if (sent.length >= CHAT_PER_SEC) return;
      sent.push(now);
      broadcastRoom(ws.room, { type: 'act', act: 'hello', id: ws.id, to: Number.isInteger(msg.to) ? msg.to : null, reply: msg.reply === true }, ws);
      return;
    }
    if (msg?.type !== 'chat' || typeof msg.text !== 'string') return;
    const text = msg.text.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, CHAT_MAX_LEN);
    if (!text) return;
    const now = Date.now();
    sent = sent.filter(at => now - at < 1000);
    if (sent.length >= CHAT_PER_SEC) return;
    sent.push(now);
    // (원본, 2026-10-30 송찬영 [AI]) broadcast({ type: 'chat', name, text, at: now });
    broadcastRoom(ws.room, { type: 'chat', name, text, at: now });   // 같은 방(서버)끼리만
  });
  ws.on('close', () => {
    broadcastRoom(ws.room, { type: 'leave', id: ws.id }, ws);
    names.delete(name);
    console.log(`${new Date().toISOString()} chat leave (${wss.clients.size}명)`);
  });
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
  console.log(`숲속 캠핑장 서버 — http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
});
