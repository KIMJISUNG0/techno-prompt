# Techno Prompt Generator

프롬프트 조합형 Techno 음악 아이디어 생성기 (React + TypeScript + Vite + Tailwind + Framer Motion).

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

## 기술 스택
- React 18
- TypeScript 5
- Vite 5
- Tailwind CSS 3
- Framer Motion

## 폴더 구조
```
src/
	main.tsx                # 진입점
	index.css               # Tailwind import
	components/
		TechnoPromptGenerator.tsx
tailwind.config.js
postcss.config.js
tsconfig.json
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

## 공유 가능한 장르 해시
직접 장르/하이브리드 진입:
```
# 단일
https://<host>/#g=techno
# 하이브리드
https://<host>/#g=techno+trance
```
변경 시 해시 자동 갱신.

Legacy Techno 뷰는 현재:
1) 기본 포털 → Techno 선택 → Navbar "Legacy Techno" 클릭
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
