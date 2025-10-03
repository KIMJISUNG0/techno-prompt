/**
 * Quality heuristic placeholder (Phase 1)
 * Performs very lightweight textual analysis on a draft to surface potential issues.
 */
import { DraftStructure } from './sectionDsl';

export interface QualityIssue {
  code: string;
  message: string;
  severity: 'info' | 'warn';
}

export interface QualityReport {
  score: number; // 0..100 (heuristic)
  issues: QualityIssue[];
  tokenCounts: { adjectives: number; uniqueAdjectives: number };
}

const ADJECTIVE_HINTS = ['dark','bright','punchy','warm','looping','driving','hazy','subtle','solid','tight','minimal','evolving','hypnotic','airy','saturated'];

export function evaluateDraft(draft: DraftStructure): QualityReport {
  const text = draft.sections.map(s => Object.values(s.roles).join(' ')).join(' ');
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const adj = words.filter(w => ADJECTIVE_HINTS.includes(w));
  const freq: Record<string, number> = {};
  adj.forEach(a => { freq[a] = (freq[a] || 0) + 1; });
  const issues: QualityIssue[] = [];
  // Repetition issue
  Object.entries(freq).forEach(([w, c]) => {
    if (c > 4) issues.push({ code: 'repeat-adj', message: `Adjective "${w}" appears ${c} times – consider variety.`, severity: 'warn' });
  });
  // Low-end mention diversity (kick/bass adjectives lacking?)
  const lowEndMentions = ['kick','bass','sub','low'];
  const lowHits = words.filter(w => lowEndMentions.includes(w)).length;
  if (lowHits < 3) issues.push({ code: 'lowend-scarce', message: 'Few low-end descriptors; consider clarifying bass / kick character.', severity: 'info' });
  // Adjective density
  const density = adj.length / Math.max(1, words.length);
  if (density > 0.5) issues.push({ code: 'adj-heavy', message: 'Descriptor density high; may risk model dilution.', severity: 'warn' });
  const uniqueAdjectives = Object.keys(freq).length;
  // Simple score: start 100 - penalties
  let score = 100;
  issues.forEach(i => { score -= i.severity === 'warn' ? 8 : 3; });
  if (density > 0.5) score -= 5;
  if (uniqueAdjectives < 4) score -= 5;
  score = Math.max(0, score);
  return { score, issues, tokenCounts: { adjectives: adj.length, uniqueAdjectives } };
}

export default evaluateDraft;
