import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import {safePosition,campRoute,safeWorldPosition,worldRoute} from '../public/camp-navigation.mjs';
import * as THREE from 'three';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
function walker(taken) {
  const parent = new THREE.Group(); parent.position.x = 10;
  const seats = [0,1,2,3].map(i => { const seat = new THREE.Group(); seat.position.x = i * 2; parent.add(seat); return seat; });
  const messages = [];
  const context = vm.createContext({
    THREE, held:null, SERVER:1,safePosition,campRoute,safeWorldPosition,worldRoute,walkWaypoints:[], seats, me:new THREE.Group(), pose:'stand', walkTo:null, walkSeat:null, walkLie:false,
    walkFacility:null, afterArrive:null, walkBoost:1, currentSpot:null, lieSpot:'mat', myId:1, slideRide:null,
    remotes:new Map(taken.map((spot,i) => [i+2,{spot}])), occupiedSpots:new Set(),
    walkable:()=>true, stopActivity(){}, toast(){}, WebSocket:{OPEN:1},
    chatWs:{readyState:1, send:data=>messages.push(JSON.parse(data))},
  });
  vm.runInContext(html.slice(html.indexOf('\nfunction startWalk(point') + 1, html.indexOf('function updateWalk(')) +
    html.slice(html.indexOf('function spotIsTaken('),html.indexOf('function presenceTick(')), context);
  return {context,seats,messages};
}

test('an occupied mat redirects walking to a free chair using world coordinates', () => {
  const {context,seats,messages} = walker(['lie:mat','seat:0']);
  context.startWalk(new THREE.Vector3(4,0,1), null, true);
  assert.equal(context.walkSeat, seats[1]);
  assert.equal(context.walkLie, false);
  assert.equal(context.walkTo.x, 12);
  assert.equal(context.currentSpot, 'seat:1');
  assert.equal(messages[0].spot, 'seat:1');
});
test('a full camp leaves the camper standing instead of walking into an occupied place', () => {
  const {context,messages} = walker(['lie:mat','seat:0','seat:1','seat:2','seat:3']);
  context.startWalk(new THREE.Vector3(4,0,1), null, true);
  assert.equal(context.walkTo, null);
  assert.equal(context.pose, 'stand');
  assert.equal(messages.length, 0);
});
