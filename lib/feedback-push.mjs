import webpush from 'web-push';
export function validSubscription(s){
 try{const u=new URL(s.endpoint);return u.protocol==='https:'&&u.port===''&&['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname)&&typeof s.keys?.p256dh==='string'&&s.keys.p256dh.length<200&&typeof s.keys?.auth==='string'&&s.keys.auth.length<100;}catch{return false;}
}
export async function sendFeedbackPush(storage,env,payload,send=fetch){
 const subscriptions=await storage.list({prefix:'push:',limit:20});
 let sent=0;
 for(const [key,subscription]of subscriptions){
  try{
   const details=webpush.generateRequestDetails(subscription,JSON.stringify(payload),{TTL:86400,vapidDetails:{subject:'https://bangguseok-camp.bangguseok-camp.workers.dev',publicKey:env.PUSH_PUBLIC_KEY,privateKey:env.PUSH_PRIVATE_KEY}});
   const response=await send(details.endpoint,{method:'POST',headers:details.headers,body:details.body});
   if(response.status===404||response.status===410)await storage.delete(key);
   else if(!response.ok)throw new Error('Push service rejected request');else sent++;
  }catch{await storage.put('push-last-error',{at:new Date().toISOString(),message:'알림 전송 실패'});}
 }
 return sent;
}
export async function pushAdmin(request,storage,env){
 if(!env.PUSH_ADMIN_TOKEN||request.headers.get('Authorization')!==`Bearer ${env.PUSH_ADMIN_TOKEN}`)return Response.json({error:'관리자 연결 링크를 확인해 주세요.'},{status:401});
 const path=new URL(request.url).pathname;
 if(path==='/push/config'&&request.method==='GET')return Response.json({publicKey:env.PUSH_PUBLIC_KEY},{headers:{'Cache-Control':'no-store'}});
 if(path==='/push/inbox'&&request.method==='GET'){
  const entries=await storage.list({prefix:'feedback:',limit:500});
  return Response.json({items:[...entries.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))},{headers:{'Cache-Control':'no-store'}});
 }
 if(path==='/push/subscribe'&&request.method==='POST'){
  const raw=await request.text();if(raw.length>4096)return new Response(null,{status:413});
  let subscription;try{subscription=JSON.parse(raw);}catch{return new Response(null,{status:400});}
  if(!validSubscription(subscription))return Response.json({error:'알림 구독 정보가 올바르지 않아요.'},{status:400});
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(subscription.endpoint));
  const key='push:'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  const entries=await storage.list({prefix:'push:',limit:22});if(entries.size>=20&&!entries.has(key))return Response.json({error:'등록 가능한 기기 수를 초과했어요.'},{status:409});
  await storage.put(key,subscription);
  const sent=await sendFeedbackPush(storage,env,{title:'고객의 소리 알림 연결',body:'새 의견이 접수되면 이 휴대폰으로 알려드려요.',url:'/owner-push.html'});
  return Response.json({ok:true,testSent:sent>0});
 }
 return new Response(null,{status:405});
}
