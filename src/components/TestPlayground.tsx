import React, { useEffect, useRef, useState } from 'react';

// Lazy access sandbox live API (assumes already initialized by console or engine load)
interface AnalyserPayload { freq: Uint8Array; time: Uint8Array; level: number }

declare global {
  interface Window { getLiveAPI?: () => any }
}

const defaultPattern = 'C4_E4.G4!_B4.-C5?';

export default function TestPlayground(){
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const [bpm,setBpm] = useState(128);
  const [playing,setPlaying] = useState(false);
  const [pattern,setPattern] = useState(defaultPattern);
  const [log,setLog] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);

  useEffect(()=> {
    function onHit(e: any){
      const d = e.detail || {}; // { role, id, velocity, index, when }
      const line = `[hit] ${d.role||''} v=${d.velocity?.toFixed?.(2)} step=${d.index}`;
      logRef.current = [line, ...logRef.current].slice(0,50);
      setLog([...logRef.current]);
    }
    window.addEventListener('liveaudio.hit', onHit);
    return ()=> window.removeEventListener('liveaudio.hit', onHit);
  },[]);

  useEffect(()=> {
    let raf:number; const ctx = canvasRef.current?.getContext('2d');
    const api = window.getLiveAPI?.();
    const bars = 64;
    function frame(){
      raf = requestAnimationFrame(frame);
      if(!ctx || !api?.getAnalyser) return;
      const a:AnalyserPayload = api.getAnalyser();
  const { freq, time /* level */ } = a; // level currently unused (reserved for future meter UI)
      const w = ctx.canvas.width, h = ctx.canvas.height;
      ctx.clearRect(0,0,w,h);
      // freq bars
      const step = Math.floor(freq.length / bars);
      for(let i=0;i<bars;i++){
        let sum=0; for(let j=0;j<step;j++) sum += freq[i*step+j];
        const v = sum/step/255; // 0..1
        const barH = v * h * 0.5;
        const x = i*(w/bars);
        ctx.fillStyle = `hsl(${180 + i*2},70%,${35+v*45}%)`;
        ctx.fillRect(x, h-barH, w/bars*0.9, barH);
      }
      // waveform
      ctx.beginPath();
      for(let i=0;i<time.length;i++){
        const y = (time[i]/255)*h*0.4 + h*0.05;
        const x = i/time.length * w;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // level meter ring (simple)
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0,0, w, h*0.05);
      ctx.fillStyle = 'linear-gradient(90deg,#0ff,#f0f)';
    }
    frame();
    return ()=> cancelAnimationFrame(raf);
  },[]);

  function start(){
    const api = window.getLiveAPI?.();
    if(!api) return;
    api.setToneBPM?.(bpm);
    api.tonePatternPlay?.('testArp', pattern, { type:'synth', velocity:0.9, fx:[{ type:'reverb', decay:3, wet:0.35 }, { type:'delay', time:'8n', feedback:0.3, wet:0.25 }] });
    setPlaying(true);
  }
  function stop(){
    const api = window.getLiveAPI?.();
    api?.toneStop?.('testArp');
    setPlaying(false);
  }

  return (
    <div className="p-6 space-y-6 text-slate-200 font-mono">
      <h1 className="text-xl font-semibold tracking-widest bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">LIVE TEST PLAYGROUND</h1>
      <div className="flex flex-wrap gap-4 items-end">
        <label className="text-xs flex flex-col">BPM
          <input type="number" value={bpm} onChange={e=> setBpm(Number(e.target.value)||bpm)} className="bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm w-24" />
        </label>
        <label className="text-xs flex-1 min-w-[260px]">Pattern
          <input value={pattern} onChange={e=> setPattern(e.target.value)} className="bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm w-full" />
        </label>
        {!playing && <button onClick={start} className="px-4 py-2 rounded bg-cyan-500 text-slate-900 font-semibold text-xs tracking-wide hover:brightness-110">Start</button>}
        {playing && <button onClick={stop} className="px-4 py-2 rounded bg-fuchsia-500 text-slate-900 font-semibold text-xs tracking-wide hover:brightness-110">Stop</button>}
      </div>
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-800/40">
        <canvas ref={canvasRef} width={900} height={260} className="w-full h-[260px] block" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-widest text-cyan-300">Recent Hits</h2>
          <div className="text-[10px] h-40 overflow-auto bg-slate-900/50 border border-slate-700 rounded p-2 leading-relaxed whitespace-pre-wrap">{log.join('\n')}</div>
        </div>
        <div className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-widest text-fuchsia-300">Pattern DSL v2</h2>
          <ul className="text-[10px] text-slate-400 list-disc pl-4 space-y-1">
            <li>Notes: C4 D#3 G2</li>
            <li>Rest: . or -</li>
            <li>Hold: _ extends previous note length</li>
            <li>Velocity accent: ! (louder) ? (softer)</li>
          </ul>
        </div>
      </div>
      <div className="text-[10px] text-slate-500">Hash route: <code>#live-test</code>. Return: <a className="text-cyan-300 underline" href="#wizard">Wizard</a></div>
    </div>
  );
}
