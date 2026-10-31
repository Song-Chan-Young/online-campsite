import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CampHub} from '../lib/camp-hub.mjs';
import {applyAvatarStyle,avatarPalette} from '../public/avatar-style.mjs';
import {createCampingChair} from '../public/camp-chair.mjs';
test('room assigns unique shared appearances and preserves them through hibernation',()=>{
 const hub=new CampHub(),clients=[];
 for(let i=0;i<8;i++) {const c={messages:[],send(raw){this.messages.push(JSON.parse(raw));}};hub.join(c,{room:'1',visitor:`visitor-${i}`});clients.push(c);}
 assert.equal(new Set(clients.map(c=>c.appearance)).size,8);
 for(const c of clients)assert.equal(c.messages[0].appearance,c.appearance);
 const saved=hub.snapshot(clients[0]),restored=new CampHub();const c={send(){}};restored.restore(c,saved);
 assert.equal(restored.peer(c).appearance,saved.appearance);
});
test('one camper can change style without recoloring the template or another camper',()=>{
 const source=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0xffffff});material.name='hoodie';
 source.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material));
 const a=source.clone(true),b=source.clone(true);applyAvatarStyle(a,0);applyAvatarStyle(b,1);
 assert.notEqual(a.children[0].material,b.children[0].material);
 assert.equal(material.color.getHex(),0xffffff);
 assert.equal(a.children[0].material.color.getHex(),avatarPalette(0).hoodie);
 assert.equal(b.children[0].material.color.getHex(),avatarPalette(1).hoodie);
});
test('camping chair has finite geometry, padded fabric and folding frame',()=>{
 const chair=createCampingChair(THREE);assert.equal(chair.userData.kind,'camping-chair');
 const bounds=new THREE.Box3().setFromObject(chair);assert.ok(bounds.max.y>1);assert.ok(bounds.getSize(new THREE.Vector3()).x>.8);
 chair.traverse(node=>{if(node.isMesh)for(const n of node.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
});
