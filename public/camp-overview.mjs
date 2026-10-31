// Fit the whole campground in both portrait and landscape screens.
export function overviewView(THREE, min, max, aspect, fov=55) {
  const target=new THREE.Vector3((min.x+max.x)/2,0,(min.z+max.z)/2);
  const vertical=fov*Math.PI/360;
  const horizontal=Math.atan(Math.tan(vertical)*aspect);
  const halfWidth=(max.x-min.x)/2,halfDepth=(max.z-min.z)/2;
  const distance=(.53*halfDepth+Math.max(halfWidth/Math.tan(horizontal),(.85*halfDepth+6)/Math.tan(vertical)))*1.12;
  const offset=new THREE.Vector3(0,.85,.53).normalize().multiplyScalar(distance);
  return {pos:target.clone().add(offset),target,maxPolar:Math.PI*.495};
}
