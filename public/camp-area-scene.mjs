import {createCampingChair} from './camp-chair.mjs';
import {baseWoodPlacement} from './camp-fire-layout.mjs';
import {CAMP_SEATS,FIRE_SCALE,fireSurge} from './camp-circle.mjs';
import {createCampfireFlames,createBurningWood} from './camp-fire.mjs';
// Other areas use their own fire resources, so adding local logs cannot dispose them.
export function createAreaScene(THREE,{offset,chair,tent,tentPosition,restSpots=[]}){
 const group=new THREE.Group();group.position.set(offset.x,0,offset.z);
 for(const [index,seat] of CAMP_SEATS.entries()){const ch=createCampingChair(THREE,['classic','low','highback','log'][index%4]);ch.position.set(seat.x,0,seat.z);ch.lookAt(0,0,0);group.add(ch);}
 if(tent){const copy=tent.clone(true);copy.visible=true;copy.position.set(tentPosition[0],.15,tentPosition[1]);group.add(copy);}
 for(const spot of restSpots)group.add(spot.clone(true));
 const fire=new THREE.Group();fire.scale.setScalar(FIRE_SCALE);group.add(fire);
 const flame=createCampfireFlames(THREE);fire.add(flame.group);
 const wood=[];
 for(let i=0;i<6;i++){
  const p=baseWoodPlacement(i),burn=createBurningWood(THREE,i*3);
  const log=new THREE.Mesh(new THREE.CylinderGeometry(p.radius*.85,p.radius,p.length,16,8),burn.material);
  log.position.set(p.x,p.y,p.z);log.rotation.set(0,p.yaw,Math.PI/2);fire.add(log);wood.push(burn);
 }
 const stoneMat=new THREE.MeshStandardMaterial({color:0x77736c,roughness:1});
 for(let i=0;i<10;i++){const a=i*Math.PI/5,stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.2,0),stoneMat);stone.position.set(Math.cos(a)*.75,.1,Math.sin(a)*.75);fire.add(stone);}
 const light=new THREE.PointLight(0xff8a3a,20,24,1.4);light.position.set(0,1,0);group.add(light);
 let surgedAt=-100;
 return {group,surge(t){surgedAt=t;},update(t,camera){const surge=fireSurge(t-surgedAt);flame.group.scale.set(1+surge*.25,1+surge*.5,1+surge*.25);flame.update(t,.85+surge*.15,camera);light.intensity=20+surge*14;for(let i=0;i<wood.length;i++)wood[i].update(65+i*12+(t%60),.85,t);}};
}
