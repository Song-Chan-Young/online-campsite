export const CAMP_AREAS={
  1:{name:'내 공간',anchor:[372,268],tent:[-4.3,-3.2]},
  2:{name:'차박',anchor:[388,161],tent:[-9.3,-3.2]},
  3:{name:'데크',anchor:[55,207],tent:[-4.3,-3.2]},
};
export function areaOffset(from,to){
 const a=CAMP_AREAS[from].anchor,b=CAMP_AREAS[to].anchor;
 return {x:(a[0]-b[0])*.16,z:(a[1]-b[1])*.16};
}
