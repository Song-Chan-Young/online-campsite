import test from 'node:test';
import assert from 'node:assert/strict';
import {CampHub} from '../lib/camp-hub.mjs';
import {areaAt,areaOffset,transferAddress,consumeTransfer} from '../public/camp-world.mjs';
const socket=()=>({messages:[],send(raw){this.messages.push(JSON.parse(raw));}});
test('each camp circle belongs to its own room and the paths between belong to none',()=>{
 for(const viewer of [1,2,3])for(const room of [1,2,3]){
  const o=areaOffset(room,viewer);
  assert.equal(areaAt(o.x+3,o.z-2,viewer),room);
 }
 const a=areaOffset(2,1);assert.equal(areaAt(a.x/2,a.z/2,1),null);
});
test('a transfer keeps the same map spot in the new room and is consumed once',()=>{
 const o=areaOffset(2,1);
 const href=transferAddress('https://camp.example/?server=1&quiet=0',1,2,{x:o.x+1.5,z:o.z-2,seat:3});
 const url=new URL(href);assert.equal(url.searchParams.get('server'),'2');assert.equal(url.searchParams.get('enter'),'1');
 const {transfer,url:clean}=consumeTransfer(href);
 assert.deepEqual(transfer,{x:1.5,z:-2,seat:3});
 assert.ok(!new URL(clean).searchParams.has('at'));assert.ok(!new URL(clean).searchParams.has('seat'));
 assert.equal(consumeTransfer(clean).transfer,null);
 assert.equal(consumeTransfer(transferAddress(href,1,3,{x:0,z:0})).transfer.seat,null);
});
test('a camper who walked over is not given a chair they did not pick',()=>{
 const hub=new CampHub(),a=socket();
 hub.join(a,{room:'2',quiet:false,stand:true});
 assert.equal(a.spot,null);assert.equal(a.messages[0].spot,null);
 const b=socket();hub.join(b,{room:'2',quiet:false});assert.equal(b.spot,'seat:0');
});
