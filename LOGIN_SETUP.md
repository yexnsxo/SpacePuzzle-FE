# 🔐 로그인 시스템 설정 가이드

## ✅ 완료된 작업

1. ✅ Google OAuth 패키지 설치 (`@react-oauth/google`, `jwt-decode`)
2. ✅ 로그인 페이지 구현 (팀원 코드 적용)
3. ✅ 튜토리얼 페이지 생성
4. ✅ 로비 페이지 생성
5. ✅ 라우터 설정 업데이트

---

## 🔧 필요한 환경 변수 설정

`.env` 파일에 다음 내용을 추가해주세요:

```env
# NASA API Key (기존)
VITE_NASA_API_KEY=DEMO_KEY

# 백엔드 API URL (팀원에게 확인)
VITE_API_BASE_URL=http://localhost:8080

# Google OAuth Client ID (아래 가이드 참조)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

---

## 📝 Google OAuth Client ID 발급 방법

### 1. Google Cloud Console 접속
https://console.cloud.google.com/

### 2. 프로젝트 생성 (또는 기존 프로젝트 선택)
- "새 프로젝트" 클릭
- 프로젝트 이름 입력 (예: SpacePuzzle)

### 3. OAuth 동의 화면 구성
1. 왼쪽 메뉴 → "API 및 서비스" → "OAuth 동의 화면"
2. "외부" 선택 → "만들기"
3. 앱 정보 입력:
   - 앱 이름: Space Puzzle
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처: 본인 이메일
4. "저장 후 계속"

### 4. 사용자 인증 정보 만들기
1. 왼쪽 메뉴 → "사용자 인증 정보"
2. "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
3. 애플리케이션 유형: "웹 애플리케이션"
4. 이름: Space Puzzle Web
5. 승인된 자바스크립트 원본 추가:
   ```
   http://localhost:5173
   ```
6. 승인된 리디렉션 URI (비워둬도 됨)
7. "만들기" 클릭

### 5. Client ID 복사
- 생성된 클라이언트 ID를 복사
- `.env` 파일의 `VITE_GOOGLE_CLIENT_ID`에 붙여넣기

---

## 🎯 화면 흐름

```
1. / (랜딩)
   ↓ [PLAY 버튼 클릭]
   
2. /login (로그인)
   ↓ [Google 로그인]
   
3-A. /tutorial (신규 유저)
     ↓ [시작하기]
     ⚠️ 신규 유저는 자동으로 기본 아이템 지급:
        - 회색 철판 벽 (wallpaper_metal_gray)
        - 기본 목재 조종석 (cockpit_wooden_basic)
     
3-B. /lobby (기존 유저)

4. /lobby (로비)
   - 퍼즐 플레이
   - 도감
   - 우주선 꾸미기
   - 업적
   - 랭킹
   - 설정
```

---

## 🚀 테스트 방법

### 1. 환경 변수 설정 확인
```bash
# .env 파일 확인
cat .env
```

### 2. 서버 실행
```bash
npm run dev
```

### 3. 로그인 테스트
1. http://localhost:5173 접속
2. "PLAY" 버튼 클릭 → 로그인 페이지로 이동
3. Google 로그인 버튼 클릭
4. 구글 계정 선택
5. 튜토리얼 또는 로비로 이동 확인

---

## 📋 주요 파일 목록

```
src/
├── pages/
│   ├── Landing.jsx      # 랜딩 페이지 (기존)
│   ├── Login.jsx        # 로그인 페이지 (새로 추가) ✅
│   ├── Tutorial.jsx     # 튜토리얼 페이지 (새로 추가) ✅
│   └── Lobby.jsx        # 로비 페이지 (새로 추가) ✅
└── router.jsx           # 라우터 설정 (업데이트) ✅
```

---

## ⚠️ 주의사항

### 백엔드 서버가 필요합니다!
로그인 기능이 작동하려면 백엔드 서버가 다음 API를 제공해야 합니다:

```
POST /auth/login
Request Body:
{
  "email": "user@gmail.com",
  "nickname": "User Name",
  "googleId": "google_user_id"
}

Response:
{
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "nickname": "User Name"
  },
  "isNewUser": true  // 또는 false
}
```

**신규 유저 생성 시 (`isNewUser: true`) 백엔드 처리:**
- 초기 자원 지급: 크레딧 20, 별 0, 우주부품 0
- 기본 아이템 자동 추가:
  - `wallpaper_metal_gray` (회색 철판 벽) 1개
  - `cockpit_wooden_basic` (기본 목재 조종석) 1개

백엔드 팀원에게 확인하세요!

---

## 🐛 문제 해결

### Google 로그인 버튼이 안 보여요
1. `.env` 파일에 `VITE_GOOGLE_CLIENT_ID` 확인
2. 환경 변수는 서버 재시작 후 적용됨

### "로그인 실패" 알림이 떠요
1. 백엔드 서버가 실행 중인지 확인
2. `VITE_API_BASE_URL`이 올바른지 확인
3. 브라우저 콘솔(F12)에서 에러 메시지 확인

### 페이지 이동이 안 돼요
1. 라우터가 제대로 설정되었는지 확인
2. 브라우저 새로고침

---

## 📞 다음 단계

1. ✅ `.env` 파일 설정
2. ✅ Google OAuth Client ID 발급
3. ⏳ 백엔드 서버 연동 확인
4. ⏳ 실제 퍼즐 게임 기능 구현

---

궁금한 점이 있으면 언제든 물어보세요! 🚀✨
