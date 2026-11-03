// A shallow summer reef, built once and animated without per-frame allocations.
export function createMarineLife(T,scene,a,dir,normal,length,beach){
 const group=new T.Group();group.name="summer-underwater-reef";scene.add(group);const swimmers=[],plants=[];
 const material=c=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.22,roughness:0.65});
 const sphere=new T.SphereGeometry(1,12,8);
 const mesh=(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;};
 const place=(g,s,d,y)=>g.position.copy(a).addScaledVector(dir,s).addScaledVector(normal,beach+d).setY(y);
 const eye=material(0x142335),green=material(0x268b60);
 const floor=new T.Mesh(new T.PlaneGeometry(length-4,14),material(0xc6b989));
 floor.rotation.x=-Math.PI/2;floor.rotation.z=-Math.atan2(dir.z,dir.x);place(floor,length/2,7,-2.5);group.add(floor);
 for(let i=0;i<90;i++){
  const g=new T.Group();group.add(g);place(g,3+(i*3.71)%(length-6),2+(i*1.31)%11,-2.45);
  for(let j=0;j<3;j++){const blade=mesh(g,new T.ConeGeometry(0.12,1.1+j*0.22,5),green,(j-1)*0.15,0.5,0);blade.rotation.z=(j-1)*0.23;}
  plants.push(g);
 }
 for(let i=0;i<96;i++){
  const g=new T.Group(),shark=i%32===0;group.add(g);
  const body=material(shark?0x738d9f:[0xffba44,0x35bddd,0xff786b,0xc6dd53][i%4]);
  mesh(g,sphere,body,0,0,0,shark?1.15:0.28,shark?0.32:0.13,shark?0.36:0.09);
  const tail=mesh(g,new T.ConeGeometry(shark?0.42:0.19,shark?0.55:0.25,3),body,shark?-1.15:-0.3,0,0);tail.rotation.z=-Math.PI/2;
  if(shark){mesh(g,new T.ConeGeometry(0.3,0.6,3),body,0,0.38,0);for(const side of [-1,1]){const fin=mesh(g,new T.ConeGeometry(0.3,0.65,3),body,0,-0.03,side*0.38);fin.rotation.x=side*1.1;}}
  for(const side of [-1,1])mesh(g,sphere,eye,shark?0.85:0.18,0.05,side*(shark?0.25:0.075),0.035,0.035,0.035);
  swimmers.push({g,tail,s:4+(i*2.37)%(length-8),d:shark?7:3+(i*1.73)%8,y:shark?-1.1:-0.65-(i%4)*0.3,phase:i,speed:shark?0.23:0.5+i%3*0.16});
 }
 for(let i=0;i<16;i++){
  const oct=new T.Group();group.add(oct);place(oct,3+i*(length-6)/16,3+i%3*3,-2.15);
  const purple=material(i%2?0xde789d:0x9a70ce);mesh(oct,sphere,purple,0,0.26,0,0.3,0.38,0.28);
  for(let k=0;k<8;k++){const angle=k*Math.PI/4,points=[];for(let n=0;n<6;n++){const r=n*0.13;points.push(new T.Vector3(Math.cos(angle)*r,-0.05-Math.sin(n/5*Math.PI)*0.12,Math.sin(angle)*r));}oct.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,0.055,6,false),purple));}
  for(const x of [-0.12,0.12])mesh(oct,sphere,eye,x,0.32,0.25,0.05,0.06,0.035);
 }
 const rockMat=material(0x718e91);
 for(let i=0;i<48;i++){
  const rock=mesh(group,new T.DodecahedronGeometry(1,0),rockMat,0,0,0,0.3+(i%4)*0.18,0.25+(i%3)*0.2,0.4+(i%5)*0.12);
  place(rock,2+(i*2.19)%(length-4),1+(i*1.61)%12,-2.3);rock.rotation.set(i*.3,i*1.7,i*.2);rock.name='reef-rock';
 }
 const reefLight=new T.HemisphereLight(0x9defff,0x718e65,2);group.add(reefLight);
 group.visible=false;
 return {group,update(t,summer){group.visible=summer;if(!summer)return;plants.forEach((p,i)=>{p.rotation.x=Math.sin(t*1.3+i)*0.1;p.rotation.z=Math.cos(t+i)*0.09;});for(const f of swimmers){const phase=t*f.speed+f.phase;place(f.g,f.s+Math.sin(phase)*2,f.d+Math.cos(phase)*0.7,f.y+Math.sin(t+f.phase)*0.1);f.g.rotation.y=-Math.atan2(dir.z*Math.cos(phase)*2-normal.z*Math.sin(phase)*0.7,dir.x*Math.cos(phase)*2-normal.x*Math.sin(phase)*0.7);f.tail.rotation.y=Math.sin(t*6+f.phase)*0.3;}}};
}
