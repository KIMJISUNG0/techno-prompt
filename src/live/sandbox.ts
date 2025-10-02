import { getLiveAPI } from './engine';

export interface RunResult { ok: boolean; error?: string }

const BLOCK_PATTERN = /(window|document|fetch|XMLHttpRequest|localStorage)/g;

export function runLiveCode(source: string): RunResult {
  try {
    if (BLOCK_PATTERN.test(source)) {
      return { ok: false, error: 'Disallowed identifier in code.' };
    }
    const api = getLiveAPI();
    const wrapped = new Function('api', 'with(api){"use strict";\n' + source + '\n}');
    wrapped(api);
    return { ok: true };
  } catch (e:any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
