import React from 'react';
import { validateIntent, IntentInput } from '../intent/types';
import { buildDefaultDraft, serializeDraft } from '../prompt/sectionDsl';
import { draftToPatterns } from '../prompt/patternMap';

// 초보자용 매우 단순한 컴포저: mood + intensity (+ optional useCase)만 받고 1줄 프롬프트 생성
const CORE_MOODS = ['dark','hypnotic','uplifting','driving','melancholic','energetic','dreamy','aggressive'];
const USE_CASES = ['club','cinematic','lofi','game','ambient','pop'];

interface GenResult {
  prompt: string;
  serialized: string;
  bars: number;
}

export default function SimpleComposer(){
  const [mood, setMood] = React.useState('dark');
  const [intensity, setIntensity] = React.useState(3);
  const [useCase, setUseCase] = React.useState<string>('club');
  const [duration, setDuration] = React.useState(180); // seconds (optional)
  const [result, setResult] = React.useState<GenResult|undefined>();
  const [loading, setLoading] = React.useState(false);

  function generate(){
    setLoading(true);
    requestAnimationFrame(()=> {
      const raw: IntentInput = { moods:[mood], intensity: intensity as any, useCase: useCase as any, durationSec: duration };
      const { normalized } = validateIntent(raw);
      const draft = buildDefaultDraft(normalized, {});
      const ser = serializeDraft(draft);
      const totalBars = draft.sections.reduce((a,s)=> a+s.bars,0);
      const main = draft.sections.find(s=> s.kind==='main') || draft.sections[0];
      const coreRoles = ['kick','bass','hats','pad','lead'] as const;
      const roleWords = coreRoles.map(r => main.roles[r] || '').filter(Boolean).map(d => d.split(/\s+/).slice(0,2).join(' '));
      const uniqueRoleWords = Array.from(new Set(roleWords)).slice(0,5).join(', ');
      const prompt = `Generate a ${normalized.moods[0]} ${normalized.useCase||''} electronic track (intensity ${normalized.intensity}/5) ~${totalBars} bars. Sections: intro→build→drop→main→break→main→outro. Emphasize ${uniqueRoleWords}.`;
  const pack = { prompt, serialized: ser, bars: totalBars };
  setResult(pack);
  // Quick 모드로 넘길 수 있도록 전역 핸드오프 변수 저장
  (window as any).__simpleDraft = { serialized: ser, intent: normalized };
      // Live sync 이벤트도 동일하게 발행해 패턴 구독 컴포넌트 공유
      try { window.dispatchEvent(new CustomEvent('draft.patterns.update', { detail: draftToPatterns(draft) })); } catch {/* silent */}
      setLoading(false);
    });
  }

  function copy(text: string){
    try { navigator.clipboard.writeText(text); } catch {/* ignore */}
  }

  return (
    <div className="p-6 max-w-3xl mx-auto text-sm space-y-6">
      <h1 className="text-lg font-semibold tracking-wide">Simple Mode</h1>
      <p className="text-slate-400 leading-relaxed">
        최소 입력만으로 기본 트랙 프롬프트를 생성합니다. 더 세밀한 편집이 필요하면 아래 "Go Advanced" 버튼을 눌러 Quick 모드로 이동하세요.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">Mood
          <select value={mood} onChange={e=> setMood(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1">
            {CORE_MOODS.map(m=> <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">Use Case
          <select value={useCase} onChange={e=> setUseCase(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1">
            {USE_CASES.map(u=> <option key={u}>{u}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">Intensity: {intensity}
          <input type="range" min={1} max={5} value={intensity} onChange={e=> setIntensity(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1">Duration (sec)
          <input type="number" value={duration} min={30} max={600} onChange={e=> setDuration(Number(e.target.value)||180)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1" />
        </label>
      </div>
      <div className="flex gap-3 items-center">
        <button disabled={loading} onClick={generate} className="ios-bubble" data-variant="accent">{loading? 'Generating...' : 'Generate'}</button>
        <a href="#quick" className="ios-bubble" onClick={()=> {
          // 아직 생성 안했다면 자동 생성 후 이동 (UX 가속)
          if(!result){ generate(); setTimeout(()=> { window.location.hash = '#quick'; }, 0); return; }
        }}>Go Advanced →</a>
      </div>
      {result && (
        <div className="space-y-3">
          <div>
            <div className="font-semibold mb-1">Basic Prompt</div>
            <textarea readOnly value={result.prompt} className="w-full bg-slate-900 border border-slate-700 rounded p-2 h-28 text-xs font-mono" />
            <div className="flex gap-2 mt-2">
              <button onClick={()=> copy(result.prompt)} className="ios-bubble">Copy Prompt</button>
              <button onClick={()=> copy(result.serialized)} className="ios-bubble">Copy Structure</button>
              <button onClick={()=> { window.location.hash = '#quick'; }} className="ios-bubble" data-variant="accent">Edit in Quick →</button>
            </div>
          </div>
          <details className="bg-slate-900/40 rounded border border-slate-700 p-3">
            <summary className="cursor-pointer text-slate-300 text-xs">Structure Details</summary>
            <div className="mt-2 text-[11px] text-slate-400 whitespace-pre-wrap font-mono break-all">
              {result.serialized}
            </div>
          </details>
        </div>
      )}
      {!result && (
        <div className="text-xs text-slate-500">Generate 버튼을 눌러 결과를 만들어 보세요.</div>
      )}
      <div className="pt-4 text-[10px] text-slate-500 border-t border-slate-800">
        Tip: 이 모드의 결과는 빠른 아이디어 초안입니다. 고급 편집 (섹션 길이 / 에너지 / 역할 변형 등)은 Quick 모드(#quick)에서 가능합니다.
      </div>
    </div>
  );
}
