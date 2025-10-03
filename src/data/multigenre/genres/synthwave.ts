import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true)=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const synthwavePack: GenrePack = {
  id:'synthwave',
  label:'Synthwave',
  description:'Retro analog neon 80s synth aesthetic',
  orderWeight:61,
  inheritsUniversal:true,
  groups:[g('drums','Drums'),g('bass','Bass'),g('synth','Synth / Lead'),g('pad','Pads'),g('guitar','Guitar'),g('texture','Texture'),g('arrangement','Arrangement'),g('performance','Performance')],
  options:[
    o('sw-drum-analog-808','Analog 808 Kit','punchy analog 808 style kit','drums',{family:'kit',primary:true}),
    o('sw-drum-gated-snares','Gated Snares','gated reverb snare hits','drums'),
    o('sw-bass-seq-saw','Sequenced Saw Bass','driving sequenced saw bass','bass',{family:'analog',primary:true}),
    o('sw-bass-fm-sub','FM Sub Layer','fm style sub reinforcement','bass'),
    o('sw-synth-lead-lazer','Lazer Lead','bright biting lazer lead','synth',{family:'lead',primary:true}),
    o('sw-synth-arpeggio','Arp Pattern','arpeggiated synth pattern','synth'),
    o('sw-pad-warm-analog','Warm Analog Pad','warm vintage analog pad','pad',{family:'analog',primary:true}),
    o('sw-pad-chorus-wide','Chorus Wide Pad','wide chorus stereo pad','pad'),
    o('sw-gtr-clean-chorus','Clean Chorus Guitar','clean chorus guitar layer','guitar'),
    o('sw-texture-noise-swoosh','Noise Swoosh','noise sweep transition','texture'),
    o('sw-texture-vhs','VHS Hiss','subtle vhs noise texture','texture'),
    o('sw-arr-rise-lift','Rise Lift','arranged rising lift into chorus','arrangement'),
    o('sw-arr-outro-fade','Outro Fade','slow analog fade out','arrangement'),
    o('sw-perf-straight-pocket','Straight Pocket','straight pocket feel','performance')
  ],
  subopts:{
    'sw-synth-lead-lazer':[ {id:'lead-portamento',label:'Portamento',prompt:'expressive portamento glide'} ]
  }
};
