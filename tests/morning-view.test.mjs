import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

const source = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
// Evaluate the camera section, including its real state declarations and transitions.
const start = source.indexOf('let morningInside =');
const end = source.indexOf('// ---------- UI ----------', start);
assert.ok(start >= 0 && end > start, 'camera section must be present');
const cameraSource = source.slice(start, end);

function setup(server = 1) {
  const nodes = new Map(['wake-shade', 'add-log'].map(id => [id, {hidden: true, style: {}}]));
  const group = new THREE.Group();
  group.position.set(-4.3, 0.15, -3.2); group.lookAt(0, 0.15, 0);
  group.visible = server !== 2;
  const local = {sleepPos: new THREE.Vector3(0.13, 0.4, -1.03), awakePos: new THREE.Vector3(0.13, 0.96, -0.76), target: new THREE.Vector3(0, 0.63, 4.8)};
  group.updateWorldMatrix(true, false);
  const expected = Object.fromEntries(Object.entries(local).map(([key, value]) => [key, group.localToWorld(value.clone())]));
  const camera = new THREE.PerspectiveCamera(); camera.position.set(0, 3.2, 9);
  const controls = {target: new THREE.Vector3(0, 1, 0), enabled: true, minDistance: 3, maxPolarAngle: Math.PI * 0.495};
  const me = new THREE.Group(), myTag = new THREE.Group(), renderer = {domElement: {style: {filter: ''}}};
  const context = vm.createContext({THREE, SERVER: server, camera, controls, me, myTag, renderer,
    campTent: {group, interiorView: () => local}, fireWatching: true, camHold: true,
    document: {getElementById: id => nodes.get(id)},
  });
  vm.runInContext(cameraSource, context);
  return {context, camera, controls, me, myTag, renderer, group, expected, shade: nodes.get('wake-shade'), run: code => vm.runInContext(code, context)};
}
const near = (actual, expected) => assert.ok(actual.distanceTo(expected) < 1e-9, `${actual.toArray()} should equal ${expected.toArray()}`);

test('morning starts at the low interior camera and rises to the seated position before releasing controls', () => {
  const s = setup(); s.run('beginMorningView()');
  near(s.camera.position, s.expected.sleepPos); near(s.controls.target, s.expected.target);
  assert.equal(s.controls.enabled, false); assert.equal(s.shade.hidden, false);
  assert.equal(s.me.visible, false); assert.equal(s.myTag.visible, false);
  s.run('updateCam(2.75)');
  near(s.camera.position, s.expected.sleepPos.clone().lerp(s.expected.awakePos, 0.5));
  assert.ok(s.camera.position.y > s.expected.sleepPos.y); assert.equal(s.controls.enabled, false);
  assert.notEqual(s.renderer.domElement.style.filter, '');
  s.run('updateCam(2.75)');
  near(s.camera.position, s.expected.awakePos); near(s.controls.target, s.expected.target);
  assert.equal(s.controls.enabled, true); assert.equal(s.shade.hidden, true);
  assert.equal(s.renderer.domElement.style.filter, '');
  // Seated first-person view keeps the camper's own body/name out of the doorway.
  assert.equal(s.me.visible, false); assert.equal(s.myTag.visible, false);
});

test('leaving mid-wake restores the camper and clears camera effects without an old wake overriding the next view', () => {
  const s = setup();
  s.run('flyTo("stars"); beginMorningView(); updateCam(1); endMorningView()');
  assert.equal(s.controls.enabled, true); assert.equal(s.controls.minDistance, 3);
  assert.equal(s.shade.hidden, true); assert.equal(s.renderer.domElement.style.filter, '');
  assert.equal(s.me.visible, true); assert.equal(s.myTag.visible, true);
  const leftAt = s.camera.position.clone(); s.run('updateCam(10)'); near(s.camera.position, leftAt);
  s.run('flyTo("normal"); updateCam(2.4)'); near(s.camera.position, new THREE.Vector3(0, 3.2, 9));
  s.run('updateCam(10)'); near(s.camera.position, new THREE.Vector3(0, 3.2, 9));
});

test('morning can reopen after an interrupted wake and temporarily reveals the tent in the car camp', () => {
  const s = setup(2); assert.equal(s.group.visible, false);
  s.run('beginMorningView(); updateCam(2); endMorningView()'); assert.equal(s.group.visible, false);
  s.run('beginMorningView()'); assert.equal(s.group.visible, true);
  near(s.camera.position, s.expected.sleepPos); assert.equal(s.controls.enabled, false);
  s.run('updateCam(5.5)'); near(s.camera.position, s.expected.awakePos);
  assert.equal(s.controls.enabled, true); assert.equal(s.shade.hidden, true);
  s.run('endMorningView()'); assert.equal(s.group.visible, false); assert.equal(s.me.visible, true);
});
