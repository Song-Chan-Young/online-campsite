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
