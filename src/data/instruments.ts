// Core instrument catalog for Instrument Focus Mode
export interface CoreInstrument {
  id: string; label: string; prompt: string; families?: string[]; genreTags?: string[]; weight?: number;
}

export const INSTRUMENTS: CoreInstrument[] = [
  { id:'inst-pad-warm', label:'Warm Analog Pad', prompt:'warm analog pad', families:['pad'], genreTags:['ambient','trance','techno'], weight:10 },
  { id:'inst-pad-airy', label:'Airy Shimmer Pad', prompt:'airy shimmer pad', families:['pad'], genreTags:['ambient','cinematic'], weight:9 },
  { id:'inst-pad-dark', label:'Dark Drone Pad', prompt:'dark evolving drone pad', families:['pad','drone'], genreTags:['techno','cinematic'], weight:8 },
  { id:'inst-lead-saw', label:'Supersaw Lead', prompt:'anthemic wide supersaw lead', families:['lead'], genreTags:['trance','pop'], weight:10 },
  { id:'inst-lead-pluck', label:'Pluck Synth', prompt:'bright percussive pluck synth', families:['pluck'], genreTags:['trance','house','pop'], weight:7 },
  { id:'inst-bass-sub', label:'Deep Sub Bass', prompt:'clean deep sub bass foundation', families:['bass','sub'], genreTags:['trap','techno','dnb'], weight:10 },
  { id:'inst-bass-reese', label:'Reese Bass', prompt:'detuned reese bass layer', families:['bass','reese'], genreTags:['dnb','techno'], weight:9 },
  { id:'inst-keys-ep', label:'Electric Piano', prompt:'warm electric piano chords', families:['keys'], genreTags:['lofiBeats','hiphop','pop'], weight:8 },
  { id:'inst-texture-gran', label:'Granular Texture', prompt:'evolving granular texture bed', families:['texture'], genreTags:['ambient','cinematic'], weight:6 }
];

export type FxTier = 1|2|3;
export interface FxMeta { id:string; ref:string; tier:FxTier; label:string; category:string; }

// Map existing universal option ids to FX chain metadata (subset)
export const FX_CATALOG: FxMeta[] = [
  { id:'fx-chorus', ref:'univ-fx-mod-chorus', tier:1, label:'Chorus', category:'Modulation' },
  { id:'fx-phaser', ref:'univ-fx-mod-phaser', tier:1, label:'Phaser', category:'Modulation' },
  { id:'fx-flanger', ref:'univ-fx-mod-flanger', tier:1, label:'Flanger', category:'Modulation' },
  { id:'fx-tapeDelay', ref:'univ-fx-del-tape', tier:2, label:'Tape Delay', category:'Delay' },
  { id:'fx-pingpongDelay', ref:'univ-fx-del-pingpong', tier:2, label:'Ping-Pong Delay', category:'Delay' },
  { id:'fx-shimmerRev', ref:'univ-fx-rev-shimmer', tier:2, label:'Shimmer Reverb', category:'Reverb' },
  { id:'fx-hallRev', ref:'univ-fx-rev-hall', tier:2, label:'Hall Reverb', category:'Reverb' },
  { id:'fx-plateRev', ref:'univ-fx-rev-plate', tier:2, label:'Plate Reverb', category:'Reverb' },
  { id:'fx-sidechain', ref:'univ-proc-sidechain', tier:3, label:'Sidechain Pump', category:'Dynamics' },
  { id:'fx-glueComp', ref:'univ-proc-glueComp', tier:3, label:'Glue Comp', category:'Dynamics' },
  { id:'fx-imager', ref:'univ-proc-imagerMicro', tier:3, label:'Stereo Micro Shift', category:'Imaging' },
  { id:'fx-exciter', ref:'univ-proc-harmExciter', tier:3, label:'Harmonic Exciter', category:'Tone' },
];

export function buildInstrumentPrompt(instId:string, fxIds:string[]) {
  const inst = INSTRUMENTS.find(i=> i.id===instId);
  if (!inst) return '';
  const list = FX_CATALOG.filter(f=> fxIds.includes(f.id)).sort((a,b)=> a.tier - b.tier);
  const fxChunks = list.map(f=> f.label.toLowerCase());
  if (!fxChunks.length) return inst.prompt;
  return inst.prompt + ' with ' + fxChunks.join(', ');
}
