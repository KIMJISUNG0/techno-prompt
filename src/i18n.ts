// Simple i18n helper (KO + fallback EN)
type Dict = Record<string,string|((p:Record<string,any>)=>string)>;

const ko:Dict = {
  'wizard.title': '멀티 장르 프롬프트 컴포저',
  'wizard.hybrid': '하이브리드',
  'wizard.selectGenre': '장르 선택',
  'wizard.tempoMeter': '템포 / 박자',
  'wizard.recommendedBpm': '{genre} 추천 {low}–{high} BPM',
  'wizard.swingNone': '없음',
  'wizard.schemaMode': '스키마 모드',
  'wizard.instrumentMode': '악기 모드',
  'wizard.compactOn': '컴팩트 ON',
  'wizard.compactOff': '컴팩트 OFF',
  'wizard.includeMelody': '멜로디 요약 포함',
  'wizard.genrePrimary': '주 장르',
  'wizard.addSubGenres': '보조 장르 추가 (선택)',
  'wizard.select': '{label} 선택',
  'wizard.extraPerc': '추가 퍼커션',
  'wizard.drumSummary': '드럼 요약',
  'wizard.finalSummary': '최종 요약',
  'wizard.fxTags': 'FX 태그',
  'wizard.mixTags': '믹스 태그',
  'wizard.build': '빌드',
  'wizard.adjustTempo': '템포 조정',
  'wizard.genreProgressions': '장르 코드 진행',
  'buttons.startOver': '처음으로',
  'buttons.prev': '이전',
  'buttons.back': '뒤로',
  'buttons.continue': '계속',
  'buttons.restart': '재시작',
  'buttons.copy': '복사',
  'buttons.copyContinue': '복사 후 계속',
  'mode.sequential': '순차 모드',
  'mode.classic': '클래식 모드',
  'labels.swing': '스윙 %',
  'labels.meter': '박자',
  'labels.custom': '직접 입력',
};

let currentLocale = 'en';
export function setLocale(loc:string){ currentLocale = loc.startsWith('ko')?'ko':'en'; }
export function detectLocale(){ try { const nav = (navigator as any)?.language || (navigator as any)?.languages?.[0]; if (nav) setLocale(nav); } catch { /* noop */ } }
detectLocale();

function format(str:string, params?:Record<string,any>){ if(!params) return str; return str.replace(/\{(\w+)\}/g,(_,k)=> params[k] ?? '{'+k+'}'); }

export function t(key:string, params?:Record<string,any>):string {
  const dict = currentLocale==='ko'? ko : {};
  const val = dict[key];
  if (!val) return format(key, params);
  if (typeof val === 'function') return (val as any)(params||{});
  return format(val, params);
}

export function isKorean(){ return currentLocale==='ko'; }
