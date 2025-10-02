import { StackState, LayerBase } from './types';

function describeDrum(l:LayerBase){
  const base = l.descriptors.slice(0,3).join(' ');
  if (!l.pattern) return base || l.role;
  const density = l.pattern.replace(/[^xX]/g,'').length / Math.max(1,l.pattern.length);
  const densWord = density>0.5? 'busy':'sparse';
  return [base||l.role, densWord].filter(Boolean).join(' ');
}

function describeMelodic(l:LayerBase){
  const base = l.descriptors.slice(0,3).join(' ');
  if (!l.pattern) return base || l.role;
  const holdRate = (l.pattern.match(/_/g)||[]).length / Math.max(1,l.pattern.length);
  const phrasing = holdRate>0.15? 'legato':'staccato';
  return [base||l.role, phrasing].filter(Boolean).join(' ');
}

export function buildFinalPrompt(state:StackState){
  const parts:string[] = [];
  parts.push(`${state.meta.bpm} BPM ${state.meta.meter}`);
  const drums = state.layers.filter(l=> ['kick','hat','snare'].includes(l.role));
  if (drums.length){
    parts.push('DRUMS: ' + drums.map(describeDrum).join(', '));
  }
  const bass = state.layers.find(l=> l.role==='bass'); if (bass) parts.push('BASS: '+describeMelodic(bass));
  const chords = state.layers.find(l=> l.role==='chords'); if (chords) parts.push('CHORDS: '+describeMelodic(chords));
  const lead = state.layers.find(l=> l.role==='lead'); if (lead) parts.push('LEAD: '+describeMelodic(lead));
  if (state.meta.swing) parts.push(`GROOVE: swing ${state.meta.swing}%`);
  if ((state.meta as any).fxSummary) parts.push(`FX: ${(state.meta as any).fxSummary}`);
  if ((state.meta as any).mixNotes) parts.push(`MIX: ${(state.meta as any).mixNotes}`);
  if ((state.meta as any).masterNotes) parts.push(`MASTER: ${(state.meta as any).masterNotes}`);
  return parts.join('\n');
}
