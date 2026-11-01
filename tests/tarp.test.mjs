import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createWaterproofTarp,createAreaRainTarp,createCampRainTarps} from '../public/camp-tarp.mjs';
import {createRain} from '../public/camp-rain.mjs';
test('tarp has a sloping roof, support poles and a dry area in world coordinates',()=>{
 const tarp=createWaterproofTarp(T);tarp.group.position.set(-4.5,0,3.6);
 assert.ok(tarp.roofHeight(-4.5,3.6)>2.8);
 assert.ok(tarp.roofHeight(-4.5,5.4)<tarp.roofHeight(-4.5,3.6));
 assert.equal(tarp.roofHeight(0,0),null);
 const bounds=new T.Box3().setFromObject(tarp.group);assert.ok(bounds.max.y<3.2);
 tarp.group.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
});
test('rain is clipped at the tarp roof and remains visible outside it',()=>{
 const tarp={roofHeight(x,z){return x<0?2.95:null;}},rain=createRain(T);rain.setEnabled(true);
 rain.update(1,{x:0,z:0},[tarp]);const p=rain.object.geometry.attributes.position;
 let inside=0,outside=0;
 for(let i=0;i<p.count;i+=2){const roof=tarp.roofHeight(p.getX(i),p.getZ(i));
  if(roof!==null){inside++;assert.ok(p.getY(i)>=roof-1e-5);assert.ok(p.getY(i+1)>=roof-1e-5);}
  else outside++;
 }
 assert.ok(inside>0 && outside>0);
});

test('large A-1 tarp automatically follows rainy weather in every viewer area',()=>{
 for(const offset of [{x:0,z:0},{x:-2.56,z:17.12},{x:50.72,z:9.76}]){
  const tarp=createAreaRainTarp(T,offset);assert.equal(tarp.group.visible,false);
  tarp.setSeason('rain');assert.equal(tarp.group.visible,true);
  for(const [x,z] of [[-4.3,-3.2],[-7,-6],[7,6],[0,0]])assert.ok(tarp.roofHeight(x+offset.x,z+offset.z)>5);
  for(const key of ['spring','summer','autumn','winter']){tarp.setSeason(key);assert.equal(tarp.group.visible,false);assert.equal(tarp.roofHeight(offset.x,offset.z),null);}
  tarp.setSeason('rain');assert.ok(tarp.roofHeight(offset.x,offset.z)>5);
 }
});

import {areaOffset,CAMP_AREAS} from '../public/camp-areas.mjs';
test('all three camps are covered in rain from every viewer, including the car tent',()=>{
 for(const viewer of [1,2,3]){
  const tarps=createCampRainTarps(T,viewer);assert.equal(tarps.length,3);
  for(const [index,tarp] of tarps.entries()){
   const room=index+1,offset=areaOffset(room,viewer),tent=CAMP_AREAS[room].tent;
   tarp.setSeason('rain');assert.equal(tarp.group.visible,true);
   assert.ok(tarp.roofHeight(offset.x,offset.z)>5);
   assert.ok(tarp.roofHeight(offset.x+tent[0],offset.z+tent[1])>5);
   tarp.setSeason('summer');assert.equal(tarp.group.visible,false);
  }
 }
});
