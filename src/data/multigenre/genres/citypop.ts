import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true):any=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const cityPopPack: GenrePack = {
  id:'citypop',
  label:'City Pop',
  description:'80s Japanese city pop / modern revival blend',
  orderWeight:50,
  inheritsUniversal:true,
  groups:[
    g('drums','Drums / Groove'),
    g('bass','Bass'),
    g('keys','Keys / Chords'),
    g('guitar','Guitars'),
    g('synth','Synth / Lead'),
    g('vocals','Vocals'),
    g('arrangement','Arrangement'),
    g('texture','Texture / FX'),
    g('performance','Performance')
  ],
  options:[
    o('city-drum-soft-gate','Soft Gated Kit','soft gated reverb drum aesthetic','drums',{family:'kit',primary:true}),
    o('city-drum-perc-fill','Perc Fills','light percussive fills','drums'),
    o('city-bass-finger-warm','Finger Bass Warm','warm fingerstyle bass','bass',{family:'warm',primary:true}),
    o('city-bass-slap-accents','Slap Accents','tasteful slap accents','bass'),
    o('city-keys-fm-e-piano','FM E-Piano','glassy fm electric piano','keys',{family:'ep',primary:true}),
    o('city-keys-jazz-extensions','Jazz Extensions','9th 11th 13th chord colors','keys'),
    o('city-gtr-clean-chorus','Clean Chorus Gtr','clean chorus electric guitar','guitar',{family:'clean',primary:true}),
    o('city-gtr-funk-comp','Funk Comp Gtr','tight funk comp guitar','guitar'),
    o('city-synth-analog-lead','Analog Lead','silky analog style lead','synth',{family:'lead',primary:true}),
    o('city-synth-brass-stack','Synth Brass Stack','layered synth brass hits','synth'),
    o('city-vocal-soft-lead','Soft Lead Vocal','smooth intimate vocal','vocals',{family:'vocal',primary:true}),
    o('city-vocal-harmony-air','Airy Harmony','airy harmony stacks','vocals'),
    o('city-arr-bridge-mod','Bridge Modulation','bridge key modulation','arrangement'),
    o('city-arr-sax-solo-slot','Sax Solo Slot','space for sax solo feature','arrangement'),
    o('city-texture-cassette','Cassette Flutter','subtle cassette flutter texture','texture'),
    o('city-texture-night-amb','Night Ambience','urban night ambience layer','texture'),
    o('city-perf-tight-groove','Tight Groove Feel','precise pocket timing','performance'),
  ],
  subopts:{
    'city-keys-fm-e-piano':[ {id:'ep-chorus',label:'Chorus FX',prompt:'lush chorus fx layer'} ],
    'city-gtr-clean-chorus':[ {id:'gtr-mute-chop',label:'Mute Chop',prompt:'muted chop rhythm'} ]
  }
};
