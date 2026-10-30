// Three curved curtains of light. Geometry, waves and fine rays are procedural;
// there are no image assets, sky overlays or per-frame buffer uploads.
export function createAurora(THREE) {
  const group = new THREE.Group();
  group.name = 'procedural-aurora';
  const vertexShader = `
    uniform float uTime;
    uniform float uSeed;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      float phase = uv.x * 14.0 + uSeed + uTime * 0.075;
      float folds = sin(phase) * 3.8 + sin(phase * 2.13 - uTime * 0.045) * 1.35;
      p.z += folds * (0.72 + uv.y * 0.28);
      p.x += sin(phase * 0.65 + uv.y * 1.6) * uv.y * 2.5;
      p.y += sin(phase * 0.63) * 3.5 + sin(phase * 1.7) * 0.8;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;
  const fragmentShader = `
    uniform float uTime;
    uniform float uSeed;
    uniform float uStrength;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
                 mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
    }
    void main() {
      float x = vUv.x, y = vUv.y;
      float drift = uTime * 0.018;
      float bend = noise(vec2(x * 5.0 + uSeed, drift)) * 0.018;
      // Rays remain vertically coherent, but gently drift at different speeds.
      float rayX = x + bend + sin(y * 2.5 + x * 12.0 + drift) * 0.003;
      float broad = noise(vec2(rayX * 18.0 + uSeed, drift * 1.3));
      float rays = noise(vec2(rayX * 190.0, uSeed + drift * 0.7));
      float fine = noise(vec2(rayX * 480.0, uSeed + drift * 0.3));
      float lower = 0.075 + 0.035 * sin(x * 17.0 + uSeed + drift);
      float hem = exp(-pow((y - lower - 0.055) / 0.075, 2.0));
      float veil = exp(-max(y - lower, 0.0) * 4.2);
      float rise = smoothstep(lower - 0.025, lower + 0.065, y);
      float top = 1.0 - smoothstep(0.48 + broad * 0.24, 1.0, y);
      float ends = smoothstep(0.0, 0.14, x) * (1.0 - smoothstep(0.84, 1.0, x));
      float textureLight = (0.32 + broad * 0.68) * (0.48 + rays * 0.42 + fine * 0.10);
      float alpha = (veil * 0.42 + hem * 0.14) * rise * top * ends * textureLight * uStrength;
      vec3 green = vec3(0.16, 0.94, 0.65);
      vec3 teal = vec3(0.12, 0.56, 0.67);
      vec3 violet = vec3(0.43, 0.22, 0.72);
      vec3 color = mix(green, teal, smoothstep(0.10, 0.45, y));
      color = mix(color, violet, smoothstep(0.28, 0.85, y) * 0.78);
      if (alpha < 0.002) discard;
      gl_FragColor = vec4(color, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
  const materials = [];
  for (let layer = 0; layer < 3; layer++) {
    const geometry = new THREE.PlaneGeometry(1, 1, 112, 12);
    const positions = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const radius = 128 + layer * 23;
    for (let i = 0; i < positions.count; i++) {
      const u = uv.getX(i), v = uv.getY(i);
      const angle = (u - 0.5) * (1.9 - layer * 0.18) - 0.26 + layer * 0.18;
      positions.setXYZ(i, Math.sin(angle) * radius,
        54 + layer * 15 + v * (49 + layer * 7), -Math.cos(angle) * radius);
    }
    geometry.computeBoundingSphere();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uSeed: { value: layer * 7.37 + 1.6 },
        uStrength: { value: 0 },
      },
      vertexShader, fragmentShader,
      transparent: true, depthWrite: false, depthTest: true,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      fog: false,
    });
    const curtain = new THREE.Mesh(geometry, material);
    curtain.name = `aurora-curtain-${layer + 1}`;
    curtain.renderOrder = -3 + layer;
    // Shader folds extend a few units beyond the static geometry bounds.
    curtain.frustumCulled = false;
    group.add(curtain);
    materials.push(material);
  }
  group.visible = false;
  return {
    group,
    update(time, nightStrength, camera) {
      const night = THREE.MathUtils.smoothstep(nightStrength, 0.5, 0.95);
      group.visible = night > 0.001;
      if (!group.visible) return;
      // Following part of the camera translation keeps the distant display in
      // the sky while retaining perspective parallax between the three arcs.
      if (camera) group.position.set(camera.position.x * 0.65, 0, camera.position.z * 0.65);
      for (let i = 0; i < materials.length; i++) {
        materials[i].uniforms.uTime.value = time;
        materials[i].uniforms.uStrength.value = night * (1.0 - i * 0.21);
      }
    },
  };
}
