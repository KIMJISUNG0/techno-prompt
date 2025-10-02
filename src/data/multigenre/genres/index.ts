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
import type { GenrePack } from '../schema';

export const GENRE_PACKS: GenrePack[] = [
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
];
