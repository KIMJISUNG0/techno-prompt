import React, { useMemo, useState } from 'react';
import type { MergedSchema } from '../data/multigenre/schema';

interface Props {
  schema: MergedSchema;
  bpm?: number;
  meter?: string;
  swing?: number;
  extraSuffix?: string; // appended after prompt (comma separated if needed)
  compact?: boolean;    // compact 모드 (아코디언/축소)
}

// 간단 Chip 재사용 버전
function Chip({active,label,onClick}:{active:boolean;label:string;onClick:()=>void}){
  return <button onClick={onClick} className={`px-2 py-1 rounded-full border text-[11px] transition ${active? 'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-200'}`}>{label}</button>;
}

export default function SchemaPromptBuilder({ schema, bpm, meter, swing, extraSuffix, compact }: Props){
  const [sel, setSel] = useState<Record<string, Set<string>>>(()=> Object.fromEntries(schema.groups.map(g=> [g.id,new Set()])) as any);
  const [params, setParams] = useState<Set<string>>(new Set());
  const [tagFilters, setTagFilters] = useState<Set<string>>(new Set());
  const [tagMode, setTagMode] = useState<'OR'|'AND'|'NOT'>('OR');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(()=> ({}));
  const groupsById = useMemo(()=> Object.fromEntries(schema.groups.map(g=> [g.id,g])),[schema.groups]);
  const optionsByGroup = useMemo(()=> {
    const map: Record<string, any[]> = {};
    for (const g of schema.groups) map[g.id] = [];
    for (const o of schema.options) {
      if (!map[o.group]) map[o.group] = [];
      map[o.group].push(o);
    }
    return map;
  },[schema]);

  function toggle(groupId: string, optId: string, multi: boolean){
    setSel(prev => {
      const copy: Record<string, Set<string>> = { ...prev };
      const set = new Set(copy[groupId] || []);
      if (!multi) set.clear();
      if (set.has(optId)) set.delete(optId); else set.add(optId);
      copy[groupId] = set;
      return copy;
    });
  }
  function addSub(id:string){ setParams(p=> new Set([...p,id])); }

  // NOTE: Previously computed union of selected ids (allSelectedIds) was unused; removed to silence lint warning.

  const optionIndex = useMemo(()=> new Map(schema.options.map(o=> [o.id,o])),[schema.options]);
  const suboptIndex = schema.subopts;
  const allTags = useMemo(()=> {
    const set = new Set<string>();
    for (const o of schema.options) {
      if (o.tags) o.tags.forEach(t=> set.add(t));
    }
    return [...set].sort();
  },[schema.options]);

  function toggleTag(t: string){
    setTagFilters(prev=> {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t); else n.add(t);
      return n;
    });
  }

  const prompt = useMemo(()=> {
    const parts: string[] = [];
    if (typeof bpm === 'number') parts.push(`${bpm} BPM`);
    if (meter && meter !== '4/4') parts.push(meter);
    if (swing) parts.push(`Swing ${swing}%`);
    for (const gid of schema.order) {
      const set = sel[gid];
      if (!set || set.size===0) continue;
      const chunk = [...set].map(id=> optionIndex.get(id)?.prompt).filter(Boolean).join(', ');
      if (chunk) parts.push(chunk);
    }
    if (params.size) {
      const paramPrompts: string[] = [];
      for (const pid of params) {
        // find in subopts
        outer: for (const list of Object.values(suboptIndex)) {
          const found = list.find(s=> s.id===pid);
          if (found){ paramPrompts.push(found.prompt); break outer; }
        }
      }
      if (paramPrompts.length) parts.push(paramPrompts.join(', '));
    }
    let base = parts.join(', ');
    if (extraSuffix) base = base ? base + ', ' + extraSuffix : extraSuffix;
    return base;
  },[bpm,meter,swing,sel,params,optionIndex,suboptIndex,schema.order,extraSuffix]);

  // compact 모드 진입/이탈 시 기본 접힘 상태 재설정 (앞 2개만 펼침)
  React.useEffect(()=> {
    if (compact) {
      const init: Record<string, boolean> = {};
      schema.order.forEach((gid,idx)=> { init[gid] = idx>1; });
      setCollapsed(init);
    } else {
      setCollapsed({});
    }
  },[compact, schema.order]);

  function toggleCollapse(gid:string){
    setCollapsed(prev=> ({...prev, [gid]: !prev[gid]}));
  }

  return (
    <div className={compact? 'space-y-4':'space-y-6'}>
      <div className={`rounded-xl border border-white/10 bg-white/5 ${compact? 'p-3':'p-4'}`}>
        <h3 className="text-xs uppercase tracking-widest text-cyan-200 mb-2">Schema Builder (Universal + Genre){compact && <span className="ml-2 text-[10px] text-slate-500">Compact</span>}</h3>
        <div className="flex flex-col gap-6">
          {/* Tag Filter Bar */}
          {allTags.length>0 && (
            <div className="flex flex-wrap gap-1 mb-2 items-center">
              <select value={tagMode} onChange={e=> setTagMode(e.target.value as any)} className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800/70 focus:outline-none focus:border-cyan-400">
                <option value="OR">OR</option>
                <option value="AND">AND</option>
                <option value="NOT">NOT</option>
              </select>
              {allTags.map(t=> {
                const on = tagFilters.has(t);
                return <button key={t} onClick={()=> toggleTag(t)} className={`px-2 py-0.5 rounded-full text-[10px] border transition ${on? 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20 shadow-[0_0_8px_rgba(217,70,239,0.5)]':'border-slate-600 text-slate-400 hover:border-cyan-400 hover:text-cyan-200'}`}>{t}</button>;
              })}
              {tagFilters.size>0 && <button onClick={()=> setTagFilters(new Set())} className="px-2 py-0.5 rounded-full text-[10px] border border-slate-500 text-slate-300 hover:border-cyan-400">Clear</button>}
            </div>
          )}
          {schema.order.map(gid=> {
            const g = groupsById[gid];
            if (!g) return null;
            const list = optionsByGroup[gid] || [];
            // selected-first sorting + primary hint
            const sorted = [...list].sort((a,b)=> {
              const aSel = sel[gid]?.has(a.id)?1:0; const bSel = sel[gid]?.has(b.id)?1:0;
              if (aSel!==bSel) return bSel - aSel;
              const aPrim = a.primary?1:0; const bPrim = b.primary?1:0;
              if (aPrim!==bPrim) return bPrim - aPrim;
              return (a.weight||0)-(b.weight||0);
            });
            const selSet = sel[gid];
            const selLabels = selSet && selSet.size>0 ? [...selSet].map(id=> optionIndex.get(id)?.label).filter(Boolean) as string[] : [];
            const isCollapsed = compact && collapsed[gid];
            return (
              <div key={gid} className={compact? 'space-y-1':'space-y-2'}>
                <div className={`flex items-center gap-2 ${compact? 'cursor-pointer select-none':''}`} onClick={()=> compact && toggleCollapse(gid)}>
                  {compact && <span className={`text-[9px] transition-transform ${isCollapsed? 'rotate-0':'rotate-90'}`}>▶</span>}
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-300">{g.label}</h4>
                  {!g.multi && <span className="text-[9px] text-slate-500">single</span>}
                  {g.universal && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">UNI</span>}
                  {compact && selLabels.length>0 && (
                    <span className="text-[9px] text-cyan-300 truncate max-w-[160px]">{selLabels.slice(0,3).join(', ')}{selLabels.length>3?'…':''}</span>
                  )}
                </div>
                {!isCollapsed && (() => {
                  // inline IIFE kept for localized scope; not empty.
                  const filteredByTag = tagFilters.size===0 ? sorted : sorted.filter(o=> {
                    if (!o.tags) return tagMode==='NOT'? true : false;
                    if (tagMode==='OR') {
                      for (const t of o.tags) if (tagFilters.has(t)) return true; return false;
                    }
                    if (tagMode==='AND') {
                      for (const ft of tagFilters) if (!o.tags.includes(ft)) return false; return true;
                    }
                    // NOT mode: exclude any item having selected tag
                    for (const t of o.tags) if (tagFilters.has(t)) return false; return true;
                  });
                  return (
                <div className={`flex flex-wrap gap-2 ${compact? 'mt-1':''}`}>
                  {filteredByTag.map(o=> {
                    const active = sel[gid]?.has(o.id) || false;
                    const subs = suboptIndex[o.id];
                    return (
                      <div key={o.id} className="relative">
                        <Chip active={!!active} label={o.label} onClick={()=> toggle(gid,o.id,g.multi)} />
                        {subs && active && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {subs.map(s=> <button key={s.id} onClick={()=> addSub(s.id)} className="text-[9px] px-1.5 py-0.5 rounded border border-slate-600 hover:border-cyan-400 text-slate-400 hover:text-cyan-200">{s.label}</button>)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                  );})()}
              </div>
            );
          })}
        </div>
      </div>
      <div className={`rounded-xl border border-white/10 bg-black/40 ${compact? 'p-3':'p-4'}`}>
        <h3 className="text-xs uppercase tracking-widest text-fuchsia-200 mb-2">Preview</h3>
        <div className={`min-h-[120px] text-sm leading-relaxed bg-black/30 rounded-lg ${compact? 'p-2':'p-3'} border border-slate-700`}>{prompt || <span className="text-slate-500">Build a prompt…</span>}</div>
        <div className="mt-2 flex gap-2">
          <button onClick={()=> navigator.clipboard.writeText(prompt)} className="px-3 py-1.5 rounded bg-cyan-600/30 border border-cyan-400/60 text-[11px] hover:bg-cyan-600/40">Copy</button>
          <button onClick={()=> { setSel(Object.fromEntries(schema.groups.map(g=> [g.id,new Set()])) as any); setParams(new Set()); }} className="px-3 py-1.5 rounded bg-slate-700/30 border border-slate-500 text-[11px] hover:border-cyan-400">Reset</button>
        </div>
      </div>
    </div>
  );
}
