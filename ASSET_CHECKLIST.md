# 🎨 랜딩 화면 에셋 체크리스트

## 📦 파일 위치 요약

```
SpacePuzzle-FE/
├── src/assets/
│   ├── landing/               👈 이미지 파일들 여기에
│   │   ├── spaceship.png      ✅ 필수
│   │   ├── play-button.png    ✅ 필수
│   │   ├── play-button-hover.png  (선택)
│   │   ├── title-logo.png     (선택, 웹폰트로 대체 가능)
│   │   ├── stars-layer.png    (선택)
│   │   └── fallback-space.jpg (선택, NASA API 실패 시 대체)
│   │
│   └── fonts/                 👈 폰트 파일 여기에
│       └── pixel-font.ttf     (또는 .woff2)
│
└── public/sounds/             👈 사운드 파일들 여기에
    ├── landing-bgm.mp3        (배경음악)
    ├── button-hover.mp3       (호버 효과음)
    ├── button-click.mp3       (클릭 효과음)
    └── zoom-transition.mp3    (화면 전환 효과음)
```

---

## ✅ 필수 파일 (최소 2개)

- [ ] `src/assets/landing/spaceship.png` - 우주선 이미지
- [ ] `src/assets/landing/play-button.png` - 플레이 버튼

**이 2개만 있어도 기본 구현 가능!**

---

## 🎯 추천 파일 (있으면 좋음)

- [ ] `src/assets/fonts/pixel-font.ttf` - 픽셀 폰트
- [ ] `public/sounds/landing-bgm.mp3` - 배경음악
- [ ] `public/sounds/button-click.mp3` - 버튼 클릭음

---

## 💡 선택 파일 (나중에 추가 가능)

- [ ] `src/assets/landing/play-button-hover.png` - 버튼 호버 이미지
- [ ] `src/assets/landing/title-logo.png` - 제목 로고
- [ ] `src/assets/landing/stars-layer.png` - 별 레이어
- [ ] `src/assets/landing/fallback-space.jpg` - 대체 배경
- [ ] `public/sounds/button-hover.mp3` - 호버 효과음
- [ ] `public/sounds/zoom-transition.mp3` - 전환 효과음

---

## 🎨 이미지 제작 가이드

### 우주선 (spaceship.png)
- 크기: 400-600px 너비
- 배경: 투명 PNG
- 스타일: 픽셀 아트
- 참고: 창문이 명확하게 보이도록 (줌인 타겟)

### 플레이 버튼 (play-button.png)
- 크기: 150-200px 너비
- 배경: 투명 PNG
- 텍스트: "PLAY" 또는 "▶" 심볼
- 스타일: 픽셀 아트, 테두리 있으면 좋음

---

## 🔤 폰트 추천

1. **Press Start 2P** (Google Fonts 무료)
   - 다운로드: https://fonts.google.com/specimen/Press+Start+2P
   
2. **PixelMPlus** (일본 픽셀 폰트, 무료)
   - 다운로드: https://github.com/itouhiro/PixelMplus

3. **또는 CDN 사용 (파일 다운로드 불필요)**
   - 나중에 HTML에 링크만 추가

---

## 🎵 사운드 다운로드 사이트

- **Freesound.org** - 효과음
- **Pixabay Music** - 배경음악
- **OpenGameArt.org** - 게임 사운드
- **ZapSplat** - 다양한 효과음

---

## 📝 다음 단계

1. 위 폴더에 파일들 넣기
2. 파일명이 정확한지 확인
3. 준비되면 알려주세요!
4. 그럼 코드 구현 시작! 🚀
