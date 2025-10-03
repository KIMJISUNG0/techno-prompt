/**
 * Transform Layer (Phase 1 Scaffold)
 * -------------------------------------------------
 * Pure functions that mutate (immutable style) a DraftStructure produced by
 * sectionDsl. Future phases may introduce a reversible op log; for now we keep
 * it simple and return a new object.
 */

import { DraftStructure, RoleToken } from './sectionDsl';

export interface TransformContext {
  now: Date;
}

export interface TransformResult {
  draft: DraftStructure;
  note: string; // human readable summary
}

export type DraftTransform = (draft: DraftStructure, ctx?: TransformContext) => TransformResult;

// Utility copy helpers ------------------------------------------------------
function cloneDraft(d: DraftStructure): DraftStructure {
  return {
    intent: d.intent, // intent is immutable (normalized snapshot)
    version: d.version,
    sections: d.sections.map(s => ({ ...s, roles: { ...s.roles } })),
  };
}

// Role adjectives mapping for certain commands
const BRIGHTEN_MAP: Partial<Record<RoleToken, (s: string) => string>> = {
  hats: s => s.replace(/tight|minimal|dark/g, 'bright').replace(/shimmer/, 'sparkle'),
  lead: s => s.replace(/dark|hazy|looping/g, 'vibrant'),
  pad: s => s.replace(/dark|warm/g, 'luminous'),
};

const PUNCH_MAP: Partial<Record<RoleToken, (s: string) => string>> = {
  kick: s => s.replace(/solid/, 'punchy saturated'),
  bass: s => s.replace(/sub pulse/, 'driving sub pulse'),
  snare: s => s.replace(/snappy/, 'snappy sharp'),
};

/** brighten: increase perceived brightness of rhythmic + melodic layers */
export const brighten: DraftTransform = (draft, _ctx) => {
  const d = cloneDraft(draft);
  d.sections.forEach(sec => {
    (Object.keys(sec.roles) as RoleToken[]).forEach(r => {
      const fn = BRIGHTEN_MAP[r];
      if (fn) sec.roles[r] = fn(sec.roles[r]!);
    });
  });
  return { draft: d, note: 'Applied brighten to hats/lead/pad descriptors' };
};

/** increase punch on low-end + transient layers */
export const punch: DraftTransform = draft => {
  const d = cloneDraft(draft);
  d.sections.forEach(sec => {
    (Object.keys(sec.roles) as RoleToken[]).forEach(r => {
      const fn = PUNCH_MAP[r];
      if (fn) sec.roles[r] = fn(sec.roles[r]!);
    });
  });
  return { draft: d, note: 'Enhanced punch for kick/bass/snare.' };
};

/** raise energy of selected section ids (capped at 5) */
export function raiseEnergy(sectionIds: string[]): DraftTransform {
  return draft => {
    const d = cloneDraft(draft);
    d.sections.forEach(sec => {
      if (sectionIds.includes(sec.id)) {
        const next = Math.min(5, sec.energy + 1);
        sec.energy = (next < 1 ? 1 : next) as any; // safe cast to EnergyLevel domain
      }
    });
    return { draft: d, note: `Raised energy for ${sectionIds.length} section(s).` };
  };
}

/** generic text find/replace across role descriptors */
export function replaceAll(find: RegExp, replace: string): DraftTransform {
  return draft => {
    const d = cloneDraft(draft);
    d.sections.forEach(sec => {
      (Object.keys(sec.roles) as RoleToken[]).forEach(r => {
        const cur = sec.roles[r];
        if (cur) sec.roles[r] = cur.replace(find, replace);
      });
    });
    return { draft: d, note: `Replaced ${find} → ${replace}` };
  };
}

// Slash-style command router (very small parser) ----------------------------
export function applySlashCommand(draft: DraftStructure, input: string): TransformResult | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  const [cmd, ...rest] = trimmed.slice(1).split(/\s+/);
  switch (cmd) {
    case 'brighten':
      return brighten(draft);
    case 'punch':
      return punch(draft);
    case 'raise': {
      // /raise id1 id2
      const ids = rest;
      return raiseEnergy(ids)(draft);
    }
    case 'replace': {
      // /replace find=regex replace=text  (very naive parsing)
      const findPart = rest.find(t => t.startsWith('find='));
      const replPart = rest.find(t => t.startsWith('replace='));
      if (findPart && replPart) {
        const pattern = findPart.slice('find='.length);
        const repl = replPart.slice('replace='.length);
        try {
          const re = new RegExp(pattern, 'gi');
          return replaceAll(re, repl)(draft);
        } catch {
          return { draft, note: 'Invalid regex pattern' };
        }
      }
      return { draft, note: 'Missing find= / replace=' };
    }
    default:
      return { draft, note: `Unknown command: ${cmd}` };
  }
}

export default {
  brighten,
  punch,
  raiseEnergy,
  replaceAll,
  applySlashCommand,
};
