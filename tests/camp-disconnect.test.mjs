import test from 'node:test';import assert from 'node:assert/strict';import {disconnectForTransfer}from '../public/camp-disconnect.mjs';
test('transfer waits until old room acknowledges disconnection',async()=>{
 const socket=new EventTarget();socket.readyState=1;let requested=false,finished=false;
 socket.close=(code,reason)=>{assert.equal(code,1000);assert.equal(reason,'area-transfer');requested=true;};
 const pending=disconnectForTransfer(socket).then(()=>finished=true);await Promise.resolve();assert.equal(requested,true);assert.equal(finished,false);
 socket.dispatchEvent(new Event('close'));await pending;assert.equal(finished,true);
});
test('transfer cannot hang on an unresponsive connection',async()=>{const socket=new EventTarget();socket.readyState=1;socket.close=()=>{};await disconnectForTransfer(socket,5);});
