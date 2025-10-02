import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const boomBapPack: GenrePack = {
  id: 'boomBap',
  label: 'Boom Bap',
  description: 'Classic drum-heavy hip hop style',
  orderWeight: 41,
  inheritsUniversal: true,
  groups: [ g('drumFeel','Drum Feel') ],
  options: [
    o('bb-dusty-kick','Dusty Kick','dusty sampled kick','rhythm',{primary:true}),
    o('bb-snare-crack','Snare Crack','cracking snare layer','rhythm'),
    o('bb-hat-swing','Swing Hat','swinging hat pattern','rhythm'),
    o('bb-vinyl-noise','Vinyl Noise','vinyl noise layer','drumFeel'),
    o('bb-bass-boom','Boom Bass','round boom bass sustain','bass'),
  ],
  subopts: {}
};
