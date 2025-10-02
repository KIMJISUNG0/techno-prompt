// Taxonomy data & types extracted for scalability
export type GroupId =
  | "subgenre"
  | "rhythm"
  | "bass"
  | "synths"
  | "atmosphere"
  | "fx"
  | "arrangement"
  | "mix"
  | "soundDesign"
  | "processing"
  | "groove"
  | "performance"
  | "meters"
  | "mastering"
  | "params";

export interface GroupMeta { id: GroupId; label: string; multi: boolean }
export interface Opt { id: string; label: string; prompt: string; group: GroupId; family?: string; primary?: boolean; tags?: string[] }
export interface SubOpt { id: string; label: string; prompt: string }

export const GROUPS: GroupMeta[] = [
  { id: "subgenre", label: "Subgenre", multi: true },
  { id: "rhythm", label: "Rhythm / Drums", multi: true },
  { id: "groove", label: "Groove / Timing", multi: true },
  { id: "bass", label: "Bass", multi: true },
  { id: "synths", label: "Leads / Chords / Arp", multi: true },
  { id: "soundDesign", label: "Sound Design", multi: true },
  { id: "atmosphere", label: "Atmosphere", multi: true },
  { id: "fx", label: "FX & Texture", multi: true },
  { id: "arrangement", label: "Arrangement", multi: true },
  { id: "performance", label: "Performance / Live", multi: true },
  { id: "mix", label: "Mix", multi: true },
  { id: "processing", label: "Processing", multi: true },
  { id: "meters", label: "Meters / Targets", multi: true },
  { id: "mastering", label: "Mastering", multi: true },
  { id: "params", label: "Detail Params", multi: true },
];

const o = (id: string, label: string, prompt: string, group: GroupId, extra: Partial<Opt> = {}): Opt => ({ id, label, prompt, group, ...extra });

export const OPTIONS: Opt[] = [
  o("acid", "Acid", "acid techno (TB-303 character)", "subgenre", { tags:["subgenre","303","acid"] }),
  o("industrial", "Industrial", "industrial techno grit", "subgenre"),
  o("minimal", "Minimal", "minimal stripped arrangement", "subgenre"),
  o("dub", "Dub", "dub techno chords + space", "subgenre"),
  o("melodic", "Melodic", "melodic techno motifs", "subgenre"),
  o("peakTime", "Peak Time", "peak-time driving energy", "subgenre"),
  o("raw", "Raw", "raw saturated analog drive", "subgenre"),
  o("hypnotic", "Hypnotic", "hypnotic looping patterns", "subgenre"),
  o("warehouse", "Warehouse", "warehouse rave character", "subgenre"),
  o("progressive", "Progressive", "progressive techno motion", "subgenre"),
  o("hardgroove", "Hardgroove", "hardgroove shuffle grooves", "subgenre"),
  o("tranceTechno", "Trance Crossover", "trance-influenced techno atmospheres", "subgenre"),
  o("ambientTechno", "Ambient", "ambient techno textures", "subgenre"),
  o("lofi", "Lo-Fi", "lo-fi dusty processing", "subgenre"),
  o("brokenBeat", "Broken Techno", "broken-beat techno rhythms", "subgenre"),
  o("psyTechno", "Psy-Tech", "psy-influenced rolling patterns", "subgenre"),

  // Rhythm / Drums (families: kick, snare, hat, perc, texture, kit, groove)
  // KICK
  o("909", "TR-909 Kit", "TR-909 engine", "rhythm", { family: "kit", primary: true, tags:["drums","classic","909"] }),
  o("808", "TR-808 Kit", "TR-808 engine", "rhythm", { family: "kit", primary: true }),
  o("707", "TR-707 Kit", "TR-707 crisp kit", "rhythm", { family: "kit" }),
  o("rh707Hybrid", "707 Hybrid", "707 mixed with modern layers", "rhythm", { family: "kit" }),
  o("kickPunch", "Punch Kick", "punchy focused kick", "rhythm", { family: "kick", primary: true, tags:["kick","punch","transient"] }),
  o("kickDeep", "Deep Kick", "deep sub-heavy kick", "rhythm", { family: "kick" }),
  o("analogRumble", "Analog Rumble", "analog processed kick rumble", "rhythm", { family: "kick" }),
  o("rumble", "Rumble Tail", "rumble low-end", "rhythm", { family: "kick" }),
  o("kickSaturated", "Sat Kick", "saturated distorted kick", "rhythm", { family: "kick" }),
  o("kickTransientLite", "Lite Transient", "soft transient kick", "rhythm", { family: "kick" }),
  // SNARE / CLAP
  o("claps", "Claps", "clap accents", "rhythm", { family: "snare", primary: true }),
  o("snareTight", "Tight Snare", "tight controlled snare", "rhythm", { family: "snare" }),
  o("snareBody", "Body Snare", "snare with body resonance", "rhythm", { family: "snare" }),
  o("snareNoise", "Noise Snare", "noisy snare layer", "rhythm", { family: "snare" }),
  // HATS
  o("hatsOffbeat", "Offbeat Hats", "offbeat closed hats", "rhythm", { family: "hat", primary: true }),
  o("hatClosed16", "Closed 16ths", "16th closed hat pattern", "rhythm", { family: "hat" }),
  o("hatOpenSparse", "Open Sparse", "sparse open hats", "rhythm", { family: "hat" }),
  o("rides", "Ride Pattern", "ride pattern", "rhythm", { family: "hat" }),
  o("hatShimmer", "Shimmer Hat", "shimmering high hat layer", "rhythm", { family: "hat" }),
  // PERCUSSION
  o("perc", "Perc Core", "percussion layers", "rhythm", { family: "perc", primary: true }),
  o("percloops", "Perc Loops", "layered percussion loops", "rhythm", { family: "perc" }),
  o("breaksFrag", "Break Fragments", "breakbeat fragments", "rhythm", { family: "perc" }),
  o("tomSync", "Sync Toms", "synchronized tom fills", "rhythm", { family: "perc" }),
  o("rimClicks", "Rim / Clicks", "rim click accents", "rhythm", { family: "perc" }),
  // TEXTURE / GHOST / GROOVE
  o("ghost24", "Ghost 1/24ths", "1/24th ghost notes", "rhythm", { family: "texture" }),
  o("noiseLayer", "Noise Layer", "noise percussion layer", "rhythm", { family: "texture" }),
  o("vinylCrackle", "Vinyl Crackle", "vinyl crackle texture", "rhythm", { family: "texture" }),
  o("shuffle", "Swing/Shuffle", "swing feel", "rhythm", { family: "groove", primary: true }),
  o("fillsReg", "Drum Fills", "regular drum fills", "rhythm", { family: "groove" }),

  // Groove
  o("swing54", "Swing 54%", "swing 54% microgroove", "groove"),
  o("swing57", "Swing 57%", "swing 57% microgroove", "groove"),
  o("pushPull", "Push/Pull", "push-pull timing accents", "groove"),
  o("humanizeVel", "Human Vel", "humanized velocity accents", "groove"),
  o("lateClap", "Late Clap", "slightly late clap placement", "groove"),

  // Bass
  o("fmBass", "FM Bass", "FM bass stab", "bass", { family: "fm", primary: true }),
  o("sub", "Deep Sub", "deep sub-bass", "bass", { family: "sub", primary: true }),
  o("acidBass", "303 Bass", "resonant 303 squelch", "bass", { family: "acid", primary: true, tags:["bass","acid","303"] }),
  o("rumbleBass", "Rumble Bass", "rumbling sustained bass", "bass", { family: "sustain" }),
  o("reese", "Reese", "reese detuned bass", "bass", { family: "reese", primary: true }),
  o("sawRolling", "Rolling Saw", "rolling saw bass line", "bass", { family: "rolling" }),
  o("seqPluck", "Seq Pluck", "sequenced pluck bass", "bass", { family: "pluck" }),
  o("bassSlide", "Slide Bass", "sliding expressive bass", "bass", { family: "acid" }),
  o("bassChordish", "Chordish Bass", "chordal bass movement", "bass", { family: "harmonic" }),

  // Synths
  o("hoover", "Hoover Lead", "hoover lead", "synths", { family: "lead", primary: true }),
  o("arp", "Arpeggio", "syncopated arpeggio", "synths", { family: "motion", primary: true }),
  o("stab", "Chord Stab", "percussive chord stabs", "synths", { family: "stab", primary: true }),
  o("fmKeys", "FM Keys", "fm keys bellish", "synths", { family: "keys" }),
  o("wavetableLead", "Wavetable Lead", "wavetable morphing lead", "synths", { family: "lead" }),
  o("padJuno", "Juno Pad", "juno-style pad", "synths", { family: "pad", primary: true }),
  o("monoLeadAcid", "Mono Acid Lead", "mono resonant acid lead", "synths", { family: "acid" }),
  o("chordAtmos", "Chord Atmos", "washed evolving chord layer", "synths", { family: "atmos" }),
  o("pluckGlass", "Glass Pluck", "glassy pluck tone", "synths", { family: "pluck" }),
  o("textureGran", "Gran Texture", "granular evolving texture", "synths", { family: "texture" }),
  o("resLeadShift", "Res Shift Lead", "resonant shifting lead", "synths", { family: "lead" }),

  // Sound Design
  o("granularPad", "Granular Pad", "granular stretched pad", "soundDesign"),
  o("noiseMod", "Noise Mod", "modulated noise layer", "soundDesign"),
  o("resSweep", "Res Sweep", "resonant filter sweeps", "soundDesign"),
  o("fmPerc", "FM Perc", "fm percussive blips", "soundDesign"),
  o("metallicFx", "Metallic FX", "metallic resonances", "soundDesign"),

  // Atmosphere
  o("padAiry", "Airy Pad", "airy pad layer", "atmosphere"),
  o("drone", "Drone", "low drone bed", "atmosphere"),
  o("warehouseRev", "Warehouse Verb", "warehouse ambience", "atmosphere"),
  o("fieldRec", "Field Recording", "field recording texture", "atmosphere"),
  o("noirRain", "Noir Rain", "noir rain ambience", "atmosphere"),

  // FX
  o("noise", "Noise Sweep", "white-noise sweeps", "fx"),
  o("riser", "Risers", "riser FX", "fx"),
  o("downlifter", "Downlifter", "downlifter FX", "fx"),
  o("impact", "Impacts", "impact hits", "fx"),
  o("tape", "Tape Wow", "tape wow/flutter", "fx"),
  o("granular", "Granular", "granular texture", "fx"),
  o("bitcrush", "Bitcrush", "bitcrushed artifacts", "fx"),
  o("reverseFx", "Reverse FX", "reverse transition fx", "fx"),
  o("glitch", "Glitch", "glitch burst edits", "fx"),

  // Arrangement
  o("intro8", "Intro 8 Bars", "8-bar intro", "arrangement"),
  o("intro16", "Intro 16 Bars", "16-bar intro", "arrangement"),
  o("breakdown", "Breakdown", "dramatic breakdown", "arrangement"),
  o("linearBuild", "Linear Build", "linear progressive build", "arrangement"),
  o("dropA", "Main Drop A", "main drop emphasis", "arrangement"),
  o("minimalEdits", "Minimal Edits", "subtle arrangement edits", "arrangement"),
  o("fakeout", "Fake-out", "drop fake-out tension", "arrangement"),
  o("stutterFill", "Stutter Fill", "stutter transition fill", "arrangement"),

  // Performance
  o("liveMute", "Live Mutes", "live style channel mutes", "performance"),
  o("filterJam", "Filter Jam", "improvised filter sweeps", "performance"),
  o("fxThrows", "FX Throws", "send fx throw moments", "performance"),
  o("macroMorph", "Macro Morph", "macro control morphing", "performance"),

  // Mix
  o("wide", "Wide Stereo", "wide stereo image", "mix"),
  o("monoLow", "Mono Bass", "mono-compatible low end", "mix"),
  o("punch", "Punchy", "punchy transient shaping", "mix"),
  o("glue", "Bus Glue", "bus glue compression", "mix"),
  o("sidechain", "Sidechain", "sidechain pump", "mix", { tags:["dynamics","pump"] }),
  o("headroom", "-6 dB Headroom", "-6 dB headroom", "mix"),
  o("tiltBright", "Tilt Bright", "tilt eq bright lift", "mix"),
  o("spaceCtrl", "Space Control", "controlled ambience decay", "mix"),
  // --- 새 Mix 확장 (스타일 다양화) ---
  o("transientEdge", "Transient Edge", "defined transient edge", "mix", { tags:["transient"] }),
  o("midContour", "Mid Contour", "midrange contour focus", "mix"),
  o("airSheen", "Air Sheen", "silky high-air sheen", "mix", { tags:["air"] }),
  o("depthLayer", "Depth Layer", "layered depth staging", "mix"),
  o("parallelGlue", "Parallel Glue", "parallel glue bus", "mix", { tags:["parallel"] }),
  o("subFocus", "Sub Focus", "focused sub articulation", "mix", { tags:["sub"] }),
  o("stereoStage", "Stereo Stage", "stereo stage shaping", "mix"),
  o("phaseTidy", "Phase Tidy", "phase alignment tidy-up", "mix", { tags:["phase"] }),

  // Processing
  o("tapeSat", "Tape Sat", "tape style saturation", "processing"),
  o("tubeDrive", "Tube Drive", "tube harmonic drive", "processing"),
  o("parallelComp", "Parallel Comp", "parallel compression", "processing"),
  o("midSide", "Mid/Side", "mid-side spatial shaping", "processing"),
  o("resonantHp", "Res HP Sweep", "resonant high-pass sweeps", "processing"),

  // Meters
  o("lufsClub", "LUFS -7 to -6", "target -6.5 LUFS short-term", "meters"),
  o("truePeak", "TP -1 dB", "true-peak ceiling -1 dB", "meters"),
  o("crest", "Crest ~8", "crest factor ~8", "meters"),
  o("drDynamic", "DR Target", "maintain musical dynamics", "meters"),
  
  // ---- Extended Mix ----
  o("transientControl", "Transient Control", "transient envelope control", "mix", { tags:["transient","shaping"] }),
  o("lowMidSculpt", "Low-Mid Sculpt", "sculpted low-mid clarity", "mix"),
  o("airShelf", "Air Shelf", "airy high-frequency shelf", "mix"),
  o("depthContrast", "Depth Contrast", "foreground/background depth contrast", "mix"),
  o("busSat", "Bus Saturation", "musical bus saturation", "mix"),
  o("phaseAlign", "Phase Align", "phase-aligned low layers", "mix"),
  o("dualMonoComp", "Dual-Mono Comp", "dual-mono compressor glue", "mix"),

  // ---- Extended Arrangement ----
  o("energyCurve", "Energy Curve", "intentional energy curve mapping", "arrangement"),
  o("midBreak", "Mid Break", "mid-track atmospheric break", "arrangement"),
  o("altDrop", "Alt Drop", "alternate drop variation", "arrangement"),
  o("callResponse", "Call & Response", "call-and-response motif shifts", "arrangement"),
  o("layerSwap", "Layer Swap", "layer swap transitions", "arrangement"),
  o("stripBack", "Strip Back", "stripped minimal section", "arrangement"),
  o("teaseReturn", "Tease Return", "teased motif reintroduction", "arrangement"),
  o("arrMuteStabs", "Mute Stabs", "arrangement mute stab edits", "arrangement"),

  // ---- Extended Performance ----
  o("liveQuantShift", "Quant Shift", "live micro-quant shift", "performance"),
  o("faderRides", "Fader Rides", "dynamic fader rides", "performance"),
  o("loopJuggle", "Loop Juggle", "on-the-fly loop juggling", "performance"),
  o("onTheFlyResample", "Resample Live", "on-the-fly resampling", "performance"),
  o("fxFreeze", "FX Freeze", "fx freeze stutter moments", "performance"),

  // ---- Extended Processing ----
  o("multiBandDrive", "Multi-band Drive", "targeted multiband drive", "processing", { tags:["drive","multiband"] }),
  o("clipper", "Clipper", "transparent clip limiting", "processing"),
  o("spectralWarp", "Spectral Warp", "spectral warp processing", "processing"),
  o("granularDelay", "Granular Delay", "granular delay diffusion", "processing"),
  o("dynamicEq", "Dynamic EQ", "dynamic eq control", "processing"),
  o("transientSplit", "Transient Split", "transient/body split chain", "processing"),
  o("harmonicExcite", "Harmonic Excite", "selective harmonic excitation", "processing"),

  // ---- Extended Sound Design ----
  o("spectralPad", "Spectral Pad", "spectral washed pad", "soundDesign", { tags:["pad","spectral"] }),
  o("polyRhythmSeq", "Polyrhythm Seq", "polyrhythmic sequence layer", "soundDesign", { tags:["sequence","polyrhythm"] }),
  o("wavetableMorph", "Wavetable Morph", "morphing wavetable motion", "soundDesign"),
  o("analogDrift", "Analog Drift", "analog pitch drift layer", "soundDesign"),
  o("noiseImpulse", "Noise Impulse", "noise impulse accents", "soundDesign"),
  o("formantShift", "Formant Shift", "formant-shifted textures", "soundDesign"),
  o("textureSpray", "Texture Spray", "granular texture spray", "soundDesign"),

  // ---- Extended Meters ----
  o("rmsTarget", "RMS Target", "balanced rms target", "meters"),
  o("lufsIntegrated", "LUFS Integrated", "integrated loudness monitoring", "meters"),
  o("tpCeilNeg09", "TP -0.9 dB", "true-peak ceiling -0.9 dB", "meters"),
  o("phaseCorr", "Phase Corr", "phase correlation monitoring", "meters"),
  o("lraMonitor", "LRA Monitor", "loudness range monitoring", "meters"),
  o("subBandBalance", "Sub Balance", "sub-band energy balance", "meters"),

  // === Additional Atmosphere Extensions ===
  o("windDistant", "Wind Distant", "distant wind ambience", "atmosphere"),
  o("cityHaze", "City Haze", "distant city haze texture", "atmosphere"),
  o("nightInsects", "Night Insects", "subtle night insect layer", "atmosphere"),
  o("metalSpace", "Metal Space", "metallic resonant space", "atmosphere"),
  o("fogDrone", "Fog Drone", "foggy filtered drone", "atmosphere"),
  o("reverseAir", "Reverse Air", "reverse airy swells", "atmosphere"),
  // === New Atmosphere Diversity ===
  o("tapeHissBed", "Tape Hiss Bed", "soft tape hiss noise bed", "atmosphere", { tags:["noise","hiss"] }),
  o("infraSubAir", "Infra Sub Air", "infra-sub airy low bloom", "atmosphere", { tags:["low","air"] }),
  o("shimmerTail", "Shimmer Tail", "shimmer reverb tail layer", "atmosphere", { tags:["shimmer","reverb"] }),
  o("granularMist", "Granular Mist", "granular mist texture", "atmosphere", { tags:["granular","texture"] }),
  o("distantChatter", "Distant Chatter", "distant crowd chatter wash", "atmosphere", { tags:["field","human"] }),
  o("airBloom", "Air Bloom", "blooming filtered air swell", "atmosphere", { tags:["swell","air"] }),
  o("resonantTunnel", "Res Tunnel", "resonant tunnel impulse feel", "atmosphere", { tags:["impulse","space"] }),
  o("subRumbleBed", "Sub Rumble Bed", "low sub rumble ambience", "atmosphere", { tags:["sub","low"] }),

  // === Additional Sound Design Layers ===
  o("bitTexture", "Bit Texture", "bit depth mod texture", "soundDesign"),
  o("phasePlant", "Phase Plant", "phase-based evolving tone", "soundDesign"),
  o("bleedLayer", "Bleed Layer", "lo-fi bleed styled layer", "soundDesign"),
  o("repitchGrain", "Repitch Grain", "repitched granular slices", "soundDesign"),
  o("macroNoiseShift", "Macro Noise Shift", "macro noise morphing", "soundDesign"),
  o("distTail", "Dist Tail", "distorted tail artifacts", "soundDesign"),
  o("dustImpulses", "Dust Impulses", "dusty impulse hits", "soundDesign"),

  // === Additional Arrangement Building Blocks ===
  o("preLift", "Pre-Lift", "pre-drop lift section", "arrangement"),
  o("drumSwap", "Drum Swap", "alt drum layer swap", "arrangement"),
  o("ghostIntro", "Ghost Intro", "ghosted filtered intro", "arrangement"),
  o("microBreak", "Micro Break", "short micro-break", "arrangement"),
  o("stutterGate", "Stutter Gate", "stutter gate transition", "arrangement"),
  o("reintroPad", "Reintro Pad", "pad motif reintroduction", "arrangement"),
  o("textureDrop", "Texture Drop", "texture-forward drop", "arrangement"),
  o("silenceGap", "Silence Gap", "sudden silence gap", "arrangement"),
  o("turnaround", "Turnaround", "turnaround fill phrase", "arrangement"),
  o("bridgeAlt", "Bridge Alt", "alternative bridge phrase", "arrangement"),

  // === Additional Performance Gestures ===
  o("paramMorph", "Param Morph", "parameter morph performance", "performance"),
  o("liveGran", "Live Gran", "live granular slicing", "performance"),
  o("fxRibbon", "FX Ribbon", "ribbon style fx control", "performance"),
  o("encoderTwist", "Encoder Twist", "encoder twist modulation", "performance"),
  o("loopDegrade", "Loop Degrade", "live loop degrade", "performance"),
  o("patternFlip", "Pattern Flip", "pattern flip improv", "performance"),
  o("sceneTrigger", "Scene Trigger", "scene trigger launch", "performance"),

  // === Additional Mix Focus ===
  o("subTight", "Sub Tight", "tight controlled sub", "mix"),
  o("midForward", "Mid Forward", "midrange forward presence", "mix"),
  o("stereoTuck", "Stereo Tuck", "tuck overly wide elements", "mix"),
  o("airTrim", "Air Trim", "controlled high-air trim", "mix"),
  o("busTransient", "Bus Transient", "bus transient enhancement", "mix"),
  o("glueSide", "Glue Side", "side-channel glue control", "mix"),
  o("subMonoCheck", "Sub Mono Check", "sub mono compatibility check", "mix"),
  // === Advanced Mix Additions ===
  o("mixHeadroomTrim", "Headroom Trim", "final headroom trim staging", "mix", { tags:["gain","staging"] }),
  o("dynamicStereo", "Dynamic Stereo", "dynamic stereo field modulation", "mix", { tags:["stereo","dynamic"] }),
  o("microSaturation", "Micro Saturation", "micro saturation enhancement", "mix", { tags:["saturation","micro"] }),
  o("transientBed", "Transient Bed", "supporting transient bed layer", "mix", { tags:["transient","support"] }),
  o("contrastEQ", "Contrast EQ", "broad vs narrow contrast eq", "mix", { tags:["eq","contrast"] }),
  o("parallelColor", "Parallel Color", "parallel color bus", "mix", { tags:["parallel","tone"] }),

  // === Additional Processing Techniques ===
  o("spectralDenoise", "Spectral Denoise", "spectral denoise shaping", "processing", { tags:["spectral","cleanup"] }),
  o("psDensity", "Phase Scope Density", "phase scope density balance", "processing"),
  o("clipStage", "Clip Stage", "multi-stage clipping", "processing"),
  o("harmFold", "Harm Fold", "harmonic folding distortion", "processing"),
  o("surgEQ", "Surgical EQ", "surgical eq notches", "processing"),
  o("lowGlue", "Low Glue", "low band glue comp", "processing"),
  o("hiExciter", "Hi Exciter", "high band exciter", "processing"),

  // === Additional Metering Targets ===
  o("psrMonitor", "PSR Monitor", "peak to short-term ratio monitor", "meters"),
  o("crestLive", "Crest Live", "live crest factor tracking", "meters"),
  o("subEnergy", "Sub Energy", "sub energy distribution", "meters"),
  o("monoCheck", "Mono Check", "full mix mono check", "meters"),
  o("phaseVector", "Phase Vector", "phase vector scope", "meters"),
  o("peakShort", "Peak Short", "short-term peak tracking", "meters"),
  
  // === Mastering ===
  o("mstLimiter", "Limiter", "transparent mastering limiter", "mastering", { tags:["limiter","loudness"] }),
  o("mstClipStage", "Clip Stage", "controlled pre-limiter clip stage", "mastering", { tags:["clip","pre"] }),
  o("mstStereoStage", "Stereo Stage", "master stereo stage shaping", "mastering", { tags:["stereo","stage"] }),
  o("mstImagerMid", "Imager Mid Emph", "mid emphasis imaging", "mastering", { tags:["imager","mid"] }),
  o("mstExciterHi", "Exciter High", "high band harmonic exciter", "mastering", { tags:["exciter","high"] }),
  o("mstDynamicEq", "Dyn Master EQ", "dynamic master eq bands", "mastering", { tags:["dynamic","eq"] }),
  o("mstGlueBus", "Master Glue", "master bus gentle glue", "mastering", { tags:["glue","bus"] }),
  o("mstMSEDynamic", "MS Dynamic", "mid/side dynamic shaping", "mastering", { tags:["ms","dynamic"] }),
  o("mstLowTight", "Low Tight", "tight low-end control", "mastering", { tags:["low","control"] }),
  o("mstAirLift", "Air Lift", "subtle master air lift", "mastering", { tags:["air","lift"] }),
  o("mstToneTilt", "Tone Tilt", "broad tone tilt balance", "mastering", { tags:["tilt","tone"] }),
  o("mstLufsTarget", "LUFS Target", "final loudness target set", "mastering", { tags:["lufs","target"] }),
  // --- 새 Mastering 확장 ---
  o("mstLimiter2", "Limiter 2", "secondary limiter stage", "mastering", { tags:["limiter"] }),
  o("mstSoftClip", "Soft Clip", "soft clip tone", "mastering", { tags:["clip"] }),
  o("mstTransientTame", "Transient Tame", "transient taming stage", "mastering", { tags:["transient"] }),
  o("mstExciterBroad", "Broad Exciter", "broadband exciter", "mastering", { tags:["exciter"] }),
  o("mstStereoFocus", "Stereo Focus", "stereo focus enhancement", "mastering", { tags:["stereo"] }),
  o("mstGlueEnhance", "Glue Enhance", "enhanced master glue", "mastering", { tags:["glue"] }),
  o("mstAirPolish", "Air Polish", "final air polish lift", "mastering", { tags:["air"] }),
  o("mstMicroDynamic", "Micro Dynamic", "micro dynamic control", "mastering", { tags:["dynamic"] }),
  o("mstLoudnessMatch", "Loudness Match", "reference loudness match", "mastering", { tags:["reference"] }),
];

export const ORDER: GroupId[] = [
  "subgenre",
  "rhythm",
  "groove",
  "bass",
  "synths",
  "soundDesign",
  "atmosphere",
  "fx",
  "arrangement",
  "performance",
  "mix",
  "processing",
  "meters",
  "mastering",
  "params",
];

export const SUBOPTS: Record<string, SubOpt[]> = {
  "909": [
    { id: "909-kick-short", label: "Kick Short", prompt: "909 kick short decay" },
    { id: "909-kick-long", label: "Kick Long", prompt: "909 kick long tail" },
    { id: "909-openhat", label: "Open Hat", prompt: "909 open hat bright" },
    { id: "909-closedhat-16", label: "Closed 16ths", prompt: "909 closed hats 16th" },
    { id: "909-ride", label: "Ride", prompt: "909 ride metallic" },
    { id: "909-swing-55", label: "Swing 55%", prompt: "swing 55%" },
    { id: "909-swing-58", label: "Swing 58%", prompt: "swing 58%" },
  ],
  "808": [
    { id: "808-kick-boom", label: "Kick Boom", prompt: "808 booming kick" },
    { id: "808-clap", label: "Clap", prompt: "808 clap" },
    { id: "808-cowbell", label: "Cowbell", prompt: "808 cowbell" },
    { id: "808-toms", label: "Toms", prompt: "808 toms" },
  ],
  "acidBass": [
    { id: "303-reso", label: "High Resonance", prompt: "high resonance 303" },
    { id: "303-slide", label: "Slide", prompt: "accented slides" },
    { id: "303-accent", label: "Accent", prompt: "accent pattern" },
  ],
  "reese": [
    { id: "reese-detune", label: "Detune", prompt: "detuned layers" },
    { id: "reese-layer", label: "Layer", prompt: "layered reese" },
  ],
  "arp": [
    { id: "arp-16th", label: "16th", prompt: "16th-note arp" },
    { id: "arp-8th", label: "8th", prompt: "8th-note arp" },
    { id: "arp-syncop", label: "Syncopated", prompt: "syncopated pattern" },
  ],
  "stab": [
    { id: "stab-short", label: "Short", prompt: "short stabs" },
    { id: "stab-chordMinor", label: "Minor", prompt: "minor chord stabs" },
  ],
  "sidechain": [
    { id: "sc-strong", label: "Strong", prompt: "strong sidechain" },
    { id: "sc-gentle", label: "Gentle", prompt: "gentle sidechain" },
  ],
  "transientControl": [
    { id: "tc-soft", label: "Soft", prompt: "soft transient shape" },
    { id: "tc-hard", label: "Hard", prompt: "hard transient shape" },
  ],
  "multiBandDrive": [
    { id: "mbd-low", label: "Low Band", prompt: "low band drive" },
    { id: "mbd-mid", label: "Mid Band", prompt: "mid band drive" },
    { id: "mbd-high", label: "High Band", prompt: "high band drive" },
  ],
  "spectralPad": [
    { id: "spad-glass", label: "Glass", prompt: "glassy spectral pad" },
    { id: "spad-warm", label: "Warm", prompt: "warm diffuse spectral pad" },
    { id: "spad-evolving", label: "Evolving", prompt: "evolving spectral smear" },
  ],
  "polyRhythmSeq": [
    { id: "poly-3over4", label: "3 over 4", prompt: "3:4 polyrhythm" },
    { id: "poly-5over4", label: "5 over 4", prompt: "5:4 polyrhythm" },
    { id: "poly-7accent", label: "7 Accent", prompt: "7-count accent cycle" },
  ],
  "spectralDenoise": [
    { id: "sd-light", label: "Light", prompt: "light spectral denoise" },
    { id: "sd-medium", label: "Medium", prompt: "medium spectral denoise" },
    { id: "sd-heavy", label: "Heavy", prompt: "heavy spectral denoise" },
  ],
  "energyCurve": [
    { id: "ec-linear", label: "Linear", prompt: "linear energy curve" },
    { id: "ec-arc", label: "Arc", prompt: "arching energy curve" },
    { id: "ec-waves", label: "Waves", prompt: "waveform energy cycles" },
  ],
  "pushPull": [
    { id: "pp-subtle", label: "Subtle", prompt: "subtle push-pull feel" },
    { id: "pp-strong", label: "Strong", prompt: "strong push-pull timing" },
  ],
  "glitch": [
    { id: "glitch-slice", label: "Slice", prompt: "sliced glitch bursts" },
    { id: "glitch-buffer", label: "Buffer", prompt: "buffer repeat glitch" },
    { id: "glitch-reverse", label: "Reverse", prompt: "reverse glitch fragments" },
  ],
  "mstLimiter": [
    { id: "mst-lim-transparent", label: "Transparent", prompt: "transparent limiting" },
    { id: "mst-lim-punch", label: "Punch", prompt: "punch preserving limiting" },
    { id: "mst-lim-color", label: "Color", prompt: "slightly colored limiting" },
  ],
  "mstStereoStage": [
    { id: "mst-stage-wide", label: "Wide", prompt: "wide stereo stage" },
    { id: "mst-stage-focus", label: "Focus", prompt: "focused stereo center" },
  ],
  "mstExciterHi": [
    { id: "mst-excite-soft", label: "Soft", prompt: "soft high exciter" },
    { id: "mst-excite-bright", label: "Bright", prompt: "bright high exciter" },
  ],
  "mstDynamicEq": [
    { id: "mst-deq-tight", label: "Tight", prompt: "tight dynamic eq" },
    { id: "mst-deq-gentle", label: "Gentle", prompt: "gentle dynamic balancing" },
  ],
  "mstMSEDynamic": [
    { id: "mst-ms-midfocus", label: "Mid Focus", prompt: "ms mid focus dynamics" },
    { id: "mst-ms-sideair", label: "Side Air", prompt: "ms side air dynamics" },
  ],
  "mstLufsTarget": [
    { id: "mst-lufs-club", label: "Club -6.5", prompt: "club loudness -6.5 lufs" },
    { id: "mst-lufs-stream", label: "Stream -9", prompt: "streaming loudness -9 lufs" },
  ],
};

export const PARAMS_LOOKUP: Record<string, string> = Object.entries(SUBOPTS).reduce((acc, [, list]) => {
  for (const s of list) acc[s.id] = s.prompt;
  return acc;
}, {} as Record<string, string>);
