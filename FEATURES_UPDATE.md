# 🎮 업적/리더보드/갤러리 구현 명세서

## 📋 개요

### ❌ 제거된 기능
- 업적 시스템
- 뱃지 시스템

### ✅ 구현된 기능
- 리더보드 (GamePlay 화면 통합)
- 갤러리 (클리어한 천체 표시)

---

## 🏆 리더보드

### 위치
**GamePlay.jsx** - 천체 선택 시 나오는 **스테이지 정보창** 내부

### 표시 타이밍
- 천체 **미선택**: 리더보드 안 보임
- 천체 **선택 후**: 상세 정보창 내부에 해당 천체 리더보드 표시

### UI 구성
```
┌────────────────────────────────────┐
│ 🌍 지구                             │
│ 난이도: ★★☆☆☆                      │
│ 격자: 3x3                           │
│ 보상: ⭐ 1~3개                      │
├────────────────────────────────────┤
│                                     │
│ 🏆 리더보드 - TOP 5                 │
│                                     │
│ 🥇 SpaceMaster                      │
│    ⏱️ 1분 25초 | ⭐ 3               │
│                                     │
│ 🥈 PuzzleKing                       │
│    ⏱️ 1분 48초 | ⭐ 3               │
│                                     │
│ 🥉 StarHunter                       │
│    ⏱️ 2분 05초 | ⭐ 3               │
│                                     │
│ 4위 CosmicPro                       │
│    ⏱️ 2분 30초 | ⭐ 2               │
│                                     │
│ 5위 NebulaMaster                    │
│    ⏱️ 3분 12초 | ⭐ 2               │
│                                     │
├────────────────────────────────────┤
│ 📍 내 기록                          │
│                                     │
│ 15위 | ⏱️ 4분 20초 | ⭐ 2           │
│                                     │
│ 💡 5위권까지 1분 08초 단축 필요!    │
└────────────────────────────────────┘

        [퍼즐 시작하기 →]
```

---

## 🔌 리더보드 API

### 엔드포인트
```
GET /celestial-objects/{celestialId}/leaderboard
```

### 헤더
```javascript
Authorization: Bearer {access_token}
```

### 요청 예시
```
GET /celestial-objects/earth/leaderboard
```

### 응답 예시
```json
{
  "celestialId": "earth",
  "celestialName": "지구",
  "topPlayers": [
    {
      "userId": "user123",
      "nickname": "SpaceMaster",
      "playTime": 85,
      "starsEarned": 3,
      "rank": 1,
      "completedAt": "2026-01-18T10:30:00Z"
    },
    {
      "userId": "user456",
      "nickname": "PuzzleKing",
      "playTime": 108,
      "starsEarned": 3,
      "rank": 2,
      "completedAt": "2026-01-17T14:20:00Z"
    },
    {
      "userId": "user789",
      "nickname": "StarHunter",
      "playTime": 125,
      "starsEarned": 3,
      "rank": 3,
      "completedAt": "2026-01-19T09:15:00Z"
    }
  ],
  "myRank": {
    "userId": "currentUser",
    "nickname": "MyName",
    "playTime": 260,
    "starsEarned": 2,
    "rank": 15,
    "completedAt": "2026-01-16T12:00:00Z"
  }
}
```

### 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| `celestialId` | String | 천체 ID |
| `celestialName` | String | 천체 이름 |
| `topPlayers` | Array | 상위 5명 |
| `myRank` | Object | 현재 유저 순위 (미플레이 시 null) |
| `userId` | String | 유저 ID |
| `nickname` | String | 닉네임 |
| `playTime` | Number | 플레이 시간 (초) |
| `starsEarned` | Number | 획득한 별 개수 (1~3) |
| `rank` | Number | 순위 |
| `completedAt` | String | 클리어 시간 (ISO 8601) |

### 정렬 기준
1. 별 개수 (내림차순)
2. 플레이 시간 (오름차순)
3. 클리어 시간 (오름차순 - 먼저 깬 사람 우선)

---

## 💻 프론트엔드 구현 (리더보드)

### GamePlay.jsx 수정사항

#### 1. 천체 선택 시 리더보드 데이터 가져오기
```javascript
const [selectedCelestial, setSelectedCelestial] = useState(null);
const [leaderboard, setLeaderboard] = useState(null);

const handleSelectCelestial = async (celestial) => {
  setSelectedCelestial(celestial);
  
  // 게스트가 아닐 때만 리더보드 가져오기
  if (isAuthenticated()) {
    try {
      const response = await axios.get(
        `${baseURL}/celestial-objects/${celestial.id}/leaderboard`,
        { headers: getAuthHeaders() }
      );
      setLeaderboard(response.data);
    } catch (error) {
      console.error('리더보드 불러오기 실패:', error);
    }
  }
};
```

#### 2. 스테이지 정보창에 리더보드 표시
```javascript
{selectedCelestial && (
  <div className="stage-info-panel">
    <h2>{selectedCelestial.name}</h2>
    <p>난이도: {selectedCelestial.difficulty}</p>
    
    {/* 리더보드 섹션 */}
    {isAuthenticated() ? (
      leaderboard && (
        <div className="leaderboard-section">
          <h3>🏆 리더보드 - TOP 5</h3>
          {leaderboard.topPlayers.map((player, idx) => (
            <div key={player.userId} className="leaderboard-item">
              <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}위`}</span>
              <span>{player.nickname}</span>
              <span>⏱️ {formatTime(player.playTime)}</span>
              <span>⭐ {player.starsEarned}</span>
            </div>
          ))}
          
          {leaderboard.myRank && (
            <div className="my-rank">
              <p>📍 내 기록</p>
              <p>{leaderboard.myRank.rank}위 | ⏱️ {formatTime(leaderboard.myRank.playTime)} | ⭐ {leaderboard.myRank.starsEarned}</p>
            </div>
          )}
        </div>
      )
    ) : (
      <div className="guest-notice">
        🔒 로그인하고 전 세계 유저와 경쟁하세요!
      </div>
    )}
    
    <button onClick={() => startPuzzle(selectedCelestial)}>
      퍼즐 시작하기 →
    </button>
  </div>
)}
```

#### 3. 시간 포맷 함수
```javascript
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}분 ${secs.toString().padStart(2, '0')}초`;
};
```

---

## 🖼️ 갤러리

### 위치
**Lobby.jsx** - 갤러리 방 (왼쪽 화살표로 이동)

### UI 구성
```
🖼️ 갤러리
클리어한 천체들을 감상하세요

┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│   🌍   │ │   🔴   │ │   🪐   │ │   🌙   │
│  지구  │ │  화성  │ │  목성  │ │   달   │
│ ✓ 완료 │ │ ✓ 완료 │ │ ✓ 완료 │ │ ✓ 완료 │
│  ⭐3   │ │  ⭐2   │ │  ⭐3   │ │  ⭐1   │
└────────┘ └────────┘ └────────┘ └────────┘
```

### 빈 갤러리
```
📭
아직 클리어한 천체가 없습니다
퍼즐을 완료하면 여기에 표시됩니다!

[퍼즐 플레이하러 가기 →]
```

### 레이아웃
- 4열 그리드
- 세로 스크롤
- 최근 클리어한 순서대로 표시

---

## 🔌 갤러리 API

### 엔드포인트
```
GET /user/gallery
```

### 헤더
```javascript
Authorization: Bearer {access_token}
```

### 응답 예시
```json
{
  "clearedCelestials": [
    {
      "id": "earth",
      "name": "지구",
      "nameEn": "Earth",
      "sectorId": 1,
      "sectorName": "태양계",
      "image": "https://example.com/earth.jpg",
      "starsEarned": 3,
      "clearedAt": "2026-01-15T10:30:00Z",
      "playTime": 180
    },
    {
      "id": "mars",
      "name": "화성",
      "nameEn": "Mars",
      "sectorId": 1,
      "sectorName": "태양계",
      "image": "https://example.com/mars.jpg",
      "starsEarned": 2,
      "clearedAt": "2026-01-16T14:20:00Z",
      "playTime": 240
    }
  ],
  "totalCleared": 2,
  "totalStars": 5
}
```

### 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| `clearedCelestials` | Array | 클리어한 천체 목록 |
| `id` | String | 천체 ID |
| `name` | String | 천체 이름 (한글) |
| `nameEn` | String | 천체 이름 (영문) |
| `sectorId` | Number | 섹터 ID |
| `image` | String | 천체 이미지 URL |
| `starsEarned` | Number | 획득한 별 개수 |
| `clearedAt` | String | 클리어 시간 (ISO 8601) |
| `playTime` | Number | 플레이 시간 (초) |
| `totalCleared` | Number | 총 클리어 개수 |
| `totalStars` | Number | 획득한 총 별 |

### 정렬 순서
최근 클리어한 순 (clearedAt 내림차순)

---

## 💾 백엔드 구현 가이드

### 리더보드 쿼리
```sql
-- 천체별 상위 5명
SELECT 
  u.id as userId,
  u.nickname,
  sc.play_time as playTime,
  sc.stars_earned as starsEarned,
  sc.completed_at as completedAt,
  ROW_NUMBER() OVER (
    ORDER BY sc.stars_earned DESC, sc.play_time ASC, sc.completed_at ASC
  ) as rank
FROM stage_completions sc
JOIN users u ON sc.user_id = u.id
WHERE sc.stage_id = {celestialId}
ORDER BY sc.stars_earned DESC, sc.play_time ASC, sc.completed_at ASC
LIMIT 5;

-- 내 순위 (해당 천체)
SELECT 
  u.id as userId,
  u.nickname,
  sc.play_time as playTime,
  sc.stars_earned as starsEarned,
  sc.completed_at as completedAt,
  (
    SELECT COUNT(*) + 1
    FROM stage_completions sc2
    WHERE sc2.stage_id = {celestialId}
      AND (
        sc2.stars_earned > sc.stars_earned
        OR (sc2.stars_earned = sc.stars_earned AND sc2.play_time < sc.play_time)
        OR (sc2.stars_earned = sc.stars_earned AND sc2.play_time = sc.play_time AND sc2.completed_at < sc.completed_at)
      )
  ) as rank
FROM stage_completions sc
JOIN users u ON sc.user_id = u.id
WHERE sc.stage_id = {celestialId}
  AND sc.user_id = {currentUserId};
```

### 갤러리 쿼리
```sql
-- 클리어한 천체 목록
SELECT 
  co.id,
  co.name,
  co.name_en as nameEn,
  co.sector_id as sectorId,
  s.name as sectorName,
  co.image_url as image,
  sc.stars_earned as starsEarned,
  sc.completed_at as clearedAt,
  sc.play_time as playTime
FROM stage_completions sc
JOIN celestial_objects co ON sc.stage_id = co.id
JOIN sectors s ON co.sector_id = s.id
WHERE sc.user_id = {userId}
ORDER BY sc.completed_at DESC;
```

---

## 🎮 게스트 모드

### 리더보드
게스트는 리더보드를 볼 수 없음 (로그인 필요)
스테이지 정보창에 "🔒 로그인하고 전 세계 유저와 경쟁하세요!" 메시지 표시

### 갤러리
게스트는 `localStorage` 사용:
```javascript
// 저장
localStorage.setItem('guestClearedCelestials', JSON.stringify([
  {
    id: 'earth',
    name: '지구',
    image: '...',
    starsEarned: 3,
    clearedAt: '2026-01-19T...'
  }
]));

// 불러오기
const guestCleared = JSON.parse(
  localStorage.getItem('guestClearedCelestials') || '[]'
);
```

---

## ✅ 구현 체크리스트

### 리더보드
- [ ] 천체별 상위 5명 조회 API
- [ ] 내 순위 계산 API
- [ ] 별 개수 우선, 플레이 시간 기준 정렬
- [ ] 플레이 시간 표시 (분:초 형식)
- [ ] 메달 이모지 표시 (1~3위)
- [ ] 스테이지 정보창 내부에 표시
- [ ] 게스트 모드 안내 메시지

### 갤러리
- [ ] 클리어한 천체 목록 API
- [ ] 최근 클리어 순 정렬
- [ ] 천체 이미지 표시
- [ ] 획득 별 표시
- [ ] 빈 갤러리 안내 메시지

---

**끝!** 🎉
