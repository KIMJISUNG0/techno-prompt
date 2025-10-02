// Advanced WebAudio live coding engine (Phase1 upgrade)
// - Adds richer synthesis (kick/snare/hat/bass/lead/pad)
// - FX buses: delay, reverb, master comp, sidechain ducking
// - Velocity mapping via pattern characters (X x . -)
// - Swing support & update() API (to be wired in sandbox)

export interface PlayOptions {
  pattern: string;
  notes?: number[];
  type?: 'kick'|'snare'|'hat'|'perc'|'bass'|'lead'|'pad'|'fx'|'guitar'|'bassGtr'|'piano'|'organ'|'tom'|'clap'|'ride';
  gain?: number;
  decay?: number; // legacy fallback
  env?: { attack:number; decay:number; sustain:number; release:number };
  wave?: 'sine'|'saw'|'square'|'triangle'|'noise'|'supersaw';
  unison?: number;
  detune?: number; // cents
  filter?: { type:'lowpass'|'bandpass'|'highpass'; cutoff:number; q?:number; envAmt?:number };
  lfo?: { target:'cutoff'|'gain'|'pitch'; rate:number; depth:number; shape?:'sine'|'triangle' };
  glide?: number; // seconds
  delay?: { mix:number; time:number; feedback:number };
  reverb?: { mix:number; size?:number };
  sidechain?: boolean;
  velocityMap?: { accent:number; normal:number; ghost:number };
  pan?: number; // -1..1
  pitchOffset?: number; // semitone global offset
  randomPitch?: number; // ±semitone jitter
  randomStart?: number; // seconds jitter
  tag?: string;
}

// Velocity multipliers default
import { tonePlay, toneStop, toneStopAll, listToneIds, setToneBPM, tonePatternPlay, tonePatternStop, tonePatternStopAll } from './toneBridge';
const DEFAULT_VELOCITY = { accent:1.25, normal:1.0, ghost:0.55 } as const;

interface TrackState {
  id: string;
  opts: PlayOptions;
  stepIndex: number;
  sideGain?: GainNode; // for sidechain ducking
}

class LiveEngine {
  private ctx: AudioContext | null = null;
  private bpm = 130;
  private tracks = new Map<string, TrackState>();
  private timer: number | null = null;
  private lookaheadMs = 80;
  private scheduleHorizon = 0.15; // seconds
  private lastScheduleTime = 0;
  private started = false;
  private swingPct = 0;
  // FX / bus nodes
  private masterGain: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private delaySend: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null; // simple generated impulse
  private analyser: AnalyserNode | null = null; // lightweight visualization tap
  private fftData?: Uint8Array;
  private timeData?: Uint8Array; // byte time-domain data

  ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.setupBuses();
    }
    return this.ctx;
  }

  private setupBuses(){
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.ratio.value = 3.2;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.12;
    // Delay
    this.delaySend = ctx.createGain(); this.delaySend.gain.value = 0.0;
    this.delayNode = ctx.createDelay(1.5); this.delayNode.delayTime.value = 0.3;
    this.delayFeedback = ctx.createGain(); this.delayFeedback.gain.value = 0.35;
    this.delayNode.connect(this.delayFeedback).connect(this.delayNode);
    // Reverb (procedural impulse)
    this.reverbSend = ctx.createGain(); this.reverbSend.gain.value = 0.0;
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = this.makeImpulse(ctx, 1.8, 0.4);
    // Wiring
    this.delayNode.connect(this.masterGain);
    this.reverbSend.connect(this.reverbNode).connect(this.masterGain);
    this.delaySend.connect(this.delayNode);
    this.masterGain.connect(this.compressor);
    // analyser tap after compressor (post-FX)
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256; // 128 frequency bins (low overhead)
    this.analyser.smoothingTimeConstant = 0.82;
    this.compressor.connect(this.analyser).connect(ctx.destination);
    this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize); // time domain size equals fftSize
  }

  private makeImpulse(ctx: AudioContext, duration: number, decay: number){
    const sr = ctx.sampleRate;
    const len = sr * duration;
    const buf = ctx.createBuffer(2, len, sr);
    for (let c=0;c<2;c++) {
      const data = buf.getChannelData(c);
      for (let i=0;i<len;i++) {
        data[i] = (Math.random()*2-1)* Math.pow(1 - i/len, decay);
      }
    }
    return buf;
  }

  async startIfNeeded() {
    const c = this.ensureCtx();
    if (c.state === 'suspended') await c.resume();
    if (!this.started) {
      this.started = true;
      this.loop();
    }
  }

  setBPM(bpm: number) { this.bpm = bpm; }
  setSwing(pct: number) { this.swingPct = pct; }

  play(id: string, opts: PlayOptions) {
    if (!opts.pattern) return;
    // sidechain flag default
    if (opts.type === 'bass' || opts.type==='pad') {
      if (opts.sidechain === undefined) opts.sidechain = true;
    }
    const existing = this.tracks.get(id);
    if (existing) existing.opts = { ...existing.opts, ...opts };
    else this.tracks.set(id, { id, opts, stepIndex: 0 });
  }

  update(id: string, partial: Partial<PlayOptions>){
    const t = this.tracks.get(id); if (!t) return; t.opts = { ...t.opts, ...partial };
  }

  stop(id: string) { this.tracks.delete(id); }
  stopAll() { this.tracks.clear(); }

  private stepDurationSec() { return (60 / this.bpm) / 4; } // 16th notes

  private loop = () => {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // schedule ahead
    while (this.lastScheduleTime < now + this.scheduleHorizon) {
      this.scheduleFrame(this.lastScheduleTime);
      this.lastScheduleTime += this.stepDurationSec();
    }
    this.timer = window.setTimeout(this.loop, this.lookaheadMs);
  };

  private scheduleFrame(time: number) {
    this.tracks.forEach(ts => {
      const { pattern } = ts.opts;
      const steps = pattern.trim();
      if (steps.length === 0) return;
      const idx = ts.stepIndex % steps.length;
      const char = steps[idx];
      if (char && char !== '-' && char !== ' ') {
        const velocity = this.mapVelocity(ts.opts, char);
        if (velocity>0) this.trigger(ts, time + this.swingOffset(idx), idx, velocity);
      }
      ts.stepIndex++;
    });
  }

  private swingOffset(stepIndex:number){
    if (!this.swingPct) return 0;
    // 16th: even index= no shift, odd index = positive delay
    if (stepIndex % 2 === 1) return this.stepDurationSec() * (this.swingPct/100) * 0.5;
    return 0;
  }

  private mapVelocity(opts: PlayOptions, ch: string){
    const vm = opts.velocityMap || DEFAULT_VELOCITY;
    if (ch==='X') return vm.accent;
    if (ch==='x') return vm.normal;
    if (ch==='.') return vm.ghost;
    if (ch==='o'|| ch==='O') return vm.normal; // alias
    return 0;
  }

  private trigger(ts: TrackState, time: number, hitIndex: number, vel: number) {
    if (!this.ctx) return;
    const role = this.inferRole(ts.opts.type || ts.id);
    if (role === 'kick') this.playKick(time, ts.opts, vel);
    else if (role === 'snare') this.playSnare(time, ts.opts, vel);
    else if (role === 'hat') this.playHat(time, ts.opts, vel);
    else if (role === 'bass') {
      const note = this.pickNote(ts.opts, hitIndex);
      if (note != null) this.playBass(time, ts.opts, note, vel);
    } else if (role === 'pad') {
      const note = this.pickNote(ts.opts, hitIndex) ?? 48;
      this.playPad(time, ts.opts, note, vel);
    } else if (role === 'lead') {
      const note = this.pickNote(ts.opts, hitIndex) ?? 60;
      this.playLead(time, ts.opts, note, vel);
    } else if (role === 'guitar') {
      const note = this.pickNote(ts.opts, hitIndex) ?? 52; // E3-ish
      this.playGuitar(time, ts.opts, note, vel);
    } else if (role === 'bassGtr') {
      const note = this.pickNote(ts.opts, hitIndex) ?? 36; // C2 fallback
      this.playBassGuitar(time, ts.opts, note, vel);
    } else if (role === 'piano') {
      const note = this.pickNote(ts.opts, hitIndex) ?? 60;
      this.playPiano(time, ts.opts, note, vel);
    } else if (role === 'organ') {
      const note = this.pickNote(ts.opts, hitIndex) ?? 60;
      this.playOrgan(time, ts.opts, note, vel);
    } else if (role === 'tom') {
      this.playTom(time, ts.opts, vel);
    } else if (role === 'clap') {
      this.playClap(time, ts.opts, vel);
    } else if (role === 'ride') {
      this.playRide(time, ts.opts, vel);
    } else this.playClick(time, ts.opts, vel);
    // sidechain duck if kick
    if (role === 'kick') this.applySidechain(time);
    // Dispatch a hit event close to actual audio time (scheduled ahead)
    try {
      const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
      const detail = { role, id: ts.id, velocity: vel, index: hitIndex, when: time };
      if (delayMs < 4) {
        window.dispatchEvent(new CustomEvent('liveaudio.hit', { detail }));
      } else {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('liveaudio.hit', { detail }));
        }, delayMs);
      }
  } catch {/* swallow dispatch timing errors */}
  }

  private inferRole(id: string): string {
    if (/kick|bd|k$/i.test(id)) return 'kick';
    if (/hat|hh/i.test(id)) return 'hat';
    if (/bass|bs|b$|low/i.test(id)) return 'bass';
    if (/gtr|guitar/i.test(id)) return 'guitar';
    if (/piano|keys?/i.test(id)) return 'piano';
    if (/organ/i.test(id)) return 'organ';
    if (/tom/i.test(id)) return 'tom';
    if (/clap/i.test(id)) return 'clap';
    if (/ride/i.test(id)) return 'ride';
    return 'other';
  }

  private pickNote(opts: PlayOptions, hitIndex: number): number | null {
    if (!opts.notes || opts.notes.length === 0) return 36; // C2 fallback
    const order = opts.notes.filter(n => typeof n === 'number');
    if (order.length === 0) return 36;
    const idx = hitIndex % order.length;
    return order[idx];
  }

  private playKick(time: number, opts: PlayOptions, vel:number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const decay = opts.decay ?? 0.22;
    const baseFreq = 50;
    const peak = baseFreq * 2.2;
    osc.frequency.setValueAtTime(peak, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + decay);
    gain.gain.setValueAtTime((opts.gain ?? 0.9)*vel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    // transient noise
    const nBuf = ctx.createBuffer(1, ctx.sampleRate*0.05, ctx.sampleRate);
    const d = nBuf.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const nSrc = ctx.createBufferSource(); nSrc.buffer = nBuf;
    const nGain = ctx.createGain(); nGain.gain.setValueAtTime(0.4*vel, time); nGain.gain.exponentialRampToValueAtTime(0.001, time+0.05);
    const filter = ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.setValueAtTime(2500, time);
    nSrc.connect(filter).connect(nGain).connect(this.masterGain!);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + decay);
    nSrc.start(time);
  }

  private playHat(time: number, opts: PlayOptions, vel:number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const gain = ctx.createGain();
    const g = (opts.gain ?? 0.4) * vel;
    gain.gain.setValueAtTime(g, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
    src.connect(hp).connect(gain).connect(this.masterGain!);
    src.start(time);
  }

  private playBass(time: number, opts: PlayOptions, note: number, vel:number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth'; // future supersaw
    const gain = ctx.createGain();
    const decay = opts.decay ?? 0.35;
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime((opts.gain ?? 0.6)*vel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, time);
    osc.connect(lp).connect(gain).connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + decay);
  }

  private playSnare(time:number, opts:PlayOptions, vel:number){
    const ctx = this.ctx!;
    const noiseDur = 0.35;
    const nBuf = ctx.createBuffer(1, ctx.sampleRate*noiseDur, ctx.sampleRate);
    const d = nBuf.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/d.length,1.5);
    const nSrc = ctx.createBufferSource(); nSrc.buffer = nBuf;
    const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2000; bp.Q.value=1.2;
    const nGain = ctx.createGain(); nGain.gain.setValueAtTime((opts.gain ?? 0.8)*vel, time); nGain.gain.exponentialRampToValueAtTime(0.0001, time+noiseDur);
    nSrc.connect(bp).connect(nGain).connect(this.masterGain!); nSrc.start(time);
    // tone
    const osc = ctx.createOscillator(); osc.type='triangle'; osc.frequency.setValueAtTime(180, time); osc.frequency.exponentialRampToValueAtTime(150, time+0.25);
    const oGain = ctx.createGain(); oGain.gain.setValueAtTime(0.3*vel, time); oGain.gain.exponentialRampToValueAtTime(0.0001, time+0.25);
    osc.connect(oGain).connect(this.masterGain!); osc.start(time); osc.stop(time+0.3);
  }

  private playPad(time:number, opts:PlayOptions, note:number, vel:number){
    const ctx = this.ctx!;
    const voices = 3;
    const freq = 440 * Math.pow(2,(note-69)/12);
    const out = ctx.createGain(); out.gain.value=0; out.connect(this.masterGain!);
    const attack = opts.env?.attack ?? 0.4;
    const rel = opts.env?.release ?? 1.8;
    const sus = opts.env?.sustain ?? 0.7;
    const decay = opts.env?.decay ?? 0.6;
    for (let i=0;i<voices;i++){
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      const g = ctx.createGain(); g.gain.value=1/voices;
      o.frequency.setValueAtTime(freq * (1 + (i-1)*0.005), time);
      o.connect(g).connect(out);
      o.start(time);
      o.stop(time + attack + decay + rel + 2);
    }
    // envelope
    out.gain.cancelScheduledValues(time);
    out.gain.setValueAtTime(0, time);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.5)*vel, time+attack);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.5)*vel*sus, time+attack+decay);
    out.gain.linearRampToValueAtTime(0.0001, time+attack+decay+rel);
  }

  private playLead(time:number, opts:PlayOptions, note:number, vel:number){
    const ctx = this.ctx!;
    const unison = opts.unison ?? 3;
    const baseFreq = 440 * Math.pow(2,(note-69)/12);
    const out = ctx.createGain(); out.gain.value=0; out.connect(this.masterGain!);
    const attack = opts.env?.attack ?? 0.01;
    const decay = opts.env?.decay ?? 0.25;
    const sus = opts.env?.sustain ?? 0.5;
    const rel = opts.env?.release ?? 0.25;
    for (let i=0;i<unison;i++){
      const osc = ctx.createOscillator(); osc.type='sawtooth';
      const det = (i-(unison-1)/2)*6; // cents
      osc.frequency.setValueAtTime(baseFreq * Math.pow(2, det/1200), time);
      const g = ctx.createGain(); g.gain.value = 1/unison;
      osc.connect(g).connect(out); osc.start(time); osc.stop(time+attack+decay+rel+0.5);
    }
    out.gain.setValueAtTime(0, time);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.55)*vel, time+attack);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.55)*vel*sus, time+attack+decay);
    out.gain.linearRampToValueAtTime(0.0001, time+attack+decay+rel);
  }

  // --- New Band / Acoustic-ish Instruments ---
  private noteToFreq(note:number){ return 440 * Math.pow(2,(note-69)/12); }

  // Karplus-Strong plucked string (simple)
  private playGuitar(time:number, opts:PlayOptions, note:number, vel:number){
    const ctx = this.ctx!;
    const freq = this.noteToFreq(note + (opts.pitchOffset||0));
    const period = Math.floor(ctx.sampleRate / freq);
    const length = Math.floor(ctx.sampleRate * (opts.decay ?? 1.2));
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<period;i++) data[i] = (Math.random()*2-1);
    let last=0;
    for (let i=period;i<length;i++) {
      const cur = 0.5*(data[i-period] + last);
      data[i] = cur * 0.998; // damping
      last = cur;
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.setValueAtTime((opts.gain ?? 0.55)*vel, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + (opts.decay ?? 1.2));
    src.connect(g).connect(this.masterGain!);
    src.start(time);
  }

  private playBassGuitar(time:number, opts:PlayOptions, note:number, vel:number){
    const ctx = this.ctx!;
    const freq = this.noteToFreq(note + (opts.pitchOffset||0));
    const osc = ctx.createOscillator(); osc.type='sawtooth';
    const gain = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(600, time);
    const decay = opts.decay ?? 0.55;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime((opts.gain ?? 0.6)*vel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time+decay);
    osc.connect(lp).connect(gain).connect(this.masterGain!);
    osc.start(time); osc.stop(time+decay+0.05);
  }

  private playPiano(time:number, opts:PlayOptions, note:number, vel:number){
    const ctx = this.ctx!;
    const base = this.noteToFreq(note + (opts.pitchOffset||0));
    const partials = [1,2,3,4.2];
    const out = ctx.createGain(); out.gain.value=0; out.connect(this.masterGain!);
    const a = opts.env?.attack ?? 0.005;
    const d = opts.env?.decay ?? 0.35;
    const s = opts.env?.sustain ?? 0.4;
    const r = opts.env?.release ?? 0.6;
    partials.forEach((p,_i)=> {
      const o = ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(base*p, time);
      const g = ctx.createGain(); g.gain.value = (1/partials.length) * (1/(_i+1));
      o.connect(g).connect(out); o.start(time); o.stop(time+a+d+r+0.4);
    });
    out.gain.setValueAtTime(0,time);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.7)*vel, time+a);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.7)*vel*s, time+a+d);
    out.gain.linearRampToValueAtTime(0.0001, time+a+d+r);
  }

  private playOrgan(time:number, opts:PlayOptions, note:number, vel:number){
    const ctx=this.ctx!; const base=this.noteToFreq(note + (opts.pitchOffset||0));
    const harmonics=[1,2,3]; const out=ctx.createGain(); out.gain.value=0; out.connect(this.masterGain!);
    const a=opts.env?.attack ?? 0.02; const r=opts.env?.release ?? 0.9; const s=opts.env?.sustain ?? 0.95; const d=opts.env?.decay ?? 0.15;
  harmonics.forEach((h,_i)=> { const o=ctx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(base*h,time); const g=ctx.createGain(); g.gain.value=1/harmonics.length; o.connect(g).connect(out); o.start(time); o.stop(time+a+d+r+1.2); });
    out.gain.setValueAtTime(0,time); out.gain.linearRampToValueAtTime((opts.gain ?? 0.5)*vel,time+a); out.gain.linearRampToValueAtTime((opts.gain ?? 0.5)*vel*s,time+a+d); out.gain.linearRampToValueAtTime(0.0001,time+a+d+r);
  }

  private playTom(time:number, opts:PlayOptions, vel:number){
    const ctx=this.ctx!; const osc=ctx.createOscillator(); osc.type='sine';
    const base=130 + Math.random()*20; osc.frequency.setValueAtTime(base,time); osc.frequency.exponentialRampToValueAtTime(base*0.7,time+0.25);
    const gain=ctx.createGain(); gain.gain.setValueAtTime((opts.gain??0.8)*vel,time); gain.gain.exponentialRampToValueAtTime(0.0001,time+0.4);
    const noiseBuf=ctx.createBuffer(1, ctx.sampleRate*0.08, ctx.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const nSrc=ctx.createBufferSource(); nSrc.buffer=noiseBuf; const nGain=ctx.createGain(); nGain.gain.setValueAtTime(0.25*vel,time); nGain.gain.exponentialRampToValueAtTime(0.0001,time+0.1);
    osc.connect(gain).connect(this.masterGain!); nSrc.connect(nGain).connect(this.masterGain!);
    osc.start(time); osc.stop(time+0.45); nSrc.start(time);
  }

  private playClap(time:number, opts:PlayOptions, vel:number){
    const ctx=this.ctx!; const hits=[0,0.012,0.028,0.06];
    hits.forEach((off,_i)=> {
      const buf=ctx.createBuffer(1, ctx.sampleRate*0.12, ctx.sampleRate); const data=buf.getChannelData(0); for(let j=0;j<data.length;j++) data[j]=(Math.random()*2-1)*Math.pow(1-j/data.length,2.5);
      const src=ctx.createBufferSource(); src.buffer=buf; const g=ctx.createGain(); const scale=(opts.gain??0.7)*vel * (_i===0?1:0.7);
      g.gain.setValueAtTime(scale, time+off); g.gain.exponentialRampToValueAtTime(0.0001, time+off+0.13);
      const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1800; src.connect(hp).connect(g).connect(this.masterGain!); src.start(time+off);
    });
  }

  private playRide(time:number, opts:PlayOptions, vel:number){
    const ctx=this.ctx!; const dur=1.8; const buf=ctx.createBuffer(1, ctx.sampleRate*dur, ctx.sampleRate); const data=buf.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,1.1);
    const src=ctx.createBufferSource(); src.buffer=buf; const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=7800; bp.Q.value=0.6;
    const g=ctx.createGain(); g.gain.setValueAtTime((opts.gain??0.38)*vel,time); g.gain.exponentialRampToValueAtTime(0.0001,time+dur);
    src.connect(bp).connect(g).connect(this.masterGain!); src.start(time);
  }

  private playClick(time: number, opts: PlayOptions, vel:number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(880, time);
    gain.gain.setValueAtTime((opts.gain ?? 0.3)*vel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  private applySidechain(time:number){
    // Phase1: global master duck (fast attack, short release)
    if (!this.masterGain) return;
    const g = this.masterGain.gain;
    const nowBase = g.value;
    const duck = Math.max(0.18, nowBase * 0.35);
    g.cancelScheduledValues(time);
    g.setValueAtTime(nowBase, time);
    g.linearRampToValueAtTime(duck, time + 0.01);
    g.linearRampToValueAtTime(nowBase, time + 0.28);
  }
}

// Singleton instance for app
export const liveEngine = new LiveEngine();

// Exposed API for sandbox
export function getLiveAPI() {
  return {
    setBPM: (bpm: number) => liveEngine.setBPM(bpm),
    setSwing: (pct: number) => liveEngine.setSwing(pct),
    play: async (id: string, opts: PlayOptions) => { await liveEngine.startIfNeeded(); liveEngine.play(id, opts); },
    update: (id:string, partial: Partial<PlayOptions>) => liveEngine.update(id, partial),
    stop: (id: string) => liveEngine.stop(id),
    stopAll: () => liveEngine.stopAll(),
    list: () => Array.from((liveEngine as any).tracks.keys()),
    registerPatch: (name:string, desc:any) => { (patchRegistry as any).register(name, desc); },
    triggerPatch: (name:string, opt?:any) => { (patchRegistry as any).trigger(name, opt); },
    listPatches: () => (patchRegistry as any).list(),
    // Tone.js hybrid additions
    tonePlay: (id:string, opts:any) => tonePlay(id, opts),
    toneStop: (id:string) => toneStop(id),
    toneStopAll: () => toneStopAll(),
    listTone: () => listToneIds(),
    setToneBPM: (bpm:number) => setToneBPM(bpm),
    tonePatternPlay: (id:string, pattern:string, opts?:any) => tonePatternPlay(id, pattern, opts),
    tonePatternStop: (id:string) => tonePatternStop(id),
    tonePatternStopAll: () => tonePatternStopAll(),
    getAnalyser: () => (liveEngine as any).getAnalyserData?.(),
    log: (...args: any[]) => console.warn('[live]', ...args)
  };
}

// --- Patch Registry (minimal Phase1) ---
interface PatchDescriptor {
  type: PlayOptions['type'];
  pattern?: string;
  base?: Partial<PlayOptions>;
  // future: macro diffs, pitch envelopes etc.
}

class PatchRegistry {
  private map = new Map<string, PatchDescriptor>();
  register(name:string, desc:PatchDescriptor){ this.map.set(name, desc); }
  trigger(name:string, opt?:{ id?:string; pattern?:string }){
    const p = this.map.get(name); if(!p) return;
    const id = opt?.id || name;
    const playOpts: PlayOptions = {
      pattern: opt?.pattern || p.pattern || 'x---x---x---x---',
      type: p.type,
      ...(p.base||{})
    } as PlayOptions;
    liveEngine.play(id, playOpts);
  }
  list(){ return Array.from(this.map.keys()); }
}

const patchRegistry = new PatchRegistry();

// Provide safe analyser snapshot method (not in public interface type earlier)
;(liveEngine as any).getAnalyserData = function(){
  if (!this.analyser || !this.fftData || !this.timeData) return null;
  this.analyser.getByteFrequencyData(this.fftData);
  this.analyser.getByteTimeDomainData(this.timeData);
  return {
    freq: this.fftData,
    time: this.timeData,
    // lightweight energy metrics could be extended later
    level: this.fftData[2] / 255
  };
};
