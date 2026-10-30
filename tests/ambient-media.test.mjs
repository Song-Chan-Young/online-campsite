import test from 'node:test';
import assert from 'node:assert/strict';
import {AmbientMedia} from '../public/ambient-media.mjs';
class Media {
  constructor(){this.src='';this.played=0;this.paused=0;this.handlers={};}
  addEventListener(event,fn){this.handlers[event]=fn;}
  getAttribute(key){return this[key];}
  load(){}
  async play(){this.played++;}
  pause(){this.paused++;}
}
globalThis.Audio=Media;
function context(resume=async()=>{}) {
  return {currentTime:0,resume,createGain:()=>({connect(){},gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}}}),createMediaElementSource:()=>({connect(){}})};
}
test('closing while audio is unlocking never starts hidden video or sound',async()=>{
  let unlock;
  const video=new Media();
  const media=new AmbientMedia(video,{},context(()=>new Promise(resolve=>{unlock=resolve;})),{});
  const opening=media.open('fire');media.close();unlock();await opening;
  assert.equal(video.played,0);assert.equal(media.audio.played,0);
});
test('morning uses the tent recording and closing stops both media streams',async()=>{
  const video=new Media(),media=new AmbientMedia(video,{},context(),{});
  await media.open('morning');
  assert.equal(video.src,'./assets/tent-morning-real.mp4');
  assert.equal(media.audio.src,'./assets/forest-recording.mp3');
  assert.equal(video.muted,true);
  media.close();
  assert.equal(video.paused,1);assert.equal(media.audio.paused,1);
});

test('stargazing plays the aurora recording rather than the fire or morning scene',async()=>{
  const video=new Media(),media=new AmbientMedia(video,{},context(),{});
  await media.open('stars');
  assert.equal(video.src,'./assets/aurora-stars-4k.mp4');
  assert.equal(media.audio.src,'./assets/fire-recording.mp3');
});
