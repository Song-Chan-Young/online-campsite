// Real recorded media only; this view never warps or animates a still photograph.
export class AmbientMedia {
  constructor(video, status, audioContext, destination) {
    this.video=video;this.status=status;this.context=audioContext;
    this.output=audioContext.createGain();this.output.gain.value=0;this.output.connect(destination);
    this.audio=new Audio();this.audio.loop=true;this.audio.preload='none';
    this.source=audioContext.createMediaElementSource(this.audio);this.source.connect(this.output);
    this.active=false;this.kind=null;
    video.muted=true;video.loop=true;video.playsInline=true;
    video.addEventListener('playing',()=>{status.hidden=true;});
    video.addEventListener('waiting',()=>{if(this.active){status.textContent='영상을 불러오는 중…';status.hidden=false;}});
    video.addEventListener('error',()=>{if(this.active){status.textContent='영상을 불러오지 못했어요. 다시 재생해 주세요';status.hidden=false;}});
    this.audio.addEventListener('error',()=>{if(this.active){status.textContent='환경음을 불러오지 못했어요';status.hidden=false;}});
  }
  async open(kind) {
    const request = this.request = (this.request || 0) + 1;
    this.active=true;this.kind=kind;
    const morning=kind==='morning';
    const videoURL=morning?'./assets/tent-morning-real.mp4':kind==='stars'?'./assets/aurora-stars-4k.mp4':'./assets/campfire-real.mp4';
    const audioURL=morning?'./assets/forest-recording.mp3':'./assets/fire-recording.mp3';
    if(this.video.getAttribute('src')!==videoURL) {this.video.src=videoURL;this.video.load();}
    if(this.audio.getAttribute('src')!==audioURL) {this.audio.src=audioURL;this.audio.load();}
    this.status.textContent='잠깐, 자리를 준비하는 중…';this.status.hidden=false;
    this.output.gain.cancelScheduledValues(this.context.currentTime);
    this.output.gain.setValueAtTime(0,this.context.currentTime);
    this.output.gain.linearRampToValueAtTime(morning?0.7:kind==='stars'?0.16:0.65,this.context.currentTime+1.2);
    await this.context.resume();
    if (!this.active || request !== this.request) return;
    const results=await Promise.allSettled([this.video.play(),this.audio.play()]);
    if (request !== this.request) return;
    if(!this.active) {this.video.pause();this.audio.pause();return;}
    if(results[0].status==='rejected') {
      this.status.textContent='재생 버튼을 눌러 시작해 주세요';this.status.hidden=false;
    } else if(results[1].status==='rejected') {
      this.status.textContent='소리 재생을 눌러 환경음을 켜 주세요';this.status.hidden=false;
    }
  }
  close() {
    this.active=false; this.request = (this.request || 0) + 1;
    this.video.pause();this.audio.pause();
    this.output.gain.cancelScheduledValues(this.context.currentTime);
    this.output.gain.setValueAtTime(0,this.context.currentTime);
  }
}
