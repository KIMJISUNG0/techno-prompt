import React, { useState, useMemo } from 'react';
import { INSTRUMENTS, FX_CATALOG, buildInstrumentPrompt } from '../data/instruments';

interface Props { onCopy?: (text:string)=>void; }

export default function InstrumentPromptBuilder({ onCopy }:Props){
  const [instrument, setInstrument] = useState('inst-pad-warm');
  const [fxSel, setFxSel] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');

  const instFamilies = useMemo(()=> {
    const collected = new Set<string>();
    INSTRUMENTS.forEach(i=> (i.families||[]).forEach(f=> collected.add(f)) );
    return Array.from(collected).sort();
  },[]);

  const filtered = useMemo(()=> {
    const q = search.trim().toLowerCase();
    return INSTRUMENTS.filter(i=> {
      if (familyFilter && !(i.families||[]).includes(familyFilter)) return false;
      if (!q) return true;
      return i.label.toLowerCase().includes(q) || i.prompt.toLowerCase().includes(q);
    });
  },[search,familyFilter]);

  const prompt = useMemo(()=> buildInstrumentPrompt(instrument, [...fxSel]), [instrument, fxSel]);

  function toggleFx(id:string){
    setFxSel(prev=> {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }

  return (
    <div className="space-y-6">
      {/* Instrument Picker */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-xs uppercase tracking-widest text-cyan-200 mb-3">Instrument</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input value={search} onChange={e=> setSearch(e.target.value)} placeholder="Search" className="px-2 py-1 text-[11px] rounded bg-slate-800/60 border border-slate-600 focus:outline-none focus:border-cyan-400" />
          <select value={familyFilter} onChange={e=> setFamilyFilter(e.target.value)} className="px-2 py-1 text-[11px] rounded bg-slate-800/60 border border-slate-600 focus:outline-none focus:border-cyan-400">
            <option value="">All Families</option>
            {instFamilies.map(f=> <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-auto pr-1">
          {filtered.map(i=> {
            const active = i.id===instrument;
            return (
              <button key={i.id} onClick={()=> setInstrument(i.id)} className={`text-left border rounded-lg p-2 text-[11px] transition ${active? 'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-200'}`}>
                <div className="font-medium text-[12px]">{i.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{i.prompt}</div>
              </button>
            );
          })}
        </div>
      </div>
      {/* FX Chain Selection */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-xs uppercase tracking-widest text-fuchsia-200 mb-3">FX Chain</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-auto pr-1">
          {FX_CATALOG.map(f=> {
            const on = fxSel.has(f.id);
            return (
              <button key={f.id} onClick={()=> toggleFx(f.id)} className={`text-left border rounded p-2 text-[11px] transition ${on? 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-300 hover:border-fuchsia-400 hover:text-fuchsia-200'}`}>
                <div className="font-medium text-[11px] flex items-center gap-1">{f.label}<span className="text-[9px] text-slate-500">T{f.tier}</span></div>
                <div className="text-[9px] text-slate-500">{f.category}</div>
              </button>
            );
          })}
        </div>
      </div>
      {/* Result */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h3 className="text-xs uppercase tracking-widest text-emerald-200 mb-2">Result</h3>
        <div className="min-h-[80px] text-sm leading-relaxed bg-black/30 rounded-lg p-3 border border-slate-700">{prompt || <span className='text-slate-500'>Select instrument and FX…</span>}</div>
        <div className="mt-2 flex gap-2">
          <button disabled={!prompt} onClick={()=> { if(prompt){ navigator.clipboard.writeText(prompt); onCopy?.(prompt);} }} className="px-3 py-1.5 rounded bg-cyan-600/30 border border-cyan-400/60 text-[11px] disabled:opacity-40 hover:bg-cyan-600/40">Copy</button>
          <button onClick={()=> setFxSel(new Set())} className="px-3 py-1.5 rounded bg-slate-700/30 border border-slate-500 text-[11px] hover:border-cyan-400">Clear FX</button>
        </div>
      </div>
    </div>
  );
}