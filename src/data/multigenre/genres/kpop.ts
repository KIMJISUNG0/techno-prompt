import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true)=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const kpopPack: GenrePack = {
  id:'kpop',
  label:'K-Pop',
  description:'Modern K-Pop hybrid electronic & pop production',
  orderWeight:60,
  inheritsUniversal:true,
  groups:[
    g('drums','Drums'),
    g('bass','Bass'),
    g('synth','Synth / Lead'),
    g('keys','Keys / Chords'),
    g('vocal','Vocals'),
    g('texture','Texture / FX'),
    g('arrangement','Arrangement'),
    g('performance','Performance')
  ],
  options:[
    o('kpop-drum-tight-hybrid','Tight Hybrid Kit','tight hybrid edm pop drum kit','drums',{family:'kit',primary:true}),
    o('kpop-drum-fill-riser','Fill + Riser','pre-chorus fill and riser','drums'),
    o('kpop-bass-sidechain','Sidechain Bass','sidechained synth bass layer','bass',{family:'synth',primary:true}),
    o('kpop-bass-layer-sub','Layered Sub','layered sub reinforcement','bass'),
    o('kpop-synth-hook-pluck','Hook Pluck Lead','bright pluck hook lead','synth',{family:'pluck',primary:true}),
    o('kpop-synth-stack-saw','Stacked Saw Lead','layered saw hook stack','synth'),
    o('kpop-keys-piano-bright','Bright Pop Piano','bright pop piano chords','keys',{family:'piano'}),
    o('kpop-vocal-main-lead','Main Pop Vocal','energetic modern pop vocal','vocal',{family:'vocal',primary:true}),
    o('kpop-vocal-adlib-fx','Adlib FX','creative vocal adlibs','vocal'),
    o('kpop-texture-glitch','Glitch Sparks','glitch sparkle ear candy','texture'),
    o('kpop-texture-riser-noise','Noise Riser','filtered noise riser','texture'),
    o('kpop-arr-prechorus-shift','Pre-Chorus Shift','arrangement pre-chorus dynamic shift','arrangement'),
    o('kpop-arr-drop-impact','Drop Impact','impact accent at chorus drop','arrangement'),
    o('kpop-perf-tight-sync','Tight Sync Performance','precise quantized feel','performance')
  ],
  subopts:{
    'kpop-synth-hook-pluck':[ {id:'pluck-delay',label:'Delay Tail',prompt:'bright synced delay tail'} ]
  }
};
