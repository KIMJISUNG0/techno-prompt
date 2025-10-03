import React from 'react';
import { PROG_CATEGORIES, ProgressiveSelections, buildProgressivePrompt } from '../progressive/progressiveCategories';
import { analyzeAbstract } from '../progressive/abstractHints';

// 리뉴얼 목표:
// 1) 카테고리 순차 진행(기존 step) 대신 한 화면(All)에서 빠른 다중 선택 가능
// 2) 필요 시 Step 모드로 전환하여 집중 선택
// 3) 확장 카테고리(space/rhythm/vocal/texture/master) 자동 반영
// 4) 최소/최대/다양성 힌트 상단 요약

export default function ProgressiveComposer(){
  const [step, setStep] = React.useState(0); // 유지: Step 모드 위치
  const [view, setView] = React.useState<'all'|'step'>('all');
  const [promptMode, setPromptMode] = React.useState<'compact'|'rich'>('rich');
  const [sel, setSel] = React.useState<ProgressiveSelections>({});
  const [filter, setFilter] = React.useState('');

  const categories = PROG_CATEGORIES;
  const current = categories[Math.min(step, categories.length-1)];

  function toggleToken(catId: string, tokenId: string){
    const cat = categories.find(c=> c.id===catId)!;
    setSel(s => {
      const list = new Set(s[catId]||[]);
      if (list.has(tokenId)) list.delete(tokenId); else {
        if (cat.max && list.size >= cat.max) return s; // soft cap
        list.add(tokenId);
      }
      return { ...s, [catId]: Array.from(list) };
    });
  }

  function reset(){ setSel({}); setStep(0); }

  const prompt = buildProgressivePrompt(sel, promptMode);
  const abstractHints = analyzeAbstract(sel, current.id);

  const totalPicked = Object.values(sel).reduce((a,b)=> a + b.length, 0);
  const unmetCount = abstractHints.unmetMinimum.length;

  function renderCategoryBlock(catId: string){
    const cat = categories.find(c=> c.id===catId)!;
    const picked = sel[cat.id]||[];
    const tokens = cat.tokens.filter(tok => !filter || tok.label.toLowerCase().includes(filter.toLowerCase()));
    if (!tokens.length) return null;
    return (
      <div key={cat.id} className="space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] uppercase tracking-wider text-cyan-300">{cat.label}</h4>
          <span className="text-[10px] text-slate-500">{picked.length}{cat.max? '/' + cat.max:''}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tokens.map(tok => {
            const on = picked.includes(tok.id);
            return (
              <button key={tok.id} onClick={()=> toggleToken(cat.id, tok.id)} className={`px-2 py-[4px] rounded border text-[10px] ${on? 'border-cyan-400 text-cyan-200 bg-cyan-600/20':'border-slate-600 text-slate-300 hover:border-cyan-400'}`}>{tok.label}</button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderAllView(){
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 items-center text-[10px]">
          <input value={filter} onChange={e=> setFilter(e.target.value)} placeholder="filter tokens" className="px-2 py-[4px] rounded border border-slate-600 bg-slate-900/40 focus:outline-none focus:border-cyan-400" />
          <div className="text-slate-500">Picked: {totalPicked}</div>
          {unmetCount>0 && <div className="text-amber-300">Unmet: {unmetCount}</div>}
          <button onClick={reset} className="px-2 py-[4px] rounded border border-slate-600 text-[10px] hover:border-amber-400">Reset</button>
          <button onClick={()=> setPromptMode(m=> m==='rich'?'compact':'rich')} className="px-2 py-[4px] rounded border border-slate-600 text-[10px] hover:border-cyan-400">Prompt: {promptMode}</button>
          <button onClick={()=> navigator.clipboard.writeText(prompt)} className="px-2 py-[4px] rounded border border-emerald-400 text-[10px] text-emerald-200 bg-emerald-600/10">Copy Prompt</button>
          <button onClick={()=> setView('step')} className="px-2 py-[4px] rounded border border-slate-600 text-[10px] hover:border-cyan-400">Step Mode</button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map(c => renderCategoryBlock(c.id))}
        </div>
      </div>
    );
  }

  function renderStepView(){
    const cat = current;
    const picked = sel[cat.id]||[];
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 items-center text-[10px]">
          <button onClick={()=> setView('all')} className="px-2 py-[4px] rounded border border-slate-600 hover:border-cyan-400">All View</button>
          <div className="text-slate-500">Step {step+1}/{categories.length}</div>
          <button onClick={()=> setPromptMode(m=> m==='rich'?'compact':'rich')} className="px-2 py-[4px] rounded border border-slate-600 hover:border-cyan-400">Prompt: {promptMode}</button>
          <button onClick={reset} className="px-2 py-[4px] rounded border border-slate-600 hover:border-amber-400">Reset</button>
        </div>
        <div>
          <h3 className="text-sm tracking-widest uppercase text-cyan-300 mb-2">{cat.label}</h3>
          <div className="flex flex-wrap gap-2">
            {cat.tokens.map(tok => {
              const on = picked.includes(tok.id);
              return (
                <button key={tok.id} onClick={()=> toggleToken(cat.id, tok.id)} className={`btn text-[11px] ${on? 'border-cyan-400 text-cyan-200 bg-cyan-600/20':''}`}>{tok.label}</button>
              );
            })}
          </div>
          <div className="flex gap-3 text-[11px] pt-4">
            <button disabled={step===0} onClick={()=> setStep(s=> Math.max(0,s-1))} className={`btn ${step===0? 'opacity-30 cursor-not-allowed':''}`}>Prev</button>
            <button disabled={step===categories.length-1} onClick={()=> setStep(s=> Math.min(categories.length-1,s+1))} className={`btn ${step===categories.length-1? 'opacity-30 cursor-not-allowed':''}`}>Next</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-8">
      <header className="flex flex-wrap gap-3 items-center">
        <h2 className="text-lg font-semibold tracking-wider">멀티 장르 프롬프트 컴포저 (리뉴얼)</h2>
        <button onClick={()=> setView(v=> v==='all'?'step':'all')} className="btn text-[11px]">View: {view}</button>
        <button onClick={reset} className="btn text-[11px]">Reset</button>
        <button onClick={()=> setPromptMode(m=> m==='rich'?'compact':'rich')} className="btn text-[11px]">Prompt: {promptMode}</button>
        <button onClick={()=> navigator.clipboard.writeText(prompt)} className="btn btn-accent text-[11px]">Copy Prompt</button>
        <div className="flex-1" />
        <div className="text-[10px] text-slate-500 flex gap-4">
          <span>Picked {totalPicked}</span>
          <span>Unmet {unmetCount}</span>
          <span>Diversity Warn {abstractHints.diversityWarnings.length}</span>
        </div>
      </header>
      <div>
        {view==='all' ? renderAllView() : renderStepView()}
      </div>
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Prompt Preview</h3>
          <pre className="text-[11px] whitespace-pre-wrap leading-relaxed bg-black/40 rounded border border-slate-700 p-3 max-h-80 overflow-auto">{prompt}</pre>
        </div>
        <div className="space-y-2">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Abstract Suggestions</h3>
          <div className="text-[10px] bg-black/40 rounded border border-slate-700 p-3 space-y-2 max-h-80 overflow-auto">
            {abstractHints.unmetMinimum.length>0 && (
              <div><span className="text-slate-400">Need more picks:</span> {abstractHints.unmetMinimum.join(', ')}</div>
            )}
            {abstractHints.diversityWarnings.length>0 && (
              <div><span className="text-slate-400">Low diversity:</span> {abstractHints.diversityWarnings.join(', ')}</div>
            )}
            {abstractHints.overMax.length>0 && (
              <div><span className="text-amber-300">Over limit:</span> {abstractHints.overMax.join(', ')}</div>
            )}
            {abstractHints.nextCategoryPriority.length>0 && (
              <div><span className="text-slate-400">Next focus:</span> {abstractHints.nextCategoryPriority.join(', ')}</div>
            )}
            {abstractHints.tokenSuggestions.length>0 && (
              <div><span className="text-slate-400">Token ideas:</span> {abstractHints.tokenSuggestions.join(', ')}</div>
            )}
            {abstractHints.unmetMinimum.length===0 && abstractHints.tokenSuggestions.length===0 && (
              <div className="text-slate-500">No pressing suggestions – refine freely.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
