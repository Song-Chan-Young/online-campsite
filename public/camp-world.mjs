import {camperPosition} from './camp-navigation.mjs';
import {CAMP_AREAS,areaOffset} from './camp-areas.mjs';
export {CAMP_AREAS,areaOffset} from './camp-areas.mjs';
export function worldPacket(packet,from,to){
 if(String(from)===String(to))return packet;
 let p={...packet};const offset=areaOffset(from,to);
 if(['join','state'].includes(p.type)){
  p=camperPosition(p);p.x+=offset.x;p.z+=offset.z;
 }
 for(const key of ['id','from','to'])if(p[key]!==undefined&&p[key]!==null)p[key]=`${from}:${p[key]}`;
 if(p.spot)p.spot=`area:${from}:${p.spot}`;
 p.area=Number(from);
 return p;
}
// Standing in another area's circle means that room should own your seat and actions.
export const AREA_RADIUS=7;
export function areaAt(x,z,viewer){
 for(const room of [1,2,3]){const o=areaOffset(room,viewer);if(Math.hypot(x-o.x,z-o.z)<AREA_RADIUS)return room;}
 return null;
}
export function transferAddress(address,viewer,room,{x,z,seat=null}){
 const url=new URL(address),o=areaOffset(room,viewer);
 url.searchParams.set('server',String(room));url.searchParams.set('enter','1');url.searchParams.delete('near');
 url.searchParams.set('at',`${(x-o.x).toFixed(2)},${(z-o.z).toFixed(2)}`);
 if(Number.isInteger(seat))url.searchParams.set('seat',String(seat));else url.searchParams.delete('seat');
 return url.href;
}
export function consumeTransfer(address){
 const url=new URL(address),[x,z]=(url.searchParams.get('at')||'').split(',').map(Number);
 const seat=url.searchParams.has('seat')?Number(url.searchParams.get('seat')):null;
 url.searchParams.delete('at');url.searchParams.delete('seat');
 if(!Number.isFinite(x)||!Number.isFinite(z))return {transfer:null,url:url.href};
 return {transfer:{x,z,seat:Number.isInteger(seat)?seat:null},url:url.href};
}
