import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {QUICK_PHRASES} from '../public/quick-chat.mjs';
test('typing and choosing a phrase both send without folding the mobile conversation',()=>{
 const source=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 let submit,folds=0;const buttons=[],sent=[],input={value:'계속 대화해요'};
 const document={getElementById:id=>id==='chat-form'?{addEventListener:(name,fn)=>{submit=fn;}}:{append:button=>buttons.push(button)},createElement:()=>({addEventListener(name,fn){this.click=fn;}})};
 const ctx=vm.createContext({document,QUICK_PHRASES,chatInput:input,quietMode:false,WebSocket:{OPEN:1},chatWs:{readyState:1,send:raw=>sent.push(JSON.parse(raw))},isMobile:()=>true,chatFold:{fold(){folds++;}}});
 const start=source.indexOf('function sendChatText('),end=source.indexOf('// 캠핑 엽서',start);
 vm.runInContext(source.slice(start,end),ctx);
 assert.equal(buttons.length,12);submit({preventDefault(){}});buttons[5].click();
 assert.equal(sent[0].text,'계속 대화해요');assert.equal(sent[1].text,QUICK_PHRASES[5]);
 assert.equal(input.value,'');assert.equal(folds,0);
});
