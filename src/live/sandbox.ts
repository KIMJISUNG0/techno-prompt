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
    const api = buildUserAPI();
    // Auto alias 'api' for user convenience
    (api as any).api = api;
    const argNames = Object.keys(api);
    const args = argNames.map(k => (api as any)[k]);
    const wrapped = new Function(...argNames, '"use strict";\n' + source + '\n');
    wrapped(...args);
    return { ok: true };
  } catch (e:any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
