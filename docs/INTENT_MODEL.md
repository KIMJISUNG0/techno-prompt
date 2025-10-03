# Intent-First Composition Model

## Simplification KPIs
- Time to first draft <= 90s
- Steps to draft <= 3 (Intent -> Pick Recommendation -> Accept Draft)
- User edits before copy/export: median < 3
- Variation usage rate target: >40% sessions
- Transform commands adoption: >30% sessions

## Intent Schema (Phase 1)
```ts
export interface IntentInput {
  moods: string[];        // e.g. ['dark','hypnotic']
  useCase?: 'club'|'cinematic'|'lofi'|'game'|'ambient'|'pop';
  era?: '90s'|'2000s'|'modern'|'futuristic';
  intensity: number;      // 1..5
  durationSec?: number;   // optional target length
}
```

## Derivation Pipeline
1. Intent → GenreCandidates[] (3)  
2. Picked Candidate → BaseDraft (sections + roles skeleton)  
3. Draft → Detail Expansion (role macros, pattern archetypes)  
4. Transform Layer (slash commands or buttons) → Mutated Draft  
5. Serialize → Final Structured Prompt (Section DSL + English summary)

## Value Rationale
- Reduces early branching (genre taxonomy browsing) by deferring until after mood clustering.
- Encourages iterative refinement with reversible transforms instead of deep step tunnel.

---
(Initial scaffold file – extended as features land.)
