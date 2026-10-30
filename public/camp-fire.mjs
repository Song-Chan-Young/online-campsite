// A ray-marched 3D flame volume; geometry and noise are generated locally.
export function createCampfireFlames(THREE) {
  const group = new THREE.Group();
  const bytes = new Uint8Array(128 * 128 * 4);
  for (let i=0;i<bytes.length;i+=4) {const n=Math.random()*255;bytes[i]=bytes[i+1]=bytes[i+2]=n;bytes[i+3]=255;}
  const noise = new THREE.DataTexture(bytes,128,128);
  noise.wrapS=noise.wrapT=THREE.RepeatWrapping;
  noise.minFilter=noise.magFilter=THREE.LinearFilter;noise.needsUpdate=true;
  const uniforms={uTime:{value:0},uStrength:{value:.45},uNoise:{value:noise},uEye:{value:new THREE.Vector3()}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.BackSide,
    vertexShader:`varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`
      uniform float uTime,uStrength;uniform vec3 uEye;uniform sampler2D uNoise;
      varying vec3 vLocal;
      float n3(vec3 p){
        float z=floor(p.z);vec2 off=vec2(37.0,17.0);
        vec2 uv=(p.xy+off*z+.5)/128.0;
        return mix(texture2D(uNoise,uv).r,texture2D(uNoise,uv+off/128.0).r,fract(p.z));
      }
      void main(){
        vec3 ray=normalize(vLocal-uEye),inv=1.0/ray;
        vec3 a=(vec3(-.8,0.0,-.8)-uEye)*inv,b=(vec3(.8,1.9,.8)-uEye)*inv;
        vec3 lo=min(a,b),hi=max(a,b);
        float first=max(max(lo.x,lo.y),lo.z),last=min(min(hi.x,hi.y),hi.z);
        first=max(first,0.0);if(last<=first)discard;
        float stepSize=(last-first)/36.0;
        vec3 sum=vec3(0.0);float opacity=0.0;
        for(int i=0;i<36;i++){
          vec3 p=uEye+ray*(first+(float(i)+.5)*stepSize);
          float h=p.y/(1.15+uStrength*.65);
          vec3 flow=p*vec3(3.8,2.7,3.8)-vec3(0.0,uTime*2.1,0.0);
          float billow=n3(flow)*.65+n3(flow*2.13+vec3(7.0,-uTime*.7,13.0))*.35;
          vec2 bend=vec2(sin(p.y*4.0-uTime*1.5),cos(p.y*3.0+uTime*.9))*h*.11;
          float radius=length(p.xz+bend);
          float width=mix(.43,.012,clamp(pow(max(h,0.0),.72),0.0,1.0));
          float field=width-radius+(billow-.5)*(.22+h*.32);
          float density=smoothstep(-.055,.15,field)*smoothstep(0.0,.08,p.y)
            *(1.0-smoothstep(.5+billow*.28,1.0,h));
          float heat=clamp(field*1.6+(1.0-h)*.6,0.0,1.0);
          vec3 color=mix(vec3(1.1,.08,.003),vec3(2.2,.6,.025),smoothstep(0.0,.45,heat));
          color=mix(color,vec3(3.3,2.4,.95),smoothstep(.35,.85,heat));
          float absorb=1.0-exp(-density*stepSize*5.2);
          sum+=(1.0-opacity)*color*absorb;opacity+=(1.0-opacity)*absorb;
          if(opacity>.985)break;
        }
        if(opacity<.003)discard;
        gl_FragColor=vec4(sum/max(opacity,.001),opacity*.94);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const geometry=new THREE.BoxGeometry(1.6,1.9,1.6);geometry.translate(0,.95,0);
  const volume=new THREE.Mesh(geometry,material);volume.position.y=.13;group.add(volume);
  // Small 3D smoke puffs, tinted by the coal bed rather than solid gray columns.
  const smokeTexture=createEmberTexture(THREE);
  const smoke=Array.from({length:9},(_,i)=>{
    const m=new THREE.SpriteMaterial({map:smokeTexture,color:0x77736b,transparent:true,opacity:0,depthWrite:false});
    const sprite=new THREE.Sprite(m);group.add(sprite);return sprite;
  });
  const worldEye=new THREE.Vector3();
  return {group,update(time,strength,camera){
    uniforms.uTime.value=time;uniforms.uStrength.value=strength;
    volume.updateWorldMatrix(true,false);camera.getWorldPosition(worldEye);
    uniforms.uEye.value.copy(worldEye);volume.worldToLocal(uniforms.uEye.value);
    smoke.forEach((p,i)=>{
      const age=(time*.13+i/9)%1;
      p.position.set(Math.sin(age*3.3+i)*age*.45,1.0+age*2.4,Math.cos(i*2.4+age)*age*.3);
      p.scale.setScalar(.3+age*.85);
      p.material.opacity=Math.sin(age*Math.PI)*.055*(.5+strength);
    });
  }};
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
