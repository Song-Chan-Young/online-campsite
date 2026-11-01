import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
const source=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
function setup(){
 const start=source.lastIndexOf('function placeHammock()');
 const code=source.slice(start,source.indexOf('function placeRelaxChair()',start));
 const parent=new THREE.Group(),button={textContent:''},saved=[],walks=[];
 const ctx=vm.createContext({THREE,personalHammock:null,seasonKey:'rain',placed:{hammock:0},campExtras:[],fire:{parent},
 stdMat:color=>new THREE.MeshStandardMaterial({color}),
 box:(w,h,d,material,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);return m;},
 campSpot:(x,z)=>new THREE.Vector3(x,0,z),registerInteract(g,action){g.userData.action=action;},
 startWalk(...args){walks.push(args);},saveJson:(...args)=>saved.push(args),toast(){},document:{getElementById:()=>button}});
 vm.runInContext(code,ctx);return {ctx,parent,button,saved,walks};
}
test('shop hammock still installs once after the direct button becomes a tarp',()=>{
 const s=setup();s.ctx.placeHammock();s.ctx.placeHammock();
 assert.equal(s.parent.children.length,1);
 s.ctx.personalHammock.lieDown();assert.equal(s.walks[0][2].spot,'hammock');
});
