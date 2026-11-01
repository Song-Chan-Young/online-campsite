import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRain} from '../public/camp-rain.mjs';

test('rain switches off and reuses its geometry when enabled again',()=>{
 const rain=createRain(THREE);const geometry=rain.object.geometry;
 assert.equal(rain.object.visible,false);
 rain.setEnabled(true);assert.equal(rain.object.visible,true);
 rain.setEnabled(false);assert.equal(rain.object.visible,false);
 rain.setEnabled(true);assert.equal(rain.object.geometry,geometry);
});
test('rain falls in streaks and stays around the camera after long frames',()=>{
 const rain=createRain(THREE);rain.setEnabled(true);
 rain.update(.016,{x:100,z:-100});
 const positions=rain.object.geometry.attributes.position;
 const y=positions.getY(0);
 rain.update(.01,{x:100,z:-100});
 assert.ok(positions.getY(0)<y || y<.3);
 rain.update(120,{x:-200,z:300});
 for(let i=0;i<positions.count;i+=2){
  assert.ok(Math.abs(positions.getX(i)+200)<=26);
  assert.ok(Math.abs(positions.getZ(i)-300)<=26);
  assert.ok(positions.getY(i)>=0 && positions.getY(i)<16);
  assert.ok(positions.getY(i+1)>positions.getY(i));
 }
 rain.setEnabled(false);const before=positions.array.slice();rain.update(1,{x:0,z:0});
 assert.deepEqual(positions.array,before);
});

test('heavy rain uses dense long streaks outside shelters',()=>{
 const rain=createRain(THREE);rain.setEnabled(true);rain.update(.01,{x:0,z:0});
 const p=rain.object.geometry.attributes.position;assert.ok(p.count>=6000);
 for(let i=0;i<p.count;i+=2)assert.ok(p.getY(i+1)-p.getY(i)>.8);
});
