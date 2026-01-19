# 🏆 리더보드 API 명세서

## 📋 개요

각 천체(퍼즐 스테이지)별로 유저들의 플레이 기록을 순위화하여 제공하는 API입니다.

---

## 🔌 API 엔드포인트

### 천체별 리더보드 조회

```
GET /celestial-objects/{celestialId}/leaderboard
```

### 설명
특정 천체의 상위 5명과 현재 유저의 순위 정보를 반환합니다.

---

## 📥 요청 (Request)

### URL Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `celestialId` | String | ✅ | 천체 ID (예: "earth", "mars", "jupiter") |

### Headers
```http
Authorization: Bearer {access_token}
```

### 요청 예시
```http
GET /celestial-objects/earth/leaderboard HTTP/1.1
Host: spacepuzzle.onrender.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📤 응답 (Response)

### 성공 응답 (200 OK)

#### 응답 예시
```json
{
  "celestialId": "earth",
  "celestialName": "지구",
  "topPlayers": [
    {
      "userId": "user123",
      "nickname": "SpeedRunner",
      "playTime": 85,
      "starsEarned": 3,
      "rank": 1,
      "completedAt": "2026-01-18T10:30:00Z"
    },
    {
      "userId": "user456",
      "nickname": "FastSolver",
      "playTime": 108,
      "starsEarned": 2,
      "rank": 2,
      "completedAt": "2026-01-17T14:20:00Z"
    },
    {
      "userId": "user789",
      "nickname": "QuickMaster",
      "playTime": 125,
      "starsEarned": 3,
      "rank": 3,
      "completedAt": "2026-01-19T09:15:00Z"
    },
    {
      "userId": "user012",
      "nickname": "PuzzlePro",
      "playTime": 150,
      "starsEarned": 1,
      "rank": 4,
      "completedAt": "2026-01-16T11:45:00Z"
    },
    {
      "userId": "user345",
      "nickname": "StarGazer",
      "playTime": 192,
      "starsEarned": 3,
      "rank": 5,
      "completedAt": "2026-01-15T16:30:00Z"
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

#### 필드 설명

##### 최상위 필드
| 필드 | 타입 | 설명 |
|------|------|------|
| `celestialId` | String | 천체 ID |
| `celestialName` | String | 천체 이름 (한글) |
| `topPlayers` | Array | 상위 5명의 플레이어 목록 |
| `myRank` | Object \| null | 현재 유저의 순위 정보 (미플레이 시 null) |

##### topPlayers / myRank 객체
| 필드 | 타입 | 설명 |
|------|------|------|
| `userId` | String | 유저 ID |
| `nickname` | String | 유저 닉네임 |
| `playTime` | Number | 플레이 시간 (초 단위) |
| `starsEarned` | Number | 획득한 별 개수 (1~3) |
| `rank` | Number | 순위 (1부터 시작) |
| `completedAt` | String | 클리어 시간 (ISO 8601 형식) |

---

## 📊 순위 계산 로직

### 정렬 기준
**플레이 시간 (playTime)** - 오름차순 (빠를수록 높은 순위)

- 가장 빠르게 완료한 사람이 1위
- 동일한 시간일 경우, 먼저 클리어한 사람 우선

### 예시
```
1위: 85초   (가장 빠름)
2위: 108초  (2번째로 빠름)
3위: 125초  (3번째로 빠름)
4위: 150초  
5위: 192초  (가장 느림)
```

---

## 🗄️ 데이터베이스 쿼리

### 상위 5명 조회
```sql
SELECT 
  u.id as userId,
  u.nickname,
  sc.play_time as playTime,
  sc.stars_earned as starsEarned,
  sc.completed_at as completedAt,
  ROW_NUMBER() OVER (
    ORDER BY 
      sc.play_time ASC, 
      sc.completed_at ASC
  ) as rank
FROM stage_completions sc
JOIN users u ON sc.user_id = u.id
WHERE sc.stage_id = :celestialId
ORDER BY 
  sc.play_time ASC, 
  sc.completed_at ASC
LIMIT 5;
```

### 현재 유저 순위 조회
```sql
SELECT 
  u.id as userId,
  u.nickname,
  sc.play_time as playTime,
  sc.stars_earned as starsEarned,
  sc.completed_at as completedAt,
  (
    SELECT COUNT(*) + 1
    FROM stage_completions sc2
    WHERE sc2.stage_id = :celestialId
      AND (
        sc2.play_time < sc.play_time
        OR (
          sc2.play_time = sc.play_time 
          AND sc2.completed_at < sc.completed_at
        )
      )
  ) as rank
FROM stage_completions sc
JOIN users u ON sc.user_id = u.id
WHERE sc.stage_id = :celestialId
  AND sc.user_id = :currentUserId;
```

---

## ⚠️ 에러 응답

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "유효하지 않은 토큰입니다."
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "해당 천체를 찾을 수 없습니다."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "서버 오류가 발생했습니다."
}
```

---

## 🎮 프론트엔드 사용 예시

### JavaScript (Fetch API)
```javascript
const fetchLeaderboard = async (celestialId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    if (!accessToken) {
      console.log('로그인이 필요합니다.');
      return null;
    }

    const response = await fetch(
      `https://spacepuzzle.onrender.com/celestial-objects/${celestialId}/leaderboard`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('리더보드 불러오기 실패:', error);
    return null;
  }
};

// 사용
const leaderboard = await fetchLeaderboard('earth');
console.log('TOP 5:', leaderboard.topPlayers);
console.log('내 순위:', leaderboard.myRank);
```

### React 컴포넌트 예시
```jsx
const [leaderboard, setLeaderboard] = useState(null);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  const loadLeaderboard = async () => {
    setIsLoading(true);
    const data = await fetchLeaderboard(celestialId);
    setLeaderboard(data);
    setIsLoading(false);
  };
  
  if (celestialId) {
    loadLeaderboard();
  }
}, [celestialId]);

// 렌더링
{isLoading ? (
  <div>로딩 중...</div>
) : leaderboard ? (
  <div>
    <h3>🏆 TOP 5</h3>
    {leaderboard.topPlayers.map((player, idx) => (
      <div key={player.userId}>
        <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}위`}</span>
        <span>{player.nickname}</span>
        <span>⏱️ {formatTime(player.playTime)}</span>
        <span>⭐ {player.starsEarned}</span>
      </div>
    ))}
    
    {leaderboard.myRank && (
      <div>
        <h4>📍 내 기록</h4>
        <p>{leaderboard.myRank.rank}위</p>
      </div>
    )}
  </div>
) : (
  <div>리더보드를 불러올 수 없습니다.</div>
)}
```

---

## 📝 참고 사항

### 1. 인증
- 게스트 유저는 리더보드를 볼 수 없습니다.
- 유효한 `access_token`이 필요합니다.

### 2. 데이터 갱신
- 퍼즐 완료 시 자동으로 순위가 업데이트됩니다.
- 같은 천체를 여러 번 플레이한 경우, **최고 기록(가장 빠른 플레이 시간)**만 순위에 반영됩니다.

### 3. 미플레이 유저
- 해당 천체를 한 번도 플레이하지 않은 유저의 경우 `myRank`는 `null`로 반환됩니다.

### 4. 빈 리더보드
- 아무도 플레이하지 않은 천체의 경우 `topPlayers`는 빈 배열 `[]`로 반환됩니다.

---

## ✅ 테스트 체크리스트

### 백엔드
- [ ] 천체 ID로 리더보드 조회 가능
- [ ] 플레이 시간 순으로 정렬 (빠를수록 높은 순위)
- [ ] 동일 시간일 경우 먼저 클리어한 사람 우선
- [ ] 상위 5명만 반환
- [ ] 현재 유저 순위 정확히 계산
- [ ] 미플레이 시 `myRank: null` 반환
- [ ] 빈 리더보드 시 `topPlayers: []` 반환
- [ ] 유효하지 않은 토큰 시 401 에러
- [ ] 존재하지 않는 천체 ID 시 404 에러

### 프론트엔드
- [ ] 천체 선택 시 리더보드 로딩
- [ ] TOP 5 표시 (메달 이모지 포함)
- [ ] 내 순위 표시
- [ ] 미플레이 시 안내 메시지
- [ ] 게스트는 로그인 안내 메시지
- [ ] 플레이 시간 포맷팅 (분:초)
- [ ] 로딩 상태 표시
- [ ] 에러 처리

---

**작성일:** 2026-01-19  
**버전:** 1.0  
**담당:** 프론트엔드 팀
