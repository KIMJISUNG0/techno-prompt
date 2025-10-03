import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
const MultiGenrePromptWizard = React.lazy(()=> import('./components/wizard/MultiGenrePromptWizard'));
const StackComposerWizard = React.lazy(()=> import('./components/wizard/StackComposerWizard'));
import GenrePortal from './components/portal/GenrePortal';
import TestPlayground from './components/TestPlayground';
import './live/techno140Demo'; // registers techno140 patch
const QuickComposer = React.lazy(()=> import('./components/QuickComposer'));
const ProgressiveComposer = React.lazy(()=> import('./components/ProgressiveComposer'));
const UnifiedComposer = React.lazy(()=> import('./components/unified/UnifiedComposer'));
// SimpleComposer removed (deprecated simple mode)

// Pre-parse hash for shareable genre selection (#g=genre1+genre2)
(()=> {
  try {
    const hash = window.location.hash;
    // Skip genre parse if we're on test playground
    if (hash.includes('live-test')) return;
    const match = hash.match(/g=([^&]+)/);
    if (match) {
      const list = decodeURIComponent(match[1]).split('+').filter(Boolean);
      if (list.length) {
        (window as any).__pickedGenres = list;
      }
    }
  } catch { /* ignore hash parse errors */ }
})();

// Simple theme mode hook with persistence + prefers-color-scheme fallback
function useThemeMode() {
  const [mode, setMode] = React.useState<'dark'|'light'>(() => {
    try {
      const saved = localStorage.getItem('app-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  React.useEffect(() => {
  try { localStorage.setItem('app-theme', mode); } catch {/* ignore persist error */}
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);
  const toggle = React.useCallback(() => setMode(m => m==='dark'?'light':'dark'), []);
  return { mode, toggle };
}

function RootChooser() {
  const [hash, setHash] = React.useState(window.location.hash);
  React.useEffect(()=> {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (hash.includes('live-test')) return <TestPlayground />;
  if (hash.includes('stack')) return <StackComposerWizard />; // experimental step-by-step layer composer
  if (hash.includes('expert')) return <QuickComposer />; // expert (instrument/structure oriented)
  if (hash.includes('abstract')) return <ProgressiveComposer />; // abstract token-based path
  if (hash.includes('unified')) return <UnifiedComposer />; // new unified composer scaffold
  if (hash.includes('quick')) return <QuickComposer />; // backward compat alias
  // Simple mode removed
  // Treat #composer as alias of #wizard (no difference in component for now)
  const [picked, setPicked] = React.useState<string[]|undefined>((window as any).__pickedGenres);
  (window as any).resetGenre = () => setPicked(undefined);
  if (!picked) return <GenrePortal onPick={(ids)=> { (window as any).__pickedGenres = ids; setPicked(ids);} } />;
  // Legacy single-genre Techno view removed
  return <MultiGenrePromptWizard/>;
}

function AppShell() {
  const { mode, toggle } = useThemeMode();
  return (
    <div className={"min-h-screen flex flex-col " + (mode==='dark' ? 'app-dark-root' : 'bg-slate-100') }>
  <nav className={(mode==='dark' ? 'app-dark-nav ' : 'bg-white/70 backdrop-blur border-slate-200 ') + "border-b flex gap-3 px-4 py-2 text-xs tracking-wide items-center"}>
  <button onClick={()=> (window as any).resetGenre?.()} className="btn">Genres</button>
    <span className="text-slate-600">|</span>
    <div className="flex gap-2 items-center">
      <span className="text-slate-500">Mode:</span>
  <a href="#expert" className="btn">Expert</a>
  <a href="#abstract" className="btn">Abstract</a>
  <a href="#unified" className="btn">Unified</a>
  <a href="#composer" className="btn">Composer</a>
  <a href="#live-test" className="btn">Live Test</a>
    </div>
        <div className="flex-1" />
        <div onClick={toggle} className="theme-toggle" data-mode={mode} role="button" aria-label="Toggle dark / light theme">
          <span className="tt-ico" aria-hidden>{mode==='dark' ? '🌙' : '☀️'}</span>
          <div className="tt-track"><div className="tt-thumb" /></div>
          <span className="uppercase tracking-wider">{mode==='dark' ? 'Dark' : 'Light'}</span>
        </div>
      </nav>
      <div className="flex-1">
        <React.Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading module…</div>}>
          <RootChooser />
        </React.Suspense>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
