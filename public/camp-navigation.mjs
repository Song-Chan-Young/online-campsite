import {areaOffset} from './camp-areas.mjs';
import {CAMP_SEATS} from './camp-circle.mjs';
export function safePosition(x,z,angle=0){
 const r=Math.hypot(x,z);
 if(!Number.isFinite(r)||r<.001)return {x:Math.cos(angle)*2,z:Math.sin(angle)*2};
 return r<2?{x:x*2/r,z:z*2/r}:{x,z};
}
export function camperPosition(p){
 const seat=CAMP_SEATS.find(s=>s.id===p.spot);
 if(Number.isFinite(p.x)&&Number.isFinite(p.z))return {...p,...safePosition(p.x,p.z,(p.id||0)*2.399)};
 const a=(p.id||0)*2.399;
 return {...p,x:seat?.x??Math.sin(a)*4.5,z:seat?.z??Math.cos(a)*4.5,yaw:seat?Math.atan2(-seat.x,-seat.z):a+Math.PI,pose:seat?'sit':'stand'};
}
export function campRoute(start,end){
 const a=safePosition(start.x,start.z),b=safePosition(end.x,end.z);
 const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz;
 const k=l?Math.max(0,Math.min(1,-(a.x*dx+a.z*dz)/l)):0;
 if(Math.hypot(a.x+dx*k,a.z+dz*k)>=2)return [b];
 const aa=Math.atan2(a.z,a.x),bb=Math.atan2(b.z,b.x);
 const delta=Math.atan2(Math.sin(bb-aa),Math.cos(bb-aa));
 const n=Math.ceil(Math.abs(delta)/(.2)),out=[];
 // Radial approach, then short arc; every chord clears the two-metre boundary.
 for(let i=0;i<=n;i++){const t=aa+delta*i/Math.max(1,n);out.push({x:Math.cos(t)*2.2,z:Math.sin(t)*2.2});}
 return [...out,b];
}

export function safeWorldPosition(x,z,viewer=1,angle=0){
 let p={x,z};
 for(const room of [1,2,3]){const o=areaOffset(room,viewer),q=safePosition(p.x-o.x,p.z-o.z,Number.isFinite(angle)?angle:0);p={x:q.x+o.x,z:q.z+o.z};}
 return p;
}
export function worldRoute(start,end,viewer=1){
 let path=[safeWorldPosition(end.x,end.z,viewer)];
 for(const room of [1,2,3]){
  const o=areaOffset(room,viewer),out=[];let prev=start;
  for(const next of path){
   const segment=campRoute({x:prev.x-o.x,z:prev.z-o.z},{x:next.x-o.x,z:next.z-o.z});
   out.push(...segment.map(p=>({x:p.x+o.x,z:p.z+o.z})));prev=next;
  }
  path=out;
 }
 return path;
}
