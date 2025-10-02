import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import TechnoPromptGenerator from "./components/TechnoPromptGenerator";
import MultiGenrePromptWizard from "./components/wizard/MultiGenrePromptWizard";
import GenrePortal from './components/portal/GenrePortal';

// Pre-parse hash for shareable genre selection (#g=genre1+genre2)
(()=> {
  try {
    const hash = window.location.hash;
    const match = hash.match(/g=([^&]+)/);
    if (match) {
      const list = decodeURIComponent(match[1]).split('+').filter(Boolean);
      if (list.length) {
        (window as any).__pickedGenres = list;
      }
    }
  } catch { /* ignore hash parse errors */ }
})();

function RootChooser() {
  const [picked, setPicked] = React.useState<string[]|undefined>((window as any).__pickedGenres);
  (window as any).resetGenre = () => setPicked(undefined);
  const hash = window.location.hash;
  if (!picked) return <GenrePortal onPick={(ids)=> { (window as any).__pickedGenres = ids; setPicked(ids);} } />;
  // legacy only if single techno selected
  if (picked.length===1 && picked[0]==='techno' && hash==='#legacy') return <TechnoPromptGenerator/>;
  // MultiGenrePromptWizard 내부에서 picked 목록을 window 통해 참조 가능하도록 저장
  return <MultiGenrePromptWizard/>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="min-h-screen flex flex-col bg-[#03060c]">
      <nav className="border-b border-slate-800 flex gap-4 px-4 py-2 text-xs tracking-wide bg-[#04070d] items-center">
        <button onClick={()=> (window as any).resetGenre?.()} className="text-slate-400 hover:text-cyan-300">Genres</button>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500">Mode:</span>
        <a href="#wizard" className="text-cyan-300 hover:underline">Wizard</a>
        <a href="#legacy" className="text-cyan-300 hover:underline">Legacy Techno</a>
      </nav>
      <div className="flex-1">
        <RootChooser />
      </div>
    </div>
  </React.StrictMode>
);
