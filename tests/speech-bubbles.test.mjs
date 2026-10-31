import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeechBubbles} from '../public/speech-bubbles.mjs';
test('speech follows its sender, renders literal text safely and expires',()=>{
 const nodes=[];const root={append:node=>nodes.push(node)};
 const document={createElement:()=>({style:{},offsetWidth:200,remove(){this.removed=true;}})};
 const speech=createSpeechBubbles(root,document);
 speech.show(7,'<img onerror=evil()> 안녕',1);
 assert.equal(nodes[0].textContent,'<img onerror=evil()> 안녕');
 speech.update(2,id=>({x:id===7?2:300,y:100,visible:true}),390);
 assert.equal(nodes[0].style.left,'108px');assert.equal(nodes[0].style.top,'100px');
 speech.update(20,()=>({visible:true,x:10,y:10}),390);assert.equal(nodes[0].removed,true);
});
test('a second message replaces the bubble; hidden avatars and disconnects clear it',()=>{
 const nodes=[];const speech=createSpeechBubbles({append:node=>nodes.push(node)},{createElement:()=>({style:{},offsetWidth:100,remove(){this.removed=true;}})});
 speech.show(2,'첫 번째',1);speech.show(2,'두 번째',2);assert.equal(nodes[0].removed,true);
 speech.update(3,()=>null,390);assert.equal(nodes[1].hidden,true);
 speech.clear();assert.equal(nodes[1].removed,true);
});
