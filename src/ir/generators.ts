import { MusicIR, TrackIR, EventPattern } from './schema';

// Utility to map simple roles to sample/synth names for demo purposes
const TIDAL_ROLE_MAP: Record<string,string> = {
  kick: 'bd',
  snare: 'sn',
  hat: 'hh',
  clap: 'cp'
};

function stepsToTidal(steps: string, role: string): string {
  // Convert 'x---x---' to e.g. 'bd*2' or explicit pattern
  const base = TIDAL_ROLE_MAP[role] || role || 'bd';
  // naive grouping: if exactly 16 chars and typical four-on-floor
  if (/^x---x---x---x---$/i.test(steps)) return `sound "${base}*4"`;
  // generic: map x-> sample, - -> ~ (silence)
  const tokens = steps.split('').map(c=> /x/i.test(c)? base : '~').join(' ');
  return `sound "${tokens}"`;
}

function eventsToTidal(ev: EventPattern['events'], role: string): string {
  const base = TIDAL_ROLE_MAP[role] || role;
  // naive: treat each event as triggering sample at relative positions within one cycle
  const maxBeat = Math.max(...ev.map(e=> e.beat), 0) + 1;
  const slots: string[] = [];
  for (let b=0;b<maxBeat;b++) {
    const found = ev.filter(e=> Math.floor(e.beat)===b);
    if (found.length===0) slots.push('~');
    else slots.push(base);
  }
  return `sound "${slots.join(' ')}"`; 
}

function trackToTidal(track: TrackIR): string | null {
  if (!track.pattern) return null;
  if (track.pattern.type==='steps') return stepsToTidal(track.pattern.steps, track.role);
  return eventsToTidal(track.pattern.events, track.role);
}

export function irToTidalCycles(ir: MusicIR): string {
  const lines: string[] = ['-- AUTO-GENERATED FROM IR', `-- BPM: ${ir.meta.bpm}`];
  let idx=1;
  ir.tracks.forEach(t=> {
    const code = trackToTidal(t);
    if (code) {
      lines.push(`d${idx} $ ${code}`);
      idx++;
    }
  });
  if (ir.harmonic?.progression) lines.push(`-- progression: ${ir.harmonic.progression}`);
  return lines.join('\n');
}

// Sonic Pi generation
function stepsToSonicPi(steps: string, role: string): string {
  const sample = roleSampleForSonic(role);
  const stepDur = 0.25; // 16 steps in a 4/4 bar assumption
  const actions: string[] = [];
  steps.split('').forEach((c)=> {
    if (/x/i.test(c)) actions.push(`sample ${sample}`);
    actions.push(`sleep ${stepDur}`);
  });
  return actions.join('\n    ');
}

function roleSampleForSonic(role: string): string {
  switch(role){
    case 'kick': return ':bd_haus';
    case 'snare': return ':sn_dolf';
    case 'hat': return ':drum_cymbal_closed';
    default: return ':perc_snap';
  }
}

function trackToSonic(track: TrackIR): string | null {
  if (!track.pattern) return null;
  if (track.pattern.type==='steps') return stepsToSonicPi(track.pattern.steps, track.role);
  // events: naive mapping each event to sample then sleep 0.5
  const sample = roleSampleForSonic(track.role);
  const code = track.pattern.events.map(e=> `sample ${sample}; # beat ${e.beat}\n    sleep 0.5`).join('\n    ');
  return code;
}

export function irToSonicPi(ir: MusicIR): string {
  const lines: string[] = ["# AUTO-GENERATED FROM IR", `use_bpm ${ir.meta.bpm}`];
  ir.tracks.forEach((t, idx)=> {
    const code = trackToSonic(t);
    if (code) {
  lines.push(`live_loop :trk_${idx+1} do\n    ${code}\n  end`);
    }
  });
  if (ir.harmonic?.progression) lines.push(`# progression: ${ir.harmonic.progression}`);
  return lines.join('\n\n');
}
