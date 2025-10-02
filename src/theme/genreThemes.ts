export interface GenreTheme {
  id: string;
  gradient: string;       // tailwind gradient classes
  accent: string;         // text / border accent
  glow: string;           // shadow / ring color
  softBg: string;         // panel bg overlay
}

export const GENRE_THEMES: Record<string, GenreTheme> = {
  techno: {
    id: 'techno',
    gradient: 'from-cyan-400 via-teal-300 to-fuchsia-400',
    accent: 'text-cyan-300',
    glow: 'shadow-[0_0_24px_rgba(34,211,238,0.35)]',
    softBg: 'bg-cyan-500/10'
  },
  techhouse: {
    id: 'techhouse',
    gradient: 'from-amber-400 via-lime-300 to-cyan-400',
    accent: 'text-amber-300',
    glow: 'shadow-[0_0_24px_rgba(245,158,11,0.35)]',
    softBg: 'bg-amber-500/10'
  },
  house: {
    id: 'house',
    gradient: 'from-pink-400 via-rose-300 to-orange-300',
    accent: 'text-pink-300',
    glow: 'shadow-[0_0_24px_rgba(236,72,153,0.35)]',
    softBg: 'bg-pink-500/10'
  },
  trance: {
    id: 'trance',
    gradient: 'from-indigo-400 via-violet-300 to-cyan-300',
    accent: 'text-indigo-300',
    glow: 'shadow-[0_0_24px_rgba(129,140,248,0.35)]',
    softBg: 'bg-indigo-500/10'
  },
  dubstep: {
    id: 'dubstep',
    gradient: 'from-lime-400 via-emerald-300 to-purple-400',
    accent: 'text-lime-300',
    glow: 'shadow-[0_0_24px_rgba(132,204,22,0.35)]',
    softBg: 'bg-lime-500/10'
  },
  hiphop: {
    id: 'hiphop',
    gradient: 'from-yellow-400 via-amber-300 to-emerald-300',
    accent: 'text-amber-300',
    glow: 'shadow-[0_0_24px_rgba(251,191,36,0.35)]',
    softBg: 'bg-yellow-500/10'
  },
  ambient: {
    id: 'ambient',
    gradient: 'from-sky-400 via-cyan-300 to-emerald-300',
    accent: 'text-sky-300',
    glow: 'shadow-[0_0_24px_rgba(56,189,248,0.35)]',
    softBg: 'bg-sky-500/10'
  },
  orchestral: {
    id: 'orchestral',
    gradient: 'from-amber-300 via-yellow-200 to-stone-300',
    accent: 'text-amber-200',
    glow: 'shadow-[0_0_24px_rgba(245,158,11,0.35)]',
    softBg: 'bg-amber-400/10'
  },
  default: {
    id: 'default',
    gradient: 'from-cyan-300 via-teal-200 to-fuchsia-300',
    accent: 'text-cyan-300',
    glow: 'shadow-[0_0_24px_rgba(34,211,238,0.30)]',
    softBg: 'bg-cyan-500/10'
  }
};

export function getGenreTheme(id?:string){
  if (!id) return GENRE_THEMES.default;
  return GENRE_THEMES[id] || GENRE_THEMES.default;
}
