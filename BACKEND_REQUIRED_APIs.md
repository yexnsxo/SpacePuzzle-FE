# 🚨 백엔드 필수 구현 API (리더보드 작동을 위해)

## 📋 개요

프론트엔드에서 이미 API 호출 코드가 완성되어 있습니다.
백엔드에서 아래 API들을 구현하면 리더보드가 즉시 작동합니다.

---

## ⚡ 최우선 구현 API

### 1️⃣ **퍼즐 완료 기록 API** (리더보드의 기반)

#### **일반 천체 퍼즐 완료**
```http
POST /celestial-objects/{celestialId}/complete
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "playTime": 120  // 플레이 시간 (초 단위)
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "Puzzle completed successfully",
  "data": {
    "userId": "user-123",
    "stageId": "earth",
    "playTime": 120,
    "starsEarned": 3,
    "totalStars": 150
  }
}
```

**중요:**
- `playTime`을 `stage_completions` 테이블에 저장해야 합니다
- 같은 천체를 여러 번 플레이하면 **가장 빠른 기록으로 업데이트**
- 리더보드는 이 데이터를 기반으로 생성됩니다

---

#### **APOD 퍼즐 완료**
```http
POST /celestial-objects/apod/complete
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "playTime": 180,
  "date": "2026-01-19",
  "title": "The Moon and Mars"
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "APOD puzzle completed successfully",
  "data": {
    "userId": "user-123",
    "apodDate": "2026-01-19",
    "playTime": 180,
    "rewards": {
      "spaceParts": 1
    },
    "totalSpaceParts": 25
  }
}
```

**중요:**
- APOD는 날짜별로 별도 테이블에 저장 (`apod_completions`)
- 같은 날짜는 한 번만 완료 가능
- 우주 부품 1개 지급

---

### 2️⃣ **리더보드 조회 API**

#### **일반 천체 리더보드**
```http
GET /celestial-objects/{celestialId}/leaderboard
Authorization: Bearer {access_token}
```

**응답 예시:**
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

**중요:**
- `topPlayers`: 상위 5명만 반환
- `myRank`: 현재 로그인한 유저의 순위 (없으면 `null`)
- 순위는 `playTime` 오름차순 (빠를수록 높은 순위)

---

#### **APOD 리더보드**
```http
GET /celestial-objects/apod/leaderboard
Authorization: Bearer {access_token}
```

**응답 예시:**
```json
{
  "celestialId": "apod",
  "celestialName": "APOD",
  "topPlayers": [
    {
      "userId": "user789",
      "nickname": "ApodMaster",
      "playTime": 150,
      "starsEarned": 0,
      "rank": 1,
      "completedAt": "2026-01-19T09:15:00Z"
    }
  ],
  "myRank": {
    "userId": "currentUser",
    "nickname": "MyName",
    "playTime": 180,
    "starsEarned": 0,
    "rank": 2,
    "completedAt": "2026-01-19T10:00:00Z"
  }
}
```

**중요:**
- APOD는 **오늘 날짜의 기록만** 리더보드에 표시
- 매일 자정에 리더보드 초기화 (선택사항)
- 또는 모든 APOD 기록을 합산하여 표시 (선택사항)

---

### 3️⃣ **이미지 프록시 API** (CORS 우회)

```http
GET /api/proxy-image?url={encodedImageUrl}
```

**예시:**
```
GET /api/proxy-image?url=https%3A%2F%2Fapod.nasa.gov%2Fapod%2Fimage%2F2601%2Fmoon_mars_4k.jpg
```

**응답:**
- Content-Type: `image/jpeg` (또는 원본 이미지 타입)
- Body: 이미지 바이너리 데이터

**구현 예시 (Node.js):**
```javascript
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24시간 캐시
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});
```

---

## 📊 데이터베이스 스키마

### **stage_completions 테이블**
```sql
CREATE TABLE stage_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  stage_id VARCHAR(255) NOT NULL,  -- celestialId (예: "earth", "mars")
  play_time INTEGER NOT NULL,      -- 초 단위
  stars_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 같은 천체는 최고 기록으로 업데이트
  UNIQUE(user_id, stage_id)
);

-- 리더보드 조회 최적화 인덱스
CREATE INDEX idx_stage_leaderboard ON stage_completions(stage_id, play_time ASC, completed_at ASC);
CREATE INDEX idx_user_stage ON stage_completions(user_id, stage_id);
```

**중복 완료 처리:**
```sql
-- 기존 기록보다 빠른 경우에만 업데이트
INSERT INTO stage_completions (user_id, stage_id, play_time, stars_earned)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, stage_id)
DO UPDATE SET 
  play_time = CASE 
    WHEN stage_completions.play_time > EXCLUDED.play_time 
    THEN EXCLUDED.play_time 
    ELSE stage_completions.play_time 
  END,
  stars_earned = EXCLUDED.stars_earned,
  updated_at = CURRENT_TIMESTAMP;
```

---

### **apod_completions 테이블**
```sql
CREATE TABLE apod_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  apod_date DATE NOT NULL,
  apod_title VARCHAR(500),
  play_time INTEGER NOT NULL,
  reward_space_parts INTEGER DEFAULT 1,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 같은 날짜는 한 번만 완료 가능
  UNIQUE(user_id, apod_date)
);

CREATE INDEX idx_apod_user ON apod_completions(user_id);
CREATE INDEX idx_apod_date ON apod_completions(apod_date);
CREATE INDEX idx_apod_leaderboard ON apod_completions(apod_date, play_time ASC, completed_at ASC);
```

---

## 🔍 리더보드 SQL 쿼리

### **TOP 5 조회**
```sql
SELECT 
  u.id as "userId",
  u.nickname,
  sc.play_time as "playTime",
  sc.stars_earned as "starsEarned",
  sc.completed_at as "completedAt",
  ROW_NUMBER() OVER (
    ORDER BY sc.play_time ASC, sc.completed_at ASC
  ) as rank
FROM stage_completions sc
JOIN users u ON sc.user_id = u.id
WHERE sc.stage_id = $1  -- celestialId
ORDER BY sc.play_time ASC, sc.completed_at ASC
LIMIT 5;
```

### **현재 유저 순위 조회**
```sql
WITH ranked_completions AS (
  SELECT 
    user_id,
    play_time,
    stars_earned,
    completed_at,
    ROW_NUMBER() OVER (
      ORDER BY play_time ASC, completed_at ASC
    ) as rank
  FROM stage_completions
  WHERE stage_id = $1  -- celestialId
)
SELECT 
  u.id as "userId",
  u.nickname,
  rc.play_time as "playTime",
  rc.stars_earned as "starsEarned",
  rc.completed_at as "completedAt",
  rc.rank
FROM ranked_completions rc
JOIN users u ON rc.user_id = u.id
WHERE rc.user_id = $2;  -- currentUserId
```

---

## 🧪 테스트 방법

### 1. **퍼즐 완료 테스트**
```bash
# 천체 퍼즐 완료
curl -X POST https://spacepuzzle.onrender.com/celestial-objects/earth/complete \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"playTime": 120}'

# APOD 퍼즐 완료
curl -X POST https://spacepuzzle.onrender.com/celestial-objects/apod/complete \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"playTime": 180, "date": "2026-01-19", "title": "Test APOD"}'
```

### 2. **리더보드 조회 테스트**
```bash
# 천체 리더보드
curl https://spacepuzzle.onrender.com/celestial-objects/earth/leaderboard \
  -H "Authorization: Bearer {token}"

# APOD 리더보드
curl https://spacepuzzle.onrender.com/celestial-objects/apod/leaderboard \
  -H "Authorization: Bearer {token}"
```

### 3. **이미지 프록시 테스트**
```bash
curl "https://spacepuzzle.onrender.com/api/proxy-image?url=https%3A%2F%2Fapod.nasa.gov%2Fapod%2Fimage%2F2601%2Ftest.jpg"
```

---

## 🚨 현재 프론트엔드 동작

### **퍼즐 완료 시**
프론트엔드는 퍼즐 완료 시 자동으로 백엔드에 기록을 전송합니다:

```javascript
// PuzzleGame.jsx (642-670줄)
const response = await fetch(requestUrl, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody),
});
```

### **리더보드 조회 시**
- GamePlay.jsx: 천체 선택 시 자동으로 리더보드 조회
- ApodInfo.jsx: 페이지 로드 시 자동으로 APOD 리더보드 조회

### **콘솔 로그**
프론트엔드는 모든 API 호출을 콘솔에 로그로 남깁니다:
```
🔐 로그인 상태: 로그인됨
📡 APOD 리더보드 요청 시작...
📥 APOD 리더보드 응답: 404 Not Found
❌ APOD 리더보드 API 에러: 404 {"error":"Not Found"}
```

---

## ✅ 구현 완료 체크리스트

백엔드 팀은 다음을 구현하면 됩니다:

- [ ] `POST /celestial-objects/{celestialId}/complete` - 일반 퍼즐 완료
- [ ] `POST /celestial-objects/apod/complete` - APOD 퍼즐 완료
- [ ] `GET /celestial-objects/{celestialId}/leaderboard` - 일반 리더보드 조회
- [ ] `GET /celestial-objects/apod/leaderboard` - APOD 리더보드 조회
- [ ] `GET /api/proxy-image` - 이미지 프록시
- [ ] `stage_completions` 테이블 생성 및 인덱스
- [ ] `apod_completions` 테이블 생성 및 인덱스
- [ ] 중복 완료 처리 로직 (최고 기록 유지)
- [ ] 리더보드 순위 계산 로직 (playTime 오름차순)

---

**작성일:** 2026-01-19  
**프론트엔드 준비 완료:** ✅  
**백엔드 구현 대기 중:** ⏳
