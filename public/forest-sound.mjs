// Layers share the site's master volume and AudioContext. Nothing plays before unlock.
export class ForestSound {
  constructor(context, destination) {
    this.context = context;
    this.output = context.createGain();
    this.output.gain.value = 0;
    this.output.connect(destination);
    this.layers = [];
    const frames = Math.floor(context.sampleRate * 11);
    const noise = context.createBuffer(2, frames, context.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = noise.getChannelData(ch);
      let low = 0;
      for (let i = 0; i < frames; i++) {
        const white = Math.random() * 2 - 1;
        low = low * 0.985 + white * 0.015;
        data[i] = white * 0.38 + low * 3.5;
      }
      // Feather the loop junction to avoid an artificial repeating tick.
      const fade = Math.floor(context.sampleRate * 0.04);
      for (let i = 0; i < fade; i++) {
        data[i] *= i / fade;
        data[frames - 1 - i] *= i / fade;
      }
    }
    for (const [type, frequency, q, pan, offset] of [
      ['lowpass', 360, 0.55, -0.6, 0],
      ['bandpass', 950, 0.45, 0.55, 3.1],
      ['highpass', 2200, 0.35, -0.75, 6.3],
      ['bandpass', 3800, 0.5, 0.8, 1.7],
    ]) {
      const source = context.createBufferSource(), filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = noise; source.loop = true;
      filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
      gain.gain.value = 0;
      source.connect(filter); filter.connect(gain);
      if (context.createStereoPanner) {
        const panner = context.createStereoPanner(); panner.pan.value = pan;
        gain.connect(panner); panner.connect(this.output);
      } else gain.connect(this.output);
      source.start(0, offset);
      this.layers.push(gain);
    }
    this.nextUpdate = 0;
    this.morning = null;
  }
  update(morning, time) {
    const c = this.context;
    if (morning !== this.morning) {
      this.morning = morning;
      this.output.gain.setTargetAtTime(morning ? 0.48 : 0, c.currentTime, 1.5);
    }
    if (time < this.nextUpdate || !morning) return;
    this.nextUpdate = time + 0.15;
    // Unequal rhythms leave quiet gaps and let gusts move through the canopy.
    const gust = Math.pow(0.5 + 0.5 * Math.sin(time * 0.19 + Math.sin(time * 0.071)), 2);
    const leaves = Math.pow(0.5 + 0.5 * Math.sin(time * 0.43 + Math.sin(time * 0.13) * 2), 3);
    const values = [0.25 + gust * 0.21, 0.06 + gust * 0.13,
      0.025 + leaves * 0.11, 0.018 + leaves * (0.5 + 0.5 * Math.sin(time * 0.31)) * 0.07];
    this.layers.forEach((gain, i) => gain.gain.setTargetAtTime(values[i], c.currentTime, 0.65));
  }
}
