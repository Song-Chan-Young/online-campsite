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

export const SKEWER_FOODS=new Set(['marshmallow','sweetpotato','barbecue']);
export function createFoodSkewer(T,id) {
 if(id==='marshmallow')return createMarshmallowSkewer(T);
 const prop=createMarshmallowSkewer(T),g=prop.g,old=g.getObjectByName('mm');
 g.remove(old);old.geometry.dispose();old.material.dispose();
 let food;
 if(id==='sweetpotato'){
  food=new T.Mesh(new T.SphereGeometry(.15,20,12),new T.MeshStandardMaterial({color:0x994b60,roughness:.95}));
  food.scale.set(1,1.6,.9);
  const flesh=new T.Mesh(new T.SphereGeometry(.125,16,10),new T.MeshStandardMaterial({color:0xf2bd4f,roughness:.85}));
  flesh.scale.set(.8,.65,.28);flesh.position.set(0,.025,.13);food.add(flesh);
 }else{
  food=new T.Group();
  const meat=new T.MeshStandardMaterial({color:0x955331,roughness:.8});
  const pepper=new T.MeshStandardMaterial({color:0x5d813b,roughness:.85});
  for(let i=0;i<3;i++){
   const chunk=new T.Mesh(new T.BoxGeometry(.27,.18,.23),meat);chunk.position.y=(i-1)*.24;chunk.rotation.y=i*.35;food.add(chunk);
   for(const x of [-.075,.075]){
    const mark=new T.Mesh(new T.BoxGeometry(.018,.13,.008),new T.MeshStandardMaterial({color:0x3a251b,roughness:1}));mark.position.set(x,0,.119);chunk.add(mark);
   }
   if(i<2){const vegetable=new T.Mesh(new T.BoxGeometry(.24,.05,.2),pepper);vegetable.position.y=(i-1)*.24+.12;food.add(vegetable);}
  }
 }
 food.name='mm';food.position.y=-1.2;g.add(food);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return prop;
}
