// Arm-local coordinates: the raised forearm points the skewer toward the fire.
export function createMarshmallowSkewer(T) {
 const g=new T.Group();g.position.set(0,-.36,.035);
 const stick=new T.Mesh(new T.CylinderGeometry(.012,.017,1.28,8),new T.MeshStandardMaterial({color:0x976a3c,roughness:.85}));
 stick.position.y=-.58;g.add(stick);
 const material=new T.MeshStandardMaterial({color:0xfff6e7,roughness:.87});
 const marshmallow=new T.Mesh(new T.CylinderGeometry(.085,.085,.16,16,3),material);
 marshmallow.name='mm';marshmallow.position.y=-1.2;g.add(marshmallow);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return {g,steamParts:[]};
}
