import React from 'react';

// Minimal iOS-like line icons (stroke-based) tuned for current glass UI.
// Each icon uses currentColor for stroke/fill so parent can set text color.
// Size prop controls both width/height.

export interface IconProps { size?: number; className?: string; strokeWidth?: number; }

function svgProps({ size=18, className='', strokeWidth=1.7 }:IconProps){
  return { width:size, height:size, strokeWidth, className:"inline-block "+className, stroke:'currentColor', fill:'none', strokeLinecap:'round', strokeLinejoin:'round' } as const;
}

export const IconPlay:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M7 5 L19 12 L7 19 Z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconPause:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M8 5 L11 5 L11 19 L8 19 Z M13 5 L16 5 L16 19 L13 19 Z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconStop:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <rect x={7} y={7} width={10} height={10} rx={2} fill="currentColor" stroke="none" />
  </svg>
);
export const IconSun:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={4} />
    <path d="M12 2 V4 M12 20 V22 M4 12 H2 M22 12 H20 M5 5 L6.5 6.5 M17.5 17.5 L19 19 M5 19 L6.5 17.5 M17.5 6.5 L19 5" />
  </svg>
);
export const IconMoon:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M15 2.5 A9.5 9.5 0 0 0 12 21.5 A9 9 0 0 1 15 2.5 Z" />
  </svg>
);
export const IconCode:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M8 8 L4 12 L8 16 M16 8 L20 12 L16 16 M11 6 L13 18" />
  </svg>
);
export const IconMusic:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M9 18 A2.5 2.5 0 1 0 9 22 A2.5 2.5 0 1 0 9 18 Z M17 15 A2.5 2.5 0 1 0 17 19 A2.5 2.5 0 1 0 17 15 Z" fill="none" />
    <path d="M9 18 V6 L19 4 V15" />
  </svg>
);
export const IconLightning:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M13 2 L5 14 H12 L11 22 L19 10 H12 Z" />
  </svg>
);
export const IconWave:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M2 12 C4 8 6 16 8 12 C10 8 12 16 14 12 C16 8 18 16 20 12 C21 10.5 22 10 22 10" />
  </svg>
);
export const IconClose:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M5 5 L19 19 M19 5 L5 19" />
  </svg>
);

export const IconInfo:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={10} />
    <path d="M12 8 L12 8 M11 11 L12 11 L12 16" />
  </svg>
);

export const IconChevronDown:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M5 9 L12 16 L19 9" />
  </svg>
);

export const IconChevronRight:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M9 5 L16 12 L9 19" />
  </svg>
);

export const IconGitHub:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M12 2 C6.5 2 2 6.6 2 12.2 C2 16.9 5.2 20.9 9.5 22 C10 22 10 21.7 10 21.4 L10 19.8 C7.3 20.5 6.8 18.6 6.8 18.6 C6.4 17.5 5.8 17.2 5.8 17.2 C4.9 16.6 5.9 16.6 5.9 16.6 C6.9 16.7 7.5 17.6 7.5 17.6 C8.4 19.1 9.9 18.6 10.5 18.3 C10.6 17.6 10.9 17.1 11.2 16.9 C8.9 16.6 6.5 15.7 6.5 11.7 C6.5 10.5 6.9 9.5 7.6 8.7 C7.5 8.4 7.1 7.3 7.7 5.8 C7.7 5.8 8.6 5.6 10 6.7 C10.9 6.4 11.9 6.3 12.9 6.3 C13.9 6.3 14.9 6.4 15.8 6.7 C17.2 5.6 18.1 5.8 18.1 5.8 C18.7 7.3 18.3 8.4 18.2 8.7 C18.9 9.5 19.3 10.5 19.3 11.7 C19.3 15.7 16.9 16.6 14.6 16.9 C15 17.2 15.3 17.7 15.3 18.5 L15.3 21.5 C15.3 21.8 15.3 22.1 15.8 22 C20.1 20.9 23.3 16.9 23.3 12.2 C23.3 6.6 18.8 2 13.3 2 Z" />
  </svg>
);

export const IconSparkle:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M12 3 L13.5 9.5 L20 11 L13.5 12.5 L12 19 L10.5 12.5 L4 11 L10.5 9.5 Z" />
  </svg>
);

export const IconBPM:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M4 13 L8 9 L12 13 L16 9 L20 13" />
    <path d="M6 17 L18 17" />
  </svg>
);

export const IconPattern:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <rect x={4} y={5} width={4} height={4} rx={1} />
    <rect x={10} y={5} width={4} height={4} rx={1} />
    <rect x={16} y={5} width={4} height={4} rx={1} />
    <rect x={4} y={13} width={4} height={4} rx={1} />
    <rect x={10} y={13} width={4} height={4} rx={1} />
    <rect x={16} y={13} width={4} height={4} rx={1} />
  </svg>
);

export const IconTheme:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M4 12 A8 8 0 0 0 20 12 A8 8 0 0 1 4 12 Z" />
    <path d="M12 4 A8 8 0 0 1 12 20" />
  </svg>
);

export const IconCPU:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <rect x={7} y={7} width={10} height={10} rx={2} />
    <path d="M4 10 H2 M4 14 H2 M10 4 V2 M14 4 V2 M20 10 H22 M20 14 H22 M10 20 V22 M14 20 V22" />
  </svg>
);

export const IconLayers:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M12 3 L3 8 L12 13 L21 8 Z" />
    <path d="M5 12 L12 16 L19 12" />
    <path d="M7 16 L12 19 L17 16" />
  </svg>
);

export const IconDocs:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M6 3 H14 L19 8 V21 H6 Z" />
    <path d="M14 3 V8 H19" />
    <path d="M9 12 H16 M9 16 H16" />
  </svg>
);

export const IconAnalyzer:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M4 18 V10 M8 18 V6 M12 18 V14 M16 18 V4 M20 18 V12" />
  </svg>
);

export const IconWaveform:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M3 12 C5 4 7 20 9 12 C11 4 13 20 15 12 C17 4 19 20 21 12" />
  </svg>
);

export const IconEnergy:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={3} />
    <path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5 5 L7 7 M17 17 L19 19 M17 7 L19 5 M5 19 L7 17" />
  </svg>
);

export const IconRefresh:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <path d="M21 12 A9 9 0 1 1 12 3 A9 9 0 0 1 20 8" />
    <path d="M21 4 V8 H17" />
  </svg>
);

export const IconSearch:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <circle cx={11} cy={11} r={6} />
    <path d="M18 18 L22 22" />
  </svg>
);

export const IconSettings:React.FC<IconProps> = (p)=> (
  <svg {...svgProps(p)} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={3} />
    <path d="M4 12 H6 M18 12 H20 M12 4 V6 M12 18 V20 M6.8 6.8 L8.2 8.2 M15.8 15.8 L17.2 17.2 M6.8 17.2 L8.2 15.8 M15.8 8.2 L17.2 6.8" />
  </svg>
);

export default {
  IconPlay, IconPause, IconStop, IconSun, IconMoon, IconCode, IconMusic, IconLightning, IconWave, IconClose,
  IconInfo, IconChevronDown, IconChevronRight, IconGitHub, IconSparkle, IconBPM, IconPattern, IconTheme,
  IconCPU, IconLayers, IconDocs, IconAnalyzer, IconWaveform, IconEnergy, IconRefresh, IconSearch, IconSettings
};
