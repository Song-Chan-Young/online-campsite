export function validateFeedback(body){
 if(!body||!['feature','bug'].includes(body.type))throw new Error('접수 유형을 선택해 주세요.');
 const title=typeof body.title==='string'?body.title.trim():'';
 const message=typeof body.message==='string'?body.message.trim():'';
 if(title.length<2||title.length>100)throw new Error('제목을 2~100자로 작성해 주세요.');
 if(message.length<10||message.length>3000)throw new Error('내용을 10~3000자로 작성해 주세요.');
 return {type:body.type,title,message};
}
export async function receiveFeedback(request,storage){
 if(request.method!=='POST')return Response.json({error:'허용되지 않은 요청입니다.'},{status:405});
 const origin=request.headers.get('Origin');
 if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'허용되지 않은 요청입니다.'},{status:403});
 let body;try{const raw=await request.text();if(raw.length>14000)return Response.json({error:'내용이 너무 깁니다.'},{status:413});body=validateFeedback(JSON.parse(raw));}catch(e){return Response.json({error:e.message==='Unexpected end of JSON input'?'내용을 확인해 주세요.':e.message},{status:400});}
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
 const key='rate:'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 return storage.transaction(async tx=>{
  const now=Date.now(),last=await tx.get(key);
  if(last&&now-last<60000)return Response.json({error:'잠시 후 다시 접수해 주세요. (1분 간격)'},{status:429});
  const id=crypto.randomUUID();
  await tx.put('feedback:'+id,{id,...body,createdAt:new Date(now).toISOString(),status:'new'});
  await tx.put(key,now);
  return Response.json({ok:true,id},{status:201});
 });
}
