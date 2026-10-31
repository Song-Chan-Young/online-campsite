export function createCampingChair(T) {
  const group=new T.Group();group.userData.kind='camping-chair';
  const cloth=new T.MeshStandardMaterial({color:0x476e61,roughness:.95,side:T.DoubleSide});
  const frame=new T.MeshStandardMaterial({color:0x343c3a,metalness:.55,roughness:.45});
  const wood=new T.MeshStandardMaterial({color:0xb68b59,roughness:.75});
  const box=(w,h,d,mat,x,y,z)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const rod=(a,b)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const mesh=new T.Mesh(new T.CylinderGeometry(.024,.024,delta.length(),8),frame);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());group.add(mesh);};
  box(.76,.055,.65,cloth,0,.47,0);
  const back=box(.76,.68,.055,cloth,0,.82,-.28);back.rotation.x=-.16;
  box(.64,.08,.09,cloth,0,1.12,-.33);
  for(const x of [-.4,.4]) {
    rod([x,.04,.35],[x,.52,-.27]);rod([x,.04,-.34],[x,.52,.29]);
    rod([x,.45,-.27],[x,1.13,-.36]);rod([x,.07,.31],[x,.72,.18]);
    box(.1,.045,.58,wood,x,.73,0);
    box(.12,.025,.1,frame,x,.025,.35);box(.12,.025,.1,frame,x,.025,-.34);
  }
  rod([-.4,.12,-.31],[.4,.12,-.31]);
  const holder=new T.Mesh(new T.TorusGeometry(.07,.014,6,16),frame);holder.rotation.x=Math.PI/2;holder.position.set(.49,.71,.16);group.add(holder);
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return group;
}
