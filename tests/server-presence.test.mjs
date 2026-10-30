import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { claimSpot, firstFreeSpot } from '../lib/spots.mjs';

// Exercise the production handlers with only the network transport replaced;
// this environment does not permit opening a listening socket.
function roomServer() {
  let transport;
  class Transport extends EventEmitter {
    constructor() { super(); this.clients = new Set(); transport = this; }
  }
  const source = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('const ADJ ='), source.indexOf('// 끊긴 연결 정리')), {
    server: {}, WebSocketServer: Transport, claimSpot, firstFreeSpot,
    URL, console: { log() {} },
  });
  return {
    join(room) {
      const socket = new EventEmitter();
      Object.assign(socket, { OPEN: 1, readyState: 1, messages: [],
        send(message) { this.messages.push(JSON.parse(message)); },
        sendState(spot, pose = 'walk') { this.emit('message', Buffer.from(JSON.stringify({type:'state', x:1, z:2, yaw:0, pose, spot})), false); },
        disconnect() { transport.clients.delete(this); this.emit('close'); },
      });
      transport.clients.add(socket);
      transport.emit('connection', socket, { url: '/chat?server=' + room });
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
