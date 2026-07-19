# 전투 성능 설계와 점검

## 현재 구조

- 전투 시뮬레이션 타이머는 `battle-rules.json`의 50ms 주기로 실행하며 각 콜백에서 측정한 실제 경과 시간을 `0~maxDeltaMs(100)`로 제한합니다. X1·X2·X3은 같은 콜백에서 이 경과 시간의 순수 단계를 각각 1·2·3회 실행해 이동·쿨타임·충돌·피해를 실제로 가속합니다. 중간 단계에서 승패가 나면 나머지 단계를 생략합니다.
- 화면에는 보스 한 마리와 종류별 쿠키봇 최대 다섯 개만 그립니다. 같은 종류 봇의 수량은 이름의 `×수량`과 한 발의 합산 피해로 표현하므로 봇을 수십 대 구매해도 View 수가 늘지 않습니다.
- 적 원반은 동시에 한 개로 제한합니다. 아군 원반은 비행을 마치면 즉시 배열에서 제거합니다.
- `BattleBotFormation`, `BattleEnemyLayer`, `CookieCastle`, 보스·봇 프레임, 원반·쿠키 이미지를 메모이제이션하고 프레임 파일은 정적 `require`로 조회합니다. 한 개체는 현재 단계의 이미지 한 장만 렌더하며 같은 종류의 봇 수량만큼 View를 복제하지 않습니다.
- `BattleScreen`은 레이어 조정자이고 수명주기·표시 계산·입력·HUD·준비·결과는 `src/screens/battle`, 체력 바·피격 연출·발사체·보스·봇은 `src/components/battle`로 분리했습니다. 표현 변경이 엔진 판정에 번지지 않습니다.
- 같은 틱의 모든 전투 사건은 `pendingEvents`에 손실 없이 보존해 효과음 콜백에 정확히 한 번 전달합니다. 화면 이력은 최근 32개로 제한하고 그중 최신 피격 사건 하나만 `presentationEvent`로 표시합니다. 다섯 번의 섬광은 각각 여섯 개 파편으로 제한하고 넓은 충격파는 성 수동 원반과 거대 원반에만 사용하므로 전달 정확성과 View 상한을 분리했습니다.
- 보스 망치 강공격의 지면 균열·타원 충격파 SVG와 전장 플래시는 공격 사거리 진입 후 5초 주기의 `special` 공격 한 발에서만 생성되고 520ms 뒤 제거됩니다. 보스별 망치 준비·충돌·복귀는 별도 WebP 프레임을 교체하며 일반 원거리·근접 공격에는 이 강한 프레임을 재생하지 않습니다. 예상 적 원반 비행시간과 900ms 준비 구간에는 공격 채널을 예약하고, 주기가 끝나면 일반 공격 쿨다운보다 `special`을 우선할 뿐 발사체 수 상한이나 전투 틱 수를 늘리지 않습니다.
- 전투 음악과 효과음은 로컬 OGG를 미리 연결한 플레이어에서 재생합니다. 자동 연사 효과음은 `battle-audio.json`의 그룹별 최소 간격으로 제한합니다.
- `useBattleKeepAwake`는 `active` 전투에서 네이티브 Wake Lock 하나만 유지하고 승패·준비·화면 이탈 시 해제합니다. 화면 밝기나 전투 틱을 주기적으로 갱신하는 방식이 아니므로 렌더 비용을 추가하지 않습니다.
- 80종 쿠키 도감은 `FlatList` 가상화를 사용해 화면 주변 카드만 마운트합니다. 쿠키 종류를 더 추가해도 모든 투명 WebP를 화면 진입과 동시에 디코드하지 않습니다.
- 네 희귀 효과는 외부 CC0 60/64프레임 원본을 종류별 animated WebP 한 개로 묶어 Android Fresco에서 네이티브 재생합니다. 해당 희귀 보상 때만 종류별 최대 하나씩 마운트되고 같은 종류가 다시 나오면 교체되며 프레임별 React 상태·JS interval을 만들지 않습니다. 서로 다른 종류가 겹칠 때 WebP 디코더는 최대 네 개이므로 빠른 연타 시 메모리·발열은 실기기에서 계속 관찰합니다.

## 현재 성능 경계와 확장 위험

현재 전투는 보스 한 마리, 종류별로 합산한 봇 최대 다섯 개, 적 원반 최대 한 개를 전제로 하므로 화면 개체 수가 작고 예측 가능합니다. 45개 난이도 행은 30개 전장·정적 보스와 보스 180프레임, 봇 30프레임을 정적 `require`로 공유하며 Black Sun은 기본 15개를 재대결로 사용합니다. 한 순간에는 선택 보스의 현재 프레임 한 장과 활성 봇 종류별 현재 프레임 한 장만 렌더합니다. 난이도 행 증가는 APK 이미지 용량이나 틱당 전투 개체 수를 늘리지 않습니다.

이 평가는 현재 단일 보스 범위에 한정됩니다. X3은 같은 시간 안에 X1의 세 배만큼 순수 전투 단계를 실행하므로 전투 엔진 CPU 비용도 단계 수에 따라 증가합니다. 다수 적, 상태 효과, 동시 원반을 추가하면 각 단계의 배열 `map`·`filter`·`find`와 새 객체 생성도 개체 수에 따라 늘어납니다. 현재 `advanceBattle`은 이동·충돌·봇 발사·보스 공격·결과 판정의 순수 단계로 분리되어 있으므로, 다수 개체 기능을 시작하기 전에 적·발사체 상한을 정하고 X3 조건까지 포함한 동일 기기 측정으로 필요한 단계만 최적화합니다.

1.0.25 APK 빌드·설치 확인은 장시간 성능 측정으로 해석하지 않습니다. 아래 1.0.6 수치가 현재 비교 가능한 실기기 전투 기준선이며, 1.0.25의 장시간 프레임·메모리 결과는 같은 조건으로 별도 측정하기 전까지 추정하지 않습니다.

## 회귀 점검

코드 변경 뒤 아래 순서로 검사합니다.

```bash
npm run verify
npm run android:release
adb -s <기기ID> install -r artifacts/cookie-wars-v1.0.25.apk
adb -s <기기ID> shell dumpsys gfxinfo com.cookiewars.game reset
# 실제 전투를 진행한 뒤
adb -s <기기ID> shell dumpsys gfxinfo com.cookiewars.game
adb -s <기기ID> shell dumpsys meminfo com.cookiewars.game
```

`gfxinfo`에서는 전체·느린 프레임과 50/90/95/99 백분위 렌더 시간을 확인합니다. 한 번의 수치는 기기 온도, 백그라운드 앱, 전투 시간에 영향을 받으므로 절대 보장값으로 사용하지 않고 같은 기기의 이전 APK와 비교합니다. 보스·봇·원반 종류를 추가할 때는 개별 구매 수량만큼 React View를 생성하지 않는 원칙을 유지합니다.

## 실제 기기 확인 대상

- 기기: USB 연결 Xiaomi `24069PC21G`
- 패키지: `com.cookiewars.game`
- 화면: 세로 고정

최종 APK 설치 뒤 전투 진입, X1·X2·X3 속도 전환, 보스 실제 걷기, `special`에서만 나오는 망치 준비·충돌·복귀, 봇 실제 순찰·투척, 성 수동 원반, 다중 피격 이펙트, 결과 화면에서 음악 정지를 순서대로 확인합니다. 기기가 잠겨 있으면 설치·프로세스·로그까지만 확인하고 화면이나 전투 성능을 확인한 것으로 기록하지 않습니다.

### 1.0.25 빌드·설치 확인

2026-07-19 `versionCode 26`, `versionName 1.0.25` 릴리스 APK를 빌드했습니다. 결과는 139,174,192바이트(132.73MiB)이고 SHA-256은 `7f83bd413555ca4168c51ecfbedd303b1b449bc8d770ac6f1045d4e9a53b51b3`입니다. 패키지 `com.cookiewars.game`, API 24~36, 세로 고정, arm64-v8a·armeabi-v7a·x86·x86_64, APK v2 서명을 확인했으며 Metro는 1,305개 모듈과 390개 에셋을 번들했습니다.

Xiaomi `24069PC21G`에 `adb install -r`로 1.0.24(25) 위에 덮어 설치해 최초 설치 시각 `2026-07-18 11:59:12`와 앱 데이터를 유지했습니다. 형광 색보정 최종 APK를 같은 1.0.25(26)로 다시 덮어 설치한 콜드 실행은 `Status: ok`, `LaunchState: COLD`, `TotalTime: 286ms`였고 `MainActivity`가 top resumed 상태였습니다. 기기 `base.apk`와 배포 APK의 SHA-256이 일치하고, 1220×2712 세로 메인 화면의 저장 복구를 확인했으며 최근 로그에 AndroidRuntime·React Native·Fresco 치명 오류나 ANR은 없었습니다. 외부 VFX는 최종 WebP의 전체 프레임 접촉 시트·중앙 오프셋 설정·정적 번들·네이티브 디코더 의존성을 확인했고, 낮은 확률을 강제 발동해 사용자 천장 카운터를 바꾸지는 않았습니다.

### 1.0.24 빌드·설치 확인

2026-07-19 `versionCode 25`, `versionName 1.0.24` 릴리스 APK를 빌드했습니다. 결과는 130,153,704바이트이고 SHA-256은 `d77b8a52aa0698b2458ab33ea1a4752b531d87417e5118ebe6ff8deff5e6e995`입니다. 패키지 `com.cookiewars.game`, API 24~36, 세로 고정, arm64-v8a·armeabi-v7a·x86·x86_64, APK v2 서명을 확인했으며 Metro는 1,302개 모듈과 386개 에셋을 번들했습니다.

Xiaomi `24069PC21G`에 `adb install -r`로 1.0.23(24) 위에 덮어 설치해 최초 설치 시각 `2026-07-18 11:59:12`와 앱 데이터를 유지했습니다. 최종 APK 콜드 실행은 `Status: ok`, `LaunchState: COLD`, `TotalTime: 337ms`였고 `MainActivity`가 top resumed 상태였습니다. 메인 화면의 축약 수치와 5개 하단 메뉴, `대결`의 A·B 순차 클릭 설정 화면을 1220×2712 실기기에서 확인했으며 최근 로그에 AndroidRuntime·React Native·Fresco 치명 오류나 ANR은 없었습니다. 이 확인은 설치·첫 화면·미니게임 진입 점검이며 장시간 전투 FPS 측정은 아닙니다.

### 1.0.21 빌드·설치 확인

2026-07-19 `versionCode 22`, `versionName 1.0.21` 릴리스 APK를 빌드했습니다. 결과는 127,178,685바이트이고 SHA-256은 `2494cd92afdb458008c616f0c277ebd9e737c9475e2c5edd1e3e80ccfca35302`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36, arm64-v8a·armeabi-v7a·x86·x86_64와 APK v2 서명을 확인했고 Metro는 1,312개 모듈과 397개 에셋을 번들했습니다.

Xiaomi `24069PC21G`에 `adb install -r`로 1.0.20(21) 위에 덮어 설치해 최초 설치 시각 `2026-07-18 11:59:12`와 앱 데이터를 유지했습니다. 설치 후 기기 패키지는 1.0.21(22), 마지막 갱신 시각은 `2026-07-19 19:27:50`입니다. 강제 종료 뒤 콜드 실행은 `Status: ok`, `LaunchState: COLD`, `TotalTime: 298ms`였고 `MainActivity`가 top resumed 상태였습니다. 최근 로그에서 AndroidRuntime·React Native 치명 오류와 ANR은 없었습니다. 메인 화면의 한 줄 쿠키 이름, 진행 막대, 확대 쿠키, 하단 훈장·능력·희귀 아이콘을 1220×2712 실기기 화면에서 확인했습니다. 이 점검은 설치·첫 화면 확인이며 장시간 전투 FPS 측정은 아닙니다.

### 1.0.19 설치·실행 확인

2026-07-19 `versionCode 20`, `versionName 1.0.19` 릴리스 APK를 빌드했습니다. 결과는 127,037,830바이트이고 SHA-256은 `762d4aabf7260e109bba42b4a3eea35df91283107d18cd9cc789d0e41431d3c3`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36, 세로 고정, APK v2 서명과 `WAKE_LOCK` 권한을 확인했습니다. Metro는 1,322개 모듈과 410개 에셋을 번들했습니다.

Xiaomi `24069PC21G`에 `adb install -r`로 1.0.18(19) 위에 덮어 설치해 최초 설치 시각 `2026-07-18 11:59:12`와 앱 데이터를 유지했습니다. 기기 패키지는 1.0.19(20), 콜드 실행은 `Status: ok`, `LaunchState: COLD`, `TotalTime: 370ms`, 실행 PID는 7064였습니다. 기기에서 진화 Lv.397 저장이 신규 52단계 태양 사자 쿠키를 즉시 선택하고 다음 53단계 달토끼 Lv.399를 표시하는 것을 확인했습니다. 로비의 `mHoldScreenWindow=null`로 전투 외 화면에서 절전 방지가 해제된 것도 확인했습니다. 설치된 `base.apk`의 SHA-256은 배포 APK와 일치했고 최근 로그에 치명적 AndroidRuntime·React Native 오류나 ANR은 없었습니다. 실제 active 전투의 장시간 절전·FPS 검증은 사용자 진행을 변경하지 않는 별도 플레이 세션 대상으로 남깁니다.

### 1.0.18 설치·실행 확인

2026-07-19 `versionCode 19`, `versionName 1.0.18` 릴리스 APK를 빌드했습니다. 결과는 124,083,218바이트이고 SHA-256은 `63a4a6fce243e9b541c5cf1a47fbdfea9cf39d19061375b0b594bc96a3240685`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36과 세로 고정을 확인했습니다. Metro는 1,259개 모듈과 353개 에셋을 번들했습니다. 전장·정적 보스가 각각 30개, 보스 애니메이션이 180프레임으로 늘었지만 런타임 전투 개체 수와 틱당 판정량은 그대로입니다.

Xiaomi `24069PC21G`에 `adb install -r`로 1.0.16(17) 위에 덮어 설치해 데이터 경로와 최초 설치 시각 `2026-07-18 11:59:12`를 유지했습니다. 기기 패키지는 1.0.18(19), 실행 PID는 20028, `MainActivity`는 top resumed로 확인했습니다. 콜드 실행은 `Status: ok`, `LaunchState: COLD`, `TotalTime: 296ms`였고 1220×2712 세로 화면에서 기존 300스테이지·훈장이 유지된 채 `blood moon easy`가 16번째 난이도로 해금·선택된 것을 확인했습니다. 최근 로그에서 치명적 AndroidRuntime·React Native JS 오류나 ANR은 발견되지 않았습니다. 이번 확인은 설치·저장 이전·첫 화면 점검이며 장시간 전투 성능 측정은 아닙니다.

### 1.0.17 빌드 확인

2026-07-19 `versionCode 18`, `versionName 1.0.17` 릴리스 APK를 빌드했습니다. 결과는 104,495,465바이트이고 SHA-256은 `4109b0fce20f984422af1db57e8a87c794c793375ec3d34d040a2a36f550ff0b`입니다. Metro는 1,136개 모듈과 233개 에셋을 번들했습니다. 네 천장 카운터는 클릭당 정수 비교·덧셈만 하는 O(1)이며 보상과 같은 리듀서 전이에서 저장하므로 별도 렌더를 만들지 않습니다. 서로 다른 특수 효과는 최대 4종까지 함께 마운트하지만 각 종류는 하나로 제한하고 모든 진행 애니메이션은 native driver를 사용합니다. 가장 큰 슈퍼 연출도 수명이 1,800ms로 제한되며 같은 종류가 재발동하면 교체됩니다.

`adb devices -l`에 연결 기기가 없어 1.0.17을 설치·실행했다고 기록하지 않습니다. 최종 신규 난이도 APK를 만들 때 다시 연결을 확인합니다.

### 1.0.16 설치·실행 확인

2026-07-19 `versionCode 17`, `versionName 1.0.16` 릴리스 APK를 빌드했습니다. 결과는 104,160,344바이트이고 SHA-256은 `657b958ead8efb17a4a0b027d905345ce0d2c6bb2648830ff4d6b78055e5670b`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36을 확인했고 Metro는 1,127개 모듈과 233개 에셋을 번들했습니다. 조각 등장·타이머·부스러기와 네 종류 강한 효과는 제한된 View 개수와 native-driver 진행값을 사용하며, 강한 획득 효과는 한 번에 하나만 마운트됩니다.

POCO F6(`24069PC21G`)에 `adb install -r`로 1.0.15(16) 위에 덮어 설치해 데이터 경로와 최초 설치 시각 `2026-07-18 11:59:12`를 유지했습니다. 설치 패키지는 1.0.16(17), 실행 PID는 8046, `MainActivity`는 top resumed로 확인했습니다. 콜드 실행은 `Status: ok`, `LaunchState: COLD`, `TotalTime: 279ms`였고 1220×2712 세로 메인 화면에서 새 조각 확률·배수 안내를 확인했습니다. 첫 실행 로그에서 치명적 AndroidRuntime·React Native JS 오류나 ANR은 발견되지 않았습니다. 희귀 조각·크리티컬을 자동 입력으로 강제하면 사용자 저장을 변경하므로 실제 음량과 획득 연출 체감은 사용자 플레이 확인 대상으로 남겼습니다.

### 1.0.15 설치·실행 확인

2026-07-19 `versionCode 16`, `versionName 1.0.15` 릴리스 APK를 빌드했습니다. 결과는 103,682,798바이트이고 SHA-256은 `40b98260942e0f2bc9f3361a6875b106f901ae44f09fa0ef5a7fe119c9acbfe1`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36을 확인했고 Metro는 1,114개 모듈과 228개 에셋을 번들했습니다. 새 크리티컬은 제한된 View 개수와 native-driver 진행값을 사용하며 프레임마다 React 상태를 갱신하지 않습니다.

POCO F6(`24069PC21G`)에 `adb install -r`로 덮어 설치해 기존 데이터 경로와 최초 설치 시각 `2026-07-18 11:59:12`를 유지했습니다. 기기 패키지는 1.0.15(16), 프로세스 PID는 18055로 확인했고 첫 실행 로그에서 치명적 AndroidRuntime·React Native JS 오류는 발견되지 않았습니다. 자동 입력으로 희귀 크리티컬을 강제로 발생시키면 사용자 쿠키 저장을 변경하므로 수행하지 않았으며, 실제 참격·낙뢰·폭발음 체감은 사용자 플레이 확인 대상으로 남겼습니다.

### 1.0.13 설치·실행 확인

2026-07-18 `versionCode 14`, `versionName 1.0.13` 릴리스 APK를 빌드했습니다. 결과는 103,158,090바이트이고 SHA-256은 `651b1b0bc873524257616223d8bfb73ed80c501b43472752707159f2b7459968`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36, 세로 고정과 APK v2 서명을 확인했습니다. Metro는 1,100개 모듈과 226개 에셋을 번들했으며, 생성 리소스에는 쿠키 WebP 50개·쿠키 PNG 0개·신규 쿠키 피드백 MP3 3개가 있습니다.

Xiaomi `24069PC21G`에 `adb install -r`로 덮어 설치했습니다. 1.0.12(13)에서 1.0.13(14)로 바뀌었고 데이터 경로 `/data/user/0/com.cookiewars.game`와 최초 설치 시각 `2026-07-18 11:59:12`가 유지됐습니다. 기기 내부 `base.apk`의 SHA-256도 배포본과 일치합니다. 강제 종료 뒤 실행은 `Status: ok`, `LaunchState: COLD`, `TotalTime: 321ms`였고 세로 메인 쿠키 화면이 정상 렌더됐습니다. 일반 쿠키를 한 번 눌러 새 3보이스 클릭음 경로를 실행한 뒤에도 프로세스와 `MainActivity`가 유지됐으며, 최근 로그에서 치명 예외·앱 ANR·React Native JS 오류는 발견되지 않았습니다. 이는 설치·기능 확인이며 장시간 전투 성능 측정은 아닙니다.

### 1.0.12 설치·실행 확인

2026-07-18 `versionCode 13`, `versionName 1.0.12` 릴리스 APK를 빌드했습니다. 결과는 104,346,034바이트이고 SHA-256은 `9698236bfe8ccc1e8d8a5eca82146ed105f48f1ee003fc622a66889281402571`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36, 세로 고정과 APK v2 서명을 확인했습니다. Metro는 1,075개 모듈과 신규 쿠키·보스·봇·크리티컬 사운드를 포함한 에셋 번들을 생성했습니다.

Xiaomi `24069PC21G`에 `adb install -r`로 덮어 설치했습니다. 버전은 1.0.11(12)에서 1.0.12(13)으로 바뀌었고 데이터 경로 `/data/user/0/com.cookiewars.game`와 최초 설치 시각 `2026-07-18 11:59:12`가 유지됐습니다. 기기 내부 `base.apk`의 SHA-256도 배포본과 같은 `9698236bfe8ccc1e8d8a5eca82146ed105f48f1ee003fc622a66889281402571`였습니다. 강제 종료 후 시작은 `Status: ok`, `WaitTime: 3025ms`였고 `MainActivity`가 resumed 상태이며 React Native가 `main` 실행을 기록했습니다. 앱 프로세스 로그에서 치명 예외·앱 ANR·React Native JS 오류는 발견되지 않았습니다. 이 확인은 설치·실행 검증이며 장시간 전투 성능 측정은 아닙니다.

### 1.0.11 설치·실행 확인

2026-07-18 `versionCode 12`, `versionName 1.0.11` 릴리스 APK를 Git에서 무시되는 기존 Android 빌드·CMake 생성 디렉터리를 비운 뒤 생성했습니다. 결과는 90,690,708바이트이고 SHA-256은 `4fb53649504ee8bd27bda258cf2a0c7bc71274928cc79e5e5815b1d5dcb8f5ab`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36, 세로 고정과 APK v2 서명을 확인했습니다.

Xiaomi `24069PC21G`에 `adb install -r`로 덮어 설치했습니다. 버전은 1.0.10(11)에서 1.0.11(12)로 바뀌었고 데이터 경로 `/data/user/0/com.cookiewars.game`와 최초 설치 시각 `2026-07-18 11:59:12`가 유지됐습니다. 기기 내부 `base.apk`의 SHA-256도 배포본과 같은 `4fb53649504ee8bd27bda258cf2a0c7bc71274928cc79e5e5815b1d5dcb8f5ab`였습니다. 강제 종료 후 시작은 `Status: ok`, `WaitTime: 3029ms`였고 React Native가 `main` 실행을 기록했으며 치명 예외·앱 ANR 로그는 없었습니다. 기기가 `Dozing` 보안 잠금 상태이고 알림 창이 전면에 있어 화면과 전투 성능은 확인한 것으로 기록하지 않습니다.

### 1.0.10 설치·실행 확인

2026-07-18 `versionCode 11`, `versionName 1.0.10` 릴리스 APK를 생성 디렉터리를 비운 뒤 클린 빌드했습니다. 결과는 90,685,132바이트이고 SHA-256은 `14d6a6d3532c346843969c9ac88789102225dcfcd76c67eac354f9462cc9f0eb`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36, 세로 고정을 확인했습니다.

Xiaomi `24069PC21G`에 `adb install -r`로 덮어 설치해 기존 앱 데이터와 최초 설치 시각을 유지했습니다. 기기 내부 `base.apk`의 SHA-256도 배포본과 같은 `14d6a6d3532c346843969c9ac88789102225dcfcd76c67eac354f9462cc9f0eb`였습니다. 강제 종료 후 시작은 `Status: ok`, `WaitTime: 3021ms`였고 `MainActivity`가 resumed 상태였습니다. 실행 직후 AndroidRuntime·React Native JS·ActivityManager 오류 필터에는 항목이 없었습니다. 기기가 화면 꺼짐·보안 잠금 상태여서 화면과 전투 성능은 확인한 것으로 기록하지 않습니다.

### 1.0.9 설치·실행 확인

2026-07-18 Xiaomi `24069PC21G`에 `versionCode 10`, `versionName 1.0.9` 릴리스 APK를 `adb install -r`로 설치해 기존 저장 데이터를 유지했습니다. APK는 생성 디렉터리를 비운 클린 빌드 결과이며 90,682,728바이트, SHA-256은 `00e81de2fb77cf66775f2b2bb676ad6f83bfeeedb4b1dd90062d19d0b5ec861e`입니다. 빌드 도구로 패키지 `com.cookiewars.game`, 최소 API 24, 대상 API 36, 세로 고정을 확인했고 ZIP 항목 검사에서 현재 코드가 사용하지 않는 이전 음원·맵·보스 리소스가 포함되지 않았습니다.

기기 내부 설치 경로의 `base.apk` SHA-256도 배포본과 같은 `00e81de2fb77cf66775f2b2bb676ad6f83bfeeedb4b1dd90062d19d0b5ec861e`였습니다. 앱을 강제 종료한 뒤 실행한 결과는 `Status: ok`, `WaitTime: 3047ms`였고 `MainActivity`가 resumed 상태였습니다. 3초 뒤 최근 1,000줄 로그에서 `FATAL EXCEPTION`, 앱 ANR, AndroidRuntime 치명 예외, React Native JS 치명 오류는 발견되지 않았습니다. 실행 시 기기가 `Dozing` 보안 잠금 상태여서 OEM은 `LaunchState: UNKNOWN`을 반환했고 화면 캡처도 잠금 화면에 가려졌습니다. 이번 확인을 콜드 스타트 시간이나 화면·전투 성능 측정으로 간주하지 않습니다.

### 1.0.8 설치·실행 확인

2026-07-18 Xiaomi `24069PC21G`에 `versionCode 9` 릴리스 APK를 기존 데이터 유지 방식으로 설치했습니다. Android 콜드 실행은 `Status: ok`, `LaunchState: COLD`, `TotalTime: 302ms`였고 직후 500줄 로그에서 `FATAL EXCEPTION`, `AndroidRuntime`, React Native JS 치명 오류는 발견되지 않았습니다. 1220×2712 세로 화면에서 메인 진화 안내, 난이도별 맵·보스, 상단 HP 바와 망치 준비·강타·지면 충격 프레임을 확인했습니다. 이 결과는 설치·기능 확인이며 장시간 프레임 성능 수치로 해석하지 않습니다.

### 1.0.6 측정 결과

2026-07-18 릴리스 APK를 Xiaomi `24069PC21G`에 설치하고 `medium demon` 보스전의 빙하 테마에서 약 12초간 자동 봇 공격, 다중 아군 원반, 보스 예고 오라와 상단 HP 바가 계속 갱신되는 구간을 측정했습니다.

| 항목 | 결과 |
|---|---:|
| 렌더 프레임 | 592 |
| Android 현대식 janky frame | 21 (3.55%) |
| legacy janky frame | 48 (8.11%) |
| 50th percentile | 11ms |
| 90th percentile | 20ms |
| 95th percentile | 27ms |
| 99th percentile | 34ms |
| Total PSS | 346,988KB |
| Total RSS | 546,328KB |

측정 중 앱 강제 종료나 AndroidRuntime 예외는 없었습니다. 이 값은 해당 기기·해당 짧은 구간의 기준선이며 모든 Android 기기에서 같은 결과를 보장하지 않습니다. 이후 유닛·효과·테마를 추가할 때 이 수치와 같은 조건으로 비교합니다.
