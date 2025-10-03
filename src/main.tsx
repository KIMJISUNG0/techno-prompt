import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import TechnoPromptGenerator from "./components/TechnoPromptGenerator";
import MultiGenrePromptWizard from "./components/wizard/MultiGenrePromptWizard";
import StackComposerWizard from './components/wizard/StackComposerWizard';
import GenrePortal from './components/portal/GenrePortal';
import TestPlayground from './components/TestPlayground';
import './live/techno140Demo'; // registers techno140 patch

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
  const hash = window.location.hash;
  if (hash.includes('live-test')) return <TestPlayground />;
  if (hash.includes('stack')) return <StackComposerWizard />; // experimental step-by-step layer composer
  // Treat #composer as alias of #wizard (no difference in component for now)
  const [picked, setPicked] = React.useState<string[]|undefined>((window as any).__pickedGenres);
  (window as any).resetGenre = () => setPicked(undefined);
  if (!picked) return <GenrePortal onPick={(ids)=> { (window as any).__pickedGenres = ids; setPicked(ids);} } />;
  if (picked.length===1 && picked[0]==='techno' && hash==='#legacy') return <TechnoPromptGenerator/>;
  return <MultiGenrePromptWizard/>;
}

function AppShell() {
  const { mode, toggle } = useThemeMode();
  return (
    <div className={"min-h-screen flex flex-col " + (mode==='dark' ? 'app-dark-root' : 'bg-slate-100') }>
      <nav className={(mode==='dark' ? 'app-dark-nav ' : 'bg-white/70 backdrop-blur border-slate-200 ') + "border-b flex gap-4 px-4 py-2 text-xs tracking-wide items-center"}>
  <button onClick={()=> (window as any).resetGenre?.()} className={mode==='dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800'}>Genres</button>
        <span className={mode==='dark' ? 'text-slate-600' : 'text-slate-400'}>|</span>
        <span className={mode==='dark' ? 'text-slate-500' : 'text-slate-500'}>Mode:</span>
  <a href="#composer" className={mode==='dark' ? 'text-slate-300 hover:underline' : 'text-slate-700 hover:underline'}>Composer</a>
  <a href="#legacy" className={mode==='dark' ? 'text-slate-300 hover:underline' : 'text-slate-700 hover:underline'}>Legacy Techno</a>
  <a href="#live-test" className={mode==='dark' ? 'text-slate-300 hover:underline' : 'text-slate-700 hover:underline'}>Live Test</a>
        <div className="flex-1" />
        <div onClick={toggle} className="theme-toggle" data-mode={mode} role="button" aria-label="Toggle dark / light theme">
          <span className="tt-ico" aria-hidden>{mode==='dark' ? '🌙' : '☀️'}</span>
          <div className="tt-track"><div className="tt-thumb" /></div>
          <span className="uppercase tracking-wider">{mode==='dark' ? 'Dark' : 'Light'}</span>
        </div>
      </nav>
      <div className="flex-1">
        <RootChooser />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
