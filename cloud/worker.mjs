import {pushAdmin,sendFeedbackPush} from '../lib/feedback-push.mjs';
import {receiveFeedback} from '../lib/feedback.mjs';
import {CampHub} from '../lib/camp-hub.mjs';

export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname.startsWith('/push/'))return env.CAMPS.getByName('customer-feedback').fetch(request);
    if(url.pathname==='/feedback')return env.CAMPS.getByName('customer-feedback').fetch(request);
    if(url.pathname==='/health') return Response.json({ok:true});
    if(url.pathname==='/presence') {
      const results=await Promise.all(['1','2','3'].map(room=>env.CAMPS.getByName(`camp-${room}`).fetch(new Request(new URL('/presence',url))).then(r=>r.json())));
      const rooms={1:0,2:0,3:0};
      for(const result of results)for(const room of ['1','2','3'])rooms[room]+=result.rooms?.[room]||0;
      return Response.json({total:Object.values(rooms).reduce((sum,n)=>sum+n,0),rooms},{headers:{'Cache-Control':'no-store'}});
    }
    if(url.pathname==='/stats') {
      const results=await Promise.all(['1','2','3'].map(room=>env.CAMPS.getByName(`camp-${room}`).fetch(new Request(new URL('/stats',url))).then(r=>r.json())));
      return Response.json({date:results[0].date,measure:'sessions',rooms:Object.assign({},...results.map(r=>r.rooms))},{headers:{'Cache-Control':'no-store'}});
    }
    if((url.pathname==='/chat'||url.pathname==='/watch')) {
      if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket') {
        return new Response('WebSocket connection required',{status:426});
      }
      const requested=url.searchParams.get('server');
      const room=['1','2','3'].includes(requested)?requested:'1';
      const target=env.CAMPS.getByName(`camp-${room}`);
      if(url.pathname==='/watch'){
        const ready=await target.fetch(new Request(new URL('/capabilities',url)));
        if(!ready.ok)return new Response('Camp update in progress',{status:503,headers:{'Retry-After':'5'}});
      }
      return target.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

// Hibernating WebSockets retain only session metadata. No conversation history
// or worry text is written to a database. The ctx constructor form is supported
// by Durable Objects without a platform import, keeping protocol tests portable.
export class CampRoom {
  constructor(ctx,env={}) {
    this.env=env;
    this.ctx=ctx;this.hub=new CampHub();this.sessions=new Map();
    this.ready=ctx.blockConcurrencyWhile(async()=>{this.hub.loadMetrics(await ctx.storage.get('counts'));});
    for(const socket of ctx.getWebSockets()) {
      const data=socket.deserializeAttachment();
      if(data&&socket.readyState===1) {
        const client={send:raw=>socket.send(raw)};
        if(data.watch)this.hub.watch(client,{room:data.room,restore:true});else this.hub.restore(client,data);this.sessions.set(socket,client);
      }
    }
  }
  async fetch(request) {
    await this.ready;
    if(new URL(request.url).pathname.startsWith('/push/'))return pushAdmin(request,this.ctx.storage,this.env);
    if(new URL(request.url).pathname==='/feedback'){
      const response=await receiveFeedback(request,this.ctx.storage);
      if(response.status===201){const {id}=await response.clone().json();const item=await this.ctx.storage.get('feedback:'+id);this.ctx.waitUntil(sendFeedbackPush(this.ctx.storage,this.env,{title:(item.type==='bug'?'🐛 버그 신고':'💡 기능 제안')+' · '+item.title,body:item.message.slice(0,180),url:'/owner-push.html'}));}
      return response;
    }
    if(new URL(request.url).pathname==='/capabilities')return Response.json({watch:true});
    if(new URL(request.url).pathname==='/presence') return Response.json(this.hub.getPresence());
    if(new URL(request.url).pathname==='/stats') return Response.json(this.hub.getMetrics());
    if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket') {
      return new Response('WebSocket connection required',{status:426});
    }
    const [browser,socket]=Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(socket);
    const client={send:raw=>socket.send(raw)};
    const params=new URL(request.url).searchParams;
    if(new URL(request.url).pathname==='/watch'){
      this.hub.watch(client,{room:params.get('server')});this.sessions.set(socket,client);
      socket.serializeAttachment({watch:true,room:client.room});
      return new Response(null,{status:101,webSocket:browser});
    }
    this.hub.join(client,{room:params.get('server'),visitor:params.get('visitor'),near:params.get('near'),quiet:params.get('quiet')!=='0',stand:params.get('stand')==='1'});
    this.sessions.set(socket,client);
    socket.serializeAttachment(this.hub.snapshot(client));
    return new Response(null,{status:101,webSocket:browser});
  }
  async webSocketMessage(socket,message) {
    const client=this.sessions.get(socket);if(!client||client.watch) return;
    const before=this.hub.metricsRevision;
    this.hub.message(client,message,typeof message!=='string');
    socket.serializeAttachment(this.hub.snapshot(client));
    if(this.hub.metricsRevision!==before) await this.ctx.storage.put('counts',this.hub.getMetrics());
  }
  webSocketClose(socket) {
    const client=this.sessions.get(socket);
    if(client) this.hub.leave(client);
    this.sessions.delete(socket);
    try {socket.close?.(1000,'');} catch { /* already closed */ }
  }
  webSocketError(socket) {this.webSocketClose(socket);}
}
