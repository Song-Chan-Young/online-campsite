// An open, fully geometric shelter. All returned camera points are tent-local.
export function createDetailedTent(THREE) {
  const group = new THREE.Group();
  group.name = 'detailed-tent';
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c8bba1'; ctx.fillRect(0, 0, 256, 256);
  // Fine alternating warp and weft, with irregular heavier ripstop threads.
  for (let i = 0; i < 256; i += 2) {
    ctx.fillStyle = i % 4 ? '#b8ab92' : '#d4c9b3';
    ctx.fillRect(i, 0, 1, 256); ctx.fillRect(0, i, 256, 1);
  }
  ctx.strokeStyle = '#a99b83'; ctx.lineWidth = 1;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  const weave = new THREE.CanvasTexture(canvas);
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(5, 5);
  const cloth = new THREE.MeshStandardMaterial({color: 0xa88b60, map: weave,
    bumpMap: weave, bumpScale: 0.008, roughness: 0.96, side: THREE.DoubleSide,
    emissive: 0x281e10, emissiveIntensity: 0.12});
  const trim = new THREE.MeshStandardMaterial({color: 0x403e30, roughness: 0.9});
  const poleMat = new THREE.MeshStandardMaterial({color: 0x6d7370, metalness: 0.65, roughness: 0.36});
  const floorMat = new THREE.MeshStandardMaterial({color: 0x3c4035, roughness: 1, bumpMap: weave, bumpScale: 0.01});
  function mesh(geometry, material, name) {
    const m = new THREE.Mesh(geometry, material); if (name) m.name = name;
    m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
  }
  function rod(points, radius = 0.012, material = poleMat) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, Math.max(4, points.length * 3), radius, 5, false), material);
  }
  const moving = [];
  // Two roof panels run from ridge to floor; front is intentionally unfilled.
  for (const side of [-1, 1]) {
    const g = new THREE.PlaneGeometry(1, 1, 14, 20);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5, v = p.getY(i) + 0.5;
      const fold = Math.sin(v * Math.PI * 12 + u * 2) * Math.sin(u * Math.PI) * 0.026;
      p.setXYZ(i, side * (u * 1.58 + fold), 2.04 * (1 - u) + 0.055 + fold, (v - 0.5) * 3.25);
    }
    g.computeVertexNormals();
    mesh(g, cloth, side < 0 ? 'tent-left-fabric' : 'tent-right-fabric');
    moving.push({g, base: p.array.slice(), side});
    rod([[side * 1.59, 0.07, -1.64], [0, 2.1, -1.64], [-side * 1.59, 0.07, -1.64]], 0.014);
    rod([[side * 1.6, 0.065, -1.63], [side * 1.6, 0.065, 0], [side * 1.6, 0.065, 1.63]], 0.013, trim);
  }
  // Solid rear wall; no front wall behind the open doorway.
  const rear = new THREE.BufferGeometry();
  rear.setAttribute('position', new THREE.Float32BufferAttribute([-1.58, 0.06, -1.62, 1.58, 0.06, -1.62, 0, 2.09, -1.62], 3));
  rear.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); rear.computeVertexNormals();
  mesh(rear, cloth, 'tent-rear-wall');
  rod([[-1.6, 0.06, 1.65], [0, 2.1, 1.65], [1.6, 0.06, 1.65]], 0.018);
  rod([[0, 2.11, -1.67], [0, 2.11, 0], [0, 2.11, 1.7]], 0.014);
  // Door flaps are tied to the edges, leaving the centre and sightline open.
  for (const side of [-1, 1]) {
    const flap = new THREE.BufferGeometry();
    flap.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 2.075, 1.64, side * 1.56, 0.07, 1.64, side * 1.17, 0.13, 1.69,
      0, 2.075, 1.64, side * 1.17, 0.13, 1.69, side * 0.63, 1.12, 1.73,
    ], 3));
    flap.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 0, 0.8, 0, 0, 1, 0.8, 0, 0.5, 0.5], 2));
    flap.computeVertexNormals(); mesh(flap, cloth, 'tent-tied-door');
    rod([[0, 2.08, 1.65], [side * 0.63, 1.12, 1.74], [side * 1.17, 0.13, 1.7]], 0.012, trim);
    rod([[side * 1.13, 0.62, 1.68], [side * 1.3, 0.6, 1.72]], 0.018, trim);
    // Tension lines and low pegs outside the sleeping area.
    rod([[side * 1.53, 0.18, 1.5], [side * 2.0, 0.03, 1.98]], 0.004, trim);
    rod([[side * 2.0, 0.01, 1.98], [side * 2.02, 0.13, 1.96]], 0.012);
  }
  const floor = mesh(new THREE.BoxGeometry(3.08, 0.035, 3.2), floorMat, 'tent-inner-floor'); floor.position.y = 0.04;
  const mat = mesh(new THREE.BoxGeometry(0.87, 0.07, 2.05), new THREE.MeshStandardMaterial({color: 0x66634b, roughness: 1}), 'tent-sleeping-mat');
  mat.position.set(0.34, 0.105, -0.15);
  const bagMat = new THREE.MeshStandardMaterial({color: 0x666e54, roughness: 0.91, bumpMap: weave, bumpScale: 0.007});
  const bag = mesh(new THREE.CapsuleGeometry(0.37, 1.12, 4, 12), bagMat, 'tent-sleeping-bag');
  bag.rotation.x = Math.PI / 2; bag.scale.z = 0.36; bag.position.set(0.34, 0.21, -0.04);
  // Quilted baffles remain visible below the waking camera.
  for (let i = 0; i < 8; i++) {
    const z = -0.72 + i * 0.2;
    rod([[-0.005, 0.22, z], [0.14, 0.31, z], [0.36, 0.34, z], [0.62, 0.29, z], [0.69, 0.22, z]], 0.006, trim);
  }
  const pillow = mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({color: 0xb6ad93, roughness: 1}), 'tent-pillow');
  pillow.scale.set(1.25, 0.25, 0.7); pillow.position.set(0.34, 0.21, -1.1);
  // Thin roof snow surface preserves the existing seasonal lookup.
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.95, 0.94, -1.63, 0, 2.135, -1.63, -0.95, 0.94, 1.63,
    0, 2.135, -1.63, 0, 2.135, 1.63, -0.95, 0.94, 1.63,
    0, 2.135, -1.63, 0.95, 0.94, -1.63, 0.95, 0.94, 1.63,
    0, 2.135, -1.63, 0.95, 0.94, 1.63, 0, 2.135, 1.63,
  ], 3)); snowGeo.computeVertexNormals();
  const snowCap = mesh(snowGeo, new THREE.MeshStandardMaterial({color: 0xe9edf0, roughness: 1, side: THREE.DoubleSide}), 'tent-snow'); snowCap.visible = false;
  let lastUpdate = -Infinity;
  return {group, snowCap,
    interiorView() {return {sleepPos: new THREE.Vector3(0.13, 0.4, -1.03), awakePos: new THREE.Vector3(0.13, 0.96, -0.76), target: new THREE.Vector3(0, 0.63, 4.8)};},
    update(time, windStrength = 0.3) {
      if (time - lastUpdate < 0.08) return; lastUpdate = time;
      const strength = Math.max(0, Math.min(1, windStrength));
      for (const {g, base, side} of moving) {
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const j = i * 3, u = Math.min(1, Math.abs(base[j]) / 1.6);
          const flutter = Math.sin(time * 1.5 + base[j + 2] * 3.5 + u * 5) * Math.sin(u * Math.PI) * 0.009 * strength;
          p.setXYZ(i, base[j] + side * flutter, base[j + 1] + flutter, base[j + 2]);
        }
        p.needsUpdate = true; g.computeVertexNormals();
      }
    },
  };
}
