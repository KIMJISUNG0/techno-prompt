import { technoPack } from './techno';
import { housePack } from './house';
import { trancePack } from './trance';
import { hiphopPack } from './hiphop';
import { ambientPack } from './ambient';
import { techHousePack } from './techhouse';
import { dubstepPack } from './dubstep';
import { orchestralPack } from './orchestral';
import type { GenrePack } from '../schema';

export const GENRE_PACKS: GenrePack[] = [
  technoPack,
  housePack,
  trancePack,
  hiphopPack,
  ambientPack,
  techHousePack,
  dubstepPack,
  orchestralPack,
];
