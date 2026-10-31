export {createCampfireFlames} from './flame-particles.mjs';

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

// Wood darkens gradually; fissures glow while the surface turns to charcoal.
export function createBurningWood(THREE, seed = 0) {
  const uniforms = {uBurn: {value: 0}, uWoodHeat: {value: 0}, uWoodSeed: {value: seed}, uWoodTime: {value: 0}};
  const bark = document.createElement('canvas'); bark.width = 128; bark.height = 256;
  const ctx = bark.getContext('2d'); ctx.fillStyle = '#777'; ctx.fillRect(0,0,128,256);
  for (let i=0;i<90;i++) {
    const x=(i*17.37+seed*11)%128;
    ctx.strokeStyle=i%3?'#444':'#aaa';ctx.lineWidth=i%4===0?2:1;
    ctx.beginPath();ctx.moveTo(x,0);
    for(let y=0;y<=256;y+=8)ctx.lineTo(x+Math.sin(y*.06+i)*2+Math.sin(y*.19+i)*.8,y);
    ctx.stroke();
  }
  const relief=new THREE.CanvasTexture(bark);relief.wrapS=relief.wrapT=THREE.RepeatWrapping;
  const material = new THREE.MeshStandardMaterial({color: 0x68442b, roughness: .97,bumpMap:relief,bumpScale:.018});
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'varying vec2 vWoodUv; varying float vWoodCap;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvWoodUv = uv; vWoodCap = abs(normal.y);');
    shader.fragmentShader = `varying vec2 vWoodUv;
      varying float vWoodCap;
      uniform float uBurn;
      uniform float uWoodHeat;
      uniform float uWoodSeed;
      uniform float uWoodTime;
      float woodHash(vec2 p) {return fract(sin(dot(p,vec2(127.1,311.7)) + uWoodSeed) * 43758.5453);}
      float woodNoise(vec2 p) {
        vec2 cell=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(woodHash(cell),woodHash(cell+vec2(1.0,0.0)),f.x),
          mix(woodHash(cell+vec2(0.0,1.0)),woodHash(cell+vec2(1.0)),f.x),f.y);
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec2 grainUv = vWoodUv * vec2(28.0, 5.0);
      float grain = woodHash(floor(grainUv));
      float grooves = abs(sin(vWoodUv.x * 96.0 + sin(vWoodUv.y * 22.0 + uWoodSeed) * 0.9));
      float crossCrack = abs(sin(vWoodUv.y * 41.0 + sin(vWoodUv.x * 23.0) * 0.6));
      float fissure = 1.0 - smoothstep(0.025, 0.15, min(grooves, crossCrack));
      // Uneven burn fronts expose pale ash islands while leaving charcoal channels.
      float patchNoise = woodNoise(vWoodUv*vec2(7.0,4.0)+uWoodSeed)
        *0.68 + woodNoise(vWoodUv*vec2(19.0,13.0))*0.32;
      float charred = smoothstep(0.025, 0.55, uBurn + (patchNoise-0.5)*0.16);
      float ashAge = smoothstep(0.16, 0.86, uBurn);
      float ashThreshold = mix(0.91, 0.29, ashAge);
      float ashPatch = smoothstep(ashThreshold-0.055, ashThreshold+0.055,patchNoise)
        *smoothstep(0.12,0.23,uBurn);
      // Cap normals distinguish the end grain from cylindrical side UVs.
      float cap = smoothstep(0.5,0.9,vWoodCap);
      float endDistance = min(vWoodUv.y,1.0-vWoodUv.y);
      float endBand = 1.0-smoothstep(0.025,0.14,endDistance);
      float rings = abs(sin(length(vWoodUv-0.5)*95.0 + patchNoise*5.0));
      float endGlow = mix(endBand*(0.55+patchNoise*0.45),0.38+0.62*(1.0-rings),cap);
      float emberPulse = 0.78 + sin(uWoodTime*2.3+uWoodSeed+patchNoise*8.0)*0.15
        + sin(uWoodTime*5.7+vWoodUv.y*21.0)*0.07;
      vec3 bark = diffuseColor.rgb * (0.55 + grain * 0.45) * (0.7 + grooves * 0.3);
      vec3 charcoal = vec3(0.023, 0.014, 0.011) * (0.6 + grain * 0.9);
      vec3 ash = mix(vec3(0.30,0.29,0.27),vec3(0.76,0.74,0.68),patchNoise) * (0.83 + grain * 0.24);
      diffuseColor.rgb = mix(mix(bark, charcoal, charred), ash, ashPatch * (1.0-fissure*0.7));
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      float ashRim = (1.0-smoothstep(0.018,0.065,abs(patchNoise-ashThreshold)))
        *smoothstep(0.14,0.3,uBurn);
      float smolder = fissure*(1.0-ashPatch*0.76) + endGlow*0.72 + ashRim*0.24;
      totalEmissiveRadiance += vec3(1.5,0.095,0.008) * smolder * uWoodHeat * emberPulse;
    `);
  };
  return {material, update(age, strength, time, crackle = 0) {
    uniforms.uBurn.value = Math.max(0, Math.min(1, age / 240));
    uniforms.uWoodTime.value = time;
    const ignition = Math.min(1, age / 8);
    const remaining = Math.max(0, 1 - Math.max(0, age - 150) / 100);
    uniforms.uWoodHeat.value = ignition * remaining * (0.55 + strength * 0.7)
      * (0.86 + Math.sin(time * 1.8 + seed) * 0.14) + crackle * 0.9;
  }};
}
