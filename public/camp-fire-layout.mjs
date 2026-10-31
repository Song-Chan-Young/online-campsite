export function addedWoodPlacement(index){
 const slot=index%6,layer=Math.floor(slot/2),side=slot%2;
 return {length:.58,radius:.06,x:(side?1:-1)*.17,z:(layer%2?1:-1)*.12,y:.18+layer*.11,yaw:layer%2?Math.PI/2:0};
}
export const FIRE_FOCUS={distance:3.5,height:2.6,targetHeight:1.55};
