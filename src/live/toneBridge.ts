// Lazy Tone.js bridge providing a minimal hybrid layer without coupling UI directly
// We keep our custom engine for lightweight percussive synthesis and offer Tone.js
// for polyphonic, FX-rich, or future sequencing features.

export type FXSpec = string | { type:string; [k:string]:any };
export interface TonePlayOptions {
  type?: 'synth' | 'fm' | 'am' | 'metal' | 'noise';
  notes: (string | number)[]; // e.g. ['C3','E3','G3'] or MIDI numbers
  duration?: string | number; // '8n', '4n', seconds or numeric seconds
  velocity?: number;          // 0..1
  sustain?: number;           // seconds override for envelopes
  volume?: number;            // dB
  spread?: number;            // poly spread detune
  now?: boolean;              // start immediately
  time?: number;              // absolute seconds schedule
  fx?: FXSpec[] | FXSpec;     // flexible FX chain definitions
}

let TonePromise: Promise<typeof import('tone')> | null = null;
let tone: typeof import('tone') | null = null;

// Track created synth instances so we can stop/release.
interface ActiveInst { inst:any; lastUse:number; }
const active: Record<string, ActiveInst> = {};
let sweepTimer: number | null = null;
const TTL_MS = 45_000; // auto-dispose after 45s idle

// Simple shared FX nodes (created lazily) with param caching; per-call custom chain if object specs differ.
const sharedFX: { reverb?: any; delay?: any; distortion?: any; chorus?: any } = {};

function buildFXChain(t:any, inst:any, fx:FXSpec|FXSpec[]){
  const list = Array.isArray(fx)? fx : [fx];
  let node = inst;
  for (const spec of list){
    if (typeof spec === 'string'){
      attachSimpleFX(t, node, spec);
    } else if (spec && typeof spec === 'object') {
      const type = spec.type;
      if (!type) continue;
      // If matches a shared simple type and no custom params beyond defaults, reuse shared
      if ((type==='reverb'||type==='delay'||type==='distortion'||type==='chorus') && Object.keys(spec).length===1){
        attachSimpleFX(t, node, type);
      } else {
        // Build custom one-off node and connect to destination
        let custom:any = null;
        try {
          if (type==='reverb') custom = new t.Reverb({ decay: spec.decay ?? 3, wet: spec.wet ?? 0.35 });
          else if (type==='delay') custom = new t.FeedbackDelay(spec.time ?? '8n', spec.feedback ?? 0.3);
          else if (type==='distortion') custom = new t.Distortion(spec.amount ?? spec.distortion ?? 0.25);
          else if (type==='chorus') custom = new t.Chorus(spec.frequency ?? 4, spec.delayTime ?? 2.5, spec.depth ?? 0.5).start();
          else if (type==='bitcrusher') custom = new t.BitCrusher(spec.bits ?? 4);
          else if (type==='phaser') custom = new t.Phaser({ frequency: spec.frequency ?? 15, octaves: spec.octaves ?? 3, baseFrequency: spec.baseFrequency ?? 350 });
          else if (type==='filter') custom = new t.Filter(spec.frequency ?? 800, spec.mode || spec.type || 'lowpass');
          if (custom) {
            if (spec.wet != null && custom.wet) custom.wet.value = spec.wet;
            node.connect(custom);
            custom.toDestination();
            node = custom;
          }
  } catch(err){ console.warn('[toneBridge] custom FX build failed', err); }
      }
    }
  }
}

function attachSimpleFX(t:any, inst:any, f:string){
  if (f==='reverb'){
    if (!sharedFX.reverb) sharedFX.reverb = new t.Reverb({ decay:3, wet:0.35 }).toDestination();
    inst.connect(sharedFX.reverb);
  } else if (f==='delay'){
    if (!sharedFX.delay) sharedFX.delay = new t.FeedbackDelay('8n', 0.3).toDestination();
    inst.connect(sharedFX.delay);
  } else if (f==='distortion'){
    if (!sharedFX.distortion) sharedFX.distortion = new t.Distortion(0.25).toDestination();
    inst.connect(sharedFX.distortion);
  } else if (f==='chorus'){
    if (!sharedFX.chorus) sharedFX.chorus = new t.Chorus(4, 2.5, 0.5).start().toDestination();
    inst.connect(sharedFX.chorus);
  }
}

function loadTone(){
  if (!TonePromise){
    TonePromise = import('tone').then(m=> {
      tone = m;
      return m;
    });
  }
  return TonePromise;
}

export async function ensureTone(){
  await loadTone();
  if (!tone) throw new Error('Tone failed to load');
  await tone.start(); // resume context if needed (user gesture assumed via call site)
  return tone;
}

export async function tonePlay(id: string, opts: TonePlayOptions){
  const t = await ensureTone();
  const {
    type='synth',
    notes = [],
    duration='8n',
    velocity=0.9,
    volume=0,
    spread=0,
    sustain,
    fx
  } = opts;
  const noteList = Array.isArray(notes)? notes: [notes];
  // Decide instrument
  let inst: any;
  if (type==='fm') inst = new t.FMSynth().toDestination();
  else if (type==='am') inst = new t.AMSynth().toDestination();
  else if (type==='metal') inst = new t.MetalSynth().toDestination();
  else if (type==='noise') inst = new t.NoiseSynth().toDestination();
  else inst = new t.PolySynth(t.Synth).toDestination();
  if (inst.set) inst.set({ volume });
  if (inst.spread != null && typeof spread === 'number') inst.spread = spread;
  // FX chain
  if (fx) buildFXChain(t, inst, fx);
  active[id] = { inst, lastUse: Date.now() };
  const when = opts.now ? undefined : undefined; // we could support future scheduling
  // Trigger all notes (PolySynth handles array, other synths single)
  try {
    if (inst.triggerAttackRelease) {
      if (Array.isArray(noteList) && noteList.length>1 && inst.triggerAttackRelease.length>=2){
        inst.triggerAttackRelease(noteList as any, duration, when, velocity);
      } else {
        for (const n of noteList){
          inst.triggerAttackRelease(n as any, duration, when, velocity);
        }
      }
    }
    if (sustain && inst.triggerAttack){
      // manual sustain flow (if provided)
      inst.triggerAttack(noteList[0] as any, when, velocity);
      setTimeout(()=> {
        if (inst && inst.triggerRelease) inst.triggerRelease();
      }, sustain*1000);
    }
  } catch (err){
    console.warn('[toneBridge] play error', err);
  }
  scheduleSweep();
}

export async function toneStop(id: string){
  const rec = active[id];
  if (!rec) return;
  const inst = rec.inst;
  try { if (inst.dispose) inst.dispose(); else if (inst.releaseAll) inst.releaseAll(); } catch { /* ignore dispose error */ }
  delete active[id];
}

export async function toneStopAll(){
  await Promise.all(Object.keys(active).map(id=> toneStop(id)));
}

export function listToneIds(){
  return Object.keys(active);
}

// BPM Sync
export async function setToneBPM(bpm:number){
  const t = await ensureTone();
  t.Transport.bpm.value = bpm;
}

// Transport-based Pattern DSL v2
// Syntax:
//  - Notes: e.g. C3, D#4, g2 (case-insensitive, normalized upper)
//  - Rests: '.' or '-' consume one step
//  - Hold: '_' extends previous note by one additional step (chains allowed)
//  - Velocity accents: '!' right after a note token raises velocity *1.2, '?' lowers *0.75
//  - Default step = 16th (can extend later via options)
// Parsing approach: tokenize note tokens then inline meta chars.

interface PatternRuntime { id:string; pattern:string; synthType:string; baseVelocity:number; events:any[]; loopId?:number; }
const patternMap = new Map<string, PatternRuntime>();

function parsePattern(pat:string){
  const tokens:any[] = [];
  const src = pat.trim();
  const noteRegex = /[A-Ga-g][#b]?\d?/y; // sticky
  let i=0; let lastNoteIndex = -1;
  while (i < src.length){
    const ch = src[i];
    if (ch === '.' || ch==='-'){ tokens.push({ type:'rest' }); i++; continue; }
    if (ch === '_'){
      if (lastNoteIndex>=0) {
        // extend previous note by one step; consecutive '_' accumulate
        tokens[lastNoteIndex].hold = (tokens[lastNoteIndex].hold||0)+1;
      }
      i++; continue;
    }
    noteRegex.lastIndex = i;
    const m = noteRegex.exec(src);
    if (m){
  const note = m[0];
      i = noteRegex.lastIndex;
      let accent = 1;
      if (src[i]==='!'){ accent = 1.2; i++; }
      else if (src[i]==='?'){ accent = 0.75; i++; }
      tokens.push({ type:'note', note: note.toUpperCase(), accent, hold:0 });
      lastNoteIndex = tokens.length-1;
      continue;
    }
    // unrecognized char skip
    i++;
  }
  return tokens;
}

async function ensureTransport(){
  const t = await ensureTone();
  if (!t.Transport.state) t.Transport.start();
  return t;
}

export async function tonePatternPlay(id:string, pattern:string, opts?:{ type?:string; velocity?:number; step?:string; fx?:any }){
  const t = await ensureTransport();
  // stop previous if exists
  tonePatternStop(id);
  const step = opts?.step || '16n';
  const tokens = parsePattern(pattern);
  const runtime: PatternRuntime = { id, pattern, synthType: opts?.type||'synth', baseVelocity: opts?.velocity??0.9, events: tokens };
  patternMap.set(id, runtime);
  // schedule repeat
  const loopId = t.Transport.scheduleRepeat((_time)=> {
    let stepIndex = 0;
    for (const ev of runtime.events){
      if (ev.type==='rest'){ stepIndex++; continue; }
      if (ev.type==='note'){
        const durSteps = 1 + (ev.hold||0);
        const vel = runtime.baseVelocity * ev.accent;
        // convert steps -> Tone duration string (approx). For contiguous steps we use multiplication: e.g. 2 steps of 16n = 8n
        let toneDur: string = step;
        if (durSteps === 2 && step==='16n') toneDur = '8n';
        else if (durSteps === 4 && step==='16n') toneDur = '4n';
        else if (durSteps > 1) toneDur = `${durSteps}*${step}`; // fallback expression (Tone supports eval)
        try {
          tonePlay('pat:'+id+':'+stepIndex, { type: runtime.synthType as any, notes:[ev.note], duration:toneDur, velocity:vel, fx: opts?.fx });
  } catch(err){ console.warn('[tonePattern] play error', err); }
        stepIndex += durSteps;
      }
    }
  }, step);
  runtime.loopId = loopId;
}

export function tonePatternStop(id:string){
  const r = patternMap.get(id); if (!r) return;
  patternMap.delete(id);
  if (r.loopId != null && tone){ try { tone.Transport.clear(r.loopId); } catch {/* ignore clear error */} }
}

export function tonePatternStopAll(){
  for (const id of Array.from(patternMap.keys())) tonePatternStop(id);
}

function scheduleSweep(){
  if (sweepTimer) return;
  sweepTimer = window.setTimeout(()=> {
    const now = Date.now();
    for (const [id, rec] of Object.entries(active)){
      if (now - rec.lastUse > TTL_MS){
  try { if (rec.inst.dispose) rec.inst.dispose(); } catch {/* ignore dispose error */}
        delete active[id];
      }
    }
    sweepTimer = null;
  }, TTL_MS + 5_000);
}
