import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true)=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const jazzFusionPack: GenrePack = {
  id:'jazzfusion',
  label:'Jazz Fusion',
  description:'Electric jazz fusion: virtuoso, syncopation, extended harmony',
  orderWeight:65,
  inheritsUniversal:true,
  groups:[g('drums','Drums'),g('bass','Bass'),g('guitar','Guitar'),g('keys','Keys'),g('synth','Synth / Lead'),g('texture','Texture'),g('arrangement','Arrangement'),g('performance','Performance')],
  options:[
    o('jf-drum-tight-fusion','Tight Fusion Kit','tight articulate fusion kit','drums',{family:'kit',primary:true}),
    o('jf-drum-cymbal-splash','Cymbal Splash Accents','expressive splash accents','drums'),
    o('jf-bass-fretless','Fretless Bass','expressive fretless bass','bass',{family:'fretless',primary:true}),
    o('jf-bass-chordal','Chordal Slides','chordal slide articulations','bass'),
    o('jf-gtr-jazz-chorus','Jazz Chorus Guitar','clean chorus jazz guitar','guitar',{family:'clean',primary:true}),
    o('jf-gtr-overdrive-lead','Overdrive Lead Guitar','smooth overdrive lead lines','guitar'),
    o('jf-keys-rhodes','Rhodes Comping','rhodes comping extended chords','keys',{family:'rhodes',primary:true}),
    o('jf-keys-synth-clav','Clav/Synth Layer','clav/synth hybrid layer','keys'),
    o('jf-synth-lead-fusion','Fusion Synth Lead','fast legato fusion synth lead','synth',{family:'lead',primary:true}),
    o('jf-synth-lead-bend','Pitch Bend Expression','expressive pitch bends','synth'),
    o('jf-texture-room-air','Room Air','room air ambience texture','texture'),
    o('jf-texture-delay-chops','Delay Chops','delay chopped textures','texture'),
    o('jf-arr-trading-solos','Trading Solos','solo trading arrangement','arrangement'),
    o('jf-arr-half-time-shift','Half-Time Shift','half-time section shift','arrangement'),
    o('jf-perf-virtuoso','Virtuoso Passages','virtuosic passages emphasis','performance')
  ],
  subopts:{
    'jf-bass-fretless':[ {id:'bass-harmonics',label:'Harmonics',prompt:'fretless harmonic accents'} ]
  }
};
