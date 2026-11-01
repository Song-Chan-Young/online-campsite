import test from 'node:test';
import assert from 'node:assert/strict';
import {requestPlaybackSession,resumeAudioContext} from '../public/audio-session.mjs';
import {FieldAudio} from '../public/field-audio.mjs';

test('requests media playback category while tolerating unsupported browsers',()=>{
  const nav={audioSession:{type:'auto'}};requestPlaybackSession(nav);assert.equal(nav.audioSession.type,'playback');
  assert.doesNotThrow(()=>requestPlaybackSession({}));
  assert.doesNotThrow(()=>requestPlaybackSession({get audioSession(){throw new Error('unsupported');}}));
});
test('resumes suspended and interrupted audio without unhandled failures',async()=>{
  let calls=0;for(const state of ['suspended','interrupted'])await resumeAudioContext({state,resume(){calls++;return Promise.resolve();}});
  assert.equal(calls,2);
  await assert.doesNotReject(()=>resumeAudioContext({state:'suspended',resume(){return Promise.reject(new Error('gesture required'));}}));
});
test('recorded audio play is called inside the gesture before resume resolves and pending requests are reused',async()=>{
  let playCalls=0,resolveResume;
  const OriginalAudio=globalThis.Audio;
  globalThis.Audio=class {paused=true;addEventListener(){}load(){}play(){playCalls++;this.paused=false;return Promise.resolve();}};
  try {
    const gain={cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}};
    const context={currentTime:0,createGain:()=>({gain,connect(){}}),createMediaElementSource:()=>({connect(){}}),resume:()=>new Promise(resolve=>{resolveResume=resolve;})};
    const audio=new FieldAudio(context,{});
    const first=audio.play('fire'),second=audio.play('fire');
    assert.equal(playCalls,1,'HTML media must start before awaiting context.resume');
    resolveResume();await Promise.all([first,second]);assert.equal(audio.active,true);
    await audio.play('fire');assert.equal(playCalls,1);
  } finally {globalThis.Audio=OriginalAudio;}
});

test('local rain recording plays without a video player and stops on season change',async()=>{
 const original=globalThis.Audio;let pauses=0;
 globalThis.Audio=class {paused=true;addEventListener(){}load(){}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;pauses++;}};
 try {
  const gain={cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}};
  const context={currentTime:0,createGain:()=>({gain,connect(){}}),createMediaElementSource:()=>({connect(){}}),resume:()=>Promise.resolve()};
  const recording=new FieldAudio(context,{});await recording.play('rain');
  assert.equal(recording.audio.src,'./assets/rain-recording.mp3');assert.equal(recording.active,true);
  recording.stop();assert.equal(recording.active,false);assert.equal(recording.audio.paused,true);assert.equal(pauses,1);
 }finally{globalThis.Audio=original;}
});
