import { IntentInput, IntentNormalized, validateIntent, clampIntensity } from './types';

/** Genre identifier type (re-using existing taxonomy string literals where possible). */
export type GenreId = string; // intentionally loose; downstream can narrow

export interface GenreCandidate {
  genre: GenreId;
  confidence: number; // 0..1 heuristic score
  rationale: string;  // short human readable explanation
  moodCoverage: number; // 0..1 coverage of supplied moods
}

export interface RecommendationResult {
  intent: IntentNormalized;
  candidates: GenreCandidate[]; // sorted desc by confidence
  issues: string[];             // surfaced validation issues
}

// Mood clusters -> genre hints (primitive heuristic lookups) -----------------
// Later we can expand / replace with embedding similarity or learned weights.
const MOOD_GENRE_HINTS: Record<string, GenreId[]> = {
  dark: ['techno', 'trance', 'dnb'],
  hypnotic: ['techno', 'trance', 'ambient'],
  uplifting: ['trance', 'house', 'pop'],
  driving: ['techno', 'dnb', 'trance'],
  melancholic: ['lofi', 'ambient', 'cinematic'],
  energetic: ['techno', 'trap', 'dnb'],
  dreamy: ['ambient', 'trance', 'lofi'],
  aggressive: ['dubstep', 'trap', 'dnb'],
};

// UseCase weighting bias -----------------------------------------------------
const USECASE_BIAS: Partial<Record<NonNullable<IntentInput['useCase']>, Record<GenreId, number>>> = {
  club: { techno: 0.15, trance: 0.1, house: 0.12, dnb: 0.08 },
  cinematic: { cinematic: 0.25, ambient: 0.15, orchestral: 0.2 },
  lofi: { lofi: 0.3, hiphop: 0.1 },
  game: { ambient: 0.12, cinematic: 0.15, techno: 0.05 },
  ambient: { ambient: 0.3, cinematic: 0.1 },
  pop: { pop: 0.3, house: 0.08 },
};

// Era bias (tiny nudge) ------------------------------------------------------
const ERA_BIAS: Partial<Record<NonNullable<IntentInput['era']>, Record<GenreId, number>>> = {
  '90s': { techno: 0.07, trance: 0.07, hiphop: 0.05 },
  '2000s': { trance: 0.06, dubstep: 0.05, pop: 0.04 },
  futuristic: { techno: 0.05, trap: 0.05, ambient: 0.05 },
};

/** Aggregate heuristic scoring of candidate genres based on mood overlap + biases. */
function scoreGenres(intent: IntentNormalized): Map<GenreId, { score: number; coverage: number; rationaleParts: string[] }> {
  const map = new Map<GenreId, { score: number; coverage: number; rationaleParts: string[] }>();
  const moods = intent.moods;
  // Mood contributions
  moods.forEach(m => {
    const hints = MOOD_GENRE_HINTS[m];
    if (!hints) return;
    hints.forEach((g, idx) => {
      const base = 1 - idx * 0.15; // diminishing weight within hint list
      const cur = map.get(g) || { score: 0, coverage: 0, rationaleParts: [] };
      cur.score += base;
      cur.coverage += 1 / moods.length; // simple additive coverage
      cur.rationaleParts.push(`mood:${m}`);
      map.set(g, cur);
    });
  });
  // Use case bias
  const ub = intent.useCase && USECASE_BIAS[intent.useCase];
  if (ub) {
    Object.entries(ub).forEach(([g, w]) => {
      const cur = map.get(g) || { score: 0, coverage: 0, rationaleParts: [] };
      cur.score += w;
      cur.rationaleParts.push(`useCase:${intent.useCase}`);
      map.set(g, cur);
    });
  }
  // Era bias
  const eb = intent.era && ERA_BIAS[intent.era];
  if (eb) {
    Object.entries(eb).forEach(([g, w]) => {
      const cur = map.get(g) || { score: 0, coverage: 0, rationaleParts: [] };
      cur.score += w;
      cur.rationaleParts.push(`era:${intent.era}`);
      map.set(g, cur);
    });
  }
  // Intensity: slight scaling emphasising high energy genres if intensity >=4
  if (intent.intensity >= 4) {
    ['techno', 'trance', 'dnb', 'dubstep', 'trap'].forEach(g => {
      const cur = map.get(g);
      if (cur) {
        cur.score *= 1.08; // small boost
        cur.rationaleParts.push('intensity:boost');
      }
    });
  }
  return map;
}

/** Convert raw map into sorted top N candidates with final normalization */
function finalizeCandidates(map: Map<GenreId, { score: number; coverage: number; rationaleParts: string[] }>, topN = 3): GenreCandidate[] {
  const entries = Array.from(map.entries()).map(([genre, v]) => ({
    genre,
    confidence: v.score,
    rationale: v.rationaleParts.join(', '),
    moodCoverage: Math.min(1, v.coverage),
  }));
  if (entries.length === 0) return [];
  // Normalize scores to 0..1
  const max = Math.max(...entries.map(e => e.confidence));
  entries.forEach(e => (e.confidence = max > 0 ? +(e.confidence / max).toFixed(3) : 0));
  entries.sort((a, b) => b.confidence - a.confidence);
  return entries.slice(0, topN);
}

/** Public API: generate top 3 genre candidates for a raw user intent */
export function recommendGenres(raw: IntentInput): RecommendationResult {
  const { normalized, issues } = validateIntent(raw);
  const scored = scoreGenres(normalized);
  const candidates = finalizeCandidates(scored, 3);
  return { intent: normalized, candidates, issues };
}

// Convenience: quick single top genre (returns undefined if no candidates)
export function recommendPrimaryGenre(raw: IntentInput): GenreId | undefined {
  return recommendGenres(raw).candidates[0]?.genre;
}

// For potential UI debugging / logging.
export function debugRecommend(raw: IntentInput): void {
  const r = recommendGenres(raw);
  // eslint-disable-next-line no-console
  console.log('[recommendGenres]', r.intent, r.candidates, r.issues);
}

// Simple test hook (not a formal test framework, just runtime assertion)
// Lightweight inline sanity check when a test runner (like Vitest) augments import.meta
// Avoids adding a test framework dependency right now.
if ((import.meta as any).vitest) {
  const trial = recommendGenres({ moods: ['dark', 'hypnotic'], intensity: clampIntensity(4) });
  if (!trial.candidates.length) {
    console.warn('No candidates produced for base trial');
  }
}

export default recommendGenres;
