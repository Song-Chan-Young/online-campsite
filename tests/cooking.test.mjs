import test from 'node:test';
import assert from 'node:assert/strict';
import {createCooking} from '../public/camp-cooking.mjs';

test('cooking requires equipment, reserves one ingredient, and serves only after ready',()=>{
  let time=1000;const cooking=createCooking({now:()=>time});
  const bag={rawmeat:2};
  assert.equal(cooking.start('bbq',bag,{}).ok,false);assert.equal(bag.rawmeat,2);
  assert.equal(cooking.start('bbq',bag,{grill:1}).ok,true);assert.equal(bag.rawmeat,1);
  assert.equal(cooking.start('bbq',bag,{grill:1}).ok,false);assert.equal(bag.rawmeat,1);
  assert.equal(cooking.serve('grill',bag).ok,false);assert.equal(bag.barbecue,undefined);
  time+=16000;
  assert.equal(cooking.status('grill').ready,true);
  assert.equal(cooking.serve('grill',bag).ok,true);assert.equal(bag.barbecue,1);
  assert.equal(cooking.serve('grill',bag).ok,false);assert.equal(bag.barbecue,1);
});
test('pot recipes require both stove and pot and survive refresh without duplicating ingredients',()=>{
  let time=0;const cooking=createCooking({now:()=>time});const bag={soupkit:1};
  assert.equal(cooking.start('soup',bag,{stove:1}).ok,false);
  assert.equal(cooking.start('soup',bag,{stove:1,pot:1}).ok,true);
  assert.equal(bag.soupkit,undefined);
  const restored=createCooking({now:()=>time,saved:cooking.save()});time=20000;
  assert.equal(restored.status('stove').ready,true);
  assert.equal(restored.serve('stove',bag).item,'soup');assert.equal(bag.soup,1);
});
test('stations work independently and unknown recipes or corrupt saves are ignored',()=>{
  const cooking=createCooking({saved:{stove:{recipe:'__proto__',startedAt:0}}});
  const bag={noodles:1,rawmeat:1};const gear={stove:1,pot:1,grill:1};
  assert.equal(cooking.start('__proto__',bag,gear).ok,false);
  assert.equal(cooking.start('noodles',bag,gear).ok,true);
  assert.equal(cooking.start('bbq',bag,gear).ok,true);
  assert.equal(cooking.status('stove').ready,false);
  assert.equal(cooking.status('grill').ready,false);
});
