import { GenrePack, Opt } from '../schema';

const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const technoPack: GenrePack = {
  id: 'techno',
  label: 'Techno',
  description: 'Modern / classic techno elements',
  orderWeight: 10,
  inheritsUniversal: true,
  groups: [
    g('soundDesign','Sound Design'),
    g('atmosphere','Atmosphere'),
    g('arrangement','Arrangement'),
    g('performance','Performance / Live'),
    g('meters','Meters / Targets'),
  ],
  options: [
    o('tech-909-kit','TR-909 Kit','tr-909 drum engine','rhythm',{family:'kit',primary:true}),
    o('tech-acid-bass','Acid Bass 303','acid 303 squelch','bass',{family:'acid',primary:true}),
    o('tech-rumble-bass','Rumble Bass','rumbling sustained bass','bass',{family:'sustain'}),
    o('tech-chord-stab','Chord Stab','percussive chord stabs','synths',{family:'stab',primary:true}),
    o('tech-hoover-lead','Hoover Lead','hoover rave lead','synths',{family:'lead'}),
    o('tech-granular-texture','Granular Texture','granular evolving texture','synths',{family:'texture'}),
    o('tech-atmo-warehouse','Warehouse Verb','warehouse ambience','atmosphere',{family:'space'}),
    o('tech-fx-noise-sweep','Noise Sweep','white-noise sweeps','fx',{family:'sweep'}),
    o('tech-perf-filter-jam','Filter Jam','improvised filter sweeps','performance'),
    o('tech-arr-breakdown','Breakdown','dramatic breakdown','arrangement'),
    o('tech-meter-lufs','LUFS -6.5','target -6.5 LUFS short-term','meters'),
  ],
  subopts: {
    'tech-909-kit':[ {id:'909-kick-long2',label:'Kick Long',prompt:'909 kick long tail'}, {id:'909-hat-open',label:'Open Hat',prompt:'909 open hat bright'} ],
    'tech-acid-bass':[ {id:'303-slide-lite',label:'Slide Lite',prompt:'light slide accents'} ]
  }
};
