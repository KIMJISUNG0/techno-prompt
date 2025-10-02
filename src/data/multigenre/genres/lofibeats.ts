import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const lofiBeatsPack: GenrePack = {
  id: 'lofiBeats',
  label: 'Lo-fi Beats',
  description: 'Dusty mellow chillhop vibe',
  orderWeight: 52,
  inheritsUniversal: true,
  groups: [ g('tape','Tape / Texture') ],
  options: [
    o('lofi-tape-hiss','Tape Hiss','soft tape hiss bed','tape',{primary:true}),
    o('lofi-warp-pitch','Warp Pitch','warped pitch drift','tape'),
    o('lofi-chords-jazz','Jazz Chords','jazzy lo-fi chords','synths'),
    o('lofi-dust-perc','Dust Perc','dusty perc hits','rhythm'),
  ],
  subopts: {}
};
