# 쿠키전쟁 (Cookie Wars)

아이가 기획한 손그림을 바탕으로 만든 Android 전용 세로형 싱글 플레이 게임입니다. 쿠키를 모으는 화면과 전투 화면을 완전히 분리했으며, 화면 아래의 8개 메뉴로 원하는 기능에 한 번에 이동합니다.

## 설치

- APK: [`artifacts/cookie-wars-v1.0.1.apk`](artifacts/cookie-wars-v1.0.1.apk)
- 패키지명: `com.cookiewars.game`
- 지원 범위: Android 7.0(API 24) 이상
- 화면 방향: 세로 고정

APK를 Android 스마트폰으로 옮긴 뒤 파일을 열어 설치합니다. Play 스토어가 아닌 APK를 직접 설치하므로, 스마트폰에서 해당 파일 관리 앱의 **알 수 없는 앱 설치 허용**이 필요할 수 있습니다.

현재 APK는 직접 테스트·설치를 위한 개발 서명 빌드입니다. Play 스토어 배포 전에는 별도의 안전한 배포 키로 서명해야 합니다.

## 현재 구현

- 큰 쿠키 버튼, 클릭 애니메이션, 획득 텍스트, 효과음·진동
- 쿠키 정보와 데이터 기반 업그레이드 4종
- 업그레이드 총레벨로 자동 진화하는 10종 쿠키와 단계별 능력 보너스
- 전투 전용 적·쿠키봇·원반, 아군 하단/적군 상단 배치
- 아군 이름 파란색, 적군 이름 빨간색 표시
- 저렴하게 구매 가능한 쿠키 원반 10종과 쿠키봇 10종
- 원반과 쿠키봇을 각각 여는 독립 하단 메뉴
- 상위 종류로 갈수록 큰 폭으로 벌어지는 원반·쿠키봇 공격 능력
- 종류별 영구 소유·장착과 제한 없는 원반 강화
- 쿠키봇의 장착 원반 자동 공격과 쿠키 성 클릭 시 2배 원반 공격
- 성벽·탑·쿠키 문양을 갖춘 별도 쿠키 성 오브젝트
- 쿠키를 들고 싸우는 쿠키봇과 데이터 기반 다중 봇 구조
- 15단계 난이도 드롭다운과 난이도별 20승 순차 해금
- 같은 난이도에서도 승리마다 강해지는 1~20번째 전투
- 난이도별 적 수, HP·공격력·이동 속도와 적 원반 레벨 상승
- 난이도별 최초 승리 1회만 쿠키 보상, 재도전은 보상 없음
- 몬스터 도감의 `NEW` 및 잠금 표시
- 앱 종료 후 진행 상황 자동 저장
- 설정에서 효과음 5단계 볼륨과 사운드·진동 개별 켜기/끄기
- 모든 사용자 화면을 한국어로 구성

## 개발과 빌드

Node.js와 Android SDK/JDK가 설치된 환경에서 실행합니다.

```bash
npm install
npm run verify
npm run prebuild
npm run android:release
```

빌드 결과는 `android/app/build/outputs/apk/release/app-release.apk`에 생성됩니다. 실제 기기에서 개발 모드로 실행하려면 USB 디버깅을 켜고 `npm run android:device`를 사용합니다.

## 구조

```text
src/
├── components/   공통 모바일 UI
├── config/       난이도·몬스터·업그레이드·무기 JSON 데이터
├── engine/       프레임 기반 전투 로직
├── screens/      8개 독립 화면
├── services/     저장, 효과음, 진동
├── state/        영구 게임 상태와 규칙
├── theme/        색상과 글꼴
└── types/        TypeScript 데이터 계약
```

상세 문서는 다음과 같습니다.

- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md): 화면, 플레이 흐름, 전투·보상·해금 규칙
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): 코드 계층, 상태 변경, 저장과 확장 구조
- [`docs/DATA_TABLES.md`](docs/DATA_TABLES.md): 모든 JSON 테이블의 필드와 수정 방법
- [`docs/ASSET_LICENSES.md`](docs/ASSET_LICENSES.md): 외부 리소스 출처와 라이선스

## 주요 명령

- `npm start`: Expo 개발 서버
- `npm run android:device`: 연결된 Android 기기에서 실행
- `npm run verify`: TypeScript, Jest, Expo 프로젝트 진단
- `npm run android:release`: Android APK 생성

## 라이선스

프로젝트 코드는 MIT License입니다. 이미지, 소리, 글꼴은 각각의 원저작자 라이선스를 따릅니다.
