import test from 'node:test';
import assert from 'node:assert/strict';
import { createTapGesture, entryRedirect, consumeEntry } from '../public/interactions.mjs';
const event = (id, x, y, type = 'touch', time = 0) => ({ pointerId: id, clientX: x, clientY: y, pointerType: type, button: 0, timeStamp: time });

test('a short touch with normal finger jitter still moves', () => {
  const gesture = createTapGesture();
  gesture.down(event(1, 100, 100));
  gesture.move(event(1, 107, 103, 'touch', 60));
  assert.equal(gesture.up(event(1, 108, 104, 'touch', 120)), true);
});
test('a swipe returning to its origin is never treated as a tap', () => {
  const gesture = createTapGesture();
  gesture.down(event(1, 100, 100));
  gesture.move(event(1, 160, 100));
  assert.equal(gesture.up(event(1, 100, 100, 'touch', 150)), false);
});
test('lifting either finger after a pinch never starts walking', () => {
  const gesture = createTapGesture();
  gesture.down(event(1, 100, 100));
  gesture.down(event(2, 150, 100));
  assert.equal(gesture.up(event(1, 100, 100)), false);
  assert.equal(gesture.up(event(2, 150, 100)), false);
  gesture.down(event(3, 10, 10));
  assert.equal(gesture.up(event(3, 10, 10)), true);
});
test('cancelled and long-held gestures do not walk', () => {
  const gesture = createTapGesture();
  gesture.down(event(1, 10, 10));
  gesture.cancel(event(1, 10, 10));
  assert.equal(gesture.up(event(1, 10, 10)), false);
  gesture.down(event(2, 10, 10));
  assert.equal(gesture.up(event(2, 10, 10, 'touch', 1000)), false);
});
test('mouse clicks stay precise and right clicks do not move', () => {
  const gesture = createTapGesture();
  gesture.down(event(1, 10, 10, 'mouse'));
  assert.equal(gesture.up(event(1, 12, 10, 'mouse')), true);
  gesture.down(event(1, 10, 10, 'mouse'));
  assert.equal(gesture.up(event(1, 18, 10, 'mouse')), false);
  gesture.down({...event(1, 10, 10, 'mouse'), button: 2});
  assert.equal(gesture.up({...event(1, 10, 10, 'mouse'), button: 2}), false);
});
test('selecting another room continues entry once and cleans the shared URL', () => {
  const redirect = entryRedirect('https://camp.example/?server=1', 3);
  const firstLoad = consumeEntry(redirect);
  assert.equal(new URL(firstLoad.url).searchParams.get('server'), '3');
  assert.equal(firstLoad.enter, true);
  const nextLoad = consumeEntry(firstLoad.url);
  assert.equal(nextLoad.enter, false);
  assert.equal(new URL(firstLoad.url).searchParams.has('enter'), false);
});
