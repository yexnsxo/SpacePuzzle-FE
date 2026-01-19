# 🚀 백엔드 API 명세서 (최종 버전)

## ✅ 프론트엔드와 통일된 API 명세

**중요:** URL 파라미터는 `{id}`를 사용합니다 (celestialId와 동일)

---

## 📡 API 엔드포인트 목록

### 1️⃣ **일반 천체 퍼즐 완료**

```http
POST /celestial-objects/{id}/complete
Authorization: Bearer {access_token}
Content-Type: application/json
```

**URL 파라미터:**
- `{id}`: 천체 ID (예: "kepler-186f", "earth", "mars", "NGC_1234")

**요청 Body:**
```json
{
  "playTime": 120
}
```

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "Puzzle completed successfully",
  "data": {
    "userId": "user-uuid",
    "stageId": "kepler-186f",
    "playTime": 120,
    "starsEarned": 3,
    "totalStars": 150
  }
}
```

**프론트엔드 호출 코드:**
```javascript
// PuzzleGame.jsx (650줄)
const response = await fetch(
  `https://spacepuzzle.onrender.com/celestial-objects/${celestialIdFromState}/complete`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ playTime: timeRef.current }),
  }
);
```

---

### 2️⃣ **APOD 퍼즐 완료**

```http
POST /celestial-objects/apod/complete
Authorization: Bearer {access_token}
Content-Type: application/json
```

**요청 Body:**
```json
{
  "playTime": 180,
  "date": "2026-01-19",
  "title": "The Moon and Mars"
}
```

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "APOD puzzle completed successfully",
  "data": {
    "userId": "user-uuid",
    "apodDate": "2026-01-19",
    "apodTitle": "The Moon and Mars",
    "playTime": 180,
    "completedAt": "2026-01-19T10:30:00.000Z",
    "rewardParts": 1
  }
}
```

**프론트엔드 호출 코드:**
```javascript
// PuzzleGame.jsx (642줄)
const response = await fetch(
  'https://spacepuzzle.onrender.com/celestial-objects/apod/complete',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playTime: timeRef.current,
      date: new Date().toISOString().split('T')[0],
      title: celestialBody.name || 'APOD'
    }),
  }
);
```

---

### 3️⃣ **일반 천체 리더보드 조회**

```http
GET /celestial-objects/{id}/leaderboard
Authorization: Bearer {access_token}
```

**URL 파라미터:**
- `{id}`: 천체 ID (예: "kepler-186f", "earth", "mars", "NGC_1234")

**응답 (200 OK):**
```json
{
  "celestialId": "kepler-186f",
  "celestialName": "케플러-186f",
  "topPlayers": [
    {
      "userId": "user-123",
      "nickname": "SpeedRunner",
      "playTime": 85,
      "starsEarned": 3,
      "rank": 1,
      "completedAt": "2026-01-18T10:30:00.000Z"
    },
    {
      "userId": "user-456",
      "nickname": "FastSolver",
      "playTime": 108,
      "starsEarned": 2,
      "rank": 2,
      "completedAt": "2026-01-17T14:20:00.000Z"
    }
    // ... 최대 5명
  ],
  "myRank": {
    "userId": "current-user-id",
    "nickname": "MyName",
    "playTime": 260,
    "starsEarned": 2,
    "rank": 15,
    "completedAt": "2026-01-16T12:00:00.000Z"
  }
}
```

**프론트엔드 호출 코드:**
```javascript
// GamePlay.jsx (357줄)
const response = await fetch(
  `https://spacepuzzle.onrender.com/celestial-objects/${body.id}/leaderboard`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

### 4️⃣ **APOD 리더보드 조회**

```http
GET /celestial-objects/apod/leaderboard
Authorization: Bearer {access_token}
```

**응답 (200 OK):**
```json
{
  "celestialId": "apod",
  "celestialName": "APOD",
  "topPlayers": [
    {
      "userId": "user-789",
      "nickname": "ApodMaster",
      "playTime": 150,
      "starsEarned": 0,
      "rank": 1,
      "completedAt": "2026-01-19T09:15:00.000Z"
    }
    // ... 최대 5명
  ],
  "myRank": {
    "userId": "current-user-id",
    "nickname": "MyName",
    "playTime": 180,
    "starsEarned": 0,
    "rank": 2,
    "completedAt": "2026-01-19T10:00:00.000Z"
  }
}
```

**프론트엔드 호출 코드:**
```javascript
// ApodInfo.jsx (69줄)
const response = await fetch(
  'https://spacepuzzle.onrender.com/celestial-objects/apod/leaderboard',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

### 5️⃣ **이미지 프록시 API**

```http
GET /api/proxy-image?url={encodedImageUrl}
```

**Query Parameters:**
- `url`: 인코딩된 이미지 URL (필수)

**예시:**
```
GET /api/proxy-image?url=https%3A%2F%2Fapod.nasa.gov%2Fapod%2Fimage%2F2601%2Fmoon_mars_4k.jpg
```

**응답:**
- **Content-Type**: `image/jpeg` (또는 원본 이미지 타입)
- **Headers**:
  - `Access-Control-Allow-Origin: *`
  - `Cache-Control: public, max-age=86400`
- **Body**: 이미지 바이너리 데이터

**프론트엔드 사용 코드:**
```javascript
// ApodInfo.jsx, GamePlay.jsx, StageInfo.jsx
const proxyImageUrl = `https://spacepuzzle.onrender.com/api/proxy-image?url=${encodeURIComponent(originalImageUrl)}`;

<img
  src={proxyImageUrl}
  onError={(e) => {
    // 프록시 실패 시 원본 이미지로 폴백
    e.target.src = originalImageUrl;
  }}
/>
```

---

## 🗄️ 데이터베이스 스키마

### **stage_completions 테이블**

```sql
CREATE TABLE stage_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  stage_id VARCHAR(255) NOT NULL,  -- 천체 ID (celestialId와 동일)
  play_time INTEGER NOT NULL,      -- 초 단위
  stars_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 같은 천체는 최고 기록으로 업데이트
  UNIQUE(user_id, stage_id)
);

-- 리더보드 조회 최적화 인덱스
CREATE INDEX idx_stage_leaderboard 
  ON stage_completions(stage_id, play_time ASC, completed_at ASC);

CREATE INDEX idx_user_stage 
  ON stage_completions(user_id, stage_id);
```

**중복 완료 처리 (최고 기록만 유지):**
```sql
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
  play_time INTEGER NOT NULL,      -- 초 단위
  reward_space_parts INTEGER DEFAULT 1,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 같은 날짜는 한 번만 완료 가능
  UNIQUE(user_id, apod_date)
);

CREATE INDEX idx_apod_user ON apod_completions(user_id);
CREATE INDEX idx_apod_date ON apod_completions(apod_date);
CREATE INDEX idx_apod_leaderboard 
  ON apod_completions(apod_date, play_time ASC, completed_at ASC);
```

---

## 🔍 리더보드 SQL 쿼리

### **일반 천체 TOP 5 조회**

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
WHERE sc.stage_id = $1  -- celestialId (URL의 {id})
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
  WHERE stage_id = $1  -- celestialId (URL의 {id})
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

### **APOD 리더보드 (오늘 날짜만)**

```sql
-- 오늘 날짜의 TOP 5
SELECT 
  u.id as "userId",
  u.nickname,
  ac.play_time as "playTime",
  0 as "starsEarned",  -- APOD는 별 없음
  ac.completed_at as "completedAt",
  ROW_NUMBER() OVER (
    ORDER BY ac.play_time ASC, ac.completed_at ASC
  ) as rank
FROM apod_completions ac
JOIN users u ON ac.user_id = u.id
WHERE ac.apod_date = CURRENT_DATE  -- 오늘 날짜만
ORDER BY ac.play_time ASC, ac.completed_at ASC
LIMIT 5;

-- 현재 유저 순위 (오늘 날짜)
WITH ranked_completions AS (
  SELECT 
    user_id,
    play_time,
    completed_at,
    ROW_NUMBER() OVER (
      ORDER BY play_time ASC, completed_at ASC
    ) as rank
  FROM apod_completions
  WHERE apod_date = CURRENT_DATE  -- 오늘 날짜만
)
SELECT 
  u.id as "userId",
  u.nickname,
  rc.play_time as "playTime",
  0 as "starsEarned",
  rc.completed_at as "completedAt",
  rc.rank
FROM ranked_completions rc
JOIN users u ON rc.user_id = u.id
WHERE rc.user_id = $1;  -- currentUserId
```

---

## 📝 중요 참고 사항

### 1. **URL 파라미터 통일**
- ✅ 모든 API는 `{id}`를 사용 (`{nasaId}` ❌)
- `{id}`는 천체의 Primary Key (celestialId)
- 프론트엔드에서 `body.id` 또는 `celestialBody.id`로 전달

### 2. **playTime 단위**
- **초(seconds) 단위**로 전달
- 소수점 포함 가능 (예: 120.5초)
- 데이터베이스에는 INTEGER 또는 DECIMAL로 저장

### 3. **리더보드 순위 계산**
- **playTime 오름차순** (빠를수록 높은 순위)
- 동일 시간일 경우 **completedAt 오름차순** (먼저 완료한 사람 우선)
- TOP 5만 반환
- 현재 유저가 없으면 `myRank: null`

### 4. **중복 완료 처리**
- 같은 천체를 여러 번 완료하면 **최고 기록(가장 빠른 시간)**으로 업데이트
- 첫 완료 시에만 별 지급
- APOD는 같은 날짜 한 번만 완료 가능

### 5. **APOD 특이사항**
- 날짜별로 별도 관리 (`apod_completions` 테이블)
- 별 지급 없음 (`starsEarned: 0`)
- 우주 부품 1개 지급
- 리더보드는 **오늘 날짜만** 표시

---

## 🧪 테스트 방법

### 1. **퍼즐 완료 테스트**

```bash
# 일반 천체 퍼즐 완료
curl -X POST https://spacepuzzle.onrender.com/celestial-objects/kepler-186f/complete \
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
# 일반 천체 리더보드
curl https://spacepuzzle.onrender.com/celestial-objects/kepler-186f/leaderboard \
  -H "Authorization: Bearer {token}"

# APOD 리더보드
curl https://spacepuzzle.onrender.com/celestial-objects/apod/leaderboard \
  -H "Authorization: Bearer {token}"
```

---

## ❌ 에러 응답

### **400 Bad Request**
```json
{
  "error": "playTime이 필요합니다."
}
```

### **401 Unauthorized**
```json
{
  "error": "인증이 필요합니다."
}
```

### **404 Not Found**
```json
{
  "error": "천체를 찾을 수 없습니다."
}
```

### **500 Internal Server Error**
```json
{
  "error": "서버 에러"
}
```

---

## ✅ 구현 체크리스트

백엔드 팀은 다음을 구현하면 됩니다:

- [ ] `POST /celestial-objects/{id}/complete` - 일반 퍼즐 완료 (⚠️ `{id}` 사용)
- [ ] `POST /celestial-objects/apod/complete` - APOD 퍼즐 완료
- [ ] `GET /celestial-objects/{id}/leaderboard` - 일반 리더보드 조회 (⚠️ `{id}` 사용)
- [ ] `GET /celestial-objects/apod/leaderboard` - APOD 리더보드 조회
- [ ] `GET /api/proxy-image` - 이미지 프록시
- [ ] `stage_completions` 테이블 생성 및 인덱스
- [ ] `apod_completions` 테이블 생성 및 인덱스
- [ ] 중복 완료 처리 로직 (최고 기록 유지)
- [ ] 리더보드 순위 계산 로직 (playTime 오름차순)

---

**작성일:** 2026-01-19  
**버전:** 2.0 (프론트엔드 통일)  
**변경사항:** URL 파라미터를 `{nasaId}`에서 `{id}`로 변경
