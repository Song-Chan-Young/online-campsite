import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWaterSlide} from '../public/camp-slide.mjs';
function fixture(offset=new THREE.Vector3()) {
  const start=new THREE.Vector3(0,0,0).add(offset),end=new THREE.Vector3(40,0,0).add(offset);
  return createWaterSlide(THREE,{start,end,normal:new THREE.Vector3(0,0,1),beachWidth:5});
}
test('slide begins on an elevated land platform and finishes inside the swimming strip',()=>{
  const s=fixture();assert.ok(s.entry.z<4.6);assert.equal(s.entry.y,0);
  assert.ok(Math.abs(s.top.y-2.5)<0.01);assert.ok(s.top.z<0);
  assert.ok(s.pointAt(0).distanceTo(s.top)<1e-8);assert.ok(s.pointAt(1).distanceTo(s.landing)<1e-8);
  assert.ok(s.landing.z>5&&s.landing.z<19);assert.ok(s.landing.x>2&&s.landing.x<38);
  assert.ok(Math.abs(s.landing.y-0.1)<0.01);
  let meshes=0;s.group.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes>5);
});
test('ride points descend continuously with finite unit tangents and clamp at endpoints',()=>{
  const s=fixture();let previous=Infinity;
  for(let i=0;i<=100;i++) {
    const p=s.pointAt(i/100),t=s.tangentAt(i/100);
    assert.ok(p.toArray().every(Number.isFinite));assert.ok(t.toArray().every(Number.isFinite));
    assert.ok(Math.abs(t.length()-1)<1e-8);assert.ok(p.y<=previous+1e-8);previous=p.y;
  }
  assert.ok(s.pointAt(-10).distanceTo(s.top)<1e-8);assert.ok(s.pointAt(10).distanceTo(s.landing)<1e-8);
  assert.ok(s.tangentAt(-1).distanceTo(s.tangentAt(0))<1e-8);
});
test('returned coordinates and visible slide transform together with translated shoreline inputs',()=>{
  const a=fixture(),offset=new THREE.Vector3(-30,0,12),b=fixture(offset);
  for(const key of ['entry','top','landing'])assert.ok(b[key].clone().sub(offset).distanceTo(a[key])<1e-8);
  for(const t of [0,.25,.5,.75,1])assert.ok(b.pointAt(t).sub(offset).distanceTo(a.pointAt(t))<1e-8);
  const bounds=new THREE.Box3().setFromObject(b.group);assert.ok(bounds.containsPoint(b.top));
});
test('the campsite diagonal shore keeps the ladder on the walkable map and landing in its real swim zone',()=>{
  const mw=(x,z)=>new THREE.Vector3((x-372)*.16,0,(z-268)*.16);
  const start=mw(195,448),end=mw(448,322),dir=end.clone().sub(start).normalize();
  const normal=new THREE.Vector3(-dir.z,0,dir.x);if(normal.z<0)normal.negate();
  const s=createWaterSlide(THREE,{start,end,normal,beachWidth:5});
  const relative=p=>({d:p.clone().sub(start).dot(normal),along:p.clone().sub(start).dot(dir)});
  const entry=relative(s.entry),landing=relative(s.landing),min=mw(12,12),max=mw(448,448);
  assert.ok(entry.d<4.6);assert.ok(s.entry.x>min.x+.6&&s.entry.x<max.x-.6);
  assert.ok(s.entry.z>min.z+.6&&s.entry.z<max.z-.6);
  assert.ok(landing.d>=4.6&&landing.d<19);assert.ok(landing.along>2&&landing.along<start.distanceTo(end)-2);
});
