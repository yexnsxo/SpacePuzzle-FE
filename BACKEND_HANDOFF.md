# 🚀 백엔드 팀 전달 사항

## 📋 API 명세서 문서 목록

프론트엔드에서 백엔드로 전달하는 API 명세서입니다. 각 문서는 상세한 요청/응답 형식, 예시 코드, 데이터베이스 스키마까지 포함하고 있습니다.

---

## 📚 필수 구현 API 명세서

### 1️⃣ **`BACKEND_API_SPEC.md`** ⭐ 최우선
**메인 백엔드 API 명세서**

**포함 내용:**
- ✅ 로그인/유저 관리 (`/auth/login`, `/me`)
- ✅ 섹터 조회 (`/sectors`, `/sectors/{slug}/celestial-objects`)
- ✅ 천체 목록 조회
- ✅ 퍼즐 완료 처리 (`/celestial-objects/{id}/complete`)
- ✅ 도감(클리어 기록) 조회 (`/me/cleared-celestial-objects`)

**Base URL:** `https://spacepuzzle.onrender.com`

---

### 2️⃣ **`LEADERBOARD_API.md`** 🏆 최우선
**리더보드 시스템 API**

**포함 내용:**
- ✅ 천체별 리더보드 조회 (`GET /celestial-objects/{celestialId}/leaderboard`)
- ✅ APOD 리더보드 조회 (`GET /celestial-objects/apod/leaderboard`)
- ✅ TOP 5 플레이어 + 내 순위 반환
- ✅ 플레이 시간 기반 순위 계산 로직
- ✅ SQL 쿼리 예시 포함

**중요:**
- 퍼즐 완료 시 `playTime` (플레이 시간)을 기록해야 리더보드가 작동합니다
- 순위는 플레이 시간이 짧을수록 높음 (오름차순)

**프론트엔드 연동 코드:**
```javascript
// GamePlay.jsx (340-373줄)
const response = await fetch(
  `https://spacepuzzle.onrender.com/celestial-objects/${body.id}/leaderboard`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

// ApodInfo.jsx (47-75줄)
const response = await fetch(
  'https://spacepuzzle.onrender.com/celestial-objects/apod/leaderboard',
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);
```

---

### 3️⃣ **`APOD_BACKEND_API.md`** 🌟 중요
**APOD (Astronomy Picture of the Day) 기능 API**

**포함 내용:**
- ✅ APOD 데이터 조회 (`GET /apod/today`)
- ✅ APOD 퍼즐 완료 (`POST /celestial-objects/apod/complete`)
- ✅ NASA API 연동 가이드
- ✅ 보상 시스템 (우주 부품 지급)
- ✅ 캐싱 전략 (24시간)

**NASA API 키 필요:**
```bash
NASA_API_KEY=your_nasa_api_key_here
```

**프론트엔드 연동 코드:**
```javascript
// ApodInfo.jsx (15-45줄)
const response = await fetch(
  'https://spacepuzzle.onrender.com/apod/today',
  { headers }
);

// PuzzleGame.jsx (642-647줄)
const response = await fetch(
  'https://spacepuzzle.onrender.com/celestial-objects/apod/complete',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      playTime: timeRef.current,
      date: '2026-01-19',
      title: 'APOD Title'
    })
  }
);
```

---

### 4️⃣ **`ECONOMY_BACKEND_API.md`** 💰
**경제 시스템 API (별, 크레딧, 우주 부품)**

**포함 내용:**
- ✅ 유저 통계 조회 (`GET /user/stats`)
- ✅ 상점 아이템 구매 (`POST /shop/purchase`)
- ✅ 구매 내역 조회 (`GET /shop/purchased`)
- ✅ 자원 관리 (별, 크레딧, 우주 부품)

**중요:**
- 신규 유저는 크레딧 20개로 시작
- APOD 완료 시 우주 부품 지급
- 일반 퍼즐 완료 시 별 지급

---

### 5️⃣ **`IMAGE_PROXY_API.md`** 🖼️
**이미지 프록시 API (CORS 우회)**

**포함 내용:**
- ✅ 이미지 프록시 엔드포인트 (`/api/proxy-image`)
- ✅ CORS 문제 해결 방법
- ✅ NASA 이미지 로딩 최적화

**중요:**
- NASA 이미지는 CORS 제한이 있어 백엔드 프록시가 필요합니다

**프론트엔드 사용 예시:**
```javascript
// ApodInfo.jsx (68줄)
const proxyImageUrl = `https://spacepuzzle.onrender.com/api/proxy-image?url=${encodeURIComponent(originalImageUrl)}`;
```

---

### 6️⃣ **`API_MISSING_SPECS.md`** ⚠️
**미구현 API 목록**

**추가 구현 필요:**
- Customization API (배경/조종석/아이템 배치)
- Shop API `remainingCredits` 필드 추가

---

## 🔑 핵심 구현 사항

### 1. **퍼즐 완료 API** (최우선)

**일반 천체 퍼즐:**
```http
POST /celestial-objects/{celestialId}/complete
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "playTime": 120  // 초 단위
}
```

**APOD 퍼즐:**
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
  "message": "Puzzle completed successfully",
  "data": {
    "userId": "user-123",
    "playTime": 120,
    "starsEarned": 3,
    "totalStars": 150,
    "totalSpaceParts": 25
  }
}
```

**중요:**
- `playTime`은 **초 단위**로 전송됩니다
- 리더보드 순위 계산에 사용됩니다
- 같은 천체를 여러 번 플레이해도 **최고 기록(가장 빠른 시간)만 순위에 반영**됩니다

---

### 2. **리더보드 API** (최우선)

```http
GET /celestial-objects/{celestialId}/leaderboard
Authorization: Bearer {access_token}
```

**응답 형식:**
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

**순위 계산 로직:**
- `playTime` 오름차순 (빠를수록 높은 순위)
- 동일 시간일 경우 먼저 클리어한 사람 우선 (`completedAt`)
- 상위 5명만 `topPlayers`에 포함
- 현재 유저가 미플레이 시 `myRank: null`

---

### 3. **APOD API** (중요)

**NASA API 연동:**
```javascript
const NASA_API_KEY = process.env.NASA_API_KEY;
const response = await fetch(
  `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`
);
```

**캐싱 권장:**
- APOD는 하루에 한 번만 업데이트됨
- Redis나 메모리 캐시에 24시간 동안 저장
- API 호출 최소화 (비용 절감)

---

## 📊 데이터베이스 스키마

### **users 테이블**
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  total_stars INTEGER DEFAULT 0,
  space_parts INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 20,  -- 신규 유저 20크레딧 시작
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **stage_completions 테이블** (리더보드용)
```sql
CREATE TABLE stage_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  stage_id VARCHAR(255) NOT NULL,  -- celestialId 또는 'apod'
  play_time INTEGER NOT NULL,      -- 초 단위
  stars_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 같은 천체를 여러 번 플레이한 경우 최고 기록만 유지
  UNIQUE(user_id, stage_id)
  -- 또는 ON CONFLICT UPDATE로 더 빠른 기록만 갱신
);

CREATE INDEX idx_stage_leaderboard ON stage_completions(stage_id, play_time ASC);
CREATE INDEX idx_user_stage ON stage_completions(user_id, stage_id);
```

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
  
  UNIQUE(user_id, apod_date)  -- 같은 날짜는 한 번만 완료 가능
);

CREATE INDEX idx_apod_user ON apod_completions(user_id);
CREATE INDEX idx_apod_date ON apod_completions(apod_date);
CREATE INDEX idx_apod_leaderboard ON apod_completions(apod_date, play_time ASC);
```

---

## 🔐 인증 방식

**Supabase JWT 토큰 사용:**
```javascript
// 요청 헤더
Authorization: Bearer {supabase_access_token}
```

**백엔드 검증:**
```javascript
const token = req.headers.authorization?.split(' ')[1];
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

---

## 🚨 주의사항

### 1. **CORS 설정 필수**
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:5173'],
  credentials: true
}));
```

### 2. **트랜잭션 사용 권장**
퍼즐 완료 시 여러 테이블을 동시에 업데이트하므로 트랜잭션 필요:
```javascript
await db.transaction(async (trx) => {
  // 1. 완료 기록 저장
  await trx('stage_completions').insert({...});
  // 2. 유저 별/우주부품 업데이트
  await trx('users').where({id: userId}).increment('total_stars', starsEarned);
});
```

### 3. **동시성 제어**
```sql
-- 중복 완료 방지
SELECT * FROM stage_completions 
WHERE user_id = ? AND stage_id = ? 
FOR UPDATE;
```

### 4. **NASA API 키 환경변수 설정**
```bash
# .env
NASA_API_KEY=your_nasa_api_key_here
```

---

## 📞 문의

프론트엔드에서 추가로 필요한 데이터나 기능이 있으면 알려주세요!

**작성일:** 2026-01-19  
**작성자:** 프론트엔드 팀
