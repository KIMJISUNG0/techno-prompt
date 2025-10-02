// Bandlimited oscillator AudioWorkletProcessor (polyBLEP saw & square)
/* global AudioWorkletProcessor, registerProcessor, currentTime, sampleRate */
// Minimal voice manager. Messages:
// { type:'noteOn', id, freq, gain, wave, attack, decay, sustain, release, time }
// { type:'noteOff', id, time }
// { type:'config', oversample }
// { type:'flush' }

class Voice {
  constructor(id, sampleRate, params){
    this.id = id;
    this.sampleRate = sampleRate;
    this.phase = 0;
    this.freq = params.freq;
    this.gain = params.gain || 0.5;
    this.wave = params.wave || 'saw';
    this.envStage = 'attack';
    this.attack = params.attack || 0.005;
    this.decay = params.decay || 0.2;
    this.sustain = params.sustain ?? 0.5;
    this.release = params.release || 0.2;
    this.startTime = params.time || 0;
    this.releaseTime = null;
    this.ended = false;
    this.lastValue = 0;
  }
  advance(dt){
    const inc = this.freq * dt;
    this.phase += inc;
    if (this.phase >= 1) this.phase -= 1;
  }
  // polyBLEP helper
  polyBLEP(t, dt){
    if (t < dt){
      t /= dt; return t + t - t*t - 1;
    } else if (t > 1 - dt){
      t = (t - 1)/dt; return t*t + t + t + 1;
    }
    return 0;
  }
  sample(dt){
    let t = this.phase;
    let v;
    if (this.wave === 'saw') {
      v = 2*t - 1;
      v -= this.polyBLEP(t, this.freq*dt);
    } else if (this.wave === 'square') {
      // naive square with BLEP on both edges
      v = t < 0.5 ? 1 : -1;
      v += this.polyBLEP(t, this.freq*dt);
      v -= this.polyBLEP((t+0.5)%1, this.freq*dt);
    } else {
      v = Math.sin(2*Math.PI*t); // fallback sine
    }
    this.advance(dt);
    return v;
  }
  envGain(time){
    const relStart = this.releaseTime;
    const t = time - this.startTime;
    if (this.ended) return 0;
    if (relStart !== null) {
      const rt = time - relStart;
      if (rt >= this.release) { this.ended = true; return 0; }
      const from = this.levelAt(relStart - this.startTime);
      const g = from * Math.max(0, 1 - (rt/this.release));
      return g;
    }
    return this.levelAt(t);
  }
  levelAt(t){
    if (t < this.attack) return t/this.attack;
    t -= this.attack;
    if (t < this.decay) {
      const a = 1 - ((1 - this.sustain)*(t/this.decay));
      return a;
    }
    return this.sustain;
  }
  noteOff(time){
    if (this.releaseTime === null) this.releaseTime = time;
  }
}

class BandlimitedOscProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.voices = new Map();
    this.sampleRate = sampleRate;
    this.port.onmessage = (e)=> this.handle(e.data);
  }
  handle(msg){
    if (msg.type === 'noteOn') {
      const v = new Voice(msg.id, this.sampleRate, msg);
      this.voices.set(msg.id, v);
    } else if (msg.type === 'noteOff') {
      const v = this.voices.get(msg.id); if (v) v.noteOff(msg.time || currentTime);
    } else if (msg.type === 'flush') {
      this.voices.clear();
    }
  }
  // params currently unused (future modulation)
  process(inputs, outputs /*, params */){
    const output = outputs[0];
    const ch0 = output[0];
    const dt = 1/this.sampleRate;
    const baseTime = currentTime;
    for (let i=0;i<ch0.length;i++){
      const frameTime = baseTime + i*dt;
      let mix = 0;
      this.voices.forEach(v => {
        if (v.ended) return;
        const env = v.envGain(frameTime);
        if (env <= 0 && v.ended) return;
        const s = v.sample(dt) * env * v.gain;
        mix += s;
      });
      ch0[i] = mix;
    }
    // cleanup ended
    for (const [id,v] of this.voices){ if (v.ended) this.voices.delete(id); }
    return true;
  }
}

registerProcessor('bandlimited-osc', BandlimitedOscProcessor);
