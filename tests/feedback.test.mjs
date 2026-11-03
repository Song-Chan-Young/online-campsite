import test from 'node:test';import assert from 'node:assert/strict';
import {validateFeedback,receiveFeedback} from '../lib/feedback.mjs';
test('feedback validates category and lengths',()=>{
 assert.throws(()=>validateFeedback({type:'other'}));assert.throws(()=>validateFeedback({type:'bug',title:'a',message:'short'}));
 assert.deepEqual(validateFeedback({type:'feature',title:' 제안 제목 ',message:'새로운 캠핑 기능을 추가해 주세요.'}),{type:'feature',title:'제안 제목',message:'새로운 캠핑 기능을 추가해 주세요.'});
});
test('feedback persists privately and rate limits duplicate submissions',async()=>{
 const data=new Map(),tx={get:async k=>data.get(k),put:async(k,v)=>data.set(k,v)},storage={transaction:fn=>fn(tx)};
 const request=()=>new Request('https://camp.example/feedback',{method:'POST',headers:{Origin:'https://camp.example'},body:JSON.stringify({type:'bug',title:'수영 오류',message:'미끄럼틀을 타고 나면 수영이 안 됩니다.'})});
 const first=await receiveFeedback(request(),storage);assert.equal(first.status,201);const {id}=await first.json();assert.equal(data.get('feedback:'+id).status,'new');
 assert.equal((await receiveFeedback(request(),storage)).status,429);
 assert.equal((await receiveFeedback(new Request('https://camp.example/feedback'),storage)).status,405);
});
