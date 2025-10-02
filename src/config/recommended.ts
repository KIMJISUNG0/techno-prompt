// Tiered genre-specific recommended option IDs
// core: essential building blocks; advanced: deeper or experimental layers
export interface GenreRecommendation {
  core: string[];
  advanced: string[];
}

export const recommendedByGenre: Record<string, GenreRecommendation> = {
  techno: {
    core: [
      '909','acidBass','rumbleBass','kickPunch','claps','hatsOffbeat','sidechain','transientControl','multiBandDrive'
    ],
    advanced: [
      'spectralPad','polyRhythmSeq','energyCurve','spectralDenoise','glitch','phaseAlign','dynamicEq',
      'mstLimiter','mstStereoStage','mstExciterHi','mstDynamicEq','mstMSEDynamic','mstLufsTarget'
    ],
  },
  house: { core: ['univ-fx-riser','univ-fx-impact'], advanced: [] },
  trance:{ core: ['univ-fx-riser','univ-fx-impact'], advanced: [] },
};

export function getRecommendedSet(genre: string, tier: 'core' | 'advanced' | 'all' = 'core'): Set<string> {
  const rec = recommendedByGenre[genre];
  if (!rec) return new Set();
  if (tier==='all') return new Set([...rec.core, ...rec.advanced]);
  return new Set(rec[tier]);
}
