import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const cinematicPack: GenrePack = {
  id: 'cinematic',
  label: 'Cinematic',
  description: 'Score & trailer hybrid energy',
  orderWeight: 65,
  inheritsUniversal: true,
  groups: [ g('scorePerc','Score Percussion'), g('hybridHits','Hybrid Hits') ],
  options: [
    o('cine-brahm-hit','Brahm Hit','massive brahm hit','hybridHits',{primary:true}),
    o('cine-whoosh-rise','Whoosh Rise','whoosh rise transition','fx'),
    o('cine-perc-ensemble','Perc Ensemble','cinematic perc ensemble','scorePerc'),
    o('cine-string-ostinato','String Ostinato','driving string ostinato','synths'),
  ],
  subopts: {}
};
