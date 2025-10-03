import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true)=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const futureGaragePack: GenrePack = {
  id:'futuregarage',
  label:'Future Garage',
  description:'Atmospheric UK future garage shuffling aesthetic',
  orderWeight:62,
  inheritsUniversal:true,
  groups:[g('drums','Drums'),g('bass','Bass'),g('synth','Synth / Lead'),g('pad','Pad / Atmos'),g('keys','Keys'),g('texture','Texture'),g('arrangement','Arrangement'),g('performance','Performance')],
  options:[
    o('fg-drum-shuffle-kit','Shuffled Kit','shuffling percussive kit','drums',{family:'kit',primary:true}),
    o('fg-drum-soft-snare','Soft Snare','soft airy snare','drums'),
    o('fg-bass-warp-sub','Warp Sub','warped modulated sub','bass',{family:'sub',primary:true}),
    o('fg-bass-resonant-move','Resonant Movement','resonant filter movement','bass'),
    o('fg-synth-glass-pluck','Glass Pluck Lead','glassy pluck motif','synth',{family:'pluck',primary:true}),
    o('fg-synth-frag-vocal','Fragmented Vocal','chopped vocal texture lead','synth'),
    o('fg-pad-airy-wide','Airy Wide Pad','wide airy evolving pad','pad',{family:'airy',primary:true}),
    o('fg-pad-granular','Granular Bloom','granular blooming pad','pad'),
    o('fg-keys-detuned-ep','Detuned EP','slightly detuned ep keys','keys'),
    o('fg-texture-rain','Rain Foley','rain foley texture','texture'),
    o('fg-texture-vinyl-hiss','Vinyl Hiss','light vinyl hiss layer','texture'),
    o('fg-arr-negative-space','Negative Space','arranged negative space drops','arrangement'),
    o('fg-arr-filter-intro','Filter Intro','filtered intro build reveal','arrangement'),
    o('fg-perf-swing-late','Late Swing Feel','late shuffled swing feel','performance')
  ],
  subopts:{
    'fg-synth-frag-vocal':[ {id:'vocal-reverb-freeze',label:'Reverb Freeze',prompt:'frozen reverb tail texture'} ]
  }
};
