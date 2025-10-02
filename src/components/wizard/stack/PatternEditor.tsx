import React from 'react';

interface Props { value:string; onChange:(v:string)=>void; }
// Minimal placeholder pattern editor (future: grid)
export function PatternEditor({ value, onChange }:Props){
  return (
    <textarea
      className="w-full min-h-[100px] bg-black/40 border border-slate-700 rounded p-2 text-[12px] font-mono focus:outline-none focus:border-cyan-400"
      value={value}
      onChange={e=> onChange(e.target.value)}
      placeholder="Enter DSL pattern (e.g. C4_E4.G4!_B4.-C5?)"
    />
  );
}
