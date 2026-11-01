import {claimSpot, firstFreeSpot} from './spots.mjs';
import {camperPosition,safeWorldPosition} from '../public/camp-navigation.mjs';
import {CAMP_SEATS} from '../public/camp-circle.mjs';

const ROOMS=new Set(['1','2','3']), POSES=new Set(['sit','stand','walk','lie']);
const CHAIRS=CAMP_SEATS.map(seat=>seat.id);
const number=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1000?Math.round(v*100)/100:null;
const text=(v,max)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
const token=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{6,80}$/.test(v)?v:'';

// The same application protocol serves local Node and the cloud adapter.
// Only connected session state is retained. Chat and private worries are not stored.
export class CampHub {
  constructor({now=()=>Date.now()}={}) {this.clients=new Set();this.watchers=new Set();this.nextId=1;this.now=now;this.metrics=null;this.metricsRevision=0;}
  getPresence() {
    const rooms={1:0,2:0,3:0};
    for(const client of this.clients) rooms[client.room]++;
    return {total:Object.values(rooms).reduce((sum,n)=>sum+n,0),rooms};
  }
  getMetrics() {
    const date=new Date(this.now()).toISOString().slice(0,10);
    if(this.metrics?.date!==date) this.metrics={date,measure:'sessions',rooms:{}};
    return structuredClone(this.metrics);
  }
  loadMetrics(metrics) {if(metrics?.measure==='sessions'&&metrics.rooms&&typeof metrics.rooms==='object') this.metrics=metrics;}
  count(c,key) {
    this.getMetrics();
    const room=this.metrics.rooms[c.room]??={entries:0,returningEntries:0,engaged:0,inviteEntries:0,gifts:0};
    room[key]++;this.metricsRevision++;
  }
  send(c,message) {try {c.send(JSON.stringify(message));} catch { /* transport close handles cleanup */ }}
  broadcast(room,message,except=null,onlySocial=false) {
    for(const c of this.clients) if(c!==except&&c.room===room&&(!onlySocial||!c.quiet)) this.send(c,message);
    for(const c of this.watchers)if(c.room===room)this.send(c,message);
  }
  watch(c,{room='1',restore=false}={}) {
    c.watch=true;c.room=ROOMS.has(String(room))?String(room):'1';this.watchers.add(c);
    if(!restore)this.send(c,{type:'watch',room:c.room,peers:[...this.clients].filter(p=>p.room===c.room).map(p=>this.peer(p))});
    return c;
  }
  take(c,bucket,limit,window=1000) {
    const now=this.now(); c[bucket]=(c[bucket]||[]).filter(t=>now-t<window);
    if(c[bucket].length>=limit) return false;
    c[bucket].push(now); return true;
  }
  uniqueName(want,except=null) {
    const used=new Set([...this.clients].filter(c=>c!==except).map(c=>c.cname));
    let name=want;
    for(let i=2;used.has(name);i++) {const suffix=` ${i}`;name=want.slice(0,12-suffix.length)+suffix;}
    return name;
  }
  assignAppearance(c) {
    let hash=0;for(const char of c.visitor||String(c.id))hash=(hash*31+char.charCodeAt(0))>>>0;
    const used=new Set([...this.clients].filter(peer=>peer.room===c.room).map(peer=>peer.appearance));
    for(let offset=0;offset<48;offset++){const index=(hash+offset)%48;if(!used.has(index))return index;}
    return hash%48;
  }
  snapshot(c) {
    const {id,room,cname,spot,state,quiet,visitor,appearance,sent,stateAt,controlAt,woodAt,lastGift,entryAt,engaged,invite}=c;
    return {id,room,cname,spot,state,quiet,visitor,appearance,sent,stateAt,controlAt,woodAt,lastGift,entryAt,engaged,invite};
  }
  restore(c,data) {Object.assign(c,data);if(!Number.isInteger(c.appearance))c.appearance=this.assignAppearance(c);this.clients.add(c);this.nextId=Math.max(this.nextId,c.id+1);return c;}
  join(c,{room='1',visitor='',near='',quiet=true}={}) {
    c.id=this.nextId++;c.room=ROOMS.has(room)?room:'1';
    c.quiet=quiet!==false;c.visitor=token(visitor);c.spot=null;c.state=null;
    c.appearance=this.assignAppearance(c);
    c.sent=[];c.stateAt=[];c.controlAt=[];c.lastGift=null;c.entryAt=null;c.engaged=false;c.invite=Boolean(near);
    const adj=['고요한','느긋한','포근한','푸른','따뜻한'];
    const noun=['도토리','솔방울','반딧불','다람쥐','모닥불'];
    c.cname=this.uniqueName(`${adj[Math.floor(Math.random()*adj.length)]} ${noun[Math.floor(Math.random()*noun.length)]}`);
    const inviter=token(near)&&[...this.clients].find(p=>p.room===c.room&&p.visitor===near);
    const chairs=[...CHAIRS];
    if(inviter) {
      const seatIndex=Number(inviter.spot?.split(':')[1]);
      const target=inviter.state||CAMP_SEATS[seatIndex];
      if(target) chairs.sort((a,b)=>{
        const distance=id=>{const seat=CAMP_SEATS[Number(id.slice(5))];return Math.hypot(seat.x-target.x,seat.z-target.z);};
        return distance(a)-distance(b);
      });
    }
    c.spot=firstFreeSpot(c,chairs,this.clients);
    this.clients.add(c);
    const peers=[...this.clients].filter(p=>p!==c&&p.room===c.room).map(p=>this.peer(p));
    this.send(c,{type:'welcome',name:c.cname,id:c.id,room:c.room,spot:c.spot,quiet:c.quiet,appearance:c.appearance,peers,
      invite:near?(inviter?(c.spot?'nearby':'full'):'missing'):null});
    this.broadcast(c.room,{type:'join',...this.peer(c)},c);
    return c;
  }
  peer(c) {return {id:c.id,name:c.cname,...camperPosition({id:c.id,spot:c.spot,...(c.state||{})}),spot:c.spot,quiet:c.quiet,appearance:c.appearance};}
  leave(c) {
    if(this.watchers.delete(c))return;
    if(!this.clients.delete(c)) return;
    this.broadcast(c.room,{type:'leave',id:c.id});
  }
  message(c,raw,isBinary=false) {
    if(isBinary||!this.clients.has(c)||typeof raw!=='string'||new TextEncoder().encode(raw).length>4096) return;
    let m;try {m=JSON.parse(raw);} catch {return;}
    if(!m||typeof m!=='object') return;
    if(m.type==='visit') {
      if(c.entryAt===null) {
        c.entryAt=this.now();this.count(c,'entries');
        if(m.returning===true) this.count(c,'returningEntries');
        if(c.invite) this.count(c,'inviteEntries');
      }
      return;
    }
    if(m.type==='engaged') {
      if(!c.engaged&&c.entryAt!==null&&this.now()-c.entryAt>=300000) {c.engaged=true;this.count(c,'engaged');}
      return;
    }
    if(m.type==='name') {
      const want=text(m.name,12);if(!want||want===c.cname||!this.take(c,'controlAt',5)) return;
      c.cname=this.uniqueName(want,c);this.send(c,{type:'renamed',name:c.cname});
      this.broadcast(c.room,{type:'name',id:c.id,name:c.cname},c);return;
    }
    if(m.type==='mode') {
      if(typeof m.quiet!=='boolean') return;
      if(!this.take(c,'controlAt',5)) {this.send(c,{type:'mode',id:c.id,quiet:c.quiet});return;}
      c.quiet=m.quiet;this.send(c,{type:'mode',id:c.id,quiet:c.quiet});
      this.broadcast(c.room,{type:'mode',id:c.id,quiet:c.quiet},c);return;
    }
    if(m.type==='state') {
      const x=number(m.x),z=number(m.z),yaw=number(m.yaw);
      if(x===null||z===null||yaw===null||!POSES.has(m.pose)||!this.take(c,'stateAt',20)) return;
      const spot=m.spot===undefined?null:m.spot;
      if(!claimSpot(c,spot,this.clients)) {
        this.send(c,{type:'spot-busy',spot,occupied:[...this.clients].filter(p=>p!==c&&p.room===c.room&&p.spot).map(p=>p.spot)});return;
      }
      c.state={...safeWorldPosition(x,z,c.room,c.id*2.399),yaw,pose:m.pose,held:m.held==='marshmallow'&&m.pose!=='lie'?'marshmallow':null,lieSpot:['mat','mat2','mat3','hammock','tent','car'].includes(m.lieSpot)?m.lieSpot:'mat',spot:c.spot};
      this.broadcast(c.room,{type:'state',...this.peer(c)},c);return;
    }
    if(m.type==='gift') {
      const target=[...this.clients].find(p=>p.id===m.to&&p.room===c.room&&p!==c);
      const notify=message=>this.send(c,{type:'notice',message});
      if(c.quiet) return notify('함께 쉬기로 바꾸면 선물을 건넬 수 있어요');
      if(!target||target.quiet) return notify('지금 선물을 받을 수 있는 분이 아니에요');
      if(!c.state||!target.state||Math.hypot(c.state.x-target.state.x,c.state.z-target.state.z)>6) return notify('조금 더 가까이 다가가 주세요');
      if(c.lastGift!==null&&this.now()-c.lastGift<10000) return notify('잠깐 쉬었다가 다시 건네 주세요');
      c.lastGift=this.now();this.count(c,'gifts');
      const gift={type:'gift',from:c.id,to:target.id,name:c.cname,targetName:target.cname,item:'marshmallow'};
      this.send(c,gift);this.send(target,gift);return;
    }
    if(m.type==='firewood') {
      if(!this.take(c,'woodAt',1,3000)){this.send(c,{type:'notice',code:'wood-rate-limit',message:'장작이 타오르는 동안 잠깐 기다려 주세요.'});return;}
      this.broadcast(c.room,{type:'firewood',id:c.id,name:c.cname,at:this.now()});return;
    }
    if(c.quiet) return;
    if(m.type==='act'&&m.act==='hello'&&m.reply!==true&&this.take(c,'sent',5)) {
      this.broadcast(c.room,{type:'act',act:'hello',id:c.id,to:Number.isInteger(m.to)?m.to:null},c,true);return;
    }
    if(m.type==='chat') {
      const content=text(m.text,200);if(!content||!this.take(c,'sent',5)) return;
      this.broadcast(c.room,{type:'chat',id:c.id,name:c.cname,text:content,at:this.now()},null,true);
    }
  }
}
