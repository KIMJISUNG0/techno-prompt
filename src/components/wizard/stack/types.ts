// Stack Composer Types
// NOTE: 'fx' pseudo-role reserved for future per-layer FX chains; current FX/mix/master are meta-level
export type LayerRole = 'kick'|'hat'|'snare'|'bass'|'chords'|'lead'|'fx'|'groove'|'mix'|'master';

export interface LayerBase {
  id: string;
  role: LayerRole;
  descriptors: string[]; // adjectives for prompt
  pattern?: string;      // percussion or melodic DSL
  notes?: (string|number)[]; // chords or bass note set
  params?: Record<string, any>;
  fx?: any[];
  mix?: { gain?: number; pan?: number; hp?: number; lp?: number };
}

export interface SessionMeta {
  bpm: number;
  meter: string;
  swing?: number;
  humanizeMs?: number;
  velVarPct?: number;
  progression?: { roman: string; key?: string };
  structure?: { intro?: number; build?: number; drop?: number; break?: number; outro?: number };
  mix?: { busComp?: string; tonalTilt?: string; loudness?: string };
  master?: { limiter?: string; targetLUFS?: number; stereoWidth?: string };
}

export interface StackState {
  stepIndex: number;          // current index in steps[]
  steps: string[];            // ordered pipeline (can be extended safely)
  layers: LayerBase[];        // committed musical layers
  draft?: LayerBase;          // in-progress layer before commit
  meta: SessionMeta;          // global session / mix metadata
}

export type Action =
  | { type:'next' }
  | { type:'prev' }
  | { type:'goto'; index:number }
  | { type:'setMeta'; patch: Partial<SessionMeta> }
  | { type:'startDraft'; role: LayerRole }
  | { type:'updateDraft'; patch: Partial<LayerBase> }
  | { type:'commitDraft' }
  | { type:'discardDraft' }
  | { type:'updateLayer'; id:string; patch: Partial<LayerBase> };
