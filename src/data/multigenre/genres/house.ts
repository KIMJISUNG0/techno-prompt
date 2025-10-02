import { GenrePack, Opt } from '../schema';

const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const housePack: GenrePack = {
  id: 'house',
  label: 'House',
  description: 'Classic & modern house grooves',
  orderWeight: 20,
  inheritsUniversal: true,
  groups: [ g('piano','Piano / Keys') ],
  options: [
    o('house-piano-stab','Piano Stab','house piano stabs','piano',{primary:true}),
    o('house-organ','Organ M1','m1 organ motif','piano'),
    o('house-shuffle-hat','Shuffle Hat','shuffled hat pattern','rhythm'),
    o('house-bass-pluck','Bass Pluck','bouncy house bass','bass'),
  ],
  subopts: {
    'house-piano-stab':[ {id:'hpst-short',label:'Short',prompt:'short piano stab'}, {id:'hpst-wide',label:'Wide',prompt:'wide stereo piano'} ]
  }
};
