import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const techHousePack: GenrePack = {
  id: 'techhouse',
  label: 'Tech House',
  description: 'Groovy hybrid of techno & house',
  orderWeight: 25,
  inheritsUniversal: true,
  groups: [ g('grooveFx','Groove FX') ],
  options: [
    o('th-bass-wobble','Wobble Bass','light wobble bass groove','bass'),
    o('th-perc-ghost','Ghost Perc','syncopated ghost perc','rhythm'),
    o('th-groove-fx-fill','FX Fill','short fx fill blur','grooveFx'),
    o('th-chord-shot','Chord Shot','tight chord shot','synths'),
  ],
  subopts: {}
};
