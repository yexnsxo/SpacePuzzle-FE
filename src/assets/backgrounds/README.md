# 🌌 Puzzle Background Assets

## 📁 패럴랙스 배경 레이어

이 폴더는 퍼즐 게임의 패럴랙스 배경 이미지를 포함합니다.

---

## 📂 파일 목록

### 기본 배경
- **`space-background.png`** - 정적 기본 배경 (우주 그라데이션)
  - 움직임: 없음 (고정)
  - 역할: 기본 우주 배경

### 패럴랙스 레이어
- **`stars-layer-1.png`** - 가장 먼 별 레이어
  - 이동 속도: 0.1x (가장 느림)
  - 불투명도: 60%
  - 특징: 작고 희미한 별들
  
- **`stars-layer-2.png`** - 중간 별 레이어
  - 이동 속도: 0.3x
  - 불투명도: 70%
  - 특징: 중간 크기의 별들
  
- **`stars-layer-3.png`** - 가까운 별 레이어
  - 이동 속도: 0.6x
  - 불투명도: 80%
  - 특징: 큰 별들, 약간의 성운 효과
  
- **`stars-layer-4.png`** - 가장 가까운 별 레이어
  - 이동 속도: 1.0x (가장 빠름)
  - 불투명도: 90%
  - 특징: 매우 큰 별, 반짝임 효과

---

## 🎨 이미지 사양

### 권장 설정
- **포맷**: PNG (투명도 지원)
- **크기**: 1920x1080px 이상 (4K 권장)
- **배경**: 투명 (별만 표시)
- **최적화**: Yes (파일 크기 최소화)

### 패럴랙스 원리
```
마우스 이동 → 각 레이어가 다른 속도로 이동 → 깊이감 생성

Layer 1 (먼 별)    →  5px  이동
Layer 2 (중간 별)  → 15px  이동
Layer 3 (가까운 별) → 30px  이동
Layer 4 (가장 가까운) → 50px  이동
```

---

## 💻 사용 예시

### Import
```javascript
import spaceBackground from '../assets/backgrounds/space-background.png';
import starsLayer1 from '../assets/backgrounds/stars-layer-1.png';
import starsLayer2 from '../assets/backgrounds/stars-layer-2.png';
import starsLayer3 from '../assets/backgrounds/stars-layer-3.png';
import starsLayer4 from '../assets/backgrounds/stars-layer-4.png';
```

### 패럴랙스 효과 적용
```jsx
{/* 기본 배경 */}
<div style={{ backgroundImage: `url(${spaceBackground})` }} />

{/* 레이어 1 - 가장 느림 */}
<div style={{
  backgroundImage: `url(${starsLayer1})`,
  transform: `translate(${mouseX * 5}px, ${mouseY * 5}px)`,
  opacity: 0.6
}} />

{/* 레이어 2 */}
<div style={{
  backgroundImage: `url(${starsLayer2})`,
  transform: `translate(${mouseX * 15}px, ${mouseY * 15}px)`,
  opacity: 0.7
}} />

{/* 레이어 3 */}
<div style={{
  backgroundImage: `url(${starsLayer3})`,
  transform: `translate(${mouseX * 30}px, ${mouseY * 30}px)`,
  opacity: 0.8
}} />

{/* 레이어 4 - 가장 빠름 */}
<div style={{
  backgroundImage: `url(${starsLayer4})`,
  transform: `translate(${mouseX * 50}px, ${mouseY * 50}px)`,
  opacity: 0.9
}} />
```

---

## 🔧 커스터마이징

### 이동 속도 조정
```javascript
// 느리게 (더 정적인 느낌)
transform: `translate(${mouseX * 3}px, ${mouseY * 3}px)`

// 빠르게 (더 역동적인 느낌)
transform: `translate(${mouseX * 100}px, ${mouseY * 100}px)`
```

### 불투명도 조정
```javascript
// 더 희미하게
opacity: 0.3

// 더 선명하게
opacity: 1.0
```

### 블러 효과 추가
```javascript
filter: 'blur(2px)'  // 먼 별일수록 블러 추가
```

---

## 🎯 최적화 팁

1. **이미지 압축**: TinyPNG, ImageOptim 사용
2. **WebP 포맷**: 더 작은 파일 크기 (브라우저 호환성 확인)
3. **레이어 개수**: 성능에 따라 2-5개 조정
4. **해상도**: 모바일은 작은 이미지 사용

---

## 📱 반응형 대응

```javascript
// 모바일에서는 이동 거리를 줄임
const isMobile = window.innerWidth < 768;
const moveMultiplier = isMobile ? 0.5 : 1.0;

transform: `translate(
  ${mouseX * 50 * moveMultiplier}px, 
  ${mouseY * 50 * moveMultiplier}px
)`
```

---

## 🌟 참고 자료

- [NASA Image Library](https://images.nasa.gov/)
- [Unsplash Space Photos](https://unsplash.com/s/photos/space)
- [Parallax Effect Tutorial](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
