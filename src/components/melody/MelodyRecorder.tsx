import React, { useEffect, useRef, useState } from 'react';

interface MelodySummary {
  wavBlob: Blob;
  base64: string;
  duration: number;
  pitchHz?: number|null;
  noteName?: string|null;
  keyGuess?: string|null;
  stability?: number; // voiced frame 비율
  medianPitch?: number|null;
  medianNote?: string|null;
  scaleCandidates?: { scale: string; score: number }[];
  events?: { note: string; start: number; end: number; midi: number }[];
}
interface Props {
  onResult?: (data: MelodySummary) => void;
}

// 간단한 마이크 녹음 + 파형 표시 (MediaRecorder 기반)
export default function MelodyRecorder({ onResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [permission, setPermission] = useState<'idle'|'granted'|'denied'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaStreamRef = useRef<MediaStream|null>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const analyserRef = useRef<AnalyserNode|null>(null);
  const audioCtxRef = useRef<AudioContext|null>(null);
  const [pitchHz, setPitchHz] = useState<number|null>(null);
  const [noteName, setNoteName] = useState<string|null>(null);
  const [keyGuess, setKeyGuess] = useState<string|null>(null);
  const [stability, setStability] = useState<number|null>(null);
  const [medianPitch, setMedianPitch] = useState<number|null>(null);
  const [medianNote, setMedianNote] = useState<string|null>(null);
  const [scaleCands, setScaleCands] = useState<{scale:string;score:number}[]|null>(null);
  const [events, setEvents] = useState<{ note: string; start: number; end: number; midi: number }[]|null>(null);

  useEffect(()=> ()=> { if (rafRef.current) cancelAnimationFrame(rafRef.current); },[]);

  async function requestPermission(){
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      mediaStreamRef.current = stream;
      setPermission('granted');
      // Safari unlock: create context after gesture
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      analyserRef.current = analyser;
      drawWave();
    } catch(e:any){
      setPermission('denied');
      setError(e?.message || 'Microphone access denied');
    }
  }

  function drawWave(){
    if (!canvasRef.current || !analyserRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const analyser = analyserRef.current;
    const buffer = new Uint8Array(analyser.fftSize);
    function loop(){
      if (!canvasRef.current) return;
      analyser.getByteTimeDomainData(buffer);
      if (!ctx) return;
      ctx.clearRect(0,0,canvasRef.current.width, canvasRef.current.height);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const mid = canvasRef.current.height/2;
      const step = canvasRef.current.width / buffer.length;
      for (let i=0;i<buffer.length;i++){
        const v = (buffer[i]-128)/128; // -1..1
        const y = mid + v * (mid-2);
        const x = i*step;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(loop);
    }
    loop();
  }

  function start(){
    if (!mediaStreamRef.current) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(mediaStreamRef.current, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = rec;
    rec.ondataavailable = e=> { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const base64 = await blobToBase64(blob);
      // Basic summary shell (will enrich after analysis)
      let summary: MelodySummary = { wavBlob: blob, base64, duration };
      // Pitch detection pipeline + advanced analysis
      try {
        const arrayBuf = await blob.arrayBuffer();
        // WebM Opus decode path: create an offline context
        const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
        const chData = audioBuffer.getChannelData(0);
        // Frame-based extraction
        const frameSize = 2048;
        const hop = 1024;
        const pitches: number[] = [];
        const times: number[] = [];
        for (let start=0; start + frameSize <= chData.length; start += hop) {
          const frame = chData.subarray(start, start+frameSize);
            const f = detectPitchYIN(frame, audioBuffer.sampleRate);
            if (f) { pitches.push(f); times.push(start / audioBuffer.sampleRate); }
        }
        let mainPitch: number | null = null;
        if (pitches.length) {
          // octave clustering heuristic: map to log2, cluster around median; then detect if doubl/half prevalent
          const sorted = [...pitches].sort((a,b)=>a-b);
          const med = sorted[Math.floor(sorted.length/2)];
          // detect octave error: if many pitches ~ med*2 or med/2
          const up = pitches.filter(p=> Math.abs(p - med*2) < 3).length;
          const down = pitches.filter(p=> Math.abs(p - med/2) < 1.5).length;
          let corrected = med;
            if (up > pitches.length*0.3) corrected = med*2; else if (down > pitches.length*0.3) corrected = med/2;
          mainPitch = corrected;
          setMedianPitch(corrected);
          const { name: mName } = hzToNote(corrected);
          setMedianNote(mName);
        } else {
          setMedianPitch(null); setMedianNote(null);
        }
        // Single-pass overall pitch (use mainPitch)
        if (mainPitch) {
          setPitchHz(mainPitch);
          const { name } = hzToNote(mainPitch);
          setNoteName(name);
          const scaleCandidates = rankScales(pitches.map(p=> hzToNote(p).name));
          setScaleCands(scaleCandidates.slice(0,3));
          setKeyGuess(scaleCandidates[0]?.scale || null);
        } else { setPitchHz(null); setNoteName(null); setKeyGuess(null); setScaleCands(null); }
        // Stability (voiced ratio approximated by frame count / total frames)
        const totalFrames = Math.floor((chData.length - frameSize)/hop)+1;
        setStability(totalFrames>0? pitches.length/totalFrames: null);
        // Events (collapse consecutive same note class)
        const noteSeq = times.map((t,i)=> ({t, note: hzToNote(pitches[i]).name}));
        const ev: { note: string; start: number; end: number; midi: number }[] = [];
        if (noteSeq.length){
          let cur = noteSeq[0];
          for (let i=1;i<noteSeq.length;i++){
            const n = noteSeq[i];
            if (n.note===cur.note) continue;
            const { midi } = hzToNote(pitches[i-1]);
            ev.push({ note: cur.note, start: cur.t, end: n.t, midi });
            cur = n;
          }
          const last = noteSeq[noteSeq.length-1];
          const { midi } = hzToNote(pitches[pitches.length-1]);
          ev.push({ note: last.note, start: last.t, end: duration, midi });
        }
        setEvents(ev);
        summary = {
          ...summary,
          pitchHz: mainPitch,
          noteName: noteName || undefined,
          keyGuess: keyGuess || undefined,
          stability: stability || undefined,
          medianPitch: medianPitch || undefined,
          medianNote: medianNote || undefined,
          scaleCandidates: scaleCands || undefined,
          events: ev
        };
  } catch{ /* swallow */ }
      onResult?.(summary);
    };
    rec.start();
    startTimeRef.current = performance.now();
    setRecording(true);
    tickDuration();
  }
  function stop(){
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }
  function tickDuration(){
    setDuration((performance.now()-startTimeRef.current)/1000);
    if (recording) requestAnimationFrame(tickDuration);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
  <h3 className="text-xs uppercase tracking-widest text-slate-300">Melody Recorder</h3>
  {permission==='idle' && <button onClick={requestPermission} className="px-2 py-1 text-[11px] rounded border border-slate-600 hover:border-slate-400">Grant Mic</button>}
  {permission==='granted' && !recording && <button onClick={start} className="px-2 py-1 text-[11px] rounded border border-slate-400 bg-white/5 hover:bg-white/10">Record</button>}
        {recording && <button onClick={stop} className="px-2 py-1 text-[11px] rounded border border-pink-400 bg-pink-500/10 hover:bg-pink-500/20">Stop</button>}
      </div>
      <div className="h-20 relative">
        <canvas ref={canvasRef} width={600} height={80} className="w-full h-full bg-black/40 rounded" />
        {recording && <span className="absolute top-1 right-2 text-[10px] text-pink-300 animate-pulse">REC</span>}
      </div>
      <div className="text-[10px] text-slate-400 flex gap-4">
        <span>Permission: {permission}</span>
        <span>Duration: {duration.toFixed(1)}s</span>
      </div>
      {(pitchHz || medianPitch) && (
        <div className="text-[11px] mt-1 rounded bg-black/40 border border-slate-600 p-2 flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <span className="text-slate-300">Main Pitch: {pitchHz? pitchHz.toFixed(2)+' Hz':'—'}</span>
            <span className="text-slate-400">Median: {medianPitch? medianPitch.toFixed(2)+' Hz':'—'} ({medianNote||'—'})</span>
            <span className="text-amber-300">Key Guess: {keyGuess || '?'}</span>
            <span className="text-teal-300">Stability: {stability!=null? (stability*100).toFixed(0)+'%':'—'}</span>
          </div>
          {scaleCands && scaleCands.length>0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-slate-400">Scales:</span>
              {scaleCands.slice(0,3).map(s=> <span key={s.scale} className="px-1.5 py-0.5 rounded bg-slate-700/40 border border-slate-600 text-[10px] text-slate-200">{s.scale} {Math.round(s.score)}</span>)}
            </div>
          )}
          {events && events.length>0 && (
            <div className="text-[10px] text-slate-400 max-h-24 overflow-auto pr-2">
              {events.slice(0,12).map(e=> <div key={e.start.toFixed(2)+e.note}>{e.note} {e.start.toFixed(2)}–{e.end.toFixed(2)}</div>)}
              {events.length>12 && <div>… +{events.length-12} more</div>}
            </div>
          )}
        </div>
      )}
      {error && <div className="text-[10px] text-pink-400">{error}</div>}
      <p className="text-[10px] text-slate-500">Safari iOS: 권한 요청은 사용자 제스처 직후만 가능. 문제가 있으면 페이지 새로고침 후 다시 시도.</p>
    </div>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej)=>{
    const r = new FileReader();
    r.onload = ()=> res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

// --- Pitch Detection (YIN simplified) ---
function detectPitchYIN(signal: Float32Array, sampleRate: number): number | null {
  // Downsample if very long
  const MAX_SAMPLES = 48000; // ~1s at 48k
  let buf = signal;
  if (buf.length > MAX_SAMPLES) buf = buf.subarray(0, MAX_SAMPLES);
  const threshold = 0.1;
  const tauMax = Math.floor(sampleRate / 50); // 50 Hz lowest
  const tauMin = Math.floor(sampleRate / 1000); // 1000 Hz highest approx limit
  const yin = new Float32Array(tauMax);
  // Difference function
  for (let tau = 1; tau < tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < buf.length - tau; i++) {
      const d = buf[i] - buf[i + tau];
      sum += d * d;
    }
    yin[tau] = sum;
  }
  // Cumulative mean normalized difference
  let runningSum = 0;
  for (let tau = 1; tau < tauMax; tau++) {
    runningSum += yin[tau];
    yin[tau] = yin[tau] * tau / runningSum;
  }
  // Absolute threshold
  let tauEstimate = -1;
  for (let tau = tauMin; tau < tauMax; tau++) {
    if (yin[tau] < threshold) { tauEstimate = tau; break; }
  }
  if (tauEstimate === -1) return null;
  // Parabolic interpolation
  const betterTau = refineTau(yin, tauEstimate);
  const freq = sampleRate / betterTau;
  if (freq < 50 || freq > 1000) return null;
  return freq;
}

function refineTau(yin: Float32Array, tau: number): number {
  const x0 = tau < 1 ? tau : tau - 1;
  const x2 = tau + 1 < yin.length ? tau + 1 : tau;
  if (x0 === tau || x2 === tau) return tau;
  const s0 = yin[x0];
  const s1 = yin[tau];
  const s2 = yin[x2];
  const denom = (2 * s1 - s0 - s2);
  if (denom === 0) return tau;
  return tau + (s2 - s0) / (2 * denom);
}

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function hzToNote(freq: number){
  const a4 = 440;
  const semis = Math.round(12 * Math.log2(freq / a4));
  const midi = semis + 69;
  const name = NOTE_NAMES[(midi % 12 + 12) % 12] + (Math.floor(midi / 12) - 1);
  return { midi, name };
}

// Removed guessKey (unused) to satisfy lint unused-vars.

// Very simple scale ranking: count how many note classes fall inside each scale template
const SCALE_TEMPLATES: { scale: string; notes: string[] }[] = (()=> {
  const majors = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const patternMajor = [0,2,4,5,7,9,11];
  const patternMinor = [0,2,3,5,7,8,10];
  const out: { scale: string; notes: string[] }[] = [];
  majors.forEach((root,i)=> {
    out.push({ scale: root+' major', notes: patternMajor.map(p=> NOTE_NAMES[(i+p)%12]) });
    out.push({ scale: root+' minor', notes: patternMinor.map(p=> NOTE_NAMES[(i+p)%12]) });
  });
  return out;
})();

function rankScales(noteNames: string[]): { scale: string; score: number }[] {
  if (!noteNames.length) return [];
  // reduce to pitch classes
  const classes = noteNames.map(n=> n.replace(/\d+/,'')).filter(Boolean);
  const unique = Array.from(new Set(classes));
  const results: { scale: string; score: number }[] = [];
  for (const tmpl of SCALE_TEMPLATES) {
    let hits = 0;
    for (const c of unique) if (tmpl.notes.includes(c)) hits++;
    const score = (hits / tmpl.notes.length) * 100 + hits * 2; // simple weighting
    results.push({ scale: tmpl.scale, score });
  }
  return results.sort((a,b)=> b.score - a.score);
}
