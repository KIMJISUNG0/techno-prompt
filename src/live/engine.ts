// Simple WebAudio live coding engine (MVP)
// Provides play(pattern) for basic roles: kick, hat, bass (notes optional)

type PlayOptions = {
  pattern: string; // 16-step string e.g. x---x---...
  notes?: number[]; // midi notes for melodic roles
  gain?: number;
  decay?: number;
};

interface TrackState {
  id: string;
  opts: PlayOptions;
  stepIndex: number;
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
  private swingPct = 0; // future use

  ensureCtx() {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
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
    this.tracks.set(id, { id, opts, stepIndex: 0 });
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
      if (/x|X|o|O/.test(char)) {
        this.trigger(ts, time, idx);
      }
      ts.stepIndex++;
    });
  }

  private trigger(ts: TrackState, time: number, hitIndex: number) {
    if (!this.ctx) return;
    const role = this.inferRole(ts.id);
    if (role === 'kick') this.playKick(time, ts.opts);
    else if (role === 'hat') this.playHat(time, ts.opts);
    else if (role === 'bass') {
      const note = this.pickNote(ts.opts, hitIndex);
      if (note != null) this.playBass(time, ts.opts, note);
    } else this.playClick(time, ts.opts);
  }

  private inferRole(id: string): string {
    if (/kick|bd|k$/i.test(id)) return 'kick';
    if (/hat|hh/i.test(id)) return 'hat';
    if (/bass|bs|b$|low/i.test(id)) return 'bass';
    return 'other';
  }

  private pickNote(opts: PlayOptions, hitIndex: number): number | null {
    if (!opts.notes || opts.notes.length === 0) return 36; // C2 fallback
    const order = opts.notes.filter(n => typeof n === 'number');
    if (order.length === 0) return 36;
    const idx = hitIndex % order.length;
    return order[idx];
  }

  private playKick(time: number, opts: PlayOptions) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const decay = opts.decay ?? 0.25;
    const baseFreq = 55;
    osc.frequency.setValueAtTime(baseFreq * 1.8, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + decay);
    gain.gain.setValueAtTime(opts.gain ?? 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + decay);
  }

  private playHat(time: number, opts: PlayOptions) {
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
    const g = (opts.gain ?? 0.4);
    gain.gain.setValueAtTime(g, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
    src.connect(hp).connect(gain).connect(ctx.destination);
    src.start(time);
  }

  private playBass(time: number, opts: PlayOptions, note: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const gain = ctx.createGain();
    const decay = opts.decay ?? 0.35;
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(opts.gain ?? 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, time);
    osc.connect(lp).connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + decay);
  }

  private playClick(time: number, opts: PlayOptions) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(880, time);
    gain.gain.setValueAtTime(opts.gain ?? 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.11);
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
    stop: (id: string) => liveEngine.stop(id),
    stopAll: () => liveEngine.stopAll(),
    log: (...args: any[]) => console.warn('[live]', ...args)
  };
}
