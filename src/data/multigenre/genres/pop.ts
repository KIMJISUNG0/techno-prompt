import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const popPack: GenrePack = {
  id: 'pop',
  label: 'Pop',
  description: 'Mainstream pop structures',
  orderWeight: 70,
  inheritsUniversal: true,
  groups: [ g('hooks','Hooks') ],
  options: [
    o('pop-hook-lead','Hook Lead','catchy hook lead','hooks',{primary:true}),
    o('pop-chord-pluck','Chord Pluck','bright pop pluck','synths'),
    o('pop-vocal-chop','Vocal Chop','processed vocal chop','hooks'),
    o('pop-impact-fill','Impact Fill','impact fill transition','fx'),
  ],
  subopts: {}
};
