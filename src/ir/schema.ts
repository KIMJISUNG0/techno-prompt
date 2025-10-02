// Intermediate Representation (IR) for music structure
// Minimal MVP version; can be extended.

export interface IRMeta {
  bpm: number;
  meter?: string; // e.g. '4/4'
  swing?: number; // 0-100
  seed?: number;
  bars?: number; // total bars length (optional for now)
}

export type StepPattern = { type: 'steps'; steps: string }; // e.g. 'x---x---x---x---'
export interface EventNote { beat: number; len?: number; note: string; vel?: number }
export type EventPattern = { type: 'events'; events: EventNote[] };
export type Pattern = StepPattern | EventPattern;

export interface TrackIR {
  id: string;
  role: string; // 'kick' | 'snare' | 'bass' | 'pad' ... free-form for now
  engine?: string; // synth/sample id
  kit?: string; // for drums
  pattern?: Pattern;
  params?: Record<string, number | string | boolean>;
  fxChain?: string[]; // list of fx ids
}

export interface HarmonicIRChord { bar: number; roman?: string; notes: string[] }
export interface HarmonicIR {
  key?: string;
  scale?: string;
  progression?: string; // textual progression e.g. 'i - VI - VII'
  chords?: HarmonicIRChord[];
}

export interface MusicIR {
  schemaVersion: number;
  meta: IRMeta;
  harmonic?: HarmonicIR;
  tracks: TrackIR[];
  fx?: { id: string; params?: Record<string, number | string | boolean> }[];
  warnings?: string[];
}

export function validateIR(ir: MusicIR): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof ir.meta.bpm !== 'number' || ir.meta.bpm <= 0) errors.push('meta.bpm must be > 0');
  if (!Array.isArray(ir.tracks)) errors.push('tracks must be array');
  ir.tracks.forEach(t => {
    if (!t.id) errors.push('track without id');
    if (t.pattern) {
      if (t.pattern.type === 'steps') {
        if (!/^[xX\-_. ]+$/.test(t.pattern.steps)) errors.push(`track ${t.id} invalid steps`);
      } else if (t.pattern.type === 'events') {
        t.pattern.events.forEach((e, idx) => {
          if (typeof e.beat !== 'number') errors.push(`track ${t.id} event ${idx} missing beat`);
        });
      }
    }
  });
  return { ok: errors.length === 0, errors };
}

// Utility helpers
export function createEmptyIR(bpm: number): MusicIR {
  return { schemaVersion: 1, meta: { bpm }, tracks: [] };
}
