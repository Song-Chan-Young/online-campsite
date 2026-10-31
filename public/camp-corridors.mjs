import {areaOffset} from './camp-areas.mjs';
export function segmentDistance(point,a,b){
 const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz;
 const k=l?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/l)):0;
 return Math.hypot(point.x-a.x-dx*k,point.z-a.z-dz*k);
}
export function campCorridors(viewer,store){
 const centres=[1,2,3].map(room=>areaOffset(room,viewer));
 const segments=centres.map(c=>[c,store]);
 for(let i=0;i<centres.length;i++)for(let j=i+1;j<centres.length;j++)segments.push([centres[i],centres[j]]);
 return (point,crownRadius=0)=>centres.some(c=>Math.hypot(point.x-c.x,point.z-c.z)<5.5+crownRadius)
  ||Math.hypot(point.x-store.x,point.z-store.z)<5+crownRadius
  ||segments.some(([a,b])=>segmentDistance(point,a,b)<2.2+crownRadius);
}
