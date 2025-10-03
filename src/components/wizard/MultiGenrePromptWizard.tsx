// CLEAN REWRITE (dual-mode wizard: classic + sequential)
import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import { LiveCodingConsole } from '../LiveCodingConsole';
import { universalPack } from '../../data/multigenre/universal';
import { GENRE_PACKS } from '../../data/multigenre/genres';
import { mergePacks, mergeMultiple } from '../../data/multigenre/merge';
import type { GenreId, MergedSchema } from '../../data/multigenre/schema';
import { getGenreTheme } from '../../theme/genreThemes';
// Removed advanced builders & progression utilities in simplified mode
import { INSTRUMENT_CATEGORIES } from '../../data/instrumentCategories';

// ------------- gradient utility helpers -------------
// Gradient helper removed (no dynamic multi-color usage)
// Middle/Last gradient helpers removed (single-gradient usage)
// Color token map removed (not needed in simplified UI)

// ------------- types -------------
// Simplified: keep legacy type aliases for minimal diff but only use a reduced subset
export type SeqStep='seq.genrePrimary'|'seq.genreSubs'|'seq.tempo'|'seq.drum.kick'|'seq.drum.hat'|'seq.drum.snare'|'seq.instruments'|'seq.final';
interface RoleConfig { tone?:string; brightness?:string; }
interface SequentialBuildState{ rootCategory?:string; mainGenre?:GenreId; styleVariant?:string; subGenres:GenreId[]; bpm?:number; meter?:string; swing?:number; durationSec?:number; drums:{kick?:string;hat?:string;snare?:string;extras:string[]}; instruments:string[]; instrumentVariants:Record<string,string[]>; roles: { bass:RoleConfig; chords:RoleConfig; lead:RoleConfig }; fxTags:string[]; mixTags:string[]; }
interface WizardState{ mode:'sequential'; step:SeqStep; schema?:MergedSchema; seq:SequentialBuildState; }

// placeholders for alias expansion (future)
const GENRE_ALIASES: Record<string,GenreId>={};
// BPM presets per genre (range used in tempo step)
const GENRE_BPM_PRESETS: Record<string,{default:number;low:number;high:number;range:[number,number]}>={
  techno:{default:130,low:124,high:134,range:[122,136]},
  techhouse:{default:125,low:122,high:128,range:[120,129]},
  house:{default:124,low:120,high:126,range:[118,128]},
  trance:{default:138,low:134,high:140,range:[132,142]},
  dnb:{default:174,low:170,high:176,range:[165,180]},
  dubstep:{default:140,low:138,high:142,range:[136,145]},
  hiphop:{default:92,low:80,high:100,range:[75,105]},
  boomBap:{default:90,low:84,high:94,range:[82,96]},
  trap:{default:142,low:134,high:148,range:[130,150]},
  lofiBeats:{default:82,low:70,high:88,range:[65,90]},
  ambient:{default:70,low:55,high:80,range:[50,85]},
  orchestral:{default:120,low:90,high:130,range:[70,140]},
  cinematic:{default:110,low:90,high:130,range:[80,140]},
  pop:{default:118,low:100,high:124,range:[96,126]},
  punk:{default:168,low:150,high:190,range:[140,200]},
  kpop:{default:122,low:118,high:126,range:[112,130]},
  synthwave:{default:90,low:84,high:94,range:[80,100]},
  futuregarage:{default:132,low:126,high:136,range:[120,140]},
  reggaeton:{default:96,low:90,high:100,range:[86,104]},
  afrobeat:{default:108,low:100,high:114,range:[96,118]},
  jazzfusion:{default:128,low:110,high:140,range:[100,150]},
};

// Root genre categories (high-level) mapping to available packs
const ROOT_GENRE_CATEGORIES:{id:string;label:string;genres:GenreId[]}[]=[
  {id:'edm',label:'EDM / Electronic',genres:['techno','techhouse','house','trance','dubstep','dnb','futuregarage'] as GenreId[]},
  {id:'urban',label:'Urban / HipHop',genres:['hiphop','boomBap','trap','lofiBeats','rnb','reggaeton','kpop'] as GenreId[]},
  {id:'global',label:'Global / World',genres:['afrobeat','reggaeton'] as GenreId[]},
  {id:'soul',label:'R&B / Soul',genres:['rnb'] as GenreId[]},
  {id:'country',label:'Country / Americana',genres:['country'] as GenreId[]},
  {id:'retro',label:'Retro / Synth',genres:['synthwave','citypop'] as GenreId[]},
  {id:'citypop',label:'City Pop / Fusion',genres:['citypop','pop','jazzfusion'] as GenreId[]},
  {id:'fusion',label:'Fusion / Jazz',genres:['jazzfusion'] as GenreId[]},
  {id:'funk',label:'Funk / Groove',genres:['funk','funkdisco','funkfusion','funkrock'] as GenreId[]},
  {id:'cinematic',label:'Cinematic / Score',genres:['cinematic','orchestral','ambient'] as GenreId[]},
  {id:'pop',label:'Pop / Mainstream',genres:['pop','kpop'] as GenreId[]},
  {id:'punk',label:'Punk / Alt',genres:['punk'] as GenreId[]}
];

// Style variants per core genre with BPM adjustment deltas (affects default only)
const GENRE_STYLE_VARIANTS:Record<string,{label:string;delta?:number;desc?:string}[]>={
  techno:[
    {label:'Hard Techno',delta:4,desc:'Harder, faster energy'},
    {label:'Peak Time',delta:2,desc:'Mainroom drive'},
    {label:'Minimal',delta:-4,desc:'Stripped, space focus'},
    {label:'Acid',delta:0,desc:'303 resonance style'},
    {label:'Industrial',delta:3,desc:'Distorted, raw texture'}
  ],
  house:[
    {label:'Deep House',delta:-4},{label:'Progressive House',delta:+2},{label:'Electro House',delta:+3},{label:'Funky House',delta:0}
  ],
  trance:[{label:'Uplifting',delta:+2},{label:'Progressive',delta:-2},{label:'Psy',delta:+4}],
  dubstep:[{label:'Riddim',delta:0},{label:'Melodic',delta:0},{label:'Brostep',delta:+2}],
  dnb:[{label:'Liquid',delta:-2},{label:'Neurofunk',delta:+2},{label:'Jungle',delta:0}],
  hiphop:[{label:'Boom Bap',delta:0},{label:'Modern Trap',delta:+50,desc:'Half-time feel (double-time base)'},{label:'Lo-Fi',delta:-10}],
  trap:[{label:'EDM Trap',delta:0},{label:'Dark Trap',delta:0}],
  pop:[{label:'Dance Pop',delta:+2},{label:'Electro Pop',delta:+4},{label:'Indie Pop',delta:-2}],
  cinematic:[{label:'Epic',delta:0},{label:'Hybrid',delta:0},{label:'Ambient Score',delta:-10}],
  punk:[
    {label:'Classic Punk',delta:0,desc:'Raw mid-tempo energy'},
    {label:'Hardcore Punk',delta:+20,desc:'Faster aggressive tempo'},
    {label:'Skate Punk',delta:+10,desc:'Driving upbeat feel'},
    {label:'Pop Punk',delta:+6,desc:'Melodic catchy edge'},
    {label:'Post-Punk',delta:-6,desc:'Moody rhythmic space'},
    {label:'Neo-Punk',delta:+4,desc:'Modern hybrid textures'},
    {label:'Garage Punk',delta:0,desc:'Lo-fi raw garage tone'}
  ],
  rnb:[
    {label:'Neo R&B',delta:0,desc:'Modern atmospheric textures'},
    {label:'Progressive R&B',delta:+2,desc:'Forward experimental edge'},
    {label:'Alt R&B',delta:-4,desc:'Moody spacious vibe'},
    {label:'Classic Soul',delta:0,desc:'Vintage soul influence'}
  ],
  country:[
    {label:'Modern Country Pop',delta:+2,desc:'Polished contemporary feel'},
    {label:'Classic Country',delta:0,desc:'Traditional instrumentation'},
    {label:'Americana',delta:-2,desc:'Roots organic tone'},
    {label:'Outlaw',delta:+4,desc:'Edgy driving energy'}
  ],
  kpop:[
    {label:'Anthemic',delta:+2,desc:'Big stadium energy'},
    {label:'Moody',delta:-4,desc:'Darker restrained vibe'},
    {label:'EDM Hybrid',delta:+4,desc:'Stronger dance drop feel'},
    {label:'R&B Hybrid',delta:-2,desc:'Softer smooth influence'}
  ],
  synthwave:[
    {label:'Dark Synth',delta:-4,desc:'Brooding low-end weight'},
    {label:'Outrun',delta:+2,desc:'Driving neon motion'},
    {label:'Dreamwave',delta:-6,desc:'Hazy nostalgic float'},
    {label:'Cyberwave',delta:+4,desc:'Sharper futuristic edge'}
  ],
  futuregarage:[
    {label:'Atmospheric',delta:-4,desc:'More space & reverb'},
    {label:'Club Hybrid',delta:+4,desc:'Push toward dance tempo'},
    {label:'Ambient Garage',delta:-6,desc:'Very spacious + airy'},
    {label:'Vocal Chops',delta:0,desc:'Emphasis on chopped vox'}
  ],
  reggaeton:[
    {label:'Pop Reggaeton',delta:+2,desc:'Mainstream sheen'},
    {label:'Afro-Latin Fusion',delta:0,desc:'Broader rhythmic blend'},
    {label:'Dark Reggaeton',delta:-2,desc:'Darker minimal texture'},
    {label:'EDM Crossover',delta:+4,desc:'Higher energy build'}
  ],
  afrobeat:[
    {label:'Afropop',delta:+2,desc:'Pop oriented polish'},
    {label:'Highlife Fusion',delta:0,desc:'Traditional guitar blend'},
    {label:'Chill Afro',delta:-4,desc:'Relaxed groove focus'},
    {label:'Afro House Hybrid',delta:+6,desc:'Dancefloor uplift'}
  ],
  jazzfusion:[
    {label:'Smooth Fusion',delta:-6,desc:'Laid back phrasing'},
    {label:'Prog Fusion',delta:+6,desc:'Complex rhythmic drive'},
    {label:'Latin Fusion',delta:+4,desc:'Latin rhythmic layer'},
    {label:'Electro Fusion',delta:+2,desc:'Synth textures added'}
  ],
  citypop:[
    {label:'80s Fusion',delta:0,desc:'Authentic retro palette'},
    {label:'Nu-Disco City Pop',delta:+4,desc:'Modern dance influence'},
    {label:'Vaporwave Fusion',delta:-6,desc:'Hazy nostalgic slowdown'},
    {label:'Smooth AOR',delta:-2,desc:'Soft rock polish'}
  ]
};

// --- Related sub-genre recommendations (used in seq.genreSubs) ---
// 기본 매핑: 주 장르 선택 시 자주 혼합되거나 인접 스타일 제안
const GENRE_RELATED: Record<GenreId, GenreId[]> = {
  techno:['techhouse','house','trance','dubstep'],
  techhouse:['techno','house','afrobeat','pop'],
  house:['techhouse','techno','pop','citypop'],
  trance:['techno','house','synthwave'],
  dubstep:['trap','futuregarage','dnb'],
  dnb:['futuregarage','dubstep','hiphop'],
  futuregarage:['ambient','dnb','dubstep'],
  hiphop:['boomBap','trap','lofiBeats','rnb'],
  boomBap:['hiphop','lofiBeats','jazzfusion'],
  trap:['hiphop','lofiBeats','rnb'],
  lofiBeats:['hiphop','boomBap','jazzfusion'],
  ambient:['cinematic','orchestral','futuregarage'],
  orchestral:['cinematic','ambient'],
  cinematic:['orchestral','ambient','synthwave'],
  pop:['kpop','rnb','citypop'],
  punk:['pop','techno'],
  kpop:['pop','hiphop','rnb'],
  afrobeat:['reggaeton','house','pop'],
  jazzfusion:['citypop','lofiBeats','rnb'],
  reggaeton:['afrobeat','pop','hiphop'],
  rnb:['hiphop','pop','jazzfusion'],
  country:['pop','citypop'],
  citypop:['jazzfusion','pop','synthwave'],
  synthwave:['citypop','trance','pop']
};

// Funk 계열 파생 반영
GENRE_RELATED.funk = ['funkdisco','funkfusion','funkrock','jazzfusion'];
GENRE_RELATED.funkdisco = ['funk','funkfusion','citypop','disco' as any];
GENRE_RELATED.funkfusion = ['funk','jazzfusion','funkdisco'];
GENRE_RELATED.funkrock = ['funk','punk','rock' as any];

// Instrument variant library (fine-grained tags per family)
// Instrument variant library removed in simplified flow

// Shared pools reused in both pro and beginner modes
const ROLE_TONE_POOL = ['warm','bright','dark','crisp','gritty','smooth','airy','punchy','rounded'];
const BEGINNER_VIBE_TAGS = ['warm','wide','punchy','airy','dark','vintage','modern','clean','gritty'];

// Pro vs Beginner: proMode=true exposes full granular steps, false collapses to a shorter path.
const SIMPLE_SEQ_STEPS:SeqStep[]=['seq.genrePrimary','seq.genreSubs','seq.tempo','seq.drum.kick','seq.drum.hat','seq.drum.snare','seq.instruments','seq.final'];

export default function MultiGenrePromptWizard(){
  const [state,setState]=useState<WizardState>({ mode:'sequential', step:'seq.genrePrimary', seq:{ subGenres:[], drums:{ extras:[] }, instruments:[], instrumentVariants:{}, roles:{ bass:{}, chords:{}, lead:{} }, fxTags:[], mixTags:[], durationSec:210 } });
  const [loading,setLoading]=useState(false);

  // genre selection handled inline in GenrePrimaryStep

  // URL hash genre restore (classic mode only)
  // classic mode removed

  function buildSchema(list:GenreId[]):MergedSchema{ if(list.length>1){ const packs=list.map(id=> GENRE_PACKS.find(p=>p.id===id)||GENRE_PACKS.find(p=>p.id===GENRE_ALIASES[id!])).filter(Boolean) as any[]; if(!packs.length) return {groups:[...universalPack.groups],options:[...universalPack.options],subopts:{...universalPack.subopts},order:universalPack.groups.map(g=>g.id)}; if(packs.length===1) return mergePacks(universalPack,packs[0]); return mergeMultiple(universalPack,packs);} const g0=list[0]; const direct=GENRE_PACKS.find(p=>p.id===g0); const aliasKey=!direct? GENRE_ALIASES[g0!]:undefined; const aliasPack=aliasKey? GENRE_PACKS.find(p=>p.id===aliasKey):undefined; if(direct||aliasPack) return mergePacks(universalPack,(direct||aliasPack)!); return {groups:[...universalPack.groups],options:[...universalPack.options],subopts:{...universalPack.subopts},order:universalPack.groups.map(g=>g.id)}; }

  function confirmBpm(v:{bpm:number;meter:string;swing?:number;durationSec?:number}){
  const list= [state.seq.mainGenre!, ...state.seq.subGenres];
    if(!list.length) return;
    setLoading(true);
    setTimeout(()=>{
      try{
        const schema=buildSchema(list as GenreId[]);
        const nextStep:SeqStep = 'seq.drum.kick';
        setState(s=>({...s,schema,seq:{...s.seq,bpm:v.bpm,meter:v.meter,swing:v.swing,durationSec:v.durationSec},step:nextStep}));
      } catch(err){ console.error('schema build failed',err);} finally { setLoading(false);} },40);
  }
  function backTo(step:SeqStep){ setState(s=>({...s,step})); }

  // theming / style tokens
  const primaryId= state.seq.mainGenre; const activeTheme=getGenreTheme(primaryId||'techno'); const accentBtn='text-xs px-3 py-1 rounded border transition shadow-inner/10 shadow-black/30';
  // Neutral palette: primary -> subtle light surface, ghost -> border only
  const accentPrimary='bg-slate-300 text-slate-900 font-semibold border-slate-300 hover:bg-slate-200 hover:brightness-110';
  const accentGhost='border-slate-600 hover:border-slate-400 hover:bg-white/5 text-slate-300';
  const seqSteps:SeqStep[] = SIMPLE_SEQ_STEPS;
  const progressIndex= seqSteps.indexOf(state.step as SeqStep);

  return (
  <div className={`w-full min-h-screen app-dark-root text-slate-200 px-6 py-8 ${activeTheme.glow}`}> 
      <header className="mb-8 flex items-center justify-between">
    <h1 className="text-lg font-semibold tracking-widest text-slate-300">{t('wizard.title')}</h1>
        {progressIndex>0 && <button onClick={()=> backTo(seqSteps[Math.max(0,progressIndex-1)])} className="px-2 py-1 text-xs rounded border border-slate-600 hover:border-slate-400">Prev</button>}
      </header>
      <div className="mb-6 flex flex-wrap gap-1 items-center text-[10px]">
        {seqSteps.map(st=>{
            const on=st===state.step;
            const completedIndex=seqSteps.indexOf(st) < progressIndex; // 이미 지나간 단계
            let tooltip='';
            if(completedIndex){
              if(st.startsWith('seq.drum')) tooltip=`DRUMS: ${[state.seq.drums.kick,state.seq.drums.hat,state.seq.drums.snare].filter(Boolean).join(', ')}`;
              else if(st==='seq.instruments' && state.seq.instruments.length) tooltip=`INSTR: ${state.seq.instruments.slice(0,4).join(', ')}${state.seq.instruments.length>4?'…':''}`;
            }
            return (
              <button
                key={st}
                onClick={()=> backTo(st)}
                title={tooltip||undefined}
                className={`relative px-2 py-1 rounded border transition ${on? 'border-slate-400 text-slate-200 bg-white/5':'border-slate-700 hover:border-slate-500 text-slate-400'} ${completedIndex&&!on?'opacity-90':''}`}
              >
                {st.replace('seq.','').replace(/\./g,'›')}
                {completedIndex && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-slate-400 shadow-[0_0_4px_rgba(148,163,184,0.7)]" />}
              </button>
            );
          })}
        </div>
  {/* Simplified Sequential Mode */}
  {state.step==='seq.genrePrimary' && <GenrePrimaryStep
    rootCategory={state.seq.rootCategory}
    setRootCategory={(root)=> setState(s=>({...s,seq:{...s.seq,rootCategory:root}}))}
    onSelect={(g)=>{
      // 기본 장르 선택 (sequential 모드 초기화)
      // selectGenre 는 beginner/pro 공통으로 mainGenre 설정 + seq.genreSubs 로 이동
      // PRO 모드 + 스타일 변형 존재 시에만 style 단계로 분기
      setState(s=>({...s,seq:{...s.seq,mainGenre:g,subGenres:[]},step:'seq.genreSubs'}));
    }}
  />}
      {state.step==='seq.genreSubs' && <GenreSubsStep state={state} onDone={(subs)=> setState(s=>({...s,seq:{...s.seq,subGenres:subs},step:'seq.tempo'}))} />}
  {state.step==='seq.tempo' && state.seq.mainGenre && (()=> {
        const base=GENRE_BPM_PRESETS[state.seq.mainGenre]||GENRE_BPM_PRESETS['techno'];
        let presets=base;
        if(state.seq.styleVariant){
          const variant= (GENRE_STYLE_VARIANTS[state.seq.mainGenre]||[]).find(v=> v.label===state.seq.styleVariant);
          if(variant && variant.delta){
            const d=variant.delta;
            presets={
              default: base.default + d,
              low: base.low + Math.round(d*0.5),
              high: base.high + Math.round(d*0.75),
              range: [ base.range[0] + Math.round(d*0.25), base.range[1] + Math.round(d*1.0) ] as [number,number]
            };
          }
        }
        return <BpmTimeStep genre={state.seq.mainGenre} presets={presets} onConfirm={(v)=> confirmBpm(v)} onBack={()=> backTo('seq.genreSubs')} accentBtn={accentBtn} accentGhost={accentGhost} accentPrimary={accentPrimary} />;
      })()}
  {state.step==='seq.drum.kick' && <DrumPickStep label="Kick" onPick={(val)=> setState(s=>({...s,seq:{...s.seq,drums:{...s.seq.drums,kick:val}},step:'seq.drum.hat'}))} onBack={()=> backTo('seq.tempo')} />}
  {state.step==='seq.drum.hat' && <DrumPickStep label="Hat" onPick={(val)=> setState(s=>({...s,seq:{...s.seq,drums:{...s.seq.drums,hat:val}},step:'seq.drum.snare'}))} onBack={()=> backTo('seq.drum.kick')} />}
  {state.step==='seq.drum.snare' && <DrumPickStep label="Snare" onPick={(val)=> setState(s=>({...s,seq:{...s.seq,drums:{...s.seq.drums,snare:val}},step:'seq.instruments'}))} onBack={()=> backTo('seq.drum.hat')} />}
  {state.step==='seq.instruments' && <InstrumentCategoryStep
    proMode={false}
      selected={state.seq.instruments}
      roles={state.seq.roles}
      mixTags={state.seq.mixTags}
      onChange={(sel)=> setState(s=>({...s,seq:{...s.seq,instruments:sel}}))}
      onUpdateRoles={(roles)=> setState(s=>({...s,seq:{...s.seq,roles}}))}
      onUpdateVibes={(vibes)=> setState(s=>({...s,seq:{...s.seq,mixTags:vibes}}))}
    onNext={()=> setState(s=>({...s,step:'seq.final'}))}
    onBack={()=> backTo('seq.drum.snare')} />}
  {state.step==='seq.final' && <FinalSeqSummary seq={state.seq} onRestart={()=> setState(s=>({...s,seq:{ subGenres:[], drums:{ extras:[] }, instruments:[], instrumentVariants:{}, roles:{bass:{},chords:{},lead:{}}, fxTags:[], mixTags:[], durationSec:210 }, step:'seq.genrePrimary'}))} />}
      {loading && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-sm">Building schema…</div>}
      <LiveCodingDock />
    </div>
  );
}

// ---------------- Sub Components ----------------
// Legacy GenreStep removed (using new categorized primary step)
function BpmTimeStep({ genre, presets, onConfirm, onBack, accentBtn, accentGhost, accentPrimary }:{ genre:GenreId; presets:{default:number;low:number;high:number;range:[number,number]}; onConfirm:(v:{bpm:number;meter:string;swing?:number;durationSec?:number})=>void; onBack:()=>void; accentBtn:string; accentGhost:string; accentPrimary:string }){ const [bpm,setBpm]=useState(presets.default); const [meter,setMeter]=useState('4/4'); const [swing,setSwing]=useState<number|undefined>(); const [minutes,setMinutes]=useState(3); const [seconds,setSeconds]=useState(30); const swings=[0,54,57]; const durationSec=minutes*60+seconds; function normSeconds(v:number){ if(isNaN(v)) return; let s=v; if(s<0) s=0; if(s>59) s=59; setSeconds(s);} return (<div className="max-w-xl mx-auto space-y-8"><div><h2 className="text-sm uppercase tracking-widest text-cyan-300 mb-2">{t('wizard.tempoMeter')}</h2><p className="text-xs text-slate-400 mb-4">{t('wizard.recommendedBpm',{genre:genre.toUpperCase(),low:presets.range[0],high:presets.range[1]})}</p><div className="flex flex-wrap gap-2 mb-3">{[presets.low,presets.default,presets.high].map(v=> <button key={v} onClick={()=> setBpm(v)} className={`px-3 py-1 rounded border text-xs ${bpm===v?'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 hover:border-cyan-400'}`}>{v} BPM</button>)}</div><div className="flex items-center gap-3 mb-4"><label className="text-xs text-slate-400 w-20">{t('labels.custom')}</label><input type="number" value={bpm} onChange={e=> setBpm(Number(e.target.value)||bpm)} className="bg-slate-800/60 border border-slate-600 rounded px-3 py-1 text-sm w-28 focus:outline-none focus:border-cyan-400" /></div><div className="flex items-center gap-3 mb-4"><label className="text-xs text-slate-400 w-20">{t('labels.meter')}</label><select value={meter} onChange={e=> setMeter(e.target.value)} className="bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400">{['4/4','3/4','6/8','5/4','7/8','9/8'].map(m=> <option key={m} value={m}>{m}</option>)}</select></div><div className="grid grid-cols-2 gap-6"><div><div className="text-xs text-slate-400 mb-1">{t('labels.swing')}</div><div className="flex gap-2 flex-wrap">{swings.map(s=> <button key={s} onClick={()=> setSwing(s===0?undefined:s)} className={`px-2 py-1 rounded border text-[11px] ${swing===s?'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 hover:border-cyan-400'}`}>{s===0?t('wizard.swingNone'):s+'%'}</button>)}</div></div><div><div className="text-xs text-slate-400 mb-1">Track Duration</div><div className="flex items-center gap-2"><input type="number" value={minutes} onChange={e=> setMinutes(Math.max(0,Number(e.target.value)||minutes))} className="w-16 bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400" /> <span className="text-slate-400 text-xs">min</span><input type="number" value={seconds} onChange={e=> normSeconds(Number(e.target.value))} className="w-16 bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400" /> <span className="text-slate-400 text-xs">sec</span></div><div className="text-[10px] text-slate-500 mt-1">Default 3:30 • Adjust as needed</div></div></div><div className="flex justify-between mt-8"><button onClick={onBack} className={`${accentBtn} ${accentGhost}`}>{t('buttons.back')}</button><button onClick={()=> onConfirm({bpm,meter,swing,durationSec})} className={`${accentBtn} ${accentPrimary}`}>{t('buttons.continue')}</button></div></div></div>); }
// (legacy GenrePrimaryStep removed in favor of rootCategory-aware version)
function GenrePrimaryStep({ rootCategory, setRootCategory, onSelect }:{ rootCategory?:string; setRootCategory:(id?:string)=>void; onSelect:(g:GenreId)=>void }){
  const activeCat = ROOT_GENRE_CATEGORIES.find(c=> c.id===rootCategory);
  let visiblePacks = activeCat? GENRE_PACKS.filter(p=> activeCat.genres.includes(p.id as GenreId)) : GENRE_PACKS;
  // All 뷰에서는 파생 Funk 장르(funkdisco,funkfusion,funkrock)는 숨기고 상위 'Funk' 만 노출
  if(!activeCat){
    const funkDerivatives=new Set(['funkdisco','funkfusion','funkrock']);
    visiblePacks = visiblePacks.filter(p=> !funkDerivatives.has(p.id));
  }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={()=> setRootCategory(undefined)} className={`px-3 py-1 rounded border text-[11px] ${!rootCategory?'border-cyan-400 text-cyan-200 bg-cyan-600/10':'border-slate-600 text-slate-400 hover:border-cyan-400'}`}>All</button>
        {ROOT_GENRE_CATEGORIES.map(c=> { const on=c.id===rootCategory; return <button key={c.id} onClick={()=> setRootCategory(on? undefined:c.id)} className={`px-3 py-1 rounded border text-[11px] ${on?'border-cyan-400 text-cyan-200 bg-cyan-600/10':'border-slate-600 text-slate-400 hover:border-cyan-400'}`}>{c.label}</button>; })}
      </div>
      <div>
        <h2 className="text-sm uppercase tracking-widest text-cyan-300 mb-3">Select Genre</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visiblePacks.map(p=> (
            <button key={p.id} onClick={()=> onSelect(p.id as GenreId)} className="group relative rounded-xl border border-slate-600 p-4 text-left hover:border-cyan-400 hover:shadow-cyan-500/10 transition">
              <div className="text-base font-medium tracking-wide group-hover:text-cyan-200 drop-shadow">{p.label}</div>
              <p className="mt-2 text-[11px] text-slate-400 line-clamp-3 min-h-[2.5rem]">{p.description||'Genre description...'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
// Style step removed in simplified flow
function GenreSubsStep({ state, onDone }:{ state:WizardState; onDone:(subs:GenreId[])=>void }){
  const allPacks=GENRE_PACKS.filter(p=> p.id!==state.seq.mainGenre);
  const related = state.seq.mainGenre ? (GENRE_RELATED[state.seq.mainGenre]||[]) : [];
  const [showAll,setShowAll]=useState(false);
  const visible = showAll? allPacks: allPacks.filter(p=> related.includes(p.id as GenreId));
  const [local,setLocal]=useState<GenreId[]>(state.seq.subGenres);
  // 사용자가 Show All 전환 시 이미 선택했던 것들 유지
  const noneRelated = !showAll && visible.length===0;
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-sm uppercase tracking-widest text-cyan-300">Add Sub Genres (Optional)</h2>
      {related.length>0 && (
        <div className="text-[10px] text-slate-500 flex items-center gap-3">
          <span>Recommended based on {state.seq.mainGenre}</span>
          <button onClick={()=> setShowAll(s=>!s)} className="px-2 py-[2px] rounded border border-slate-600 hover:border-cyan-400 text-[10px]">
            {showAll? 'Show Recommended':'Show All'}
          </button>
        </div>
      )}
      {noneRelated && <div className="text-[11px] text-slate-500">No curated related genres yet. Toggle "Show All" to pick any.</div>}
      <div className="flex flex-wrap gap-2">
        {visible.map(p=> { const on=local.includes(p.id); return (
          <button
            key={p.id}
            onClick={()=> setLocal(l=> on? l.filter(x=> x!==p.id):[...l,p.id])}
            className={`px-3 py-1 rounded border text-xs ${on?'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-400 hover:border-fuchsia-400'}`}
          >{p.label}</button>
        ); })}
        {visible.length===0 && showAll && <div className="text-[11px] text-slate-500">No genres available.</div>}
      </div>
      <div className="flex justify-end gap-2 text-xs">
        <button onClick={()=> onDone(local)} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">Continue</button>
      </div>
    </div>
  );
}
function DrumPickStep({ label, onPick, onBack }:{ label:string; onPick:(v:string)=>void; onBack:()=>void }){
  // Per-drum tailored descriptor pools (overlaps allowed intentionally)
  const POOLS: Record<string,string[]>={
    Kick:['punchy','deep','analog','distorted','tight','subby','round','transient sharp','warm','saturated','clicky','fat','air push'],
    Hat:['crisp','tight','analog','airy','shimmer','closed short','open splash','metallic light','soft ticky','bright','lofi','round'],
    Snare:['snappy','tight','analog','crisp','punchy','woody','body','rim','clap layer','round','bright crack','distorted','dry short','reverb tail']
  };
  const opts= POOLS[label]||['analog','tight','neutral'];
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-sm uppercase tracking-widest text-cyan-300">{t('wizard.select',{label})}</h2>
      <div className="flex flex-wrap gap-2">
        {opts.map(o=> <button key={o} onClick={()=> onPick(o)} className="px-3 py-1 rounded border text-xs border-slate-600 hover:border-cyan-400 text-slate-300">{o}</button>)}
      </div>
      <div className="flex justify-between text-xs">
        <button onClick={onBack} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">{t('buttons.back')}</button>
      </div>
    </div>
  );
}
// Drum extras removed
// (original DrumSummaryStep removed; override version defined later)
// Roles step removed
// (original FinalSeqSummary removed; override version defined later)
// BuildStep removed in simplified flow
function LiveCodingDock(){ const [open,setOpen]=useState(false); const [hover,setHover]=useState(false); useEffect(()=>{ function onReq(){ setOpen(true);} window.addEventListener('livecode.requestOpen',onReq as any); function onKey(e:KeyboardEvent){ if((e.metaKey||e.ctrlKey)&&(e.key==='l'||e.key==='L')){ e.preventDefault(); setOpen(o=>!o);} } window.addEventListener('keydown',onKey); return ()=>{ window.removeEventListener('livecode.requestOpen',onReq as any); window.removeEventListener('keydown',onKey); };},[]); return (<><div className={`fixed bottom-6 right-0 z-40 group ${open?'translate-x-0':'translate-x-[calc(100%-52px)]'} transition-transform duration-300`} onMouseEnter={()=> setHover(true)} onMouseLeave={()=> setHover(false)}><div className={`flex items-center gap-2 pl-4 pr-3 py-2 rounded-l-xl shadow-lg border border-r-0 backdrop-blur-md cursor-pointer select-none ${open?'bg-cyan-600/30 border-cyan-500/40':'bg-slate-800/60 border-slate-600/40 hover:bg-slate-700/70'}`} onClick={()=> setOpen(o=>!o)}><span className="text-[11px] tracking-wide text-slate-200">{open?'LIVE CODING':'LIVE'}</span><button onClick={(e)=>{ e.stopPropagation(); setOpen(false);}} className={`text-slate-400 hover:text-cyan-200 text-xs px-1 rounded transition-opacity ${open||hover?'opacity-100':'opacity-0'} focus:opacity-100`} aria-label="Close live coding console">×</button></div></div><div className={`fixed top-0 right-0 h-full w-full sm:w-[640px] z-30 shadow-lg transition-transform duration-300 ${open?'translate-x-0':'translate-x-full'}`}>{open && <LiveCodingConsole onClose={()=> setOpen(false)} />}</div></>); }

// (legacy duplicated component block removed during rewrite)

// --- Extended injected overrides (instrument step + prompt aggregation) ---
// DrumSummaryStep removed (drum details only appear in final summary now)

function InstrumentCategoryStep({ proMode, selected, onChange, onNext, onBack, roles, onUpdateRoles, mixTags, onUpdateVibes }:{ proMode:boolean; selected:string[]; onChange:(v:string[])=>void; onNext:()=>void; onBack:()=>void; roles:{bass:RoleConfig;chords:RoleConfig;lead:RoleConfig}; onUpdateRoles:(r:{bass:RoleConfig;chords:RoleConfig;lead:RoleConfig})=>void; mixTags:string[]; onUpdateVibes:(v:string[])=>void }){
  function toggleRoleTone(role:'bass'|'chords'|'lead', tone:string){ const cur=roles[role].tone; onUpdateRoles({...roles,[role]:{...roles[role],tone: cur===tone? undefined: tone}} as any); }
  function toggleVibe(tag:string){ onUpdateVibes(mixTags.includes(tag)? mixTags.filter(t=> t!==tag): [...mixTags,tag]); }
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-widest text-cyan-300">{t('wizard.instrumentFamilies')}</h2>
        {!proMode && <span className="text-[10px] text-slate-500">Beginner: add instruments & basic feel</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {INSTRUMENT_CATEGORIES.map(cat=> { const on=selected.includes(cat.id); return (
          <button
            key={cat.id}
            onClick={()=> onChange(on? selected.filter(x=> x!==cat.id):[...selected,cat.id])}
            className={`group relative rounded-xl border p-3 text-left transition text-[11px] ${on?'border-cyan-300/80 bg-cyan-500/10 text-cyan-100 ring-1 ring-cyan-400/40':'border-slate-600 hover:border-cyan-400 text-slate-300'}`}
          >
            <div className="text-xs font-medium mb-1 tracking-wide group-hover:text-cyan-200">{t(`inst.${cat.id}`)}</div>
            <div className="text-[10px] text-slate-500 group-hover:text-slate-400 leading-snug line-clamp-3 min-h-[2.6rem]">{t(`inst.${cat.id}.desc`)}</div>
            {on && <span className="absolute top-1 right-1 text-[9px] px-1 py-[1px] rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-100">✓</span>}
          </button>
        ); })}
      </div>
      {!proMode && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-cyan-300">Core Roles Tone</div>
            <div className="space-y-4">
              {(['bass','chords','lead'] as const).map(r=> (
                <div key={r} className="space-y-1">
                  <div className="text-[10px] text-slate-500">{r.toUpperCase()}</div>
                  <div className="flex flex-wrap gap-1">
                    {ROLE_TONE_POOL.map(tn=> { const on=roles[r].tone===tn; return <button key={tn} onClick={()=> toggleRoleTone(r,tn)} className={`px-2 py-1 rounded border text-[10px] ${on?'border-emerald-400 text-emerald-200 bg-emerald-600/20':'border-slate-600 text-slate-400 hover:border-emerald-400'}`}>{tn}</button>; })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-cyan-300">Overall Vibe</div>
            <div className="flex flex-wrap gap-2">
              {BEGINNER_VIBE_TAGS.map(tag=> { const on=mixTags.includes(tag); return <button key={tag} onClick={()=> toggleVibe(tag)} className={`px-2 py-1 rounded border text-[10px] ${on?'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-400 hover:border-fuchsia-400'}`}>{tag}</button>; })}
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between text-xs">
        <button onClick={onBack} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">{t('buttons.back')}</button>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-slate-500">{t('wizard.selectedCount',{n:selected.length})}</span>
          <button disabled={!selected.length} onClick={onNext} className={`px-3 py-1 rounded border  ${selected.length? 'border-cyan-400 text-cyan-200 bg-cyan-600/10 hover:brightness-110':'border-slate-700 text-slate-600 cursor-not-allowed'}`}>{t('buttons.continue')}</button>
        </div>
      </div>
    </div>
  );
}

// Instrument variant step removed

// Override final summary to include instruments
function FinalSeqSummary({ seq, onRestart }:{ seq:SequentialBuildState; onRestart:()=>void }){
  const lines=[
    `GENRE: ${seq.mainGenre}${seq.subGenres.length?' + '+seq.subGenres.join('/') : ''}`,
    seq.bpm? `TEMPO: ${seq.bpm} BPM ${seq.meter||'4/4'}`:'',
    `DRUMS: K:${seq.drums.kick||'-'} H:${seq.drums.hat||'-'} S:${seq.drums.snare||'-'}`,
    seq.instruments.length? `INSTRUMENTS: ${seq.instruments.join(', ')}`:'',
    seq.mixTags.length? 'VIBE: '+seq.mixTags.slice(0,6).join(', '):''
  ].filter(Boolean).join('\n');
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-sm uppercase tracking-widest text-cyan-300">Final Summary</h2>
      <pre className="text-[11px] bg-black/40 border border-slate-700 rounded p-3 whitespace-pre-wrap leading-relaxed">{lines}</pre>
      <div className="flex justify-between text-xs">
        <button onClick={onRestart} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">Restart</button>
        <button onClick={()=> navigator.clipboard.writeText(lines)} className="px-3 py-1 rounded border border-emerald-400 text-emerald-200 bg-emerald-600/10">Copy</button>
      </div>
    </div>
  );
}
