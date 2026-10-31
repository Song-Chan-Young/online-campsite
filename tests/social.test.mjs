import test from 'node:test';
import assert from 'node:assert/strict';
import { CampHub } from '../lib/camp-hub.mjs';

function camp() {
  let now = 10000;
  const hub = new CampHub({ now: () => now });
  function join(room='1', options={}) {
    const c = {messages:[], send(raw) {this.messages.push(JSON.parse(raw));}};
    hub.join(c, {room, ...options});
    return c;
  }
  const send = (c, message) => hub.message(c, JSON.stringify(message));
  const open = c => send(c,{type:'mode',quiet:false});
  const place = (c,x=0,z=0) => send(c,{type:'state',x,z,yaw:0,pose:'stand',spot:null});
  return {hub,join,send,open,place,advance:ms=>{now+=ms;}};
}

test('automatic greeting replies from older tabs are dropped while manual greetings pass',()=>{
  const {join,send,open}=camp();const a=join(),b=join();open(a);open(b);
  send(a,{type:'act',act:'hello',to:b.id,reply:true});
  assert.equal(b.messages.filter(m=>m.type==='act').length,0);
  send(a,{type:'act',act:'hello',to:b.id});
  assert.equal(b.messages.filter(m=>m.type==='act').length,1);
  assert.equal(b.messages.at(-1).id,a.id);
});

test('quiet visitors receive presence but no chat, greetings or gifts', () => {
  const {join,send,open,place} = camp();
  const a=join(), b=join(); open(a); place(a); place(b);
  send(a,{type:'chat',text:'hello'});
  send(a,{type:'act',act:'hello',to:b.id});
  send(a,{type:'gift',to:b.id});
  assert.equal(b.quiet,true);
  assert.equal(b.messages.some(m=>['chat','act','gift'].includes(m.type)),false);
  assert.equal(b.messages.some(m=>m.type==='state'),true);
});
test('opted-in campers receive same-room messages while another room stays isolated', () => {
  const {join,send,open} = camp();
  const a=join(), b=join(), c=join('2'); [a,b,c].forEach(open);
  send(a,{type:'chat',text:'hi'});
  assert.equal(b.messages.at(-1).text,'hi');
  assert.equal(c.messages.some(m=>m.type==='chat'),false);
});
test('a marshmallow can be given only to a nearby consenting camper, with cooldown', () => {
  const {join,send,open,place,advance}=camp();
  const a=join(),b=join(); [a,b].forEach(open); place(a); place(b,2,0);
  send(a,{type:'gift',to:b.id}); send(a,{type:'gift',to:b.id});
  assert.equal(b.messages.filter(m=>m.type==='gift').length,1);
  advance(10001); place(b,20,0); send(a,{type:'gift',to:b.id});
  assert.equal(b.messages.filter(m=>m.type==='gift').length,1);
});
test('gift targeting another room or a nonexistent camper is rejected',()=>{
  const {join,send,open,place}=camp();
  const a=join(),b=join('2'); [a,b].forEach(open); place(a); place(b);
  send(a,{type:'gift',to:b.id});send(a,{type:'gift',to:999});
  assert.equal(b.messages.some(m=>m.type==='gift'),false);
});
test('an invitation reserves the available chair closest to its inviter',()=>{
  const {join,place}=camp();
  const host=join('1',{visitor:'host-token'});
  place(host,-1.1,-2.1);
  const friend=join('1',{near:'host-token'});
  assert.equal(friend.spot,'seat:2');
  assert.equal(friend.messages[0].invite,'nearby');
});
test('an absent inviter or a full camp falls back without stealing any chair',()=>{
  const {join}=camp();
  const first=join('1',{near:'gone-token'});
  assert.equal(first.messages[0].invite,'missing');
  for(let i=0;i<7;i++) join();
  const last=join('1',{near:'gone-token'});
  assert.equal(last.spot,null);
});

test('aggregate metrics count real entry once, wait for five minutes, and contain no messages',()=>{
  const {hub,join,send,advance}=camp();
  const a=join();
  send(a,{type:'visit',returning:true});send(a,{type:'visit',returning:true});
  send(a,{type:'engaged'});
  assert.equal(hub.getMetrics().rooms['1'].entries,1);
  assert.equal(hub.getMetrics().rooms['1'].returningEntries,1);
  assert.equal(hub.getMetrics().rooms['1'].engaged,0);
  advance(300001);send(a,{type:'engaged'});send(a,{type:'engaged'});
  assert.equal(hub.getMetrics().rooms['1'].engaged,1);
  assert.equal(JSON.stringify(hub.getMetrics()).includes(a.cname),false);
});

test('rate-limited mode requests still acknowledge the current mode so controls can unlock',()=>{
  const {join,send}=camp();const camper=join();
  for(let i=0;i<5;i++) send(camper,{type:'mode',quiet:i%2===1});
  const before=camper.messages.length;
  send(camper,{type:'mode',quiet:true});
  assert.equal(camper.messages.length,before+1);
  assert.equal(camper.messages.at(-1).type,'mode');
  assert.equal(camper.messages.at(-1).quiet,false);
});
