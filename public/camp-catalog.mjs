/** Seasonal recommendations are ordering hints; every item remains available. */
const specs = [
 ['table','접이식 테이블','🪑',['spring','summer','autumn'],'식사와 장비를 올려둘 테이블을 펼쳤어요'],
 ['tarp','방수 타프','⛺',['spring','summer'],'비와 햇볕을 피할 그늘을 만들었어요'],
 ['stove','캠핑 버너','🔥',['autumn','winter'],'버너 불을 켰어요'],
 ['kettle','주전자','🫖',['autumn','winter'],'따뜻한 차를 끓일 준비를 했어요'],
 ['grill','바비큐 그릴','🍖',['summer','autumn'],'석쇠를 달궈 바비큐를 준비해요'],
 ['pot','캠핑 냄비','🍲',['autumn','winter'],'뚜껑을 열고 따뜻한 수프를 확인해요'],
 ['foldingcot','야전 침대','🛏️',['spring','summer'],'땅의 습기를 피해 잠시 누워 쉬어요'],
 ['blanket','보온 담요','🧣',['autumn','winter'],'포근한 담요로 몸을 따뜻하게 해요'],
 ['rug','방수 피크닉 매트','🧺',['spring','summer'],'보송한 매트 위에서 피크닉을 즐겨요'],
 ['fan','휴대용 선풍기','🌀',['summer'],'시원한 바람을 켰어요'],
 ['mosquitonet','모기장','🦟',['summer'],'모기장 안에서 편안하게 쉬어요'],
 ['buglamp','해충 유인등','💜',['summer'],'보랏빛 유인등을 켰어요'],
 ['solar','태양광 충전판','☀️',['spring','summer'],'패널을 펼쳐 햇빛으로 충전해요'],
 ['heater','캠핑 난로','♨️',['winter'],'난로를 켜 온기를 더해요. 환기 공간을 확보해요'],
 ['woodrack','장작 보관대','🪵',['autumn','winter'],'장작을 땅에서 띄워 건조하게 보관해요'],
 ['snowshovel','눈삽','❄️',['winter'],'텐트 앞 눈길을 정리했어요'],
 ['waterjug','물통','🚰',['spring','summer'],'시원한 물을 컵에 따라요'],
 ['dryingrack','건조대','👕',['spring','summer'],'젖은 수건을 널어 말려요'],
 ['trashbin','분리수거함','♻️',['spring','summer','autumn','winter'],'주변 쓰레기를 분리해 담았어요'],
 ['handwash','손 씻는 스테이션','🧼',['spring','summer'],'비누로 손을 깨끗이 씻었어요'],
 ['firstaid','구급 상자','🩹',['spring','summer','autumn','winter'],'붕대와 소독 용품을 확인했어요'],
 ['fireextinguisher','소화기','🧯',['autumn','winter'],'소화기 위치와 안전핀을 확인했어요'],
 ['bootsrack','등산화 정리대','🥾',['spring','autumn'],'젖은 신발을 가지런히 정리해요'],
 ['campflag','캠핑 깃발','🚩',['spring','summer'],'우리 캠핑장 깃발이 바람에 펄럭여요'],
 ['windshield','버너 바람막이','🛡️',['autumn','winter'],'바람막이를 펼쳐 버너를 보호해요'],
 ['umbrellastand','우산 꽂이','☂️',['spring'],'젖은 우산을 꽂아 빗물을 털어요'],
 ['stringlights','감성 줄 조명','💡',['spring','autumn'],'따뜻한 줄 조명을 켰어요'],
 ['sleepingbag','겨울 침낭','🛌',['autumn','winter'],'두툼한 침낭 안에서 온기를 지켜요'],
 ['rainbarrel','빗물 수집통','🌧️',['spring'],'빗물을 모아 장비 세척에 써요. 마시지 않아요'],
 ['thermos','보온병','🍵',['autumn','winter'],'보온병에서 따뜻한 차를 따라요'],
 ['icebox','얼음 보관함','🧊',['summer'],'얼음을 꺼내 음료를 시원하게 해요'],
 ['weatherstation','기상 관측대','🌡️',['spring','winter'],'풍향계와 온도계로 주변 날씨를 살펴요'],
];
export const EXTRA_GEAR = Object.fromEntries(specs.map(([id,name,icon,seasons,use]) => [id,{cat:'gear',name,icon,give:1,place:true,seasons,model:id,use}]));
export function recommendedGearIds(catalog, season) {
 return Object.keys(catalog).filter(id => catalog[id].cat === 'gear').sort((a,b) => Number(catalog[b].seasons?.includes(season) ?? false)-Number(catalog[a].seasons?.includes(season) ?? false));
}

/** Small generated models; coordinates are local so callers can place/rotate freely. */
export function createGearProp(T,id) {
 if (!EXTRA_GEAR[id]) return null;
 const group = new T.Group(), materials=[], geometries=[];
 const mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.75,...extra});materials.push(m);return m;};
 const wood=mat(0xa3784f), metal=mat(0x53646b), cloth=mat(0x6b927b), dark=mat(0x26353d), pale=mat(0xe6dcc0), red=mat(0xb94d46), blue=mat(0x4989a4);
 let glow, animated, active=false;
 const mesh=(geo,m,x=0,y=0,z=0)=>{geometries.push(geo);const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;};
 const box=(w,h,d,m,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(r,h,m,x=0,y=0,z=0)=>mesh(new T.CylinderGeometry(r,r,h,12),m,x,y,z);
 const ball=(r,m,x=0,y=0,z=0)=>mesh(new T.SphereGeometry(r,10,8),m,x,y,z);
 const legs=(w,d,h)=>{for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])box(.055,h,.055,metal,x,h/2,z);};
 const handle=(r,x,y,z,m=metal)=>{const o=mesh(new T.TorusGeometry(r,.025,6,16),m,x,y,z);return o;};
 const lamp=(color,y=.65)=>{glow=mat(color,{emissive:color,emissiveIntensity:.08});ball(.12,glow,0,y);};
 const rack=()=>{legs(.85,.45,.65);box(1,.07,.6,wood,0,.3);box(1,.07,.6,wood,0,.65);};
 switch(id){
 case 'table': legs(1.3,.7,.7);box(1.55,.09,.95,wood,0,.74);break;
 case 'tarp': for(const x of [-1,1])for(const z of [-.8,.8])cyl(.025,1.65,metal,x,.825,z);box(2.2,.045,1.9,cloth,0,1.67).rotation.z=.06;break;
 case 'stove': box(.65,.16,.45,metal,0,.16);cyl(.2,.04,dark,0,.27);lamp(0xff8239,.32);for(const x of [-.23,.23])box(.04,.05,.38,dark,x,.29);break;
 case 'kettle': cyl(.22,.3,metal,0,.25);cyl(.25,.04,dark,0,.42);ball(.045,wood,0,.47);handle(.23,0,.53,0);cyl(.065,.28,metal,.25,.35).rotation.z=-.7;break;
 case 'grill': legs(.65,.4,.6);box(.85,.2,.6,dark,0,.65);for(let i=0;i<8;i++)box(.035,.035,.59,metal,-.35+i*.1,.77);lamp(0xff5a22,.66);break;
 case 'pot': cyl(.29,.3,red,0,.23);animated=cyl(.31,.055,metal,0,.41);handle(.09,-.35,.32,0);handle(.09,.35,.32,0);ball(.055,wood,0,.47);break;
 case 'foldingcot': legs(1.7,.6,.4);box(1.95,.09,.75,cloth,0,.45);box(.4,.12,.65,pale,-.65,.55);break;
 case 'blanket': box(1.2,.12,.8,red,0,.12);for(let i=0;i<7;i++)box(.025,.013,.81,pale,-.5+i*.16,.19);break;
 case 'rug': box(1.9,.035,1.4,cloth,0,.025);for(const x of [-.85,.85])box(.12,.012,1.4,pale,x,.05);break;
 case 'fan': cyl(.27,.07,dark,0,.06);cyl(.035,.6,metal,0,.35);handle(.33,0,.8,0);animated=new T.Group();animated.position.y=.8;group.add(animated);for(let i=0;i<3;i++){const b=box(.11,.28,.04,blue);group.remove(b);b.position.set(Math.sin(i*2.094)*.12,Math.cos(i*2.094)*.12,0);b.rotation.z=-i*2.094;animated.add(b);}ball(.07,pale,0,.8,.05);break;
 case 'mosquitonet': legs(1.5,1.1,1.4);box(1.65,.04,1.25,cloth,0,1.42);{const net=mat(0xdcebdc,{transparent:true,opacity:.25,side:T.DoubleSide});box(1.6,1.35,1.2,net,0,.72);}break;
 case 'buglamp': cyl(.18,.08,dark,0,.08);cyl(.18,.08,dark,0,.65);for(const x of [-.14,.14])box(.025,.55,.025,metal,x,.36);lamp(0x9944ff,.36);break;
 case 'solar': legs(.9,.5,.55);const panel=box(1.2,.05,.8,blue,0,.6);panel.rotation.x=-.3;for(let i=0;i<5;i++)box(.015,.015,.75,pale,-.48+i*.24,.64).rotation.x=-.3;box(.25,.25,.25,dark,.65,.15);break;
 case 'heater': cyl(.28,.08,dark,0,.08);cyl(.22,.55,metal,0,.4);glow=mat(0xff8a3c,{emissive:0xff7a22,emissiveIntensity:.08});cyl(.235,.3,glow,0,.43);cyl(.3,.06,dark,0,.72);handle(.25,0,.85,0);break;
 case 'woodrack': rack();for(let i=0;i<6;i++){const o=cyl(.09,.8,wood,-.3+(i%3)*.3,.43+Math.floor(i/3)*.18);o.rotation.z=Math.PI/2;}break;
 case 'snowshovel': cyl(.035,1.05,wood,0,.7);box(.5,.38,.07,blue,0,.2);handle(.12,0,1.28,0);break;
 case 'waterjug': cyl(.28,.6,blue,0,.35);cyl(.17,.06,pale,0,.68);box(.1,.08,.17,metal,0,.18,.32);handle(.14,0,.76,0);break;
 case 'dryingrack': legs(1,.6,1);box(1.1,.04,.04,metal,0,1);for(let i=0;i<3;i++)box(.23,.42,.025,i%2?blue:pale,-.35+i*.35,.8);break;
 case 'trashbin': for(const x of [-.3,.3]){box(.47,.6,.5,x<0?blue:cloth,x,.3);box(.5,.06,.53,dark,x,.62);box(.12,.035,.14,pale,x,.66);}break;
 case 'handwash': legs(.7,.45,.7);box(.85,.1,.6,pale,0,.74);cyl(.24,.12,metal,0,.8);cyl(.03,.3,metal,0,.94,-.2);box(.06,.05,.2,metal,0,1.07,-.12);box(.1,.19,.1,blue,.33,.88);break;
 case 'firstaid': box(.65,.4,.22,pale,0,.24);box(.12,.26,.025,red,0,.24,.125);box(.32,.09,.025,red,0,.24,.13);handle(.12,0,.53,0);break;
 case 'fireextinguisher': cyl(.14,.5,red,0,.3);cyl(.06,.08,metal,0,.58);box(.25,.04,.06,dark,.06,.66);handle(.15,.15,.49,0,dark);break;
 case 'bootsrack': rack();for(const x of [-.3,.1]){box(.16,.16,.3,dark,x,.43);box(.16,.26,.15,wood,x,.51,-.08);}break;
 case 'campflag': cyl(.025,1.7,metal,0,.85);cyl(.22,.05,dark,0,.025);animated=box(.65,.4,.025,red,.34,1.4);break;
 case 'windshield': for(let i=0;i<5;i++){const a=(i-2)*.5;const p=box(.3,.55,.035,metal,Math.sin(a)*.6,.3,-Math.cos(a)*.6);p.rotation.y=-a;}break;
 case 'umbrellastand': cyl(.23,.42,metal,0,.24);cyl(.025,1.1,wood,0,.8);mesh(new T.ConeGeometry(.5,.3,12),blue,0,1.2);handle(.1,0,.55,0);break;
 case 'stringlights': for(const x of [-1,1])cyl(.025,1.5,wood,x,.75);box(2,.018,.018,dark,0,1.42);glow=mat(0xffdf8a,{emissive:0xffc46b,emissiveIntensity:.08});for(let i=0;i<9;i++)ball(.065,glow,-.9+i*.225,1.32-Math.sin(i/8*Math.PI)*.15);break;
 case 'sleepingbag': box(1.7,.18,.67,blue,0,.13);cyl(.34,.15,dark,-.7,.18).rotation.z=Math.PI/2;for(let i=0;i<5;i++)box(.025,.01,.64,pale,-.4+i*.32,.225);break;
 case 'rainbarrel': cyl(.37,.8,cloth,0,.42);cyl(.39,.06,dark,0,.84);cyl(.025,.4,metal,.3,1.02);box(.15,.06,.17,metal,0,.15,.4);break;
 case 'thermos': cyl(.13,.6,metal,0,.34);cyl(.14,.13,dark,0,.71);cyl(.12,.16,pale,.32,.1);break;
 case 'icebox': box(.8,.45,.5,blue,0,.25);box(.85,.08,.55,pale,0,.51);for(let i=0;i<3;i++)box(.13,.12,.12,mat(0xbceaff,{transparent:true,opacity:.75}),-.2+i*.2,.61);break;
 case 'weatherstation': cyl(.025,1.4,metal,0,.7);box(.16,.5,.1,pale,0,.9);box(.03,.3,.015,red,0,.9,.06);animated=box(.7,.045,.06,blue,0,1.45);mesh(new T.ConeGeometry(.09,.2,3),red,.4,1.45).rotation.z=-Math.PI/2;break;
 }
 group.userData.gearId=id;
 return {group,interact(){active=!active;if(glow)glow.emissiveIntensity=active?1.8:.08;if(id==='pot')animated.position.y=active?.6:.41;return EXTRA_GEAR[id].use+(glow&&!active?' · 전원을 껐어요':'');},update(time){if(active&&animated&&id==='fan')animated.rotation.z=time*7;if(animated&&id==='campflag')animated.rotation.y=Math.sin(time*2)*.2;if(animated&&id==='weatherstation')animated.rotation.y=time*.3;},dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
