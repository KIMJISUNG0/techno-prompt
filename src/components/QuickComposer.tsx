import React, { useState, useMemo } from 'react';
import { IntentInput, clampIntensity } from '../intent/types';
import { recommendGenres } from '../intent/recommend';
import { buildDefaultDraft, serializeDraft, draftSummary, parseDraft } from '../prompt/sectionDsl';
import { draftToPatterns } from '../prompt/patternMap';
import { applySlashCommand } from '../prompt/transforms';
import { exportPrompt } from '../prompt/promptExport';
import { analyzeDraftForExpert } from '../prompt/expertHints';
import { evaluateDraft } from '../prompt/quality';

interface TransformLogEntry {
  note: string;
  serialized: string;
  ts: number;
}

const ERA_OPTIONS = ['90s','2000s','modern','futuristic'] as const;
const USECASE_OPTIONS = ['club','cinematic','lofi','game','ambient','pop'] as const;

export default function QuickComposer() {
  // Intent raw state
  const [moodsRaw, setMoodsRaw] = useState('dark, hypnotic');
  const [useCase, setUseCase] = useState<IntentInput['useCase']>();
  const [era, setEra] = useState<IntentInput['era']>('modern');
  const [intensity, setIntensity] = useState(4);
  const [durationMin, setDurationMin] = useState(3);
  const [durationSec, setDurationSec] = useState(30);

  // Recommendation + draft
  const [selectedGenre, setSelectedGenre] = useState<string|undefined>();
  const [draft, setDraft] = useState<ReturnType<typeof buildDefaultDraft> | null>(null);
  const [serialized, setSerialized] = useState<string>('');
  const [slashInput, setSlashInput] = useState('');
  const [log, setLog] = useState<TransformLogEntry[]>([]);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [quality, setQuality] = useState<ReturnType<typeof evaluateDraft> | null>(null);
  const [micTexture, setMicTexture] = useState(false); // placeholder (no engine glue yet)
  // Variation slots (simple in-memory snapshots)
  const [variations, setVariations] = useState<{ id: string; label: string; serialized: string }[]>([]);
  const [expertHints, setExpertHints] = useState<ReturnType<typeof analyzeDraftForExpert>|null>(null);
  // Undo/Redo stacks (store serialized snapshots)
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Simple Mode handoff removed

  // Build intent object
  const intent: IntentInput = useMemo(() => ({
    moods: moodsRaw.split(/[,\n]/).map(m=> m.trim()).filter(Boolean),
    useCase,
    era,
    intensity: clampIntensity(intensity),
    durationSec: durationMin * 60 + durationSec,
  }), [moodsRaw,useCase,era,intensity,durationMin,durationSec]);

  const rec = useMemo(()=> recommendGenres(intent), [intent.moods.join(','), useCase, era, intensity, durationMin, durationSec]);

  function generateDraft() {
    const d = buildDefaultDraft(intent, { targetBars: undefined });
    setDraft(d);
    const ser = serializeDraft(d);
    setSerialized(ser);
    setLog([{ note: 'Initial draft', serialized: ser, ts: Date.now() }]);
    setQuality(evaluateDraft(d));
    setUndoStack([]); setRedoStack([]);
    dispatchPatterns(d);
    setExpertHints(analyzeDraftForExpert(d));
  }

  function applySlash() {
    if (!draft) return;
    const res = applySlashCommand(draft, slashInput.trim());
    if (!res) return;
    const serBefore = serialized;
    const ser = serializeDraft(res.draft);
    setDraft(res.draft);
    setSerialized(ser);
    setLog(l => [...l, { note: res.note, serialized: ser, ts: Date.now() }]);
    setSlashInput('');
    setQuality(evaluateDraft(res.draft));
    setUndoStack(st => [...st, serBefore]);
    setRedoStack([]);
    dispatchPatterns(res.draft);
    setExpertHints(analyzeDraftForExpert(res.draft));
  }

  function resetAll() {
    setSelectedGenre(undefined);
    setDraft(null);
    setSerialized('');
    setLog([]);
    setVariations([]);
    setQuality(null);
  }

  function updateSection(idx: number, patch: any) {
    if (!draft) return;
    const before = serialized;
    const next: any = { ...draft, sections: draft.sections.map((s,i)=> i===idx? { ...s, ...patch }: s) };
    setDraft(next as any);
    const ser = serializeDraft(next as any);
    setSerialized(ser);
    setLog(l => [...l, { note: `Manual edit section ${idx}`, serialized: ser, ts: Date.now() }]);
    setQuality(evaluateDraft(next as any));
    setUndoStack(st => [...st, before]);
    setRedoStack([]);
    dispatchPatterns(next);
  }

  function saveVariation() {
    if (!serialized) return;
    const id = 'v' + (variations.length + 1);
    setVariations(v => [...v, { id, label: `Var ${v.length + 1}`, serialized }]);
  }

  function loadVariation(id: string) {
    const v = variations.find(x => x.id === id);
    if (!v) return;
    setSerialized(v.serialized);
    const parsed = parseDraft(v.serialized);
    if (parsed) {
      setDraft(parsed as any);
      setQuality(evaluateDraft(parsed as any));
      dispatchPatterns(parsed as any);
      setExpertHints(analyzeDraftForExpert(parsed as any));
    }
  }

  function exportStub() {
    if (!draft) return;
    const mapping = draft.sections.map(sec => exportPatternsForSection(sec)).join('\n');
    const code = `// Exported Pattern Stub\n// Sections: ${draft.sections.length}\n// Generated simplistic role patterns (placeholder)\n${mapping}\n`; 
    navigator.clipboard.writeText(code + '\n' + serialized);
  }

  function undo() {
    if (!undoStack.length) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(r => [...r, serialized]);
    setSerialized(last);
    const parsed = parseDraft(last);
    if (parsed) { setDraft(parsed as any); setQuality(evaluateDraft(parsed as any)); }
  }

  function redo() {
    if (!redoStack.length) return;
    const nextSer = redoStack[redoStack.length - 1];
    setRedoStack(r => r.slice(0, -1));
    setUndoStack(u => [...u, serialized]);
    setSerialized(nextSer);
    const parsed = parseDraft(nextSer);
    if (parsed) { setDraft(parsed as any); setQuality(evaluateDraft(parsed as any)); }
  }

  function dispatchPatterns(d: any){
    try {
      const payload = draftToPatterns(d);
      window.dispatchEvent(new CustomEvent('draft.patterns.update', { detail: payload }));
    } catch { /* silent */ }
  }

  function exportPatternsForSection(sec: any): string {
    // extremely naive pattern suggestion (future: intensity→density scaling)
    // pattern DSL v2: use C3 / . / _ etc.
    const kickDsl = sec.energy >=4 ? 'C2 . C2 . C2 . C2 .' : 'C2 . . . C2 . . .';
    const hatDsl = sec.energy >=4 ? 'x.x.x.x.x.x.x.x.' : 'x.x. . x.x. .';
    const bassDsl = sec.energy >=4 ? 'C2_ . . G2_ . .' : 'C2 . . . G2 . . .';
    return `// ${sec.id} (${sec.kind}) energy=${sec.energy}\nPATTERN ${sec.id} KICK ${kickDsl}\nPATTERN ${sec.id} HAT ${hatDsl}\nPATTERN ${sec.id} BASS ${bassDsl}`;
  }

  // Dispatch mic texture placeholder event
  if (typeof window !== 'undefined') {
    // fire lightweight event when toggled
    (window as any).__micTexture = micTexture;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      <header className="flex flex-wrap gap-4 items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wider text-slate-200">Quick Composer</h1>
          <p className="text-[11px] text-slate-500 mt-1">Step 1: Enter minimal intent. Step 2: Pick a recommended genre. Step 3: Generate draft & refine with slash commands.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={resetAll} className="btn">Reset</button>
          {draft && <>
            <button onClick={()=> navigator.clipboard.writeText(serialized)} className="btn btn-accent">Copy Draft</button>
            <button onClick={()=> draft && navigator.clipboard.writeText(exportPrompt(draft))} className="btn">Copy Prompt</button>
            <button onClick={saveVariation} className="btn">Save Var</button>
            <button onClick={undo} disabled={!undoStack.length} className={`btn ${!undoStack.length? 'opacity-40 cursor-not-allowed':''}`}>Undo</button>
            <button onClick={redo} disabled={!redoStack.length} className={`btn ${!redoStack.length? 'opacity-40 cursor-not-allowed':''}`}>Redo</button>
            <button onClick={exportStub} className="btn">Export Stub</button>
          </>}
        </div>
      </header>

      {/* Intent Input */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-cyan-300">Intent</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-slate-400">Moods</label>
            <textarea value={moodsRaw} onChange={e=> setMoodsRaw(e.target.value)} rows={3} className="w-full text-sm rounded border border-slate-700 bg-slate-900/40 px-3 py-2 focus:outline-none focus:border-cyan-400" placeholder="dark, hypnotic" />
            <div className="text-[10px] text-slate-500">Comma / newline separated. First mood biases descriptors.</div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Use Case</label>
              <select value={useCase||''} onChange={e=> setUseCase(e.target.value? e.target.value as any: undefined)} className="w-full text-sm rounded border border-slate-700 bg-slate-900/40 px-2 py-1 focus:outline-none focus:border-cyan-400">
                <option value="">(none)</option>
                {USECASE_OPTIONS.map(u=> <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Era</label>
              <select value={era} onChange={e=> setEra(e.target.value as any)} className="w-full text-sm rounded border border-slate-700 bg-slate-900/40 px-2 py-1 focus:outline-none focus:border-cyan-400">
                {ERA_OPTIONS.map(ea=> <option key={ea} value={ea}>{ea}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Intensity: {intensity}</label>
              <input type="range" min={1} max={5} value={intensity} onChange={e=> setIntensity(Number(e.target.value))} className="w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Duration</label>
              <div className="flex items-center gap-2">
                <input type="number" value={durationMin} onChange={e=> setDurationMin(Math.max(0, Number(e.target.value)||0))} className="w-20 text-sm rounded border border-slate-700 bg-slate-900/40 px-2 py-1 focus:outline-none focus:border-cyan-400" />
                <span className="text-slate-500 text-xs">min</span>
                <input type="number" value={durationSec} onChange={e=> { let v=Number(e.target.value)||0; if(v<0) v=0; if(v>59) v=59; setDurationSec(v); }} className="w-20 text-sm rounded border border-slate-700 bg-slate-900/40 px-2 py-1 focus:outline-none focus:border-cyan-400" />
                <span className="text-slate-500 text-xs">sec</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed border border-slate-700 rounded p-2 bg-slate-900/30">
              <div><span className="text-slate-400">Moods:</span> {intent.moods.join(', ')||'—'}</div>
              <div><span className="text-slate-400">Coverage:</span> {rec.candidates.length? rec.candidates[0].moodCoverage.toFixed(2):'—'}</div>
              <div><span className="text-slate-400">Issues:</span> {rec.issues.length? rec.issues.join('; '):'none'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-cyan-300">Recommended Genres</h2>
        <div className="flex flex-wrap gap-2">
          {rec.candidates.map(c => {
            const on = selectedGenre === c.genre;
            return (
              <button key={c.genre} onClick={()=> setSelectedGenre(c.genre)} className={`px-3 py-1 rounded border text-xs transition ${on? 'border-cyan-400 text-cyan-200 bg-cyan-600/10':'border-slate-600 text-slate-300 hover:border-cyan-400'}`}>
                <span className="font-medium">{c.genre}</span>
                <span className="ml-2 text-[10px] text-slate-500">{(c.confidence*100).toFixed(0)}%</span>
              </button>
            );
          })}
          {rec.candidates.length === 0 && <div className="text-[11px] text-slate-500">No candidates – adjust moods.</div>}
        </div>
        <div className="text-[11px] text-slate-500">
          {selectedGenre ? `Selected: ${selectedGenre}` : 'Pick a genre to enable draft generation.'}
        </div>
        <button disabled={!selectedGenre} onClick={generateDraft} className={`mt-2 px-4 py-1.5 rounded border text-xs ${selectedGenre? 'border-emerald-400 text-emerald-200 bg-emerald-600/10 hover:brightness-110':'border-slate-700 text-slate-600 cursor-not-allowed'}`}>Generate Draft</button>
      </section>

      {/* Draft View */}
      {draft && (
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-cyan-300">Draft Structure</h2>
          <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 items-center">
            <span>{draftSummary(draft)}</span>
            <button onClick={()=> setShowSectionEditor(s=> !s)} className="px-2 py-[2px] rounded border border-slate-600 hover:border-cyan-400 text-[10px] text-slate-300">{showSectionEditor? 'Hide Section Editor':'Edit Sections'}</button>
            <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
              <input type="checkbox" checked={micTexture} onChange={e=> setMicTexture(e.target.checked)} /> mic texture (placeholder)
            </label>
          </div>
          {showSectionEditor && (
            <div className="rounded border border-slate-700 p-3 bg-black/30 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Section Editor (length / energy)</div>
              <div className="flex flex-col gap-2">
                {draft.sections.map((sec,i)=>(
                  <div key={sec.id} className="flex flex-wrap gap-2 items-center text-[10px]">
                    <span className="font-mono text-slate-500 w-16">{sec.id}</span>
                    <span className="w-14">{sec.kind}</span>
                    <label className="flex items-center gap-1">bars
                      <input type="number" value={sec.bars} onChange={e=> updateSection(i,{ bars: Math.max(1, Number(e.target.value)||sec.bars) })} className="w-16 bg-slate-900/50 border border-slate-600 rounded px-1 py-[2px]" />
                    </label>
                    <label className="flex items-center gap-1">energy
                      <input type="number" min={1} max={5} value={sec.energy} onChange={e=> updateSection(i,{ energy: Math.min(5, Math.max(1, Number(e.target.value)||sec.energy)) as any })} className="w-14 bg-slate-900/50 border border-slate-600 rounded px-1 py-[2px]" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="overflow-x-auto rounded border border-slate-700 bg-black/30">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">ID</th>
                  <th className="px-2 py-1 text-left font-medium">Kind</th>
                  <th className="px-2 py-1 text-left font-medium">Bars</th>
                  <th className="px-2 py-1 text-left font-medium">Energy</th>
                  <th className="px-2 py-1 text-left font-medium">Roles (snippet)</th>
                </tr>
              </thead>
              <tbody>
                {draft.sections.map(sec => (
                  <tr key={sec.id} className="border-t border-slate-700/60 hover:bg-white/5">
                    <td className="px-2 py-1 font-mono text-slate-500">{sec.id}</td>
                    <td className="px-2 py-1">{sec.kind}</td>
                    <td className="px-2 py-1">{sec.bars}</td>
                    <td className="px-2 py-1">{sec.energy}</td>
                    <td className="px-2 py-1 text-slate-400">
                      <div className="flex flex-wrap gap-1 max-w-xl">
                        {Object.entries(sec.roles).slice(0,8).map(([role, desc]) => (
                          <span key={role} className="px-1.5 py-[1px] rounded bg-slate-800/70 border border-slate-600/70 text-[10px]">{role}:{desc.split(/\s+/).slice(0,4).join(' ')}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-slate-400">Slash Command</label>
            <div className="flex gap-2">
              <input value={slashInput} onChange={e=> setSlashInput(e.target.value)} onKeyDown={e=> { if(e.key==='Enter') { applySlash(); } }} placeholder="/brighten or /punch or /raise intro_..." className="flex-1 text-sm rounded border border-slate-700 bg-slate-900/40 px-3 py-1.5 focus:outline-none focus:border-cyan-400" />
              <button onClick={applySlash} disabled={!slashInput.trim().startsWith('/')} className={`px-3 py-1.5 rounded border text-xs ${slashInput.trim().startsWith('/')? 'border-cyan-400 text-cyan-200 bg-cyan-600/10':'border-slate-700 text-slate-600 cursor-not-allowed'}`}>Apply</button>
            </div>
            <div className="text-[10px] text-slate-500">Examples: /brighten • /punch • /raise intro_0 drop_2 • /replace find=dark replace=bright</div>
          </div>

          <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Serialized Draft</h3>
                <button onClick={()=> navigator.clipboard.writeText(serialized)} className="px-2 py-[3px] rounded border border-slate-600 hover:border-emerald-400 text-[10px] text-slate-300">Copy</button>
              </div>
              <pre className="text-[10px] leading-relaxed bg-black/50 border border-slate-700 rounded p-2 max-h-72 overflow-auto whitespace-pre-wrap">{serialized}</pre>
            </div>
            <div className="space-y-2 xl:col-span-1">
              <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Transform Log</h3>
              <div className="text-[10px] space-y-1 max-h-72 overflow-auto">
                {log.map(l => (
                  <div key={l.ts} className="border border-slate-700 rounded px-2 py-1 bg-slate-900/40 flex justify-between gap-4">
                    <span className="text-slate-300">{l.note}</span>
                    <span className="text-slate-500">{new Date(l.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
                {log.length === 0 && <div className="text-slate-600">No transforms applied.</div>}
              </div>
              {quality && (
                <div className="mt-3 border border-slate-700 rounded p-2 bg-slate-900/30 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Quality Score</span>
                    <span className={quality.score < 70? 'text-amber-300': 'text-emerald-300'}>{quality.score}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Adj {quality.tokenCounts.adjectives} / Unique {quality.tokenCounts.uniqueAdjectives}</div>
                  <ul className="text-[10px] list-disc ml-4 space-y-1">
                    {quality.issues.map(i => <li key={i.code} className={i.severity==='warn'? 'text-amber-300':'text-slate-400'}>{i.message}</li>)}
                    {quality.issues.length===0 && <li className="text-emerald-300">No issues detected.</li>}
                  </ul>
                </div>
              )}
              {variations.length>0 && (
                <div className="mt-3 border border-slate-700 rounded p-2 bg-slate-900/30 space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Variations</div>
                  <div className="flex flex-wrap gap-2">
                    {variations.map(v => <button key={v.id} onClick={()=> loadVariation(v.id)} className="px-2 py-[2px] rounded border border-slate-600 hover:border-cyan-400 text-[10px] text-slate-300">{v.label}</button>)}
                  </div>
                </div>
              )}
            </div>
            {expertHints && (
              <div className="space-y-2 xl:col-span-1">
                <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Expert Hints</h3>
                <div className="text-[10px] space-y-2 max-h-72 overflow-auto border border-slate-700 rounded p-2 bg-slate-900/30">
                  <div className="text-slate-500">{expertHints.energyImbalance}</div>
                  {expertHints.missingRoles.length>0 && (
                    <div><span className="text-slate-400">Missing Roles:</span> {expertHints.missingRoles.join(', ')}</div>
                  )}
                  {expertHints.underusedHighEnergy.length>0 && (
                    <div><span className="text-slate-400">Sparse High-Energy Sections:</span> {expertHints.underusedHighEnergy.join(', ')}</div>
                  )}
                  {expertHints.descriptorRepetition.length>0 && (
                    <div className="text-slate-400">Repetition:
                      <span className="text-slate-500"> {expertHints.descriptorRepetition.map(r=> r.token+"("+r.count+")").join(', ')}</span>
                    </div>
                  )}
                  <ul className="list-disc ml-4 space-y-1">
                    {expertHints.suggestions.map((s,i)=> <li key={i} className="text-slate-300">{s}</li>)}
                  </ul>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Live Prompt Preview</h3>
                <button onClick={()=> draft && navigator.clipboard.writeText(exportPrompt(draft))} className="px-2 py-[3px] rounded border border-slate-600 hover:border-cyan-400 text-[10px] text-slate-300">Copy</button>
              </div>
              <div className="text-[10px] leading-relaxed bg-black/50 border border-slate-700 rounded p-2 max-h-72 overflow-auto whitespace-pre-wrap">
                {draft ? exportPrompt(draft) : '—'}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
