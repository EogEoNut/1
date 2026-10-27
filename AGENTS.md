# 개발 안내

- 한국어로 작업 결과와 중요한 의사결정을 설명한다.
- 기존 코드·README·package.json을 먼저 확인하고, 작동 중인 기능을 보존한다.
- 이 프로젝트는 React + TypeScript + Vite + Tailwind CSS 기반 정적 웹앱이다. 게임 데이터는 `src/data/`, 계산 로직은 `src/lib/`, 화면은 `src/components/`로 분리한다.
- 가상 샘플과 전면전 출처 자료를 분리한다. 출처 자료는 `warfare_seed.json`, `dfttk_grips.json`에 있으며 사이트 관측과 게임 내 검증을 구분한다. 검증하지 않은 슬롯·수치·호환 규칙·계산식을 사실로 표시하지 않는다. 원문에 없는 값을 만들거나, 접속 시도일을 자료 확인일로 갱신하거나, 미확인 수치를 0으로 대체하지 않는다.
- 비밀키나 게임 공식 이미지를 추가하지 않는다. 외부 API·계정·서버는 현재 MVP에 필요하지 않다.
- 변경에 맞춰 `npm run build`, `npm test`를 실행한다. 주요 UI 변경은 `npm run build` 후 `npm run test:e2e`로 확인한다. 실행하지 못한 검증은 분명히 보고한다.
- Playwright는 이 환경의 `/usr/bin/chromium`을 자동 사용한다. 브라우저 다운로드를 필수 단계로 추가하지 않는다.
- 향후 저장 기능은 데이터 버전과 잘못된 localStorage 값 처리부터 설계한다. 추천 로직은 화면과 분리하고 호환성 검사를 재사용한다.
