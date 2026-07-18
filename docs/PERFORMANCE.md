# 전투 성능 설계와 점검

## 현재 구조

- 전투 시뮬레이션은 `battle-rules.json`의 50ms 틱으로 실행하며 한 프레임이 늦어져도 `maxDeltaMs=100`까지만 진행합니다. 앱이 잠깐 멈춘 뒤 보스나 원반이 한꺼번에 순간 이동하는 현상을 제한합니다.
- 화면에는 보스 한 마리와 종류별 쿠키봇 최대 다섯 개만 그립니다. 같은 종류 봇의 수량은 이름의 `×수량`과 한 발의 합산 피해로 표현하므로 봇을 수십 대 구매해도 View 수가 늘지 않습니다.
- 적 원반은 동시에 한 개로 제한합니다. 아군 원반은 비행을 마치면 즉시 배열에서 제거합니다.
- `BattleBotFormation`, `CookieCastle`, `BotImage`, `MonsterSprite`, `DiscImage`, `CookieImage`를 메모이제이션해 50ms 시계 갱신 때 입력이 바뀌지 않은 정적 그림은 다시 계산하지 않습니다.
- 피격 연출은 마지막 전투 이벤트 하나만 표시하며 620ms 뒤 사라집니다. 다섯 번의 섬광은 각각 여섯 개 파편으로 제한하고, 넓은 전장 충격파는 성 수동 원반과 거대 원반에만 사용합니다.
- 보스 망치 강공격의 지면 균열·타원 충격파 SVG와 전장 플래시는 5초 주기의 기존 공격 한 발에서만 760ms 동안 생성되고 종료 즉시 제거됩니다. 망치는 기본 보스 이미지에 포함되어 별도 상시 View를 만들지 않으며 새 발사체나 추가 전투 틱도 만들지 않습니다.
- 전투 음악과 효과음은 로컬 OGG를 미리 연결한 플레이어에서 재생합니다. 자동 연사 효과음은 `battle-audio.json`의 그룹별 최소 간격으로 제한합니다.

## 회귀 점검

코드 변경 뒤 아래 순서로 검사합니다.

```bash
npm run verify
npm run android:release
adb -s <기기ID> install -r artifacts/cookie-wars-v1.0.6.apk
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

최종 APK 설치 뒤 전투 진입, 보스 원거리 원반, 자동 봇 공격, 성 수동 원반, 다중 피격 이펙트, 결과 화면에서 음악 정지를 순서대로 확인합니다.

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
