import {cp,mkdir,rm,stat} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const out=new URL('.build/site/',root);
for (const name of ['campfire-real.mp4','tent-morning-real.mp4','aurora-stars-4k.mp4','fire-recording.mp3','forest-recording.mp3']) {
  let info;
  try {info=await stat(new URL('public/assets/'+name,root));}
  catch {throw new Error(`Missing ambient media ${name}. See docs/media-sources.md.`);}
  if (!info.isFile() || info.size===0) throw new Error(`Empty ambient media: ${name}`);
  if (info.size>25*1024*1024) throw new Error(`Ambient media exceeds the hosting file limit: ${name}`);
}

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await cp(new URL('public/',root),out,{recursive:true});
await mkdir(new URL('vendor/three/build/',out),{recursive:true});
await mkdir(new URL('vendor/three/examples/jsm/controls/',out),{recursive:true});
await cp(new URL('node_modules/three/build/three.module.js',root),new URL('vendor/three/build/three.module.js',out));
await cp(new URL('node_modules/three/examples/jsm/controls/OrbitControls.js',root),new URL('vendor/three/examples/jsm/controls/OrbitControls.js',out));
await cp(new URL('node_modules/three/LICENSE',root),new URL('vendor/three/LICENSE',out));
console.log('Cloud assets ready in .build/site (including locally served Three.js).');
