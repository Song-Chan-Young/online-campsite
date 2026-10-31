export const RECIPES = {
  soup:{name:'따뜻한 채소 수프',station:'stove',gear:['stove','pot'],ingredient:'soupkit',result:'soup',seconds:14,action:'버너에 냄비 올리고 수프 끓이기'},
  noodles:{name:'냄비 라면',station:'stove',gear:['stove','pot'],ingredient:'noodles',result:'potramen',seconds:12,action:'냄비에 라면 넣고 끓이기'},
  bbq:{name:'바비큐 구이',station:'grill',gear:['grill'],ingredient:'rawmeat',result:'barbecue',seconds:16,action:'석쇠에 고기 올리고 굽기'},
  grilledsausage:{name:'그릴 소시지',station:'grill',gear:['grill'],ingredient:'sausage',result:'grilledsausage',seconds:10,action:'석쇠에 소시지 올리고 굽기'},
};
export function createCooking({now=()=>Date.now(),saved={}}={}) {
  const jobs={};
  for(const station of ['stove','grill']) {
    const job=saved?.[station];
    if(job && Object.hasOwn(RECIPES,job.recipe) && RECIPES[job.recipe].station===station && Number.isFinite(job.startedAt) && job.startedAt>=0) jobs[station]={recipe:job.recipe,startedAt:job.startedAt};
  }
  return {
    save:()=>structuredClone(jobs),
    status(station) {
      const job=jobs[station];if(!job)return null;
      const recipe=RECIPES[job.recipe];
      const progress=Math.max(0,Math.min(1,(now()-job.startedAt)/(recipe.seconds*1000)));
      return {...job,...recipe,progress,ready:progress===1,remaining:Math.ceil(recipe.seconds*(1-progress))};
    },
    start(id,bag,placed) {
      if(!Object.hasOwn(RECIPES,id))return {ok:false,message:'이 요리는 준비할 수 없어요.'};
      const r=RECIPES[id];
      if(jobs[r.station])return {ok:false,message:'먼저 만든 요리를 꺼내 주세요.'};
      if(r.gear.some(id=>!(placed[id]>0)))return {ok:false,message:r.station==='stove'?'캠핑 버너와 냄비를 먼저 캠프에 놓아 주세요.':'바비큐 그릴을 먼저 캠프에 놓아 주세요.'};
      if(!(Number.isSafeInteger(bag[r.ingredient])&&bag[r.ingredient]>0))return {ok:false,message:'매점에서 재료를 가져와 주세요.'};
      bag[r.ingredient]--;if(!bag[r.ingredient])delete bag[r.ingredient];
      jobs[r.station]={recipe:id,startedAt:now()};
      return {ok:true,message:`${r.name} 조리를 시작했어요.`,station:r.station};
    },
    serve(station,bag) {
      const job=this.status(station);
      if(!job?.ready)return {ok:false,message:'아직 익고 있어요. 잠시 기다려 주세요.'};
      bag[job.result]=(Number.isSafeInteger(bag[job.result])?bag[job.result]:0)+1;
      delete jobs[station];
      return {ok:true,item:job.result,message:`${job.name} 완성!`};
    },
  };
}

// Native 3D food, steam and bubbles, attached to the actual cooking equipment.
export function createCookingVisual(T,station) {
  const group=new T.Group(),materials=[],geometries=[];
  const material=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,...extra});materials.push(m);return m;};
  const add=(geometry,mat,x,y,z)=>{geometries.push(geometry);const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const food=material(station==='grill'?0xba4942:0xe2a23b,{roughness:.65});
  const steam=[];const pieces=[];
  if(station==='grill') {
    for(const x of [-.22,0,.22]) {
      const piece=add(new T.BoxGeometry(.18,.065,.3),food,x,.83,0);pieces.push(piece);
      for(const z of [-.08,.02,.12])add(new T.BoxGeometry(.17,.007,.012),material(0x39241b),x,.867,z);
    }
  } else {
    add(new T.CylinderGeometry(.25,.25,.014,24),food,0,.63,0);
    for(let i=0;i<7;i++)pieces.push(add(new T.SphereGeometry(.018,7,5),material(0xffe6ac),Math.sin(i*3)*.18,.65,Math.cos(i*2)*.16));
  }
  for(let i=0;i<8;i++)steam.push(add(new T.SphereGeometry(.045,7,5),material(0xffffff,{transparent:true,opacity:.25,depthWrite:false}),0,1,0));
  group.visible=false;
  return {group,update(job,time){
    group.visible=Boolean(job);if(!job)return;
    if(station==='grill')food.color.lerpColors(new T.Color(0xba4942),new T.Color(0x754022),job.progress);
    for(let i=0;i<steam.length;i++) {
      const k=(time*.55+i/steam.length)%1;
      steam[i].position.set(Math.sin(time+i)*.12,.8+k*.6,Math.cos(i*3)*.1);
      steam[i].scale.setScalar(.5+k*1.6);steam[i].material.opacity=(1-k)*(job.ready?.1:.28);
    }
    if(station==='stove')for(let i=0;i<pieces.length;i++)pieces[i].position.y=.65+Math.max(0,Math.sin(time*9+i))*.025;
  },dispose(){for(const m of materials)m.dispose();for(const g of geometries)g.dispose();}};
}
