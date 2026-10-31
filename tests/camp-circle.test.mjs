import test from 'node:test';
import assert from 'node:assert/strict';
import {CampHub} from '../lib/camp-hub.mjs';
import {claimSpot} from '../lib/spots.mjs';
import {CAMP_SEATS,fireSurge} from '../public/camp-circle.mjs';

function room(){let time=1000;const hub=new CampHub({now:()=>time});
 const join=(r='1',quiet=false)=>{const c={messages:[],send(raw){this.messages.push(JSON.parse(raw));}};hub.join(c,{room:r,quiet});return c;};
 return {hub,join,send:(c,m)=>hub.message(c,JSON.stringify(m)),advance:n=>time+=n};}
test('eight campers reserve distinct camping chairs and the ninth stands',()=>{
 const {join}=room();const campers=Array.from({length:8},()=>join());
 assert.equal(new Set(campers.map(c=>c.spot)).size,8);
 for(const c of campers)assert.ok(CAMP_SEATS.some(s=>s.id===c.spot));
 assert.equal(join().spot,null);
 assert.equal(claimSpot(campers[0],'seat:7',new Set(campers)),false);
});
test('chat identifies the speaking avatar even when names are similar',()=>{
 const {join,send}=room();const a=join(),b=join();
 send(a,{type:'chat',text:'안녕하세요'});
 const chat=b.messages.at(-1);assert.equal(chat.type,'chat');assert.equal(chat.id,a.id);assert.equal(chat.text,'안녕하세요');
});
test('wood is shared only in the same room, including quiet campers, and is rate limited',()=>{
 const {join,send,advance}=room();const a=join(),b=join('1',true),c=join('2');
 send(a,{type:'firewood'});send(a,{type:'firewood'});
 assert.equal(b.messages.filter(m=>m.type==='firewood').length,1);
 assert.equal(a.messages.filter(m=>m.type==='firewood').length,1);
 assert.equal(c.messages.filter(m=>m.type==='firewood').length,0);
 advance(3001);send(a,{type:'firewood'});
 assert.equal(b.messages.filter(m=>m.type==='firewood').length,2);
});
test('wood surge quickly rises and returns to baseline instead of growing forever',()=>{
 assert.equal(fireSurge(0),0);assert.ok(fireSurge(.35)>.9);
 assert.ok(fireSurge(2)<fireSurge(.35));assert.equal(fireSurge(7),0);
});
