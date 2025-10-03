import { GenrePack, Opt } from '../schema';
const g=(id:string,label:string,multi=true)=>({id,label,multi});
const o=(id:string,label:string,prompt:string,group:string,extra:Partial<Opt>={}) : Opt=>({id,label,prompt,group,...extra});

export const afrobeatPack: GenrePack = {
  id:'afrobeat',
  label:'Afrobeat',
  description:'Modern afrobeat / afropop rhythmic fusion',
  orderWeight:64,
  inheritsUniversal:true,
  groups:[g('drums','Drums'),g('percussion','Percussion'),g('bass','Bass'),g('guitar','Guitar'),g('keys','Keys'),g('vocal','Vocal'),g('texture','Texture'),g('arrangement','Arrangement'),g('performance','Performance')],
  options:[
    o('afro-drum-core-kit','Core Kit','grooving afrobeat drum kit','drums',{family:'kit',primary:true}),
    o('afro-perc-conga','Congas','syncopated conga patterns','percussion'),
    o('afro-perc-shaker','Shaker Loop','driving shaker subdivision','percussion'),
    o('afro-bass-melodic','Melodic Bass','melodic supportive bass line','bass',{family:'bass',primary:true}),
    o('afro-bass-syncop','Syncop Accents','syncopated accent notes','bass'),
    o('afro-gtr-clean-highlife','Clean Highlife Guitar','clean highlife style guitar','guitar',{family:'clean',primary:true}),
    o('afro-gtr-muted','Muted Guitar','muted rhythmic guitar','guitar'),
    o('afro-keys-ep','EP Chords','electric piano chord bed','keys',{family:'ep',primary:true}),
    o('afro-vocal-main','Main Vocal','afropop lead vocal','vocal',{family:'vocal',primary:true}),
    o('afro-vocal-response','Call Response','response vocal phrases','vocal'),
    o('afro-texture-ambience','Ambience FX','soft ambience texture','texture'),
    o('afro-texture-swell','Swell FX','filtered swell transition','texture'),
    o('afro-arr-break','Break Section','arranged breakdown section','arrangement'),
    o('afro-arr-layer-build','Layer Build','instrument layering build','arrangement'),
    o('afro-perf-groove-lock','Groove Lock','tight interlocking groove','performance')
  ],
  subopts:{
    'afro-gtr-clean-highlife':[ {id:'gtr-delay',label:'Delay Echo',prompt:'sync delay echo repeats'} ]
  }
};
