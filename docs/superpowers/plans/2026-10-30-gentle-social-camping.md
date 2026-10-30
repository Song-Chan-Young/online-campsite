# Gentle Social Camping Implementation Plan

Goal: ship the experience defined in ../specs/2026-10-30-gentle-social-camping.md.
Architecture: share room logic between Node/ws and a Cloudflare Durable Object; browser helpers handle invitations and local-only experiences.
Tech stack: existing Node/Three/ws plus Cloudflare Worker platform APIs.

- [x] Test quiet-mode delivery, opt-in and rate-limited nearby gifts; implement shared room protocol and Node adapter while retaining reservation tests.
- [x] Test invitation parsing and chair selection; add visitor token, same-room invite sharing, connection/count UI, and privacy-aware status/gift controls.
- [x] Add private worry ritual and branded photo preview/share/download using existing scene/food/fire assets. Keep worry text entirely local and clear it on close/burn.
- [x] Add static asset builder, workers.dev config and hibernating Durable Object adapter; test restored connections and reservations; validate a dry-run build.
- [x] Run full tests and syntax checks, inspect responsive layout where tooling permits, obtain one fresh code review, fix important findings, commit and attempt push. Report exact deployment/authentication blockers.

Review focus: reconnect preference, same-room gift authorization and spam, inviter disconnects/full seats, untransmitted worry text, photo share cancellation, hibernation and disconnected reservations, mobile overlay overlap.

Execution record: extended the existing checkout used by the local server. Quiet mode and invite tokens are anonymous preferences, not access credentials. Cloudflare authentication could not refresh in this environment, so no production deployment is claimed. Local Worker preview could not bind a port (EPERM), and browser host was unavailable.

Verification: full Node tests, server/client syntax, live HTML ID uniqueness, cloud assets and Wrangler dry-run pass. Fresh review found a mode-toggle rate-limit acknowledgment bug; its regression failed first and passed after the server acknowledgment fix. Entry now establishes only one WebSocket after submission, with a regression test.

Final verification: 38 tests passed. A temporary marshmallow gesture leaves stored inventory unchanged; its regression failed before removing the unintended inventory increment and then passed. Actual cloud deployment failed before upload because the auth token could not refresh (auth server unreachable).
