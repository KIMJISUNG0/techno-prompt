import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const dubstepPack: GenrePack = {
  id: 'dubstep',
  label: 'Dubstep',
  description: 'Half-time heavy bass design',
  orderWeight: 35,
  inheritsUniversal: true,
  groups: [ g('bassDesign','Bass Design') ],
  options: [
    o('ds-wobble-bass','Wobble Bass','lfo wobble bass mod','bassDesign',{primary:true}),
    o('ds-growl-bass','Growl Bass','formant growl bass','bassDesign'),
    o('ds-screech-lead','Screech Lead','aggressive screech lead','synths'),
    o('ds-riser-long','Long Riser','long tension riser','fx'),
  ],
  subopts: {}
};
