export function inviteAddress(address,server,visitor) {
  const url=new URL(address);
  url.search='';url.hash='';
  url.searchParams.set('server',String(server));url.searchParams.set('near',visitor);
  return url.href;
}
export function burnPrivateWorry(input,onBurn) {
  if(!input.value.trim()) return false;
  input.value='';
  onBurn();   // deliberately receives no text: the ritual is local and ephemeral
  return true;
}
export function photoCaption(nickname,date) {return `방구석 캠핑장 · ${nickname} · ${date}`;}
export function drawPostcard(canvas,source,{nickname,date,address}) {
  const scale=Math.min(1,1600/source.width,1800/source.height);
  canvas.width=Math.round(source.width*scale);canvas.height=Math.round(source.height*scale)+116;
  const ctx=canvas.getContext('2d');const bottom=canvas.height-116;
  ctx.drawImage(source,0,0,canvas.width,bottom);
  ctx.fillStyle='#19261f';ctx.fillRect(0,bottom,canvas.width,116);
  ctx.fillStyle='#f6dfb5';ctx.font='600 24px sans-serif';
  ctx.fillText('방구석 캠핑장',20,bottom+34,canvas.width-40);
  ctx.fillStyle='#eee9df';ctx.font='15px sans-serif';
  ctx.fillText(`${nickname} · ${date}`,20,bottom+62,canvas.width-40);
  ctx.fillStyle='#b9c3b7';ctx.font='12px sans-serif';
  ctx.fillText('혼자여도 좋고, 같이여도 좋은 밤.',20,bottom+84,canvas.width-40);
  ctx.fillText(new URL(address).hostname,20,bottom+103,canvas.width-40);
}
export function makeVisitorToken(api=globalThis.crypto) {
  if(api?.randomUUID) return api.randomUUID();
  if(api?.getRandomValues) return [...api.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
  // This is only an invitation anchor, never an authentication credential.
  return `camper-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
