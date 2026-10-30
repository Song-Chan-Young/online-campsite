import test from 'node:test';
import assert from 'node:assert/strict';
import {createShopCart} from '../public/shop-cart.mjs';
const catalog={coffee:{name:'커피',cat:'food',give:9},lantern:{name:'랜턴',cat:'gear',keep:true},wood:{name:'장작',cat:'gear'},secret:{name:'숨김',cat:'hidden'}};
test('each click selects one unit, independent of legacy give; count snapshots cannot mutate cart',()=>{
  const cart=createShopCart(catalog);cart.select('coffee');cart.select('coffee');cart.select('wood');
  assert.deepEqual(cart.counts(),{coffee:2,wood:1});assert.equal(cart.total(),3);
  const copy=cart.counts();copy.coffee=900;assert.equal(cart.counts().coffee,2);
  cart.decrement('coffee');assert.equal(cart.counts().coffee,1);cart.decrement('wood');cart.decrement('wood');
  assert.deepEqual(cart.counts(),{coffee:1});cart.clear();assert.equal(cart.total(),0);
});
test('checkout transfers exact quantities and consumes them once while preserving existing bag',()=>{
  const cart=createShopCart(catalog);cart.select('coffee');cart.select('coffee');cart.select('wood');
  const original={coffee:3,lantern:1};const result=cart.checkout(original);
  assert.deepEqual(original,{coffee:3,lantern:1});
  assert.deepEqual(result.bag,{coffee:5,lantern:1,wood:1});
  assert.deepEqual(result.items,[{id:'coffee',name:'커피',count:2},{id:'wood',name:'장작',count:1}]);
  assert.match(result.message,/커피 2개/);assert.match(result.message,/장작 1개/);assert.equal(cart.total(),0);
  const again=cart.checkout(result.bag);assert.deepEqual(again.bag,result.bag);assert.deepEqual(again.items,[]);
});
test('keep tools cap at one and already owned tools return explicit skipped status without consuming selection',()=>{
  const cart=createShopCart(catalog);cart.select('lantern');cart.select('lantern');assert.equal(cart.total(),1);
  const owned=cart.checkout({lantern:1});assert.deepEqual(owned.items,[]);assert.equal(owned.bag.lantern,1);
  assert.deepEqual(owned.skipped,[{id:'lantern',name:'랜턴',count:1,reason:'owned'}]);assert.equal(cart.total(),1);
  assert.match(owned.message,/이미/);
  const fresh=cart.checkout({});assert.equal(fresh.bag.lantern,1);assert.equal(cart.total(),0);
});
test('invalid, hidden and inherited ids never enter or alter the cart',()=>{
  const cart=createShopCart(catalog);
  for(const id of ['missing','secret','toString','__proto__',null,{},1]) {cart.select(id);cart.decrement(id);}
  assert.deepEqual(cart.counts(),{});assert.equal(cart.total(),0);assert.deepEqual(cart.checkout({}).items,[]);
});
test('mixed checkout clears transferred food while retaining only the skipped owned tool',()=>{
  const cart=createShopCart(catalog);cart.select('coffee');cart.select('lantern');
  const first=cart.checkout({lantern:1});
  assert.deepEqual(first.bag,{lantern:1,coffee:1});assert.deepEqual(cart.counts(),{lantern:1});
  const second=cart.checkout(first.bag);assert.equal(second.bag.coffee,1);assert.deepEqual(second.items,[]);
  cart.decrement('lantern');assert.equal(cart.total(),0);
});
