# AGENTS.md — 집 PC 서버 세팅 안내 (Codex · Claude Code 공용)

이 PC(집 Windows)를 "숲속 캠핑장" 서버로 만든다. 공유기 포트포워딩으로 바깥에서 접속하게 한다.

- 저장소: https://github.com/Song-Chan-Young/online-campsite (공개, `main`)
- 구성: Node 서버(`server.mjs`) + 정적 화면(`public/index.html`), WebSocket `/chat`
- 실행: `npm install` → `node server.mjs`. 환경변수 `PORT`(기본 3000), `HOST`(기본 127.0.0.1)
- 자세한 건 `README.md`

## 순서 — 단계마다 확인 결과를 보여주고 다음으로

1. (이미 clone 했으면 건너뜀) 적당한 폴더에 `git clone`
2. `node -v` 확인 (20 이상). 없으면 **설치 방법만 알려주고 멈춤**
3. `npm install` → `npm audit` 결과 보여줌
4. `HOST=0.0.0.0` 으로 서버 실행 → `http://localhost:3000/health` 가 `{"ok":true}` 인지 확인
5. 이 PC 내부 IP(192.168.x.x) 알려주고, 같은 와이파이 휴대폰으로 `http://<IP>:3000/` 열어 보라고 안내
6. 로그온하면 서버가 자동으로 뜨게 **작업 스케줄러** 등록 — 명령을 먼저 보여주고 사용자가 OK 하면 실행
7. Windows 방화벽 인바운드 **TCP 3000만** 허용 — 관리자 권한이 필요하면 명령만 알려줌
8. 공유기 설정은 **사용자가 직접** 함 — 단계별 안내만:
   - 이 PC 내부 IP 고정 (DHCP 고정할당)
   - 포트포워딩: 바깥 포트 → 이 PC 3000
   - DDNS 켜기 (ipTIME 이면 `○○.iptime.org`)
9. 사용자가 휴대폰 LTE 로 `http://<DDNS>:<포트>/` 접속해서 되는지 같이 확인

## 지킬 것

- 공유기 관리자 비밀번호 등 **비밀번호는 묻지도 다루지도 않음** — 입력은 사용자가 함
- 3000(또는 정한 포트) 말고 다른 포트는 열지 않음. **원격데스크톱(3389)은 절대 포트포워딩 안 함**
- 저장소 코드는 고치지 않음 — 고칠 게 보이면 먼저 물어봄
- 확인 못 한 건 "됐다"고 하지 않고 "미확인"이라고 함
