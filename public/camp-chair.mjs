export function createCampingChair(T, variant='classic') {
  const group=new T.Group();group.userData.kind='camping-chair';
  if(!['classic','low','highback','log'].includes(variant))variant='classic';
  Object.assign(group.userData,{variant,seatHeight:.47});
  const cloth=new T.MeshStandardMaterial({color:({classic:0x476e61,low:0xc4a374,highback:0x465c83,log:0x76502f})[variant],roughness:.95,side:T.DoubleSide});
  const frame=new T.MeshStandardMaterial({color:0x343c3a,metalness:.55,roughness:.45});
  const wood=new T.MeshStandardMaterial({color:0xb68b59,roughness:.75});
  const box=(w,h,d,mat,x,y,z)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const rod=(a,b)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const mesh=new T.Mesh(new T.CylinderGeometry(.024,.024,delta.length(),8),frame);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());group.add(mesh);};
  if(variant==='log') {
    const bark=new T.MeshStandardMaterial({color:0x503523,roughness:1});
    const seat=box(1.25,.13,.6,wood,0,.405,0);
    seat.name='bench-seat';
    for(const z of [-.19,.19]) {
      const log=new T.Mesh(new T.CylinderGeometry(.15,.17,1.26,12),bark);
      log.rotation.z=Math.PI/2;log.position.set(0,.3,z);group.add(log);
    }
    for(const x of [-.43,.43])box(.19,.25,.48,bark,x,.125,0);
    group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    return group;
  }
  box(.76,.055,.65,cloth,0,.47,0);
  const backHeight=variant==='highback'?1.02:variant==='low'?.46:.68;
  const back=box(.76,backHeight,.055,cloth,0,.48+backHeight/2,-.28);back.rotation.x=-.16;
  const top=.48+backHeight;
  box(.64,variant==='highback'?.14:.08,.09,cloth,0,top,-.33);
  for(const x of [-.4,.4]) {
    rod([x,.04,.35],[x,.52,-.27]);rod([x,.04,-.34],[x,.52,.29]);
    rod([x,.45,-.27],[x,top,-.36]);rod([x,.07,.31],[x,.72,.18]);
    if(variant!=='low')box(.1,.045,.58,wood,x,.73,0);
    box(.12,.025,.1,frame,x,.025,.35);box(.12,.025,.1,frame,x,.025,-.34);
  }
  rod([-.4,.12,-.31],[.4,.12,-.31]);
  const holder=new T.Mesh(new T.TorusGeometry(.07,.014,6,16),frame);holder.rotation.x=Math.PI/2;holder.position.set(.49,.71,.16);group.add(holder);
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return group;
}
