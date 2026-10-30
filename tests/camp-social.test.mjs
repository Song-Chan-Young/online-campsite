import test from 'node:test';
import assert from 'node:assert/strict';
import {inviteAddress, burnPrivateWorry, photoCaption} from '../public/camp-social.mjs';

test('an invitation stays in the current room but never carries another inviter or entry marker',()=>{
  const url=new URL(inviteAddress('https://camp.example/?server=2&enter=1&near=old-host#test',3,'my-visitor-token'));
  assert.equal(url.origin,'https://camp.example');
  assert.equal(url.searchParams.get('server'),'3');
  assert.equal(url.searchParams.get('near'),'my-visitor-token');
  assert.equal(url.searchParams.has('enter'),false);
  assert.equal(url.hash,'');
});
test('a worry is cleared before the fire animation and the callback receives no private text',()=>{
  const input={value:'private worry'};
  let result;
  assert.equal(burnPrivateWorry(input,(...args)=>{result={args,remaining:input.value};}),true);
  assert.equal(input.value,'');
  assert.deepEqual(result,{args:[],remaining:''});
});
test('an empty worry does not start a ritual',()=>{
  const input={value:'   '};
  assert.equal(burnPrivateWorry(input,()=>{throw new Error('should not burn');}),false);
});
test('the photo caption includes the brand, camper and date',()=>{
  const caption=photoCaption('따뜻한 도토리','2026. 10. 30.');
  assert.match(caption,/방구석 캠핑장/);
  assert.match(caption,/따뜻한 도토리/);
  assert.match(caption,/2026\. 10\. 30\./);
});

test('visitor tokens work on LAN HTTP where randomUUID may be unavailable',async()=>{
  const {makeVisitorToken}=await import('../public/camp-social.mjs');
  const token=makeVisitorToken({getRandomValues:array=>{array.fill(7);return array;}});
  assert.match(token,/^[a-zA-Z0-9_-]{6,80}$/);
});

test('a received marshmallow is a temporary gesture and does not persist inventory',async()=>{
  const {readFile}=await import('node:fs/promises');
  const vm=await import('node:vm');
  const source=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const handler=source.slice(source.indexOf('function onPresence(m)'),source.indexOf('const _rp ='));
  const bag={marshmallow:2};let writes=0;let heldItem;
  const context=vm.createContext({bag,quietMode:false,myId:7,held:null,pose:'sit',
    saveJson:()=>writes++,holdItem:(id,duration)=>{heldItem={id,duration};},toast(){}});
  vm.runInContext(handler,context);
  const handled=context.onPresence({type:'gift',to:7,from:8,name:'친구'});
  assert.equal(handled,true);
  assert.deepEqual(heldItem,{id:'marshmallow',duration:10});
  assert.equal(bag.marshmallow,2);
  assert.equal(writes,0);
});
