# Multi-Genre Music Prompt Composer

다장르 음악 프롬프트/패턴 아이디어 생성기 (React + TypeScript + Vite + Tailwind + Framer Motion). 초기 "Legacy Techno" 단일 뷰 및 Simple Mode 는 통합/확장된 Quick & Progressive Composer 로 대체되어 제거되었습니다.

## 기능
- 카테고리(서브장르, 리듬, 베이스, 신스, FX 등)별 다중 선택
- Hover 시 세부 파라미터(서브옵션) 패널 표시 (예: 909 킥 Decay 변형)
- 정확 BPM 입력 (60–200)
- 로컬스토리지 프리셋 저장 / 불러오기 / 삭제
- 프리셋 Export(JSON) / Import 지원
- 실시간 프리뷰 & Copy
- 검색(Search) 즉시 필터링
- KR / EN 간단 UI 토글 (그룹명 번역)
- 드럼/베이스/신스 세분화: family / primary 개념으로 기본만 보이게 Collapse 후 Expand 토글
- 선택된 옵션 우선 정렬 (selected-first)
- Advanced Toggle: 핵심 그룹만 먼저 노출 → 전체 확장
- Glassmorphism + 네온 사이버(Apple 감성 믹스) 스타일 적용
 - Compact Mode: 그룹을 작은 그리드 칩으로 나열하고 Hover 시 패널(옵션 목록) 오버레이
	 - 화면 폭 < 1280 자동 활성화
	 - 검색(query) 중에는 정보량 확보 위해 자동 비활성화

## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
기본:
```bash
npm run dev
```
Fast 개발(일부 장르만 로드: 초기 빌드/핫리프레시 가속):
```bash
npm run dev:fast   # 내부적으로 VITE_LIMIT_GENRES=techno,hiphop,trap
```
Codespaces / 컨테이너 (고정 포트 & 외부 접속 안정):
```bash
npm run dev:strict   # 0.0.0.0:5173 고정, 포트 이미 사용시 즉시 실패
```
Codespaces 전용(동일 동작):
```bash
npm run dev:codespaces
```
출력 예시:
```
Local:   http://localhost:5173/
Network: http://10.x.x.x:5173/
```
GitHub Codespaces 에서는 브라우저 주소가 다음 형태로 노출됩니다:
```
https://<workspace>-5173.app.github.dev/
```

#### 502 (Bad Gateway) 오류 대처
| 증상 | 원인 | 해결 |
|------|------|------|
| 502 Bad Gateway | dev 서버 내려감 / 포트 미리스닝 | `npm run dev:strict` 재실행 |
| 403 / 404 | 포트 Private | Ports 패널에서 Public 설정 |
| 빈 화면 | 캐시 잔존 | 강력 새로고침 (Ctrl+Shift+R) |
| hash 직행 안 됨 | `#g=` 오타 | 예: `#g=techno+trance` 소문자 확인 |

헬스 모니터 (선택):
```bash
npm run health:loop
```

### 3. 프로덕션 빌드
```bash
npm run build
npm run preview
```

### 4. Taxonomy Validator
중복 ID / 그룹 누락 / orphan subopts / universal prefix 검사:
```bash
npm run validate:taxonomy
```

### 5. Pre-commit Hook (자동 품질 게이트)
`husky` 설치되어 커밋 시 순서대로 실행:
1) validate:taxonomy
2) typecheck (tsc --noEmit)
3) lint (ESLint)

실패 시 커밋 중단.

### 6. VS Code Tasks
명령 팔레트 → Tasks: Run Task
 - Dev (Full)
 - Dev (Fast Genres)
 - Validate + Dev
 - Local CI (validate+typecheck+build)

### 7. CI
GitHub Actions: push/PR 시 validate → build. (추후 lint/typecheck 추가 가능)

## 기술 스택
- React 18
- TypeScript 5
- Vite 5
- Tailwind CSS 3
- Framer Motion

## 폴더 구조 (요약)
```
src/
	main.tsx            # 진입점 / 해시 라우팅 (quick, composer, live-test 등)
	components/
		QuickComposer.tsx             # 의도(무드/강도/유스케이스) → 구조 Draft → 변형/품질/프롬프트
		portal/GenrePortal.tsx        # 장르 선택 + Arranger + ProgressiveComposer 통합
		wizard/MultiGenrePromptWizard.tsx # 기존 Composer (다장르 마법사)
		ProgressiveComposer.tsx (portal 내부 통합) # 단계별 토큰 선택 프롬프트
		LiveCodingConsole.tsx         # 라이브 코딩 / 패턴 DSL / 엔진 제어
		AudioViz.tsx                  # 실시간 분석 시각화
	prompt/  intent/  live/  data/  progressive/  ...
```

## 구조적 설계 포인트
- Schema-first: `src/data/taxonomy.ts`에 모든 GROUP/OPTIONS/SUBOPTS 정의 → UI는 순수 표현 레이어
- family / primary: 많은 Drum/Bass/Synth 세부 옵션을 첫 화면에서 과도하게 보여주지 않도록 핵심(primary) 또는 선택된 항목만 노출 → Expand 시 전체 표시
- SUBOPTS → PARAMS_LOOKUP 자동 매핑
- 직렬화: 선택 상태는 Set 기반 → 저장 시 배열 변환

## 개선 예정 아이디어
- 옵션 전체 한글 번역 (현재 그룹명 위주)
- 패밀리별 Collapse 상태 저장 (로컬)
- 모바일 Drag 스크롤 최적화
- AI 모델 호출 연동 (OpenAI / Local)
- 다중 프롬프트 배치 생성 모드
- Export 시 미니메타(BPM, 날짜) 포함
- 장르 팩 Lazy Load (dynamic import)
- Validator 경고 레벨 세분화(JSON 리포트)

## Live Coding & Audio Engine (Phase1 → 확장)
Phase1: 완전 커스텀 WebAudio 합성 엔진 및 콘솔 (기본 패턴/합성) → 이후 Tone.js 하이브리드 + 고급 Visualization + Pattern DSL v2 + FX 커스터마이징으로 확장.
- 지원 음색: kick / snare / hat / bass / lead / pad (+ band extensions: guitar, bassGtr, piano, organ, tom, clap, ride)
- 패턴: 16 스텝 반복, 문자 기반 velocity (`X` accent, `x` normal, `.` ghost, `-` rest)
- FX: 딜레이, 리버브(프로시저럴 임펄스), 마스터 컴프레서, 글로벌 사이드체인 duck (킥 트리거)
- Swing 퍼센트 적용 (짝수 16분 지연)
- Patch Registry: `registerPatch`, `triggerPatch`, `listPatches`
- 실시간 파라미터 갱신: `update(id, { gain, pattern, decay ... })`
- Sandbox 보안 강화: 허용 API 화이트리스트 & `with` 제거

### Phase2 (계획)
- 샘플 로더 (간단 1‑shot + 경량 캐싱)
- 개별 버스 사이드체인 (sidechain group tagging)
- Supersaw / Noise Layer 확장 (unison detune, 초저역 EQ trim)
- 필터/피치 Env & LFO 매트릭스 확장 (다중 LFO 라우팅)
- 패턴 변형 유틸 (humanize, rotate, density 스케일)

### Tone.js 하이브리드 통합
Phase1.5 로 Tone.js 를 선택적(poly / FM / Metal 등) 음색 재생에 도입.
- 커스텀 엔진: 초경량 패턴 드럼 & 베이스 (낮은 오버헤드)
- Tone.js: 고수준 Synth/FMSynth/AMSynth/MetalSynth/NoiseSynth 등 즉시 호출
- Lazy Load: 최초 `tonePlay()` 호출 시 import → 번들 초기 용량 최소화
- Sandbox API: `tonePlay(id, { type, notes, duration, velocity })`, `toneStop(id)`, `toneStopAll()`, `listTone()`
- 향후 연동: Tone Transport ↔ 커스텀 스케줄러 BPM 동기 (현재는 단발 트리거 중심)

#### 확장 (Phase1.5 + v2)
- FX 체인 옵션(문자열 + 커스터마이징 객체)
- BPM 동기: `setToneBPM(128)` → `tonePatternPlay` Transport 기반 스텝
- Pattern DSL v1 → v2 업그레이드 (아래 ‘Pattern DSL v2’ 참고)
- 자동 메모리 청소: 45s 이상 미사용 Tone 인스턴스 dispose
- Transport 기반 재생: 지터 감소 및 홀드/악센트 문법 지원

### Pattern DSL v2 (Transport 기반)
문자열로 시퀀스를 정의하고 Tone.Transport 스케줄로 반복:
- 노트 토큰: `C4`, `D#3`, `G2` (대소문자 무관)
- 휴지: `.` 또는 `-`
- 홀드: `_` 직전 노트 길이 +1 스텝 (연속으로 누적 가능, 예: `C4__` = 3스텝)
- 벨로시티 악센트: `!` (×1.2), `?` (×0.75) 노트 직후에 배치
- 기본 스텝: 16분 (옵션 `step:'16n'`)

예시:
```js
setToneBPM(128)
tonePatternPlay('arp1', 'C4_E4.G4!_B4.-C5?', { type:'synth', velocity:0.85, fx:[{ type:'reverb', decay:3 }] })
```

### FX 커스터마이징 (문자열 vs 객체)
`tonePlay` / `tonePatternPlay` 의 `fx` 필드:
- 문자열: 공유 캐시 FX (메모리 절약) – 예: `['reverb','delay']`
- 객체: 개별 인스턴스 (파라미터 커스터마이즈)

지원 타입 및 대표 파라미터:
- `reverb`: `decay`, `wet`
- `delay`: `time`, `feedback`, `wet`
- `distortion`: `amount` (`distortion` alias)
- `chorus`: `frequency`, `delayTime`, `depth`
- 추가: `bitcrusher (bits)`, `phaser (frequency, octaves, baseFrequency)`, `filter (frequency, type)`

예시:
```js
tonePlay('pad', {
	type:'synth',
	notes:['C3','E3','G3','B3'],
	duration:'2n',
	fx:[
		{ type:'reverb', decay:4.2, wet:0.4 },
		{ type:'delay', time:'8n', feedback:0.32, wet:0.28 }
	]
})
```

### Analyser API & 이벤트
엔진 post-FX 지점의 `AnalyserNode` 스냅샷:
```js
getAnalyser() // => { freq:Uint8Array, time:Uint8Array, level:number }
```
그리고 각 히트는 다음 커스텀 이벤트 디스패치:
```js
window.addEventListener('liveaudio.hit', e => {
	// e.detail = { role, id, velocity, index, when }
})
```

### Advanced Visualization
`AudioViz` 컴포넌트:
- 주파수 바 (adaptive hue: 저역→고역) + 피크 홀드 라인
- 시간 파형 오버레이 (lighter blend)
- 히트 이벤트 플래시 (감쇠 기반 alpha)
- 30fps 제한 / 메모리 재사용 (Zero GC per-frame)

### iOS26 스타일 UI & 아이콘
CSS 토큰 + conic gradient ring 기반의 `.ios-bubble`, `.ios-pill` 제공. 
아이콘 세트(`src/components/icons/Icons.tsx`) – `IconPlay`, `IconPause`, `IconTheme`, `IconDocs` 등 currentColor 활용 경량 SVG.

### Auto Theme
`prefers-color-scheme` 감지하여 다크/라이트 자동 선택 + 수동 토글 지원 (`data-theme` + root class `dark`).

### iOS26 스타일 UI 레이어
커스텀 glass + chroma ring:
- 새 클래스: `.ios-bubble` (라운드 컨트롤), `.ios-pill` (확장형), `.ios-cluster`
- Conic gradient ring + radial sheen + blur/saturate 조합
- CSS 토큰: `--ios-ring`, `--ios-sheen`, `--ios-glass-bg`
- 헤더 액션 버튼 및 Copy 버튼 반영

### Lightweight Audio Visualization
기본 컨셉은 유지되며 위 ‘Advanced Visualization’ 섹션으로 기능 확장됨.

### Phase3 (계획)
- 멀티샘플 매핑 (velocity layer / round robin)
- AI 패턴/프로그레션 생성 (프롬프트 → seed 변형)
- Patch Morphing (두 패치 연속 보간)
- 오디오 Export (오프라인 렌더링 or MediaRecorder)

문서화 진행 상황: `LiveCoding` 콘솔 Help 탭에 최신 API 반영.

## 공유 가능한 장르 해시
직접 장르/하이브리드 진입:
```
# 단일
https://<host>/#g=techno
# 하이브리드
https://<host>/#g=techno+trance
```
변경 시 해시 자동 갱신.

Legacy Techno 단일 전용 뷰와 Simple Mode 는 2025-10-03 기준 제거되었습니다. Quick / Portal Arranger / Progressive Composer 경로를 사용하세요.
2) (추가 예정) `#g=techno&mode=legacy` 방식 지원 가능

## Render 배포 가이드

### 1) Static Site (권장)
Vite 빌드 산출물은 정적 자원이므로 SSR 불필요합니다. 이미 `render.yaml` 추가됨.

배포 단계:
1. GitHub 저장소 연결 → New Static Site
2. Root Directory: `/` (프로젝트 루트)
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Deploy 클릭

자동 라우팅(해시 기반)이라 SPA history rewrite 는 필수는 아니지만 fallback 포함(`render.yaml`의 rewrite) 되어 있음.

### 2) Web Service (선택)
프리뷰용 Node 서버(예: `npm run preview`)를 Render Web Service 로 올릴 수도 있으나 정적 버전 대비 비용/콜드스타트 비효율.

Docker 필요 시:
```
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback
RUN printf 'try_files $uri /index.html;\n' > /etc/nginx/conf.d/default.conf
```

### 3) 환경 변수/버전
현재 .env 필요 없음. Node 18+ 호환 (`engines` 필드 지정).

### 4) 캐시/최적화 팁
- Render Static Site 는 빌드 산출물 정적 캐시 → 변경 시 자동 purge
- 장기 캐시 적용하려면 `vite.config`에서 `build.rollupOptions.output.assetFileNames` 패턴 유지 (해시 포함 기본값이면 OK)

### 5) 배포 후 테스트 링크
`https://<your-render-domain>/#g=techno+trance`


## License
MIT (필요 시 수정 가능)

## Stack Composer (Layer-by-Layer Prompt Flow)
드럼 → 베이스 → 코드 → 리드 → FX → Groove → Mix → Master → Review 순서로 프로덕션 워크플로를 모사하는 단계형 프롬프트 빌더.

### 핵심 개념
- Reducer 상태: `layers[]` (각 레이어: role, descriptors[], pattern) + `meta` (bpm, swing, fx/mix/master 요약)
- Draft 편집: 특정 role 시작 → descriptors & pattern 편집 → Commit 시 `layers`에 확정
- 패턴 입력: 현재는 텍스트 기반 (차후 16-step grid / velocity UI 예정)
- 실시간 미리듣기: 레이어 커밋 시 `liveEngine.play(id,{ pattern, type:role })` 자동 업데이트
- Swing / FX / Mix / Master 슬라이더 & 노트는 최종 Prompt에 요약 라인으로 삽입

### Prompt 예시 (요약)
```
128 BPM 4/4
DRUMS: punchy busy, tight sparse, snappy sparse
BASS: growl legato
CHORDS: lush legato
LEAD: bright staccato
GROOVE: swing 12%
FX: subtle long-tail shimmer, tight slapback lead
MIX: tight low-end, airy highs
MASTER: transparent glue, gentle high shelf
```

### 향후 확장
- Pattern grid + accent/hold 비주얼 에디터
- Layer compare & mute/solo
- Export: JSON (state) + Plain Prompt + 패턴 개별 블록
- Diff view (최근 스냅샷 vs 현재)

## 자동 배포 (GitHub → Render)
메인 브랜치에 push 시 GitHub Actions 가 build 검증 후 Render Static Site 가 변경 감지하여 재빌드합니다.

### 파이프라인 개요
1. `push` → GitHub Actions: taxonomy validate + build
2. 성공 시 Render Webhook(연결 시) 또는 Render 가 Repo 변경 polling → deploy
3. `render.yaml` 로 build/publish 경로 (`dist`) 설정

수동 트리거가 필요 없으므로 관리 부담 최소화. 추가로 lint/typecheck 를 Actions 워크플로에 확장할 수 있습니다.
