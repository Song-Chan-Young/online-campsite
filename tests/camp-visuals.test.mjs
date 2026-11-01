import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCampingChair} from '../public/camp-chair.mjs';
import {baseWoodPlacement} from '../public/camp-fire-layout.mjs';
import {createMarshmallowSkewer} from '../public/camp-skewer.mjs';
test('four chair shapes preserve the seated avatar height and have finite geometry',()=>{
 const bounds=[];
 for(const variant of ['classic','low','highback','log']){
  const chair=createCampingChair(T,variant);assert.equal(chair.userData.variant,variant);
  assert.equal(chair.userData.seatHeight,.47);
  const size=new T.Box3().setFromObject(chair).getSize(new T.Vector3());bounds.push(size.toArray().join(','));
  assert.ok(size.x<2 && size.z<1.5 && size.y<1.8);
  chair.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
 }
 assert.equal(new Set(bounds).size,4);
});
test('firewood is stacked horizontally in alternating layers inside the stone ring',()=>{
 for(let i=0;i<6;i++){
  const p=baseWoodPlacement(i);assert.ok(p.y<.7);assert.ok(p.length<=1.35);
  assert.equal(p.yaw,Math.floor(i/2)%2?Math.PI/2:0);
 }
 assert.ok(baseWoodPlacement(4).y>baseWoodPlacement(0).y);
});
test('a raised arm carries a visible marshmallow ahead of the hand',()=>{
 const arm=new T.Group();arm.rotation.x=-1.35;
 const prop=createMarshmallowSkewer(T);arm.add(prop.g);arm.updateMatrixWorld(true);
 const tip=prop.g.getObjectByName('mm');assert.ok(tip);
 const world=tip.getWorldPosition(new T.Vector3());assert.ok(world.z>1.2);assert.ok(Math.abs(world.y)<.5);
 const size=new T.Box3().setFromObject(tip).getSize(new T.Vector3());assert.ok(size.x>.14);
 assert.deepEqual(prop.steamParts,[]);
});

import {CampHub} from '../lib/camp-hub.mjs';
test('holding a marshmallow is shared, restored for new arrivals and cleared safely',()=>{
 const hub=new CampHub(),a={send(){}},b={messages:[],send(raw){this.messages.push(JSON.parse(raw));}};
 hub.join(a,{room:'1'});hub.join(b,{room:'1'});
 const state={type:'state',x:3,z:2,yaw:0,pose:'sit',spot:a.spot};
 hub.message(a,JSON.stringify({...state,held:'marshmallow'}));
 assert.equal(b.messages.at(-1).held,'marshmallow');
 assert.equal(hub.peer(a).held,'marshmallow');
 hub.message(a,JSON.stringify({...state,held:'unknown'}));assert.equal(hub.peer(a).held,null);
 hub.message(a,JSON.stringify({...state,held:'marshmallow',pose:'lie',spot:null}));assert.equal(hub.peer(a).held,null);
});
