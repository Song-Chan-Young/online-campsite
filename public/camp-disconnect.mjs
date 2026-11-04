// Await the close handshake before loading a room that watches the old room.
export async function disconnectForTransfer(socket,timeout=1500){
 if(!socket||socket.readyState===3)return;
 await new Promise(resolve=>{
  const done=()=>{clearTimeout(timer);socket.removeEventListener('close',done);resolve();};
  const timer=setTimeout(done,timeout);socket.addEventListener('close',done,{once:true});
  try{socket.close(1000,'area-transfer');}catch{done();}
 });
}
