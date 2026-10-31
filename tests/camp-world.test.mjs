import test from 'node:test';
import assert from 'node:assert/strict';
import {CampHub} from '../lib/camp-hub.mjs';
import {CampRoom} from '../cloud/worker.mjs';
import {areaOffset,worldPacket} from '../public/camp-world.mjs';
const socket=()=>({messages:[],send(raw){this.messages.push(JSON.parse(raw));}});
test('watchers see real peers and live actions without counting as visitors or taking chairs',()=>{
 const hub=new CampHub(),a=socket(),b=socket(),watch=socket();
 hub.join(a,{room:'2',quiet:false});hub.watch(watch,{room:'2'});hub.join(b,{room:'2',quiet:false});
 assert.equal(watch.messages[0].type,'watch');assert.equal(watch.messages[0].peers[0].id,a.id);
 assert.equal(watch.messages.at(-1).type,'join');assert.equal(b.spot,'seat:1');assert.equal(hub.getPresence().total,2);
 hub.message(a,JSON.stringify({type:'chat',text:'같이 쉬어요'}));assert.equal(watch.messages.at(-1).text,'같이 쉬어요');
 hub.message(watch,JSON.stringify({type:'chat',text:'fake'}));assert.ok(!a.messages.some(m=>m.text==='fake'));
 hub.leave(a);assert.equal(watch.messages.at(-1).type,'leave');hub.leave(watch);assert.equal(hub.watchers.size,0);
});
test('cross-area IDs and reservations cannot collide, and map coordinates are reversible',()=>{
 const p={type:'state',id:1,spot:'seat:0',x:2,z:3,yaw:1,pose:'sit',appearance:3};
 const a=worldPacket(p,2,1),b=worldPacket(p,3,1);
 assert.notEqual(a.id,b.id);assert.notEqual(a.spot,p.spot);assert.equal(a.pose,'sit');
 const off=areaOffset(2,1);assert.equal(a.x,p.x+off.x);assert.equal(a.z,p.z+off.z);
 assert.equal(areaOffset(1,2).x,-off.x);assert.equal(areaOffset(1,2).z,-off.z);
 assert.equal(worldPacket(p,1,1).id,1);
});
test('hibernating watcher restores without becoming a camper or accepting state',async()=>{
 const s={readyState:1,send(){},deserializeAttachment:()=>({watch:true,room:'3'}),serializeAttachment(){}};
 const room=new CampRoom({getWebSockets:()=>[s],storage:{get:async()=>null},blockConcurrencyWhile:fn=>fn()});await room.ready;
 assert.equal(room.hub.getPresence().total,0);assert.equal(room.hub.watchers.size,1);
 await room.webSocketMessage(s,JSON.stringify({type:'state',x:4,z:3,yaw:0,pose:'stand'}));assert.equal(room.hub.getPresence().total,0);
 room.webSocketClose(s);assert.equal(room.hub.watchers.size,0);
});
