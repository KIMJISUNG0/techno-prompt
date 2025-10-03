import { technoPack } from './techno';
import { housePack } from './house';
import { trancePack } from './trance';
import { hiphopPack } from './hiphop';
import { ambientPack } from './ambient';
import { techHousePack } from './techhouse';
import { dubstepPack } from './dubstep';
import { orchestralPack } from './orchestral';
import { dnbPack } from './dnb';
import { boomBapPack } from './boombap';
import { trapPack } from './trap';
import { lofiBeatsPack } from './lofibeats';
import { popPack } from './pop';
import { cinematicPack } from './cinematic';
import { punkPack } from './punk';
import { rnbPack } from './rnb';
import { countryPack } from './country';
import { cityPopPack } from './citypop';
import { kpopPack } from './kpop';
import { synthwavePack } from './synthwave';
import { futureGaragePack } from './futuregarage';
import { reggaetonPack } from './reggaeton';
import { afrobeatPack } from './afrobeat';
import { jazzFusionPack } from './jazzfusion';
import { funkPack, funkDiscoPack, funkFusionPack, funkRockPack } from './funk';
import type { GenrePack } from '../schema';

const ALL_PACKS: GenrePack[] = [
  technoPack,
  housePack,
  trancePack,
  hiphopPack,
  boomBapPack,
  trapPack,
  lofiBeatsPack,
  ambientPack,
  dnbPack,
  techHousePack,
  dubstepPack,
  orchestralPack,
  cinematicPack,
  popPack,
  punkPack,
  rnbPack,
  countryPack,
  cityPopPack,
  kpopPack,
  synthwavePack,
  futureGaragePack,
  reggaetonPack,
  afrobeatPack,
  jazzFusionPack,
  funkPack,
  funkDiscoPack,
  funkFusionPack,
  funkRockPack,
];

// DEV 모드에서 특정 장르만 로딩하여 초기 빌드/리프레시 속도 향상.
// 사용: VITE_LIMIT_GENRES=techno,hiphop npm run dev
let limited: GenrePack[] | undefined;
if (typeof process !== 'undefined' && process.env && process.env.VITE_LIMIT_GENRES) {
  const allow = process.env.VITE_LIMIT_GENRES.split(',').map(s=> s.trim()).filter(Boolean);
  limited = ALL_PACKS.filter(p=> allow.includes(p.id));
  if (limited.length === 0) {
    // 잘못된 필터 시 전체 사용 (경고)
  console.warn('[genres] VITE_LIMIT_GENRES 지정했지만 매칭 없음 → 전체 사용');
    limited = undefined;
  } else {
  console.warn('[genres] 제한된 장르 로드:', allow.join(','));
  }
}
export const GENRE_PACKS: GenrePack[] = limited || ALL_PACKS;
