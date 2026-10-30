import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {entryRedirect, consumeEntry, randomNickname} from '../public/interactions.mjs';

const source = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
function entryPage(address, room, storage) {
  let submit, connections = 0;
  const input = {value:'', blur() {}};
  const screen = {hidden:false, classList:{add() {screen.hidden=true;}}};
  const elements = {'enter-form':{addEventListener(event, fn) {submit=fn;}}, 'enter-screen':screen, 'nick-input':input, 'nick-btn':{}};
  const location = {href:address,protocol:new URL(address).protocol};
  const context = vm.createContext({
    document: {getElementById: id => elements[id], querySelector: () => ({value:'3'})},
    SERVER:room, SERVERS:{1:{name:'서버1'},3:{name:'서버3'}}, location,
    history:{replaceState(state, title, url) {location.href=url;}},
    localStorage:{getItem:key=>storage.get(key), setItem:(key,value)=>storage.set(key,value)},
    matchMedia:()=>({matches:false}), sound:{unlock(){}}, window:{addEventListener(){}}, updateNick(){}, sendNick(){}, toast(){}, reportEntry(){},
    myName:'', chatWs:null, connectChat(){connections++;context.chatWs={};}, entryRedirect, consumeEntry, randomNickname,
  });
  vm.runInContext(source.slice(source.indexOf('let wantNick ='), source.indexOf('const shownName =')), context);
  vm.runInContext(source.slice(source.indexOf("document.getElementById('enter-form').addEventListener"), source.indexOf('// 서버 고르기')), context);
  return {input,screen,location,connections:()=>connections,submit:()=>submit({preventDefault(){}})};
}

test('a first visitor gets a name and changing rooms finishes entry after a single submission', () => {
  const storage = new Map();
  const first = entryPage('https://camp.example/?server=1', 1, storage);
  assert.ok(first.input.value.trim().length > 0);
  first.input.value = '우리 캠퍼';
  first.submit();
  const next = entryPage(first.location.href, 3, storage);
  assert.equal(next.screen.hidden, true);
  assert.equal(next.input.value, '우리 캠퍼');
  assert.equal(new URL(next.location.href).searchParams.has('enter'), false);
});
test('saved names are reused and a same-room entry needs no reload', () => {
  const page = entryPage('https://camp.example/?server=3', 3, new Map([['camp-nick','따뜻한 도토리']]));
  assert.equal(page.input.value, '따뜻한 도토리');
  page.submit();
  assert.equal(page.screen.hidden, true);
  assert.equal(page.location.href, 'https://camp.example/?server=3');
});

test('visitors enter immediately with one connection and later edits never reserve a second seat', () => {
  const storage=new Map();
  const page=entryPage('https://camp.example/?server=3',3,storage);
  assert.equal(page.screen.hidden,true);
  assert.equal(page.connections(),1);
  assert.ok(storage.get('camp-nick'));
  page.submit();page.submit();
  assert.equal(page.connections(),1);
});
