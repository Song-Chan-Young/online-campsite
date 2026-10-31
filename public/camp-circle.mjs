// Shared by the rendered chairs and the room's reservation service.
// The larger gap behind the fire keeps the tent entrance clear.
const angles=[.55,2,3.6,5,.03,1.08,2.8,5.7];
export const CAMP_SEATS=angles.map((angle,index)=>({id:`seat:${index}`,angle,x:Math.sin(angle)*3.7,z:Math.cos(angle)*3.7}));
export const FIRE_SCALE=1.6;
export function fireSurge(age) {
  if(age<=0||age>=6)return 0;
  return Math.min(1,age/.3)*Math.pow(1-age/6,1.6);
}
