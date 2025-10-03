# Roadmap (Q4 2025)

## 우선순위 A (즉시)
- [ ] Sub Genres 하이브리드 자동 포함
  - 파생 장르 선택 시 메인 장르 자동 포함 (중복 방지 및 하이브리드 기본화)
- [ ] Funk 계열 BPM preset 세분화
  - funk / funkrock / funkdisco / funkfusion 각각 기본 BPM 범위 보정
- [ ] 장르 카드 툴팁
  - 상/하위 관계 툴팁 및 연관 장르 빠른 안내

## 우선순위 B (다음)
- [ ] 연관 추천 가중치
  - 최근 선택/사용 빈도 기반 정렬(간단 메모리 또는 localStorage)
- [ ] 스타일 변형 연동
  - styleVariant 선택 시 Sub Genres 추천 동적 재필터
- [ ] Final 요약 텍스트 품질 향상
  - 간결 템플릿 외 1-2개 선택형 템플릿 추가, Suno 친화 영어 고정

## 우선순위 C (후속)
- [ ] Composer와 Wizard 통합 라우팅
  - 홈에서 Wizard로 자연 전환, 탭 유지
- [ ] ESLint ESM 경고 제거
  - package.json에 "type": "module" 검토 (빌드 영향 확인 후 적용)
- [ ] 테스트 보강
  - 최소 유닛: 추천 필터, 단계 이동 가드, Funk 계층 표시 로직
