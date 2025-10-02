import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const trancePack: GenrePack = {
  id: 'trance',
  label: 'Trance',
  description: 'Uplifting / progressive trance',
  orderWeight: 30,
  inheritsUniversal: true,
  groups: [ g('uplift','Uplift Elements') ],
  options: [
    o('trance-supersaw','Supersaw Stack','lush supersaw stack','synths',{primary:true}),
    o('trance-pluck','Pluck Delay','syncopated delay pluck','synths'),
    o('trance-riser-chord','Riser Chord','long chord riser','uplift'),
    o('trance-snare-roll','Snare Roll','snare roll build','rhythm'),
  ],
  subopts: {}
};
