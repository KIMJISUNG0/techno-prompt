import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true):any=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const countryPack: GenrePack = {
  id:'country',
  label:'Country',
  description:'Modern & classic country instrumentation',
  orderWeight:45,
  inheritsUniversal:true,
  groups:[
    g('drums','Drums'),
    g('bass','Bass'),
    g('guitar','Guitars'),
    g('keys','Keys'),
    g('lead','Lead / Vocal'),
    g('arrangement','Arrangement'),
    g('texture','Texture / FX'),
    g('performance','Performance')
  ],
  options:[
    o('country-drum-tight-kit','Tight Nashville Kit','tight dry nashville kit','drums',{family:'kit',primary:true}),
    o('country-drum-brush-swell','Brush Swells','brush snare swells','drums'),
    o('country-bass-upright','Upright Bass','woody upright bass tone','bass',{family:'upright',primary:true}),
    o('country-bass-walking','Walking Bass Pass','walking bass passing tones','bass'),
    o('country-gtr-acoustic-strum','Acoustic Strum','bright steel acoustic strums','guitar',{family:'acoustic',primary:true}),
    o('country-gtr-acoustic-pick','Acoustic Picking','finger picked patterns','guitar'),
    o('country-gtr-tele-twang','Tele Twang Lead','clean telecaster twang lead','guitar',{family:'electric'}),
    o('country-gtr-slide','Slide Guitar Licks','bottleneck slide accents','guitar'),
    o('country-keys-hammond','Hammond Pad','soft hammond organ bed','keys',{family:'organ'}),
    o('country-keys-piano','Piano Support','supportive piano chord bed','keys'),
    o('country-lead-vocal','Story Vocal','narrative lead vocal','lead',{family:'vocal',primary:true}),
    o('country-lead-harmony','Harmony Stack','tight high harmony vocal','lead'),
    o('country-arr-prechorus','Pre-Chorus Lift','build energy before chorus','arrangement'),
    o('country-arr-double-chorus','Double Chorus','final double chorus impact','arrangement'),
    o('country-texture-tape','Tape Saturation Layer','subtle tape warmth layer','texture'),
    o('country-texture-room','Room Ambience','natural small room ambience','texture'),
    o('country-perf-swing-feel','Swing Feel','laid back swing push pull','performance'),
  ],
  subopts:{
    'country-gtr-acoustic-strum':[ {id:'strum-muted',label:'Muted',prompt:'muted percussive strums'} ],
    'country-gtr-tele-twang':[ {id:'tele-bend',label:'Bend Accents',prompt:'bent note accents'} ]
  }
};
