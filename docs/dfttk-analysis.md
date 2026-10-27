# DFTTK 공개 자료 분석과 DELTA LAB 개선 계획

분석일: **2026-10-27 (Asia/Seoul)**. 범위: 전면전(Warfare/Battlefield, DFTTK 식별자 `mp`). 이번 분석의 HTTPS 요청은 인증서 검증을 유지한 소수의 읽기 요청이다. 출처의 구현 코드를 프로젝트에 복사하지 않았다.

## 실제 확인한 공개 리소스

응답 상태·크기·SHA-256은 [관측 기록](observations/dfttk-2026-10-27.json)에 있다. 원본 JS와 전체 총기 팩은 저장소에 포함하지 않는다.

| 리소스 | 직접 확인한 사실 |
| --- | --- |
| `https://dfttk.com/?mode=battlefield` | HTTP 200, 6,626바이트 HTML. 모듈 JS/CSS를 로드하고 `/llms.txt`, `/ai/context.json`을 링크한다. |
| `https://dfttk.com/battlefield/builder` | HTTP 200. 같은 HTML 응답으로 SPA 경로를 제공한다. |
| `https://dfttk.com/static/index-DhB4gmgK.js` | HTML이 명시한 공개 진입 번들. React API 사용과 `/battlefield/builder`, `/ai/calculator` 등의 경로 문자열이 있다. 서버 내부 소스나 원본 저장소를 확인한 것은 아니다. |
| `https://dfttk.com/llms.txt` | 사이트가 브라우저 기반 계산기라고 설명하고 공개 계산 계약·매니페스트를 안내한다. |
| `https://dfttk.com/ai/context.json` | 브라우저 전용 `window.DFTTK_AI` 인터페이스의 매개변수·결과·부분 결과 의미를 문서화한다. **HTTP RPC API가 아니다.** |
| `https://dfttk.com/data/v3/manifest.json` | `schemaVersion=3`, `dataVersion=20261025-ammo-effects.2`, `gameBuildVersion=unknown`, 계산 계약 버전 7. 지원 모드 `sol/mp/bd`. 68개 weapon pack 키는 전체 모드 기준이며 전면전 총기 수로 간주하지 않는다. |
| `https://dfttk.com/data/v3/packs/combat/weapons/18010000001.json` | 공개 계약이 허용한 대표 combat 팩 1개만 조사. `kind=weaponCombatRuntimePack`, 요청한 `weaponId=18010000001`과 일치함을 검사했다. 숫자를 앱 데이터로 가져오지는 않았다. |
| `https://dfttk.com/robots.txt` | HTTP 200, 모든 크롤러에 대한 `Disallow:`가 비어 있음. **재배포 라이선스는 아니다.** |

`build` 및 `sharedBuild` 팩은 내려받거나 공개하지 않았다. 공개 계약이 금지하는 combat 분석 경로를 사용하지 않았다. 원본 자료의 인증·접근 제한을 우회하지 않았다.

## 전달 구조와 계약에서 확인한 동작

- HTML → 버전이 붙은 모듈 JS/CSS → v3 정적 JSON 매니페스트·개별 팩 구조가 존재한다. 이번에 실제 응답을 확인한 범위에서만 말할 수 있으며, 사이트 전체에 동적 백엔드가 없다는 독립적 검증은 하지 않았다.
- 모드는 `mp=전면전`, `sol=비콘 에어리어`, `bd=폭파`로 구분한다. 전면전 계약에서는 탄약 등급·방어구 선택을 사용하지 않는다. 다른 모드 값으로 빈 전면전 값을 채우지 않는다.
- 계약의 `searchWeapons({mode,query,limit})`와 `getCombatData({mode,weaponId})`가 총기 검색·팩 식별에 사용된다. 총기 이름과 소스 고유 ID를 구분한다.
- `getOptions()`의 슬롯에는 `slotPath`, `name`, `equipped`, `defaultItemId`, `options[{itemId,name}]`가 있다. **장착 변경 후 다시 조회**해야 하며 `selection.rejected/displaced` 및 `unavailableParts.reason`을 확인하도록 문서화돼 있다. 고정된 6개 슬롯이나 단순 전체 파츠 목록을 실제 구조로 추정하면 안 된다.
- `tuneControls`는 현재 부품별 `tuneId`, 범위(`min/max/default/step`), 값 등을 제공하는 계약이다. 정밀 보정은 기본 부착물 효과와 별개다.
- 대표 combat 응답에서 `weapon.fireControl`, `ammunition`, `timings`, `sway`, `attributes`, 모드별 `combat.attackerProfiles`, `damageProfiles`, `parts`, `effectsByItemId`, `tunes`, `attributeRules`, `curves`의 구조를 직접 확인했다. 단순 4개 막대 증감만으로 이를 재현할 수 없다.
- `calculate`와 `compare`는 사이트 계산 API의 계약이며, 공식 게임 서버 계산식으로 검증됐다는 뜻이 아니다. `partial`의 평균은 완료된 처치 확률에 대한 조건부 평균이므로 확정 순위에 섞으면 안 된다. `null`은 0이 아니다.
- 공유 URL, 사용자 정의 총기의 브라우저 localStorage 및 compare의 Web Worker 사용은 **공개 계약의 설명**으로 확인했다. 실제 저장·공유·장착·해제 UI의 왕복 동작은 직접 실행해 확인하지 않았다.

## 이번에 확인하지 못한 것

사이트 직접 브라우저 상호작용은 환경 프록시 인증서를 Chromium이 신뢰하지 않아 검증하지 못했다. 브라우저 신뢰 저장소 변경은 자동 승인 검토가 영구적인 신뢰 범위 확대를 이유로 거부했다. 변경을 강행하거나 TLS 검증을 해제하지 않았다. 대신 검증된 HTTPS로 문서와 허용된 공개 리소스를 읽었다.

전면전 전체 부품 목록, 모든 총기별 슬롯·기본 장착 부품, 모든 부품의 호환·충돌·종속 조건, 보정 범위, 게임 빌드 버전, 게임 내 실제 계산식은 검증되지 않았다. 2026-10-23의 기존 관측 자료가 현재 사이트와 동일하다고 재확인하지 않았다.

## 권리와 재사용

AI 계약은 명시된 공개 인터페이스의 사용 안내다. 열람 가능한 파일이나 robots 허용을 데이터·코드의 포괄적인 복제/재배포 허락으로 취급하지 않는다. 이번에 확인한 리소스에서는 대량 데이터 재배포 라이선스를 확인하지 못했다. 따라서 자동 수집기·상시 연동·대량 데이터 복제는 구현하지 않는다. 이후 제공자에게 사용 범위와 출처 표기 조건을 확인한 뒤 별도 수집 작업을 설계한다.

## 기존 프로젝트와의 차이

| 영역 | 기존 상태 | 이번 개선 방향 |
| --- | --- | --- |
| 가상 데이터 | 별도 `sample.json`, 3종/13부품, 0~100 가상 합산 | 별도 엔진·화면 유지, 전면전 모델에 혼입 금지 |
| 전면전 자료 | 66개 이름, 기본 수치 2종, DFTTK 손잡이 9개, AKM 예시 16개 | 원본 JSON 유지, 정규화 어댑터·참조 검증 추가 |
| 출처 | 날짜·링크와 `gameVerified:false` | `verified/observed/unknown/sample`, 게임/자료 버전·실제 ID 여부 구분 |
| 호환성 | 총기별 관측 목록과 슬롯 검사만 존재 | 총기/슬롯·명시 충돌·종속·관측 조합을 검사하고 근거 없는 조합은 `unknown`으로 차단 |
| 계산 | 기본값+알려진 4개 막대 변화, 미확인 전파 | 참고 계산 전용 엔진과 부품별 기여도. 검증된 게임 공식 엔진은 미구현으로 유지 |
| 추천 | 없음 | 자체 가중치 인터페이스·준비 상태 검사. 현재 자료로 미검증 조합을 추천하지 않음 |
| UI | 검색·필터·단일 부품 선택·기본 정보·코드 표시 | 선택 요약·개별 제거·호환 근거·자료 상태·추천 보류 이유 표시 |

기존 빌드와 단위 테스트 18개는 변경 전에 통과했다. 기존 저장·공유 기능은 공개 예시 코드 복사 수준이며, DELTA LAB의 현재 선택으로 게임 코드를 생성하는 기능은 아니다.

## 우선순위

1. 이번 범위: 분석 기록, 정규 타입·검증기, 보수적인 호환성 검사, 참고 계산 분리, 기존 UI 유지 및 추천 기반.
2. 자료 확보: 모드·버전·라이선스를 확인한 총기/슬롯/기본 부품/의존/충돌 목록, 기본 효과와 정밀 보정 원자료.
3. 계산 검증: 동일 총기·부품·게임 버전의 전후 관측 및 게임 내 확인 자료. 확인 전에는 참고값만 제공.
4. 추천 확장: 검증된 조합·완전한 슬롯 목록과 수치가 확보된 뒤 탐색·상위 3개 구현. 자체 점수와 공식 게임 성능을 구분.
