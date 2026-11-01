// Recorded ambience is audio only; every visible object belongs to the 3D campsite.
export class FieldAudio {
  constructor(context,destination) {
    this.context=context;this.output=context.createGain();this.output.gain.value=0;this.output.connect(destination);
    this.audio=new Audio();this.audio.loop=true;this.audio.preload='none';
    context.createMediaElementSource(this.audio).connect(this.output);
    this.kind=null;this.active=false;this.request=0;this.pending=null;
    this.audio.addEventListener('error',()=>{this.active=false;this.kind=null;});
  }
  stop() {
    this.request++;this.audio.pause();this.active=false;this.kind=null;this.pending=null;
    this.output.gain.cancelScheduledValues(this.context.currentTime);
    this.output.gain.setValueAtTime(0,this.context.currentTime);
  }
  async play(kind) {
    if(this.kind===kind&&this.active&&!this.audio.paused)return;
    if(this.kind===kind&&this.pending)return this.pending.catch(()=>{});
    const request=++this.request;this.kind=kind;this.active=false;
    this.audio.src=kind==='rain'?'./assets/rain-recording.mp3':kind==='morning'?'./assets/forest-recording.mp3':'./assets/fire-recording.mp3';
    this.audio.load();
    this.output.gain.cancelScheduledValues(this.context.currentTime);
    this.output.gain.setValueAtTime(0,this.context.currentTime);
    this.output.gain.linearRampToValueAtTime(kind==='rain'?.8:kind==='morning'?.75:.55,this.context.currentTime+2.8);
    try {
      // Request both before yielding so iOS retains the user activation.
      const resumed=this.context.resume();
      const playing=this.audio.play();
      this.pending=Promise.all([resumed,playing]);
      await this.pending;if(request===this.request)this.active=true;
    } catch {if(request===this.request){this.active=false;this.kind=null;}}
    finally {if(request===this.request)this.pending=null;}
  }
}
