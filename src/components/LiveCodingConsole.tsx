import React, { useEffect, useState } from 'react';
import { runLiveCode } from '../live/sandbox';

interface LogEntry { ts: number; text: string; type: 'info'|'error'; }

export function LiveCodingConsole({ onClose }:{ onClose?: ()=>void }) {
  const [code, setCode] = useState<string>(`// Live coding playground\nsetBPM(130)\nplay("kick", { pattern: "x---x---x---x---" })`);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'code'|'help'>('code');
  // (future) queued snippet buffer if we debounce inserts
  // const insertQueue = useRef<string[]>([]);

  useEffect(()=> {
    function onInsert(e: any){
      if (e.detail?.snippet){
        setCode(prev=> prev + (prev.endsWith('\n')? '':'\n') + e.detail.snippet + '\n');
        pushLog('Inserted snippet', 'info');
      }
    }
    window.addEventListener('livecode.insert', onInsert as any);
    return ()=> window.removeEventListener('livecode.insert', onInsert as any);
  },[]);

  function pushLog(text:string, type:'info'|'error'){ setLogs(l=> [...l.slice(-199), { ts: Date.now(), text, type }]); }

  function run(){
    const result = runLiveCode(code);
    if (result.ok) pushLog('Run OK', 'info'); else pushLog('Error: '+result.error, 'error');
  }
  function stopAll(){
    const result = runLiveCode('stopAll()');
    if (result.ok) pushLog('Stopped all', 'info');
  }

  return (
    <div className="flex flex-col h-full bg-black/60 border-l border-white/10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex gap-2 text-[11px]">
          <button onClick={()=> setActiveTab('code')} className={`px-2 py-1 rounded ${activeTab==='code'? 'bg-cyan-600/30 text-cyan-200':'text-slate-400 hover:text-cyan-200'}`}>Code</button>
          <button onClick={()=> setActiveTab('help')} className={`px-2 py-1 rounded ${activeTab==='help'? 'bg-cyan-600/30 text-cyan-200':'text-slate-400 hover:text-cyan-200'}`}>Help</button>
        </div>
        <div className="flex gap-2">
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
        <div className="p-3 text-[11px] leading-relaxed text-slate-300 overflow-auto">
          <div className="mb-2 font-semibold text-cyan-200">Available API</div>
          <ul className="list-disc pl-4 space-y-1">
            <li><code>setBPM(n)</code> : Set tempo</li>
            <li><code>play(id, {`{ pattern, notes?, gain?, decay? }`})</code> : Register pattern (16-step)</li>
            <li><code>stop(id)</code> / <code>stopAll()</code></li>
          </ul>
          <div className="mt-3 font-semibold text-cyan-200">Example</div>
          <pre className="bg-black/40 p-2 rounded border border-white/5 whitespace-pre-wrap">{`setBPM(130)
play("kick", { pattern: "x---x---x---x---" })
play("hat", { pattern: "-x-x-x-x-x-x-x-x", gain:0.3 })
play("bass", { pattern: "x---x---x---x---", notes:[36,36,43,31] })`}</pre>
        </div>
      )}
    </div>
  );
}

export function dispatchLiveCodeSnippet(snippet: string){
  window.dispatchEvent(new CustomEvent('livecode.insert', { detail: { snippet } }));
}
