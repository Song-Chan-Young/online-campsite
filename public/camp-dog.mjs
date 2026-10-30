// A small Maltese facing +z. The pivots match the campsite's existing walk cycle.
export function createMaltese(THREE) {
  const g = new THREE.Group(); g.name = 'maltese';
  g.scale.set(1, 0.95, 0.76);
  const white = new THREE.MeshStandardMaterial({color: 0xf5f3eb, roughness: 0.94});
  const light = new THREE.MeshStandardMaterial({color: 0xfffdf6, roughness: 0.9});
  const shadow = new THREE.MeshStandardMaterial({color: 0xe1dfd5, roughness: 1});
  const black = new THREE.MeshPhysicalMaterial({color: 0x10100f, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2});
  const eyeShine = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.2});
  const noseHighlight = new THREE.MeshStandardMaterial({color: 0x55514d, roughness: 0.24});
  const collarMat = new THREE.MeshStandardMaterial({color: 0xd98f9b, roughness: 0.72});
  const bowMat = new THREE.MeshStandardMaterial({color: 0xc96f83, roughness: 0.68});
  const bellMat = new THREE.MeshStandardMaterial({color: 0xd9b66f, metalness: 0.55, roughness: 0.32});
  const sphere = new THREE.SphereGeometry(1, 14, 10);
  function puff(parent, x, y, z, sx, sy, sz, material = white) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  puff(g, 0, 0.42, -0.035, 0.17, 0.19, 0.29);
  puff(g, 0, 0.44, 0.15, 0.165, 0.195, 0.16, light);
  puff(g, 0, 0.42, -0.21, 0.17, 0.17, 0.15);
  // Long soft locks break the silhouette, rather than a hard white body shell.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const lock = puff(g, side * (0.135 + Math.sin(i * 1.7) * 0.008), 0.36 + (i % 2) * 0.025,
        -0.25 + i * 0.105, 0.065, 0.17 + (i % 2) * 0.02, 0.078, i % 2 ? light : white);
      lock.rotation.z = side * -0.1;
    }
  }
  puff(g, 0, 0.55, 0.22, 0.14, 0.16, 0.13, light);
  // A soft neck ruff and a tiny collar add a cared-for pet feel without
  // changing the campsite's toy-like, hand-built 3D style.
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    puff(g, Math.cos(a) * 0.12, 0.49 + Math.sin(a) * 0.055, 0.12 + Math.sin(a) * 0.045,
      0.075, 0.09, 0.075, i % 2 ? light : white);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.018, 7, 20), collarMat);
  collar.position.set(0, 0.49, 0.245); collar.rotation.x = Math.PI / 2.8; collar.castShadow = true; g.add(collar);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), bellMat);
  bell.position.set(0, 0.455, 0.338); bell.castShadow = true; g.add(bell);
  const head = new THREE.Group(); head.name = 'maltese-head'; head.position.set(0, 0.6, 0.31); g.add(head);
  puff(head, 0, 0.04, 0, 0.18, 0.18, 0.16, light);
  // Crown and broad cheeks give the Maltese its round, soft face.
  for (let i = -1; i <= 1; i++) puff(head, i * 0.085, 0.165 - Math.abs(i) * 0.022, -0.005, 0.075, 0.065, 0.1, light);
  for (const side of [-1, 1]) {
    puff(head, side * 0.115, -0.035, 0.065, 0.095, 0.105, 0.105, light);
    // Drop ears sit behind the eyes and hang down alongside the cheeks.
    for (let i = 0; i < 3; i++) {
      const ear = puff(head, side * (0.16 + i * 0.009), 0.065 - i * 0.063, -0.035 + i * 0.006,
        0.066, 0.095, 0.085, i === 2 ? white : light);
      ear.rotation.z = side * 0.12;
    }
    puff(head, side * 0.049, -0.048, 0.142, 0.065, 0.057, 0.065, light);
    const eye = puff(head, side * 0.068, 0.063, 0.137, 0.027, 0.03, 0.022, black);
    eye.rotation.y = side * 0.16;
    puff(head, side * 0.068 - 0.007, 0.073, 0.155, 0.007, 0.008, 0.005, eyeShine);
  }
  const nose = puff(head, 0, -0.014, 0.192, 0.035, 0.025, 0.024, black);
  puff(head, -0.009, -0.004, 0.212, 0.009, 0.005, 0.004, noseHighlight);
  // Small curved smile, partly tucked into the muzzle so it reads gently.
  for (const side of [-1, 1]) {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0035, 5, 12, Math.PI), shadow);
    smile.position.set(side * 0.019, -0.073, 0.195); smile.rotation.z = Math.PI; smile.castShadow = true; head.add(smile);
  }
  // Signature Maltese topknot with a little two-loop bow.
  puff(head, 0, 0.245, 0.005, 0.082, 0.065, 0.09, white);
  for (const side of [-1, 1]) {
    const loop = puff(head, side * 0.055, 0.29, 0.09, 0.052, 0.032, 0.022, bowMat);
    loop.rotation.z = side * 0.35;
  }
  puff(head, 0, 0.29, 0.11, 0.018, 0.018, 0.018, bellMat);
  const legs = [];
  // The entire leg, coat cuff and paw follow the existing hip pivot animation.
  for (const z of [0.19, -0.2]) for (const x of [-0.105, 0.105]) {
    const leg = new THREE.Group(); leg.name = 'maltese-leg'; leg.position.set(x, 0.3, z); g.add(leg);
    puff(leg, 0, -0.095, 0, 0.052, 0.13, 0.055);
    puff(leg, 0, -0.06, 0, 0.068, 0.09, 0.065, light);
    puff(leg, 0, -0.23, 0.025, 0.065, 0.04, 0.085, light);
    for (const toeX of [-0.027, 0, 0.027]) puff(leg, toeX, -0.235, 0.083, 0.012, 0.012, 0.008, white);
    legs.push(leg);
  }
  const tail = new THREE.Group(); tail.name = 'maltese-tail'; tail.position.set(0, 0.5, -0.3); g.add(tail);
  const plume = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.12, -0.09),
    new THREE.Vector3(0, 0.24, -0.06), new THREE.Vector3(0, 0.265, 0.06),
    new THREE.Vector3(0, 0.19, 0.14),
  ]);
  const tailCore = new THREE.Mesh(new THREE.TubeGeometry(plume, 14, 0.033, 6, false), white);
  tailCore.castShadow = true; tailCore.receiveShadow = true; tail.add(tailCore);
  for (let i = 0; i < 7; i++) {
    const p = plume.getPoint(i / 6);
    const lock = puff(tail, p.x, p.y, p.z, 0.065, 0.072, 0.075, i % 2 ? light : white);
    lock.rotation.x = i * -0.22;
  }
  return {g, legs, tail, head};
}
