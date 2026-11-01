const fract=value=>value-Math.floor(value);
export function flameParticle(index,time,strength,out={}) {
  const seed=fract(index*.754877666+.137),angle=index*2.39996323;
  const age=fract(index*.61803399+time*(.48+seed*.28));
  const radius=(.14+seed*.42)*Math.pow(1-age,1.25);
  const sway=Math.sin(time*3.1+age*6+index*.3)*age*.13;
  out.x=Math.cos(angle)*radius+sway;
  out.z=Math.sin(angle)*radius+Math.cos(time*2.4+index)*age*.09;
  out.y=.17+age*(1.9+strength*.75);
  out.size=(.55+seed*.4)*(1-age*.45);
  out.heat=1-age;
  out.alpha=Math.min(1,age/.08)*Math.pow(1-age,.5)*.19;
  return out;
}

// Many overlapping rising tongues make one living flame, with no video or textures.
export function createCampfireFlames(T) {
  const group=new T.Group(),count=360;
  const positions=new Float32Array(count*3),sizes=new Float32Array(count),heat=new Float32Array(count),alpha=new Float32Array(count);
  const geometry=new T.BufferGeometry();
  const attributes={position:new T.BufferAttribute(positions,3),flameSize:new T.BufferAttribute(sizes,1),heat:new T.BufferAttribute(heat,1),opacity:new T.BufferAttribute(alpha,1)};
  for(const [name,attribute] of Object.entries(attributes)){attribute.setUsage(T.DynamicDrawUsage);geometry.setAttribute(name,attribute);}
  const uniforms={pointScale:{value:800}};
  const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending,
    vertexShader:`
      attribute float flameSize;attribute float heat;attribute float opacity;
      uniform float pointScale;varying float warmth;varying float visibility;
      void main(){
        vec4 eye=modelViewMatrix*vec4(position,1.0);
        float scale=length(modelMatrix[0].xyz);
        gl_PointSize=clamp(flameSize*scale*pointScale/max(.1,-eye.z),2.0,240.0);
        gl_Position=projectionMatrix*eye;warmth=heat;visibility=opacity;
      }`,
    fragmentShader:`
      varying float warmth;varying float visibility;
      void main(){
        vec2 p=gl_PointCoord;
        float tip=1.0-p.y;
        float width=.08+.39*pow(1.0-tip,.65);
        float across=abs(p.x-.5)/width;
        float edge=pow(max(0.0,1.0-across*across),1.8);
        float ends=smoothstep(0.0,.18,p.y)*(1.0-smoothstep(.62,1.0,p.y));
        float a=edge*ends*visibility;
        if(a<.002)discard;
        vec3 color=mix(vec3(1.0,.12,.006),vec3(1.0,.94,.62),smoothstep(.1,.85,warmth));
        gl_FragColor=vec4(color,a);
      }`});
  const flame=new T.Points(geometry,material);flame.frustumCulled=false;group.add(flame);
  const sample={};
  return {group,update(time,strength,camera){
    const viewport=globalThis.window;
    uniforms.pointScale.value=(viewport?.innerHeight||800)*Math.min(viewport?.devicePixelRatio||1,2)/(2*Math.tan((camera.fov||55)*Math.PI/360));
    for(let i=0;i<count;i++) {
      flameParticle(i,time,strength,sample);
      positions[i*3]=sample.x;positions[i*3+1]=sample.y;positions[i*3+2]=sample.z;
      sizes[i]=sample.size;heat[i]=sample.heat;alpha[i]=sample.alpha;
    }
    for(const attribute of Object.values(attributes))attribute.needsUpdate=true;
  }};
}
