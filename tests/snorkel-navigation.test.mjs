import test from 'node:test';
import assert from 'node:assert/strict';
import {snorkelDestination} from '../public/snorkel-navigation.mjs';
const target=(p,r)=>snorkelDestination(p,r,{x:0,z:0},{x:1,z:0},{x:0,z:1},40,5,14);
test('underwater tap moves forward and side taps steer the swimmer',()=>{
 assert.deepEqual(target({x:20,z:10},{x:0,z:1}),{x:20,z:14});
 assert.deepEqual(target({x:20,z:10},{x:1,z:0}),{x:24,z:10});
});
test('swim taps stay within shore ends and buoy boundary',()=>{
 const p=target({x:37,z:18},{x:1,z:1});assert.ok(p.x<=37.8&&p.z<=18.7);
 assert.equal(target({x:20,z:10},{x:0,z:0}),null);
});
