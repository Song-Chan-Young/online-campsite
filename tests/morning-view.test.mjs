import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {overviewView} from '../public/camp-overview.mjs';

const source = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
// Evaluate the camera section, including its real state declarations and transitions.
const start = source.indexOf('let morningInside =');
const end = source.indexOf('// ---------- UI ----------', start);
assert.ok(start >= 0 && end > start, 'camera section must be present');
const cameraSource = source.slice(start, end);

function setup(server = 1) {
  const nodes = new Map(['wake-shade', 'add-log','view-overview','view-store','view-home'].map(id => [id, {hidden: true, style: {},setAttribute(){}}]));
  const group = new THREE.Group();
  group.position.set(-4.3, 0.15, -3.2); group.lookAt(0, 0.15, 0);
  group.visible = server !== 2;
  const local = {sleepPos: new THREE.Vector3(0.13, 0.4, -1.03), awakePos: new THREE.Vector3(0.13, 0.96, -0.76), target: new THREE.Vector3(0, 0.63, 4.8)};
  group.updateWorldMatrix(true, false);
  const expected = Object.fromEntries(Object.entries(local).map(([key, value]) => [key, group.localToWorld(value.clone())]));
  const camera = new THREE.PerspectiveCamera(); camera.position.set(0, 3.2, 9);
  const controls = {target: new THREE.Vector3(0, 1, 0), enabled: true, minDistance: 3, maxPolarAngle: Math.PI * 0.495,addEventListener(){}};
  const me = new THREE.Group(), myTag = new THREE.Group(), renderer = {domElement: {style: {filter: ''}}};
  const context = vm.createContext({THREE, SERVER: server, camera, controls, me, myTag, renderer,
    spotIsTaken:()=>false,toast(){},stopActivity(){},sendPresenceNow(){},faceToward(){},walkTo:null,walkWaypoints:[],walkSeat:null,walkLie:false,afterArrive:null,walkFacility:null,pose:'sit',lieSpot:'mat',currentSpot:'seat:0',
    overviewView, MAP_MIN:new THREE.Vector3(-50,0,-40),MAP_MAX:new THREE.Vector3(20,0,30),
    campTent: {group, interiorView: () => local}, fireWatching: true, camHold: true,
    document: {getElementById: id => nodes.get(id)},
  });
  vm.runInContext(cameraSource, context);
  return {context, camera, controls, me, myTag, renderer, group, expected, shade: nodes.get('wake-shade'), run: code => vm.runInContext(code, context)};
}
const near = (actual, expected) => assert.ok(actual.distanceTo(expected) < 1e-9, `${actual.toArray()} should equal ${expected.toArray()}`);

test('morning preserves the forest-facing first-person view while sharing the lying avatar position',()=>{
 const s=setup();s.run('beginMorningView()');
 near(s.camera.position,s.expected.sleepPos);near(s.controls.target,s.expected.target);
 assert.equal(s.me.visible,false);assert.equal(s.myTag.visible,false);
 assert.equal(s.context.pose,'lie');assert.equal(s.context.currentSpot,'lie:tent');assert.equal(s.context.lieSpot,'tent');
 const local=s.group.worldToLocal(s.me.position.clone());assert.ok(Math.abs(local.x)<1.5&&Math.abs(local.z)<1.6);
 assert.equal(s.context.walkTo,null);s.run('updateCam(5.5)');
 near(s.camera.position,s.expected.awakePos);assert.equal(s.controls.enabled,true);assert.equal(s.shade.hidden,true);assert.equal(s.me.visible,false);
});
test('leaving the tent view restores the avatar and clears the old wake transition',()=>{
 const s=setup();s.run('beginMorningView(); updateCam(1); endMorningView(); flyTo("normal"); updateCam(2.4)');
 near(s.camera.position,new THREE.Vector3(0,3.2,9));assert.equal(s.me.visible,true);assert.equal(s.shade.hidden,true);
 s.run('updateCam(10)');near(s.camera.position,new THREE.Vector3(0,3.2,9));
});
test('the tent stays visible to other campers after the local morning view ends',()=>{
 const s=setup(2);s.run('beginMorningView(); updateCam(5.5)');assert.equal(s.group.visible,true);assert.equal(s.me.visible,false);
 s.run('endMorningView()');assert.equal(s.group.visible,true);assert.equal(s.me.visible,true);
});
