import { DraftStructure, SectionNode } from './sectionDsl';

export interface SectionPatterns {
  id: string;
  kick: string;
  hat: string;
  bass: string;
  energy: number;
  kind: string;
}

export interface DraftPatternsPayload {
  sections: SectionPatterns[];
  totalSections: number;
  generatedAt: number;
}

function patternsForSection(sec: SectionNode): SectionPatterns {
  const kick = sec.energy >=4 ? 'C2 . C2 . C2 . C2 .' : 'C2 . . . C2 . . .';
  const hat  = sec.energy >=4 ? 'x.x.x.x.x.x.x.x.' : 'x.x. . x.x. .';
  const bass = sec.energy >=4 ? 'C2_ . . G2_ . .' : 'C2 . . . G2 . . .';
  return { id: sec.id, kick, hat, bass, energy: sec.energy, kind: sec.kind };
}

export function draftToPatterns(draft: DraftStructure): DraftPatternsPayload {
  return {
    sections: draft.sections.map(patternsForSection),
    totalSections: draft.sections.length,
    generatedAt: Date.now(),
  };
}

export default draftToPatterns;
