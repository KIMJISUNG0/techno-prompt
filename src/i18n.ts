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
  'wizard.instrumentFamilies': '악기 패밀리 선택',
  'wizard.selectedCount': '{n}개 선택됨',
  'wizard.drums': '드럼',
  'wizard.drum.kick': '킥',
  'wizard.drum.hat': '하이햇',
  'wizard.drum.snare': '스네어',
  'wizard.drum.extras': '추가',
  'wizard.view.compact': '컴팩트 보기',
  'wizard.view.expanded': '확장 보기',
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
  // Instrument categories
  'inst.piano': '피아노',
  'inst.piano.desc': '어쿠스틱/그랜드/업라이트 계열의 명료한 어택과 자연스러운 감쇠',
  'inst.synth': '신스 리드',
  'inst.synth.desc': '모노/폴리 신스 톤: 소우, 스퀘어, 레조웨이브 기반 주선율',
  'inst.pad': '패드',
  'inst.pad.desc': '서스테인과 공간감을 가진 레이어형 배경 질감',
  'inst.pluck': '플럭',
  'inst.pluck.desc': '짧은 어택/여운의 디지털 혹은 하이브리드 핑거/피킹 질감',
  'inst.bass': '베이스',
  'inst.bass.desc': '저역 중심: 서브, 아날로그, 펀치 혹은 그루브형',
  'inst.guitar': '기타',
  'inst.guitar.desc': '일렉/어쿠/클린/리드/레이어용 스트럼 혹은 리프',
  'inst.strings': '스트링',
  'inst.strings.desc': '바이올린/첼로/앙상블의 레가토 혹은 스파이카토',
  'inst.brass': '브라스',
  'inst.brass.desc': '호른/트럼펫/섹션의 포화도 높은 어택',
  'inst.woodwind': '목관',
  'inst.woodwind.desc': '플루트/클라리넷/오보에 등 유기적 호흡 질감',
  'inst.vocal': '보컬/보이싱',
  'inst.vocal.desc': '리드/코러스/쇼트/보컬 처프 및 코러스 패드',
  'inst.fx': '사운드 FX',
  'inst.fx.desc': '임팩트, 라이저, 다운리프터, 텍스처 노이즈',
  'inst.arp': '아르페지오',
  'inst.arp.desc': '시퀀싱된 패턴형 리듬 하모닉 필',
  'inst.percpitch': '멜로딕 퍼커션',
  'inst.percpitch.desc': '벨, 말렛, 칼림바 등 음정있는 타격성 악기',
  'inst.organ': '오르간',
  'inst.organ.desc': '톤휠/파이프/신스 오르간의 지속음 하모닉',
  'inst.world': '월드/민속',
  'inst.world.desc': '에스닉/전통 악기 계열 (시타르, 케나 등)',
  'inst.chip': '칩튠',
  'inst.chip.desc': '레트로 8비트 파형 및 제한된 레지스터 톤',
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
