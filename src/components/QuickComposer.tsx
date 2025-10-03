import React, { useState, useMemo } from 'react';
import { IntentInput, clampIntensity } from '../intent/types';
import { recommendGenres } from '../intent/recommend';
import { buildDefaultDraft, serializeDraft, draftSummary } from '../prompt/sectionDsl';
import { applySlashCommand } from '../prompt/transforms';

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
  }

  function applySlash() {
    if (!draft) return;
    const res = applySlashCommand(draft, slashInput.trim());
    if (!res) return;
    setDraft(res.draft);
    const ser = serializeDraft(res.draft);
    setSerialized(ser);
    setLog(l => [...l, { note: res.note, serialized: ser, ts: Date.now() }]);
    setSlashInput('');
  }

  function resetAll() {
    setSelectedGenre(undefined);
    setDraft(null);
    setSerialized('');
    setLog([]);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      <header className="flex flex-wrap gap-4 items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wider text-slate-200">Quick Composer</h1>
          <p className="text-[11px] text-slate-500 mt-1">Step 1: Enter minimal intent. Step 2: Pick a recommended genre. Step 3: Generate draft & refine with slash commands.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={resetAll} className="px-3 py-1 rounded border border-slate-600 hover:border-cyan-400 text-slate-300">Reset</button>
          {draft && <button onClick={()=> navigator.clipboard.writeText(serialized)} className="px-3 py-1 rounded border border-emerald-400 text-emerald-200 bg-emerald-600/10">Copy Draft</button>}
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
          <div className="text-[11px] text-slate-400">{draftSummary(draft)}</div>
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

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-wider text-slate-400">Serialized Draft</h3>
                <button onClick={()=> navigator.clipboard.writeText(serialized)} className="px-2 py-[3px] rounded border border-slate-600 hover:border-emerald-400 text-[10px] text-slate-300">Copy</button>
              </div>
              <pre className="text-[10px] leading-relaxed bg-black/50 border border-slate-700 rounded p-2 max-h-72 overflow-auto whitespace-pre-wrap">{serialized}</pre>
            </div>
            <div className="space-y-2">
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
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
