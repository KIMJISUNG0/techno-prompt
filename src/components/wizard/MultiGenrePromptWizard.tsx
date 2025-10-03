// CLEAN REWRITE (dual-mode wizard: classic + sequential)
import React, { useState, useEffect, useMemo } from 'react';
import { t, isKorean } from '../../i18n';
import { LiveCodingConsole } from '../LiveCodingConsole';
import { universalPack } from '../../data/multigenre/universal';
import { GENRE_PACKS } from '../../data/multigenre/genres';
import { mergePacks, mergeMultiple } from '../../data/multigenre/merge';
import type { GenreId, MergedSchema } from '../../data/multigenre/schema';
import SchemaPromptBuilder from '../SchemaPromptBuilder';
import { getGenreTheme } from '../../theme/genreThemes';
import MelodyRecorder from '../melody/MelodyRecorder';
import InstrumentPromptBuilder from '../InstrumentPromptBuilder';
import { recommendProgressions } from '../../data/progressions';
import { INSTRUMENT_CATEGORIES } from '../../data/instrumentCategories';

// ------------- gradient utility helpers -------------
function extractFirstColor(g:string){ const m=g.split(' ').find(t=>t.startsWith('from-')); return m? colorTokenToCss(m.replace('from-','')):'#22d3ee'; }
function extractMiddleColor(g:string){ const m=g.split(' ').find(t=>t.startsWith('via-')); return m? colorTokenToCss(m.replace('via-','')):extractFirstColor(g); }
function extractLastColor(g:string){ const m=g.split(' ').find(t=>t.startsWith('to-')); return m? colorTokenToCss(m.replace('to-','')):'#d946ef'; }
const COLOR_MAP: Record<string,string>={ 'cyan-400':'#22d3ee','teal-300':'#5eead4','fuchsia-400':'#e879f9','amber-400':'#fbbf24','lime-300':'#bef264','pink-400':'#f472b6','rose-300':'#fda4af','orange-300':'#fdba74','indigo-400':'#6366f1','violet-300':'#c4b5fd','sky-400':'#38bdf8','emerald-300':'#6ee7b7','purple-400':'#a855f7','yellow-200':'#fef08a','stone-300':'#d6d3d1','amber-300':'#fcd34d','yellow-400':'#facc15'};
function colorTokenToCss(t:string){ return COLOR_MAP[t]||'#22d3ee'; }

// ------------- types -------------
export type ClassicWizardStep='genre'|'bpmTime'|'build';
export type SeqStep='seq.genrePrimary'|'seq.genreStyle'|'seq.genreSubs'|'seq.tempo'|'seq.drum.kick'|'seq.drum.hat'|'seq.drum.snare'|'seq.drum.extras'|'seq.instruments'|'seq.instrumentVariants'|'seq.roles'|'seq.fx'|'seq.mix'|'seq.final';
interface RoleConfig { tone?:string; brightness?:string; }
interface SequentialBuildState{ rootCategory?:string; mainGenre?:GenreId; styleVariant?:string; subGenres:GenreId[]; bpm?:number; meter?:string; swing?:number; durationSec?:number; drums:{kick?:string;hat?:string;snare?:string;extras:string[]}; instruments:string[]; instrumentVariants:Record<string,string[]>; roles: { bass:RoleConfig; chords:RoleConfig; lead:RoleConfig }; fxTags:string[]; mixTags:string[]; }
interface WizardState{ mode:'classic'|'sequential'; step:ClassicWizardStep|SeqStep; genre?:GenreId; genres?:GenreId[]; bpm?:number; meter?:string; swing?:number; schema?:MergedSchema; seq:SequentialBuildState; proMode:boolean; }

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

// Instrument variant library (fine-grained tags per family)
const INSTRUMENT_VARIANTS:Record<string,string[]>= {
  piano:['felt','upright','grand bright','lofi processed','electric keys'],
  synth:['supersaw','mono acid','fm metallic','wavetable morph','analog warm','digital glass'],
  pad:['analog warm','granular cloud','shimmer','string pad','dark drone','wide airy'],
  pluck:['fm pluck','resonant','muted','bell like','digital short'],
  bass:['sub pure','808 long','808 punch','reese detuned','acid','fm growl'],
  guitar:['clean chorus','ambient shimmer','distorted lead','muted funk','reverse swell'],
  strings:['legato lush','staccato','spiccato','pizzicato','low ensemble'],
  brass:['swell','stab tight','sforzando','low brass'],
  woodwind:['airy flute','staccato flute','clarinet warm'],
  vocal:['choir ooh','choir ahh','vocal chop','processed texture','breathy lead'],
  fx:['impact','riser','downlifter','reverse sweep','noise sweep','transition'],
  arp:['gated','triplet pattern','ascending','complex pattern'],
  percpitch:['kalimba clean','music box','steel tone','vibraphone soft'],
  organ:['tonewheel','rock drive','pipe bright','pad organ'],
  world:['sitar pluck','pan flute','shakuhachi breath','ethnic drone'],
  chip:['pulse lead','arp tri','noise perc']
};

// Pro vs Beginner: proMode=true exposes full granular steps, false collapses to a shorter path.
const PRO_SEQ_STEPS:SeqStep[]=['seq.genrePrimary','seq.genreStyle','seq.genreSubs','seq.tempo','seq.drum.kick','seq.drum.hat','seq.drum.snare','seq.drum.extras','seq.instruments','seq.instrumentVariants','seq.roles','seq.fx','seq.mix','seq.final'];
const BEGINNER_SEQ_STEPS:SeqStep[]=['seq.genrePrimary','seq.genreSubs','seq.tempo','seq.instruments','seq.final'];

export default function MultiGenrePromptWizard(){
  const [state,setState]=useState<WizardState>({ mode:'sequential', step:'seq.genrePrimary', proMode:false, seq:{ subGenres:[], drums:{ extras:[] }, instruments:[], instrumentVariants:{}, roles:{ bass:{}, chords:{}, lead:{} }, fxTags:[], mixTags:[], durationSec:210 } });
  const [loading,setLoading]=useState(false);

  function selectGenre(g:GenreId){
    if(state.mode==='classic') setState(s=>({...s,genre:g,genres:[g],step:'bpmTime'}));
    else setState(s=>({...s,seq:{...s.seq,mainGenre:g,subGenres:[]},step:'seq.genreSubs'}));
  }

  // URL hash genre restore (classic mode only)
  useEffect(()=>{ if(state.mode!=='classic'||state.step!=='genre') return; const arr:string[]|undefined=(window as any).__pickedGenres; if(!arr||!arr.length) return; const canonical=arr.map(id=>{const d=GENRE_PACKS.find(p=>p.id===id); if(d) return id as GenreId; const alias=GENRE_ALIASES[id]; return (alias||id) as GenreId;}); setState(s=>({...s,genre:canonical[0],genres:canonical as GenreId[],step:'bpmTime'})); },[state.mode,state.step]);
  useEffect(()=>{ if(state.mode==='classic'&&state.genres?.length){ try{ const enc=state.genres.join('+'); const existing=window.location.hash; const other=existing.split('&').filter(x=>!x.startsWith('#g=')&&!x.startsWith('g=')).join('&'); const newHash=`#g=${enc}`+(other?'&'+other.replace('#',''):''); if(existing!==newHash) window.location.replace(newHash);}catch{/*ignore*/} } },[state.mode,state.genres]);

  function buildSchema(list:GenreId[]):MergedSchema{ if(list.length>1){ const packs=list.map(id=> GENRE_PACKS.find(p=>p.id===id)||GENRE_PACKS.find(p=>p.id===GENRE_ALIASES[id!])).filter(Boolean) as any[]; if(!packs.length) return {groups:[...universalPack.groups],options:[...universalPack.options],subopts:{...universalPack.subopts},order:universalPack.groups.map(g=>g.id)}; if(packs.length===1) return mergePacks(universalPack,packs[0]); return mergeMultiple(universalPack,packs);} const g0=list[0]; const direct=GENRE_PACKS.find(p=>p.id===g0); const aliasKey=!direct? GENRE_ALIASES[g0!]:undefined; const aliasPack=aliasKey? GENRE_PACKS.find(p=>p.id===aliasKey):undefined; if(direct||aliasPack) return mergePacks(universalPack,(direct||aliasPack)!); return {groups:[...universalPack.groups],options:[...universalPack.options],subopts:{...universalPack.subopts},order:universalPack.groups.map(g=>g.id)}; }

  function confirmBpm(v:{bpm:number;meter:string;swing?:number;durationSec?:number}){
    const list= state.mode==='classic'? (state.genres||(state.genre?[state.genre]:[])) : [state.seq.mainGenre!, ...state.seq.subGenres];
    if(!list.length) return;
    setLoading(true);
    setTimeout(()=>{
      try{
        const schema=buildSchema(list as GenreId[]);
        if(state.mode==='classic') {
          setState(s=>({...s,...v,schema,step:'build'}));
        } else {
          const nextStep:SeqStep = state.proMode ? 'seq.drum.kick' : 'seq.instruments';
          setState(s=>({...s,schema,seq:{...s.seq,bpm:v.bpm,meter:v.meter,swing:v.swing,durationSec:v.durationSec},step:nextStep}));
        }
      } catch(err){ console.error('schema build failed',err);} finally { setLoading(false);} },40);
  }
  function backTo(step:ClassicWizardStep|SeqStep){ setState(s=>({...s,step})); }

  // theming / style tokens
  const primaryId= state.mode==='classic'? (state.genres?.[0]||state.genre): state.seq.mainGenre; const secondId= state.mode==='classic'? (state.genres&&state.genres.length===2? state.genres[1]:undefined): undefined; const activeTheme=getGenreTheme(primaryId||'techno'); const secondTheme=secondId? getGenreTheme(secondId):null; const accentBtn='text-xs px-3 py-1 rounded border transition shadow-inner/10 shadow-black/30';
  // Neutral palette: primary -> subtle light surface, ghost -> border only
  const accentPrimary='bg-slate-300 text-slate-900 font-semibold border-slate-300 hover:bg-slate-200 hover:brightness-110';
  const accentGhost='border-slate-600 hover:border-slate-400 hover:bg-white/5 text-slate-300';
  const seqSteps:SeqStep[] = state.proMode? PRO_SEQ_STEPS: BEGINNER_SEQ_STEPS;
  const isSeq= state.mode==='sequential';
  // If switching mode trimmed current step, realign.
  if(isSeq && !state.proMode && !BEGINNER_SEQ_STEPS.includes(state.step as SeqStep)){
    // Fallback precedence by data completeness
    let fallback:SeqStep='seq.genrePrimary';
    if(state.seq.mainGenre) fallback='seq.genreSubs';
    if(state.seq.bpm) fallback='seq.tempo';
    if(state.seq.instruments.length) fallback='seq.instruments';
    if(state.step==='seq.final') fallback='seq.final';
    if(state.step!==fallback) {
      useEffect(()=> { setState(s=> ({...s, step:fallback})); },[]);
    }
  }
  const progressIndex= isSeq? seqSteps.indexOf(state.step as SeqStep):-1;

  return (
    <div className={`w-full min-h-screen app-dark-root text-slate-200 px-6 py-8 ${activeTheme.glow}`} style={secondTheme? {['--g1-from' as any]:extractFirstColor(activeTheme.gradient),['--g1-via' as any]:extractMiddleColor(activeTheme.gradient),['--g2-to' as any]:extractLastColor(secondTheme.gradient)}:undefined}>
      <header className="mb-8 flex items-center justify-between">
  <h1 className={`text-lg font-semibold tracking-widest text-slate-300`}>{t('wizard.title')}{secondTheme? (isKorean()? ' • '+t('wizard.hybrid'):' • HYBRID'):''}</h1>
        <div className="flex gap-2 items-center">
          <button onClick={()=> setState(s=> s.mode==='classic'? {...s,mode:'sequential',step:'seq.genrePrimary'}:{...s,mode:'classic',step:'genre'})} className="px-3 py-1.5 text-xs rounded border border-slate-600 hover:border-slate-400">{state.mode==='classic'? t('mode.sequential'): t('mode.classic')}</button>
          {isSeq && (
            <button
              onClick={()=> setState(s=> {
                const next=!s.proMode;
                // On disabling proMode ensure step is valid
                if(!next){ // turning pro -> beginner
                  const allowed=new Set(BEGINNER_SEQ_STEPS);
                  let step=s.step as SeqStep;
                  if(!allowed.has(step)){
                    if(s.seq.instruments.length) step='seq.instruments';
                    else if(s.seq.bpm) step='seq.tempo';
                    else if(s.seq.mainGenre) step='seq.genreSubs';
                    else step='seq.genrePrimary';
                  }
                  return {...s, proMode:next, step};
                }
                return {...s, proMode:next};
              })}
              className="px-3 py-1.5 text-xs rounded border border-slate-600 hover:border-cyan-400"
              title={state.proMode? 'Beginner view (fewer steps)':'Advanced view (all granular steps)'}
            >{state.proMode? 'Beginner':'Advanced'}</button>
          )}
          {state.mode==='classic' && state.step!=='genre' && <button onClick={()=> backTo('genre')} className={`${accentBtn} ${accentGhost}`}>Start Over</button>}
          {isSeq && progressIndex>0 && <button onClick={()=> backTo(seqSteps[Math.max(0,progressIndex-1)])} className="px-2 py-1 text-xs rounded border border-slate-600 hover:border-slate-400">Prev</button>}
        </div>
      </header>
      {isSeq && (
        <div className="mb-6 flex flex-wrap gap-1 items-center text-[10px]">
          <span className="mr-2 px-2 py-[2px] rounded border border-slate-600 text-slate-400 tracking-wide">{state.proMode? 'PRO':'BEGINNER'}</span>
          {seqSteps.map(st=>{
            const on=st===state.step;
            const completedIndex=seqSteps.indexOf(st) < progressIndex; // 이미 지나간 단계
            let tooltip='';
            if(completedIndex){
              if(st==='seq.drum.extras') tooltip=`DRUMS: ${[state.seq.drums.kick,state.seq.drums.hat,state.seq.drums.snare].filter(Boolean).join(', ')}`;
              else if(st==='seq.instruments' && state.seq.instruments.length) tooltip=`INSTR: ${state.seq.instruments.slice(0,4).join(', ')}${state.seq.instruments.length>4?'…':''}`;
              else if(st==='seq.roles') {
                const parts:string[]=[];
                if(state.seq.roles.bass.tone) parts.push('B:'+state.seq.roles.bass.tone);
                if(state.seq.roles.chords.tone) parts.push('C:'+state.seq.roles.chords.tone);
                if(state.seq.roles.lead.tone) parts.push('L:'+state.seq.roles.lead.tone);
                if(parts.length) tooltip=parts.join(' ');
              }
              else if(st==='seq.fx' && state.seq.fxTags.length) tooltip=`FX: ${state.seq.fxTags.slice(0,3).join(', ')}${state.seq.fxTags.length>3?'…':''}`;
              else if(st==='seq.mix' && state.seq.mixTags.length) tooltip=`MIX: ${state.seq.mixTags.slice(0,3).join(', ')}${state.seq.mixTags.length>3?'…':''}`;
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
      )}
      {/* Classic Mode */}
      {state.mode==='classic' && state.step==='genre' && <GenreStep onSelect={selectGenre} />}
      {state.mode==='classic' && state.step==='bpmTime' && state.genre && (
        <BpmTimeStep genre={state.genre} presets={GENRE_BPM_PRESETS[state.genre]||GENRE_BPM_PRESETS[GENRE_ALIASES[state.genre]]||GENRE_BPM_PRESETS['techno']} onConfirm={confirmBpm} onBack={()=> backTo('genre')} accentBtn={accentBtn} accentGhost={accentGhost} accentPrimary={accentPrimary} />)}
      {state.mode==='classic' && state.step==='build' && state.schema && <BuildStep state={state} onBack={()=> backTo('bpmTime')} accentBtn={accentBtn} accentGhost={accentGhost} />}
      {/* Sequential Mode */}
  {isSeq && state.step==='seq.genrePrimary' && <GenrePrimaryStep rootCategory={state.seq.rootCategory} setRootCategory={(root)=> setState(s=>({...s,seq:{...s.seq,rootCategory:root}}))} onSelect={(g)=>{ selectGenre(g); const variants=GENRE_STYLE_VARIANTS[g]; if(variants&&variants.length) setState(s=>({...s,seq:{...s.seq,mainGenre:g},step:'seq.genreStyle'})); else setState(s=>({...s,seq:{...s.seq,mainGenre:g},step:'seq.genreSubs'})); }} />}
  {isSeq && state.step==='seq.genreStyle' && state.seq.mainGenre && <GenreStyleStep genre={state.seq.mainGenre} variants={GENRE_STYLE_VARIANTS[state.seq.mainGenre]||[]} onPick={(variant)=> setState(s=>({...s,seq:{...s.seq,styleVariant:variant},step:'seq.genreSubs'}))} onSkip={()=> setState(s=>({...s,seq:{...s.seq,styleVariant:undefined},step:'seq.genreSubs'}))} />}
      {isSeq && state.step==='seq.genreSubs' && <GenreSubsStep state={state} onDone={(subs)=> setState(s=>({...s,seq:{...s.seq,subGenres:subs},step:'seq.tempo'}))} />}
      {isSeq && state.step==='seq.tempo' && state.seq.mainGenre && (()=> {
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
        return <BpmTimeStep genre={state.seq.mainGenre} presets={presets} onConfirm={confirmBpm} onBack={()=> backTo('seq.genreSubs')} accentBtn={accentBtn} accentGhost={accentGhost} accentPrimary={accentPrimary} />;
      })()}
      {isSeq && state.step==='seq.drum.kick' && <DrumPickStep label="Kick" onPick={(val)=> setState(s=>({...s,seq:{...s.seq,drums:{...s.seq.drums,kick:val}},step:'seq.drum.hat'}))} onBack={()=> backTo('seq.tempo')} />}
      {isSeq && state.step==='seq.drum.hat' && <DrumPickStep label="Hat" onPick={(val)=> setState(s=>({...s,seq:{...s.seq,drums:{...s.seq.drums,hat:val}},step:'seq.drum.snare'}))} onBack={()=> backTo('seq.drum.kick')} />}
      {isSeq && state.step==='seq.drum.snare' && <DrumPickStep label="Snare" onPick={(val)=> setState(s=>({...s,seq:{...s.seq,drums:{...s.seq.drums,snare:val}},step:'seq.drum.extras'}))} onBack={()=> backTo('seq.drum.hat')} />}
    {isSeq && state.step==='seq.drum.extras' && <DrumExtrasStep extras={state.seq.drums.extras} onChange={(arr)=> setState(s=>({...s,seq:{...s.seq,drums:{...s.seq.drums,extras:arr}}}))} onNext={()=> setState(s=>({...s,step:'seq.instruments'}))} onBack={()=> backTo('seq.drum.snare')} />}
  {isSeq && state.step==='seq.instruments' && <InstrumentCategoryStep selected={state.seq.instruments} onChange={(sel)=> setState(s=>({...s,seq:{...s.seq,instruments:sel}}))} onNext={()=> setState(s=>({...s,step: state.proMode? 'seq.instrumentVariants':'seq.final'}))} onBack={()=> backTo(state.proMode? 'seq.drum.extras':'seq.tempo')} />}
  {isSeq && state.step==='seq.instrumentVariants' && <InstrumentVariantStep selectedFamilies={state.seq.instruments} variants={state.seq.instrumentVariants} onChange={(fam,vals)=> setState(s=>({...s,seq:{...s.seq, instrumentVariants:{...s.seq.instrumentVariants,[fam]:vals}}}))} onNext={()=> setState(s=>({...s,step:'seq.roles'}))} onBack={()=> backTo('seq.instruments')} />}
  {isSeq && state.step==='seq.roles' && <RolesStep roles={state.seq.roles} onChange={(r)=> setState(s=>({...s,seq:{...s.seq,roles:r}}))} onNext={()=> setState(s=>({...s,step:'seq.fx'}))} onBack={()=> backTo('seq.instrumentVariants')} />}
  {isSeq && state.step==='seq.fx' && <TagPickStep label="FX" values={state.seq.fxTags} onChange={(vals)=> setState(s=>({...s,seq:{...s.seq,fxTags:vals}}))} onNext={()=> setState(s=>({...s,step:'seq.mix'}))} onBack={()=> backTo('seq.roles')} />}
      {isSeq && state.step==='seq.mix' && <TagPickStep label="Mix" values={state.seq.mixTags} onChange={(vals)=> setState(s=>({...s,seq:{...s.seq,mixTags:vals}}))} onNext={()=> setState(s=>({...s,step:'seq.final'}))} onBack={()=> backTo('seq.fx')} />}
  {isSeq && state.step==='seq.final' && <FinalSeqSummary seq={state.seq} onRestart={()=> setState(s=>({...s,seq:{ subGenres:[], drums:{ extras:[] }, instruments:[], instrumentVariants:{}, roles:{bass:{},chords:{},lead:{}}, fxTags:[], mixTags:[], durationSec:210 }, step:'seq.genrePrimary'}))} />}
      {loading && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-sm">Building schema…</div>}
      <LiveCodingDock />
    </div>
  );
}

// ---------------- Sub Components ----------------
function GenreStep({ onSelect }:{ onSelect:(g:GenreId)=>void }){ const packs=GENRE_PACKS; const placeholders=packs.map(p=>({id:p.id,label:p.label,description:p.description||''})); return (<div className="max-w-4xl mx-auto"><h2 className="text-sm uppercase tracking-widest text-cyan-300 mb-4">Select a Genre</h2><div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{placeholders.map(p=> (<button key={p.id} onClick={()=> onSelect(p.id)} className="group relative glass-card rounded-xl p-4 text-left hover:border-cyan-400 hover:shadow-cyan-500/10 transition"><div className="text-base font-medium tracking-wide group-hover:text-cyan-200 drop-shadow">{p.label}</div><p className="mt-2 text-[11px] text-slate-400 line-clamp-3 min-h-[2.5rem]">{p.description||'Genre description...'}</p></button>))}</div></div>); }
function BpmTimeStep({ genre, presets, onConfirm, onBack, accentBtn, accentGhost, accentPrimary }:{ genre:GenreId; presets:{default:number;low:number;high:number;range:[number,number]}; onConfirm:(v:{bpm:number;meter:string;swing?:number;durationSec?:number})=>void; onBack:()=>void; accentBtn:string; accentGhost:string; accentPrimary:string }){ const [bpm,setBpm]=useState(presets.default); const [meter,setMeter]=useState('4/4'); const [swing,setSwing]=useState<number|undefined>(); const [minutes,setMinutes]=useState(3); const [seconds,setSeconds]=useState(30); const swings=[0,54,57]; const durationSec=minutes*60+seconds; function normSeconds(v:number){ if(isNaN(v)) return; let s=v; if(s<0) s=0; if(s>59) s=59; setSeconds(s);} return (<div className="max-w-xl mx-auto space-y-8"><div><h2 className="text-sm uppercase tracking-widest text-cyan-300 mb-2">{t('wizard.tempoMeter')}</h2><p className="text-xs text-slate-400 mb-4">{t('wizard.recommendedBpm',{genre:genre.toUpperCase(),low:presets.range[0],high:presets.range[1]})}</p><div className="flex flex-wrap gap-2 mb-3">{[presets.low,presets.default,presets.high].map(v=> <button key={v} onClick={()=> setBpm(v)} className={`px-3 py-1 rounded border text-xs ${bpm===v?'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 hover:border-cyan-400'}`}>{v} BPM</button>)}</div><div className="flex items-center gap-3 mb-4"><label className="text-xs text-slate-400 w-20">{t('labels.custom')}</label><input type="number" value={bpm} onChange={e=> setBpm(Number(e.target.value)||bpm)} className="bg-slate-800/60 border border-slate-600 rounded px-3 py-1 text-sm w-28 focus:outline-none focus:border-cyan-400" /></div><div className="flex items-center gap-3 mb-4"><label className="text-xs text-slate-400 w-20">{t('labels.meter')}</label><select value={meter} onChange={e=> setMeter(e.target.value)} className="bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400">{['4/4','3/4','6/8','5/4','7/8','9/8'].map(m=> <option key={m} value={m}>{m}</option>)}</select></div><div className="grid grid-cols-2 gap-6"><div><div className="text-xs text-slate-400 mb-1">{t('labels.swing')}</div><div className="flex gap-2 flex-wrap">{swings.map(s=> <button key={s} onClick={()=> setSwing(s===0?undefined:s)} className={`px-2 py-1 rounded border text-[11px] ${swing===s?'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 hover:border-cyan-400'}`}>{s===0?t('wizard.swingNone'):s+'%'}</button>)}</div></div><div><div className="text-xs text-slate-400 mb-1">Track Duration</div><div className="flex items-center gap-2"><input type="number" value={minutes} onChange={e=> setMinutes(Math.max(0,Number(e.target.value)||minutes))} className="w-16 bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400" /> <span className="text-slate-400 text-xs">min</span><input type="number" value={seconds} onChange={e=> normSeconds(Number(e.target.value))} className="w-16 bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400" /> <span className="text-slate-400 text-xs">sec</span></div><div className="text-[10px] text-slate-500 mt-1">Default 3:30 • Adjust as needed</div></div></div><div className="flex justify-between mt-8"><button onClick={onBack} className={`${accentBtn} ${accentGhost}`}>{t('buttons.back')}</button><button onClick={()=> onConfirm({bpm,meter,swing,durationSec})} className={`${accentBtn} ${accentPrimary}`}>{t('buttons.continue')}</button></div></div></div>); }
// (legacy GenrePrimaryStep removed in favor of rootCategory-aware version)
function GenrePrimaryStep({ rootCategory, setRootCategory, onSelect }:{ rootCategory?:string; setRootCategory:(id?:string)=>void; onSelect:(g:GenreId)=>void }){
  const activeCat = ROOT_GENRE_CATEGORIES.find(c=> c.id===rootCategory);
  const visiblePacks = activeCat? GENRE_PACKS.filter(p=> activeCat.genres.includes(p.id as GenreId)) : GENRE_PACKS;
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
function GenreStyleStep({ genre: _genre, variants, onPick, onSkip }:{ genre:GenreId; variants:{label:string;delta?:number;desc?:string}[]; onPick:(v:string)=>void; onSkip:()=>void }){
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-sm uppercase tracking-widest text-cyan-300">Select Style Variant</h2>
      <div className="flex flex-wrap gap-2">
        {variants.map(v=> <button key={v.label} onClick={()=> onPick(v.label)} className="px-3 py-1 rounded border text-xs border-slate-600 hover:border-cyan-400 text-slate-300 relative">
          {v.label}
          {v.delta? <span className="ml-1 text-[9px] text-slate-500">{v.delta>0? '+'+v.delta:''+v.delta}</span>:null}
        </button>)}
        <button onClick={onSkip} className="px-3 py-1 rounded border text-xs border-slate-700 hover:border-slate-500 text-slate-500">Skip</button>
      </div>
    </div>
  );
}
function GenreSubsStep({ state, onDone }:{ state:WizardState; onDone:(subs:GenreId[])=>void }){ const packs=GENRE_PACKS.filter(p=> p.id!==state.seq.mainGenre); const [local,setLocal]=useState<GenreId[]>(state.seq.subGenres); return (<div className="max-w-3xl mx-auto space-y-6"><h2 className="text-sm uppercase tracking-widest text-cyan-300">Add Sub Genres (Optional)</h2><div className="flex flex-wrap gap-2">{packs.map(p=> { const on=local.includes(p.id); return <button key={p.id} onClick={()=> setLocal(l=> on? l.filter(x=> x!==p.id):[...l,p.id])} className={`px-3 py-1 rounded border text-xs ${on?'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-400 hover:border-fuchsia-400'}`}>{p.label}</button>; })}</div><div className="flex justify-end gap-2 text-xs"><button onClick={()=> onDone(local)} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">Continue</button></div></div>); }
function DrumPickStep({ label, onPick, onBack }:{ label:string; onPick:(v:string)=>void; onBack:()=>void }){ const base=['punchy','deep','analog','distorted','tight','airy']; const ext=['saturated','round','clicky','subby','crisp','woody']; const opts=[...base,...ext]; return (<div className="max-w-xl mx-auto space-y-6"><h2 className="text-sm uppercase tracking-widest text-cyan-300">{t('wizard.select',{label})}</h2><div className="flex flex-wrap gap-2">{opts.map(o=> <button key={o} onClick={()=> onPick(o)} className="px-3 py-1 rounded border text-xs border-slate-600 hover:border-cyan-400 text-slate-300">{o}</button>)}</div><div className="flex justify-between text-xs"><button onClick={onBack} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">{t('buttons.back')}</button></div></div>); }
function DrumExtrasStep({ extras, onChange, onNext, onBack }:{ extras:string[]; onChange:(a:string[])=>void; onNext:()=>void; onBack:()=>void }){ const base=['clap','shaker','rim','tom','ride']; const ext=['cowbell','snap','clave','bongo','conga','fx noise']; const opts=[...base,...ext]; return (<div className="max-w-xl mx-auto space-y-6"><h2 className="text-sm uppercase tracking-widest text-cyan-300">{t('wizard.extraPerc')}</h2><div className="flex flex-wrap gap-2">{opts.map(o=> { const on=extras.includes(o); return <button key={o} onClick={()=> onChange(on? extras.filter(x=> x!==o):[...extras,o])} className={`px-3 py-1 rounded border text-xs ${on?'border-emerald-400 text-emerald-200 bg-emerald-600/20':'border-slate-600 text-slate-400 hover:border-emerald-400'}`}>{o}</button>; })}</div><div className="flex justify-between text-xs"><button onClick={onBack} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">{t('buttons.back')}</button><button onClick={onNext} className="px-3 py-1 rounded border border-cyan-400 text-cyan-200 bg-cyan-600/10">{t('buttons.continue')}</button></div></div>); }
// (original DrumSummaryStep removed; override version defined later)
function TagPickStep({ label, values, onChange, onNext, onBack }:{ label:string; values:string[]; onChange:(v:string[])=>void; onNext:()=>void; onBack:()=>void }){ const baseFX=['shimmer','tape delay','grit','modulated','lofi','wide']; const extFX=['granular','reverse','bitcrush','phased','washed','droning']; const baseMix=['tight low-end','airy highs','glue','wide stereo','punchy mid']; const extMix=['forward vocal','balanced','open top','fat center','deep space','dry punch']; const opts= label==='FX'? [...baseFX,...extFX]: [...baseMix,...extMix]; const title= label==='FX'? t('wizard.fxTags'): t('wizard.mixTags'); return (<div className="max-w-xl mx-auto space-y-6"><h2 className="text-sm uppercase tracking-widest text-cyan-300">{title}</h2><div className="flex flex-wrap gap-2">{opts.map(o=> { const on=values.includes(o); return <button key={o} onClick={()=> onChange(on? values.filter(x=> x!==o):[...values,o])} className={`px-3 py-1 rounded border text-xs ${on? 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-400 hover:border-fuchsia-400'}`}>{o}</button>; })}</div><div className="flex justify-between text-xs"><button onClick={onBack} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">{t('buttons.back')}</button><button onClick={onNext} className="px-3 py-1 rounded border border-cyan-400 text-cyan-200 bg-cyan-600/10">{t('buttons.continue')}</button></div></div>); }
function RolesStep({ roles, onChange, onNext, onBack }:{ roles:{bass:RoleConfig;chords:RoleConfig;lead:RoleConfig}; onChange:(r:{bass:RoleConfig;chords:RoleConfig;lead:RoleConfig})=>void; onNext:()=>void; onBack:()=>void }){
  const tonePool=['warm','bright','dark','crisp','gritty','smooth','airy','punchy','rounded'];
  const brightnessPool=['subdued','balanced','forward','shimmering'];
  function update(role:'bass'|'chords'|'lead', patch:Partial<RoleConfig>){ onChange({...roles,[role]:{...roles[role],...patch}} as any); }
  function block(label:string, key:'bass'|'chords'|'lead'){
    const data=roles[key];
    return (
      <div className="border border-slate-700 rounded-lg p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-cyan-300">{label}</div>
        <div className="space-y-2">
          <div className="text-[10px] text-slate-500">Tone</div>
          <div className="flex flex-wrap gap-1">
            {tonePool.map(tn=> { const on=data.tone===tn; return <button key={tn} onClick={()=> update(key,{tone:on? undefined:tn})} className={`px-2 py-1 rounded border text-[10px] ${on?'border-emerald-400 text-emerald-200 bg-emerald-600/20':'border-slate-600 text-slate-400 hover:border-emerald-400'}`}>{tn}</button>; })}
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Brightness</div>
          <div className="flex flex-wrap gap-1">
            {brightnessPool.map(br=> { const on=data.brightness===br; return <button key={br} onClick={()=> update(key,{brightness:on? undefined:br})} className={`px-2 py-1 rounded border text-[10px] ${on?'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-400 hover:border-fuchsia-400'}`}>{br}</button>; })}
          </div>
          {(data.tone||data.brightness) && <div className="text-[10px] text-slate-500">Selected: {[data.tone,data.brightness].filter(Boolean).join(' | ')}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-sm uppercase tracking-widest text-cyan-300">Core Roles</h2>
      <p className="text-[11px] text-slate-500">Define tonal character and brightness for each core musical role in a single step.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {block('Bass','bass')}
        {block('Chords / Pad','chords')}
        {block('Lead / Melody','lead')}
      </div>
      <div className="flex justify-between text-xs">
        <button onClick={onBack} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">{t('buttons.back')}</button>
        <button onClick={onNext} className="px-3 py-1 rounded border border-cyan-400 text-cyan-200 bg-cyan-600/10">{t('buttons.continue')}</button>
      </div>
    </div>
  );
}
// (original FinalSeqSummary removed; override version defined later)
function BuildStep({ state, onBack, accentBtn, accentGhost }:{ state:WizardState; onBack:()=>void; accentBtn:string; accentGhost:string }){ const [melodySummary,setMelodySummary]=useState<any|null>(null); const [includeMelody,setIncludeMelody]=useState(true); const [mode,setMode]=useState<'schema'|'instrument'>('schema'); const [pickedProg,setPickedProg]=useState<string|undefined>(); const [compact,setCompact]=useState(false); const recProgs=useMemo(()=> state.genres? recommendProgressions(state.genres,5): state.genre? recommendProgressions([state.genre],5):[], [state.genres,state.genre]); function buildMelodySuffix(){ if(!includeMelody||!melodySummary) return ''; const parts:string[]=[]; if(melodySummary.medianNote) parts.push(`melody centered on ${melodySummary.medianNote}`); if(melodySummary.keyGuess) parts.push(`${melodySummary.keyGuess}`); if(melodySummary.stability!=null) parts.push(`stability ${(melodySummary.stability*100).toFixed(0)}%`); if(melodySummary.scaleCandidates?.length) parts.push(`scales ${melodySummary.scaleCandidates.map((s:any)=> s.scale.split(' ')[0]).slice(0,2).join('/')}`); return parts.join(' | ');} const suffix=buildMelodySuffix(); const genreDescriptions=(state.genres||(state.genre?[state.genre]:[])).map(id=>{const pack=GENRE_PACKS.find(p=> p.id===id); return pack? `${pack.label}: ${pack.description||''}`.trim():null;}).filter(Boolean).join(' | '); const progressionSuffix=useMemo(()=>{ if(!pickedProg) return ''; const f=recProgs.find(p=> p.id===pickedProg); return f? `Progression: ${f.roman}`:''; },[pickedProg,recProgs]); return (<div className="space-y-6"><div className="flex items-center justify-between"><div className="text-xs uppercase tracking-widest text-cyan-300">Build • {state.genre?.toUpperCase()} • {state.bpm} BPM{state.meter&&state.meter!=='4/4'?' ('+state.meter+')':''}{state.swing? ' • Swing '+state.swing+'%':''}</div><button onClick={onBack} className={`${accentBtn} ${accentGhost} text-[11px]`}>Adjust Tempo</button></div><div className="flex gap-3 text-[11px]"><button onClick={()=> setMode('schema')} className={`px-3 py-1 rounded border ${mode==='schema'?'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 text-slate-400 hover:border-cyan-400'}`}>Schema Mode</button><button onClick={()=> setMode('instrument')} className={`px-3 py-1 rounded border ${mode==='instrument'?'border-cyan-400 text-cyan-200 bg-cyan-500/10':'border-slate-600 text-slate-400 hover:border-cyan-400'}`}>Instrument Mode</button>{mode==='schema' && <button onClick={()=> setCompact(c=>!c)} className={`px-3 py-1 rounded border ${compact?'border-emerald-400 text-emerald-200 bg-emerald-600/10':'border-slate-600 text-slate-400 hover:border-emerald-400 hover:text-emerald-200'}`}>{compact? 'Compact ON':'Compact OFF'}</button>}</div><div className="flex items-center gap-3 text-[11px] text-slate-400"><label className="flex items-center gap-1 cursor-pointer select-none"><input type="checkbox" checked={includeMelody} onChange={e=> setIncludeMelody(e.target.checked)} /><span>Include Melody Summary</span></label>{suffix && <span className="text-slate-500 truncate max-w-[420px]">Preview: {suffix}</span>}</div><div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6">{mode==='schema' && state.schema && <SchemaPromptBuilder schema={state.schema} bpm={state.bpm} meter={state.meter} swing={state.swing} extraSuffix={[genreDescriptions,progressionSuffix,suffix].filter(Boolean).join(', ')} compact={compact} />}{mode==='instrument' && <InstrumentPromptBuilder />}</div><div className="lg:col-span-1 space-y-6"><MelodyRecorder onResult={(r)=> setMelodySummary(r)} /><div className="rounded-xl panel-dim p-3 space-y-2"><h4 className="text-[11px] uppercase tracking-wider text-slate-300">Genre Progressions</h4>{recProgs.length===0 && <div className="text-[11px] text-slate-500">No patterns</div>}<div className="flex flex-wrap gap-2">{recProgs.map((p:any)=>{const on=p.id===pickedProg; return <button key={p.id} onClick={()=> setPickedProg(on? undefined:p.id)} className={`px-2 py-1 rounded border text-[10px] transition ${on?'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-600/20':'border-slate-600 text-slate-400 hover:border-fuchsia-400 hover:text-fuchsia-200'}`}>{p.roman}</button>;})}</div>{pickedProg && <div className="text-[10px] text-slate-500">Selected: {recProgs.find((p:any)=> p.id===pickedProg)?.label}</div>}</div></div></div></div>); }
function LiveCodingDock(){ const [open,setOpen]=useState(false); const [hover,setHover]=useState(false); useEffect(()=>{ function onReq(){ setOpen(true);} window.addEventListener('livecode.requestOpen',onReq as any); function onKey(e:KeyboardEvent){ if((e.metaKey||e.ctrlKey)&&(e.key==='l'||e.key==='L')){ e.preventDefault(); setOpen(o=>!o);} } window.addEventListener('keydown',onKey); return ()=>{ window.removeEventListener('livecode.requestOpen',onReq as any); window.removeEventListener('keydown',onKey); };},[]); return (<><div className={`fixed bottom-6 right-0 z-40 group ${open?'translate-x-0':'translate-x-[calc(100%-52px)]'} transition-transform duration-300`} onMouseEnter={()=> setHover(true)} onMouseLeave={()=> setHover(false)}><div className={`flex items-center gap-2 pl-4 pr-3 py-2 rounded-l-xl shadow-lg border border-r-0 backdrop-blur-md cursor-pointer select-none ${open?'bg-cyan-600/30 border-cyan-500/40':'bg-slate-800/60 border-slate-600/40 hover:bg-slate-700/70'}`} onClick={()=> setOpen(o=>!o)}><span className="text-[11px] tracking-wide text-slate-200">{open?'LIVE CODING':'LIVE'}</span><button onClick={(e)=>{ e.stopPropagation(); setOpen(false);}} className={`text-slate-400 hover:text-cyan-200 text-xs px-1 rounded transition-opacity ${open||hover?'opacity-100':'opacity-0'} focus:opacity-100`} aria-label="Close live coding console">×</button></div></div><div className={`fixed top-0 right-0 h-full w-full sm:w-[640px] z-30 shadow-lg transition-transform duration-300 ${open?'translate-x-0':'translate-x-full'}`}>{open && <LiveCodingConsole onClose={()=> setOpen(false)} />}</div></>); }

// (legacy duplicated component block removed during rewrite)

// --- Extended injected overrides (instrument step + prompt aggregation) ---
// DrumSummaryStep removed (drum details only appear in final summary now)

function InstrumentCategoryStep({ selected, onChange, onNext, onBack }:{ selected:string[]; onChange:(v:string[])=>void; onNext:()=>void; onBack:()=>void }){
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-sm uppercase tracking-widest text-cyan-300">{t('wizard.instrumentFamilies')}</h2>
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

function InstrumentVariantStep({ selectedFamilies, variants, onChange, onNext, onBack }:{ selectedFamilies:string[]; variants:Record<string,string[]>; onChange:(family:string,vals:string[])=>void; onNext:()=>void; onBack:()=>void }){
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-sm uppercase tracking-widest text-cyan-300">Instrument Details</h2>
      {selectedFamilies.length===0 && <div className="text-[11px] text-slate-500">No families selected.</div>}
      <div className="space-y-5">
        {selectedFamilies.map(fam=> {
          // Reuse variant library or fallback short suggestions
          const pool=(INSTRUMENT_VARIANTS as any)[fam] as string[]|undefined;
          const sel=variants[fam]||[];
          if(!pool) return <div key={fam} className="text-[11px] text-slate-500">{fam}: no variants</div>;
          return (
            <div key={fam} className="border border-slate-700 rounded-lg p-3">
              <div className="text-[11px] uppercase tracking-wider text-cyan-300 mb-2">{fam} variants</div>
              <div className="flex flex-wrap gap-2">
                {pool.map(v=> { const on=sel.includes(v); return <button key={v} onClick={()=> onChange(fam,on? sel.filter(x=> x!==v):[...sel,v])} className={`px-2 py-1 rounded border text-[10px] ${on?'border-emerald-400 text-emerald-200 bg-emerald-600/20':'border-slate-600 text-slate-400 hover:border-emerald-400'}`}>{v}</button>; })}
              </div>
              {sel.length>0 && <div className="mt-2 text-[10px] text-slate-500">Selected: {sel.join(', ')}</div>}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs">
        <button onClick={onBack} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">{t('buttons.back')}</button>
        <button onClick={onNext} className="px-3 py-1 rounded border border-cyan-400 text-cyan-200 bg-cyan-600/10">{t('buttons.continue')}</button>
      </div>
    </div>
  );
}

// Override final summary to include instruments
function FinalSeqSummary({ seq, onRestart }:{ seq:SequentialBuildState; onRestart:()=>void }){
  const [compact,setCompact]=useState(false);
  const drumBlockCompact=[
    seq.drums.kick? 'K:'+seq.drums.kick:undefined,
    seq.drums.hat? 'H:'+seq.drums.hat:undefined,
    seq.drums.snare? 'S:'+seq.drums.snare:undefined,
    seq.drums.extras.length? 'X:'+seq.drums.extras.join('/') : undefined
  ].filter(Boolean).join(' | ');
  const drumBlockExpanded=[
    `Kick: ${seq.drums.kick||'-'}`,
    `Hat: ${seq.drums.hat||'-'}`,
    `Snare: ${seq.drums.snare||'-'}`,
    `Perc Extras: ${seq.drums.extras.length? seq.drums.extras.join(', '):'-'}`
  ].join('\n');
  // Force English output for Suno compatibility
  const variantDetail = seq.instruments.length ? seq.instruments.map(f=> {
    const v = seq.instrumentVariants[f];
    return v && v.length ? `${f}(${v.slice(0,4).join('/')})` : f;
  }).join(', ') : '';
  const lines=[
    `GENRE: ${seq.mainGenre}${seq.styleVariant? ' • '+seq.styleVariant:''}${seq.subGenres.length?' + '+seq.subGenres.join('/') : ''}`,
    seq.bpm? `TEMPO: ${seq.bpm} BPM ${seq.meter||'4/4'}${seq.swing? ' swing '+seq.swing+'%':''}`:'',
  seq.durationSec? `DURATION: ${Math.floor(seq.durationSec/60)}:${(seq.durationSec%60).toString().padStart(2,'0')}`:'',
    compact? `DRUMS: ${drumBlockCompact}`: `DRUMS:\n${drumBlockExpanded}`,
    variantDetail? `INSTRUMENTS: ${variantDetail}`:'',
  seq.roles.bass.tone||seq.roles.bass.brightness? `BASS: ${[seq.roles.bass.tone, seq.roles.bass.brightness].filter(Boolean).join(' | ')}`:'',
  seq.roles.chords.tone||seq.roles.chords.brightness? `CHORDS: ${[seq.roles.chords.tone, seq.roles.chords.brightness].filter(Boolean).join(' | ')}`:'',
  seq.roles.lead.tone||seq.roles.lead.brightness? `LEAD: ${[seq.roles.lead.tone, seq.roles.lead.brightness].filter(Boolean).join(' | ')}`:'',
    seq.fxTags.length? 'FX: '+seq.fxTags.join(', '):'',
    seq.mixTags.length? 'MIX: '+seq.mixTags.join(', '):''
  ].filter(Boolean).join('\n');
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-widest text-cyan-300">{t('wizard.finalSummary')}</h2>
        <button onClick={()=> setCompact(c=>!c)} className="px-2 py-1 text-[10px] rounded border border-slate-600 hover:border-cyan-400 text-slate-400 hover:text-cyan-200">{compact? t('wizard.view.expanded'): t('wizard.view.compact')}</button>
      </div>
      <pre className="text-[11px] bg-black/40 border border-slate-700 rounded p-3 whitespace-pre-wrap leading-relaxed">{lines}</pre>
      <div className="flex justify-between text-xs">
        <button onClick={onRestart} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400">{t('buttons.restart')}</button>
        <button onClick={()=> navigator.clipboard.writeText(lines)} className="px-3 py-1 rounded border border-emerald-400 text-emerald-200 bg-emerald-600/10">{t('buttons.copy')}</button>
      </div>
    </div>
  );
}
