import React, { useEffect, useState } from 'react';
import AudioViz from './AudioViz';
import { runLiveCode } from '../live/sandbox';

interface LogEntry { ts: number; text: string; type: 'info'|'error'; }

export function LiveCodingConsole({ onClose }:{ onClose?: ()=>void }) {
  const [code, setCode] = useState(`// Live coding playground\nsetBPM(128)\nplay('kick',{ pattern:'x---x---x---x---' })`);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'code'|'help'>('code');
  // Mic state
  const [micOn,setMicOn]=useState(false);
  const [micLevel,setMicLevel]=useState(0);
  const [micGain,setMicGain]=useState(1);

  // Poll mic level when enabled
  useEffect(()=>{
    let raf:number; let mounted=true;
    function loop(){
      try {
        const api:any = (window as any).liveAPI; if (micOn && api?.getMicAnalyser){ const a=api.getMicAnalyser(); if (a?.level!=null) setMicLevel(a.level); }
      } catch{/* ignore */}
      if (mounted) raf = requestAnimationFrame(loop);
    }
    loop();
    return ()=> { mounted=false; cancelAnimationFrame(raf); };
  },[micOn]);

  async function toggleMic(){
    const api:any = (window as any).liveAPI;
    if (!api) return;
    if (!micOn){ const ok = await api.enableMic(); if (ok){ setMicOn(true); pushLog('Mic enabled','info'); } else pushLog('Mic permission denied','error'); }
    else { api.disableMic(); setMicOn(false); setMicLevel(0); pushLog('Mic disabled','info'); }
  }
  function changeMicGain(v:number){ setMicGain(v); const api:any=(window as any).liveAPI; api?.setMicGain?.(v); }

  useEffect(()=> {
    function onInsert(e:any){
      if (e.detail?.snippet){
        setCode(prev=> prev + (prev.endsWith('\n')? '':'\n') + e.detail.snippet + '\n');
        pushLog('Inserted snippet','info');
      }
    }
    window.addEventListener('livecode.insert', onInsert as any);
    return ()=> window.removeEventListener('livecode.insert', onInsert as any);
  },[]);

  function pushLog(text:string, type:'info'|'error'){ setLogs(l=> [...l.slice(-199), { ts:Date.now(), text, type }]); }
  function run(){ const r = runLiveCode(code); if (r.ok) pushLog('Run OK','info'); else pushLog('Error: '+r.error,'error'); }
  function stopAll(){ const r = runLiveCode('stopAll()'); if (r.ok) pushLog('Stopped all','info'); }

  return (
    <div className="flex flex-col h-full bg-black/60 border-l border-white/10 relative overflow-hidden">
      <AudioViz bars={48} className="opacity-40 mix-blend-plus-lighter pointer-events-none" />
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex gap-2 text-[11px]">
          <button onClick={()=> setActiveTab('code')} className={`px-2 py-1 rounded ${activeTab==='code'? 'bg-cyan-600/30 text-cyan-200':'text-slate-400 hover:text-cyan-200'}`}>Code</button>
          <button onClick={()=> setActiveTab('help')} className={`px-2 py-1 rounded ${activeTab==='help'? 'bg-cyan-600/30 text-cyan-200':'text-slate-400 hover:text-cyan-200'}`}>Help</button>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 text-[10px]">
            <button onClick={toggleMic} className={`px-2 py-1 rounded border text-[10px] ${micOn? 'border-slate-400 text-slate-200 bg-white/10 hover:bg-white/20':'border-slate-600 text-slate-400 hover:border-slate-400'}`}>{micOn? 'Mic On':'Mic Off'}</button>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Gain</span>
              <input type="range" min={0} max={3} step={0.05} value={micGain} onChange={e=> changeMicGain(parseFloat(e.target.value))} className="accent-slate-400" />
            </div>
            <div className="w-14 h-2 bg-slate-800/60 rounded overflow-hidden">
              <div style={{ width: `${Math.min(100, Math.round(micLevel*140))}%` }} className="h-full bg-slate-300 transition-all" />
            </div>
          </div>
          <button onClick={run} className="px-3 py-1.5 rounded bg-emerald-600/30 border border-emerald-400/40 text-[11px] hover:bg-emerald-600/40">Run</button>
          <button onClick={stopAll} className="px-3 py-1.5 rounded bg-rose-600/20 border border-rose-400/40 text-[11px] hover:bg-rose-600/30">Stop</button>
          {onClose && <button onClick={onClose} className="px-2 text-slate-400 hover:text-cyan-200 text-[11px]">×</button>}
        </div>
      </div>
      {activeTab==='code' && (
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
            <textarea value={code} onChange={e=> setCode(e.target.value)} spellCheck={false} className="flex-1 bg-black/40 p-3 font-mono text-[11px] text-slate-200 outline-none resize-none" />
          </div>
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider px-2 py-1 text-slate-400 border-b border-white/5">Log</div>
            <div className="flex-1 overflow-auto p-2 space-y-1 text-[11px] font-mono">
              {logs.map(l=> <div key={l.ts+Math.random()} className={l.type==='error'? 'text-rose-300':'text-slate-300'}>{l.text}</div>)}
            </div>
          </div>
        </div>
      )}
      {activeTab==='help' && (
        <div className="p-3 text-[11px] leading-relaxed text-slate-300 overflow-auto space-y-5">
          <section>
            <div className="mb-1 font-semibold text-cyan-200">Core API</div>
            <ul className="list-disc pl-4 space-y-1">
              <li><code>setBPM(n)</code> / <code>setSwing(pct)</code></li>
              <li><code>play()</code>, <code>update()</code>, <code>stop()</code>, <code>stopAll()</code></li>
              <li><code>registerPatch()</code>, <code>triggerPatch()</code>, <code>listPatches()</code></li>
              <li><code>tonePlay()</code>, <code>tonePatternPlay()</code>, <code>toneStop()</code>, <code>toneStopAll()</code></li>
              <li><code>setToneBPM()</code>, <code>getAnalyser()</code>, <code>liveaudio.hit</code></li>
            </ul>
          </section>
          <section>
            <div className="mb-1 font-semibold text-cyan-200">Pattern DSL v2</div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>Notes: <code>C4</code>, <code>D#3</code> 등</li>
              <li>Rest: <code>.</code> 또는 <code>-</code></li>
              <li>Hold: <code>_</code> 이전 노트 길이 +1 (누적 길이)</li>
              <li>Velocity: <code>!</code> (accent) / <code>?</code> (soft)</li>
            </ul>
            <pre className="bg-black/30 p-2 rounded border border-white/5 whitespace-pre-wrap">{`setToneBPM(128)
tonePatternPlay('arp','C4_E4.G4!_B4.-C5?', { type:'synth', velocity:0.85 })`}</pre>
          </section>
          <section>
            <div className="mb-1 font-semibold text-cyan-200">FX Customization</div>
            <pre className="bg-black/30 p-2 rounded border border-white/5 whitespace-pre-wrap">{`tonePlay('pad',{ type:'synth', notes:['C3','E3','G3','B3'], fx:[{ type:'reverb', decay:4.2, wet:0.4 }] })`}</pre>
          </section>
          <section>
            <div className="mb-1 font-semibold text-cyan-200">Analyser & Events</div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><code>getAnalyser()</code> → {`{ freq,time,level }`}</li>
              <li><code>liveaudio.hit</code> → <code>detail.role / velocity</code></li>
            </ul>
          </section>
          <section>
            <div className="mb-1 font-semibold text-cyan-200">Patch & Update</div>
            <pre className="bg-black/30 p-2 rounded border border-white/5 whitespace-pre-wrap">{`registerPatch('HardKick',{ type:'kick', pattern:'x---x---x---x---', base:{ gain:0.95 } })
triggerPatch('HardKick')
play('hat',{ pattern:'-x-x-x-x-x-x-x-x', gain:0.3 })
update('hat',{ gain:0.22 })`}</pre>
          </section>
          <section>
            <div className="mb-1 font-semibold text-cyan-200">New Band Instruments</div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><code>guitar</code> (Karplus-Strong pluck) – <code>{"play('gtr',{ type:'guitar', pattern:'x---x---x---x---', notes:[52,55,59,55] })"}</code></li>
              <li><code>bassGtr</code> (low saw + LP) – <code>{"play('bassG',{ type:'bassGtr', pattern:'x---x---x---x---', notes:[36,36,43,31] })"}</code></li>
              <li><code>piano</code> (additive partials) – env attack/decay/release 적용</li>
              <li><code>organ</code> (sine harmonics sustain)</li>
              <li><code>tom</code> (pitch sweep)</li>
              <li><code>clap</code> (multi burst noise)</li>
              <li><code>ride</code> (bandpass noise long decay)</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

export function dispatchLiveCodeSnippet(snippet:string){
  window.dispatchEvent(new CustomEvent('livecode.insert', { detail:{ snippet } }));
}
