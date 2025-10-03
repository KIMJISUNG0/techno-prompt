import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true):any=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const rnbPack: GenrePack = {
  id:'rnb',
  label:'R&B / Soul',
  description:'Contemporary, neo and classic R&B / soul palette',
  orderWeight:40,
  inheritsUniversal:true,
  groups:[
    g('drums','Drums / Groove'),
    g('bass','Bass'),
    g('keys','Keys / Chords'),
    g('lead','Lead / Vocal'),
    g('texture','Texture / Atmos'),
    g('arrangement','Arrangement'),
    g('performance','Performance')
  ],
  options:[
    o('rnb-drum-silk-groove','Silky Groove Kit','smooth pocket neo-soul kit','drums',{family:'kit',primary:true}),
    o('rnb-drum-late-hat','Late Hat Ghosts','late shuffled hat and ghost notes','drums'),
    o('rnb-bass-round-warm','Round Warm Bass','round clean electric bass','bass',{family:'warm',primary:true}),
    o('rnb-bass-subslide','Sub Slide Accents','sub slides + gliss notes','bass'),
    o('rnb-keys-rhodes','Rhodes Chords','lush rhodes extended chords','keys',{family:'rhodes',primary:true}),
    o('rnb-keys-fender','Fender EP Layer','fender ep bell overtones','keys'),
    o('rnb-keys-jazz-voicing','Jazz Voicings','9th 11th 13th chord color','keys'),
    o('rnb-lead-soul-vocal','Soul Lead Vocal','expressive melismatic vocal','lead',{family:'vocal',primary:true}),
    o('rnb-lead-falsetto','Falsetto Layer','airy falsetto doubles','lead'),
    o('rnb-texture-vinyl','Vinyl Crackle','subtle vinyl & room noise','texture',{family:'noise'}),
    o('rnb-texture-reverse-swell','Reverse Swell Pad','soft reverse pad swells','texture'),
    o('rnb-arr-prehook-lift','Pre-Hook Lift','dynamic build into hook','arrangement'),
    o('rnb-arr-breakdown-breath','Breakdown Breath','sparse breakdown breathing space','arrangement'),
    o('rnb-perf-humanization','Humanized Timing','micro timing push/pull feel','performance'),
  ],
  subopts:{
    'rnb-bass-round-warm':[ {id:'bass-slide-up',label:'Slide Up',prompt:'soft expressive slide up'} ],
    'rnb-keys-rhodes':[ {id:'rhodes-phaser',label:'Phaser',prompt:'gentle phaser movement'} ]
  }
};
