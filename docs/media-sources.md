# Recorded ambient media

Accessed 2026-10-30. No generated photo animation is used in the dedicated views.

## 3D scene

Visible content uses procedural Three.js geometry, shaders and locally drawn surface textures. No photo or video is displayed. Earlier downloaded video references are no longer in the app.

## Sound effects, supplied locally

Download the named recordings from their source pages and convert to MP3 for the app. The original downloads remain in the user's Downloads folder. Processed app copies:

- `public/assets/fire-recording.mp3`: **Campfire crackles**, Mixkit 1330, https://mixkit.co/free-sound-effects/fire/ . Original filename `mixkit-campfire-crackles-1330.wav`. Approx. 24 s.
- `public/assets/forest-recording.mp3`: **Forest birds ambience**, Mixkit 1210, https://mixkit.co/free-sound-effects/forest/ . Original filename `mixkit-forest-birds-ambience-1210.wav`. Approx. 2 min 31 s.
- Normalized conservatively, faded at the loop edges, encoded 128 kbit/s. Recordings are independently sourced ambience, not synchronized on-location audio from the video.
- Mixkit Sound Effects Free License: https://mixkit.co/license/modal/sfxFree/ . The recordings are incorporated in the camping end product. Do not redistribute the standalone recordings, including as public source files. They are ignored by Git; the local build copies them into the deployed app.

The video and sound player uses local files, so no stock-site requests or third-party tracking run during playback.
