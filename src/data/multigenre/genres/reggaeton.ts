import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true)=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const reggaetonPack: GenrePack = {
  id:'reggaeton',
  label:'Reggaeton',
  description:'Modern reggaeton / latin urban groove',
  orderWeight:63,
  inheritsUniversal:true,
  groups:[g('drums','Drums'),g('bass','Bass'),g('synth','Synth / Lead'),g('keys','Keys'),g('vocal','Vocal'),g('texture','Texture'),g('arrangement','Arrangement'),g('performance','Performance')],
  options:[
    o('reg-drum-dembow-core','Dembow Core','classic dembow rhythmic core','drums',{family:'kit',primary:true}),
    o('reg-drum-fill-perc','Perc Fill Accents','percussive fill accents','drums'),
    o('reg-bass-round-sub','Round Sub Bass','round sub supportive bass','bass',{family:'sub',primary:true}),
    o('reg-bass-slide','Slide Accents','slide note accents','bass'),
    o('reg-synth-hook-pluck','Hook Pluck','syncopated latin pluck hook','synth',{family:'pluck',primary:true}),
    o('reg-synth-brass-stab','Brass Stabs','latin brass style synth stabs','synth'),
    o('reg-keys-piano-montuno','Piano Montuno','montuno style piano figure','keys',{family:'piano',primary:true}),
    o('reg-vocal-main','Main Vocal','energetic urban vocal','vocal',{family:'vocal',primary:true}),
    o('reg-vocal-adlib','Adlibs','latin adlib responses','vocal'),
    o('reg-texture-perc-loop','Perc Loop Texture','light extra perc loop','texture'),
    o('reg-texture-sweep','Sweep Transition','sweep fx transition','texture'),
    o('reg-arr-break-drop','Break to Drop','breakdown into drop','arrangement'),
    o('reg-arr-hook-repeat','Hook Repeat','hook repetition emphasis','arrangement'),
    o('reg-perf-groove-push','Groove Push','slight groove push feel','performance')
  ],
  subopts: {
    'reg-synth-hook-pluck':[ {id:'pluck-trem',label:'Tremolo',prompt:'tremolo modulation movement'} ]
  }
};
