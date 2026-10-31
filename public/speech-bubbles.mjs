export function createSpeechBubbles(root,documentRef=document) {
  const entries=new Map();
  return {
    show(id,text,now) {
      if(!Number.isSafeInteger(id)||id<1||typeof text!=='string'||!text.trim())return;
      this.remove(id);
      const node=documentRef.createElement('div');node.className='speech-bubble';
      node.textContent=text.slice(0,200);root.append(node);
      entries.set(id,{node,until:now+Math.min(10,Math.max(5,text.length*.055+4))});
    },
    remove(id){const entry=entries.get(id);if(entry){entry.node.remove();entries.delete(id);}},
    clear(){for(const id of [...entries.keys()])this.remove(id);},
    update(now,positionFor,width) {
      for(const [id,entry] of entries) {
        if(now>=entry.until){this.remove(id);continue;}
        const p=positionFor(id);entry.node.hidden=!p?.visible;
        if(!p?.visible)continue;
        const half=Math.min(entry.node.offsetWidth/2,width/2-8);
        const x=Math.max(half+8,Math.min(width-half-8,p.x));
        entry.node.style.left=`${x}px`;entry.node.style.top=`${p.y}px`;
      }
    },
  };
}
