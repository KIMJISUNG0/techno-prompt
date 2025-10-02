// Tiered genre-specific recommended option IDs
// core: essential building blocks; advanced: deeper or experimental layers
export interface GenreRecommendation {
  core: string[];
  advanced: string[];
}

export const recommendedByGenre: Record<string, GenreRecommendation> = {
  techno: {
    core: [ '909','acidBass','rumbleBass','kickPunch','claps','hatsOffbeat','sidechain','transientControl','multiBandDrive','mstLimiter' ],
    advanced: [ 'spectralPad','polyRhythmSeq','energyCurve','spectralDenoise','glitch','phaseAlign','dynamicEq','mstStereoStage','mstExciterHi','mstDynamicEq','mstMSEDynamic','mstLufsTarget' ],
  },
  hiphop: { core:['univ-fx-tex-vinyl','univ-fx-dist-tapeSat','univ-proc-sidechain','univ-mix-headroom'], advanced:['univ-fx-tex-noiseBed','univ-proc-glueComp','univ-master-limiter','univ-master-exciter'] },
  boomBap: { core:['bb-dusty-kick','bb-snare-crack','bb-hat-swing','bb-vinyl-noise'], advanced:['bb-bass-boom','univ-fx-tex-vinyl','univ-master-headroom'] },
  trap: { core:['trap-hihat-triplet','trap-808-sub','univ-proc-sidechain'], advanced:['trap-vox-chop','univ-fx-del-pingpong','univ-master-limiter'] },
  lofiBeats: { core:['lofi-tape-hiss','lofi-warp-pitch','lofi-chords-jazz'], advanced:['univ-fx-tex-tapeHiss','univ-fx-tex-noiseBed','univ-master-headroom'] },
  house: { core: ['univ-fx-riser','univ-fx-impact','house-piano-stab','house-bass-pluck'], advanced: ['univ-fx-del-pingpong','univ-fx-rev-plate','univ-proc-glueComp'] },
  trance:{ core: ['univ-fx-riser','univ-fx-impact','trance-supersaw','trance-pluck'], advanced: ['trance-riser-chord','univ-fx-rev-shimmer','univ-fx-del-multitap'] },
  dnb: { core:['dnb-break-amen','dnb-reese-mod','univ-proc-sidechain'], advanced:['dnb-break-rearranged','dnb-riser-tear','univ-fx-del-multitap'] },
  dubstep: { core:['ds-wobble-bass','ds-growl-bass','univ-fx-dist-wavefold'], advanced:['ds-screech-lead','univ-fx-dist-bitcrush','univ-fx-fil-morph'] },
  techhouse: { core:['th-bass-wobble','th-groove-fx-fill','th-chord-shot'], advanced:['univ-proc-sidechain','univ-fx-del-pingpong','univ-fx-mod-chorus'] },
  ambient: { core:['amb-drone-low','amb-texture-grain','univ-fx-rev-shimmer'], advanced:['amb-drone-air','univ-fx-tex-granularWash','univ-fx-rev-plate'] },
  orchestral: { core:['orc-strings-legato','orc-perc-taiko','orc-brass-fanfare'], advanced:['orc-strings-stacc','orc-perc-cym-swell','univ-master-limiter'] },
  cinematic: { core:['cine-brahm-hit','cine-perc-ensemble','cine-whoosh-rise'], advanced:['cine-string-ostinato','univ-fx-riser','univ-master-limiter'] },
  pop: { core:['pop-hook-lead','pop-chord-pluck','univ-fx-del-pingpong'], advanced:['pop-vocal-chop','univ-mix-wide','univ-master-limiter'] },
};

export function getRecommendedSet(genre: string, tier: 'core' | 'advanced' | 'all' = 'core'): Set<string> {
  const rec = recommendedByGenre[genre];
  if (!rec) return new Set();
  if (tier==='all') return new Set([...rec.core, ...rec.advanced]);
  return new Set(rec[tier]);
}
