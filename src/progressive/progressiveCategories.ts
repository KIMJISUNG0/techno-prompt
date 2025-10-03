
/** Progressive category + token model */
export interface ProgToken { id: string; label: string; group?: string; hint?: string; weight?: number; }
export interface ProgCategory {
  id: string;
  label: string;
  min?: number; // soft minimum selections
  max?: number; // soft maximum
  tokens: ProgToken[];
  /** Suggest which next category IDs to emphasize / highlight */
  nextHints?: (picked: string[], all: Record<string,string[]>) => string[];
}

// Helper to quickly define tokens (id defaults to kebab label)
function t(label: string, hint?: string, group?: string): ProgToken {
  return { id: label.toLowerCase().replace(/[^a-z0-9]+/g,'-'), label, hint, group };
}

export const PROG_CATEGORIES: ProgCategory[] = [
  {
    id: 'style', label: 'Genre Style', min:1, max:3,
    tokens: [
      t('driving'), t('hypnotic'), t('uplifting'), t('atmospheric'), t('raw'), t('minimal'), t('dark'), t('melodic'), t('progressive'), t('warehouse'), t('cinematic')
    ],
    nextHints(picked){
      if (picked.includes('minimal')) return ['tempo','drums','bass'];
      if (picked.includes('cinematic')) return ['fx','arrangement'];
      return ['tempo'];
    }
  },
  {
    id: 'tempo', label: 'Tempo / Groove', min:1, max:2,
    tokens: [
      t('120-124 mellow'), t('125-128 club standard'), t('129-132 driving'), t('140 halftime'), t('150 fast'), t('170 dnb'), t('swing subtle'), t('swing heavy'), t('syncopated'), t('polyrhythmic')
    ],
    nextHints(picked){
      if (picked.some(p=> p.includes('170'))) return ['drums','bass'];
      return ['drums'];
    }
  },
  {
    id: 'drums', label: 'Drum Kit & Character', min:2, max:6,
    tokens: [
      t('tr909 kit'), t('tr808 kit'), t('acoustic hybrid'), t('processed modular'), t('punchy kick'), t('saturated kick'), t('clap-snare layer'), t('tight hats'), t('offbeat open hat'), t('ghost hats'), t('glitch perc sprinkles'), t('reverb clap'), t('rim ticks')
    ],
    nextHints(){ return ['bass']; }
  },
  {
    id: 'bass', label: 'Bass Foundation', min:1, max:3,
    tokens: [
      t('rolling sub'), t('distorted reese'), t('plucky analog'), t('fm metallic'), t('sustained drone'), t('arp-bass hybrid')
    ],
    nextHints(){ return ['synth']; }
  },
  {
    id: 'synth', label: 'Synth / Melodic', min:1, max:4,
    tokens: [
      t('hypnotic arp'), t('evolving pad'), t('bright pluck'), t('detuned saw lead'), t('bell motif'), t('grainy texture'), t('psy sequence'), t('mono acid line')
    ],
    nextHints(){ return ['fx','arrangement']; }
  },
  {
    id: 'fx', label: 'FX & Transitions', min:0, max:4,
    tokens: [
      t('noise sweep'), t('reverse crash'), t('uplifter 4 bars'), t('sub drop'), t('vinyl noise bed'), t('granular sparkle'), t('impact hit'), t('tension riser')
    ],
    nextHints(){ return ['arrangement']; }
  },
  {
    id: 'arrangement', label: 'Arrangement & Energy', min:1, max:3,
    tokens: [
      t('rise-drop-resolve'), t('dual-peak'), t('long-build'), t('early-impact'), t('extended breakdown'), t('percussive bridge'), t('big drop focus')
    ],
    nextHints(){ return ['mix']; }
  },
  {
    id: 'mix', label: 'Mix / Spatial', min:1, max:4,
    tokens: [
      t('tight low end'), t('airy highs'), t('mid punch'), t('stereo wideness'), t('tape warmth'), t('analog saturation'), t('clean transient'), t('dark ambience')
    ],
    nextHints(){ return ['mood']; }
  },
  {
    id: 'mood', label: 'Final Mood Tags', min:1, max:4,
    tokens: [
      t('tense'), t('euphoric'), t('introspective'), t('cinematic scope'), t('club-ready'), t('late-night'), t('underground'), t('mystical'), t('futuristic')
    ],
  },
];

export type ProgressiveSelections = Record<string,string[]>; // categoryId -> token ids

export function buildProgressivePrompt(sel: ProgressiveSelections, mode: 'compact'|'rich'='rich'): string {
  const style = (sel.style||[]).join(' ');
  const tempo = (sel.tempo||[]).join(', ');
  const drums = (sel.drums||[]).join(', ');
  const bass = (sel.bass||[]).join(', ');
  const synth = (sel.synth||[]).join(', ');
  const fx = (sel.fx||[]).join(', ');
  const arr = (sel.arrangement||[]).join(', ');
  const mix = (sel.mix||[]).join(', ');
  const mood = (sel.mood||[]).join(', ');

  if (mode==='compact') {
    return `Generate a ${style} track (${tempo}). Drums:${drums}. Bass:${bass}. Synth:${synth}. FX:${fx}. Arrange:${arr}. Mix:${mix}. Mood:${mood}.`;
  }
  return [
    `Generate a ${style} electronic track with tempo/groove: ${tempo}.`,
    `Drums: ${drums}. Bass: ${bass}.`,
    `Synth & Melodic: ${synth}. FX: ${fx}.`,
    `Arrangement: ${arr}. Mix: ${mix}. Mood: ${mood}.`
  ].join('\n');
}

export function suggestNextCategories(currentId: string, picked: ProgressiveSelections): string[] {
  const cat = PROG_CATEGORIES.find(c=> c.id===currentId);
  if (!cat || !cat.nextHints) return [];
  return cat.nextHints(picked[currentId]||[], picked);
}
