# 🎬 Animated Backgrounds

## 📁 연속 프레임 애니메이션

이 폴더는 움직이는 배경을 위한 연속 PNG 프레임 파일을 포함합니다.

---

## 📂 파일 네이밍 규칙

### 권장 형식
```
frame-001.png
frame-002.png
frame-003.png
...
frame-060.png
```

**또는**

```
bg-0001.png
bg-0002.png
bg-0003.png
```

### 중요 사항
- 숫자는 **0으로 패딩** (001, 002, 003...)
- 모든 파일명 **일관성 유지**
- 순서대로 정렬되도록 작명

---

## 💻 사용 방법

### 1. 정적 Import (프레임 적을 때)

```jsx
import frame1 from '../../assets/backgrounds/animated/frame-001.png';
import frame2 from '../../assets/backgrounds/animated/frame-002.png';
import frame3 from '../../assets/backgrounds/animated/frame-003.png';

const AnimatedBackground = () => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frames = [frame1, frame2, frame3];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, 100); // 100ms마다 프레임 전환
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <img 
      src={frames[currentFrame]} 
      alt="Animated background"
      className="w-full h-full object-cover"
    />
  );
};
```

---

### 2. 동적 Import (프레임 많을 때)

```jsx
const AnimatedBackground = () => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const totalFrames = 60; // 총 프레임 수
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // 프레임 번호를 3자리 숫자로 변환 (001, 002, ...)
  const frameNumber = String(currentFrame + 1).padStart(3, '0');
  const frameSrc = `/src/assets/backgrounds/animated/frame-${frameNumber}.png`;
  
  return (
    <img 
      src={frameSrc} 
      alt="Animated background"
      className="w-full h-full object-cover"
    />
  );
};
```

---

### 3. 프리로드 (성능 최적화)

```jsx
const AnimatedBackground = () => {
  const [frames, setFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const totalFrames = 60;
  
  useEffect(() => {
    // 모든 프레임을 미리 로드
    const loadFrames = async () => {
      const loadedFrames = [];
      
      for (let i = 1; i <= totalFrames; i++) {
        const frameNum = String(i).padStart(3, '0');
        const img = new Image();
        img.src = `/src/assets/backgrounds/animated/frame-${frameNum}.png`;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        
        loadedFrames.push(img.src);
      }
      
      setFrames(loadedFrames);
      setIsLoaded(true);
    };
    
    loadFrames();
  }, []);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isLoaded, frames.length]);
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  return (
    <img 
      src={frames[currentFrame]} 
      alt="Animated background"
      className="w-full h-full object-cover"
    />
  );
};
```

---

## 🎨 적용 예시 (퍼즐 화면)

### PuzzleGame.jsx에 적용

```jsx
// PuzzleGame.jsx
import AnimatedBackground from '../components/AnimatedBackground';

const PuzzleGame = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* 움직이는 배경 */}
      <div className="absolute inset-0 z-0">
        <AnimatedBackground />
      </div>
      
      {/* 기존 퍼즐 게임 내용 */}
      <div className="relative z-10">
        {/* ... */}
      </div>
    </div>
  );
};
```

---

## ⚡ 성능 최적화 팁

### 1. 이미지 압축
```bash
# TinyPNG, ImageOptim 등 사용
# 목표: 각 프레임 100KB 이하
```

### 2. 해상도 조정
```
1920x1080 (Full HD) - 고해상도
1280x720 (HD) - 권장
960x540 (qHD) - 모바일
```

### 3. 프레임 수 줄이기
```
60 FPS → 30 FPS (프레임 절반)
30 FPS → 15 FPS (프레임 1/4)
```

### 4. WebP 형식 사용
```bash
# PNG를 WebP로 변환 (파일 크기 30% 감소)
cwebp frame-001.png -o frame-001.webp
```

### 5. requestAnimationFrame 사용

```jsx
useEffect(() => {
  let animationFrameId;
  let lastFrameTime = 0;
  const frameInterval = 100; // 100ms
  
  const animate = (currentTime) => {
    if (currentTime - lastFrameTime >= frameInterval) {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
      lastFrameTime = currentTime;
    }
    animationFrameId = requestAnimationFrame(animate);
  };
  
  animationFrameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationFrameId);
}, []);
```

---

## 📊 권장 설정

| 항목 | 권장값 |
|------|--------|
| **해상도** | 1280x720 ~ 1920x1080 |
| **파일 형식** | PNG 또는 WebP |
| **파일 크기** | 100KB 이하/프레임 |
| **총 프레임** | 30-60개 |
| **프레임 속도** | 10-30 FPS |
| **애니메이션 길이** | 2-4초 (반복) |

---

## 🎬 프레임 생성 도구

### 추천 도구
- **After Effects** - 영상을 PNG 시퀀스로 Export
- **Blender** - 3D 애니메이션 렌더링
- **Aseprite** - 픽셀 아트 애니메이션
- **FFmpeg** - 영상을 프레임으로 분해

### FFmpeg 명령어 예시
```bash
# 영상을 PNG 프레임으로 분해
ffmpeg -i video.mp4 -vf "fps=10" frame-%03d.png

# 크기 조정
ffmpeg -i video.mp4 -vf "fps=10,scale=1280:720" frame-%03d.png
```

---

## 📁 예상 폴더 구조

```
animated/
├── README.md (이 파일)
├── frame-001.png
├── frame-002.png
├── frame-003.png
├── frame-004.png
├── ...
└── frame-060.png
```

---

## 🚀 다음 단계

1. **프레임 파일 추가**
   - 연속 PNG 파일들을 이 폴더에 복사

2. **컴포넌트 생성**
   - `AnimatedBackground.jsx` 컴포넌트 생성

3. **적용**
   - 원하는 페이지에 컴포넌트 추가

4. **최적화**
   - 이미지 압축, 프레임 수 조정

파일을 넣으신 후 말씀해주시면 컴포넌트를 만들어드리겠습니다! 🎬
