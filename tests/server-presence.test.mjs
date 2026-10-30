import test from 'node:test';
import assert from 'node:assert/strict';
import { CampHub } from '../lib/camp-hub.mjs';

function roomServer() {
  const hub = new CampHub();
  return {
    join(room) {
      const socket = {messages: [], send(raw) {this.messages.push(JSON.parse(raw));},
        sendState(spot, pose='walk') {hub.message(this, JSON.stringify({type:'state',x:1,z:2,yaw:0,pose,spot}));},
        disconnect() {hub.leave(this);},
      };
      hub.join(socket,{room});
      return socket;
    },
  };
}

test('initial campers receive unique seats; another room can reuse those seats', () => {
  const server = roomServer();
  const a = server.join('1'), b = server.join('1'), c = server.join('2');
  assert.equal(a.messages[0].spot, 'seat:0');
  assert.equal(b.messages[0].spot, 'seat:1');
  assert.equal(c.messages[0].spot, 'seat:0');
  assert.equal(b.messages[0].peers[0].spot, 'seat:0');
});
test('a taken mat is rejected; a new claim succeeds once its owner leaves', () => {
  const server = roomServer();
  const a = server.join('1'), b = server.join('1');
  a.sendState('lie:mat');
  b.sendState('lie:mat');
  assert.equal(b.messages.at(-1).type, 'spot-busy');
  assert.equal(b.messages.at(-1).occupied.includes('lie:mat'), true);
  assert.equal(b.spot, 'seat:1');
  a.disconnect();
  b.sendState('lie:mat', 'lie');
  assert.equal(b.spot, 'lie:mat');
  assert.equal(b.state.pose, 'lie');
  const c = server.join('1');
  assert.equal(c.messages[0].peers.find(p => p.id === b.id).pose, 'lie');
});
test('a full camp enters standing instead of overlapping a seated camper', () => {
  const server = roomServer();
  for (let i = 0; i < 4; i++) server.join('1');
  const last = server.join('1');
  assert.equal(last.messages[0].spot, null);
});
test('rate-limited states do not change a reservation without broadcasting it', () => {
  const server = roomServer();
  const a = server.join('1');
  for (let i = 0; i < 20; i++) a.sendState('seat:0');
  a.sendState('lie:mat');
  assert.equal(a.spot, 'seat:0');
});
