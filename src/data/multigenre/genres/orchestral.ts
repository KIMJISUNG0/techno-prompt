import { GenrePack, Opt } from '../schema';
const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const orchestralPack: GenrePack = {
  id: 'orchestral',
  label: 'Orchestral',
  description: 'Symphonic orchestral palette',
  orderWeight: 60,
  inheritsUniversal: true,
  groups: [ g('strings','Strings'), g('brass','Brass'), g('winds','Winds'), g('percOrch','Percussion') ],
  options: [
    o('orc-strings-legato','Legato Strings','lush legato strings','strings',{primary:true}),
    o('orc-strings-stacc','Staccato Strings','tight staccato strings','strings'),
    o('orc-brass-fanfare','Brass Fanfare','heroic brass fanfare','brass'),
    o('orc-winds-flute-air','Flute Air','airy expressive flute','winds'),
    o('orc-perc-taiko','Taiko Ensemble','deep taiko ensemble','percOrch'),
    o('orc-perc-cym-swell','Cymbal Swell','orchestral cymbal swell','percOrch'),
  ],
  subopts: {
    'orc-strings-legato':[ {id:'str-legato-wide',label:'Wide',prompt:'wide stereo legato'}, {id:'str-legato-warm',label:'Warm',prompt:'warm tone legato'} ],
    'orc-perc-taiko':[ {id:'taiko-soft-mallet',label:'Soft Mallet',prompt:'soft mallet taiko'} ]
  }
};
