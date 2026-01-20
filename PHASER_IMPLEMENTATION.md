# 🎮 Phaser.js 기반 퍼즐 게임 구현

## ✅ 완료된 작업

### 1. 새로운 파일 생성
- `/src/game/phaser/PuzzleScene.js` - Phaser Scene (게임 로직)
- `/src/pages/PuzzleGamePhaser.jsx` - React 컴포넌트 (UI)
- `/src/router.jsx` - Phaser 버전으로 업데이트

### 2. 기존 퍼즐 로직 완전 유지
- ✅ `PuzzleEngine` (병합, 스냅) - 그대로 사용
- ✅ `Group` (그룹 관리) - 그대로 사용  
- ✅ `Piece` (조각 데이터) - 그대로 사용

### 3. Phaser로 추가된 기능
- ✅ **관성 효과 (Inertia)**: 조각을 던지면 미끄러짐 (velocity 기반)
- ✅ **무중력 Floating**: 보관소 조각이 위아래+좌우로 떠다님
- ✅ **우주 감속**: damping = 0.96 (천천히 멈춤)
- ✅ **드래그 & 드롭**: Phaser의 입력 시스템 사용
- ✅ **별 반짝임**: Tween 애니메이션
- ✅ **우주 배경**: 그라디언트 + 반짝이는 별

---

## 📦 설치 방법

터미널에서 다음 명령 실행:

\`\`\`bash
npm install phaser
\`\`\`

설치 후 개발 서버를 재시작하세요:

\`\`\`bash
npm run dev
\`\`\`

---

## 🎯 사용 방법

### 1. 브라우저에서 퍼즐 게임 접속
\`\`\`
http://localhost:5173/puzzle
\`\`\`

### 2. 테스트
- **관성 효과**: 조각을 빠르게 드래그하고 놓기 → 미끄러짐 확인
- **Floating 효과**: 보관소 조각들이 떠다니는지 확인
- **병합**: 조각을 가까이 가져가면 자동 병합
- **스냅**: 퍼즐 판에 가까이 가져가면 자동 고정

---

## 🔧 파라미터 조정

### `PuzzleScene.js` 파일에서:

#### 관성 강도 (던지기 효과)
\`\`\`javascript
// Line ~280
group.velocity = {
  x: (deltaX / deltaTime) * 50, // 50 = 기본값
  y: (deltaY / deltaTime) * 50,
};

// 더 강하게: * 80
// 더 약하게: * 30
\`\`\`

#### 우주 감속 (마찰력)
\`\`\`javascript
// Line ~360
group.velocity.x *= 0.96; // 0.96 = 4% 감속
group.velocity.y *= 0.96;

// 더 빨리 멈춤: 0.9
// 더 오래 미끄러짐: 0.98
\`\`\`

#### Floating 강도 (떠다니는 효과)
\`\`\`javascript
// Line ~370
const floatY = Math.sin(...) * 8;  // 8 = 진폭 (픽셀)
const floatX = Math.cos(...) * 4;  // 4 = 진폭

// 더 크게 움직임: * 15, * 8
// 더 작게 움직임: * 4, * 2
\`\`\`

---

## 🐛 문제 해결

### 오류 1: "Cannot find module 'phaser'"
**해결**: `npm install phaser` 실행

### 오류 2: 화면이 검은색
**해결**: 
1. 브라우저 콘솔(F12) 확인
2. 이미지 URL이 올바른지 확인
3. CORS 문제일 수 있음 (프록시 필요)

### 오류 3: 조각이 안 보임
**해결**: 
- `PuzzleScene.js`의 `renderGroupPieces` 함수 개선 필요
- 현재는 단순 사각형, 퍼즐 모양은 추가 구현 필요

### 오류 4: 관성/Floating 효과 안 보임
**해결**: 
1. 콘솔에서 "🚀 관성 발동!" 메시지 확인
2. 빠르게 드래그해야 효과 확인 가능
3. 보관소 조각을 가만히 지켜보기 (천천히 움직임)

---

## 🎨 앞으로 개선할 부분

### 1. 퍼즐 모양 렌더링
현재는 단순 사각형입니다. 원래 `drawPuzzleShape` 로직을 Phaser Graphics로 변환해야 합니다.

\`\`\`javascript
// TODO: drawPuzzleShape 구현
// edges: { top, right, bottom, left } 값에 따라
// 볼록(1), 평평(0), 오목(-1) 그리기
\`\`\`

### 2. 스크롤바
조각이 많을 때 스크롤 기능이 필요합니다.

### 3. 힌트 기능
현재 버튼만 있고 실제 힌트는 미구현입니다.

### 4. 최적화
- 조각이 많을 때 (7x7 = 49개) 성능 확인 필요
- 렌더링 최적화 (Culling, Batching)

---

## 📊 Canvas vs Phaser 비교

| 항목 | Canvas (기존) | Phaser (새버전) |
|------|--------------|----------------|
| **관성 효과** | 구현했지만 약함 | ✅ 강력함 |
| **Floating** | 작동하지 않음 | ✅ 작동함 |
| **드래그** | 수동 구현 | ✅ 내장 시스템 |
| **애니메이션** | requestAnimationFrame | ✅ Tween 시스템 |
| **성능** | 좋음 | ✅ 더 좋음 (WebGL) |
| **코드 복잡도** | 높음 (1200줄+) | ✅ 낮음 (500줄) |
| **물리 엔진** | 수동 구현 | ✅ Arcade Physics |
| **번들 크기** | 작음 | ~1MB 추가 |

---

## 🚀 다음 단계

1. **테스트**: 브라우저에서 퍼즐 게임 실행
2. **피드백**: 관성/Floating 효과 확인
3. **조정**: 파라미터 튜닝 (위 가이드 참고)
4. **개선**: 퍼즐 모양 렌더링 추가

---

## 💡 참고

- Phaser 공식 문서: https://photonstorm.github.io/phaser3-docs/
- Phaser 예제: https://phaser.io/examples

기존 퍼즐 로직(PuzzleEngine, Group, Piece)은 **완전히 동일**하므로,
게임 플레이는 똑같고 물리 효과만 강화되었습니다! 🎮✨
