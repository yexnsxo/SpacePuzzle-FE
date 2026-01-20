# 🎬 Animation Assets

## 📁 스프라이트시트 애니메이션 (Aseprite)

이 폴더는 프로젝트에서 사용하는 스프라이트시트 애니메이션 파일을 포함합니다.

---

## 📂 파일 목록

### Earth-Like Planet 애니메이션
- **`Earth-Like planet.json`** - Aseprite 스프라이트시트 데이터
- **`Earth-Like planet.png`** - 스프라이트시트 이미지 (2304x1152px)

**사용 위치:**
- Landing 페이지 왼쪽 (메인 화면)

**특징:**
- 프레임 기반 애니메이션 (100ms/프레임)
- 픽셀 아트 스타일 (imageRendering: pixelated)
- 크기: 300x150px (비율 2:1 유지)
- 그림자 효과 적용
- 화면 중앙 세로 정렬

**스프라이트시트 정보:**
- 전체 크기: 2304 x 1152px
- 프레임 크기: 256 x 128px (각 프레임)
- 총 프레임 수: 72개
- 애니메이션 주기: 7.2초 (72프레임 × 100ms)

---

## 💻 사용 방법

### Import 및 사용

```jsx
import PlanetAnimation from '../components/Landing/PlanetAnimation';

function MyComponent() {
  return <PlanetAnimation />;
}
```

### 컴포넌트 구조

```jsx
// PlanetAnimation.jsx
import { useState, useEffect } from 'react';
import spriteSheet from '../../assets/animations/Earth-Like planet.png';
import spriteData from '../../assets/animations/Earth-Like planet.json';

const PlanetAnimation = () => {
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // 100ms마다 프레임 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // 스프라이트시트에서 현재 프레임만 표시
  return (
    <div style={{
      backgroundImage: `url(${spriteSheet})`,
      backgroundPosition: `${bgX}px ${bgY}px`,
      backgroundSize: `${scaledWidth}px ${scaledHeight}px`,
    }} />
  );
};
```

---

## 🎨 커스터마이징

### 애니메이션 속도 조정

PlanetAnimation.jsx에서 `interval` 시간 변경:

```jsx
// 느리게 (200ms마다 프레임 전환)
setInterval(() => { ... }, 200);

// 빠르게 (50ms마다 프레임 전환)
setInterval(() => { ... }, 50);
```

### 크기 조정

PlanetAnimation.jsx에서 `displayWidth` 변경:

```jsx
const displayWidth = 400; // 더 크게
const displayWidth = 200; // 더 작게
```

### 특정 프레임에서 정지

```jsx
const PlanetAnimation = ({ paused = false, frame = 0 }) => {
  const [currentFrame, setCurrentFrame] = useState(frame);
  
  useEffect(() => {
    if (paused) return; // 일시정지
    
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 100);
    
    return () => clearInterval(interval);
  }, [paused]);
  
  // ...
};

// 사용
<PlanetAnimation paused={true} frame={10} />
```

### 역방향 재생

```jsx
// 프레임을 거꾸로 재생
setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames);
```

---

## 📐 현재 설정 (Landing 페이지)

```jsx
<div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
  <PlanetAnimation />
</div>
```

**위치:**
- `left-8`: 왼쪽에서 32px (2rem)
- `top-1/2 -translate-y-1/2`: 화면 세로 중앙
- `z-10`: 배경 위, 콘텐츠 아래

**애니메이션 설정:**
- 크기: 300x150px (자동 비율 계산)
- 프레임 속도: 100ms (10 FPS)
- 총 72개 프레임
- 무한 반복 재생
- 픽셀 아트 스타일 (imageRendering: pixelated)
- 그림자: `drop-shadow-2xl` (큰 그림자)

---

## 🔧 위치 변경 예시

### 오른쪽으로 이동
```jsx
className="absolute right-8 top-1/2 -translate-y-1/2 z-10"
```

### 상단으로 이동
```jsx
className="absolute left-8 top-8 z-10"
```

### 하단으로 이동
```jsx
className="absolute left-8 bottom-8 z-10"
```

### 중앙 정렬
```jsx
className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
```

---

## 🌟 애니메이션 효과 추가

### 페이드인
```jsx
<div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 animate-fade-in">
  <Lottie ... />
</div>
```

### 슬라이드인 (왼쪽에서)
```jsx
<div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 animate-slide-in-left">
  <Lottie ... />
</div>
```

### 호버 효과
```jsx
<div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 transition-transform hover:scale-110">
  <Lottie ... />
</div>
```

---

## 📦 새 스프라이트시트 애니메이션 추가 방법

### 1. Aseprite로 애니메이션 생성
   - [Aseprite](https://www.aseprite.org/) 다운로드 (픽셀 아트 도구)
   - 픽셀 아트 애니메이션 제작
   - File → Export Sprite Sheet

### 2. Export 설정
   ```
   Sheet Type: By Rows
   Output File: sprite-name.png
   JSON Data: sprite-name.json
   JSON Format: Hash (Array)
   ```

### 3. 파일 추가
   - PNG와 JSON을 이 폴더에 저장
   - 파일명에 공백 없이 (하이픈 사용)

### 4. 컴포넌트 생성
   ```jsx
   import spriteSheet from '../assets/animations/sprite-name.png';
   import spriteData from '../assets/animations/sprite-name.json';
   
   // PlanetAnimation 컴포넌트를 참고하여 새 컴포넌트 생성
   ```

---

## 🎯 추천 리소스

- **Aseprite**: https://www.aseprite.org/ (픽셀 아트 에디터)
- **itch.io**: https://itch.io/game-assets (무료 스프라이트시트)
- **OpenGameArt**: https://opengameart.org/ (무료 게임 아트)
- **Piskel**: https://www.piskelapp.com/ (무료 온라인 픽셀 에디터)

---

## ⚠️ 주의사항

1. **파일 크기**
   - PNG 스프라이트시트는 압축 필수 (500KB 이하 권장)
   - 너무 많은 프레임은 파일 크기 증가

2. **브라우저 호환성**
   - `imageRendering: pixelated`는 모던 브라우저 지원
   - 구형 브라우저는 `-moz-crisp-edges` 등 fallback 추가

3. **성능**
   - 프레임 수가 많을수록 메모리 사용 증가
   - `setInterval` 대신 `requestAnimationFrame` 사용 권장
   - 화면에 보일 때만 재생 (Intersection Observer)

4. **파일명**
   - 공백 없이 작성 (예: `earth-planet.png`)
   - JSON과 PNG 파일명 일치시키기

---

## 📊 성능 최적화

### 화면에 보일 때만 재생

```jsx
import { useEffect, useRef, useState } from 'react';

function OptimizedPlanetAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible && <PlanetAnimation />}
    </div>
  );
}
```

### 스프라이트시트 최적화

1. **이미지 압축**
   - PNG 최적화: TinyPNG, ImageOptim
   - WebP 포맷 사용 (더 작은 파일 크기)

2. **프레임 수 줄이기**
   - 72프레임 → 36프레임 (2배 빠른 주기)
   - 부드러움은 유지, 파일 크기 감소

3. **해상도 조정**
   - 원본: 2304x1152px
   - 최적화: 1152x576px (50% 크기)
   - 모바일에서 충분히 선명

### 메모리 최적화

```jsx
// requestAnimationFrame 사용 (더 부드러운 애니메이션)
useEffect(() => {
  let animationFrameId;
  let lastFrameTime = 0;
  
  const animate = (currentTime) => {
    if (currentTime - lastFrameTime >= 100) { // 100ms마다
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
      lastFrameTime = currentTime;
    }
    animationFrameId = requestAnimationFrame(animate);
  };
  
  animationFrameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationFrameId);
}, []);
```
