# 작업 진행 기록

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
