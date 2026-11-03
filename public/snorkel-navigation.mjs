// Project a screen ray onto a short horizontal swim step, bounded by the beach.
export function snorkelDestination(position,ray,shore,direction,normal,length,beach,width){
 const magnitude=Math.hypot(ray.x,ray.z);
 if(magnitude<1e-6)return null;
 const x=position.x+ray.x/magnitude*4,z=position.z+ray.z/magnitude*4;
 const along=Math.max(2.2,Math.min(length-2.2,(x-shore.x)*direction.x+(z-shore.z)*direction.z));
 const depth=Math.max(beach-1,Math.min(beach+width-.3,(x-shore.x)*normal.x+(z-shore.z)*normal.z));
 return {x:shore.x+direction.x*along+normal.x*depth,z:shore.z+direction.z*along+normal.z*depth};
}
