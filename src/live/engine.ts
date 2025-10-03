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
  duckGain?: GainNode; // per-track duck node (post-track)
  compiled?: StepDef[];
  compiledSrc?: string;
}

interface StepDef {
  ch: string;        // pattern character (X x . o O -)
  v?: number;        // velocity multiplier
  p?: number;        // probability 0..1
  dt?: number;       // microtiming offset seconds (+/-)
  locks?: Record<string, any>; // param locks e.g. gain, wave, cutoff, res, detune, unison
}

class LiveEngine {
  private ctx: AudioContext | null = null;
  private workletReady: Promise<boolean> | null = null;
  // Performance profiling accumulators
  private perf = {
    scheduleCount: 0,
    totalLead: 0,
    maxLead: 0,
    minLead: Infinity,
    lateCount: 0
  };
  private useHQ = false; // toggled when worklet loads
  private wlPort: MessagePort | null = null;
  private wlIdCounter = 0;
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
  // ping pong delay nodes (optional enhanced mode)
  private ppLeftDelay: DelayNode | null = null;
  private ppRightDelay: DelayNode | null = null;
  private ppFeedback: GainNode | null = null;
  private ppLeftPan: StereoPannerNode | null = null;
  private ppRightPan: StereoPannerNode | null = null;
  private usePingPong = false;
  private reverbNode: ConvolverNode | null = null; // simple generated impulse
  private analyser: AnalyserNode | null = null; // lightweight visualization tap
  private fftData?: Uint8Array;
  private timeData?: Uint8Array; // byte time-domain data
  // Master processing extras
  private masterPreSat: WaveShaperNode | null = null; // gentle saturation
  private masterClip: WaveShaperNode | null = null; // soft clipper / limiter-ish
  private clipCeiling = 0.95;
  private satDrive = 1.0;
  private reverbDuckAmount = 0.55; // portion retained on kick
  private reverbDuckRelease = 0.6;
  // Loudness stats (very approximate LUFS)
  private loudnessEnergy = 0;
  private loudnessSamples = 0;
  private momentaryLufs = -Infinity;
  private integratedLufs = -Infinity;
  // Microphone chain
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micEnabled = false;

  ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.setupBuses();
      this.initWorklet();
    }
    return this.ctx;
  }

  // ---------------- Microphone Support -----------------
  async enableMic(constraints: MediaStreamConstraints = { audio: true }){
    const ctx = this.ensureCtx();
    if (this.micEnabled) return true;
    if (!navigator?.mediaDevices?.getUserMedia) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.micStream = stream;
      this.micSource = ctx.createMediaStreamSource(stream);
      this.micGain = ctx.createGain(); this.micGain.gain.value = 1.0;
      this.micAnalyser = ctx.createAnalyser(); this.micAnalyser.fftSize = 256; this.micAnalyser.smoothingTimeConstant = 0.75;
      // Route mic: source -> gain -> masterPreSat (so same processing chain)
      if (this.masterPreSat) this.micSource.connect(this.micGain).connect(this.masterPreSat);
      else this.micSource.connect(this.micGain).connect(this.masterGain!);
      this.micGain.connect(this.micAnalyser);
      this.micEnabled = true;
      return true;
    } catch (err){
      console.warn('[live-engine] mic enable failed', err);
      return false;
    }
  }

  disableMic(){
    if (this.micStream){ this.micStream.getTracks().forEach(t=> t.stop()); }
    this.micStream = null; this.micSource = null; this.micGain = null; this.micAnalyser = null; this.micEnabled = false;
  }
  setMicGain(v:number){ if (this.micGain) this.micGain.gain.value = v; }
  isMicEnabled(){ return this.micEnabled; }
  getMicAnalyser(){
    if (!this.micAnalyser) return null;
    const freq = new Uint8Array(this.micAnalyser.frequencyBinCount);
    const time = new Uint8Array(this.micAnalyser.fftSize);
    this.micAnalyser.getByteFrequencyData(freq);
    this.micAnalyser.getByteTimeDomainData(time);
    let sum=0; for (let i=0;i<time.length;i++){ const v=(time[i]-128)/128; sum+=v*v; }
    const rms=Math.sqrt(sum/time.length);
    return { freq, time, level:rms };
  }

  private async initWorklet(){
    if (!this.ctx) return;
    if (this.workletReady) return;
    this.workletReady = (async () => {
      try {
        await this.ctx!.audioWorklet.addModule('/src/live/worklets/bandlimited-osc-worklet.js');
        // create a dummy node via AudioWorkletNode for future param hooking (output mixed per voice internally)
        const node = new AudioWorkletNode(this.ctx!, 'bandlimited-osc', { numberOfOutputs:1, outputChannelCount:[1] });
        node.connect(this.masterGain!);
        this.wlPort = node.port;
        this.useHQ = true;
        return true;
      } catch (e){
        console.warn('[live-engine] worklet load failed, fallback standard osc', e);
        this.useHQ = false; return false;
      }
    })();
  }

  setQuality(q:'high'|'standard'){ this.useHQ = (q==='high'); }

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
    // Pre saturation (adds harmonics prior to compression for tone)
    this.masterPreSat = ctx.createWaveShaper();
    this.updateSaturationCurve();
    // Soft clipper after compressor -> acts like limiter ceiling
    this.masterClip = ctx.createWaveShaper();
    this.updateClipCurve();
    // Delay
    this.delaySend = ctx.createGain(); this.delaySend.gain.value = 0.0;
    this.delayNode = ctx.createDelay(1.5); this.delayNode.delayTime.value = 0.3;
    this.delayFeedback = ctx.createGain(); this.delayFeedback.gain.value = 0.35;
    this.delayNode.connect(this.delayFeedback).connect(this.delayNode);
    // Ping pong delay set (disabled by default)
    this.ppLeftDelay = ctx.createDelay(2.0); this.ppRightDelay = ctx.createDelay(2.0);
    this.ppFeedback = ctx.createGain(); this.ppFeedback.gain.value = 0.38;
    this.ppLeftPan = ctx.createStereoPanner(); this.ppLeftPan.pan.value = -0.85;
    this.ppRightPan = ctx.createStereoPanner(); this.ppRightPan.pan.value = 0.85;
    // chain: send -> leftDelay -> leftPan -> master ; leftDelay -> rightDelay -> rightPan -> master ; rightDelay -> leftDelay (feedback)
    this.ppLeftDelay.connect(this.ppLeftPan).connect(this.masterGain);
    this.ppRightDelay.connect(this.ppRightPan).connect(this.masterGain);
    // cross feedback
    this.ppLeftDelay.connect(this.ppRightDelay);
    this.ppRightDelay.connect(this.ppFeedback).connect(this.ppLeftDelay);
    // Reverb (procedural impulse)
    this.reverbSend = ctx.createGain(); this.reverbSend.gain.value = 0.0;
    this.reverbNode = ctx.createConvolver();
  // improved plate style impulse (quick patch). Fallback to legacy if needed.
  this.reverbNode.buffer = this.makePlateImpulse(ctx, 1.65);
    // Wiring
    this.delayNode.connect(this.masterGain);
    this.reverbSend.connect(this.reverbNode).connect(this.masterGain);
    this.delaySend.connect(this.delayNode);
    // master chain: masterGain -> compressor -> clipper -> analyser -> destination
    // (preSat inserted before masterGain input via play routing path, so existing track routes go through preSat)
    // Actually reroute: track outs -> masterPreSat -> masterGain
    this.masterPreSat.connect(this.masterGain);
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.masterClip);
    // analyser tap after compressor (post-FX)
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256; // 128 frequency bins (low overhead)
    this.analyser.smoothingTimeConstant = 0.82;
    this.masterClip.connect(this.analyser).connect(ctx.destination);
    this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize); // time domain size equals fftSize
  }

  private updateSaturationCurve(){
    if (!this.masterPreSat) return;
    const k = this.satDrive * 2.5 + 0.0001;
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i=0;i<n;i++){
      const x = (i/(n-1))*2-1;
      // arctangent saturation
      curve[i] = Math.atan(k * x)/Math.atan(k);
    }
    this.masterPreSat.curve = curve;
    this.masterPreSat.oversample = '2x';
  }

  private updateClipCurve(){
    if (!this.masterClip) return;
    const n = 1024; const curve = new Float32Array(n);
    const c = this.clipCeiling;
    for (let i=0;i<n;i++){
      const x = (i/(n-1))*2-1;
      // soft clip (cubic) towards ceiling
      let y = x;
      const abs = Math.abs(x);
      if (abs > c*0.6){
        // gentle bend
        y = Math.sign(x) * (c - (c - abs) * 0.4);
      }
      if (abs > c){
        y = Math.sign(x) * c;
      }
      curve[i] = y;
    }
    this.masterClip.curve = curve;
    this.masterClip.oversample = '4x';
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

  // Lightweight plate-like impulse: exponential energy falloff + gentle HF damping
  private makePlateImpulse(ctx: AudioContext, seconds=1.6){
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch=0; ch<2; ch++){
      const data = buf.getChannelData(ch);
      let lpState = 0; // simple one-pole lowpass for HF damping
      const lpCoeff = 0.12; // damping factor
      for (let i=0;i<len;i++){
        const t = i/len;
        // colored noise (pink-ish): sum of a few filtered white components
        const w = (Math.random()*2-1) * 0.6 + (Math.random()*2-1)*0.3 + (Math.random()*2-1)*0.1;
        lpState += lpCoeff * (w - lpState);
        const env = Math.exp(-3.2 * t); // faster early decay
        const hfDamp = Math.pow(1 - t, 0.35);
        data[i] = (lpState * env * hfDamp);
      }
      // Very light tail fade shape to avoid abrupt cut
      for (let i=0;i<512 && i<len;i++) data[len-1-i] *= i/512;
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
    if (existing) {
      existing.opts = { ...existing.opts, ...opts };
      this.ensureTrackDuck(existing);
    } else {
      const ts:TrackState = { id, opts, stepIndex:0 };
      this.ensureTrackDuck(ts);
      this.tracks.set(id, ts);
    }
  }

  update(id: string, partial: Partial<PlayOptions>){
    const t = this.tracks.get(id); if (!t) return; t.opts = { ...t.opts, ...partial };
    this.ensureTrackDuck(t);
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
      const pattern = ts.opts.pattern;
      if (!pattern) return;
      if (!ts.compiled || ts.compiledSrc !== pattern) {
        ts.compiled = this.compilePattern(pattern);
        ts.compiledSrc = pattern;
      }
      const steps = ts.compiled || [];
      if (!steps.length) return;
      const idx = ts.stepIndex % steps.length;
      const step = steps[idx];
      if (step.ch && step.ch !== '-' && step.ch !== ' ') {
        if (step.p != null && Math.random() > step.p) {
          // probability skip
        } else {
          const baseVel = this.mapVelocity(ts.opts, step.ch);
          const vel = baseVel * (step.v ?? 1);
          if (vel > 0) {
            let effectiveOpts = ts.opts;
            if (step.locks && Object.keys(step.locks).length) {
              const clone:PlayOptions = { ...ts.opts };
              if (step.locks.gain != null) clone.gain = step.locks.gain;
              if (step.locks.wave) clone.wave = step.locks.wave;
              if (step.locks.detune != null) clone.detune = step.locks.detune;
              if (step.locks.unison != null) clone.unison = step.locks.unison;
              if (step.locks.cutoff != null) {
                clone.filter = { ...(clone.filter||{ type:'lowpass', cutoff: step.locks.cutoff }), cutoff: step.locks.cutoff } as any;
              }
              if (step.locks.res != null) {
                clone.filter = { ...(clone.filter||{ type:'lowpass', cutoff: 800 }), q: step.locks.res } as any;
              }
              effectiveOpts = clone;
            }
            const micro = step.dt || 0;
            this.triggerWithOpts(ts, time + this.swingOffset(idx) + micro, idx, vel, effectiveOpts);
          }
        }
      }
      ts.stepIndex++;
    });
    // perf: measure lead time vs current audio time
    if (this.ctx) {
      const now = this.ctx.currentTime;
      const lead = time - now;
      this.perf.scheduleCount++;
      this.perf.totalLead += lead;
      if (lead > this.perf.maxLead) this.perf.maxLead = lead;
      if (lead < this.perf.minLead) this.perf.minLead = lead;
      if (lead < 0) this.perf.lateCount++;
    }
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
    return this.triggerWithOpts(ts, time, hitIndex, vel, ts.opts);
  }

  private triggerWithOpts(ts: TrackState, time:number, hitIndex:number, vel:number, opts:PlayOptions){
    if (!this.ctx) return;
    const role = this.inferRole(opts.type || ts.id);
    if (role === 'kick') this.playKick(time, opts, vel);
    else if (role === 'snare') this.playSnare(time, opts, vel);
    else if (role === 'hat') this.playHat(time, opts, vel);
    else if (role === 'bass') { const note = this.pickNote(opts, hitIndex); if (note != null) this.playBass(time, opts, note, vel); }
    else if (role === 'pad') { const note = this.pickNote(opts, hitIndex) ?? 48; this.playPad(time, opts, note, vel); }
    else if (role === 'lead') { const note = this.pickNote(opts, hitIndex) ?? 60; this.playLead(time, opts, note, vel); }
    else if (role === 'guitar') { const note = this.pickNote(opts, hitIndex) ?? 52; this.playGuitar(time, opts, note, vel); }
    else if (role === 'bassGtr') { const note = this.pickNote(opts, hitIndex) ?? 36; this.playBassGuitar(time, opts, note, vel); }
    else if (role === 'piano') { const note = this.pickNote(opts, hitIndex) ?? 60; this.playPiano(time, opts, note, vel); }
    else if (role === 'organ') { const note = this.pickNote(opts, hitIndex) ?? 60; this.playOrgan(time, opts, note, vel); }
    else if (role === 'tom') { this.playTom(time, opts, vel); }
    else if (role === 'clap') { this.playClap(time, opts, vel); }
    else if (role === 'ride') { this.playRide(time, opts, vel); }
    else this.playClick(time, opts, vel);
    if (role === 'kick') this.applyPerTrackDuck(time);
    try {
      const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
      const detail = { role, id: ts.id, velocity: vel, index: hitIndex, when: time };
      if (delayMs < 4) window.dispatchEvent(new CustomEvent('liveaudio.hit', { detail }));
      else setTimeout(()=> window.dispatchEvent(new CustomEvent('liveaudio.hit', { detail })), delayMs);
    } catch {/* ignore */}
  }

  private compilePattern(pattern:string): StepDef[] {
    const out:StepDef[] = [];
  const re = /([Xx.oO-])(?:\{([^}]+)\})?/g; // pattern char with optional {..} modifiers
    let m:RegExpExecArray|null;
    while ((m = re.exec(pattern))){
      const step:StepDef = { ch: m[1] };
      if (m[2]) {
        m[2].split(/\s*,\s*/).forEach(seg => {
          if (!seg) return;
          const [kRaw,vRaw] = seg.split(/=/);
          const k = kRaw?.trim(); if (!k) return;
          const vStr = (vRaw||'').trim();
          if (k==='v'){ const num = parseFloat(vStr); if (!isNaN(num)) step.v = num; }
          else if (k==='p'){ const num = parseFloat(vStr); if (!isNaN(num)) step.p = Math.min(1,Math.max(0,num)); }
          else if (k==='dt'){ const num = parseFloat(vStr); if (!isNaN(num)) step.dt = num/1000; }
          else {
            if (!step.locks) step.locks = {};
            const num = parseFloat(vStr);
            step.locks[k] = isNaN(num)? vStr : num;
          }
        });
      }
      out.push(step);
    }
    return out;
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
    const bodyEQ = ctx.createBiquadFilter(); bodyEQ.type='peaking'; bodyEQ.frequency.value=80; bodyEQ.Q.value=1.2; bodyEQ.gain.value=3.5;
    const shaper = ctx.createWaveShaper();
    // soft saturation curve
    const curve = new Float32Array(256);
    for (let i=0;i<curve.length;i++){ const x = (i/255)*2-1; curve[i] = Math.tanh(x*2.2); }
    shaper.curve = curve; shaper.oversample = '2x';
    const decay = opts.decay ?? 0.24;
    const baseFreq = 49;
    const peak = baseFreq * 2.4;
    osc.frequency.setValueAtTime(peak, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + decay*0.9);
    gain.gain.setValueAtTime((opts.gain ?? 0.9)*vel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    // transient noise
    const nBuf = ctx.createBuffer(1, ctx.sampleRate*0.05, ctx.sampleRate);
    const d = nBuf.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const nSrc = ctx.createBufferSource(); nSrc.buffer = nBuf;
    const nGain = ctx.createGain(); nGain.gain.setValueAtTime(0.4*vel, time); nGain.gain.exponentialRampToValueAtTime(0.001, time+0.05);
    const filter = ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.setValueAtTime(2500, time);
    nSrc.connect(filter).connect(nGain).connect(this.masterGain!);
    osc.connect(shaper).connect(bodyEQ).connect(gain).connect(this.masterGain!);
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
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500;
    // mild bandpass to tame harsh band
    const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=10000; bp.Q.value=0.6;
    // shelving via peaking filter negative gain (pseudo high-shelf)
    const shelf = ctx.createBiquadFilter(); shelf.type='peaking'; shelf.frequency.value=12000; shelf.Q.value=0.7; shelf.gain.value = -4.5;
    const gain = ctx.createGain();
    const g = (opts.gain ?? 0.4) * vel;
    gain.gain.setValueAtTime(g, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
    src.connect(hp).connect(bp).connect(shelf).connect(gain).connect(this.masterGain!);
    src.start(time);
  }

  private playBass(time: number, opts: PlayOptions, note: number, vel:number) {
    const ctx = this.ctx!;
    const decay = opts.decay ?? 0.35;
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    const outBus = this.routeTrack(opts, vel);
    if (this.useHQ && (opts.wave==='saw' || opts.wave==='square' || opts.wave==='supersaw')) {
      this.sendHQVoices(time, [{ id:'b'+(++this.wlIdCounter), freq, gain:(opts.gain ?? 0.6)*vel, wave:'saw', env: { attack:0.005, decay:decay*0.6, sustain:0.4, release:decay*0.4 } }], opts, outBus);
      return;
    }
    const out = ctx.createGain();
    out.gain.setValueAtTime((opts.gain ?? 0.6)*vel, time);
    out.gain.exponentialRampToValueAtTime(0.0001, time+decay);
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(780, time);
    // supersaw option
    if (opts.wave === 'supersaw') {
      const voices = opts.unison || 6;
      const detune = (opts.detune ?? 14) / 2; // +/- range
      for (let i=0;i<voices;i++) {
        const o = ctx.createOscillator(); o.type='sawtooth';
        const spread = (i - (voices-1)/2)/((voices-1)/2 || 1); // -1..1
        const cents = spread * detune;
        o.frequency.setValueAtTime(freq * Math.pow(2, cents/1200), time);
        const g = ctx.createGain(); g.gain.value = 1/voices;
        o.connect(g).connect(lp);
        o.start(time); o.stop(time+decay+0.05);
      }
    } else {
      const osc = ctx.createOscillator();
      const wt = (opts.wave === 'saw' ? 'sawtooth' : opts.wave === 'square' ? 'square' : opts.wave === 'triangle' ? 'triangle' : opts.wave === 'sine' ? 'sine' : 'sawtooth');
      osc.type = wt;
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(lp); osc.start(time); osc.stop(time+decay+0.05);
    }
    lp.connect(out).connect(outBus);
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
    const freq = 440 * Math.pow(2,(note-69)/12);
    const outBus = this.routeTrack(opts, vel);
    if (this.useHQ && (opts.wave==='saw' || opts.wave==='square' || opts.wave==='supersaw')) {
      const unison = (opts.wave==='supersaw' ? (opts.unison||6) : 1);
      const det = (opts.detune ?? 18)/2;
      const voices = [] as any[];
      for (let i=0;i<unison;i++){
        const spread = (i-(unison-1)/2)/((unison-1)/2 || 1);
        const cents = spread * det;
        voices.push({ id:'p'+(++this.wlIdCounter)+'_'+i, freq: freq*Math.pow(2,cents/1200), gain: ((opts.gain ?? 0.5)*vel)/unison, wave:'saw', env:{ attack:0.35, decay:0.7, sustain:0.65, release:2.2 } });
      }
      this.sendHQVoices(time, voices, opts, outBus);
      return;
    }
    const out = ctx.createGain(); out.connect(outBus);
    const attack = opts.env?.attack ?? 0.35;
    const decay = opts.env?.decay ?? 0.7;
    const sus = opts.env?.sustain ?? 0.65;
    const rel = opts.env?.release ?? 2.2;
    if (opts.wave==='supersaw') {
      const voices = opts.unison || 7;
      const detune = (opts.detune ?? 18)/2;
      for (let i=0;i<voices;i++){
        const o = ctx.createOscillator(); o.type='sawtooth';
        const spread = (i-(voices-1)/2)/((voices-1)/2 || 1);
        const cents = spread * detune;
        o.frequency.setValueAtTime(freq*Math.pow(2,cents/1200), time);
        const g = ctx.createGain(); g.gain.value = 1/voices;
        o.connect(g).connect(out); o.start(time); o.stop(time+attack+decay+rel+3);
      }
    } else {
      const o = ctx.createOscillator();
      const wt = (opts.wave === 'saw' ? 'sawtooth' : opts.wave === 'square' ? 'square' : opts.wave === 'triangle' ? 'triangle' : opts.wave === 'sine' ? 'sine' : 'sawtooth');
      o.type = wt;
      o.frequency.setValueAtTime(freq, time);
      o.connect(out); o.start(time); o.stop(time+attack+decay+rel+3);
    }
    out.gain.setValueAtTime(0,time);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.5)*vel, time+attack);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.5)*vel*sus, time+attack+decay);
    out.gain.linearRampToValueAtTime(0.0001, time+attack+decay+rel);
  }

  private playLead(time:number, opts:PlayOptions, note:number, vel:number){
    const ctx = this.ctx!;
    const baseFreq = 440 * Math.pow(2,(note-69)/12);
    const outBus = this.routeTrack(opts, vel);
    if (this.useHQ && (opts.wave==='saw' || opts.wave==='square' || opts.wave==='supersaw')) {
      const unison = (opts.wave==='supersaw' ? (opts.unison||6) : 1);
      const det = (opts.detune ?? 16)/2;
      const voices:any[] = [];
      for (let i=0;i<unison;i++){
        const spread = (i-(unison-1)/2)/((unison-1)/2 || 1);
        const cents = spread * det;
        voices.push({ id:'l'+(++this.wlIdCounter)+'_'+i, freq: baseFreq*Math.pow(2,cents/1200), gain: ((opts.gain ?? 0.55)*vel)/unison, wave:'saw', env:{ attack:0.008, decay:0.22, sustain:0.45, release:0.28 } });
      }
      this.sendHQVoices(time, voices, opts, outBus);
      return;
    }
    const out = ctx.createGain(); out.connect(outBus);
    const attack = opts.env?.attack ?? 0.008;
    const decay = opts.env?.decay ?? 0.22;
    const sus = opts.env?.sustain ?? 0.45;
    const rel = opts.env?.release ?? 0.28;
    if (opts.wave==='supersaw') {
      const unison = opts.unison ?? 6;
      const detune = (opts.detune ?? 16)/2;
      for (let i=0;i<unison;i++){
        const osc = ctx.createOscillator(); osc.type='sawtooth';
        const spread = (i-(unison-1)/2)/((unison-1)/2 || 1);
        const cents = spread * detune;
        osc.frequency.setValueAtTime(baseFreq*Math.pow(2,cents/1200), time);
        const g = ctx.createGain(); g.gain.value = 1/unison;
        osc.connect(g).connect(out); osc.start(time); osc.stop(time+attack+decay+rel+0.6);
      }
    } else {
      const osc = ctx.createOscillator();
      const wt = (opts.wave === 'saw' ? 'sawtooth' : opts.wave === 'square' ? 'square' : opts.wave === 'triangle' ? 'triangle' : opts.wave === 'sine' ? 'sine' : 'sawtooth');
      osc.type = wt;
      osc.frequency.setValueAtTime(baseFreq, time); osc.connect(out); osc.start(time); osc.stop(time+attack+decay+rel+0.6);
    }
    out.gain.setValueAtTime(0,time);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.55)*vel, time+attack);
    out.gain.linearRampToValueAtTime((opts.gain ?? 0.55)*vel*sus, time+attack+decay);
    out.gain.linearRampToValueAtTime(0.0001, time+attack+decay+rel);
  }

  private sendHQVoices(time:number, voices:any[], _opts:PlayOptions, _target:AudioNode){
    if (!this.wlPort) return; // fallback silent if race
    voices.forEach(v => {
      this.wlPort!.postMessage({ type:'noteOn', id:v.id, freq:v.freq, gain:v.gain, wave:v.wave==='square'?'square':'saw', attack:v.env.attack, decay:v.env.decay, sustain:v.env.sustain, release:v.env.release, time });
      // schedule release message (simple) - envelope lengths sum
      const offTime = time + v.env.attack + v.env.decay + v.env.release + 0.05;
      // use setTimeout relative to currentTime
      const ctxNow = this.ctx?.currentTime || 0;
      const delayMs = Math.max(0, (offTime - ctxNow)*1000);
  setTimeout(()=>{ if (this.wlPort) this.wlPort.postMessage({ type:'noteOff', id:v.id, time: offTime }); }, delayMs);
    });
    // Currently worklet outputs directly to master; future: route to target via dedicated gain if needed
  }

  private ensureTrackDuck(ts:TrackState){
    if (!this.ctx || !this.masterGain) return;
    if (ts.opts.sidechain) {
      if (!ts.duckGain) {
        ts.duckGain = this.ctx.createGain();
        ts.duckGain.gain.value = 1.0;
      }
    } else if (ts.duckGain) {
      // disable ducking
      ts.duckGain.gain.value = 1.0;
    }
  }

  private routeTrack(opts:PlayOptions, _vel:number): AudioNode {
    // Choose chain: duckGain -> masterGain
    if (!this.ctx || !this.masterGain) return this.masterGain!;
    // Find track state by identity (inefficient linear, ok small n)
    let ts:TrackState|undefined; this.tracks.forEach(v => { if (v.opts === opts) ts = v; });
    if (ts && ts.duckGain) {
      if (!(ts.duckGain as any)._wired) { ts.duckGain.connect(this.masterGain!); (ts.duckGain as any)._wired = true; }
      return ts.duckGain;
    }
    return this.masterGain!;
  }

  private applyPerTrackDuck(time:number){
    // Iterate tracks with sidechain enabled (excluding kick origin)
    this.tracks.forEach(ts => {
      if (!ts.duckGain || !ts.opts.sidechain) return;
      const g = ts.duckGain.gain;
      const base = 1.0;
      const depth = 0.65; // target value
      g.cancelScheduledValues(time);
      g.setValueAtTime(base, time);
      g.linearRampToValueAtTime(depth, time + 0.012);
      g.linearRampToValueAtTime(base, time + 0.32);
    });
    // Reverb ducking
    if (this.reverbSend){
      const g = this.reverbSend.gain;
      const current = g.value;
      const target = current * this.reverbDuckAmount;
      g.cancelScheduledValues(time);
      g.setValueAtTime(current, time);
      g.linearRampToValueAtTime(target, time + 0.02);
      g.linearRampToValueAtTime(current, time + this.reverbDuckRelease);
    }
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

  // (global sidechain removed in favor of per-track duck)

  getPerfStats(){
    const { scheduleCount, totalLead, maxLead, minLead, lateCount } = this.perf;
    return {
      scheduleCount,
      avgLeadMs: scheduleCount ? (totalLead / scheduleCount) * 1000 : 0,
      maxLeadMs: maxLead * 1000,
      minLeadMs: (minLead===Infinity?0:minLead) * 1000,
      lateCount
    };
  }

  resetPerf(){
    this.perf = { scheduleCount:0, totalLead:0, maxLead:0, minLead:Infinity, lateCount:0 };
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
    getPerf: () => (liveEngine as any).getPerfStats?.(),
    resetPerf: () => (liveEngine as any).resetPerf?.(),
    // Master polish controls
    setSaturation: (drive:number) => { (liveEngine as any).satDrive = Math.max(0,drive); (liveEngine as any).updateSaturationCurve?.(); },
    setClipCeiling: (ceil:number) => { (liveEngine as any).clipCeiling = Math.min(0.999, Math.max(0.2, ceil)); (liveEngine as any).updateClipCurve?.(); },
    configureDelay: (opts:{ time?:number; feedback?:number; mix?:number; pingpong?:boolean }) => {
      const eng:any = liveEngine;
      if (opts.time!=null){ if (eng.delayNode) eng.delayNode.delayTime.value = opts.time; if (eng.ppLeftDelay) eng.ppLeftDelay.delayTime.value = opts.time; if (eng.ppRightDelay) eng.ppRightDelay.delayTime.value = opts.time; }
      if (opts.feedback!=null){ if (eng.delayFeedback) eng.delayFeedback.gain.value = opts.feedback; if (eng.ppFeedback) eng.ppFeedback.gain.value = opts.feedback; }
      if (opts.mix!=null){ if (eng.delaySend) eng.delaySend.gain.value = opts.mix; }
      if (opts.pingpong!=null){ eng.usePingPong = !!opts.pingpong; }
    },
    setReverb: (mix:number) => { const eng:any = liveEngine; if (eng.reverbSend) eng.reverbSend.gain.value = mix; },
    setReverbDuck: (amount:number, release?:number) => { const eng:any = liveEngine; eng.reverbDuckAmount = Math.min(0.95, Math.max(0.05, amount)); if (release!=null) eng.reverbDuckRelease = Math.max(0.1, release); },
    getLoudness: () => { return { momentary:(liveEngine as any).momentaryLufs, integrated:(liveEngine as any).integratedLufs }; },
    setStereoWidth: (w:number) => { (liveEngine as any).updateStereoWidth?.(w); },
    setLowMono: (freq:number) => { (liveEngine as any).updateLowMono?.(freq); },
    compilePattern: (p:string) => (liveEngine as any).compilePattern?.(p),
    // Mic controls
    enableMic: (c?:MediaStreamConstraints)=> (liveEngine as any).enableMic?.(c),
    disableMic: ()=> (liveEngine as any).disableMic?.(),
    setMicGain: (v:number)=> (liveEngine as any).setMicGain?.(v),
    isMicEnabled: ()=> (liveEngine as any).isMicEnabled?.(),
    getMicAnalyser: ()=> (liveEngine as any).getMicAnalyser?.(),
    log: (...args: any[]) => console.warn('[live]', ...args)
  };
}

// Attach to window for browser console / sandbox code runner convenience
// (Idempotent guard)
declare const window: any;
if (typeof window !== 'undefined' && !window.getLiveAPI) {
  window.getLiveAPI = getLiveAPI;
  window.liveAPI = getLiveAPI();
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
  // Loudness (very rough): compute RMS of frame & integrate
  let sum = 0;
  for (let i=0;i<this.timeData.length;i++){
    const x = (this.timeData[i]-128)/128; sum += x*x;
  }
  const rms = Math.sqrt(sum/this.timeData.length) + 1e-9;
  // Convert to pseudo LUFS (no K-weighting) relative to full scale sine (approx offset -0.691)
  this.momentaryLufs = 20*Math.log10(rms) - 0.691;
  this.loudnessEnergy += sum;
  this.loudnessSamples += this.timeData.length;
  const integratedRms = Math.sqrt(this.loudnessEnergy/this.loudnessSamples) + 1e-9;
  this.integratedLufs = 20*Math.log10(integratedRms) - 0.691;
  return {
    freq: this.fftData,
    time: this.timeData,
    // lightweight energy metrics could be extended later
    level: this.fftData[2] / 255
  };
};
