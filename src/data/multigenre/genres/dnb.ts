import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const dnbPack: GenrePack = {
  id: 'dnb',
  label: 'Drum & Bass',
  description: 'Fast breakbeats & rolling basslines',
  orderWeight: 32,
  inheritsUniversal: true,
  groups: [ g('breaks','Breakbeats'), g('neuro','Neuro Elements') ],
  options: [
    o('dnb-break-amen','Amen Break','processed amen break','breaks',{primary:true}),
    o('dnb-break-rearranged','Rearranged Break','chopped rearranged break','breaks'),
    o('dnb-reese-mod','Mod Reese','modulated reese bass','neuro',{primary:true}),
    o('dnb-stab-chord','Chord Stab','dnb chord stab layer','synths'),
    o('dnb-riser-tear','Tear Riser','tearing riser fx','fx'),
  ],
  subopts: {
    'dnb-break-amen':[ {id:'amen-pitchup',label:'Pitch Up',prompt:'pitch up amen slices'} ],
    'dnb-reese-mod':[ {id:'reese-formant',label:'Formant',prompt:'formant mod reese'} ],
  }
};
