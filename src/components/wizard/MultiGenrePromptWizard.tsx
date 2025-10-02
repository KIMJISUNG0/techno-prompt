import React, { useState, useEffect, useMemo } from 'react';
import { LiveCodingConsole, dispatchLiveCodeSnippet } from '../LiveCodingConsole';
import { universalPack } from '../../data/multigenre/universal';
import { GENRE_PACKS } from '../../data/multigenre/genres';
import { mergePacks, mergeMultiple } from '../../data/multigenre/merge';
import type { GenreId, MergedSchema } from '../../data/multigenre/schema';
import SchemaPromptBuilder from '../SchemaPromptBuilder';
import { getGenreTheme } from '../../theme/genreThemes';
import MelodyRecorder from '../melody/MelodyRecorder';
import InstrumentPromptBuilder from '../InstrumentPromptBuilder';
import { recommendProgressions } from '../../data/progressions';

// --- gradient extraction helpers (best-effort: parse 'from-colorX via-colorY to-colorZ') ---
function extractFirstColor(gradient:string){
  const m = gradient.split(' ').find(t=> t.startsWith('from-')); return m? colorTokenToCss(m.replace('from-','')): '#22d3ee';
}
function extractMiddleColor(gradient:string){
  const m = gradient.split(' ').find(t=> t.startsWith('via-')); return m? colorTokenToCss(m.replace('via-','')): extractFirstColor(gradient);
}
function extractLastColor(gradient:string){
  const m = gradient.split(' ').find(t=> t.startsWith('to-')); return m? colorTokenToCss(m.replace('to-','')): '#d946ef';
}
// map a tailwind color token roughly to a CSS variable or hex (simplified palette subset)
const COLOR_MAP: Record<string,string> = {
  'cyan-400':'#22d3ee','teal-300':'#5eead4','fuchsia-400':'#e879f9','amber-400':'#fbbf24','lime-300':'#bef264','pink-400':'#f472b6','rose-300':'#fda4af','orange-300':'#fdba74','indigo-400':'#6366f1','violet-300':'#c4b5fd','sky-400':'#38bdf8','emerald-300':'#6ee7b7','purple-400':'#a855f7','yellow-200':'#fef08a','stone-300':'#d6d3d1','amber-300':'#fcd34d','yellow-400':'#facc15'
};
function colorTokenToCss(token:string){ return COLOR_MAP[token] || '#22d3ee'; }

type WizardStep = 'genre' | 'bpmTime' | 'build';

// Alias / fallback mapping: leaf subgenres that don't yet have a dedicated pack → base genre
// (Prevents undefined pack lookup causing stuck loading overlay.)
// NOTE: 기존에는 boomBap / trap / lofiBeats 가 hiphop fallback 이었으나
// 이제 해당 장르 팩이 존재하므로 alias 제거. 향후 미구현 서브장르만 여기에 추가.
const GENRE_ALIASES: Record<string, GenreId> = {
  // example: 'phonk': 'hiphop'
};

const GENRE_BPM_PRESETS: Record<string,{default:number;low:number;high:number;range:[number,number]}> = {
  // Typical genre tempo windows (researched average ranges)
  techno:{default:130,low:124,high:134,range:[122,136]},              // 124–134
  techhouse:{default:125,low:122,high:128,range:[120,129]},          // 122–128
  house:{default:124,low:120,high:126,range:[118,128]},              // 120–126
  trance:{default:138,low:134,high:140,range:[132,142]},             // 134–140
  dnb:{default:174,low:170,high:176,range:[165,180]},                // 170–176
  dubstep:{default:140,low:138,high:142,range:[136,145]},            // 138–142 (half-time feel)
  hiphop:{default:92,low:80,high:100,range:[75,105]},                // 80–100 (boom bap ~88–94)
  boomBap:{default:90,low:84,high:94,range:[82,96]},                 // classic boom bap 84–94
  trap:{default:142,low:134,high:148,range:[130,150]},               // often double-time notation (71 bpm *2)
  lofiBeats:{default:82,low:70,high:88,range:[65,90]},               // chillhop 70–90
  ambient:{default:70,low:55,high:80,range:[50,85]},                 // very flexible
  orchestral:{default:120,low:90,high:130,range:[70,140]},           // cinematic varies widely
  cinematic:{default:110,low:90,high:130,range:[80,140]},            // trailer build variety
  pop:{default:118,low:100,high:124,range:[96,126]},                 // mainstream pop 100–124
};

interface WizardState {
  step: WizardStep;
  genre?: GenreId;            // primary (first when multi)
  genres?: GenreId[];         // full selection list
  bpm?: number;
  meter?: string; // '4/4'
  swing?: number; // percent
  schema?: MergedSchema;
}

export default function MultiGenrePromptWizard() {
  const [state, setState] = useState<WizardState>({ step:'genre' });
  const [loading, setLoading] = useState(false);

  function selectGenre(g: GenreId){
    setState(s=> ({...s, genre:g, genres:[g], step:'bpmTime'}));
  }
  // hybrid path from portal
  useEffect(()=> {
    const arr: string[]|undefined = (window as any).__pickedGenres;
    if (arr && arr.length>=1 && state.step==='genre') {
      // Canonicalize any unknown subgenre IDs via alias mapping.
      const canonical = arr.map(id=> {
        const direct = GENRE_PACKS.find(p=> p.id===id);
        if (direct) return id as GenreId;
        const alias = GENRE_ALIASES[id];
        return (alias || id) as GenreId; // id passes through (may remain unknown but handled later)
      });
      const first = canonical[0] as GenreId;
      setState(s=> ({...s, genre:first, genres:canonical as GenreId[], step:'bpmTime'}));
    }
  },[]);

  // keep hash synced when genres array is defined
  useEffect(()=> {
    if (state.genres && state.genres.length) {
      try {
        const enc = state.genres.join('+');
        const existing = window.location.hash;
        const other = existing.split('&').filter(x=> !x.startsWith('#g=') && !x.startsWith('g=')).join('&');
        const newHash = `#g=${enc}` + (other? '&'+other.replace('#',''):'');
        if (existing !== newHash) window.location.replace(newHash);
  } catch {/* no-op */}
    }
  }, [state.genres]);
  function confirmBpm(values:{bpm:number; meter:string; swing?:number}) {
    if(!state.genre) return;
    setLoading(true);
    setTimeout(()=>{ // mock async
      try {
        let schema: MergedSchema;
        if (state.genres && state.genres.length>1) {
          const packs = state.genres
            .map(id=> GENRE_PACKS.find(p=> p.id===id) || GENRE_PACKS.find(p=> p.id===GENRE_ALIASES[id]))
            .filter(Boolean) as any[];
          // If after alias resolution we have no packs, fallback to universal only
          if (packs.length===0) {
            schema = { groups:[...universalPack.groups], options:[...universalPack.options], subopts:{...universalPack.subopts}, order: universalPack.groups.map(g=> g.id) };
          } else if (packs.length===1) {
            schema = mergePacks(universalPack, packs[0]);
          } else {
            schema = mergeMultiple(universalPack, packs);
          }
        } else {
          const genreId = state.genre as string; // already guarded above
          const direct = GENRE_PACKS.find(p=> p.id===genreId);
          const aliasKey = !direct ? GENRE_ALIASES[genreId] : undefined;
          const aliasPack = aliasKey ? GENRE_PACKS.find(p=> p.id===aliasKey) : undefined;
          if (direct || aliasPack) {
            schema = mergePacks(universalPack, (direct || aliasPack)!);
          } else {
            // Fallback: universal-only placeholder schema for unknown genre
            console.warn('[wizard] Unknown genre id', genreId, 'falling back to universal pack only.');
            schema = { groups:[...universalPack.groups], options:[...universalPack.options], subopts:{...universalPack.subopts}, order: universalPack.groups.map(g=> g.id) };
          }
        }
        setState(s=> ({...s, ...values, schema, step:'build'}));
      } catch (err) {
        console.error('[wizard] Failed to build schema', err);
        alert('Failed to build schema for this genre. Using base template.');
        const schema: MergedSchema = { groups:[...universalPack.groups], options:[...universalPack.options], subopts:{...universalPack.subopts}, order: universalPack.groups.map(g=> g.id) };
        setState(s=> ({...s, ...values, schema, step:'build'}));
      } finally {
        setLoading(false);
      }
    }, 60);
  }
  function backTo(step: WizardStep){ setState(s=> ({...s, step})); }

  const primaryId = state.genres && state.genres.length>0 ? state.genres[0] : state.genre;
  const secondId = state.genres && state.genres.length===2 ? state.genres[1] : undefined;
  const activeTheme = getGenreTheme(primaryId || state.genre);
  const secondTheme = secondId ? getGenreTheme(secondId) : null;
  // Hybrid gradient: blend first half from primary, second half from second
  const hybridGradient = secondTheme
    ? `from-[var(--g1-from)] via-[var(--g1-via)] to-[var(--g2-to)]`
    : activeTheme.gradient;
  const accentBtn = 'text-xs px-3 py-1 rounded border transition shadow-inner/10 shadow-black/30';
  const accentPrimary = `bg-gradient-to-r ${activeTheme.gradient} text-slate-900 font-semibold border-transparent hover:brightness-110`;
  const accentGhost = `border-slate-600 hover:border-current hover:bg-white/5 ${activeTheme.accent}`;
  return (
    <div
      className={`w-full min-h-screen bg-[#05070d] text-slate-100 px-6 py-8 ${activeTheme.glow}`}
      style={secondTheme ? {
        ['--g1-from' as any]: extractFirstColor(activeTheme.gradient),
        ['--g1-via' as any]: extractMiddleColor(activeTheme.gradient),
        ['--g2-to' as any]: extractLastColor(secondTheme.gradient)
      }: undefined}
    >
      <header className="mb-8 flex items-center justify-between">
        <h1 className={`text-lg font-semibold tracking-widest bg-clip-text text-transparent bg-gradient-to-r ${hybridGradient}`}>MULTI GENRE PROMPT WIZARD{secondTheme? ' • HYBRID':''}</h1>
        <div className="flex gap-2">
          {state.step!=='genre' && (
            <button onClick={()=> backTo('genre')} className={`${accentBtn} ${accentGhost}`}>Start Over</button>
          )}
          {state.step!=='genre' && (
            <button onClick={()=> (window as any).resetGenre?.()} className={`${accentBtn} ${accentGhost}`}>Genres</button>
          )}
        </div>
      </header>
      {state.step==='genre' && <GenreStep onSelect={selectGenre} />}
  {state.step==='bpmTime' && state.genre && <BpmTimeStep
    genre={state.genre}
    presets={GENRE_BPM_PRESETS[state.genre] || GENRE_BPM_PRESETS[GENRE_ALIASES[state.genre]] || GENRE_BPM_PRESETS['techno']}
    onConfirm={confirmBpm}
    onBack={()=> backTo('genre')}
    accentBtn={accentBtn}
    accentGhost={accentGhost}
    accentPrimary={accentPrimary}
  />}
      {state.step==='build' && state.schema && <BuildStep state={state} onBack={()=> backTo('bpmTime')} accentBtn={accentBtn} accentGhost={accentGhost} />}
      {/* Live coding side panel mount point */}
      <LiveCodingDock />
      {loading && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-sm">Building schema…</div>}
    </div>
  );
}

function GenreStep({ onSelect }:{ onSelect:(g:GenreId)=>void }) {
  const packs = GENRE_PACKS;
  const placeholders: {id:GenreId; label:string; description:string}[] = packs.map(p=> ({id:p.id,label:p.label,description:p.description||''}));
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-sm uppercase tracking-widest text-cyan-300 mb-4">Select a Genre</h2>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {placeholders.map(p=> (
          <button key={p.id} onClick={()=> onSelect(p.id)} className="group relative border border-slate-700 rounded-xl p-4 text-left bg-white/5 hover:border-cyan-400 hover:bg-slate-800/40 transition shadow-inner shadow-black/20">
            <div className="text-base font-medium tracking-wide group-hover:text-cyan-200">{p.label}</div>
            <p className="mt-2 text-[11px] text-slate-400 line-clamp-3 min-h-[2.5rem]">{p.description || 'Genre description...'}</p>
          </button>
        ))}
        {['house','trance','dnb','hiphop','ambient'].filter(id=> !placeholders.find(p=>p.id===id)).map(id=> (
          <div key={id} className="border border-dashed border-slate-700 rounded-xl p-4 text-left opacity-60">
            <div className="text-base font-medium tracking-wide">{id.toUpperCase()}</div>
            <p className="mt-2 text-[11px] text-slate-500">Coming soon…</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BpmTimeStep({ genre, presets, onConfirm, onBack, accentBtn, accentGhost, accentPrimary }:{ genre:GenreId; presets:{default:number;low:number;high:number;range:[number,number]}; onConfirm:(v:{bpm:number; meter:string; swing?:number})=>void; onBack:()=>void; accentBtn:string; accentGhost:string; accentPrimary:string }) {
  const [bpm,setBpm] = useState<number>(presets.default);
  const [meter,setMeter] = useState('4/4');
  const [swing,setSwing] = useState<number|undefined>(undefined);
  const swingChoices = [0,54,57];
  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h2 className="text-sm uppercase tracking-widest text-cyan-300 mb-2">Tempo / Meter</h2>
        <p className="text-xs text-slate-400 mb-4">{genre.toUpperCase()} recommended range {presets.range[0]}–{presets.range[1]} BPM</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {[presets.low,presets.default,presets.high].map(v=> (
            <button key={v} onClick={()=> setBpm(v)} className={`px-3 py-1 rounded border text-xs ${bpm===v?'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 hover:border-cyan-400'}`}>{v} BPM</button>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-slate-400 w-20">Custom</label>
          <input type="number" value={bpm} onChange={e=> setBpm(Number(e.target.value)||bpm)} className="bg-slate-800/60 border border-slate-600 rounded px-3 py-1 text-sm w-28 focus:outline-none focus:border-cyan-400" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-slate-400 w-20">Meter</label>
          <select value={meter} onChange={e=> setMeter(e.target.value)} className="bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400">
            {['4/4','3/4','6/8','5/4','7/8','9/8'].map(m=> <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-1">Swing % (optional)</div>
            <div className="flex gap-2 flex-wrap">
              {swingChoices.map(s=> (
                <button key={s} onClick={()=> setSwing(s===0?undefined:s)} className={`px-2 py-1 rounded border text-[11px] ${swing===s? 'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 hover:border-cyan-400'}`}>{s===0? 'None': s+'%'}</button>
              ))}
            </div>
        </div>
        <div className="flex justify-between mt-8">
          <button onClick={onBack} className={`${accentBtn} ${accentGhost}`}>Back</button>
          <button onClick={()=> onConfirm({bpm,meter,swing})} className={`${accentBtn} ${accentPrimary}`}>Continue</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep({ state, onBack, accentBtn, accentGhost }:{ state:WizardState; onBack:()=>void; accentBtn:string; accentGhost:string }) {
  const [melodySummary, setMelodySummary] = useState<any|null>(null);
  const [includeMelody, setIncludeMelody] = useState(true);
  const [mode, setMode] = useState<'schema'|'instrument'>('schema');
  const [pickedProg, setPickedProg] = useState<string|undefined>(undefined);
  const recProgs = useMemo(()=> state.genres? recommendProgressions(state.genres,5): state.genre? recommendProgressions([state.genre],5) : [], [state.genres,state.genre]);
  function buildMelodySuffix(){
    if (!includeMelody || !melodySummary) return '';
    const parts: string[] = [];
    if (melodySummary.medianNote) parts.push(`melody centered on ${melodySummary.medianNote}`);
    if (melodySummary.keyGuess) parts.push(`${melodySummary.keyGuess}`);
    if (melodySummary.stability!=null) parts.push(`stability ${(melodySummary.stability*100).toFixed(0)}%`);
    if (melodySummary.scaleCandidates?.length) parts.push(`scales ${melodySummary.scaleCandidates.map((s:any)=> s.scale.split(' ')[0]).slice(0,2).join('/')}`);
    return parts.join(' | ');
  }
  const suffix = buildMelodySuffix();
  // Compose genre description (supports hybrid)
  const genreDescriptions = (state.genres|| (state.genre? [state.genre]: []))
    .map(id=> {
      const pack = GENRE_PACKS.find(p=> p.id===id);
      return pack? `${pack.label}: ${pack.description || ''}`.trim(): null;
    })
    .filter(Boolean)
    .join(' | ');
  const progressionSuffix = useMemo(()=> {
    if (!pickedProg) return '';
    const found = recProgs.find(p=> p.id===pickedProg);
    return found? `Progression: ${found.roman}`: '';
  },[pickedProg, recProgs]);
  function insertKick(){ dispatchLiveCodeSnippet(`play("kick", { pattern: "x---x---x---x---" })`); }
  function insertHat(){ dispatchLiveCodeSnippet(`play("hat", { pattern: "-x-x-x-x-x-x-x-x", gain:0.35 })`); }
  function insertBass(){ dispatchLiveCodeSnippet(`play("bass", { pattern: "x---x---x---x---", notes:[36,36,43,31] })`); }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-cyan-300">Build • {state.genre?.toUpperCase()} • {state.bpm} BPM{state.meter && state.meter!=='4/4' ? ' ('+state.meter+')':''}{state.swing? ' • Swing '+state.swing+'%':''}</div>
        <button onClick={onBack} className={`${accentBtn} ${accentGhost} text-[11px]`}>Adjust Tempo</button>
      </div>
      <div className="flex gap-2 flex-wrap text-[10px]">
        <button onClick={insertKick} className="px-2 py-1 rounded border border-slate-600 hover:border-cyan-400 hover:text-cyan-200">→ Kick to Live</button>
        <button onClick={insertHat} className="px-2 py-1 rounded border border-slate-600 hover:border-cyan-400 hover:text-cyan-200">→ Hat to Live</button>
        <button onClick={insertBass} className="px-2 py-1 rounded border border-slate-600 hover:border-cyan-400 hover:text-cyan-200">→ Bass to Live</button>
      </div>
      <div className="flex gap-3 text-[11px]">
        <button onClick={()=> setMode('schema')} className={`px-3 py-1 rounded border ${mode==='schema'? 'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 text-slate-400 hover:border-cyan-400'}`}>Schema Mode</button>
        <button onClick={()=> setMode('instrument')} className={`px-3 py-1 rounded border ${mode==='instrument'? 'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 text-slate-400 hover:border-cyan-400'}`}>Instrument Mode</button>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input type="checkbox" checked={includeMelody} onChange={e=> setIncludeMelody(e.target.checked)} />
          <span>Include Melody Summary</span>
        </label>
        {suffix && <span className="text-slate-500 truncate max-w-[420px]">Preview: {suffix}</span>}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {mode==='schema' && state.schema && (
            <SchemaPromptBuilder
              schema={state.schema}
              bpm={state.bpm}
              meter={state.meter}
              swing={state.swing}
              extraSuffix={[genreDescriptions, progressionSuffix, suffix].filter(Boolean).join(', ')}
            />
          )}
          {mode==='instrument' && (
            <InstrumentPromptBuilder />
          )}
        </div>
        <div className="lg:col-span-1 space-y-6">
          <MelodyRecorder onResult={(r)=> setMelodySummary(r)} />
          {/* Progression Recommendations */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <h4 className="text-[11px] uppercase tracking-wider text-slate-300">Genre Progressions</h4>
            {recProgs.length===0 && <div className="text-[11px] text-slate-500">No patterns</div>}
            <div className="flex flex-wrap gap-2">
              {recProgs.map((p:any)=> {
                const on = p.id===pickedProg;
                return <button key={p.id} onClick={()=> setPickedProg(on? undefined : p.id)} className={`px-2 py-1 rounded border text-[10px] transition ${on? 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-400 hover:border-fuchsia-400 hover:text-fuchsia-200'}`}>{p.roman}</button>;
              })}
            </div>
            {pickedProg && <div className="text-[10px] text-slate-500">Selected: {recProgs.find((p:any)=> p.id===pickedProg)?.label}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dock container that anchors console as a slide-over panel
function LiveCodingDock(){
  const [open,setOpen] = useState(false);
  return (
    <>
      <button onClick={()=> setOpen(o=> !o)} className="fixed bottom-4 right-4 z-40 px-3 py-2 rounded bg-cyan-600/30 backdrop-blur border border-cyan-400/50 text-[11px] hover:bg-cyan-600/40">
        {open? 'Close Live Coding':'Live Coding'}
      </button>
      {open && (
        <div className="fixed top-0 right-0 h-full w-full sm:w-[640px] z-30 shadow-lg">
          <LiveCodingConsole onClose={()=> setOpen(false)} />
        </div>
      )}
    </>
  );
}
