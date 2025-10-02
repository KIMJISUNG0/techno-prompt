import { getLiveAPI } from './engine';

export interface RunResult { ok: boolean; error?: string }

// Block obvious globals & attempts to escape sandbox. We purposely do NOT expose
// Function constructor via user code (we use it internally once) and avoid 'with'.
// Allow controlled usage of getLiveAPI / liveAPI. Still block dangerous objects.
const BLOCK_PATTERN = /(document|fetch|XMLHttpRequest|localStorage|Function|eval|globalThis)/g;

// Whitelist subset of API keys exposed to user code to reduce accidental misuse.
const ALLOWED_KEYS = [
  'setBPM','setSwing','play','update','stop','stopAll','list',
  'registerPatch','triggerPatch','listPatches','log',
  // Tone.js hybrid bridge
  'tonePlay','toneStop','toneStopAll','listTone'
  ,'setToneBPM','tonePatternPlay','tonePatternStop','tonePatternStopAll'
] as const;

type AllowedKey = typeof ALLOWED_KEYS[number];

function buildUserAPI(){
  const full = getLiveAPI();
  const safe: Record<string, any> = {};
  for (const k of ALLOWED_KEYS) safe[k] = (full as any)[k];
  return safe as Pick<ReturnType<typeof getLiveAPI>, AllowedKey>;
}

export function runLiveCode(source: string): RunResult {
  try {
    if (BLOCK_PATTERN.test(source)) {
      return { ok: false, error: 'Disallowed identifier in code.' };
    }
    const safeApi = buildUserAPI();
    // Detect if user already declares api (const/let/var api ...)
    const userDeclaresApi = /\b(?:const|let|var)\s+api\b/.test(source);
    const argNames = Object.keys(safeApi);
    const args = argNames.map(k => (safeApi as any)[k]);
    let injected = '"use strict";\n';
    if (!userDeclaresApi) {
      // Provide convenience alias only when not declared by user
      argNames.push('__sandbox_api');
      args.push(safeApi);
      injected += 'const api = __sandbox_api;\n';
    }
    const wrapped = new Function(...argNames, injected + source + '\n');
    wrapped(...args);
    return { ok: true };
  } catch (e:any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
