# Dev Log (2025-10-03)

## 변경 요약
- Wizard 단순화: Advanced/Classic 토글 제거, 단일 Beginner 시퀀스 적용
  - 순서: Genre → Sub Genres → Tempo → Drum(Kick→Hat→Snare) → Instruments → Final
  - Style/Drum Extras/Instrument Variants/Roles/FX/Mix 단계 프론트엔드 비표시
- Beginner 네비게이션 버그 수정
  - 장르 선택 시 Beginner에서 스타일 단계로 잘못 진입하던 문제 제거 (직접 Sub Genres로 이동)
- Sub Genres 추천 기능
  - `GENRE_RELATED` 도입: 메인 장르 연관 추천 먼저 표시, "Show All"로 전체 토글
- Funk 계층화
  - 루트 카테고리 `Funk / Groove` 추가: `funk`, `funkdisco`, `funkfusion`, `funkrock`
  - All 뷰에서는 파생(funkdisco, funkfusion, funkrock) 숨기고 대표 `Funk`만 노출
  - Funk 탭에서는 파생 모두 노출
- 품질 검증
  - taxonomy validate, typecheck, lint 통과 후 커밋/푸시 완료

## 파일 포인트
- `src/components/wizard/MultiGenrePromptWizard.tsx`
  - SIMPLE_SEQ_STEPS로 단일 시퀀스 구성
  - `GenrePrimaryStep`에서 Funk 파생 숨김 (All), Funk 탭에서만 노출
  - `GenreSubsStep`에 추천/전체 토글
- `src/data/multigenre/genres/index.ts`
  - Funk 파생 팩 로드(`funk`, `funkdisco`, `funkfusion`, `funkrock`)

## 사용 흐름
1. Genre 선택 (카테고리 탭 제공, Funk는 상/하위 관계 반영)
2. Sub Genres: 추천 목록 확인 후 필요 시 Show All
3. Tempo 설정 후 Drum 3 스텝 → Instruments → Final 요약

## 커밋 레퍼런스
- fix(wizard): skip style step in beginner mode to prevent blank screen
- feat(wizard): related sub-genre recommendations with toggle in seq.genreSubs
- refactor(wizard): add funk root category and collapse funk derivatives in All view
