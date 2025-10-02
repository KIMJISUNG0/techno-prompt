import { useMemo, useState, useEffect } from "react";
import { IconSettings, IconDocs, IconSun, IconMoon } from './icons/Icons';
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GROUPS, OPTIONS, SUBOPTS, ORDER, PARAMS_LOOKUP, type GroupId } from "../data/taxonomy";
import { getRecommendedSet } from '../config/recommended';

// 간단 번역 맵 (데모 수준)
const GROUP_LABEL_KR: Record<string, string> = {
  'Subgenre': '서브장르',
  'Rhythm / Drums': '리듬/드럼',
  'Groove / Timing': '그루브',
  'Bass': '베이스',
  'Leads / Chords / Arp': '리드/코드/아르페지오',
  'Sound Design': '사운드 디자인',
  'Atmosphere': '분위기',
  'FX & Texture': 'FX/텍스처',
  'Arrangement': '편곡',
  'Performance / Live': '퍼포먼스',
  'Mix': '믹스',
  'Processing': '프로세싱',
  'Meters / Targets': '미터/타겟',
  'Detail Params': '세부 파라미터'
};
function translateGroup(label: string) { return GROUP_LABEL_KR[label] ?? label; }

/*
  Techno Prompt Generator – game-like MVP (hover suboptions + expanded taxonomy + exact BPM)
  - Single-file React component, Tailwind CSS styling
  - Schema-first design; hover to reveal extra controls (e.g., TR-909 subparams)
  - Live preview, copy, local presets
*/

// ---------------------- Helpers ----------------------
function emptyState(): Record<GroupId, Set<string>> {
  return {
    subgenre: new Set(),
    rhythm: new Set(),
    bass: new Set(),
    synths: new Set(),
    atmosphere: new Set(),
    fx: new Set(),
    arrangement: new Set(),
    mix: new Set(),
    soundDesign: new Set(),
    processing: new Set(),
    groove: new Set(),
    performance: new Set(),
    meters: new Set(),
    mastering: new Set(),
    params: new Set(),
  };
}

function buildPrompt(selections: Record<GroupId, Set<string>>, topic: string, bpmExact?: number) {
  const byId = new Map(OPTIONS.map((o: any) => [o.id, o] as const));
  const chunks: string[] = [];

  if (typeof bpmExact === "number" && !Number.isNaN(bpmExact)) {
    chunks.push(`${Math.round(bpmExact)} BPM`);
  }

  for (const group of ORDER) {
    const set = selections[group];
    if (!set || set.size === 0) continue;
    const piece = [...set]
      .map((id) => byId.get(id)?.prompt ?? PARAMS_LOOKUP[id])
      .filter(Boolean)
      .join(", ");
    if (piece) chunks.push(piece);
  }
  if (topic.trim()) chunks.push(`Theme: ${topic.trim()}`);

  return chunks.join(", ");
}

// Theme preference hook
function useAutoDarkMode(){
  const [darkMode, setDarkMode] = useState<boolean>(()=>{
    if (typeof window==='undefined') return true;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(()=> {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = ()=> setDarkMode(mq.matches);
    mq.addEventListener('change', handler);
    return ()=> mq.removeEventListener('change', handler);
  },[]);
  useEffect(()=> {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark'); else root.classList.remove('dark');
  },[darkMode]);
  return { darkMode, setDarkMode } as const;
}

// PARAMS_LOOKUP imported

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {/* persist skipped (quota / privacy mode) */}
  }, [key, value]);
  return [value, setValue] as const;
}

// ---------------------- UI Primitives ----------------------
function Chip({ active, highlightOnly, highlightIntensity = 1, label, onClick, onMouseEnter, onMouseLeave }: {
  active: boolean;
  highlightOnly?: boolean;
  highlightIntensity?: number;
  label: string;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={
        `relative px-3 py-1 rounded-full border text-xs transition ` +
        (active
          ? "border-cyan-300 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.75)] bg-cyan-900/25"
          : highlightOnly
            ? (highlightIntensity===2
                ? "border-fuchsia-300 text-fuchsia-200 shadow-[0_0_16px_rgba(217,70,239,0.75)] bg-fuchsia-900/20 animate-[pulse_1.2s_ease-in-out_infinite]"
                : highlightIntensity===1
                  ? "border-fuchsia-300/70 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.55)] bg-fuchsia-900/10 animate-pulse"
                  : "border-slate-600 text-slate-400")
            : "border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-200")
      }
    >
      <span className="tracking-wide">{label}</span>
    </button>
  );
}

function HoverPanelChip({
  active,
  label,
  onClick,
  subopts,
  onPickSub,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  subopts: { id: string; label: string; prompt: string }[];
  onPickSub: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Chip active={active} label={label} onClick={onClick} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-20 mt-2 min-w-[240px] p-2 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl"
          >
            <div className="grid grid-cols-2 gap-2">
              {subopts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onPickSub(s.id)}
                  className="px-2 py-1 rounded-md text-[11px] border border-slate-700 hover:border-cyan-400 text-slate-200"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupBlock({ group, selections, setSelections, query, lang }: {
  group: { id: GroupId; label: string; multi: boolean };
  selections: Record<GroupId, Set<string>>;
  setSelections: (fn: (s: Record<GroupId, Set<string>>) => Record<GroupId, Set<string>>) => void;
  query: string;
  lang: 'en' | 'kr';
}) {
  const [expanded, setExpanded] = useState(false);
  const raw = OPTIONS.filter((o: any) => o.group === group.id);
  const q = query.trim().toLowerCase();
  let filtered = q ? raw.filter((o: any) => o.label.toLowerCase().includes(q)) : raw;
  // group by family if any family exists
  const families = new Map<string, any[]>();
  let hasFamily = false;
  if (filtered.length > 0) {
    for (const opt of filtered) {
    if (opt.family) {
      hasFamily = true;
      if (!families.has(opt.family)) families.set(opt.family, []);
      families.get(opt.family)!.push(opt);
    }
    }
  }

  // sorting inside each family: selected first then primary then original order
  function sortList(list: any[]) {
    return [...list].sort((a, b) => {
      const aSel = selections[group.id].has(a.id) ? 1 : 0;
      const bSel = selections[group.id].has(b.id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      const aPrim = a.primary ? 1 : 0;
      const bPrim = b.primary ? 1 : 0;
      if (aPrim !== bPrim) return bPrim - aPrim;
      return raw.findIndex(r => r.id === a.id) - raw.findIndex(r => r.id === b.id);
    });
  }

  if (hasFamily && !q) {
    for (const [fam, list] of families) families.set(fam, sortList(list));
  } else if (!hasFamily) {
    filtered = sortList(filtered);
  }

  // When collapsed and families exist: only show primary or selected options per family
  const displayBlocks: { title?: string; items: any[] }[] = [];
  if (hasFamily) {
    for (const [fam, list] of families) {
      const base = list as any[];
      const visible = (!expanded && !q)
        ? base.filter(o => o.primary || selections[group.id].has(o.id))
        : base;
      if (visible.length) {
        displayBlocks.push({ title: fam, items: sortList(visible) });
      }
    }
    // If after collapse nothing to show, allow skip
    if (!displayBlocks.length) return null;
  } else {
    if (!filtered.length) return null;
    displayBlocks.push({ items: filtered });
  }

  const displayLabel = lang === 'kr' ? translateGroup(group.label) : group.label;

  function toggle(id: string) {
    setSelections((prev) => {
      const copy: Record<GroupId, Set<string>> = { ...prev } as any;
      copy[group.id] = new Set(prev[group.id]);
      const set = copy[group.id];

      if (!group.multi) set.clear();
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return copy;
    });
  }

  function pickParam(paramId: string) {
    setSelections((prev) => {
      const copy: Record<GroupId, Set<string>> = { ...prev } as any;
      copy.params = new Set(prev.params);
      copy.params.add(paramId);
      return copy;
    });
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-100/90 bg-white/5 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm">{displayLabel}</h3>
        {!group.multi && <span className="text-[10px] text-slate-400">(Single)</span>}
      </div>
      <div className="flex flex-col gap-3">
        {displayBlocks.map((block, i) => (
          <div key={block.title ?? i} className="flex flex-wrap gap-2 items-start">
            {block.title && (
              <span className="text-[10px] uppercase tracking-wider text-slate-400 basis-full pl-0.5">{block.title}</span>
            )}
            {block.items.map((o: any) => {
              const subs = SUBOPTS[o.id];
              if (subs && subs.length) {
                return (
                  <HoverPanelChip
                    key={o.id}
                    active={selections[group.id].has(o.id)}
                    label={o.label}
                    onClick={() => toggle(o.id)}
                    subopts={subs}
                    onPickSub={pickParam}
                  />
                );
              }
              return (
                <Chip
                  key={o.id}
                  label={o.label}
                  active={selections[group.id].has(o.id)}
                  onClick={() => toggle(o.id)}
                />
              );
            })}
          </div>
        ))}
        {hasFamily && !q && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="self-start mt-1 text-[10px] px-2 py-0.5 rounded border border-slate-600 hover:border-cyan-400 text-slate-300 hover:text-cyan-200 bg-slate-800/40"
          >
            {expanded ? (lang==='kr' ? '간략히' : 'Collapse') : (lang==='kr' ? '더 보기' : 'Expand')}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- Compact Mode Group (hover popover) ----------------
function CompactGroup({ group, lang, selections, setSelections, query, pinned, setPinned, highlightSet, highlightActive, highlightIntensity }: {
  group: { id: GroupId; label: string; multi: boolean };
  lang: 'en' | 'kr';
  selections: Record<GroupId, Set<string>>;
  setSelections: (fn: (s: Record<GroupId, Set<string>>) => Record<GroupId, Set<string>>) => void;
  query: string;
  pinned: boolean;
  setPinned: (v: boolean) => void;
  highlightSet: Set<string>;
  highlightActive: boolean;
  highlightIntensity: number;
}) {
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const raw = OPTIONS.filter((o: any) => o.group === group.id);
  let filtered = q ? raw.filter((o: any) => o.label.toLowerCase().includes(q)) : raw;
  function toggle(id: string) {
    setSelections(prev => {
      const copy: Record<GroupId, Set<string>> = { ...prev } as any;
      copy[group.id] = new Set(prev[group.id]);
      const set = copy[group.id];
      if (!group.multi) set.clear();
      if (set.has(id)) set.delete(id); else set.add(id);
      return copy;
    });
  }
  function pickParam(paramId: string) {
    setSelections(prev => {
      const copy: Record<GroupId, Set<string>> = { ...prev } as any;
      copy.params = new Set(prev.params);
      copy.params.add(paramId);
      return copy;
    });
  }
  filtered = [...filtered].sort((a: any, b: any) => {
    const aSel = selections[group.id].has(a.id) ? 1 : 0;
    const bSel = selections[group.id].has(b.id) ? 1 : 0;
    if (aSel !== bSel) return bSel - aSel;
    return raw.findIndex(r=>r.id===a.id)-raw.findIndex(r=>r.id===b.id);
  });
  const displayLabel = lang==='kr'? translateGroup(group.label): group.label;
  const selectedCount = selections[group.id].size;
  return (
    <div className="relative" onMouseEnter={()=> !pinned && setOpen(true)} onMouseLeave={()=> { if(!pinned) setOpen(false); }}>
      <button onClick={()=> setPinned(!pinned)} className={`w-full text-left text-[11px] px-2 py-2 rounded-lg border transition group overflow-hidden ${(open||pinned)? 'border-cyan-400/70 bg-slate-800/70':'border-slate-600/70 bg-slate-900/40 hover:bg-slate-800/60 hover:border-cyan-400/60'}`}> 
        <span className="block truncate uppercase tracking-wider text-slate-300 group-hover:text-cyan-200 flex items-center justify-between gap-2">
          <span>{displayLabel}</span>
          <span className="flex items-center gap-1">
            {selectedCount>0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-200">{selectedCount}</span>}
            {pinned && <span className="text-[8px] px-1 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200">PIN</span>}
          </span>
        </span>
      </button>
      {(open || pinned) && (
        <div className="absolute z-30 top-full left-0 mt-2 w-[340px] max-h-[400px] overflow-auto p-3 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl" onMouseEnter={()=> setOpen(true)}>
          <h4 className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">{displayLabel}</h4>
          <div className="flex flex-wrap gap-2">
            {filtered.map((o: any)=> {
              const subs = SUBOPTS[o.id];
              const highlight = highlightActive && highlightSet.has(o.id) && !selections[group.id].has(o.id);
              if (subs && subs.length) {
                return (
                  <HoverPanelChip
                    key={o.id}
                    active={selections[group.id].has(o.id) || highlight}
                    label={o.label}
                    onClick={()=> toggle(o.id)}
                    subopts={subs}
                    onPickSub={pickParam}
                  />
                );
              }
              return (
                <Chip
                  key={o.id}
                  label={o.label}
                  active={selections[group.id].has(o.id)}
                  highlightOnly={highlight && !selections[group.id].has(o.id)}
                  highlightIntensity={highlightIntensity}
                  onClick={()=> toggle(o.id)}
                />
              );
            })}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={()=> { setPinned(false); setOpen(false); }} className="text-[10px] px-2 py-0.5 rounded border border-slate-600 hover:border-cyan-400 text-slate-300">Close</button>
            {!pinned && <button onClick={()=> setPinned(true)} className="text-[10px] px-2 py-0.5 rounded border border-fuchsia-500/60 hover:border-fuchsia-300 text-fuchsia-200">Pin</button>}
            {pinned && <button onClick={()=> setPinned(false)} className="text-[10px] px-2 py-0.5 rounded border border-fuchsia-500/60 hover:border-fuchsia-300 text-fuchsia-200">Unpin</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TechnoPromptGenerator() {
  const { darkMode, setDarkMode } = useAutoDarkMode();
  const [topic, setTopic] = useState("");
  const [bpm, setBpm] = useState<number | undefined>(128);
  const [selections, setSelections] = useState<Record<GroupId, Set<string>>>(emptyState);
  const [presets, setPresets] = useLocalStorage<{ id: string; name: string; data: any }[]>(
    "mvp.techno.presets",
    []
  );
  // 기본 모드: 핵심 그룹만 표시, Advanced 토글 시 전체
  const CORE_GROUP_IDS: GroupId[] = ["subgenre", "rhythm", "bass", "synths", "fx", "mix", "params"];
  // UI & interaction states (some persisted)
  const [advanced, setAdvanced] = useState(()=> localStorage.getItem('ui.advanced')==='1');
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<'en' | 'kr'>("en");
  const [compact, setCompact] = useState(()=> localStorage.getItem('ui.compact')==='1');
  const [horizontal, setHorizontal] = useState(()=> localStorage.getItem('ui.horizontal')==='1');
  const [dense, setDense] = useState(()=> localStorage.getItem('ui.dense')==='1');
  const [pinnedGroup, setPinnedGroup] = useState<string|undefined>();
  const [highlightIntensity, setHighlightIntensity] = useState<number>(Number(localStorage.getItem('ui.highlight') ?? 1));
  const [genreHover, setGenreHover] = useState(false);
  // Tag filtering
  const allTags = useMemo(()=> {
    const s = new Set<string>();
    for (const o of OPTIONS) (o as any).tags?.forEach((t:string)=> s.add(t));
    return [...s].sort();
  },[]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<'OR'|'AND'|'NOT'>('OR');
  // 추천 ID (테크노 핵심) – 향후 별도 파일로 분리 가능
  const [recTier, setRecTier] = useState<'core'|'advanced'|'all'>('core');
  const recommendedIds = useMemo(()=> getRecommendedSet('techno', recTier), [recTier]);
  // Dynamic tag-based recommendations (top 10)
  const dynamicRecommendations = useMemo(()=> {
    if (!selectedTags.length) return [] as any[];
    const chosen = new Set<string>();
    for (const g of ORDER) selections[g].forEach(id=> chosen.add(id));
    const scored: { opt:any; score:number }[] = [];
    for (const o of OPTIONS) {
      if (chosen.has(o.id)) continue;
      const tags = (o as any).tags || [];
      if (!tags.length) continue;
      const overlap = selectedTags.filter(t=> tags.includes(t));
      let modePass = true;
      if (tagMode==='AND' && selectedTags.some(t=> !tags.includes(t))) modePass=false;
      if (tagMode==='NOT' && selectedTags.some(t=> tags.includes(t))) modePass=false;
      if (!overlap.length || !modePass) continue;
      scored.push({ opt:o, score: overlap.length });
    }
    return scored.sort((a,b)=> b.score - a.score).slice(0,10).map(s=> s.opt);
  }, [selectedTags, selections, tagMode]);
  // 간단한 반응형 감지: 폭이 1280 미만이면 compact 제안
  useEffect(()=>{
    function handle(){
      if (window.innerWidth < 1280) setCompact(true);
    }
    handle();
    window.addEventListener('resize', handle);
    return ()=> window.removeEventListener('resize', handle);
  },[]);
  // Persist UI states
  useEffect(()=> { localStorage.setItem('ui.compact', compact? '1':'0'); }, [compact]);
  useEffect(()=> { localStorage.setItem('ui.horizontal', horizontal? '1':'0'); }, [horizontal]);
  useEffect(()=> { localStorage.setItem('ui.dense', dense? '1':'0'); }, [dense]);
  useEffect(()=> { localStorage.setItem('ui.highlight', String(highlightIntensity)); }, [highlightIntensity]);
  useEffect(()=> { localStorage.setItem('ui.advanced', advanced? '1':'0'); }, [advanced]);
  // 검색 중이면 강제로 확장 모드 (정보량 필요)
  useEffect(()=>{
    if (query.trim()) setCompact(false);
  },[query]);

  function exportPresets() {
    const data = JSON.stringify(presets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'techno-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  function importPresets(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(txt => {
      try {
        const parsed = JSON.parse(txt);
        if (Array.isArray(parsed)) {
          setPresets(parsed.concat(presets));
        }
      } catch {/* ignore parse error */}
    });
  }

  const prompt = useMemo(() => buildPrompt(selections, topic, bpm), [selections, topic, bpm]);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
  }

  function clearAll() {
    setSelections(emptyState());
    setTopic("");
    setBpm(undefined);
  }

  function savePreset() {
    const name = (topic || "Preset") + ` @${bpm ?? "?"}BPM`;
    const id = crypto.randomUUID();
    setPresets([{ id, name, data: { selections: serializeSelections(selections), topic, bpm } }, ...presets]);
  }

  function loadPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setSelections(deserializeSelections(p.data.selections));
    setTopic(p.data.topic || "");
    setBpm(p.data.bpm);
  }

  function deletePreset(id: string) {
    setPresets(presets.filter((x) => x.id !== id));
  }

  return (
    <div className="min-h-screen w-full bg-[#05070d] text-slate-100 relative overflow-x-hidden font-sans" data-theme={darkMode? 'dark':'light'}>
      {/* arcade grid background */}
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_50%_0,rgba(56,189,248,0.12),transparent_55%),linear-gradient(transparent_0,transparent_31px,rgba(255,255,255,0.04)_31px),linear-gradient(90deg,transparent_0,transparent_31px,rgba(255,255,255,0.04)_31px)] bg-[length:100%_100%,32px_32px,32px_32px]" />

      <header className="relative z-10 px-6 py-5 flex items-center justify-between backdrop-blur-md bg-white/5 border-b border-white/10"
        onMouseEnter={()=> setGenreHover(true)} onMouseLeave={()=> setGenreHover(false)}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-black tracking-[0.25em] text-transparent bg-clip-text drop-shadow-[0_0_12px_rgba(34,211,238,0.35)] transition ${genreHover? 'bg-gradient-to-r from-fuchsia-300 via-amber-300 to-cyan-300':'bg-gradient-to-r from-cyan-300 via-teal-200 to-fuchsia-300'}`}
        >
          TECHNO PROMPT GENERATOR
        </motion.h1>
        <div className="flex gap-2 items-center flex-wrap ios-cluster">
          <button onClick={savePreset} className="ios-bubble" data-variant="accent">{lang==='kr'? '프리셋 저장':'Save Preset'}</button>
          <button onClick={clearAll} className="ios-bubble">{lang==='kr'? '초기화':'Clear'}</button>
          <button onClick={()=> setCompact(c=>!c)} className="ios-bubble">{compact ? (lang==='kr'?'확장모드':'Expanded') : (lang==='kr'?'콤팩트':'Compact')}</button>
          <button onClick={()=> setHorizontal(h=>!h)} className="ios-bubble">{horizontal ? (lang==='kr'?'세로배치':'Vertical') : (lang==='kr'?'가로배치':'Horizontal')}</button>
          <button onClick={()=> setDense(d=>!d)} className="ios-bubble">{dense ? (lang==='kr'?'기본배치':'Normal') : (lang==='kr'?'밀집배치':'Dense')}</button>
          <div className="flex gap-1 ml-2">
            <button className="ios-bubble" title="Docs"><IconDocs size={16} /></button>
            <button className="ios-bubble" title="Theme" onClick={()=> setDarkMode(d=>!d)}>{darkMode? <IconSun size={16} /> : <IconMoon size={16} />}</button>
            <button className="ios-bubble" title="Settings"><IconSettings size={16} /></button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-1">
            <span>Rec</span>
            <select value={recTier} onChange={e=> setRecTier(e.target.value as any)} className="bg-slate-800/50 border border-slate-600 rounded px-1 py-0.5 text-[10px]">
              <option value="core">Core</option>
              <option value="advanced">Adv</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-1">
            <span>Tags</span>
            <select value={tagMode} onChange={e=> setTagMode(e.target.value as any)} className="bg-slate-800/50 border border-slate-600 rounded px-1 py-0.5 text-[10px]">
              <option value="OR">OR</option>
              <option value="AND">AND</option>
              <option value="NOT">NOT</option>
            </select>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-1">
            <span>Highlight</span>
            <input type="range" min={0} max={2} value={highlightIntensity} onChange={e=> setHighlightIntensity(Number(e.target.value))} className="accent-fuchsia-400" />
          </div>
        </div>
      </header>

      <main className="relative z-10 grid grid-cols-12 gap-6 px-6 pb-10">
        {/* Left: Controls */}
        <section className="col-span-12 lg:col-span-8">
          <div className="rounded-2xl bg-white/5 backdrop-blur-md p-5 border border-white/10 shadow-[0_0_32px_rgba(34,211,238,0.15)]">
            {!compact && !horizontal && (
              <div className={dense ? "grid md:grid-cols-2 gap-x-10" : "flex flex-col"}>
                {(advanced ? GROUPS : GROUPS.filter((g: any) => CORE_GROUP_IDS.includes(g.id))).map((g: any) => (
                  <div key={g.id} className={dense ? "mb-4 break-inside-avoid" : ""}>
                    <GroupBlock group={g} selections={selections} setSelections={setSelections} query={query} lang={lang} />
                  </div>
                ))}
              </div>
            )}
            {!compact && horizontal && (
              <div className="relative">
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent snap-x">
                  {(advanced ? GROUPS : GROUPS.filter((g: any) => CORE_GROUP_IDS.includes(g.id))).map((g: any) => (
                    <div key={g.id} className="min-w-[300px] snap-start flex-shrink-0">
                      <GroupBlock group={g} selections={selections} setSelections={setSelections} query={query} lang={lang} />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-y-0 left-0 w-8 pointer-events-none bg-gradient-to-r from-[#05070d] to-transparent" />
                <div className="absolute inset-y-0 right-0 w-8 pointer-events-none bg-gradient-to-l from-[#05070d] to-transparent" />
              </div>
            )}
            {compact && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(advanced ? GROUPS : GROUPS.filter((g: any) => CORE_GROUP_IDS.includes(g.id))).map((g: any) => (
                  <CompactGroup
                    key={g.id}
                    group={g}
                    lang={lang}
                    selections={selections}
                    setSelections={setSelections}
                    query={query}
                    pinned={pinnedGroup===g.id}
                    setPinned={(v)=> setPinnedGroup(v? g.id: undefined)}
                    highlightSet={recommendedIds}
                    highlightActive={genreHover}
                    highlightIntensity={highlightIntensity}
                  />
                ))}
              </div>
            )}
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setAdvanced(a => !a)}
                className="px-3 py-1 rounded-md border text-[11px] tracking-wide transition bg-slate-800/60 border-slate-600 hover:border-cyan-400 hover:text-cyan-200 backdrop-blur-sm"
              >
                {advanced ? 'Hide Advanced Groups' : 'Show All Advanced Groups'}
              </button>
            </div>

            {/* Tag Filter Chips */}
            {allTags.length>0 && (
              <div className="mt-4 flex flex-wrap gap-1">
                {allTags.map(t=> {
                  const active = selectedTags.includes(t);
                  return (
                    <button key={t} onClick={()=> setSelectedTags(s=> active? s.filter(x=> x!==t): [...s,t])}
                      className={`px-2 py-0.5 rounded-full text-[10px] border ${active? 'bg-fuchsia-600/30 border-fuchsia-400 text-fuchsia-100':'border-slate-600 text-slate-400 hover:border-cyan-400 hover:text-cyan-200'}`}>{t}</button>
                  );
                })}
                {selectedTags.length>0 && (
                  <button onClick={()=> setSelectedTags([])} className="px-2 py-0.5 rounded-full text-[10px] border border-slate-600 text-slate-400 hover:border-pink-400 hover:text-pink-200">Clear</button>
                )}
              </div>
            )}

            {/* Search / Lang / Preset IO */}
            <div className="mt-6 grid gap-4 md:grid-cols-3 text-[11px]">
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider text-slate-400">Search</label>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={lang==='kr' ? '옵션 검색...' : 'Search options...'}
                  className="bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 backdrop-blur-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider text-slate-400">Lang</label>
                <select
                  value={lang}
                  onChange={e=> setLang(e.target.value as any)}
                  className="bg-slate-800/50 border border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400 backdrop-blur-sm"
                >
                  <option value="en">English</option>
                  <option value="kr">한국어</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider text-slate-400">Preset I/O</label>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={exportPresets} className="px-3 py-1 rounded bg-slate-700/50 hover:bg-slate-600/60 border border-slate-500/70 backdrop-blur-sm">Export</button>
                  <label className="px-3 py-1 rounded bg-slate-700/50 hover:bg-slate-600/60 border border-slate-500/70 cursor-pointer backdrop-blur-sm">
                    Import
                    <input type="file" accept="application/json" className="hidden" onChange={importPresets} />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Exact BPM</label>
                <input
                  type="number"
                  min={60}
                  max={200}
                  step={1}
                  value={bpm ?? ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v)) setBpm(Math.max(60, Math.min(200, Math.round(v))));
                    else setBpm(undefined);
                  }}
                  placeholder="e.g., 128"
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 backdrop-blur-sm"
                />
                <p className="text-[10px] text-slate-500 mt-1">범위 60–200, 정수 입력. 정확히 프롬프트에 반영됩니다.</p>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Theme / Prompt Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., late-night city drive, neon rain"
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right: Preview & Presets */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="rounded-2xl bg-white/5 backdrop-blur-md p-4 border border-white/10 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
            <h3 className="text-sm uppercase tracking-widest text-cyan-200/90 mb-2">Preview</h3>
            <div className="min-h-[160px] text-sm leading-relaxed bg-black/30 rounded-xl p-3 border border-slate-700">
              {prompt || <span className="text-slate-500">Your techno prompt will appear here…</span>}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={copyPrompt} className="ios-pill" style={{['--mx' as any]:'40%', ['--my' as any]:'35%'}}>Copy</button>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 backdrop-blur-md p-4 border border-white/10 shadow-[0_0_28px_rgba(217,70,239,0.15)]">
            <h3 className="text-sm uppercase tracking-widest text-fuchsia-200/90 mb-2">Presets</h3>
            <ul className="space-y-2 max-h-[260px] overflow-auto pr-1">
              {presets.length === 0 && (
                <li className="text-xs text-slate-400">No presets yet. Save your first build!</li>
              )}
              {presets.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 bg-black/30 border border-slate-700 rounded-lg px-2 py-1.5">
                  <button onClick={() => loadPreset(p.id)} className="text-left text-xs hover:text-cyan-200 truncate">
                    {p.name}
                  </button>
                  <button onClick={() => deletePreset(p.id)} className="text-[10px] text-slate-400 hover:text-pink-300">delete</button>
                </li>
              ))}
            </ul>
          </div>

          {dynamicRecommendations.length>0 && (
            <div className="rounded-2xl bg-white/5 backdrop-blur-md p-4 border border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <h3 className="text-sm uppercase tracking-widest text-cyan-200/80 mb-2">Dynamic Recs</h3>
              <div className="flex flex-wrap gap-2">
                {dynamicRecommendations.map(o=> (
                  <button key={o.id} onClick={()=> {
                    setSelections(prev=> { const copy: any = { ...prev }; const set = new Set(copy[o.group]); set.add(o.id); copy[o.group] = set; return copy; });
                  }} className="px-2 py-1 rounded-full text-[11px] border border-slate-600 hover:border-cyan-400 text-slate-300 hover:text-cyan-200">{o.label}</button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Based on tag overlap & mode.</p>
            </div>
          )}
        </aside>
      </main>

      <footer className="relative z-10 px-6 pb-6 text-[10px] text-slate-500 tracking-widest uppercase">
        Schema-first • Glass UI • Search + i18n • Export / Import Presets • © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// ---------------------- Serialization helpers ----------------------
function serializeSelections(selections: Record<GroupId, Set<string>>) {
  return Object.fromEntries(Object.entries(selections).map(([k, v]) => [k, [...(v as Set<string>)] ]));
}

function deserializeSelections(obj: any): Record<GroupId, Set<string>> {
  const s = emptyState();
  for (const k of Object.keys(s)) {
    const list = obj?.[k] ?? [];
  // @ts-expect-error: dynamic reconstruction of selections from parsed object
  s[k] = new Set(list);
  }
  return s;
}
