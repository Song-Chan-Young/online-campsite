import test from 'node:test';
import assert from 'node:assert/strict';
import {safePosition,camperPosition,campRoute} from '../public/camp-navigation.mjs';
import {CampHub} from '../lib/camp-hub.mjs';
test('unreported peers spawn at their assigned chair, never in the fire',()=>{
 const hub=new CampHub();const a={send(){}};hub.join(a);const p=hub.peer(a);
 assert.ok(Math.hypot(p.x,p.z)>3);assert.equal(p.pose,'sit');
 assert.ok(Math.hypot(...Object.values(safePosition(0,0)))>=2);
 assert.ok(Math.hypot(camperPosition({id:4}).x,camperPosition({id:4}).z)>3);
});
test('opposite-side walking routes keep every segment outside the fire',()=>{
 let prev={x:4,z:0};for(const p of campRoute(prev,{x:-4,z:0})){
 for(let i=0;i<=100;i++){const k=i/100;assert.ok(Math.hypot(prev.x+(p.x-prev.x)*k,prev.z+(p.z-prev.z)*k)>=1.99);}
 prev=p;
 }assert.equal(prev.x,-4);
});
test('additional resting spots reserve independently and preserve their identity',()=>{
 const hub=new CampHub();for(const spot of ['mat2','mat3','tent']){
 const c={send(){}};hub.join(c);hub.message(c,JSON.stringify({type:'state',x:-4,z:-3,yaw:0,pose:'lie',lieSpot:spot,spot:`lie:${spot}`}));
 assert.equal(c.spot,`lie:${spot}`);assert.equal(c.state.lieSpot,spot);
 }
});
