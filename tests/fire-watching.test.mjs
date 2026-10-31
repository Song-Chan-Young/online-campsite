import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {FIRE_FOCUS,addedWoodPlacement} from '../public/camp-fire-layout.mjs';
import * as THREE from 'three';
const source=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

test('watching the fire moves the view close without adding wood or changing seats',()=>{
  let click,wood=0,walks=0,view;
  const context=vm.createContext({THREE,FIRE_FOCUS,
    document:{getElementById:id=>({addEventListener:(event,fn)=>{if(id==='btn-fire')click=fn;},setAttribute(){}})},
    camera:{position:new THREE.Vector3(0,3.2,9)},me:{position:new THREE.Vector3(1,0,2)},
    seats:[{getWorldPosition:v=>v.set(1.2,0,2)}],campCenter:()=>new THREE.Vector3(),
    FIRE_VIEW_TARGET:new THREE.Vector3(0,1,0),sound:{unlock(){},ready:false},
    fireWatching:false,pose:'sit',walkTo:null,fireLevel:0.4,
    flyToView:v=>{view=v;},flyTo(){},startWalk:()=>walks++,addLog:()=>wood++,toast(){},
  });
  const start=source.indexOf('const seatWorld =');
  vm.runInContext(source.slice(start,source.indexOf('let waveUntil =',start)),context);
  click();
  assert.equal(wood,0);
  assert.equal(walks,0);
  assert.ok(view.pos.distanceTo(view.target)<4,'the wood should fill the view');
  assert.ok(view.target.y>=1.4,'look at the flame centre above the base of the tall logs');
});

test('added logs stay small and low inside the stone ring',()=>{for(let i=0;i<30;i++){const p=addedWoodPlacement(i);assert.ok(Math.hypot(p.x,p.z)+p.length/2<.75);assert.ok(p.y+p.radius<.5);assert.ok(p.length<.7);}});
