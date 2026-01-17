# 🚀 랜딩 화면 설정 가이드

## ✅ 완료된 작업

1. ✅ 필요한 패키지 설치 (`framer-motion`, `axios`)
2. ✅ NASA API 서비스 구현
3. ✅ 커스텀 훅 (useNasaBackground, useSound)
4. ✅ 랜딩 화면 컴포넌트 구현
5. ✅ 라우터 설정
6. ✅ 스타일 적용

---

## 📋 시작하기 전에

### 1. .env 파일 확인
프로젝트 루트에 `.env` 파일이 있어야 합니다:

```env
VITE_NASA_API_KEY=your_api_key_here
```

- NASA API 키가 없다면: https://api.nasa.gov/ 에서 무료로 발급
- 또는 테스트용으로 `DEMO_KEY` 사용 가능 (시간당 요청 제한 있음)

### 2. 에셋 파일 준비

#### 필수 이미지 (최소 2개)
- `src/assets/landing/spaceship.png` - 우주선 이미지
- `src/assets/landing/play-button.png` - 플레이 버튼

#### 선택 사항
- `public/sounds/landing-bgm.mp3` - 배경음악
- `public/sounds/button-click.mp3` - 클릭 효과음
- `public/sounds/button-hover.mp3` - 호버 효과음
- `public/sounds/zoom-transition.mp3` - 전환 효과음

자세한 내용은 `ASSET_CHECKLIST.md` 참고!

---

## 🎮 실행 방법

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:5173 열기

---

## 🎨 랜딩 화면 기능

### 1. NASA 배경 이미지
- NASA APOD API에서 랜덤 우주 이미지 로드
- 천천히 이동하는 패럴랙스 효과 (60초 주기)
- API 실패 시 검은 배경으로 대체

### 2. 우주선 애니메이션
- 위아래로 흔들리는 효과 (3초 주기)
- 픽셀 아트 렌더링

### 3. 게임 제목
- 픽셀 폰트 사용 (Google Fonts - Press Start 2P)
- 페이드인 + 스케일 등장 애니메이션

### 4. 플레이 버튼
- 호버 시 확대 효과
- 클릭 시 효과음 재생 (파일이 있는 경우)
- 이미지 로드 실패 시 텍스트 버튼으로 대체

### 5. 배경음악
- 자동 재생 (브라우저 정책에 따라 실패 가능)
- 사운드 ON/OFF 토글 버튼

### 6. 화면 전환
- 플레이 버튼 클릭 시 줌인 효과
- 우주선 중심으로 확대
- 2초 후 로그인 화면으로 이동

---

## 🔧 커스터마이징

### 색상 변경
`src/styles/landing.css` 파일에서 색상 수정

### 애니메이션 속도 조정
각 컴포넌트의 `transition.duration` 값 변경:
- `SpaceBackground.jsx` - 배경 이동 속도
- `Spaceship.jsx` - 우주선 흔들림 속도
- `ZoomTransition.jsx` - 전환 속도

### 사운드 볼륨 조정
`Landing.jsx`에서 `volume` 값 변경:
```jsx
const bgm = useSound('/sounds/landing-bgm.mp3', {
  loop: true,
  volume: 0.3, // 0.0 ~ 1.0
});
```

---

## 🐛 문제 해결

### NASA 이미지가 로드되지 않음
1. `.env` 파일에 API 키가 정확한지 확인
2. 인터넷 연결 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 이미지가 보이지 않음
1. 파일 경로와 이름이 정확한지 확인
2. 파일 확장자 확인 (`.png`, `.jpg`)
3. 이미지가 없어도 동작하도록 설계됨 (텍스트로 대체)

### 사운드가 재생되지 않음
1. 사운드 파일이 `public/sounds/` 폴더에 있는지 확인
2. 브라우저 자동 재생 정책으로 인해 차단될 수 있음
3. 사운드 토글 버튼으로 수동 재생 가능

### 폰트가 적용되지 않음
1. 인터넷 연결 확인 (Google Fonts CDN 사용)
2. `src/styles/landing.css`가 `index.css`에 import되었는지 확인

---

## 📁 생성된 파일 목록

```
src/
├── components/Landing/
│   ├── SpaceBackground.jsx    # NASA 배경
│   ├── Spaceship.jsx           # 우주선
│   ├── PixelTitle.jsx          # 제목
│   ├── PlayButton.jsx          # 플레이 버튼
│   └── ZoomTransition.jsx      # 전환 효과
├── hooks/
│   ├── useNasaBackground.js    # NASA API 훅
│   └── useSound.js             # 사운드 훅
├── pages/
│   ├── Landing.jsx             # 메인 랜딩 페이지
│   └── Login.jsx               # 로그인 페이지 (임시)
├── services/
│   └── nasaApi.js              # NASA API 통신
└── styles/
    └── landing.css             # 랜딩 스타일
```

---

## 🎯 다음 단계

1. **에셋 추가**: 이미지와 사운드 파일 준비
2. **테스트**: 개발 서버 실행 및 동작 확인
3. **로그인 페이지 구현**: `src/pages/Login.jsx` 작성
4. **백엔드 연동**: 서버 및 DB 구축 시작

---

궁금한 점이 있으면 언제든 물어보세요! 🚀✨
