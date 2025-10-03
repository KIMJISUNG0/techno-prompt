/**
 * Section DSL (Phase 1 Scaffold)
 * --------------------------------------------
 * Represents a lightweight structural abstraction for a track draft.
 * Focus: minimal AST, pure data, serializable to a compact string that can be
 * embedded inside AI prompts or exported to other tooling.
 */

import { IntentInput, IntentNormalized, clampIntensity, validateIntent } from '../intent/types';

// Energy curve classification (derived from intent.intensity & local adjustments)
export type EnergyLevel = 1 | 2 | 3 | 4 | 5; // keep small union for clarity

/** Role macro tokens describing broad arrangement layers */
export type RoleToken =
  | 'kick'
  | 'bass'
  | 'hats'
  | 'snare'
  | 'perc'
  | 'pad'
  | 'lead'
  | 'atmos'
  | 'fx';

/** Section category enums (arrangement archetypes) */
export type SectionKind = 'intro' | 'build' | 'drop' | 'main' | 'break' | 'outro';

export interface SectionNode {
  id: string;            // stable ID (uuid-lite or deterministic index)
  kind: SectionKind;
  bars: number;          // length in 4/4 bars
  energy: EnergyLevel;   // relative energy (1..5)
  roles: Partial<Record<RoleToken, string>>; // role → descriptor snippet
}

export interface DraftStructure {
  intent: IntentNormalized;  // normalized intent snapshot
  sections: SectionNode[];   // ordered sequence
  version: 1;                // DSL versioning for migrations
}

// ID helper (tiny deterministic incremental id for now)
function makeId(idx: number, kind: SectionKind): string {
  return `${idx}_${kind}`;
}

// Default role descriptor macros (very small seed vocabulary)
const BASE_ROLE_DESCRIPTORS: Record<RoleToken, string> = {
  kick: 'solid four-on-floor',
  bass: 'sub pulse',
  hats: 'tight 16th shimmer',
  snare: 'snappy minimal',
  perc: 'sporadic texture hits',
  pad: 'warm evolving',
  lead: 'hypnotic motif',
  atmos: 'dark airy noise bed',
  fx: 'sparse sweeps',
};

/** Energy shaping heuristics by section kind */
const KIND_BASE_ENERGY: Record<SectionKind, EnergyLevel> = {
  intro: 2,
  build: 3,
  drop: 5,
  main: 4,
  break: 2,
  outro: 1,
};

interface DraftOptions {
  targetBars?: number; // approximate total bars
}

/** Create a simple canonical arrangement skeleton from an intent */
export function buildDefaultDraft(rawIntent: IntentInput, opts: DraftOptions = {}): DraftStructure {
  const { normalized } = validateIntent(rawIntent);
  const totalBars = Math.min(256, Math.max(32, opts.targetBars || estimateBarsFromDuration(normalized.durationSec)));

  // Basic pattern: intro → build → drop → main → break → main → outro
  const pattern: SectionKind[] = ['intro', 'build', 'drop', 'main', 'break', 'main', 'outro'];
  // Allocate bars proportionally (weights manual tuned baseline)
  const weights = [0.08, 0.12, 0.18, 0.22, 0.12, 0.18, 0.10];
  const sections: SectionNode[] = [];
  let acc = 0;
  pattern.forEach((kind, i) => {
    const remaining = totalBars - acc;
    let bars = Math.max(4, Math.round(totalBars * weights[i]));
    if (i === pattern.length - 1) bars = Math.max(4, remaining); // last consumes remainder
    if (bars > remaining) bars = remaining; // safety
    acc += bars;
    const baseEnergy = KIND_BASE_ENERGY[kind];
    const scaled = scaleEnergy(baseEnergy, normalized.intensity);
    sections.push({
      id: makeId(i, kind),
      kind,
      bars,
      energy: scaled,
      roles: seedRolesFor(kind, scaled, normalized),
    });
  });

  return { intent: normalized, sections, version: 1 };
}

/** Estimate bar length from duration seconds (assuming ~ 128 BPM 4/4) */
function estimateBarsFromDuration(durationSec?: number): number {
  if (!durationSec) return 128; // mid default
  const bpm = 128; // later: derive from genre
  const beats = (durationSec / 60) * bpm;
  return Math.round(beats / 4);
}

/** Scale base energy by intent intensity (soft blend) */
function scaleEnergy(base: EnergyLevel, intensity: number): EnergyLevel {
  const mix = (base + intensity) / 2;
  const clamped = Math.min(5, Math.max(1, Math.round(mix))) as EnergyLevel;
  return clamped;
}

/** Seed role descriptor adjustments by section & energy */
function seedRolesFor(kind: SectionKind, energy: EnergyLevel, intent: IntentNormalized): SectionNode['roles'] {
  const roles: SectionNode['roles'] = {};
  const mood = intent.moods[0];
  const moodAdj = moodDescriptorAdjective(mood);
  (Object.keys(BASE_ROLE_DESCRIPTORS) as RoleToken[]).forEach(r => {
    // Minimal presence logic: reduce some roles in intro / outro / break
    if (kind === 'intro' && ['lead', 'snare'].includes(r)) return;
    if (kind === 'break' && r === 'kick') return;
    if (kind === 'outro' && r === 'lead') return;
    let desc = BASE_ROLE_DESCRIPTORS[r];
    if (energy >= 4 && (r === 'hats' || r === 'lead')) desc = desc.replace(/minimal|tight/, 'driving');
    if (energy <= 2 && r === 'perc') desc = 'subtle percussive flickers';
    // Mood coloration
    desc = `${moodAdj} ${desc}`.trim();
    roles[r] = desc;
  });
  return roles;
}

function moodDescriptorAdjective(mood: string): string {
  if (mood === 'dark') return 'dark';
  if (mood === 'hypnotic') return 'looping';
  if (mood === 'uplifting') return 'bright';
  if (mood === 'dreamy') return 'hazy';
  if (mood === 'aggressive') return 'punchy';
  return mood; // fallback direct
}

// Serialization --------------------------------------------------------------

/** Serialize draft into compact multi-line textual form */
export function serializeDraft(draft: DraftStructure): string {
  const lines: string[] = [];
  lines.push(`#INTENT moods=${draft.intent.moods.join(',')} useCase=${draft.intent.useCase || '-'} era=${draft.intent.era} intensity=${draft.intent.intensity}`);
  draft.sections.forEach(s => {
    // role summary condensed: role=firstTwoWords-
    const roleTokens = Object.entries(s.roles).map(([role, desc]) => {
      const first = desc.split(/\s+/).slice(0, 3).join(' ');
      return `${role}:{${first}}`;
    }).join(' ');
    lines.push(`${s.id}|${s.kind}|bars=${s.bars}|e=${s.energy}|${roleTokens}`);
  });
  return lines.join('\n');
}

/** Basic parse (inverse of serialize) – lenient, ignores unknown lines */
export function parseDraft(text: string): DraftStructure | null {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (!lines.length || !lines[0].startsWith('#INTENT')) return null;
  const intentLine = lines[0];
  const moodsMatch = /moods=([^\s]+)/.exec(intentLine);
  const useCaseMatch = /useCase=([^\s]+)/.exec(intentLine);
  const eraMatch = /era=([^\s]+)/.exec(intentLine);
  const intensityMatch = /intensity=(\d+)/.exec(intentLine);
  const moods = moodsMatch ? moodsMatch[1].split(',').filter(Boolean) : ['dark'];
  const intensity = clampIntensity(intensityMatch ? Number(intensityMatch[1]) : 3);
  const intent: IntentNormalized = {
    moods,
    useCase: (useCaseMatch && useCaseMatch[1] !== '-' ? useCaseMatch[1] as any : undefined),
    era: (eraMatch ? eraMatch[1] as any : 'modern'),
    intensity,
    durationSec: undefined,
  };
  const sections: SectionNode[] = [];
  lines.slice(1).forEach(line => {
    const parts = line.split('|');
    if (parts.length < 5) return; // malformed
    const [id, kindRaw, barsPart, ePart, rolesPart] = parts as [string, SectionKind, string, string, string];
    const bars = Number(barsPart.replace(/bars=/, '')) || 4;
    const energy = Number(ePart.replace(/e=/, '')) as EnergyLevel || 3;
    const roles: SectionNode['roles'] = {};
    rolesPart.split(/\s+/).forEach(tok => {
      const m = /(\w+):\{([^}]+)}/.exec(tok);
      if (!m) return;
      roles[m[1] as RoleToken] = m[2];
    });
    sections.push({ id, kind: kindRaw, bars, energy, roles });
  });
  return { intent, sections, version: 1 };
}

// Convenience inspect helper
export function draftSummary(draft: DraftStructure): string {
  return `${draft.intent.moods.join('/')} :: ${draft.sections.length} sections :: totalBars=${draft.sections.reduce((a, s) => a + s.bars, 0)}`;
}

export default DraftStructure;
