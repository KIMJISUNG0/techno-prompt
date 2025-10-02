import { getLiveAPI } from './engine';

// Registers a patch 'techno140' that sets up a 140 BPM techno groove.
// Usage (in the live coding console or sandbox):
//   const api = getLiveAPI(); api.triggerPatch('techno140');

export function registerTechno140(){
  const api:any = getLiveAPI();
  api.registerPatch('techno140', () => {
    api.setBPM(140);
    api.resetPerf?.();
    // Clear old
    api.stopAll();

    // Kick: four-on-the-floor with a small ghost before beat 4
    api.play('kick', {
      type:'kick', pattern:'X---X---X---X--.', gain:0.95
    });

    // Bass: rolling off-beat pattern (C2 G1 A#1) with HQ supersaw bass
    api.play('bass', {
      type:'bass', pattern:'-x-x-x-x-x-x-x-x', notes:[36,31,34], wave:'supersaw', detune:14, gain:0.42, sidechain:true,
      env:{ attack:0.005, decay:0.28, sustain:0.35, release:0.18 }
    });

    // Open hat (off-beats)
    api.play('hat', { type:'hat', pattern:'-x-x-x-x-x-x-x-x', gain:0.28 });

    // Closed hat 16th shuffle (light)
    api.play('chhat', { type:'hat', pattern:'x.x.x.x.x.x.x.x.', gain:0.18 });

    // Clap on 2 & 4
    api.play('clap', { type:'clap', pattern:'----X-------X---', gain:0.7 });

    // Perc loop subtle
    api.play('perc', { type:'perc', pattern:'--x-----x-------', gain:0.25 });

    // Pad chord (Gmin → F → Eb → F), supersaw pad
    // MIDI: Gmin triad (55,58,62) F(53,57,60) Eb(51,55,58)
    api.play('pad', {
      type:'pad', pattern:'X---------------', notes:[55,58,62, 53,57,60, 51,55,58, 53,57,60], wave:'supersaw', unison:7, detune:18, gain:0.38,
      env:{ attack:0.6, decay:1.2, sustain:0.7, release:2.5 }, sidechain:true, reverb:{ mix:0.3 }
    });

    // Lead motif (simple call & response) using HQ saw
    api.play('lead', {
      type:'lead', pattern:'x---x---x-------', notes:[72,74,77, 72,74,79], wave:'saw', gain:0.32,
      env:{ attack:0.01, decay:0.22, sustain:0.5, release:0.25 }, delay:{ mix:0.18, time:0.3, feedback:0.34 }, sidechain:false
    });

    api.log('techno140 patch started. Perf stats will accumulate.');
  });
}

// Auto-register on import
registerTechno140();