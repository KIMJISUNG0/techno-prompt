import { getLiveAPI } from './engine';

export interface RunResult { ok: boolean; error?: string }

// Block obvious globals & attempts to escape sandbox. We purposely do NOT expose
// Function constructor via user code (we use it internally once) and avoid 'with'.
const BLOCK_PATTERN = /(window|document|fetch|XMLHttpRequest|localStorage|Function|eval|globalThis)/g;

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
  // Create parameter list to inject only allowed symbols instead of using 'with'.
  const argNames = Object.keys(api);
  const args = argNames.map(k => (api as any)[k]);
  const wrapped = new Function(...argNames, '"use strict";\n' + source + '\n');
  wrapped(...args);
    return { ok: true };
  } catch (e:any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
