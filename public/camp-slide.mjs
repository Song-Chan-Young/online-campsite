// Coordinates and ride path are world-space; add group directly to the scene.
export function createWaterSlide(THREE, {start, end, normal, beachWidth}) {
  const group = new THREE.Group(); group.name = 'summer-water-slide';
  const shore = end.clone().sub(start).setY(0).normalize();
  const water = normal.clone().setY(0).normalize();
  const anchor = start.clone().lerp(end, 0.62).setY(0);
  const at = (side, distance, height) => anchor.clone().addScaledVector(shore, side).addScaledVector(water, distance).setY(height);
  const entry = at(0, -2.3, 0), top = at(0, -0.5, 2.5), landing = at(0, beachWidth + 1.5, 0.1);
  const clamp = t => Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  const curve = new THREE.Curve();
  curve.getPoint = (t, result = new THREE.Vector3()) => {
    const smooth = t * t * (3 - 2 * t);
    return result.copy(anchor).addScaledVector(shore, 0.65 * Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI))
      .addScaledVector(water, -0.5 + (beachWidth + 2) * t).setY(2.5 - 2.4 * smooth);
  };
  const pointAt = t => curve.getPoint(clamp(t));
  const tangentAt = t => curve.getTangent(clamp(t)).normalize();
  const blue = new THREE.MeshPhysicalMaterial({color: 0x139bda, roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide});
  const yellow = new THREE.MeshStandardMaterial({color: 0xf5c536, roughness: 0.45, metalness: 0.12});
  const steel = new THREE.MeshStandardMaterial({color: 0xb3bdbe, metalness: 0.7, roughness: 0.32});
  function add(geometry, material) {const mesh = new THREE.Mesh(geometry, material);mesh.castShadow = true;mesh.receiveShadow = true;group.add(mesh);return mesh;}
  function bar(a, b, radius = 0.035, material = steel) {
    const delta = b.clone().sub(a);
    const mesh = add(new THREE.CylinderGeometry(radius, radius, delta.length(), 7), material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());return mesh;
  }
  const segments = 56, cross = 12, radius = 0.48, positions = [], uv = [], indices = [], edges = [[], []];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, center = pointAt(t), tangent = tangentAt(t);
    const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
    for (let j = 0; j <= cross; j++) {
      const angle = (j / cross - 0.5) * Math.PI;
      const p = center.clone().addScaledVector(side, Math.sin(angle) * radius);p.y += radius * (1 - Math.cos(angle));
      positions.push(p.x, p.y, p.z);uv.push(t * 8, j / cross);
      if (j === 0) edges[0].push(p);if (j === cross) edges[1].push(p);
      if (i < segments && j < cross) {
        const k = i * (cross + 1) + j;
        indices.push(k, k + 1, k + cross + 1, k + 1, k + cross + 2, k + cross + 1);
      }
    }
  }
  const trough = new THREE.BufferGeometry();
  trough.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  trough.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));trough.setIndex(indices);trough.computeVertexNormals();add(trough, blue);
  for (const edge of edges) add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), segments, 0.033, 6, false), yellow);
  // Land platform, four posts, an actual inclined ladder, and guarded sides.
  const deck = add(new THREE.BoxGeometry(1.25, 0.12, 1.1), yellow);
  deck.position.copy(at(0, -0.9, 2.44));deck.rotation.y = Math.atan2(water.x, water.z);
  for (const x of [-0.53, 0.53]) for (const d of [-1.36, -0.45]) bar(at(x, d, 0), at(x, d, 2.45), 0.045);
  for (const x of [-0.5, 0.5]) {
    bar(at(x, -2.3, 0.08), at(x, -1.25, 2.6), 0.035);
    bar(at(x, -1.3, 2.45), at(x, -1.3, 3.17), 0.025);
    bar(at(x, -0.5, 2.45), at(x, -0.5, 3.17), 0.025);
    bar(at(x, -1.3, 3.17), at(x, -0.5, 3.17), 0.028, yellow);
  }
  for (let i = 1; i <= 9; i++) {const t = i / 9;bar(at(-0.5, -2.3 + 1.05 * t, 0.08 + 2.45 * t), at(0.5, -2.3 + 1.05 * t, 0.08 + 2.45 * t), 0.035, yellow);}
  for (const t of [0.28, 0.53, 0.76]) {
    const p = pointAt(t);bar(p.clone().setY(0), p.clone().add(new THREE.Vector3(0, -0.06, 0)), 0.055);
  }
  // A thin foamy splash ring marks the real water landing, without a texture.
  const foam = new THREE.MeshStandardMaterial({color: 0xe5fbff, transparent: true, opacity: 0.68, roughness: 0.35, depthWrite: false});
  const ring = add(new THREE.TorusGeometry(0.65, 0.025, 5, 24), foam);ring.rotation.x = -Math.PI / 2;ring.position.copy(landing).setY(0.045);
  return {group, entry, top, pointAt, tangentAt, landing};
}
