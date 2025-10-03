export interface InstrumentCategory {
  id: string;
  label: string;
  desc: string;
}

export const INSTRUMENT_CATEGORIES: InstrumentCategory[] = [
  { id:'piano', label:'Piano / Keys', desc:'Acoustic, grand, upright, electric pianos & keys' },
  { id:'synth', label:'Synth Lead', desc:'Mono / poly analog & digital style leads' },
  { id:'pad', label:'Pads & Atmos', desc:'Wide evolving pads, textures, drones' },
  { id:'pluck', label:'Plucks / Mallets', desc:'Short plucked, bell, mallet, percussive tonal' },
  { id:'bass', label:'Bass', desc:'Sub, analog, FM, Reese, 808 variants' },
  { id:'guitar', label:'Guitar', desc:'Electric, clean, ambient, muted, picked' },
  { id:'strings', label:'Strings', desc:'Ensemble, chamber, solo, lush cinematic' },
  { id:'brass', label:'Brass / Horns', desc:'Trumpet, horn, brass stabs & swells' },
  { id:'woodwind', label:'Woodwinds', desc:'Flute, clarinet, airy melodic lines' },
  { id:'vocal', label:'Vocal / Choir', desc:'Ooh / aah, chopped, processed vocal pads' },
  { id:'fx', label:'FX / Design', desc:'Risers, impacts, sweeps, noise design' },
  { id:'arp', label:'Arp / Sequence', desc:'Arpeggiated rhythmic sequences' },
  { id:'percpitch', label:'Percussive Tonal', desc:'Kalimba, steel, vibraphone hybrids' },
  { id:'organ', label:'Organ', desc:'Tonewheel, rock, cathedral, mellow' },
  { id:'world', label:'World / Ethnic', desc:'Ethnic plucked, flutes, cultural colors' },
  { id:'chip', label:'Chiptune', desc:'8-bit / retro game tonal elements' }
];
