import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{CampRoom} from '../cloud/worker.mjs';
import {CampHub} from '../lib/camp-hub.mjs';

test('hibernation restores status, nickname and reservation without a second welcome',async()=>{
  const hub=new CampHub();
  const client={send(){}};hub.join(client,{room:'2',visitor:'host-123',quiet:false});
  hub.message(client,JSON.stringify({type:'name',name:'캠퍼'}));
  let attachment=structuredClone(hub.snapshot(client));
  const messages=[];
  const socket={readyState:1,send:raw=>messages.push(JSON.parse(raw)),deserializeAttachment:()=>attachment,serializeAttachment:value=>{attachment=structuredClone(value);}};
  const room=new CampRoom({getWebSockets:()=>[socket],storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:fn=>fn()});
  await room.ready;
  assert.equal(messages.length,0);
  const restored=[...room.hub.clients][0];
  assert.equal(restored.quiet,false);assert.equal(restored.cname,'캠퍼');assert.equal(restored.spot,'seat:0');
  await room.webSocketMessage(socket,JSON.stringify({type:'mode',quiet:true}));
  assert.equal(attachment.quiet,true);
  room.webSocketClose(socket,1000,'');
  assert.equal(room.hub.clients.size,0);
});
test('cloud routes each camp to its own durable room and leaves static files to assets',async()=>{
  const names=[];
  const env={CAMPS:{getByName:name=>{names.push(name);return {fetch:()=>new Response('room')};}},ASSETS:{fetch:()=>new Response('asset')}};
  const response=await worker.fetch(new Request('https://camp.example/chat?server=3',{headers:{Upgrade:'websocket'}}),env);
  assert.equal(await response.text(),'room');assert.deepEqual(names,['camp-3']);
  const asset=await worker.fetch(new Request('https://camp.example/interactions.mjs'),env);
  assert.equal(await asset.text(),'asset');
});
test('ordinary HTTP requests cannot open the websocket endpoint',async()=>{
  const response=await worker.fetch(new Request('https://camp.example/chat'),{});
  assert.equal(response.status,426);
});

test('cloud stats await all three room responses and combine aggregate counts',async()=>{
  const names=[];
  const env={CAMPS:{getByName:name=>{
    names.push(name);
    return {fetch:async request=>{
      assert.equal(new URL(request.url).pathname,'/stats');
      const room=name.slice(-1);
      return Response.json({date:'2026-10-30',measure:'sessions',rooms:{[room]:{entries:Number(room)}}});
    }};
  }}};
  const response=await worker.fetch(new Request('https://camp.example/stats'),env);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.deepEqual((await response.json()).rooms,{'1':{entries:1},'2':{entries:2},'3':{entries:3}});
  assert.deepEqual(names,['camp-1','camp-2','camp-3']);
});

test('watch handshake waits for an updated room without joining a visitor on old code',async()=>{
 let calls=[];const env={CAMPS:{getByName:()=>({fetch:request=>{calls.push(new URL(request.url).pathname);return new Response('',{status:426});}})}};
 const response=await worker.fetch(new Request('https://camp.example/watch?server=2',{headers:{Upgrade:'websocket'}}),env);
 assert.equal(response.status,503);assert.deepEqual(calls,['/capabilities']);
});
