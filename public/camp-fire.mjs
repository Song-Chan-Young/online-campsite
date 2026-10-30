// Camera-facing flame sheets: soft edges, rising turbulence and a hot inner core.
// No textures, network requests or per-frame geometry allocations.
export function createCampfireFlames(THREE) {
  const group = new THREE.Group();
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float turbulence(vec2 p) {
      return noise(p) * 0.57 + noise(p * 2.03 + 7.1) * 0.28 + noise(p * 4.11) * 0.15;
    }
    void main() {
      float y = vUv.y;
      float time = uTime * 1.65 + uSeed;
      vec2 flow = vec2(vUv.x * 4.5 + uSeed, y * 4.0 - time);
      float n = turbulence(flow);
      float curl = (turbulence(flow * 0.65 + 12.0) - 0.5) * y * 0.65;
      float x = (vUv.x - 0.5) * 2.0 + curl;
      float width = mix(0.71, 0.025, pow(y, 0.72));
      float edge = width - abs(x) + (n - 0.5) * (0.13 + y * 0.39);
      float body = smoothstep(-0.055, 0.10, edge);
      float tips = 1.0 - smoothstep(0.62 + n * 0.22, 1.0, y);
      float base = smoothstep(0.0, 0.075, y);
      float alpha = body * tips * base * (0.68 + uStrength * 0.16);
      if (alpha < 0.006) discard;
      float core = (1.0 - smoothstep(0.03, width * 0.82 + 0.03, abs(x)))
                 * (1.0 - smoothstep(0.05, 0.66, y));
      vec3 outer = mix(vec3(0.9, 0.075, 0.008), vec3(1.45, 0.46, 0.035), body);
      vec3 color = mix(outer, vec3(1.9, 1.32, 0.48), core);
      gl_FragColor = vec4(color, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.translate(0, 0.5, 0); // Scaling keeps the flame attached to the wood.
  const sheets = [-0.21, 0.17, 0].map((offset, i) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {uTime: {value: 0}, uSeed: {value: i * 5.37}, uStrength: {value: 0.45}},
      vertexShader, fragmentShader, transparent: true, depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(offset, 0.17, (i - 1) * 0.13);
    group.add(mesh);
    return mesh;
  });
  return {
    group,
    update(time, strength, camera) {
      sheets.forEach((mesh, i) => {
        mesh.quaternion.copy(camera.quaternion);
        const pulse = 1 + Math.sin(time * 3.3 + i * 2.7) * 0.09
          + Math.sin(time * 7.1 + i) * 0.035;
        mesh.scale.set((i === 2 ? 0.79 : 0.64) * (0.8 + strength * 0.35),
          (i === 2 ? 1.48 : 1.12) * (0.66 + strength * 0.58) * pulse, 1);
        mesh.material.uniforms.uTime.value = time;
        mesh.material.uniforms.uStrength.value = strength;
      });
    },
  };
}

export function createEmberTexture(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,230,170,.95)');
  gradient.addColorStop(0.45, 'rgba(255,130,30,.4)');
  gradient.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}
