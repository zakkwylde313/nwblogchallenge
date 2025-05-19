# 블로그 챌린지 대시보드

EiE 경기 서북부 협의회 블로그 챌린지를 위한 대시보드 웹사이트입니다.

## 프로젝트 구조

이 프로젝트는 다음과 같은 구조로 이루어져 있습니다:

- **프론트엔드**: Next.js + React를 사용한 웹 애플리케이션
- **백엔드**: Firebase (Firestore)를 사용한 데이터 저장 및 인증
- **데이터 수집**: 로컬에서 실행되는 스크래핑 스크립트 (`runDailyUpdateLocally.js`)

## 블로그 데이터 업데이트 과정

이 프로젝트는 블로그 데이터를 다음과 같이 처리합니다:

1. **로컬 스크래핑**: 로컬 환경에서 `runDailyUpdateLocally.js` 스크립트를 실행하여 블로그 데이터를 스크래핑합니다.
2. **Firebase 저장**: 스크래핑한 데이터는 Firebase Firestore에 저장됩니다.
3. **데이터 표시**: 웹 애플리케이션은 Firebase에서 데이터를 가져와 사용자에게 표시합니다.

## 로컬 스크립트 실행 방법

블로그 데이터를 업데이트하려면 다음 단계를 따르세요:

```bash
# 필요한 패키지 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
# FIREBASE_SERVICE_ACCOUNT_KEY_JSON_BASE64=<Firebase 서비스 계정 키 Base64 인코딩 문자열>
# CHALLENGE_START_DATE=2025-05-01T00:00:00Z
# CHALLENGE_END_DATE=2025-05-31T23:59:59Z
# MIN_CHAR_COUNT=1000
# MIN_IMAGE_COUNT=3

# 스크립트 실행
node runDailyUpdateLocally.js
```

이 스크립트는 다음과 같은 작업을 수행합니다:

1. Firebase에서 활성화된 블로그 목록을 가져옵니다.
2. 각 블로그의 웹페이지를 스크래핑하여 포스트 정보를 추출합니다.
3. 추출된 포스트 정보를 Firebase에 저장합니다.
4. 블로그 통계 정보를 업데이트합니다.

## 웹 애플리케이션 기능

- 블로그 챌린지 참가 캠퍼스 목록 표시
- 각 캠퍼스별 포스트 현황 및 통계 확인
- 블로그 포스트 목록 및 세부 정보 확인
- 포스트 유효성 검증 결과 확인
- 관리자용 피드백 제공 기능

## 개발 환경 설정

```bash
# 저장소 복제
git clone <repository-url>

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 실행 방법

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
``` 