import React, { useState, useEffect, useMemo } from 'react';
// Removed arranger dependencies (buildDefaultDraft, exportPrompt, etc.)
import { getGenreTheme } from '../../theme/genreThemes';

// local helpers (duplicated for isolation) -------------------------------------------------

export interface TopGenre {
  id: string;
  label: string;
  description?: string;
  children?: TopGenre[]; // nested (e.g., EDM -> techno/house/trance)
}

const GENRE_TREE: TopGenre[] = [
  {
    id: 'edm', label: 'EDM', description: 'Electronic Dance Music umbrella', children: [
      { id: 'techno', label: 'Techno', description: 'Driving hypnotic grooves' },
      { id: 'techhouse', label: 'Tech House', description: 'Hybrid tech + house' },
      { id: 'house', label: 'House', description: 'Classic & modern house' },
      { id: 'trance', label: 'Trance', description: 'Uplifting / progressive' },
      { id: 'dnb', label: 'Drum & Bass', description: 'Fast breakbeat energy' },
      { id: 'dubstep', label: 'Dubstep', description: 'Half-time bass pressure' },
    ]
  },
  {
    id: 'hiphop', label: 'Hip Hop', description: 'Beats / rap / boom bap', children:[
      { id: 'trap', label: 'Trap', description: 'Modern trap bounce' },
      { id: 'boomBap', label: 'Boom Bap', description: 'Classic drum-heavy style' },
      { id: 'lofiBeats', label: 'Lo-fi Beats', description: 'Dusty mellow vibe' },
    ]
  },
  {
    id: 'pop', label: 'Pop', description: 'Mainstream structures'
  },
  {
    id: 'rock', label: 'Rock', description: 'Band-driven energy', children:[
      { id: 'altRock', label: 'Alt Rock' },
      { id: 'postRock', label: 'Post Rock' },
      { id: 'metal', label: 'Metal' },
    ]
  },
  {
    id: 'cinematic', label: 'Cinematic', description: 'Score & trailer', children:[
      { id: 'orchestral', label: 'Orchestral', description: 'Full orchestra palette' },
      { id: 'hybridScore', label: 'Hybrid Score', description: 'Orchestral + synth' },
      { id: 'ambient', label: 'Ambient', description: 'Textural space' },
    ]
  },
  {
    id: 'classical', label: 'Classical', description: 'Historical art music', children:[
      { id: 'baroque', label: 'Baroque' },
      { id: 'romantic', label: 'Romantic Era' },
      { id: 'modernist', label: 'Modernist' },
    ]
  }
];

interface GenrePortalProps {
  onPick: (leafIds: string[])=> void;
  allowHybrid?: boolean;
  maxHybrid?: number;
}

export default function GenrePortal({ onPick, allowHybrid=true, maxHybrid=2 }: GenrePortalProps){
  const [path, setPath] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [hybrid, setHybrid] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>(()=> {
    try { const v = localStorage.getItem('recent.genres'); return v? JSON.parse(v): []; } catch { return []; }
  });
  useEffect(()=> { try { localStorage.setItem('recent.genres', JSON.stringify(recent.slice(0,8))); } catch {/* ignore persist error */} }, [recent]);

  function currentLevel(): TopGenre[] {
    if (path.length===0) return GENRE_TREE;
    let nodes = GENRE_TREE as TopGenre[];
    for (const segment of path) {
      const found = nodes.find(n=> n.id===segment);
      if (!found) return [];
      if (found.children) nodes = found.children; else return [];
    }
    return nodes;
  }

  function commitPick(ids: string[]) {
    setRecent(r=> [...ids, ...r.filter(x=> !ids.includes(x))]);
    // update hash for shareable link
    try {
      if (ids.length>0) {
        const enc = ids.join('+');
        const base = window.location.hash.split('&').filter(x=> !x.startsWith('#g=') && !x.startsWith('g=')).join('&');
        const newHash = `#g=${enc}`;
        if (base && base!==window.location.hash) {
          window.location.hash = newHash + '&' + base.replace('#','');
        } else {
          window.location.hash = newHash;
        }
      }
    } catch {/* ignore hash update error (e.g., unsupported env) */}
    onPick(ids);
  }

  function enter(id:string){
    // if leaf with no children -> pick
    const level = currentLevel();
    const node = level.find(n=> n.id===id);
    if (node && !node.children) {
      if (allowHybrid) {
        if (hybrid.includes(node.id)) {
          setHybrid(h=> h.filter(x=> x!==node.id));
        } else if (hybrid.length < maxHybrid) {
          setHybrid(h=> [...h,node.id]);
        }
      } else {
        commitPick([node.id]);
      }
      return;
    }
    setPath(p=> [...p,id]);
  }

  function back(){ setPath(p=> p.slice(0,-1)); }

  const level = currentLevel();
  const filteredLevel = useMemo(()=> {
    if (!query.trim()) return level;
    const q = query.toLowerCase();
    return level.filter(n=> n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q));
  }, [level, query]);
  const parentTrail = path.map((id,i)=> {
    const ref = i===0 ? GENRE_TREE.find(n=> n.id===id) : undefined; // only show root maybe
    return ref?.label || id;
  });

  const rootGenre = path[0];
  const portalTheme = getGenreTheme(rootGenre); // still used for subtle shadow only
  const accentBtn = 'text-[11px] px-2 py-1 rounded border transition shadow-inner/10 shadow-black/30';
  const accentGhost = 'border-slate-600 hover:border-slate-400 hover:bg-white/5 text-slate-300';
  const accentPrimary = 'bg-slate-300 text-slate-900 font-semibold border-slate-300 hover:bg-slate-200';
  const hybridActive = hybrid.length===2;
  // Arranger removed – previously provided hybrid intent→draft quick path.

  return (
    <div className={`min-h-screen w-full bg-[#05070d] text-slate-200 px-6 py-10 ${portalTheme.glow}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className={`text-xl font-bold tracking-wider text-slate-300`}>GENRE UNIVERSE{hybridActive ? ' • HYBRID':''}</h1>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
            <input value={query} onChange={e=> setQuery(e.target.value)} placeholder="Search genre..." className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700 focus:outline-none focus:border-cyan-400" />
            {path.length>0 && <button onClick={back} className={`${accentBtn} ${accentGhost}`}>Back</button>}
            {parentTrail.length>0 && <span className="text-slate-500">/ {parentTrail.join(' / ')}</span>}
            {allowHybrid && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Hybrid:</span>
                {hybrid.map(h=> (
                  <button key={h} onClick={()=> setHybrid(x=> x.filter(i=> i!==h))} className={`px-2 py-0.5 text-[10px] rounded-full border border-slate-500 text-slate-300 bg-white/5 hover:border-slate-400`}>{h}</button>
                ))}
                {hybrid.length>0 && <button onClick={()=> commitPick(hybrid)} className={`${accentBtn} ${accentPrimary}`}>Go</button>}
              </div>
            )}
          </div>
        </div>
        {recent.length>0 && path.length===0 && (
          <div className="mb-6 flex items-center gap-2 flex-wrap text-[11px]">
            <span className="text-slate-500">Recent:</span>
            {recent.slice(0,8).map(r=> (
              <button key={r} onClick={()=> commitPick([r])} className="px-2 py-0.5 rounded border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-slate-200">{r}</button>
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredLevel.map(n=> (
            <button key={n.id} onClick={()=> enter(n.id)} className="group relative border border-slate-700 rounded-xl p-4 text-left bg-white/5 hover:border-slate-500 hover:bg-slate-800/40 transition">
              <div className="text-base font-medium tracking-wide group-hover:text-slate-200 flex items-center justify-between">
                <span>{n.label}</span>
                {n.children && <span className="text-[10px] text-slate-500 group-hover:text-slate-300">▶</span>}
              </div>
              <p className="mt-2 text-[11px] text-slate-400 line-clamp-3 min-h-[2.5rem]">{n.description || (n.children? 'Category':'')}</p>
            </button>
          ))}
          {filteredLevel.length===0 && (
            <div className="text-sm text-slate-500">No items.</div>
          )}
        </div>
        <p className="mt-10 text-[10px] text-slate-500 tracking-widest uppercase">Select a leaf genre to continue…</p>
        {/* Arranger & Progressive removed from portal (now separate routes) */}
      </div>
    </div>
  );
}
