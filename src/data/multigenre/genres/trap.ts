import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const trapPack: GenrePack = {
  id: 'trap',
  label: 'Trap',
  description: 'Modern trap bounce & 808s',
  orderWeight: 42,
  inheritsUniversal: true,
  groups: [ g('hiHatArt','Hi-Hat Articulation') ],
  options: [
    o('trap-hihat-triplet','Triplet Hats','rapid triplet hats','hiHatArt',{primary:true}),
    o('trap-808-sub','808 Sub','long 808 sub sustain','bass'),
    o('trap-vox-chop','Vox Chop','vocal chop layer','synths'),
    o('trap-snare-ghost','Ghost Snare','ghosted snare rolls','rhythm'),
  ],
  subopts: {
    'trap-hihat-triplet':[ {id:'hat-triplet-roll',label:'Roll',prompt:'trap hat roll burst'} ]
  }
};
