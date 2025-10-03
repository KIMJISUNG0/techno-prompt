import { GenrePack, Opt } from '../schema';

const g = (id:string,label:string,multi=true): any => ({ id,label,multi });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const funkPack: GenrePack = {
  id: 'funk',
  label: 'Funk',
  description: 'Groove-driven funk essentials',
  orderWeight: 18,
  inheritsUniversal: true,
  groups: [
    g('rhythm','Rhythm Section'),
    g('guitars','Guitars'),
    g('keys','Keys / Synths'),
    g('horns','Horns / Brass'),
    g('arrangement','Arrangement'),
    g('meters','Meters / Targets'),
  ],
  options: [
    o('funk-drum-tight-kit','Tight Funk Kit','tight dry funk drum kit','rhythm',{family:'kit',primary:true}),
    o('funk-bass-slap','Slap Bass','percussive slap electric bass','rhythm',{family:'bass',primary:true}),
    o('funk-bass-finger','Finger Bass','warm fingerstyle bass','rhythm',{family:'bass'}),
    o('funk-gtr-chank','Chank Guitar','16th muted chank guitar','guitars',{family:'rhythm',primary:true}),
    o('funk-gtr-wah','Wah Guitar','wah filtered lead guitar licks','guitars',{family:'lead'}),
    o('funk-clav','Clav','percussive clavinet comping','keys',{family:'clav',primary:true}),
    o('funk-ep','EP Rhodes','warm rhodes electric piano','keys',{family:'ep'}),
    o('funk-synth-mono','Mono Synth Lead','analog mono synth riff','keys',{family:'synth'}),
    o('funk-horns-section','Horn Stabs','tight brass section stabs','horns',{family:'stabs',primary:true}),
    o('funk-horns-sax','Sax Riff','soulful sax riff','horns',{family:'sax'}),
    o('funk-arr-breakdown','Breakdown','stripped breakdown section','arrangement'),
    o('funk-arr-rise','Rising Bridge','rising bridge energy lift','arrangement'),
    o('funk-meter-lufs','LUFS -9','target -9 LUFS integrated','meters'),
  ],
  subopts: {
    'funk-drum-tight-kit':[ {id:'funk-kick-dry',label:'Dry Kick',prompt:'dry punchy kick'}, {id:'funk-snare-crisp',label:'Crisp Snare',prompt:'crisp snare light plate'} ],
    'funk-bass-slap':[ {id:'slap-octave',label:'Octave Slaps',prompt:'syncopated octave slap fills'} ],
    'funk-gtr-chank':[ {id:'gtr-16th-palm',label:'16th Palm',prompt:'tight 16th palm mute pattern'} ],
  }
};

export const funkDiscoPack: GenrePack = {
  id: 'funkdisco',
  label: 'Funk Disco',
  description: 'Funk + disco hybrid groove',
  orderWeight: 19,
  inheritsUniversal: true,
  groups: [ g('rhythm','Rhythm'), g('guitars','Guitars'), g('keys','Keys / Synths'), g('strings','Strings'), g('arrangement','Arrangement') ],
  options: [
    o('fd-drum-disco','Disco Kit','four-on-floor disco kit','rhythm',{family:'kit',primary:true}),
    o('fd-bass-octave','Octave Bass','bouncy octave bass line','rhythm',{family:'bass',primary:true}),
    o('fd-gtr-nile','Chic Style Guitar','clean syncopated strat comps','guitars',{family:'rhythm',primary:true}),
    o('fd-strings-swell','Disco Strings','silky disco string swells','strings',{family:'strings',primary:true}),
    o('fd-synth-polys','Poly Pads','lush disco polysynth pad','keys',{family:'pad'}),
    o('fd-clav-funk','Clav Funk','bright clav accent hits','keys',{family:'clav'}),
    o('fd-arr-filter','Filter Build','filter sweep build section','arrangement'),
  ],
  subopts: {}
};

export const funkFusionPack: GenrePack = {
  id: 'funkfusion',
  label: 'Funk Fusion',
  description: 'Jazz harmony + funk rhythm',
  orderWeight: 20,
  inheritsUniversal: true,
  groups: [ g('rhythm','Rhythm'), g('guitars','Guitars'), g('keys','Keys / Synths'), g('horns','Horns'), g('arrangement','Arrangement') ],
  options: [
    o('ff-drum-ghost','Ghost Drum Kit','ghost note rich kit','rhythm',{family:'kit',primary:true}),
    o('ff-bass-fretless','Fretless Bass','singing fretless bass','rhythm',{family:'bass'}),
    o('ff-bass-sync','Sync Bass','syncopated bass line','rhythm',{family:'bass',primary:true}),
    o('ff-gtr-jazzclean','Jazz Clean Guitar','clean semi-hollow comps','guitars',{family:'rhythm'}),
    o('ff-keys-ep','EP Chords','lush extended EP chords','keys',{family:'ep',primary:true}),
    o('ff-keys-synthlead','Synth Lead','fusion synth lead','keys',{family:'lead'}),
    o('ff-horns-saxsolo','Sax Solo','expressive sax solo','horns',{family:'sax',primary:true}),
    o('ff-arr-solo-trade','Solo Trade','solo trade section','arrangement'),
  ],
  subopts: {}
};

export const funkRockPack: GenrePack = {
  id: 'funkrock',
  label: 'Funk Rock',
  description: 'Aggressive funk + rock blend',
  orderWeight: 21,
  inheritsUniversal: true,
  groups: [ g('rhythm','Rhythm'), g('guitars','Guitars'), g('bass','Bass'), g('arrangement','Arrangement'), g('fx','FX') ],
  options: [
    o('fr-drum-punch','Punch Kit','punchy rock-funk hybrid kit','rhythm',{family:'kit',primary:true}),
    o('fr-bass-pick','Pick Bass','picked growl bass','bass',{family:'bass',primary:true}),
    o('fr-gtr-riff','Riff Guitar','syncopated riff guitar','guitars',{family:'riff',primary:true}),
    o('fr-gtr-funkclean','Funk Clean Guitar','clean percussive funk chord guitar','guitars',{family:'rhythm'}),
    o('fr-fx-scratch','Scratch FX','turntable style scratch fx','fx',{family:'fx'}),
    o('fr-arr-break','Riff Break','guitar riff break section','arrangement'),
  ],
  subopts: {}
};
