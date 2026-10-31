import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {flameParticle,createCampfireFlames} from '../public/flame-particles.mjs';
test('fire particles rise, taper, animate and remain finite at low and high intensity',()=>{
 for(const time of [0,.25,4,1000])for(const strength of [.35,1])for(let i=0;i<360;i++) {
  const p=flameParticle(i,time,strength);
  for(const value of Object.values(p))assert.ok(Number.isFinite(value));
  assert.ok(p.y>=.17 && p.y<2.83);assert.ok(p.size>0);assert.ok(p.alpha>=0);
 }
 assert.notDeepEqual(flameParticle(3,1,.5),flameParticle(3,1.1,.5));
 assert.ok(flameParticle(3,1,1).y>flameParticle(3,1,.35).y);
});
test('the real renderer updates visible particle buffers without DOM image dependencies',()=>{
 const fire=createCampfireFlames(THREE);fire.update(2,.8,new THREE.PerspectiveCamera(55));
 assert.equal(fire.group.children[0].isPoints,true);
 const geometry=fire.group.children[0].geometry;
 assert.equal(geometry.getAttribute('position').count,360);
 assert.ok(geometry.getAttribute('position').array.some(n=>n>1));
});
