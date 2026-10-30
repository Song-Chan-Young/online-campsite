import test from 'node:test';
import assert from 'node:assert/strict';
import { claimSpot, firstFreeSpot } from '../lib/spots.mjs';

test('two people cannot reserve the same chair, even before arriving', () => {
  const a = {room:'1', spot:null}, b = {room:'1', spot:null};
  const clients = new Set([a,b]);
  assert.equal(claimSpot(a, 'seat:0', clients), true);
  assert.equal(claimSpot(b, 'seat:0', clients), false);
  assert.equal(b.spot, null);
  assert.equal(firstFreeSpot(b, ['seat:0','seat:1'], clients), 'seat:1');
});
test('different rooms may use the same spot', () => {
  const a = {room:'1', spot:'lie:mat'}, b = {room:'2', spot:null};
  assert.equal(claimSpot(b, 'lie:mat', new Set([a,b])), true);
});
test('walking away and disconnecting make the spot available', () => {
  const a = {room:'1', spot:'lie:mat'}, b = {room:'1', spot:null};
  const clients = new Set([a,b]);
  assert.equal(claimSpot(a, null, clients), true);
  assert.equal(claimSpot(b, 'lie:mat', clients), true);
  clients.delete(b);
  assert.equal(claimSpot(a, 'lie:mat', clients), true);
});
test('failed claims keep the current reservation; full rooms have no free chair', () => {
  const a = {room:'1', spot:'seat:0'}, b = {room:'1', spot:'seat:1'};
  const clients = new Set([a,b]);
  assert.equal(claimSpot(b, 'seat:0', clients), false);
  assert.equal(b.spot, 'seat:1');
  assert.equal(firstFreeSpot({room:'1'}, ['seat:0','seat:1'], clients), null);
});
test('invalid spot identifiers cannot reserve or release a valid spot', () => {
  const a = {room:'1', spot:'seat:0'};
  for (const spot of ['', {}, 'seat:999', '__proto__', 'lie:missing']) {
    assert.equal(claimSpot(a, spot, new Set([a])), false);
    assert.equal(a.spot, 'seat:0');
  }
});
