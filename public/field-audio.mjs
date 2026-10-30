// Recorded ambience is audio only; every visible object belongs to the 3D campsite.
export class FieldAudio {
  constructor(context,destination) {
    this.context=context;this.output=context.createGain();this.output.gain.value=0;this.output.connect(destination);
    this.audio=new Audio();this.audio.loop=true;this.audio.preload='none';
    context.createMediaElementSource(this.audio).connect(this.output);
    this.kind=null;this.active=false;this.request=0;
    this.audio.addEventListener('error',()=>{this.active=false;this.kind=null;});
  }
  async play(kind) {
    if(this.kind===kind&&this.active)return;
    const request=++this.request;this.kind=kind;this.active=false;
    this.audio.src=kind==='morning'?'./assets/forest-recording.mp3':'./assets/fire-recording.mp3';
    this.audio.load();
    this.output.gain.cancelScheduledValues(this.context.currentTime);
    this.output.gain.setValueAtTime(0,this.context.currentTime);
    this.output.gain.linearRampToValueAtTime(kind==='morning'?.75:.55,this.context.currentTime+2.8);
    try {
      await this.context.resume();if(request!==this.request)return;
      await this.audio.play();if(request===this.request)this.active=true;
    } catch {if(request===this.request){this.active=false;this.kind=null;}}
  }
}
