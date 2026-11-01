// Reuse a single line buffer across weather changes.
export function createRain(THREE) {
 const count=3600,box=26,height=16;
 const seeds=Array.from({length:count},()=>({x:(Math.random()-.5)*box*2,z:(Math.random()-.5)*box*2,y:Math.random()*height,speed:18+Math.random()*9}));
 const geometry=new THREE.BufferGeometry();
 const position=new THREE.BufferAttribute(new Float32Array(count*6),3);
 geometry.setAttribute('position',position);
 const object=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xb6cfdf,transparent:true,opacity:.72,depthWrite:false}));
 object.visible=false;object.frustumCulled=false;
 const wrap=(v,c)=>c+((v-c+box)%(box*2)+box*2)%(box*2)-box;
 return {object,setEnabled(enabled){object.visible=enabled;},update(dt,camera,shelters=[]){
  if(!object.visible)return;
  for(let i=0;i<count;i++){
   const s=seeds[i];s.y=((s.y-s.speed*dt)%height+height)%height;
   s.x=wrap(s.x+dt*.8,camera.x);s.z=wrap(s.z+dt*.25,camera.z);
   let roof=0;
   for(const shelter of shelters)roof=Math.max(roof,shelter.roofHeight(s.x,s.z)??0);
   const bottom=Math.max(s.y,roof),top=Math.max(s.y+1.05,roof);
   position.setXYZ(i*2,s.x,bottom,s.z);
   position.setXYZ(i*2+1,top===bottom?s.x:s.x-.065,top,top===bottom?s.z:s.z-.025);
  }
  position.needsUpdate=true;
 }};
}
