import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { EXTRA_GEAR, createGearProp, recommendedGearIds } from '../public/camp-catalog.mjs';

test('catalog contains at least thirty additional usable camping gear types',()=>{
 assert.ok(Object.keys(EXTRA_GEAR).length>=30);
 for(const [id,item] of Object.entries(EXTRA_GEAR)){
  assert.equal(item.cat,'gear');assert.equal(item.place,true);assert.equal(item.model,id);
  assert.ok(item.seasons.length);assert.ok(item.use.length>8);
 }
});
test('seasonal recommendations promote cooling in summer and heating in winter without hiding gear',()=>{
 const summer=recommendedGearIds(EXTRA_GEAR,'summer'), winter=recommendedGearIds(EXTRA_GEAR,'winter');
 assert.ok(summer.indexOf('fan')<summer.indexOf('heater'));
 assert.ok(winter.indexOf('heater')<winter.indexOf('fan'));
 assert.equal(summer.length,Object.keys(EXTRA_GEAR).length);
 assert.equal(recommendedGearIds(EXTRA_GEAR,'unknown').length,summer.length);
});
test('every gear creates bounded native geometry with valid world transforms and working interactions',()=>{
 for(const id of Object.keys(EXTRA_GEAR)){
  const prop=createGearProp(THREE,id);assert.ok(prop.group instanceof THREE.Group,id);
  prop.group.updateMatrixWorld(true);let meshes=0;
  prop.group.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.count>0,id);assert.ok(o.matrixWorld.elements.every(Number.isFinite),id);}});
  assert.ok(meshes>0&&meshes<40,`${id}: ${meshes}`);
  assert.equal(typeof prop.interact(),'string');prop.update(1);prop.interact();prop.dispose();
 }
 assert.equal(createGearProp(THREE,'unknown'),null);
});
test('powered gear changes visible glow and fan rotates only when on',()=>{
 const heater=createGearProp(THREE,'heater');
 const emitter=heater.group.children.find(o=>o.material?.emissive?.getHex()>0);
 assert.equal(emitter.material.emissiveIntensity,.08);heater.interact();assert.equal(emitter.material.emissiveIntensity,1.8);heater.interact();assert.equal(emitter.material.emissiveIntensity,.08);
 const fan=createGearProp(THREE,'fan'), blades=fan.group.children.find(o=>o instanceof THREE.Group);
 fan.update(1);assert.equal(blades.rotation.z,0);fan.interact();fan.update(2);assert.equal(blades.rotation.z,14);
 heater.dispose();fan.dispose();
});
