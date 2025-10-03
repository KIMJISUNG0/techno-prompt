import { DraftStructure } from './sectionDsl';

/** Options for exporting a single consolidated AI prompt */
export interface PromptExportOptions {
  includeStructureLine?: boolean; // include explicit section order text
  maxRoleWordsPerSection?: number; // limit words per role
  collapseDuplicateAdjectives?: boolean; // remove immediate duplicate tokens
}

const DEFAULT_OPTS: PromptExportOptions = {
  includeStructureLine: true,
  maxRoleWordsPerSection: 2,
  collapseDuplicateAdjectives: true,
};

/** Very small adjective stop words / noise tokens we might drop when repeating */
const WEAK_TOKENS = new Set(['solid','minimal','pulse','motif','sparse']);

/** Export draft structure into one concise natural language prompt (target: Suno, LLM, etc.) */
export function exportPrompt(draft: DraftStructure, opts: PromptExportOptions = {}): string {
  const o = { ...DEFAULT_OPTS, ...opts };
  const { intent } = draft;
  const sectionOrder = draft.sections.map(s=> s.kind).join('→');
  // Derive a global vibe descriptor list (take first main/drop sections roles union)
  const focusSec = draft.sections.find(s=> s.kind==='drop') || draft.sections.find(s=> s.kind==='main') || draft.sections[0];
  const roleSnippets: string[] = [];
  if (focusSec) {
    Object.entries(focusSec.roles).forEach(([role, desc]) => {
      const cleaned = normalizeWords(desc, o);
      if (!cleaned) return;
      roleSnippets.push(`${role}: ${cleaned}`);
    });
  }
  // Limit roles for brevity
  const condensedRoles = roleSnippets.slice(0, 6).join('; ');

  const energyCurve = summarizeEnergy(draft);

  let prompt = `${intent.moods.join('/')} ${intent.useCase||''} futuristic electronic track (intensity ${intent.intensity}/5)`;
  if (o.includeStructureLine) prompt += `. Structure ${sectionOrder}.`;
  prompt += ` Emphasize ${condensedRoles}. Energy curve ${energyCurve}.`;
  prompt += ' Clean low end, balanced mids, evolving atmosphere.';
  return prompt.replace(/\s+/g,' ').trim();
}

function normalizeWords(desc: string, o: PromptExportOptions): string {
  let tokens = desc.split(/\s+/).filter(Boolean);
  if (o.collapseDuplicateAdjectives) {
    const seen = new Set<string>();
    tokens = tokens.filter(t => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  tokens = tokens.filter(t => !(WEAK_TOKENS.has(t) && t.length < 7));
  if (o.maxRoleWordsPerSection && tokens.length > o.maxRoleWordsPerSection) {
    tokens = tokens.slice(0, o.maxRoleWordsPerSection);
  }
  return tokens.join(' ');
}

function summarizeEnergy(draft: DraftStructure): string {
  // Simple: list first, mid (drop or main), last energy levels
  if (!draft.sections.length) return 'flat';
  const first = draft.sections[0].energy;
  const peakSec = draft.sections.find(s=> s.kind==='drop') || draft.sections.find(s=> s.energy===5) || draft.sections[Math.floor(draft.sections.length/2)];
  const peak = peakSec.energy;
  const last = draft.sections[draft.sections.length-1].energy;
  if (first < peak && last < peak) return `rises to ${peak} then resolves to ${last}`;
  if (first < peak && last === peak) return `builds to sustained ${peak}`;
  return `varied around ${peak}`;
}

export default exportPrompt;
