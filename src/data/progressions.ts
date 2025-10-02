// Genre-based chord progression patterns
import type { GenreId } from './multigenre/schema';

export interface ProgressionPattern {
  id: string;
  roman: string;           // canonical roman numeral string
  label: string;           // human label
  prompt: string;          // natural language fragment
  genres: GenreId[];       // applicable genres
  feelTags?: string[];     // loop, cadence, tension, lift
  weight?: number;         // base ranking
}

export const PROGRESSIONS: ProgressionPattern[] = [
  { id:'prog-251', roman:'ii-V-I', label:'2-5-1 Turnaround', prompt:'ii-V-I turnaround progression', genres:['trance','pop','lofiBeats'], feelTags:['cadence'], weight:9 },
  { id:'prog-1625', roman:'I-vi-ii-V', label:'1-6-2-5 Circle', prompt:'circle motion I-vi-ii-V', genres:['pop','lofiBeats','house'], feelTags:['loop','lift'], weight:8 },
  { id:'prog-1564', roman:'I-V-vi-IV', label:'Pop Progression', prompt:'I-V-vi-IV pop progression', genres:['pop','lofiBeats'], feelTags:['loop'], weight:10 },
  { id:'prog-6415', roman:'vi-IV-I-V', label:'Axis Variant', prompt:'vi-IV-I-V loop', genres:['pop','lofiBeats'], feelTags:['loop'], weight:8 },
  { id:'prog-ivbVI', roman:'i-bVI-bVII', label:'Minor Lift Loop', prompt:'i-bVI-bVII modal loop', genres:['hiphop','trap','techno','cinematic'], feelTags:['loop'], weight:8 },
  { id:'prog-iVIIVI', roman:'i-VII-VI-VII', label:'Ostinato Minor', prompt:'i-VII-VI-VII ostinato loop', genres:['trance','techno'], feelTags:['loop'], weight:7 },
  { id:'prog-iivI', roman:'ii-v-i', label:'Minor Cadence', prompt:'minor cadence ii-v-i', genres:['trance','cinematic'], feelTags:['cadence'], weight:7 },
  { id:'prog-iPivot', roman:'i-iv-bVI', label:'Modal Pivot', prompt:'i-iv-bVI modal color', genres:['cinematic','ambient','techno'], feelTags:['color'], weight:7 },
  { id:'prog-bVIbVII', roman:'i-bVII-bVI', label:'Descending Color', prompt:'i-bVII-bVI descending color move', genres:['trap','cinematic','ambient'], feelTags:['tension'], weight:6 },
  { id:'prog-tranceLift', roman:'I-V-vi-V', label:'Trance Lift', prompt:'I-V-vi-V lift cycle', genres:['trance'], feelTags:['lift'], weight:7 },
  { id:'prog-tranceDrive', roman:'i-VI-III-VII', label:'Minor Drive', prompt:'i-VI-III-VII driving minor loop', genres:['trance','techno'], feelTags:['drive','loop'], weight:7 },
  { id:'prog-dronePedal', roman:'i-(bVII)', label:'Pedal Drone', prompt:'i pedal with occasional bVII accent', genres:['techno','ambient'], feelTags:['drone'], weight:5 },
  { id:'prog-cinematicRise', roman:'i-bVI-bII', label:'Phrygian Rise', prompt:'i-bVI-bII phrygian color rise', genres:['cinematic'], feelTags:['tension','rise'], weight:8 },
  { id:'prog-cinematicEmo', roman:'i-iv-i-bVII', label:'Emotional Minor', prompt:'i-iv-i-bVII emotional minor phrase', genres:['cinematic','ambient'], feelTags:['emotive'], weight:6 },
  { id:'prog-lofiTurn', roman:'ii-v-I-vi', label:'Jazz Lofi Loop', prompt:'ii-v-I-vi jazz lofi loop', genres:['lofiBeats','hiphop'], feelTags:['loop','jazzy'], weight:7 }
];

export function recommendProgressions(genres:GenreId[], limit=5){
  const set = new Set(genres);
  const candidates = PROGRESSIONS.filter(p=> p.genres.some(g=> set.has(g)));
  const scored = candidates.map(p=> {
    const overlap = p.genres.filter(g=> set.has(g)).length;
    const score = (p.weight||5) + overlap*1.5 + (p.feelTags?.includes('loop')?0.2:0);
    return { p, score };
  }).sort((a,b)=> b.score - a.score).slice(0,limit).map(o=> o.p);
  return scored;
}
