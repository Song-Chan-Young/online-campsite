import test from 'node:test';
import assert from 'node:assert/strict';
import {CampHub} from '../lib/camp-hub.mjs';
import worker from '../cloud/worker.mjs';
import * as THREE from 'three';
import {overviewView} from '../public/camp-overview.mjs';

test('overview keeps all map corners visible on phone and desktop screens',()=>{
  for(const aspect of [.46,1,1.8]) {
    const min=new THREE.Vector3(-60,0,-40),max=new THREE.Vector3(10,0,30);
    const view=overviewView(THREE,min,max,aspect);
    const camera=new THREE.PerspectiveCamera(55,aspect,.1,600);
    camera.position.copy(view.pos);camera.lookAt(view.target);camera.updateMatrixWorld();
    for(const x of [min.x,max.x]) for(const z of [min.z,max.z]) {
      const projected=new THREE.Vector3(x,0,z).project(camera);
      assert.ok(Math.abs(projected.x)<.94 && Math.abs(projected.y)<.94);
    }
  }
});

test('live presence counts only connected sessions and updates when they leave',()=>{
  const hub=new CampHub();const a={send(){}},b={send(){}},c={send(){}};
  hub.join(a,{room:'1'});hub.join(b,{room:'2'});hub.join(c,{room:'2'});
  assert.deepEqual(hub.getPresence(),{total:3,rooms:{1:1,2:2,3:0}});
  hub.leave(b);hub.leave(c);
  assert.deepEqual(hub.getPresence(),{total:1,rooms:{1:1,2:0,3:0}});
});
test('whole camp presence combines all rooms without exposing visitors',async()=>{
  const env={CAMPS:{getByName:name=>({fetch:async request=>{
    assert.equal(new URL(request.url).pathname,'/presence');
    const room=name.slice(-1);return Response.json({total:Number(room),rooms:{1:0,2:0,3:0,[room]:Number(room)}});
  }})}};
  const response=await worker.fetch(new Request('https://camp.example/presence'),env);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.deepEqual(await response.json(),{total:6,rooms:{1:1,2:2,3:3}});
});
