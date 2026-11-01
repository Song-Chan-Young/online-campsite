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

## Local rain recording, replacing YouTube

2026-11-01: YouTube player removed at user request. Rain plays a locally served MP3 recording with no video player or third-party runtime requests.

- public/assets/rain-recording.mp3: Rain on canvas tent by timsc (109 seconds). Original: https://freesound.org/people/timsc/sounds/317452/ . License: Creative Commons Zero (CC0), verified on the original source page. Downloaded HQ preview: https://cdn.freesound.org/previews/317/317452_266678-hq.mp3 . No claim of matching the user's reference exactly; selected as a similar real canvas-tent rain recording.
