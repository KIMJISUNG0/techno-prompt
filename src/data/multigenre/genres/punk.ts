import { GenrePack, Opt } from '../schema';

const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const punkPack: GenrePack = {
  id: 'punk',
  label: 'Punk / Alt Punk',
  description: 'Core punk energy, alternative and revival flavors',
  orderWeight: 35,
  inheritsUniversal: true,
  groups: [
    g('rhythm','Rhythm Guitar'),
    g('bass','Bass'),
    g('drums','Drums'),
    g('vocals','Vocals'),
    g('arrangement','Arrangement'),
    g('texture','Texture / FX'),
    g('performance','Performance'),
  ],
  options: [
    o('punk-gtr-powerchord','Power Chords','crunchy saturated power chords','rhythm',{family:'gtr',primary:true}),
    o('punk-gtr-melodic-octaves','Melodic Octaves','driving octave melody lines','rhythm',{family:'melodic'}),
    o('punk-gtr-dissonant-stab','Dissonant Stabs','tight dissonant chord stabs','rhythm'),
    o('punk-bass-pick-growl','Pick Bass Growl','aggressive mid growl picked bass','bass',{family:'pick',primary:true}),
    o('punk-bass-driving-root','Driving Root Bass','straight driving root notes','bass',{family:'root'}),
    o('punk-drums-fast-kit','Fast Kit','fast tight punchy kit','drums',{family:'kit',primary:true}),
    o('punk-drums-dbeat-fill','D-Beat Fills','d-beat style snare drive fills','drums'),
    o('punk-vocal-shout','Shouted Vox','raw shouted vocal delivery','vocals',{family:'shout',primary:true}),
    o('punk-vocal-gang','Gang Vox','group gang vocal chants','vocals',{family:'gang'}),
    o('punk-arr-break-stop','Break Stop','sudden break + stop hit','arrangement'),
    o('punk-arr-prechorus-lift','Pre-Chorus Lift','energy lift transition','arrangement'),
    o('punk-texture-noise-swell','Guitar Noise Swell','feedback swell / pick scrape','texture',{family:'noise'}),
    o('punk-texture-tape-hiss','Tape Hiss Layer','subtle analog hiss texture','texture',{family:'hiss'}),
    o('punk-perf-stage-energy','Stage Energy','live stage movement energy','performance'),
  ],
  subopts: {
    'punk-gtr-powerchord':[ {id:'pwr-palm-tight',label:'Palm Tight',prompt:'tight palm mute accents'}, {id:'pwr-open-ring',label:'Open Ring',prompt:'open ringing sustain'} ],
    'punk-bass-pick-growl':[ {id:'bass-slide-up',label:'Slide Up',prompt:'quick slide up accent'} ],
  }
};
