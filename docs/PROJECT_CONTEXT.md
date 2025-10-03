# Project Context (Techno Prompt / Composer)

> Generated to allow starting a fresh chat without losing historical knowledge.

## 1. High-Level Purpose
Interactive multi-genre music prompt & live coding environment. Provides pattern-based sequencing (custom DSL + Tone.js Transport hybrid), WebAudio synthesis, genre prompt composition UI ("Composer"), visual/audio analysis, and quick test playground.

## 2. Core Modules
- `src/live/engine.ts`: Custom WebAudio engine. Instruments (kick, snare, hat, bass, lead, pad, guitar, bassGtr, piano, organ, tom, clap, ride). Provides per-instrument play functions, scheduling, sidechain, simple groove.
- `src/live/toneBridge.ts`: Tone.js integration for pattern scheduling, FX spec interpretation, pattern DSL v2 parsing (notes/rests/hold '_' velocity accents !/?), building Tone instruments/effects.
- `src/components/LiveCodingConsole.tsx`: In-browser live coding REPL UI exposing API, DSL help, instruments guide.
- `src/components/wizard/MultiGenrePromptWizard.tsx`: Renamed **Composer**. Multi-genre prompt assembly interface (legacy single-techno + simple mode fully deprecated 2025-10-03).
- `src/components/AudioViz.tsx`: Analyser-driven visualization (spectrum, waveform, peaks, flashes).
- `src/components/TestPlayground.tsx`: Lightweight sandbox (#live-test route) for rapid pattern + viz testing.
- `src/main.tsx`: App shell, routing chooser (hash based), theme toggle integration (dark/light), root layout.
- `render.yaml`: Render deployment config (auto-build expected on push to main).

## 3. Pattern DSL v2
Tokens sequence characters:
- Notes: e.g. `C3`, `F#2`, `Bb4` (case-insensitive)
- Rests: `.` or `-`
- Hold (sustain extension): `_` following a note extends its duration cumulatively
- Velocity accents: `!` (louder ~1.2x), `?` (softer ~0.75x) directly after a note token
Example: `C3_._ G3!?__ .` → C3 long sustain, rest, soft accented G3 then extended, rest.

## 4. FX System
Two layers:
1. Native engine: delay, reverb (procedural impulse), compressor, sidechain pump.
2. Tone.js FX object specs: { type: 'reverb' | 'chorus' | 'distortion' | 'bitcrusher' | 'phaser' | 'filter', ...params }
Chain assembled in `toneBridge` with flexible ordering.

## 5. Visualization & Events
- Analyser exposes frequency/time-domain + level.
- CustomEvent `liveaudio.hit` dispatched on percussive/instrument triggers (used for visual flashes & UI reactions).
- `AudioViz` blends bars, waveform, peak hold, color adapt, transient flash.

## 6. Theme & UI
- Dark glass aesthetic (radial gradients, glass cards, iOS-style bubbles/pills).
- Utility classes: `app-dark-root`, `app-dark-nav`, `panel-dim`.
- Theme toggle: persists in `localStorage` key `app-theme`; attribute `data-theme` on `<html>`.
- Light mode fallback minimal styling (background `bg-slate-100`).

## 7. Recent Major Changes (commit 9af9652)
- Added advanced pattern DSL features (hold `_`, accents `!` `?`).
- Added band instruments (guitar, bassGtr, piano, organ, tom, clap, ride) to engine.
- Introduced AudioViz component + TestPlayground route `#live-test`.
- Deepened dark theme + implemented theme toggle UI in nav.
- Removed obsolete snippet insertion buttons & compact banner from Composer.
- Updated LiveCodingConsole help and README.

## 8. Deployment / CI
- GitHub Actions workflow `.github/workflows/ci.yml`: installs deps, validates taxonomy (`npm run validate:taxonomy`), builds project.
- Render assumed to auto-deploy on push to `main` (has `render.yaml`). No explicit deploy step in CI.

## 9. Known Lint Warnings (not blocking)
- Unused icons/vars in `TechnoPromptGenerator.tsx` & `AudioViz.tsx`.
- Empty block statements in `engine.ts`, `toneBridge.ts`, and minor placeholders.
- Acceptable for now; can be cleaned in a lint hygiene pass.

## 10. Potential Backlog / Next Steps
- UI Palette Refactor: Replaced multi‑color per‑genre gradients with a unified charcoal/grayscale system to increase visual consistency and reduce chromatic noise. Introduced CSS design tokens (gray scale, accent, focus ring) in `index.css`. All genre themes now map to a neutral gradient while functionality (prompt logic, BPM variant adjustments) remains unchanged.
 - Live Coding: Added microphone capture API (`enableMic/disableMic/setMicGain/getMicAnalyser`) with UI toggle + level meter in `LiveCodingConsole`. Mic routes through master saturation → compressor → analyser so external input participates in FX chain.
 - Intent-First Architecture (Phase 1 Scaffold): Added `docs/INTENT_MODEL.md` plus core code modules:
	 - `src/intent/types.ts`: Intent model (moods, useCase, era, intensity, duration) + validation helpers.
	 - `src/intent/recommend.ts`: Heuristic recommender producing top 3 genre candidates (mood → genre hint mapping + useCase/era/intensity bias).
	 - `src/prompt/sectionDsl.ts`: Section DSL (AST types, default draft generator, serialize/parse, role seeding heuristics).
	 - `src/prompt/transforms.ts`: Transform layer (brighten, punch, raise energy, replace, slash command router).
	 - `src/components/QuickComposer.tsx`: New minimal workflow UI (#quick route) – enter intent → pick recommended genre → auto-generate structural draft → refine via slash commands. Copies serialized draft to clipboard.
	 - Navigation updated (`main.tsx`) to include Quick link.
 - Rationale: Reduces multi-step branching of legacy wizard; focuses on minimal expressive input (≈3 fields) delivering a fully structured musical draft (sections + role descriptors) under 90 seconds.
 - Next (Future Phases, not yet implemented): Variation slots, reversible op log for transforms, section editor UI, quality heuristics (descriptor density / low-end balance), live sync back into engine patterns, export to pattern DSL, mic texture injection toggle.
 - Phase 1 Extensions (post-scaffold implemented):
	 - Section Editor (bars/energy inline) in QuickComposer
	 - Variation slots (save & recall serialized draft snapshots)
	 - Undo/Redo stack (serialized snapshots of transforms & manual edits)
	 - Quality heuristic (descriptor density, repetition, low-end adjective scarcity → score 0..100)
	 - Mic texture toggle placeholder (UI state for future engine ambient layer)
	 - Pattern export stub (section → naive KICK/HAT/BASS DSL suggestions inside clipboard export)
	 - Code splitting (lazy load wizard / quick composer / stack wizard) for faster first paint
 - Future (still pending): Live sync of draft → engine patterns; richer transform macros; reversible op metadata; advanced pattern inference; adaptive tempo from intent; mic spectral analysis injection.

### Live Mic Quick Usage
```
// In live coding console code tab
await enableMic(); // request permission & start
setMicGain(1.2);
// Poll analyser
const a = getMicAnalyser(); // { freq:Uint8Array, time:Uint8Array, level:0..~1 }
disableMic(); // to stop & release tracks
```

## 11. Rehydration Prompt (for new chat)
Paste the following into a new session to restore context:
```
Project: Techno Prompt / Composer
Core: WebAudio engine + Tone.js hybrid. Pattern DSL v2 (notes, rests . -, hold '_', accents !/?). Instruments: kick snare hat bass lead pad guitar bassGtr piano organ tom clap ride. FX: native (delay reverb compressor sidechain) + Tone specs (reverb chorus distortion bitcrusher phaser filter). Visualization: analyser events + AudioViz (bars, waveform, peaks, flash). UI: Composer (formerly Wizard), LiveCodingConsole, TestPlayground (#live-test), dark/light theme toggle (localStorage app-theme, data-theme attr). Recent commit 9af9652: band instruments + theme toggle + viz + DSL enhancements + removal of snippet buttons. Deployment: push to main -> CI build -> Render auto-deploy (render.yaml). Outstanding: lint cleanup, system theme listener, MIDI export.
```

---
Generated on: 2025-10-03
