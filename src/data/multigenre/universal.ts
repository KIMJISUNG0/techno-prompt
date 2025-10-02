import { UniversalPack, Opt } from './schema';

const g = (id:string,label:string,multi=true): any => ({ id,label,multi,universal:true });
const o = (id:string,label:string,prompt:string,group:string, extra:Partial<Opt>={}) : Opt => ({ id,label,prompt,group,...extra });

export const universalPack: UniversalPack = {
  groups: [
    g('rhythm','Rhythm / Drums'),
    g('groove','Groove / Timing'),
    g('bass','Bass'),
    g('synths','Synths / Melodic'),
    // New harmonic & texture groups
    g('pads','Pads / Ambient'),
    g('progression','Chord Progression', false),
    g('fx','FX & Texture'),
    g('processing','Processing'),
    g('mix','Mix'),
    // 새로 추가: 마스터링 공통 그룹 (모든 장르 공용 기본 마스터 처리)
    g('mastering','Mastering'),
    g('params','Detail Params'),
  ],
  options: [
    // --- Core Rhythm ---
    o('univ-kick-punch','Punch Kick','punchy focused kick','rhythm',{family:'kick',primary:true,tags:['core','transient']}),
    o('univ-snare-classic','Classic Snare','classic snare layer','rhythm',{family:'snare',primary:true,tags:['core']}),
    o('univ-hat-offbeat','Offbeat Hat','offbeat closed hat','rhythm',{family:'hat',primary:true,tags:['groove']}),
    o('univ-perc-core','Perc Core','percussion core layer','rhythm',{family:'perc',primary:true,tags:['texture']}),
    // --- Expanded Kicks ---
    o('univ-kick-deep','Deep Kick','deep sub heavy kick','rhythm',{family:'kick',tags:['low-end']}),
    o('univ-kick-dist','Distorted Kick','saturated distorted kick','rhythm',{family:'kick',tags:['drive','edge']}),
    o('univ-kick-click','Click Kick','clicky attack emphasis kick','rhythm',{family:'kick',tags:['transient']}),
    o('univ-kick-long','Long Tail Kick','long tail atmospheric kick','rhythm',{family:'kick',tags:['tail']}),
    // --- Snares / Claps ---
    o('univ-snare-snap','Snappy Snare','tight snap snare','rhythm',{family:'snare',tags:['attack']}),
    o('univ-snare-rim','Rim Snare','rimshot style snare','rhythm',{family:'snare',tags:['rim']}),
    o('univ-clap-wide','Wide Clap','wide stereo clap layer','rhythm',{family:'clap',primary:true,tags:['stereo']}),
    o('univ-clap-909','909 Clap','classic 909 clap','rhythm',{family:'clap',tags:['retro']}),
    // --- Hats ---
    o('univ-hat-16th','16th Hats','steady 16th hats','rhythm',{family:'hat',tags:['pattern']}),
    o('univ-hat-open','Open Hat','open bright hat','rhythm',{family:'hat',tags:['open']}),
    o('univ-hat-metallic','Metallic Hat','metallic shimmer hat','rhythm',{family:'hat',tags:['metallic']}),
    o('univ-hat-noise','Noisy Hat','noisy processed hat','rhythm',{family:'hat',tags:['noise']}),
    // --- Shakers / Perc ---
    o('univ-shaker-tight','Tight Shaker','tight shaker pattern','rhythm',{family:'shaker',tags:['groove']}),
    o('univ-shaker-loop','Shaker Loop','looped shaker layer','rhythm',{family:'shaker',tags:['loop']}),
    o('univ-perc-rim','Rim Perc','rim / click perc hits','rhythm',{family:'perc',tags:['attack']}),
    o('univ-perc-metal','Metal Perc','metallic percussive hits','rhythm',{family:'perc',tags:['metallic']}),
    o('univ-perc-laser','Laser Perc','synthetic laser perc','rhythm',{family:'perc',tags:['fx']}),
    // --- Toms / Fills / Cymbals ---
    o('univ-tom-low','Low Tom','low tom support','rhythm',{family:'tom',tags:['low']}),
    o('univ-tom-fill','Tom Fill','rolling tom fill','rhythm',{family:'tom',tags:['fill']}),
    o('univ-ride-wash','Wash Ride','washy ride cymbal','rhythm',{family:'ride',tags:['sustain']}),
    o('univ-crash-bright','Bright Crash','bright crash accent','rhythm',{family:'crash',tags:['accent']}),
    o('univ-crash-rev','Reverse Crash','reverse crash swell','rhythm',{family:'crash',tags:['transition']}),
    // --- Texture / Ghost / Groove ---
    o('univ-ghost-notes','Ghost Notes','soft ghost snare accents','rhythm',{family:'ghost',tags:['groove']}),
    o('univ-texture-tick','Tick Texture','high tick layer','rhythm',{family:'texture',tags:['high']}),
    o('univ-texture-grit','Grit Texture','gritty percussive dirt','rhythm',{family:'texture',tags:['dirt']}),

    // --- Bass & Melodic ---
    o('univ-bass-sub','Deep Sub','deep sub-bass','bass',{family:'sub',primary:true,tags:['low-end']}),
    o('univ-bass-reese','Reese Bass','detuned reese bass','bass',{family:'reese',tags:['movement','detune']}),
    o('univ-lead-supersaw','Supersaw Lead','wide stacked supersaw lead','synths',{family:'lead',primary:true,tags:['anthemic']}),
    o('univ-pad-shimmer','Shimmer Pad','shimmer airy pad','synths',{family:'pad',tags:['space','air']}),
  // --- Pads (new group) ---
  o('univ-pad-warmAnalog','Warm Analog Pad','warm analog pad layer','pads',{family:'pad',primary:true,tags:['pad','warm']}),
  o('univ-pad-evolving','Evolving Pad','slow evolving pad movement','pads',{family:'pad',tags:['evolving','movement']}),
  o('univ-pad-darkDrone','Dark Drone Pad','dark low drone pad','pads',{family:'pad',tags:['dark','drone']}),
  o('univ-pad-airy','Airy Glass Pad','airy glassy pad texture','pads',{family:'pad',tags:['air','shimmer']}),
  o('univ-pad-analogStrings','Analog String Pad','analog string ensemble pad','pads',{family:'pad',tags:['ensemble']}),

    // --- FX (Reverb Families) ---
    o('univ-fx-rev-plate','Plate Reverb','dense bright plate reverb','fx',{family:'reverb',primary:true,tags:['space','fx']}),
    o('univ-fx-rev-hall','Hall Reverb','lush hall tail','fx',{family:'reverb',tags:['space']}),
    o('univ-fx-rev-room','Room Reverb','short room ambience','fx',{family:'reverb',tags:['ambience']}),
    o('univ-fx-rev-spring','Spring Reverb','spring boing texture','fx',{family:'reverb',tags:['vintage']}),
    o('univ-fx-rev-gated','Gated Reverb','tight gated reverb effect','fx',{family:'reverb',tags:['80s','fx']}),
    o('univ-fx-rev-shimmer','Shimmer Reverb','pitch-shift shimmer reverb','fx',{family:'reverb',tags:['ethereal','sparkle']}),

    // --- FX (Delay) ---
    o('univ-fx-del-pingpong','Ping-Pong Delay','stereo ping-pong delay','fx',{family:'delay',primary:true,tags:['space','movement']}),
    o('univ-fx-del-tape','Tape Delay','warm tape echo feedback','fx',{family:'delay',tags:['vintage','saturation']}),
    o('univ-fx-del-multitap','Multi-Tap Delay','multi-tap rhythmic delay','fx',{family:'delay',tags:['rhythmic']}),

    // --- FX (Modulation) ---
    o('univ-fx-mod-chorus','Chorus','wide chorus modulation','fx',{family:'mod',primary:true,tags:['stereo','movement']}),
    o('univ-fx-mod-flanger','Flanger','jet flanger sweep','fx',{family:'mod',tags:['movement']}),
    o('univ-fx-mod-phaser','Phaser','phase sweeping depth','fx',{family:'mod',tags:['swirl']}),
    o('univ-fx-mod-autoPan','Auto Pan','auto panoramic movement','fx',{family:'spatial',tags:['stereo','movement']}),

    // --- FX (Texture / Noise / Granular) ---
    o('univ-fx-tex-vinyl','Vinyl Noise','vinyl crackle layer','fx',{family:'texture',tags:['noise','lofi']}),
    o('univ-fx-tex-tapeHiss','Tape Hiss','soft tape hiss bed','fx',{family:'texture',tags:['noise','vintage']}),
    o('univ-fx-tex-noiseBed','Noise Bed','broadband noise atmosphere','fx',{family:'texture',tags:['atmosphere']}),
    o('univ-fx-tex-granularWash','Granular Wash','granular smeared texture','fx',{family:'granular',tags:['evolving']}),

    // --- FX (Distortion / Saturation / Color) ---
    o('univ-fx-dist-tapeSat','Tape Saturation FX','tape style coloration','fx',{family:'dist',tags:['warm','glue']}),
    o('univ-fx-dist-tubeDrive','Tube Drive','tube harmonic drive','fx',{family:'dist',tags:['harmonics']}),
    o('univ-fx-dist-bitcrush','Bitcrush','digital bit reduction','fx',{family:'dist',tags:['lofi','digital']}),
    o('univ-fx-dist-wavefold','Wavefold','folded harmonic distortion','fx',{family:'dist',tags:['complex']}),

    // --- FX (Filter / Spectral) ---
    o('univ-fx-fil-formant','Formant Filter','vowel formant sweep','fx',{family:'filter',tags:['vocalic']}),
    o('univ-fx-fil-morph','Morph Filter','morphing multimode filter','fx',{family:'filter',tags:['movement']}),
    o('univ-fx-fil-resSweep','Resonant Sweep','resonant filter sweep','fx',{family:'filter',tags:['transition']}),

    // --- FX (Transition) ---
    o('univ-fx-riser','Riser FX','riser transitional fx','fx',{family:'transition',primary:true,tags:['build']}),
    o('univ-fx-impact','Impact FX','impact hit','fx',{family:'transition',tags:['hit']}),
    o('univ-fx-downer','Downer FX','descending downer effect','fx',{family:'transition',tags:['fall']}),
    o('univ-fx-revCrash','Reverse Crash','reversed cymbal swell','fx',{family:'transition',tags:['swell']}),
    o('univ-fx-sweepNoise','Noise Sweep','broadband noise sweep','fx',{family:'transition',tags:['sweep']}),

    // --- Processing (Dynamics / Utility) ---
    o('univ-proc-sidechain','Sidechain Comp','sidechain pumping','processing',{family:'dynamics',primary:true,tags:['groove']}),
    o('univ-proc-glueComp','Glue Compressor','bus glue compression','processing',{family:'dynamics',tags:['bus','glue']}),
    o('univ-proc-mbandComp','Multiband Comp','multiband dynamic control','processing',{family:'dynamics',tags:['tone']}),
    o('univ-proc-transientShape','Transient Shaper','attack sustain sculpting','processing',{family:'dynamics',tags:['transient']}),
    o('univ-proc-midSide','Mid/Side Balance','mid side tonal balance','processing',{family:'stereo',tags:['stereo','mix']}),
    o('univ-proc-imagerMicro','Micro Shifter','micro pitch stereo spread','processing',{family:'stereo',tags:['width']}),
    o('univ-proc-eqSurgical','Surgical EQ','narrow band corrective eq','processing',{family:'eq',tags:['corrective']}),
    o('univ-proc-harmExciter','Harmonic Exciter','high band harmonic excite','processing',{family:'tone',tags:['sparkle']}),

    // --- Mix / Master Assist ---
    o('univ-mix-wide','Stereo Width','wide stereo image','mix',{family:'stereo',primary:true,tags:['imaging']}),
    o('univ-mix-loudRef','Loudness Ref','match perceived loudness','mix',{family:'reference',tags:['workflow']}),
    o('univ-mix-headroom','Headroom Prep','-6dB headroom prep','mix',{family:'gain',tags:['mastering']}),
  // --- Mix (추가 다양화) ---
  o('univ-mix-transientFocus','Transient Focus','focused transient definition','mix',{family:'detail',tags:['transient']}),
  o('univ-mix-midForward','Mid Forward','midrange forward presence','mix',{family:'tone',tags:['mid']}),
  o('univ-mix-airControl','Air Control','controlled high-air sheen','mix',{family:'air',tags:['high']}),
  o('univ-mix-depthSpace','Depth Space','depth layering & contrast','mix',{family:'depth',tags:['stage']}),
  o('univ-mix-glueParallel','Parallel Glue','parallel bus glue blend','mix',{family:'parallel',tags:['glue']}),
  o('univ-mix-subFocus','Sub Focus','focused sub energy','mix',{family:'low',tags:['sub','low']}),

  // --- Progression (harmonic direction) ---
  o('univ-prog-minorLoop','Minor Loop i-vi-vii','minor loop progression','progression',{family:'progression',primary:true,tags:['harmony','minor']}),
  o('univ-prog-modalShift','Modal i-bVII-VI','modal interchange drive','progression',{family:'progression',tags:['modal','borrowed']}),
  o('univ-prog-suspense','Suspended Tension','sustained sus2/sus4 tension','progression',{family:'progression',tags:['tension']}),
  o('univ-prog-pivotMod','Pivot Modulation','pivot chord modulation hint','progression',{family:'progression',tags:['modulation']}),
  o('univ-prog-borrowed','Borrowed bVI Color','borrowed bVI color chord','progression',{family:'progression',tags:['borrowed','color']}),

  // --- Mastering (공용) ---
  o('univ-master-limiter','Master Limiter','transparent peak limiting','mastering',{family:'limiter',primary:true,tags:['ceiling']}),
  o('univ-master-headroom','Master Headroom','final headroom staging','mastering',{family:'gain',tags:['headroom']}),
  o('univ-master-dynamicEq','Master Dynamic EQ','dynamic tonal balancing','mastering',{family:'eq',tags:['dynamic','bal'] }),
  o('univ-master-stereoStage','Stereo Stage','stereo stage refinement','mastering',{family:'stereo',tags:['width']}),
  o('univ-master-transientTame','Transient Tame','micro transient taming','mastering',{family:'transient',tags:['control']}),
  o('univ-master-exciter','Master Exciter','broadband harmonic excite','mastering',{family:'exciter',tags:['air']}),
  o('univ-master-glue','Master Glue','broadband gentle glue','mastering',{family:'glue',tags:['cohesion']}),
  o('univ-master-clipStage','Clip Stage','controlled soft clip stage','mastering',{family:'clip',tags:['drive']}),
  o('univ-master-psrCheck','PSR Check','peak to short-term ratio check','mastering',{family:'meter',tags:['psr']}),
  o('univ-master-lufsTarget','LUFS Target','final loudness calibration','mastering',{family:'meter',tags:['lufs']}),

    // --- Detail Params (macro style) ---
    o('univ-param-preDelay40','Pre-delay 40ms','reverb pre-delay 40ms','params',{tags:['reverb']}),
    o('univ-param-preDelay80','Pre-delay 80ms','reverb pre-delay 80ms','params',{tags:['reverb']}),
    o('univ-param-decay-long','Long Decay','reverb decay 6s+','params',{tags:['reverb','lush']}),
    o('univ-param-decay-short','Short Decay','tight reverb decay','params',{tags:['reverb','tight']}),
    o('univ-param-delay-syncDotted','Delay Dotted','delay dotted timing','params',{tags:['delay','rhythmic']}),
    o('univ-param-delay-syncTriplet','Delay Triplet','delay triplet timing','params',{tags:['delay','rhythmic']}),
    o('univ-param-filter-sweepWide','Filter Sweep Wide','wide cutoff modulation','params',{tags:['filter','movement']}),
    o('univ-param-filter-hpTight','High-Pass Tight','tight high-pass carve','params',{tags:['filter','mix']}),
    o('univ-param-stereo-narrowIntro','Narrow Intro','narrow stereo intro stage','params',{tags:['arrangement','stereo']}),
    o('univ-param-stereo-expandDrop','Stereo Expand Drop','expand stereo on drop','params',{tags:['arrangement','impact']}),
  ],
  subopts: {
    // Bass / Lead detail
    'univ-bass-reese':[ {id:'reese-detune-lite',label:'Lite Detune',prompt:'light detune layer'}, {id:'reese-detune-wide',label:'Wide Detune',prompt:'wide detune spread'} ],
  'univ-lead-supersaw':[ {id:'supersaw-7voices',label:'7 Voices',prompt:'7 voice supersaw'}, {id:'supersaw-detuneWide',label:'Wide Detune',prompt:'wide detune'}, {id:'supersaw-stackOct',label:'Oct Stack',prompt:'stacked octave voices'} ],
  // Drum suboptions
  'univ-kick-punch':[ {id:'kick-punch-snap',label:'Extra Snap',prompt:'extra snap transient'}, {id:'kick-punch-tight',label:'Tight Decay',prompt:'tight kick decay'} ],
  'univ-kick-deep':[ {id:'kick-deep-subBoost',label:'Sub Boost',prompt:'sub boosted kick'}, {id:'kick-deep-softTransient',label:'Soft Transient',prompt:'softened attack'} ],
  'univ-kick-dist':[ {id:'kick-dist-saturated',label:'Saturated',prompt:'saturated kick drive'}, {id:'kick-dist-harmRich',label:'Harm Rich',prompt:'harmonic rich distortion'} ],
  'univ-kick-long':[ {id:'kick-long-reverbTail',label:'Verb Tail',prompt:'ambient tail kick'} ],
  'univ-snare-classic':[ {id:'snare-classic-bright',label:'Bright',prompt:'bright snare tone'} ],
  'univ-snare-snap':[ {id:'snare-snap-tight',label:'Tight',prompt:'tight snappy snare'}, {id:'snare-snap-layer',label:'Layered',prompt:'layered snare texture'} ],
  'univ-clap-wide':[ {id:'clap-wide-stereoMax',label:'Stereo Max',prompt:'extra wide clap'} ],
  'univ-clap-909':[ {id:'clap-909-stacked',label:'Stacked',prompt:'stacked 909 clap'} ],
  'univ-hat-16th':[ {id:'hat-16th-swingLite',label:'Swing Lite',prompt:'light swing hats'}, {id:'hat-16th-tight',label:'Tight',prompt:'tight closed hats'} ],
  'univ-hat-open':[ {id:'hat-open-long',label:'Long Tail',prompt:'long open hat tail'} ],
  'univ-hat-metallic':[ {id:'hat-metallic-res',label:'Res Peak',prompt:'resonant metallic hat'} ],
  'univ-hat-noise':[ {id:'hat-noise-bandpass',label:'Bandpass',prompt:'bandpassed noise hat'} ],
  'univ-shaker-loop':[ {id:'shaker-loop-syncopated',label:'Syncopated',prompt:'syncopated shaker loop'} ],
  'univ-perc-metal':[ {id:'perc-metal-ring',label:'Ring',prompt:'ringing metal perc'} ],
  'univ-perc-laser':[ {id:'perc-laser-pitchMod',label:'Pitch Mod',prompt:'pitch mod laser perc'} ],
  'univ-tom-fill':[ {id:'tom-fill-rising',label:'Rising',prompt:'rising tom fill'} ],
  'univ-ride-wash':[ {id:'ride-wash-side',label:'Side Wash',prompt:'wide ride wash'} ],
  'univ-crash-rev':[ {id:'crash-rev-long',label:'Long Rev',prompt:'long reverse crash'} ],
  'univ-ghost-notes':[ {id:'ghost-soft-brush',label:'Brush',prompt:'brush ghost notes'} ],
  'univ-texture-grit':[ {id:'texture-grit-bit',label:'Bit Grit',prompt:'bit crushed grit'} ],

    // Reverb parameter micro choices
    'univ-fx-rev-plate':[ {id:'rev-plate-bright',label:'Bright Plate',prompt:'bright plate tone'}, {id:'rev-plate-dark',label:'Dark Plate',prompt:'dark plate tail'} ],
    'univ-fx-rev-hall':[ {id:'rev-hall-wide',label:'Wide Hall',prompt:'wide hall field'}, {id:'rev-hall-mod',label:'Modulated Hall',prompt:'modulated hall motion'} ],
    'univ-fx-rev-shimmer':[ {id:'rev-shimmer-5th',label:'+5th Shift',prompt:'shimmer +5th shift'}, {id:'rev-shimmer-oct',label:'+Oct Shift',prompt:'shimmer +oct shift'} ],

    // Delay variants
    'univ-fx-del-pingpong':[ {id:'del-pp-highCut',label:'High-Cut',prompt:'pingpong delay high-cut'}, {id:'del-pp-sat',label:'Saturated',prompt:'pingpong delay saturation'} ],
    'univ-fx-del-tape':[ {id:'del-tape-warble',label:'Warble',prompt:'tape delay warble'}, {id:'del-tape-worn',label:'Worn Tape',prompt:'worn tape echo tone'} ],

    // Distortion specifics
    'univ-fx-dist-bitcrush':[ {id:'bitcrush-12bit',label:'12-bit',prompt:'12-bit reduction'}, {id:'bitcrush-8bit',label:'8-bit',prompt:'8-bit reduction'} ],
    'univ-fx-dist-wavefold':[ {id:'wavefold-soft',label:'Soft Fold',prompt:'soft wavefold'}, {id:'wavefold-aggressive',label:'Aggressive Fold',prompt:'aggressive wavefold'} ],

    // Filter sweeps micro
    'univ-fx-fil-resSweep':[ {id:'fil-resRise',label:'Rising',prompt:'rising resonance sweep'}, {id:'fil-resFall',label:'Falling',prompt:'falling resonance sweep'} ],

    // Transition FX fine
    'univ-fx-riser':[ {id:'riser-8bar',label:'8 Bar',prompt:'8 bar riser'}, {id:'riser-pitchUp',label:'Pitch Up',prompt:'riser pitch up'} ],
  'univ-fx-impact':[ {id:'impact-sub',label:'Sub Boom',prompt:'impact sub boom'}, {id:'impact-reverseTail',label:'Reverse Tail',prompt:'impact reverse tail'} ],
    'univ-fx-downer':[ {id:'downer-pitchDrop',label:'Pitch Drop',prompt:'downer pitch drop'} ],
    'univ-fx-sweepNoise':[ {id:'sweep-wide',label:'Wide Sweep',prompt:'wide noise sweep'} ],

    // Processing micro
    'univ-proc-sidechain':[ {id:'sc-soft',label:'Soft Pump',prompt:'soft sidechain pump'}, {id:'sc-hard',label:'Hard Pump',prompt:'hard sidechain pump'} ],
    'univ-proc-glueComp':[ {id:'glue-soft',label:'Soft Glue',prompt:'gentle glue compression'}, {id:'glue-punch',label:'Punch Glue',prompt:'punch glue compression'} ],
    'univ-proc-mbandComp':[ {id:'mband-tightLow',label:'Tight Low',prompt:'tight low band control'} ],
    'univ-proc-transientShape':[ {id:'transient-attackBoost',label:'Attack Boost',prompt:'attack emphasis'}, {id:'transient-sustainTrim',label:'Sustain Trim',prompt:'shorter sustain'} ],
    'univ-proc-midSide':[ {id:'ms-midFocus',label:'Mid Focus',prompt:'mid focus balance'}, {id:'ms-wideSides',label:'Wide Sides',prompt:'enhanced side image'} ],

    // Mix micro
    'univ-mix-wide':[ {id:'mix-wide-subtle',label:'Subtle Width',prompt:'subtle stereo width'}, {id:'mix-wide-max',label:'Max Width',prompt:'max stereo width'} ],
  }
};
