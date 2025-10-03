/**
 * Core Intent Model (Phase 1)
 * ------------------------------------
 * This file defines the minimal type surface for the new intent‑first
 * composition flow. It mirrors the schema outlined in docs/INTENT_MODEL.md.
 *
 * Goals:
 * - Extremely small & stable base (safe to import broadly)
 * - Plain data objects (no React / side effects)
 * - Helper utilities for validation + concise description
 */

// Mood: kept intentionally open ended; we expose a recommended starter union
// for autocomplete while allowing arbitrary extension (string widening).
export type CoreMood =
  | 'dark'
  | 'hypnotic'
  | 'uplifting'
  | 'driving'
  | 'melancholic'
  | 'energetic'
  | 'dreamy'
  | 'aggressive';

export type Mood = CoreMood | (string & {}); // allow custom user mood tokens

// Use cases we explicitly reason about in heuristics / recommendations.
export type UseCase = 'club' | 'cinematic' | 'lofi' | 'game' | 'ambient' | 'pop';

// Temporal / stylistic era hints – kept small; anything outside becomes 'modern'.
export type Era = '90s' | '2000s' | 'modern' | 'futuristic';

// Intensity: 1..5 scale. We brand the number to prevent accidental arithmetic
// without intentional casting (lightweight nominal typing pattern).
export type IntensityLevel = number & { readonly __tag: 'IntensityLevel(1-5)'};

export interface IntentInput {
  moods: Mood[];              // e.g. ['dark','hypnotic'] – order can matter for weight later
  useCase?: UseCase;
  era?: Era;
  intensity: IntensityLevel;  // expected 1..5 (clamped when normalized)
  durationSec?: number;       // optional target total track length
}

// Normalized variant ensures sane bounds and at least one mood.
export interface IntentNormalized extends Omit<IntentInput, 'intensity'> {
  intensity: IntensityLevel;  // guaranteed clamped 1..5
  moods: Mood[];              // guaranteed length >=1 (fallback: ['dark'])
}

// Result of a basic validation pass.
export interface IntentValidation {
  issues: string[];           // human readable validation issues (non-fatal)
  normalized: IntentNormalized;
}

// Factory helpers -----------------------------------------------------------

/** Clamp a raw numeric value to the 1..5 IntensityLevel branded type */
export function clampIntensity(n: number): IntensityLevel {
  const v = Math.min(5, Math.max(1, Math.round(n || 1)));
  return v as IntensityLevel;
}

/** Produce a normalized intent + collect soft validation issues */
export function validateIntent(input: IntentInput): IntentValidation {
  const issues: string[] = [];
  let moods = (input.moods || []).map(m => m.trim()).filter(Boolean);
  if (moods.length === 0) {
    issues.push('No moods supplied – defaulted to ["dark"].');
    moods = ['dark'];
  }
  // Deduplicate while preserving first occurrence order.
  const seen = new Set<string>();
  moods = moods.filter(m => (seen.has(m) ? false : (seen.add(m), true)));

  const intensity = clampIntensity(input.intensity);
  if (intensity !== input.intensity) {
    issues.push('Intensity clamped to 1..5 range.');
  }

  // Duration soft check (we allow anything but flag extremes)
  if (input.durationSec && (input.durationSec < 15 || input.durationSec > 600)) {
    issues.push('Unusual duration (outside 15s..600s) – ensure intentional.');
  }

  const normalized: IntentNormalized = {
    moods,
    useCase: input.useCase,
    era: input.era || 'modern',
    intensity,
    durationSec: input.durationSec,
  };
  return { issues, normalized };
}

/** Build a concise textual descriptor useful for logs or UI badges */
export function describeIntentShort(intent: IntentInput | IntentNormalized): string {
  const { moods, intensity, useCase, era } = intent;
  const moodPart = moods.slice(0, 2).join('/');
  const extras: string[] = [];
  if (useCase) extras.push(useCase);
  if (era && era !== 'modern') extras.push(era);
  return `${moodPart} • intens:${intensity}${extras.length ? ' • ' + extras.join(' • ') : ''}`;
}

// Placeholder exported constant for downstream modules/tests to assert presence.
export const INTENT_TYPES_VERSION = 1 as const;

// Lightweight type guard for runtime inputs (partial resilience when receiving
// deserialized JSON). This intentionally stays permissive (soft-fail approach).
export function isIntentInput(obj: any): obj is IntentInput {
  return obj && Array.isArray(obj.moods) && typeof obj.intensity === 'number';
}

// Future extension notes ---------------------------------------------
// Phase 2 may introduce: tempoBias, textureWords, variationGoal, referenceTrackTokens.
// Keep this file additive; avoid breaking changes to existing keys.

export default IntentInput;
