export function addedWoodPlacement(index){
 const slot=index%6,layer=Math.floor(slot/2),side=slot%2;
 return {length:.58,radius:.06,x:(side?1:-1)*.17,z:(layer%2?1:-1)*.12,y:.18+layer*.11,yaw:layer%2?Math.PI/2:0};
}
export const FIRE_FOCUS={distance:3.5,height:2.6,targetHeight:1.55};

// A low criss-cross stack leaves the glowing log surfaces visible below the flames.
export function baseWoodPlacement(index) {
 const layer=Math.floor(index/2),side=index%2?1:-1;
 return {length:1.3,radius:.14,x:layer%2?side*.27:0,z:layer%2?0:side*.27,y:.18+layer*.18,yaw:layer%2?Math.PI/2:0};
}
