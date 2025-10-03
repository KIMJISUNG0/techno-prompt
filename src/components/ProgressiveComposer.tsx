import React from 'react';
import { PROG_CATEGORIES, ProgressiveSelections, buildProgressivePrompt, suggestNextCategories } from '../progressive/progressiveCategories';

export default function ProgressiveComposer(){
  const [step, setStep] = React.useState(0);
  const [mode, setMode] = React.useState<'compact'|'rich'>('rich');
  const [sel, setSel] = React.useState<ProgressiveSelections>({});

  const categories = PROG_CATEGORIES;
  const current = categories[step];
  const picked = sel[current.id] || [];

  function toggle(tokenId: string){
    setSel(s => {
      const list = new Set(s[current.id]||[]);
      if (list.has(tokenId)) list.delete(tokenId); else {
        if (current.max && list.size >= current.max) return s; // soft cap
        list.add(tokenId);
      }
      return { ...s, [current.id]: Array.from(list) };
    });
  }

  function next(){ if (step < categories.length -1) setStep(step+1); }
  function prev(){ if (step>0) setStep(step-1); }
  function reset(){ setSel({}); setStep(0); }

  const prompt = buildProgressivePrompt(sel, mode);
  const nextHints = suggestNextCategories(current.id, sel);

  return (
    <div className="mt-16 space-y-8">
      <header className="flex flex-wrap gap-2 items-center">
        <h2 className="text-lg font-semibold tracking-wider">멀티 장르 프롬프트 컴포저</h2>
        <div className="flex flex-wrap gap-1 ml-4">
          {categories.map((c,i)=> (
            <button key={c.id} onClick={()=> setStep(i)} className={`px-2 py-1 rounded border text-[11px] ${i===step? 'border-cyan-400 text-cyan-200 bg-cyan-600/10':'border-slate-600 text-slate-300 hover:border-cyan-400'}`}>{c.id}</button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex gap-2 text-[11px] items-center">
          <button onClick={reset} className="btn">Reset</button>
          <button onClick={()=> setMode(m=> m==='rich'?'compact':'rich')} className="btn">Mode: {mode}</button>
          <button onClick={()=> navigator.clipboard.writeText(prompt)} className="btn btn-accent">Copy Prompt</button>
        </div>
      </header>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm tracking-widest uppercase text-cyan-300">{current.label}</h3>
          <div className="text-[10px] text-slate-500">Pick {current.min || 0}–{current.max || '∞'} tokens</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {current.tokens.map(tok => {
            const on = picked.includes(tok.id);
            const isHint = nextHints.includes(tok.id); // rarely true (hints from previous maybe)
            return (
              <button key={tok.id} onClick={()=> toggle(tok.id)} title={tok.hint || ''} className={`btn text-[11px] ${on? 'border-cyan-400 text-cyan-200 bg-cyan-600/20':''} ${isHint && !on? 'ring-1 ring-cyan-500/40':''}`}>{tok.label}</button>
            );
          })}
        </div>
        <div className="flex gap-3 text-[11px] pt-2">
          <button disabled={step===0} onClick={prev} className={`btn ${step===0? 'opacity-30 cursor-not-allowed':''}`}>Prev</button>
          <button disabled={step===categories.length-1} onClick={next} className={`btn ${step===categories.length-1? 'opacity-30 cursor-not-allowed':''}`}>Next</button>
        </div>
      </section>
      <section className="space-y-2">
        <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Prompt Preview</h3>
        <pre className="text-[11px] whitespace-pre-wrap leading-relaxed bg-black/40 rounded border border-slate-700 p-3 max-h-80 overflow-auto">{prompt}</pre>
      </section>
    </div>
  );
}
