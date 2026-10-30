# 숲속 캠핑장

모닥불 앞에 말없이 앉아 쉬는 온라인 캠핑장. 브라우저 3D(Three.js) + Node 서버(WebSocket).

## 실행

```bash
npm install          # three · ws
node server.mjs      # http://localhost:3000/
```

Windows 에서는 `serve.cmd` 를 실행해도 됨 (`.tools\node` 가 있으면 그 Node 를 씀).

| 환경변수 | 기본 | 뜻 |
|---|---|---|
| `PORT` | `3000` | 포트 |
| `HOST` | `127.0.0.1` | 같은 망·공유기 포트포워딩으로 열려면 `0.0.0.0` |

임시 인터넷 주소가 필요하면 Cloudflare 임시 터널: `cloudflared tunnel --url http://127.0.0.1:3000` (`tunnel.cmd`).

## 구성

| 파일 | 내용 |
|---|---|
| `server.mjs` | 정적 파일(`public/`) · `/vendor/three/`(node_modules) · `/chat` WebSocket(채팅 · 서버2·3 방 · 다른 사람 자리 · 인사) |
| `public/index.html` | 화면 전부 — 캠핑장 지도 · 아바타 · 계절 · 매점 · 소리(Web Audio 합성, 음원 파일 없음) |

## 서버(방)

| 서버 | 자리 | 같이 |
|---|---|---|
| 서버1 · 내 공간 | A구역 데크1 | 혼자 (접속 안 함) |
| 서버2 · 차박 | 캠핑카 옆 | 같은 방 사람끼리 보이고 대화 |
| 서버3 · 데크 | B구역 데크3 | 같은 방 사람끼리 보이고 대화 |
