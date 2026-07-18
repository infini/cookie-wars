# 전투 성능 설계와 점검

## 현재 구조

- 전투 시뮬레이션은 `battle-rules.json`의 50ms 틱으로 실행하며 경과 시간을 `0~maxDeltaMs(100)`로 제한합니다. 앱이 잠깐 멈춘 뒤 보스나 원반이 한꺼번에 순간 이동하거나 기기 시각 변경 때문에 역행하는 현상을 막습니다.
- 화면에는 보스 한 마리와 종류별 쿠키봇 최대 다섯 개만 그립니다. 같은 종류 봇의 수량은 이름의 `×수량`과 한 발의 합산 피해로 표현하므로 봇을 수십 대 구매해도 View 수가 늘지 않습니다.
- 적 원반은 동시에 한 개로 제한합니다. 아군 원반은 비행을 마치면 즉시 배열에서 제거합니다.
- `BattleBotFormation`, `CookieCastle`, `BotImage`, `MonsterSprite`, `DiscImage`, `CookieImage`를 메모이제이션해 50ms 시계 갱신 때 입력이 바뀌지 않은 정적 그림은 다시 계산하지 않습니다.
- `BattleScreen`은 182줄 레이어 조정자이고 수명주기·표시 계산·입력·HUD·준비·결과는 `src/screens/battle`의 최대 144줄 모듈로 분리했습니다. 체력 바·피격 연출·발사체·유닛도 `src/components/battle`에서 독립되어 표현 변경이 엔진 판정에 번지지 않습니다.
- 같은 틱의 모든 전투 사건은 `pendingEvents`에 손실 없이 보존해 효과음 콜백에 정확히 한 번 전달합니다. 화면 이력은 최근 32개로 제한하고 그중 최신 피격 사건 하나만 `presentationEvent`로 표시합니다. 다섯 번의 섬광은 각각 여섯 개 파편으로 제한하고 넓은 충격파는 성 수동 원반과 거대 원반에만 사용하므로 전달 정확성과 View 상한을 분리했습니다.
- 보스 망치 강공격의 지면 균열·타원 충격파 SVG와 전장 플래시는 5초 주기의 기존 공격 한 발에서만 760ms 동안 생성되고 종료 즉시 제거됩니다. 망치는 기본 보스 이미지에 포함되어 별도 상시 View를 만들지 않으며 새 발사체나 추가 전투 틱도 만들지 않습니다.
- 전투 음악과 효과음은 로컬 OGG를 미리 연결한 플레이어에서 재생합니다. 자동 연사 효과음은 `battle-audio.json`의 그룹별 최소 간격으로 제한합니다.

## 현재 성능 경계와 확장 위험

현재 전투는 보스 한 마리, 종류별로 합산한 봇 최대 다섯 개, 적 원반 최대 한 개를 전제로 하므로 화면 개체 수가 작고 예측 가능합니다. 15개 전장·보스 에셋은 정적 `require`로 번들에 포함되지만 한 전투에서는 선택된 전장과 보스만 렌더합니다. 난이도별 에셋 수 증가는 APK 용량에는 영향을 주지만 틱당 전투 개체 수를 늘리지는 않습니다.

이 평가는 현재 단일 보스 범위에 한정됩니다. 다수 적, 상태 효과, 동시 원반을 추가하면 50ms마다 수행되는 배열 `map`·`filter`·`find`와 새 객체 생성이 개체 수에 따라 증가합니다. 현재 `advanceBattle`은 이동·충돌·봇 발사·보스 공격·결과 판정의 순수 단계로 분리되어 있으므로, 다수 개체 기능을 시작하기 전에 적·발사체 상한을 정하고 아래 동일 기기 측정으로 필요한 단계만 최적화합니다.

1.0.9 APK의 설치와 강제 종료 후 시작 확인도 성능 측정으로 해석하지 않습니다. 아래 1.0.6 수치가 현재 비교 가능한 실기기 전투 기준선이며, 1.0.9의 장시간 프레임·메모리 결과는 같은 조건으로 별도 측정하기 전까지 추정하지 않습니다.

## 회귀 점검

코드 변경 뒤 아래 순서로 검사합니다.

```bash
npm run verify
npm run android:release
adb -s <기기ID> install -r artifacts/cookie-wars-v1.0.9.apk
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

최종 APK 설치 뒤 전투 진입, 보스 원거리 원반, 자동 봇 공격, 성 수동 원반, 다중 피격 이펙트, 결과 화면에서 음악 정지를 순서대로 확인합니다. 기기가 잠겨 있으면 설치·프로세스·로그까지만 확인하고 화면이나 전투 성능을 확인한 것으로 기록하지 않습니다.

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
