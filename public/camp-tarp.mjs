import {areaOffset} from './camp-areas.mjs';
// A five-by-four metre waterproof fly with a raised ridge and guy lines.
export function createWaterproofTarp(T,{width=5,depth=4,ridge=2.95,edge=2.35}={}) {
 const halfW=width/2,halfD=depth/2;
 const group=new T.Group();group.name='waterproof-tarp';
 const fabric=new T.MeshStandardMaterial({color:0xb4a17d,roughness:.82,side:T.DoubleSide});
 const frame=new T.MeshStandardMaterial({color:0x3d4747,metalness:.65,roughness:.4});
 const roof=new T.BufferGeometry();
 roof.setAttribute('position',new T.Float32BufferAttribute([
  -halfW,edge,-halfD, halfW,edge,-halfD, -halfW,ridge,0, halfW,ridge,0, -halfW,edge,halfD, halfW,edge,halfD
 ],3));
 roof.setIndex([0,2,1,1,2,3,2,4,3,3,4,5]);roof.computeVertexNormals();
 const canopy=new T.Mesh(roof,fabric);canopy.castShadow=true;canopy.receiveShadow=true;group.add(canopy);
 const rod=(a,b,r=.025)=>{
  const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p);
  const mesh=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),8),frame);
  mesh.position.copy(p).add(q).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());group.add(mesh);
 };
 for(const x of [-halfW,halfW]){
  rod([x,0,0],[x,ridge+.03,0]);
  for(const z of [-halfD,halfD]){
   const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(x,2.35,z),new T.Vector3(x*1.14,.07,z*1.18)]),new T.LineBasicMaterial({color:0xe3d5ad}));group.add(line);
   rod([x*1.14,0,z*1.18],[x*1.14,.18,z*1.18],.018);
  }
 }
 return {group,roofHeight(x,z){
  const dx=x-group.position.x,dz=z-group.position.z;
  if(Math.abs(dx)>halfW||Math.abs(dz)>halfD||!group.visible)return null;
  return group.position.y+ridge-Math.abs(dz)*(ridge-edge)/halfD;
 }};
}

// Large automatic shelter anchored to a camp in viewer-world coordinates.
export function createAreaRainTarp(T,offset={x:0,z:0}) {
 const tarp=createWaterproofTarp(T,{width:18,depth:16,ridge:7,edge:5.8});
 tarp.group.position.set(offset.x,0,offset.z);tarp.group.visible=false;
 return {...tarp,setSeason(key){tarp.group.visible=key==='rain';}};
}

export function createCampRainTarps(T,viewer=1) {
 return [1,2,3].map(room=>{
  const offset=areaOffset(room,viewer);
  // The car tent sits farther west than the other camps' tents.
  const tarp=createAreaRainTarp(T,{x:offset.x+(room===2?-2.5:0),z:offset.z});
  tarp.group.userData.room=room;
  return tarp;
 });
}
