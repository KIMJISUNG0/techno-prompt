export interface GenreTheme {
  id: string;
  gradient: string;       // tailwind gradient classes
  accent: string;         // text / border accent
  glow: string;           // shadow / ring color
  softBg: string;         // panel bg overlay
}

export const GENRE_THEMES: Record<string, GenreTheme> = {
  /* Unified neutral theme for all genres (grayscale) */
  techno: { id:'techno', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  techhouse: { id:'techhouse', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  house: { id:'house', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  trance: { id:'trance', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  dubstep: { id:'dubstep', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  hiphop: { id:'hiphop', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  boomBap: { id:'boomBap', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  trap: { id:'trap', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  lofiBeats: { id:'lofiBeats', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  dnb: { id:'dnb', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  ambient: { id:'ambient', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  cinematic: { id:'cinematic', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  orchestral: { id:'orchestral', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  pop: { id:'pop', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_12px_rgba(148,163,184,0.25)]', softBg:'bg-slate-500/10' },
  funk: { id:'funk', gradient:'from-amber-500 via-amber-400 to-yellow-300', accent:'text-amber-200', glow:'shadow-[0_0_12px_rgba(251,191,36,0.35)]', softBg:'bg-amber-500/10' },
  funkdisco: { id:'funkdisco', gradient:'from-pink-500 via-amber-400 to-yellow-300', accent:'text-pink-200', glow:'shadow-[0_0_12px_rgba(244,114,182,0.35)]', softBg:'bg-pink-500/10' },
  funkfusion: { id:'funkfusion', gradient:'from-amber-500 via-purple-400 to-pink-300', accent:'text-purple-200', glow:'shadow-[0_0_12px_rgba(192,132,252,0.35)]', softBg:'bg-purple-500/10' },
  funkrock: { id:'funkrock', gradient:'from-amber-500 via-red-500 to-rose-400', accent:'text-red-200', glow:'shadow-[0_0_12px_rgba(248,113,113,0.35)]', softBg:'bg-red-500/10' },
  default: { id:'default', gradient:'from-slate-500 via-slate-400 to-slate-300', accent:'text-slate-300', glow:'shadow-[0_0_10px_rgba(148,163,184,0.22)]', softBg:'bg-slate-500/10' }
};

export function getGenreTheme(id?:string){
  if (!id) return GENRE_THEMES.default;
  return GENRE_THEMES[id] || GENRE_THEMES.default;
}
