import test from 'node:test';import assert from 'node:assert/strict';import webpush from 'web-push';import {createECDH,randomBytes}from 'node:crypto';
import {validSubscription,sendFeedbackPush,pushAdmin}from '../lib/feedback-push.mjs';
test('push admin blocks unauthenticated clients and arbitrary endpoints',async()=>{
 assert.equal((await pushAdmin(new Request('https://camp.test/push/inbox'),{},{})).status,401);
 assert.equal(validSubscription({endpoint:'https://localhost/private',keys:{p256dh:'x',auth:'y'}}),false);
});
test('encrypts notification and deletes expired device subscriptions',async()=>{
 const pair=createECDH('prime256v1');pair.generateKeys();const sub={endpoint:'https://web.push.apple.com/test',keys:{p256dh:pair.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')}};
 const vapid=webpush.generateVAPIDKeys(),deleted=[];const store={list:async()=>new Map([['push:device',sub]]),delete:async k=>deleted.push(k),put:async()=>{}};
 let request;const sent=await sendFeedbackPush(store,{PUSH_PUBLIC_KEY:vapid.publicKey,PUSH_PRIVATE_KEY:vapid.privateKey},{title:'새 의견',body:'기능 추가'},async(url,options)=>{request={url,options};return new Response(null,{status:201});});
 assert.equal(sent,1);assert.ok(request.options.body.length>0);assert.equal(request.options.headers['Content-Encoding'],'aes128gcm');
 await sendFeedbackPush(store,{PUSH_PUBLIC_KEY:vapid.publicKey,PUSH_PRIVATE_KEY:vapid.privateKey},{title:'test'},async()=>new Response(null,{status:410}));assert.deepEqual(deleted,['push:device']);
});
