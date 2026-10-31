const palettes=[
 [0xe5b65c,0x7a493d,0x4f6352],[0x6b9ea5,0xe5dfc8,0x485877],[0xd68177,0xeee3c6,0x7d4647],
 [0x77946b,0xd4b37d,0x414e39],[0x9d87b9,0xe9d4bf,0x625779],[0xc68749,0x576e67,0xe0c18f],
 [0x668db2,0xd6dfdc,0x3c536d],[0xbda86d,0x6b7768,0x505b50],[0xc97d8d,0xf1dbd1,0x7f5266],
 [0x6faaa1,0xc7b59c,0x466e66],[0xb6b5d3,0x776984,0xe1d6b1],[0xa9b36d,0x526276,0xbaa16e],
];
export function avatarPalette(index=0) {
  index=Number.isInteger(index)&&index>=0?index%48:0;
  const [hat,hoodie,vest]=palettes[index%palettes.length];
  const skins=[0xf2c9a8,0xd9a77c,0xc28b64,0xa66f4c,0x855237,0xe9b996];
  return {hat,hoodie,vest,band:vest,skin:skins[Math.floor(index/8)%skins.length],hair:[0x453126,0x242322,0x875332,0x6b5b4b][index%4],pants:index%2?0x495a64:0x88775e,sock:0xe5dfd1,boot:0x5c4939,pack:vest,hatKind:index%3,glasses:index%2===0};
}
export function applyAvatarStyle(root,index=0) {
  const style=avatarPalette(index);
  if(!root.userData.ownsStyleMaterials) {
    const clones=new Map();root.traverse(node=>{
      if(!node.isMesh)return;
      const clone=material=>{if(!clones.has(material))clones.set(material,material.clone());return clones.get(material);};
      node.material=Array.isArray(node.material)?node.material.map(clone):clone(node.material);
    });root.userData.ownsStyleMaterials=true;
  }
  root.traverse(node=>{
    if(!node.isMesh)return;
    for(const material of Array.isArray(node.material)?node.material:[node.material])if(Object.hasOwn(style,material.name)&&material.color)material.color.setHex(style[material.name]);
    if(node.name.startsWith('glasses-'))node.visible=style.glasses;
  });
  const crown=root.getObjectByName('hat-crown'),brim=root.getObjectByName('hat-brim'),band=root.getObjectByName('hat-band'),beanie=root.getObjectByName('hat-beanie');
  if(crown){crown.visible=style.hatKind!==1;crown.scale.y=style.hatKind===2?.72:1;}
  if(brim){brim.visible=style.hatKind!==1;brim.scale.setScalar(style.hatKind===2?.75:1);brim.position.z=style.hatKind===2?.1:0;}
  if(band)band.visible=style.hatKind!==1;
  if(beanie)beanie.visible=style.hatKind===1;
  root.userData.appearance=index;
}
