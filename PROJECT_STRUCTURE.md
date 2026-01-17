# SpacePuzzle-FE 프로젝트 구조

## 📁 전체 디렉토리 구조

```
SpacePuzzle-FE/
├── public/                     # 정적 자산 (Pixel Art, SFX, NASA 로고 등)
├── src/
│   ├── assets/                 # 이미지, 아이콘, 폰트 자료
│   │
│   ├── components/             # 재사용 가능한 UI 컴포넌트
│   │   ├── Common/             # 공용 UI (Pixel Button, Loading, Modal)
│   │   ├── Interior/           # 우주선 내부 꾸미기 가구/아이템
│   │   └── Space/              # 천체 카드, 랭킹 리스트 아이템
│   │
│   ├── features/               # 주요 도메인 로직
│   │   ├── auth/               # 로그인, 회원가입 관련 (Context/Store)
│   │   ├── shop/               # 상점 구매 및 배치 로직
│   │   └── puzzle/             # 퍼즐 난이도 및 보상 계산 로직
│   │
│   ├── game/                   # Phaser.js 핵심 엔진 영역
│   │   ├── scenes/             # 게임 화면 (Boot, Main, Puzzle, Event)
│   │   ├── sprites/            # 게임 내 객체 (우주선, 소행성 등)
│   │   └── PhaserGame.jsx      # React와 Phaser를 연결하는 브릿지 컴포넌트
│   │
│   ├── hooks/                  # 커스텀 훅 (NASA API 호출, 타이머 등)
│   │
│   ├── pages/                  # 라우터 연결 페이지 (Page Level)
│   │   ├── Landing.jsx         # 랜딩 및 진입 애니메이션
│   │   ├── Login.jsx           # 로그인 화면
│   │   ├── Interior.jsx        # 우주선 내부 (메인 허브)
│   │   ├── Cockpit.jsx         # 조종실 (섹터 선택)
│   │   ├── Sector.jsx          # 천체 목록 및 상세
│   │   └── GamePlay.jsx        # 실제 퍼즐 게임 페이지
│   │
│   ├── services/               # 외부 API 통신 (Axios, NASA API, 백엔드)
│   ├── store/                  # 전역 상태 관리 (Zustand/Redux - 재화, 배지)
│   ├── styles/                 # 전역 스타일 및 테마 (Pixel Art CSS)
│   ├── utils/                  # 퍼즐 알고리즘, 시간 포맷팅 등
│   │
│   ├── App.jsx                 # 메인 앱 컴포넌트
│   ├── router.jsx              # 라우터 설정
│   └── main.jsx                # 엔트리 포인트
│
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 📂 주요 디렉토리 설명

### 🎨 **public/**
- 정적 자산 폴더
- 픽셀 아트 이미지, 사운드 이펙트, NASA 로고 등

### 🖼️ **src/assets/**
- 프로젝트 내부에서 import하여 사용하는 자산
- 이미지, 아이콘, 커스텀 폰트

### 🧩 **src/components/**
재사용 가능한 UI 컴포넌트들
- **Common/**: 버튼, 로딩, 모달 등 공통 UI
- **Interior/**: 우주선 내부 가구/아이템 컴포넌트
- **Space/**: 천체 카드, 랭킹 표시 등 우주 관련 UI

### ⚙️ **src/features/**
비즈니스 로직 및 도메인 로직
- **auth/**: 인증 관련 (로그인, 회원가입, 세션 관리)
- **shop/**: 상점 구매 및 아이템 배치
- **puzzle/**: 퍼즐 난이도 계산, 보상 시스템

### 🎮 **src/game/**
Phaser.js 게임 엔진 영역
- **scenes/**: 게임 씬 (Boot, Main, Puzzle, Event 등)
- **sprites/**: 게임 오브젝트 (우주선, 소행성, 블랙홀)
- **PhaserGame.jsx**: React ↔ Phaser 브릿지

### 🪝 **src/hooks/**
커스텀 React 훅
- NASA API 호출 훅
- 타이머, 게임 상태 관리 등

### 📄 **src/pages/**
라우터와 연결되는 페이지 컴포넌트
- **Landing.jsx**: 첫 화면 + 애니메이션
- **Login.jsx**: 로그인/회원가입
- **Interior.jsx**: 우주선 내부 (메인 허브)
- **Cockpit.jsx**: 조종실 (섹터 선택)
- **Sector.jsx**: 천체 목록 및 상세 정보
- **GamePlay.jsx**: 퍼즐 게임 플레이

### 🌐 **src/services/**
외부 API 통신 레이어
- NASA API 호출
- 백엔드 서버 통신 (Axios)
- API 응답 핸들링

### 📦 **src/store/**
전역 상태 관리 (Zustand/Redux)
- 유저 정보
- 게임 재화 (코인, 스타더스트 등)
- 뱃지/업적 상태
- 도감 수집 현황

### 🎨 **src/styles/**
전역 스타일 및 테마
- Pixel Art 스타일 CSS
- 색상 팔레트
- 애니메이션 정의

### 🛠️ **src/utils/**
유틸리티 함수들
- 퍼즐 생성 알고리즘
- 시간 포맷팅
- 랜덤 이벤트 생성
- 점수 계산

---

## 🚀 개발 가이드

### 폴더별 코딩 규칙

1. **components/**: Pure UI 컴포넌트, 비즈니스 로직 최소화
2. **features/**: 도메인 로직 집중, 재사용 가능하게 설계
3. **game/**: Phaser.js 관련 코드만 작성
4. **pages/**: 라우팅 + 레이아웃만, 로직은 features나 hooks에
5. **services/**: API 통신만 담당, 상태 관리는 store에서
6. **utils/**: 순수 함수, 부수 효과 없이

### 명명 규칙

- **컴포넌트**: PascalCase (예: `PixelButton.jsx`)
- **훅**: camelCase, use 접두사 (예: `useNasaApi.js`)
- **유틸**: camelCase (예: `formatTime.js`)
- **상수**: UPPER_SNAKE_CASE (예: `API_BASE_URL`)

---

## 📝 다음 단계

1. 필요한 패키지 설치 (Phaser.js, Axios, Zustand 등)
2. 라우터 설정 (`router.jsx`)
3. 기본 페이지 컴포넌트 구현
4. NASA API 서비스 구현
5. 백엔드 API 설계 및 연동
6. Phaser.js 게임 씬 구현
