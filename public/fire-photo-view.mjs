// A photographic fire study with restrained flame shimmer. This is not video footage.
export function createFirePhotoView(THREE, canvas, imageURL) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, alpha: false});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const uniforms = {uPhoto: {value: null}, uTime: {value: 0}, uAspect: {value: 1},
    uImageAspect: {value: 1.5}, uCrackle: {value: 0}};
  const material = new THREE.ShaderMaterial({uniforms,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader: `
      uniform sampler2D uPhoto;
      uniform float uTime, uAspect, uImageAspect, uCrackle;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv;
        // Cover a tall display without stretching the wood or fire.
        if(uAspect > uImageAspect) p.y = (p.y - .5) * uImageAspect / uAspect + .5;
        else p.x = (p.x - .5) * uAspect / uImageAspect + .5;
        vec3 original = texture2D(uPhoto,p).rgb;
        float bright = max(original.r,max(original.g,original.b));
        float flame = smoothstep(.22,.7,bright) * smoothstep(.28,.56,p.y);
        vec2 drift = vec2(sin(p.y*39.0-uTime*2.4)+sin(p.y*71.0+uTime*3.1)*.4,
                         sin(p.x*47.0-uTime*2.1)) * vec2(.0035,.005);
        vec3 color = texture2D(uPhoto,clamp(p+drift*flame,0.0,1.0)).rgb;
        float breathing = sin(uTime*3.1+p.y*12.0)*.035 + sin(uTime*6.7+p.x*23.0)*.025;
        color *= 1.0 + flame*breathing;
        color += vec3(.17,.042,.006)*uCrackle*flame;
        // Very small rising embers, fading before reaching the top edge.
        for(int i=0;i<12;i++) {
          float n=float(i);
          float rise=fract(uTime*(.09+n*.002)+n*.073);
          vec2 spark=vec2(.5+sin(n*13.7)*.13+sin(uTime*.7+n)*rise*.04,.25+rise*.57);
          vec2 d=(p-spark)*vec2(uImageAspect,1.0);
          float glow=exp(-dot(d,d)*430000.0)*(1.0-rise)*(.18+uCrackle*.7);
          color += glow*vec3(1.0,.37,.055);
        }
        gl_FragColor=vec4(color,1.0);
      }
    `,
    depthTest: false, depthWrite: false,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  let width=0,height=0;
  const ready = new THREE.TextureLoader().loadAsync(imageURL).then(texture=>{
    // Shader samples display-referred sRGB directly; no second color conversion.
    texture.colorSpace=THREE.NoColorSpace;
    uniforms.uPhoto.value=texture;
    uniforms.uImageAspect.value=texture.image.width/texture.image.height;
  });
  return {ready, dispose() {
    uniforms.uPhoto.value?.dispose();
    scene.children[0].geometry.dispose(); material.dispose(); renderer.dispose();
  }, render(time, crackle) {
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(w!==width||h!==height) {width=w;height=h;renderer.setSize(w,h,false);uniforms.uAspect.value=w/Math.max(1,h);}
    uniforms.uTime.value=reducedMotion ? 0 : time;uniforms.uCrackle.value=reducedMotion ? 0 : crackle;
    renderer.render(scene,camera);
  }};
}
