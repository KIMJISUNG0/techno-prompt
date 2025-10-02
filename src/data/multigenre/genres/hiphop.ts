import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const hiphopPack: GenrePack = {
  id: 'hiphop',
  label: 'Hip Hop',
  description: 'Beats / boom bap / trap hybrid',
  orderWeight: 40,
  inheritsUniversal: true,
  groups: [ g('drumFeel','Drum Feel') ],
  options: [
    o('hh-808-sub','808 Sub','808 sustained sub','bass',{primary:true}),
    o('hh-snare-crack','Snare Crack','snare crack layer','rhythm'),
    o('hh-hat-triplet','Hat Triplet','trap hat triplets','rhythm'),
    o('hh-vinyl-noise','Vinyl Noise','vinyl crackle texture','drumFeel'),
  ],
  subopts: {}
};
