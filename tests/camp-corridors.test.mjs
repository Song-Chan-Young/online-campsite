import test from 'node:test';
import assert from 'node:assert/strict';
import {campCorridors,segmentDistance} from '../public/camp-corridors.mjs';
import {areaOffset} from '../public/camp-areas.mjs';
test('shop and cross-area routes clear both trunks and overhanging crowns',()=>{
 const store={x:-48,z:0},blocked=campCorridors(1,store);
 assert.equal(blocked({x:-24,z:0}),true);assert.equal(blocked({x:-24,z:4},2),true);
 assert.equal(blocked({x:20,z:20},1),false);
 for(const viewer of [1,2,3]){const b=campCorridors(viewer,store);for(const room of [1,2,3])assert.equal(b(areaOffset(room,viewer),1),true);}
});
test('distance clamps to finite route endpoints instead of clearing an infinite strip',()=>{
 assert.equal(segmentDistance({x:3,z:4},{x:0,z:0},{x:0,z:0}),5);
 assert.equal(segmentDistance({x:13,z:4},{x:0,z:0},{x:10,z:0}),5);
});
