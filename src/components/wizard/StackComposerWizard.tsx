/**
 * StackComposerWizard
 * Layer-by-layer production flow: kick→hat→snare→bass→chords→lead→fx→groove→mix→master→review
 * - Reducer-driven state (see ./stack/reducer.ts) enables deterministic step order + future insertion
 * - draft layer pattern editing before commit; committed layers auto-play via liveEngine
 * - meta captures groove (swing), FX summary sliders, mix & mastering textual notes
 * - prompt builder (./stack/prompt.ts) condenses descriptors + rhythmic heuristics into final copy block
 * TODO (next): pattern grid editor, mute/solo, per-layer gain, snapshot diff, export JSON
 */
import React, { useReducer, useEffect, useRef } from 'react';
import { initialState, reducer } from './stack/reducer';
import { PatternEditor } from './stack/PatternEditor';
import { buildFinalPrompt } from './stack/prompt';
import type { LayerRole } from './stack/types';
import { LiveCodingConsole } from '../LiveCodingConsole';

interface StepProps { state:any; dispatch:React.Dispatch<any>; }

function RoleStep({ state, dispatch, role, title, descriptorHints=[] }: StepProps & { role:LayerRole; title:string; descriptorHints?:string[] }){
  const draft = state.draft?.role===role ? state.draft : undefined;
  const layer = draft || state.layers.find((l:any)=> l.role===role);
  const editing = !!draft;
  function begin(){ dispatch({ type:'startDraft', role }); }
  function update(patch:any){ dispatch({ type:'updateDraft', patch }); }
  function commit(){ dispatch({ type:'commitDraft' }); dispatch({ type:'next' }); }
  function discard(){ dispatch({ type:'discardDraft' }); }
  const descriptors = layer?.descriptors || [];
  function toggleDesc(d:string){
    const set = new Set(descriptors);
    if (set.has(d)) {
      set.delete(d);
    } else {
      set.add(d);
    }
    update({ descriptors:[...set] });
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xs uppercase tracking-widest text-cyan-300 mb-2">{title}</h2>
        {!editing && !layer && <button onClick={begin} className="px-3 py-1.5 text-[11px] rounded border border-cyan-500 bg-cyan-600/20 hover:bg-cyan-600/30">Add {title}</button>}
        {!editing && layer && (
          <div className="text-[11px] flex flex-col gap-2">
            <div><span className="text-slate-400">Descriptors:</span> {layer.descriptors.join(', ')||'(none)'}</div>
            {layer.pattern && <div><span className="text-slate-400">Pattern:</span> <code className="bg-black/40 px-1 py-0.5 rounded border border-slate-700">{layer.pattern}</code></div>}
            <div className="flex gap-2 mt-2">
              <button onClick={begin} className="px-3 py-1 text-[11px] rounded border border-slate-600 hover:border-cyan-400">Edit</button>
              <button onClick={()=> dispatch({ type:'next' })} className="px-3 py-1 text-[11px] rounded border border-emerald-500 bg-emerald-600/20 hover:bg-emerald-600/30">Continue</button>
            </div>
          </div>
        )}
        {editing && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-[11px]">
              {descriptorHints.map(h=> {
                const on = descriptors.includes(h);
                return <button key={h} onClick={()=> toggleDesc(h)} className={`px-2 py-1 rounded border ${on? 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-400 hover:border-fuchsia-400'}`}>{h}</button>;
              })}
            </div>
            <PatternEditor value={draft?.pattern||''} onChange={v=> update({ pattern:v })} />
            <div className="flex justify-between pt-1">
              <button onClick={discard} className="text-[11px] px-3 py-1 rounded border border-slate-600 hover:border-pink-400">Discard</button>
              <button onClick={commit} className="text-[11px] px-4 py-1 rounded border border-emerald-500 bg-emerald-600/20 hover:bg-emerald-600/30">Save & Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GrooveStep({ state, dispatch }:StepProps){
  function set(patch:any){ dispatch({ type:'setMeta', patch }); }
  const m = state.meta;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <h2 className="text-xs uppercase tracking-widest text-cyan-300">Groove</h2>
      <label className="flex items-center gap-2 text-[11px]">Swing %
        <input type="number" value={m.swing||0} onChange={e=> set({ swing:Number(e.target.value)||0 })} className="bg-black/40 border border-slate-600 rounded px-2 py-1 w-20" />
      </label>
      <label className="flex items-center gap-2 text-[11px]">Humanize ms
        <input type="number" value={m.humanizeMs||0} onChange={e=> set({ humanizeMs:Number(e.target.value)||0 })} className="bg-black/40 border border-slate-600 rounded px-2 py-1 w-20" />
      </label>
      <div className="flex justify-end">
        <button onClick={()=> dispatch({ type:'next' })} className="px-3 py-1.5 text-[11px] rounded border border-emerald-500 bg-emerald-600/20 hover:bg-emerald-600/30">Continue</button>
      </div>
    </div>
  );
}

function FXStep({ state, dispatch }:StepProps){
  function set(patch:any){ dispatch({ type:'setMeta', patch }); }
  const m = state.meta as any;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <h2 className="text-xs uppercase tracking-widest text-fuchsia-300">FX</h2>
      <div className="grid sm:grid-cols-3 gap-4 text-[11px]">
        <label className="flex flex-col gap-1">Reverb
          <input type="range" min={0} max={100} value={m.fxReverb||0} onChange={e=> set({ fxReverb:Number(e.target.value) })} />
        </label>
        <label className="flex flex-col gap-1">Delay
          <input type="range" min={0} max={100} value={m.fxDelay||0} onChange={e=> set({ fxDelay:Number(e.target.value) })} />
        </label>
        <label className="flex flex-col gap-1">Sidechain
          <input type="range" min={0} max={100} value={m.fxSidechain||0} onChange={e=> set({ fxSidechain:Number(e.target.value) })} />
        </label>
      </div>
      <textarea placeholder="FX summary (e.g. subtle long-tail shimmer, tight slapback on lead)..." value={m.fxSummary||''} onChange={e=> set({ fxSummary:e.target.value })} className="w-full h-28 bg-black/30 border border-slate-700 rounded p-2 text-[11px]" />
      <div className="flex justify-end">
        <button onClick={()=> dispatch({ type:'next' })} className="px-3 py-1.5 text-[11px] rounded border border-emerald-500 bg-emerald-600/20 hover:bg-emerald-600/30">Continue</button>
      </div>
    </div>
  );
}

function MixStep({ state, dispatch }:StepProps){
  function set(patch:any){ dispatch({ type:'setMeta', patch }); }
  const m = state.meta as any;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <h2 className="text-xs uppercase tracking-widest text-emerald-300">Mix</h2>
      <div className="grid sm:grid-cols-3 gap-4 text-[11px]">
        <label className="flex flex-col gap-1">Drum/Bass Balance
          <input type="range" min={0} max={100} value={m.mixLowBalance||50} onChange={e=> set({ mixLowBalance:Number(e.target.value) })} />
        </label>
        <label className="flex flex-col gap-1">Mid Clarity
          <input type="range" min={0} max={100} value={m.mixMidClarity||50} onChange={e=> set({ mixMidClarity:Number(e.target.value) })} />
        </label>
        <label className="flex flex-col gap-1">High Air
          <input type="range" min={0} max={100} value={m.mixHighAir||50} onChange={e=> set({ mixHighAir:Number(e.target.value) })} />
        </label>
      </div>
      <textarea placeholder="Mix notes (e.g. tight low-end, scooped low-mids, airy hats)..." value={m.mixNotes||''} onChange={e=> set({ mixNotes:e.target.value })} className="w-full h-28 bg-black/30 border border-slate-700 rounded p-2 text-[11px]" />
      <div className="flex justify-end">
        <button onClick={()=> dispatch({ type:'next' })} className="px-3 py-1.5 text-[11px] rounded border border-emerald-500 bg-emerald-600/20 hover:bg-emerald-600/30">Continue</button>
      </div>
    </div>
  );
}

function MasterStep({ state, dispatch }:StepProps){
  function set(patch:any){ dispatch({ type:'setMeta', patch }); }
  const m = state.meta as any;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <h2 className="text-xs uppercase tracking-widest text-cyan-300">Master</h2>
      <div className="grid sm:grid-cols-3 gap-4 text-[11px]">
        <label className="flex flex-col gap-1">Loudness
          <input type="range" min={-12} max={-5} value={m.masterLufs||-9} onChange={e=> set({ masterLufs:Number(e.target.value) })} />
        </label>
        <label className="flex flex-col gap-1">Width
          <input type="range" min={0} max={100} value={m.masterWidth||50} onChange={e=> set({ masterWidth:Number(e.target.value) })} />
        </label>
        <label className="flex flex-col gap-1">Tone Tilt
          <input type="range" min={-50} max={50} value={m.masterTilt||0} onChange={e=> set({ masterTilt:Number(e.target.value) })} />
        </label>
      </div>
      <textarea placeholder="Mastering notes (e.g. transparent glue, gentle high shelf, tight low control)..." value={m.masterNotes||''} onChange={e=> set({ masterNotes:e.target.value })} className="w-full h-28 bg-black/30 border border-slate-700 rounded p-2 text-[11px]" />
      <div className="flex justify-end">
        <button onClick={()=> dispatch({ type:'next' })} className="px-3 py-1.5 text-[11px] rounded border border-emerald-500 bg-emerald-600/20 hover:bg-emerald-600/30">Continue</button>
      </div>
    </div>
  );
}

function ReviewStep({ state }:StepProps){
  const prompt = buildFinalPrompt(state);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Review & Export</h2>
        <pre className="text-[11px] whitespace-pre-wrap leading-relaxed bg-black/40 p-3 rounded border border-slate-700 min-h-[220px]">{prompt}</pre>
        <button onClick={()=> navigator.clipboard.writeText(prompt)} className="mt-3 px-3 py-1.5 text-[11px] rounded border border-cyan-500 bg-cyan-600/20 hover:bg-cyan-600/30">Copy Prompt</button>
      </div>
    </div>
  );
}

export default function StackComposerWizard(){
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const current = state.steps[state.stepIndex];
  const prevIdsRef = useRef<string[]>([]);
  const [liveOpen, setLiveOpen] = React.useState(false);
  const [hover, setHover] = React.useState(false);

  // Playback aggregation: map committed layers -> engine tracks
  useEffect(()=>{
    // dynamic import to avoid bundling engine immediately
    let cancelled = false;
    (async() => {
      const mod = await import('../../live/engine');
      if (cancelled) return;
      const engine = mod.liveEngine;
      const idsNow = state.layers.map((l:any)=> l.id);
      const prevIds = prevIdsRef.current;
      // Stop removed
      for (const old of prevIds){ if(!idsNow.includes(old)) engine.stop(old); }
      // Start / update existing
      for (const layer of state.layers){
        if (!layer.pattern) continue;
        engine.play(layer.id, { pattern: layer.pattern, type: layer.role as any, gain: layer.role==='kick'?0.9: layer.role==='snare'?0.7: layer.role==='hat'?0.4:0.6 });
      }
      prevIdsRef.current = idsNow;
      // groove meta
      if (state.meta.swing != null) engine.setSwing(state.meta.swing);
    })();
    return ()=> { cancelled = true; };
  }, [state.layers, state.meta.swing]);
  function render(){
  if (current==='review') return <ReviewStep state={state} dispatch={dispatch}/>;
  if (current==='groove') return <GrooveStep state={state} dispatch={dispatch}/>;
  if (current==='fx') return <FXStep state={state} dispatch={dispatch}/>;
  if (current==='mix') return <MixStep state={state} dispatch={dispatch}/>;
  if (current==='master') return <MasterStep state={state} dispatch={dispatch}/>;
    if (['kick','hat','snare','bass','chords','lead'].includes(current)){
      const descriptorHints = current==='kick'? ['punchy','deep','distorted','analog']
        : current==='hat'? ['tight','sizzle','open','offbeat']
        : current==='snare'? ['snappy','crisp','body','clap']
        : current==='bass'? ['growl','sub','saw','plucky']
        : current==='chords'? ['lush','warm','detuned','airy']
        : ['bright','metallic','aggressive','soft'];
      return <RoleStep role={current as LayerRole} title={current.toUpperCase()} state={state} dispatch={dispatch} descriptorHints={descriptorHints} />;
    }
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-[12px] space-y-4">
        <div className="text-cyan-300 text-xs uppercase">{current} (placeholder)</div>
        <p className="text-slate-400">This step will be implemented later.</p>
        <button onClick={()=> dispatch({ type:'next' })} className="px-3 py-1.5 text-[11px] rounded border border-emerald-500 bg-emerald-600/20 hover:bg-emerald-600/30">Continue</button>
      </div>
    );
  }
  return (
    <div className="w-full min-h-screen px-6 py-8 text-slate-100 app-dark-root space-y-8 relative">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-emerald-300">STACK COMPOSER</h1>
        <div className="flex gap-2 text-[11px]">
          <span className="text-slate-500">Step {state.stepIndex+1}/{state.steps.length}</span>
          {state.stepIndex>0 && <button onClick={()=> dispatch({ type:'prev' })} className="px-2 py-1 rounded border border-slate-600 hover:border-cyan-400">Prev</button>}
          {state.stepIndex < state.steps.length-1 && <button onClick={()=> dispatch({ type:'next' })} className="px-2 py-1 rounded border border-slate-600 hover:border-emerald-400">Skip</button>}
        </div>
      </header>
      <div className="max-w-3xl mx-auto">
        {render()}
      </div>
      <div className="flex flex-wrap gap-1 pt-4">
        {state.steps.map((s,i)=> {
          const on = i===state.stepIndex;
            return <button key={s+i} onClick={()=> dispatch({ type:'goto', index:i })} className={`w-4 h-4 rounded-full border ${on? 'bg-cyan-400 border-cyan-300':'border-slate-600 hover:border-cyan-400'}`} title={s}/>;
        })}
      </div>
      {/* Live coding slide tab (shared style) */}
      <div
        className={`fixed bottom-6 right-0 z-40 group ${liveOpen? 'translate-x-0':'translate-x-[calc(100%-52px)]'} transition-transform duration-300`}
        onMouseEnter={()=> setHover(true)}
        onMouseLeave={()=> setHover(false)}
      >
        <div className={`flex items-center gap-2 pl-4 pr-3 py-2 rounded-l-xl shadow-lg border border-r-0 backdrop-blur-md cursor-pointer select-none
          ${liveOpen? 'bg-cyan-600/30 border-cyan-500/40':'bg-slate-800/60 border-slate-600/40 hover:bg-slate-700/70'}`}
          onClick={()=> setLiveOpen(o=> !o)}
        >
          <span className="text-[11px] tracking-wide text-slate-200">{liveOpen? 'LIVE CODING':'LIVE'}</span>
          <button
            onClick={(e)=> { e.stopPropagation(); setLiveOpen(false);} }
            className={`text-slate-400 hover:text-cyan-200 text-xs px-1 rounded transition-opacity ${liveOpen || hover? 'opacity-100':'opacity-0'} focus:opacity-100`}
            aria-label="Close live coding console"
          >×</button>
        </div>
      </div>
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[640px] z-30 shadow-lg transition-transform duration-300 ${liveOpen? 'translate-x-0':'translate-x-full'}`}>
        {liveOpen && <LiveCodingConsole onClose={()=> setLiveOpen(false)} />}
      </div>
    </div>
  );
}
