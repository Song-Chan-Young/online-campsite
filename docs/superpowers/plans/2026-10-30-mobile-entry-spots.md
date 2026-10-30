# Mobile controls, one-step entry, and occupied spots

Goal: Match Sansa's tap-to-walk, swipe-to-look and pinch-to-zoom interaction; enter a selected room in one submission; use a free seat when a resting spot is taken.

Keep the existing Three.js / OrbitControls and WebSocket architecture. No new dependencies. Work in the existing checkout used by the local server.

- [x] Add gesture tests for touch jitter, dragging back to origin, pinch gestures, cancellation, and mouse clicks. Replace single downAt tracking with a tested gesture tracker and show touch instructions.
- [x] Add an entry flow test. Carry a one-use entry marker across room-change reload, remove it from the address after consumption, and preserve the nickname.
- [x] Test atomic room-scoped spot reservation, contention, release, and full rooms. Reserve initial chairs on connection and carry spot identifiers with movement state; reject a conflicting claim and select a free alternative, or stand when full.
- [x] Run Node tests, browser/server syntax checks, review the diff, and verify live behavior where the environment permits. Report any restart or push restriction explicitly.

Random nicknames are prefilled and editable, with saved names restored. Product title updated to 방구석 캠핑장. Automated gesture/entry/claim/fallback tests and syntax checks passed; actual mobile browser QA and a server restart remain environment-dependent.
