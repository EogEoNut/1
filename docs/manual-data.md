# 나중에 직접 자료와 이미지 넣기

아직 앱 내 데이터 편집 화면은 없다. 자료나 이미지 파일을 Codex에 전달하면 아래 파일에 반영할 수 있다. 지금은 새 게임 수치를 임의로 만들지 않으며, 삭제한 외부 자료를 자동 복원하지 않는다.

## 이미지

현재 작업대는 독자 제작 총기 종류 참고 도식을 표시한다. 실물/게임 모델과 다를 수 있으며 통계 자료와 무관하다.

직접 사용할 이미지 파일은 `public/images/`에 두고 `src/data/weapon-images.json`에 아래처럼 등록한다. 아래 예시는 형식 설명이며 해당 사진 파일이 현재 들어 있는 것은 아니다.

```json
{
  "warfare:M4A1": {
    "src": "images/m4a1.webp",
    "alt": "직접 등록한 M4A1 이미지",
    "credit": "직접 제공한 이미지"
  }
}
```

- 키는 신규 총기 레코드의 `id`와 정확히 같아야 한다. 위 ID는 등록 형식 예시이며 해당 총기 자료가 현재 등록된 것은 아니다.
- `src`는 `images/`로 시작하는 로컬 경로다. 외부 사이트 핫링크는 사용하지 않는다.
- `alt`는 이미지 설명, `credit`는 선택적인 출처 표시다.
- 이미지가 없거나 로딩에 실패하면 참고 도식 또는 이미지 미등록 표시를 사용한다.
- 정적 웹 배포는 `public/images/`도 포함한다. 사용자 이미지를 등록한 뒤 단일 HTML을 별도로 배포할 때는 해당 `images/` 폴더도 함께 제공해야 한다.

## 총기·부착물 데이터

자료를 제공할 때는 다음을 함께 정리하면 된다.

- 총기 이름, 전면전 모드 여부, 게임 버전
- 기본 능력치 항목과 단위, 기본 장착 부품
- 부착물 이름, 장착 슬롯, 실제로 확인한 호환 총기
- 부착물 기본 효과와 정밀 보정 효과의 구분
- 충돌·필수 선행 부품 조건과 이를 확인한 근거
- 출처 또는 직접 확인한 스크린샷, 확인 날짜, 게임 내 검증 여부

기본 게임 자료는 `src/data/warfare_namuwiki.json`, 샘플은 `src/data/sample.json`에 분리되어 있다. 정규 모델은 `src/types/warfare.ts`, 로딩은 `src/lib/warfare-data.ts`에서 관리한다. 신규 사용자 자료는 출처와 검증 상태를 구분해 이 모델에 연결한다. 이미지 등록만으로 게임 능력치나 호환성이 확인되는 것은 아니다.

미확인은 0이 아닌 `null`을 사용한다. 자료를 파일에 입력했다는 이유만으로 `verified`가 되는 것은 아니며, 실제 게임 검증 근거·버전·날짜가 필요하다. 자료를 반영한 뒤 빌드·단위 테스트·브라우저 동작을 다시 확인한다.

## 기본 총기 신규 파일 형식

`warfare_namuwiki.json`은 `schemaVersion: 1`, `dataset: "warfare"`, `mode: "Warfare"`, `source`, `weapons`로 구성된다. 현재 원문 접근이 차단되어 `weapons`는 빈 배열이며 어떤 총기도 수집 완료로 표시하지 않는다. `source.attemptedAt`은 접근 시도일, `source.observedAt`은 실제 원문 확인일이다. 자료 확인 전에는 후자를 null로 유지한다. 라이선스/출처 조건도 실제 확인 후 갱신한다.

총기 레코드는 `WarfareWeapon` 모델 그대로 추가한다. `name`은 표시 이름, `nameKo`·`nameEn`은 확인한 언어별 이름(미확인 null), `category`는 `assault_rifle`, `battle_rifle`, `smg`, `lmg`, `marksman`, `sniper`, `shotgun`, `pistol` 등의 정규 분류다. 확인되지 않은 번역이나 총기를 만들지 않는다. `fireModes`는 확인된 사격 모드 배열 또는 null이다.

`base`는 통째로 미확인이면 null, 일부 수치가 있으면 다음 키를 **모두** 넣고 개별 미확인은 null로 둔다:

- `control`, `handling`, `stability`, `accuracy`: 원문 게임 표시값
- `damage`: 명확한 기본 몸통 피해량. 부위별 배율과 혼동되면 null
- `range_m`: 최적 사거리(m), `rpm`: 발사 속도(발/분), `capacity`: 기본 장탄수(발)
- `muzzle_velocity_mps`: 총구 초속(m/s)
- `ads_ms`, `sprint_to_fire_ms`, `ads_move_mps`: 기존 모델과의 호환용. 원문에 없으면 null

기본 수치를 넣으면 `baseEvidence`에도 별도 출처를 기록한다. `evidence`에는 `status: "observed"`, `sourceUrl`, `observedAt`, `sourceName`, `kind: "site-base"`(기본값) 또는 `"site-listed"`(이름), `gameVersion`(미확인 null), `dataVersion`(미확인 null), `gameVerified: false`, `verifiedAt: null`을 사용한다. 실제로 확인한 기록만 observed로 등록한다.

부착물 수집 전에는 `sourceId: null`, `slots: []`, `parts: []`, `codes: []`, `calibrations: []`, `observedCombinations: []`, `compatibilityRules: []`, `coverage: { "slotsComplete": false, "compatibilityComplete": false }`를 둔다. 이름/수치 출처와 부착물 근거를 혼합하지 않는다. 코드 편집이 어려우면 문서/표를 대화에 전달해 Codex가 형식에 맞춰 추가하게 할 수 있다.
