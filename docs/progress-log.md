# 작업 진행 기록

## 2026-07-19 · 비원형 크리티컬 연출과 슈퍼 확률 소급

### 요청

- 원형으로 퍼지는 일반·슈퍼 크리티컬 이펙트를 더 강하고 게임다운 연출로 교체
- 슈퍼 크리티컬에 `콰광` 같은 고품질 폭발음 적용
- 슈퍼 크리티컬 확률을 레벨마다 +0.025%p 올리고 현재 강화 레벨에 소급

### 구현

- 일반 크리티컬의 원형 코어·이중 링을 제거하고 교차 참격광, 6갈래 번개 균열, 각진 쿠키 파편으로 교체했다.
- 슈퍼 크리티컬의 3색 링·방사 원형 구성을 제거하고 수직 낙뢰, X자·수평 다색 참격과 잔상, 10갈래 번개, 16개 파편 폭발, 쿠키 무대 흔들림으로 교체했다.
- 공통 섬광·참격은 `AngularImpactPrimitives`, 번개·파편은 `AngularBurstParticles`로 분리하고 개수·크기·색상·키프레임은 `cookie-feedback.json`에서 관리한다. 애니메이션은 native driver를 사용한다.
- Mixkit `Heavy electric shockwave impact`를 내려받아 기존 시네마틱 충격 110ms 뒤에 겹쳤다. 원본 URL, 라이선스, 6.69초 인코딩 정보와 SHA-256을 기록했다.
- 두 크리티컬 확률 눈금을 100,000단위로 높였다. 일반 확률은 동일하게 유지하고 슈퍼는 Lv.1 0.1%에서 레벨당 정확히 +0.025%p가 되도록 명시·무한 레벨 테이블을 함께 변경했다.
- 저장된 강화 레벨로 현재 확률을 계산하므로 기존 진행도는 별도 저장 이전 없이 자동 소급된다. Lv.20 회귀 테스트는 0.575%를 확인한다.

### 검증

- `npm run typecheck`: 통과
- Jest 14개 스위트, 239개 테스트: 통과
- Android release `assembleRelease`: 성공, Metro 1,114개 모듈·228개 에셋 번들
- APK: `artifacts/cookie-wars-v1.0.15.apk`, 103,682,798바이트
- SHA-256: `40b98260942e0f2bc9f3361a6875b106f901ae44f09fa0ef5a7fe119c9acbfe1`
- APK 매니페스트: `com.cookiewars.game`, versionCode 16, versionName 1.0.15, minSdk 24, targetSdk 36
- POCO F6(`24069PC21G`)에 `adb install -r`로 설치해 최초 설치 시각과 저장 데이터를 유지했다.
- 설치 버전과 실행 프로세스를 확인했고 첫 실행 로그에서 치명적 Android·React Native 오류가 없었다.

### 후속 확인

- 실제 발동 시 참격·낙뢰의 크기와 `콰광` 음량 체감은 사용자 플레이 피드백에 따라 `cookie-feedback.json` 값만 조정한다.

## 2026-07-19 · 슈퍼 크리티컬, 자동 전투, 클릭 입력 개선

### 요청

- 기본 0.1%·100배의 쿠키 슈퍼 크리티컬과 전용 고품질 연출·사운드
- 성 자동 공격과 승리 후 다음 스테이지 연속 진행을 제공하는 저장형 자동 전투 모드
- 빠른 연속 터치와 손가락 이동에도 잘 반응하는 메인 쿠키 입력

### 구현

- 슈퍼 크리티컬을 일반 크리티컬보다 먼저 판정하는 배타적 단일 난수 구간으로 추가하고, 확률 10% 상한 뒤에도 배수가 계속 성장하는 무한 강화를 추가했다.
- 수치·가격·확률·사운드·시각 효과는 `cookie-super-critical.json`, `cookie-upgrades.json`, `cookie-upgrade-rules.json`, `cookie-feedback.json`으로 분리했다.
- Mixkit의 `Movie trailer epic impact`와 `Choir magic shine`을 전용 MP3로 번들하고 출처·라이선스·SHA-256을 기록했다.
- 슈퍼 전용 섬광·3색 링·방사 광선·별빛 컴포넌트와 전체/축약 피드백 정책을 추가했다.
- `battle-auto.json`과 저장 상태 `autoBattleEnabled`를 추가했다. 자동 모드는 전투 시작, 기존 엔진 명령을 통한 성 자동 공격, 승리 보상 확정 뒤 다음 스테이지 진행을 수행한다. 패배와 최종 난이도 마지막 전투는 자동 연결하지 않는다.
- `cookie-input.json`의 hit slop·이동 허용 범위·중복 제거 시간을 사용해 터치 시작 즉시 보상하고 같은 제스처의 후속 `onPress`를 제거했다. 접근성의 `onPress` 전용 입력은 유지했다.
- 저장 스키마를 v11, 앱을 1.0.14(15)로 올리고 이전 저장은 슈퍼 크리티컬 Lv.1·자동 전투 OFF로 안전하게 복구한다.
- 메인 화면 피드백 렌더링을 `CookieGainFeedback`로 분리해 `GameScreen`을 178줄로 유지했다.

### 검증

- `npm run typecheck`: 통과
- Jest 14개 스위트, 238개 테스트: 통과
- `npx expo-doctor`: 20/20 통과
- Android release `assembleRelease`: 성공
- APK: `artifacts/cookie-wars-v1.0.14.apk`, 103,463,202바이트
- SHA-256: `613aecab4795de59ad16ff316aeb2591491ead2cc25277eef104d90b8fef12b5`
- APK 매니페스트: `com.cookiewars.game`, versionCode 15, versionName 1.0.14, minSdk 24, 세로 고정 확인

### 실기기 설치와 후속 확인

- 2026-07-19 POCO F6(`24069PC21G`)에 `adb install -r`로 APK를 덮어쓰기 설치해 기존 앱 데이터와 최초 설치 시각을 유지했다.
- 설치된 패키지는 `com.cookiewars.game`, versionCode 15, versionName 1.0.14로 확인했다.
- 앱 실행 뒤 `MainActivity`가 전면 상태이고 프로세스가 유지되며, 첫 실행 로그에 치명적 예외가 없음을 확인했다.
- 실제 터치 감도, 슈퍼 크리티컬의 음량·진동·시각 연출, 장시간 자동 전투의 체감은 사용자 플레이로 추가 확인한다.
