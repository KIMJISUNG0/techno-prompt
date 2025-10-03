import React from 'react';
import { IntentInput, clampIntensity } from '../../intent/types';
import { recommendGenres } from '../../intent/recommend';
import { buildDefaultDraft, serializeDraft } from '../../prompt/sectionDsl';
import { analyzeDraftForExpert } from '../../prompt/expertHints';
import { evaluateDraft } from '../../prompt/quality';
import { exportPrompt } from '../../prompt/promptExport';
import { PROG_CATEGORIES, ProgCategory } from '../../progressive/progressiveCategories';

/**
 * UnifiedComposer (Phase 0 Scaffold)
 * ----------------------------------
 * 목표: 기존 Quick(Expert) + Progressive(Abstract) 흐름을 하나의 3-탭 레이아웃으로 통합하기 위한 최소 골격.
 * 현재 단계: 상태 컨테이너 + Intent + 장르추천 + 탭 전환 + Draft 시드 + 품질/힌트 패널.
 * 향후:
 *  - Abstract Layer: progressive category token picker 이식
 *  - Instrument Layer: 역할별 descriptor 슬롯 + descriptor 정규화/자동채우기
 *  - Structure Layer: 섹션 타임라인 + 에너지 커브 편집 (QuickComposer section editor 확장)
 *  - Bridge: abstractTokens -> seed draft roles (seedRoles) 변환 파이프
 *  - Auto-Fill / Gap-Fill 명령 + Mic Texture layer toggle + 변환 로그 메타 확장
 */

type TabId = 'abstract'|'instrument'|'structure';

export default function UnifiedComposer(){
  // Intent
  const [moodsRaw, setMoodsRaw] = React.useState('dark, hypnotic');
  const [useCase, setUseCase] = React.useState<IntentInput['useCase']>();
  const [era, setEra] = React.useState<IntentInput['era']>('modern');
  const [intensity, setIntensity] = React.useState(4);
  const [durationSec, setDurationSec] = React.useState(210); // single field for now

  // Genre & hybrid (future: multiple selection for hybrid)
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);

  // Abstract tokens (category→token[]) placeholder (later: progressive categories reuse)
  const [abstractTokens, setAbstractTokens] = React.useState<Record<string,string[]>>({});
  const [abstractFilter, setAbstractFilter] = React.useState('');
  const [abstractMode, setAbstractMode] = React.useState<'flat'|'group'>('flat');

  // Draft & evaluation
  const [draft, setDraft] = React.useState<ReturnType<typeof buildDefaultDraft>|null>(null);
  const [serialized, setSerialized] = React.useState('');
  const [quality, setQuality] = React.useState<ReturnType<typeof evaluateDraft>|null>(null);
  const [expertHints, setExpertHints] = React.useState<ReturnType<typeof analyzeDraftForExpert>|null>(null);

  // UI
  const [tab, setTab] = React.useState<TabId>('abstract');
  const [showIntent, setShowIntent] = React.useState(false); // 기본 접힘
  const [autoSeed, setAutoSeed] = React.useState(true); // Top1 장르 자동 선택 & draft 자동 시드

  const intent: IntentInput = React.useMemo(()=> ({
    moods: moodsRaw.split(/[\n,]/).map(m=> m.trim()).filter(Boolean),
    useCase,
    era,
    intensity: clampIntensity(intensity),
    durationSec,
  }), [moodsRaw,useCase,era,intensity,durationSec]);

  const rec = React.useMemo(()=> recommendGenres(intent), [intent.moods.join(','), useCase, era, intensity, durationSec]);

  // Auto pick top1 genre if none selected
  React.useEffect(()=> {
    if (!autoSeed) return;
    if (!selectedGenres.length && rec.candidates[0]) {
      setSelectedGenres([rec.candidates[0].genre]);
    }
  }, [autoSeed, rec.candidates.map(c=> c.genre).join(',' )]);

  // Auto seed draft when first genre locked
  React.useEffect(()=> {
    if (!autoSeed) return;
    if (selectedGenres.length === 1 && !draft) {
      seedDraft();
    }
  }, [autoSeed, selectedGenres.join(','), draft]);

  function toggleGenre(g: string){
    setSelectedGenres(list => list.includes(g) ? list.filter(x=> x!==g) : [...list, g]);
  }

  function seedDraft(){
    const d = buildDefaultDraft(intent, {});
    setDraft(d);
    const ser = serializeDraft(d);
    setSerialized(ser);
    setQuality(evaluateDraft(d));
    setExpertHints(analyzeDraftForExpert(d));
  }

  function resetAll(){
    setSelectedGenres([]);
    setDraft(null); setSerialized(''); setQuality(null); setExpertHints(null);
    setAbstractTokens({});
  }

  // Abstract → Instrument 브리지 (간단 버전): 선택된 모든 토큰을 각 역할 descriptor 앞에 프리픽스 (중복 방지)
  function applyAbstractToRoles(){
    if (!draft) return;
    const allTokens = Object.values(abstractTokens).flat();
    if (!allTokens.length) return;
    const tokenPrefix = Array.from(new Set(allTokens)).slice(0,12).join(' '); // 과도 길이 제한
    const next = { ...draft, sections: draft.sections.map(sec => ({
      ...sec,
      roles: Object.fromEntries(Object.entries(sec.roles).map(([r,desc])=> {
        const clean = desc.replace(/^\s+|\s+$/g,'');
        if (clean.startsWith(tokenPrefix.split(' ')[0])) return [r, clean];
        return [r, (tokenPrefix + ' ' + clean).trim()];
      }))
    })) } as typeof draft;
    setDraft(next);
    const ser = serializeDraft(next);
    setSerialized(ser);
    setQuality(evaluateDraft(next));
    setExpertHints(analyzeDraftForExpert(next));
  }

  function toggleAbstractToken(catId: string, tokenId: string){
    setAbstractTokens(s => {
      const cur = new Set(s[catId]||[]);
      if (cur.has(tokenId)) cur.delete(tokenId); else cur.add(tokenId);
      return { ...s, [catId]: Array.from(cur) };
    });
  }

  function renderCategoryFlat(cat: ProgCategory){
    const picked = abstractTokens[cat.id]||[];
    const filteredTokens = cat.tokens.filter(tok => !abstractFilter || tok.label.toLowerCase().includes(abstractFilter.toLowerCase()));
    if (!filteredTokens.length) return null;
    return (
      <div key={cat.id} className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
          <span>{cat.label}</span>
          <span className="text-slate-600 lowercase">{picked.length}{cat.max? '/' + cat.max:''}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filteredTokens.map(tok => {
            const on = picked.includes(tok.id);
            return (
              <button type="button" key={tok.id} onClick={()=> toggleAbstractToken(cat.id, tok.id)} title={tok.hint||''} className={`px-2 py-[3px] rounded border text-[10px] ${on? 'border-cyan-400 text-cyan-200 bg-cyan-600/20':'border-slate-600 text-slate-300 hover:border-cyan-400'}`}>{tok.label}</button>
            );
          })}
        </div>
      </div>
    );
  }

  // Panels -----------------------------------------------------------------
  function renderAbstractTab(){
    const cats = PROG_CATEGORIES; // 확장 포함
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center text-[10px]">
          <input value={abstractFilter} onChange={e=> setAbstractFilter(e.target.value)} placeholder="filter tokens" className="px-2 py-[4px] rounded border border-slate-600 bg-slate-900/40 focus:outline-none focus:border-cyan-400 text-[10px]" />
          <button onClick={()=> setAbstractMode(m=> m==='flat'?'group':'flat')} className="px-2 py-[4px] rounded border border-slate-600 hover:border-cyan-400">Mode: {abstractMode}</button>
          <button disabled={!draft} onClick={applyAbstractToRoles} className={`px-2 py-[4px] rounded border text-[10px] ${draft? 'border-emerald-400 text-emerald-200 bg-emerald-600/10':'border-slate-700 text-slate-600 cursor-not-allowed'}`}>Apply → Roles</button>
          <button onClick={()=> setAbstractTokens({})} className="px-2 py-[4px] rounded border border-slate-600 text-[10px] hover:border-amber-400">Clear</button>
          <div className="text-slate-500">선택 토큰 수: {Object.values(abstractTokens).reduce((a,b)=> a + b.length,0)}</div>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cats.map(cat => renderCategoryFlat(cat))}
        </div>
      </div>
    );
  }
  function renderInstrumentTab(){
    return (
      <div className="space-y-3">
        {draft? <div className="text-[11px] text-slate-500">Draft roles 편집 UI 예정 (descriptor 정규화 / gap-fill)</div> : <div className="text-[11px] text-slate-600">Draft 먼저 생성</div>}
      </div>
    );
  }
  function renderStructureTab(){
    return (
      <div className="space-y-3">
        {draft? <div className="text-[11px] text-slate-500">Structure timeline / energy curve editor 예정</div> : <div className="text-[11px] text-slate-600">Draft 먼저 생성</div>}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <header className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wider text-slate-200">Unified Composer (Scaffold)</h1>
          <p className="text-[11px] text-slate-500 mt-1">장르/Intent + Abstract · Instrument · Structure 통합 실험 레이아웃 – 단계적 이식.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={resetAll} className="btn">Reset</button>
          {draft && <button onClick={()=> draft && navigator.clipboard.writeText(exportPrompt(draft))} className="btn btn-accent">Copy Prompt</button>}
          {draft && <button onClick={()=> navigator.clipboard.writeText(serialized)} className="btn">Copy Draft</button>}
        </div>
      </header>

      {/* Intent & Genre Selection Row */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-widest text-cyan-300">Intent & Genres</h2>
          <button onClick={()=> setShowIntent(s=> !s)} className="px-2 py-[3px] rounded border border-slate-600 text-[10px] text-slate-300 hover:border-cyan-400">{showIntent? 'Hide':'Show'}</button>
        </div>
        {showIntent && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-slate-400">Moods</label>
            <textarea value={moodsRaw} onChange={e=> setMoodsRaw(e.target.value)} rows={3} className="w-full text-sm rounded border border-slate-700 bg-slate-900/40 px-3 py-2 focus:outline-none focus:border-cyan-400" />
            <div className="text-[10px] text-slate-500">쉼표/줄바꿈 분리 – 1번째 mood bias</div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Use Case</label>
              <input value={useCase||''} onChange={e=> {
                const v = e.target.value.trim();
                setUseCase(v? (v as any) : undefined);
              }} placeholder="club / game" className="w-full text-sm rounded border border-slate-700 bg-slate-900/40 px-2 py-1 focus:outline-none focus:border-cyan-400" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Era</label>
              <select value={era} onChange={e=> setEra(e.target.value as any)} className="w-full text-sm rounded border border-slate-700 bg-slate-900/40 px-2 py-1 focus:outline-none focus:border-cyan-400">
                {['90s','2000s','modern','futuristic'].map(ea=> <option key={ea} value={ea}>{ea}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Intensity {intensity}</label>
              <input type="range" min={1} max={5} value={intensity} onChange={e=> setIntensity(Number(e.target.value))} className="w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Approx Duration (sec)</label>
              <input type="number" value={durationSec} onChange={e=> setDurationSec(Math.max(30, Number(e.target.value)||durationSec))} className="w-full text-sm rounded border border-slate-700 bg-slate-900/40 px-2 py-1 focus:outline-none focus:border-cyan-400" />
            </div>
            <div className="text-[11px] text-slate-500 border border-slate-700 rounded p-2 bg-slate-900/30">
              <div><span className="text-slate-400">Moods:</span> {intent.moods.join(', ')||'—'}</div>
              <div><span className="text-slate-400">Candidates:</span> {rec.candidates.length}</div>
              <div><span className="text-slate-400">Issues:</span> {rec.issues.join('; ')||'none'}</div>
            </div>
          </div>
        </div>)}
        <div className="space-y-2">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-3">Genre / Hybrid Picks
            <label className="flex items-center gap-1 text-[10px] font-normal text-slate-500 cursor-pointer select-none"><input type="checkbox" checked={autoSeed} onChange={e=> setAutoSeed(e.target.checked)} /> auto-seed</label>
          </h3>
          <div className="flex flex-wrap gap-2">
            {rec.candidates.slice(0,18).map(c => {
              const on = selectedGenres.includes(c.genre);
              return (
                <button key={c.genre} onClick={()=> toggleGenre(c.genre)} className={`px-3 py-1 rounded border text-[11px] transition ${on? 'border-cyan-400 text-cyan-200 bg-cyan-600/20':'border-slate-600 text-slate-300 hover:border-cyan-400'}`}>
                  {c.genre}<span className="ml-1 text-[9px] text-slate-500">{(c.confidence*100).toFixed(0)}%</span>
                </button>
              );
            })}
            {rec.candidates.length===0 && <div className="text-[11px] text-slate-500">No genre candidates</div>}
          </div>
          <div className="text-[10px] text-slate-500">선택: {selectedGenres.join(', ')||'—'} (hybrid 시퀀스)</div>
          {!autoSeed && (<button disabled={!selectedGenres.length} onClick={seedDraft} className={`mt-1 px-4 py-1.5 rounded border text-xs ${selectedGenres.length? 'border-emerald-400 text-emerald-200 bg-emerald-600/10':'border-slate-700 text-slate-600 cursor-not-allowed'}`}>Seed Draft</button>)}
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['abstract','instrument','structure'] as TabId[]).map(t => (
            <button key={t} onClick={()=> setTab(t)} className={`px-3 py-1 rounded border text-[11px] ${tab===t? 'border-cyan-400 text-cyan-200 bg-cyan-600/20':'border-slate-600 text-slate-300 hover:border-cyan-400'}`}>{t}</button>
          ))}
        </div>
        <div className="rounded border border-slate-700 p-4 bg-black/30 min-h-[140px]">
          {tab==='abstract' && renderAbstractTab()}
          {tab==='instrument' && renderInstrumentTab()}
          {tab==='structure' && renderStructureTab()}
        </div>
      </section>

      {/* Live Dock (Prompt + Quality + Hints) */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Prompt Preview</h3>
          <pre className="text-[10px] leading-relaxed bg-black/50 border border-slate-700 rounded p-2 max-h-72 overflow-auto whitespace-pre-wrap">{draft? exportPrompt(draft): '—'}</pre>
        </div>
        <div className="space-y-2">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Quality</h3>
            {quality? (
              <div className="text-[10px] space-y-1 border border-slate-700 rounded p-2 bg-slate-900/30">
                <div className="flex justify-between"><span className="text-slate-400">Score</span><span className={quality.score<70? 'text-amber-300':'text-emerald-300'}>{quality.score}</span></div>
                <div className="text-slate-500">Adj {quality.tokenCounts.adjectives} / Unique {quality.tokenCounts.uniqueAdjectives}</div>
                <ul className="list-disc ml-4 space-y-1">
                  {quality.issues.map(i=> <li key={i.code} className={i.severity==='warn'? 'text-amber-300':'text-slate-400'}>{i.message}</li>)}
                  {quality.issues.length===0 && <li className="text-emerald-300">No issues</li>}
                </ul>
              </div>
            ): <div className="text-[10px] text-slate-500">Draft 없음</div>}
        </div>
        <div className="space-y-2">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Expert Hints</h3>
          {expertHints? (
            <div className="text-[10px] space-y-2 max-h-72 overflow-auto border border-slate-700 rounded p-2 bg-slate-900/30">
              <div className="text-slate-500">{expertHints.energyImbalance}</div>
              {expertHints.missingRoles.length>0 && <div><span className="text-slate-400">Missing:</span> {expertHints.missingRoles.join(', ')}</div>}
              {expertHints.underusedHighEnergy.length>0 && <div><span className="text-slate-400">Sparse HE:</span> {expertHints.underusedHighEnergy.join(', ')}</div>}
              {expertHints.descriptorRepetition.length>0 && <div className="text-slate-400">Repetition: <span className="text-slate-500">{expertHints.descriptorRepetition.map(r=> r.token+"("+r.count+")").join(', ')}</span></div>}
              <ul className="list-disc ml-4 space-y-1">
                {expertHints.suggestions.map((s,i)=> <li key={i} className="text-slate-300">{s}</li>)}
              </ul>
            </div>
          ): <div className="text-[10px] text-slate-500">Draft 없음</div>}
        </div>
      </section>
    </div>
  );
}
