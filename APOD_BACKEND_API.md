# APOD 기능 백엔드 API 명세서

## 📋 개요
프론트엔드에서 APOD(Astronomy Picture of the Day) 기능을 구현했습니다.
백엔드에서 구현해야 할 API 엔드포인트와 데이터 형식을 안내합니다.

---

## 🔗 필요한 API 엔드포인트

### 1️⃣ **유저 통계 가져오기 (별 & 우주 부품)**

#### **엔드포인트:**
```
GET /user/stats
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}" // 필수
}
```

#### **응답 형식 (200 OK):**
```json
{
  "userId": "user-123",
  "totalStars": 150,  // 총 별 개수
  "spaceParts": 5,    // 우주 부품 개수
  "completedPuzzles": 15,  // 완료한 퍼즐 개수
  "totalPlayTime": 3600    // 총 플레이 시간 (초)
}
```

#### **응답 필드 설명:**
| 필드 | 타입 | 설명 | 필수 |
|------|------|------|------|
| `userId` | string | 유저 ID | ✅ |
| `totalStars` | number | 총 별 개수 | ✅ |
| `spaceParts` | number | 우주 부품 개수 | ✅ |
| `completedPuzzles` | number | 완료한 퍼즐 개수 | ⚠️ 권장 |
| `totalPlayTime` | number | 총 플레이 시간 (초) | ❌ 선택 |

---

### 2️⃣ **오늘의 APOD 데이터 가져오기**

#### **엔드포인트:**
```
GET /apod/today
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}" // 선택사항 (로그인 시)
}
```

#### **응답 형식 (200 OK):**
```json
{
  "date": "2026-01-19",
  "title": "The Moon and Mars",
  "explanation": "On January 18, 2026, the Moon and Mars were close together in the night sky...",
  "url": "https://apod.nasa.gov/apod/image/2601/moon_mars_1024.jpg",
  "hdurl": "https://apod.nasa.gov/apod/image/2601/moon_mars_4k.jpg",
  "media_type": "image",
  "copyright": "John Doe Photography (optional)"
}
```

#### **응답 필드 설명:**
| 필드 | 타입 | 설명 | 필수 |
|------|------|------|------|
| `date` | string | APOD 날짜 (YYYY-MM-DD) | ✅ |
| `title` | string | 제목 | ✅ |
| `explanation` | string | 설명 (길이 제한 없음) | ✅ |
| `url` | string | 이미지 URL (일반 해상도) | ✅ |
| `hdurl` | string | 고화질 이미지 URL | ⚠️ 권장 |
| `media_type` | string | 미디어 타입 ("image" or "video") | ✅ |
| `copyright` | string | 저작권 정보 | ❌ 선택 |

#### **에러 응답:**
```json
{
  "error": "APOD data not available",
  "message": "Failed to fetch APOD from NASA API"
}
```

---

### 3️⃣ **APOD 퍼즐 완료 기록 + 보상**

#### **엔드포인트:**
```
POST /celestial-objects/apod/complete
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

#### **요청 바디:**
```json
{
  "playTime": 120,  // 플레이 시간 (초)
  "date": "2026-01-19",  // APOD 날짜
  "title": "The Moon and Mars"  // APOD 제목
}
```

#### **응답 형식 (200 OK):**
```json
{
  "success": true,
  "message": "APOD puzzle completed successfully",
  "data": {
    "userId": "user-123",
    "apodDate": "2026-01-19",
    "playTime": 120,
    "completedAt": "2026-01-19T15:30:00Z",
    "rewards": {
      "stars": 10,        // ⭐ 별 10개
      "spaceParts": 5     // 🔧 우주 부품 5개
    },
    "totalStats": {
      "totalStars": 160,     // 보상 후 총 별 개수
      "totalSpaceParts": 25  // 보상 후 총 우주 부품 (20 + 5)
    }
  }
}
```

#### **보상 규칙:**
- **별**: 10개 (APOD 스페셜 보상)
- **우주 부품**: 5개 (우주선 꾸미기용)
- 같은 날짜의 APOD를 중복 완료하면 보상 없음 (첫 완료만 보상)

#### **초기 자원:**
- 신규 유저 가입 시 **우주 부품 20개** 지급
- 별은 0개부터 시작

---

### 4️⃣ **상점: 구매 내역 조회**

#### **엔드포인트:**
```
GET /shop/purchased
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}" // 필수
}
```

#### **응답 형식 (200 OK):**
```json
{
  "items": ["hologram_display", "neon_lights", "galaxy_poster"]
}
```

---

### 5️⃣ **상점: 아이템 구매**

#### **⚠️ 중요: 우주 부품만 사용**
- **모든 상점 아이템은 우주 부품(spaceParts)으로만 구매 가능합니다.**
- 별(stars)은 상점에서 사용되지 않습니다.
- `priceStars`는 항상 `0`으로 전송됩니다.

#### **엔드포인트:**
```
POST /shop/purchase
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

#### **요청 바디:**
```json
{
  "itemId": "item_plant",
  "itemName": "우주 식물",
  "itemCategory": "item",
  "itemType": "placeable",
  "priceStars": 0,
  "priceSpaceParts": 3
}
```

**필드 설명:**
- `itemId`: 아이템 고유 ID
- `itemName`: 아이템 이름
- `itemCategory`: "background", "item", "cockpit" 중 하나
- `itemType`: "background", "placeable", "cockpit" 중 하나
- `priceStars`: 항상 `0` (우주 부품만 사용)
- `priceSpaceParts`: 아이템 가격 (우주 부품)

#### **응답 형식 (200 OK):**
```json
{
  "success": true,
  "message": "Item purchased successfully",
  "itemId": "hologram_display",
  "remainingStars": 140,
  "remainingSpaceParts": 15
}
```

#### **에러 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "Insufficient resources" // 또는 "Item already purchased"
}
```

---

## 🔧 백엔드 구현 가이드

### **1. NASA APOD API 연동**

#### **NASA API 사용:**
```javascript
// Node.js 예시
const NASA_API_KEY = process.env.NASA_API_KEY;
const NASA_APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

async function getTodayApod() {
  const response = await fetch(NASA_APOD_URL);
  const data = await response.json();
  return data;
}
```

#### **캐싱 권장:**
- APOD는 하루에 한 번만 업데이트됨
- Redis나 메모리 캐시에 24시간 동안 저장
- API 호출 최소화 (비용 절감)

```javascript
// 캐싱 예시
const cache = {}; // 또는 Redis
const CACHE_KEY = `apod:${new Date().toISOString().split('T')[0]}`;

async function getCachedApod() {
  if (cache[CACHE_KEY]) {
    return cache[CACHE_KEY];
  }
  
  const data = await getTodayApod();
  cache[CACHE_KEY] = data;
  
  // 24시간 후 만료
  setTimeout(() => delete cache[CACHE_KEY], 24 * 60 * 60 * 1000);
  
  return data;
}
```

---

### **2. 데이터베이스 스키마**

#### **users 테이블 (별 & 우주 부품 필드 추가):**
```sql
-- 기존 users 테이블에 컬럼 추가
ALTER TABLE users 
ADD COLUMN total_stars INTEGER DEFAULT 0,
ADD COLUMN space_parts INTEGER DEFAULT 20;  -- 🔧 신규 유저 20개 시작

-- 또는 새로운 테이블 생성 시:
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  total_stars INTEGER DEFAULT 0,     -- ⭐ 총 별 개수
  space_parts INTEGER DEFAULT 20,    -- 🔧 우주 부품 개수 (시작 20개)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **apod_completions 테이블:**
```sql
CREATE TABLE apod_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  apod_date DATE NOT NULL,
  apod_title VARCHAR(500),
  play_time INTEGER NOT NULL, -- 초 단위
  reward_stars INTEGER DEFAULT 10,     -- 보상 별
  reward_space_parts INTEGER DEFAULT 5, -- 보상 우주 부품 (5개)
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, apod_date) -- 같은 날짜의 APOD는 한 번만 완료 가능
);

CREATE INDEX idx_apod_user ON apod_completions(user_id);
CREATE INDEX idx_apod_date ON apod_completions(apod_date);
```

#### **shop_purchases 테이블:**
```sql
CREATE TABLE shop_purchases (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  item_name VARCHAR(200),
  item_category VARCHAR(50), -- 'background', 'item', 'cockpit'
  item_type VARCHAR(50),     -- 'background', 'placeable', 'cockpit'
  price_stars INTEGER NOT NULL,
  price_space_parts INTEGER NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, item_id) -- 같은 아이템은 한 번만 구매 가능
);

CREATE INDEX idx_shop_user ON shop_purchases(user_id);
CREATE INDEX idx_shop_item ON shop_purchases(item_id);
```

#### **user_customization 테이블 (우주선 꾸미기 설정):**
```sql
CREATE TABLE user_customization (
  user_id VARCHAR(255) PRIMARY KEY,
  current_background VARCHAR(100) DEFAULT 'bg_default',
  current_cockpit VARCHAR(100) DEFAULT 'cockpit_default',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **placed_items 테이블 (배치된 아이템):**
```sql
CREATE TABLE placed_items (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, item_id) -- 같은 아이템은 한 번만 배치 가능
);

CREATE INDEX idx_placed_user ON placed_items(user_id);
```

---

### **3. 보상 지급 로직**

#### **APOD 완료 시 보상 처리:**
```javascript
// Node.js 예시
async function completeApodPuzzle(userId, apodDate, apodTitle, playTime) {
  // 1. 중복 완료 확인
  const existing = await db.query(
    'SELECT * FROM apod_completions WHERE user_id = $1 AND apod_date = $2',
    [userId, apodDate]
  );
  
  if (existing.rows.length > 0) {
    return {
      success: false,
      message: '이미 완료한 APOD입니다.',
      rewards: { stars: 0, spaceParts: 0 }
    };
  }
  
  // 2. 완료 기록 저장
  await db.query(
    'INSERT INTO apod_completions (user_id, apod_date, apod_title, play_time, reward_stars, reward_space_parts) VALUES ($1, $2, $3, $4, 10, 5)',
    [userId, apodDate, apodTitle, playTime]
  );
  
  // 3. 유저 통계 업데이트 (별 10개 + 우주 부품 5개)
  await db.query(
    'UPDATE users SET total_stars = total_stars + 10, space_parts = space_parts + 5 WHERE id = $1',
    [userId]
  );
  
  // 4. 업데이트된 통계 가져오기
  const userStats = await db.query(
    'SELECT total_stars, space_parts FROM users WHERE id = $1',
    [userId]
  );
  
  return {
    success: true,
    message: 'APOD puzzle completed successfully',
    rewards: {
      stars: 10,
      spaceParts: 1
    },
    totalStats: {
      totalStars: userStats.rows[0].total_stars,
      totalSpaceParts: userStats.rows[0].space_parts
    }
  };
}
```

#### **트랜잭션 사용 권장:**
```javascript
async function completeApodPuzzleWithTransaction(userId, apodDate, apodTitle, playTime) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. 중복 체크
    const existing = await client.query(
      'SELECT * FROM apod_completions WHERE user_id = $1 AND apod_date = $2 FOR UPDATE',
      [userId, apodDate]
    );
    
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, message: '이미 완료함' };
    }
    
    // 2. 완료 기록
    await client.query(
      'INSERT INTO apod_completions (user_id, apod_date, apod_title, play_time) VALUES ($1, $2, $3, $4)',
      [userId, apodDate, apodTitle, playTime]
    );
    
    // 3. 보상 지급
    await client.query(
      'UPDATE users SET total_stars = total_stars + 10, space_parts = space_parts + 1 WHERE id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

#### **상점 구매 로직:**
```javascript
async function purchaseShopItem(userId, itemId, itemName, itemCategory, itemType, priceStars, priceSpaceParts) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. 유저 자원 확인 (FOR UPDATE로 락)
    const userResult = await client.query(
      'SELECT total_stars, space_parts FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'User not found' };
    }
    
    const user = userResult.rows[0];
    
    // 2. 이미 구매했는지 확인
    const existingPurchase = await client.query(
      'SELECT * FROM shop_purchases WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    
    if (existingPurchase.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Item already purchased' };
    }
    
    // 3. 자원 부족 확인 (우주 부품만 확인)
    // ⚠️ 중요: 상점은 우주 부품만 사용하므로 별(total_stars)은 체크하지 않음
    if (user.space_parts < priceSpaceParts) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Insufficient space parts' };
    }
    
    // 4. 구매 기록 저장 (카테고리와 타입 포함)
    await client.query(
      'INSERT INTO shop_purchases (user_id, item_id, item_name, item_category, item_type, price_stars, price_space_parts) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, itemId, itemName, itemCategory, itemType, priceStars, priceSpaceParts]
    );
    
    // 5. 유저 자원 차감 (우주 부품만 차감)
    // ⚠️ 중요: total_stars는 차감하지 않음 (priceStars는 항상 0)
    await client.query(
      'UPDATE users SET space_parts = space_parts - $1 WHERE id = $2',
      [priceSpaceParts, userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      remainingStars: user.total_stars, // 별은 변경되지 않음
      remainingSpaceParts: user.space_parts - priceSpaceParts
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

#### **커스터마이제이션 로직:**
```javascript
// 현재 설정 조회
async function getUserCustomization(userId) {
  const customResult = await db.query(
    'SELECT current_background, current_cockpit FROM user_customization WHERE user_id = $1',
    [userId]
  );
  
  let background = 'bg_default';
  let cockpit = 'cockpit_default';
  
  if (customResult.rows.length > 0) {
    background = customResult.rows[0].current_background;
    cockpit = customResult.rows[0].current_cockpit;
  } else {
    // 신규 유저: 기본값으로 초기화
    await db.query(
      'INSERT INTO user_customization (user_id, current_background, current_cockpit) VALUES ($1, $2, $3)',
      [userId, background, cockpit]
    );
  }
  
  // 배치된 아이템 조회
  const itemsResult = await db.query(
    'SELECT item_id, position_x, position_y FROM placed_items WHERE user_id = $1',
    [userId]
  );
  
  const items = itemsResult.rows.map(row => ({
    itemId: row.item_id,
    x: row.position_x,
    y: row.position_y
  }));
  
  return { background, cockpit, items };
}

// 배경/조종석 설정
async function setCustomization(userId, type, itemId) {
  // 1. 구매 여부 확인
  const purchaseCheck = await db.query(
    'SELECT * FROM shop_purchases WHERE user_id = $1 AND item_id = $2',
    [userId, itemId]
  );
  
  if (purchaseCheck.rows.length === 0 && !itemId.endsWith('_default')) {
    return { success: false, message: 'Item not purchased' };
  }
  
  // 2. 타입에 따라 설정 업데이트
  if (type === 'background') {
    await db.query(
      'UPDATE user_customization SET current_background = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [itemId, userId]
    );
  } else if (type === 'cockpit') {
    await db.query(
      'UPDATE user_customization SET current_cockpit = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [itemId, userId]
    );
  } else {
    return { success: false, message: 'Invalid item type' };
  }
  
  const customization = await getUserCustomization(userId);
  return { success: true, ...customization };
}

// 아이템 배치
async function placeItem(userId, itemId, x, y) {
  // 1. 구매 여부 확인
  const purchaseCheck = await db.query(
    'SELECT item_type FROM shop_purchases WHERE user_id = $1 AND item_id = $2',
    [userId, itemId]
  );
  
  if (purchaseCheck.rows.length === 0) {
    return { success: false, message: 'Item not purchased' };
  }
  
  // 2. placeable 아이템인지 확인
  if (purchaseCheck.rows[0].item_type !== 'placeable') {
    return { success: false, message: 'Item is not placeable' };
  }
  
  // 3. 아이템 배치 (이미 배치된 경우 위치 업데이트)
  await db.query(`
    INSERT INTO placed_items (user_id, item_id, position_x, position_y, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET position_x = $3, position_y = $4, updated_at = CURRENT_TIMESTAMP
  `, [userId, itemId, x, y]);
  
  const customization = await getUserCustomization(userId);
  return { success: true, items: customization.items };
}

// 아이템 제거
async function removeItem(userId, itemId) {
  await db.query(
    'DELETE FROM placed_items WHERE user_id = $1 AND item_id = $2',
    [userId, itemId]
  );
  
  const customization = await getUserCustomization(userId);
  return { success: true, items: customization.items };
}
```

---

### **4. 인증 처리**

#### **선택적 인증:**
- `/apod/today` → 로그인 없이도 가능 (READ)
- `/celestial-objects/apod/complete` → 로그인 필수 (WRITE)

```javascript
// 미들웨어 예시
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    // 토큰 검증 후 req.user 설정
    req.user = verifyToken(token);
  }
  next(); // 토큰이 없어도 통과
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = verifyToken(token);
  next();
}
```

---

## 📊 데이터 흐름

```
프론트엔드 (Lobby)           백엔드                     Database
    │                          │                          │
    │── GET /user/stats ──────→│                          │
    │                          │─── SELECT * FROM users ─→│
    │                          │←── stars, spaceParts ────│
    │←─ 별 & 우주부품 표시 ────│                          │


프론트엔드 (APOD Info)       백엔드                     NASA API
    │                          │                          │
    │── GET /apod/today ──────→│                          │
    │                          │─── GET apod ───────────→│
    │                          │←── JSON data ───────────│
    │←─ APOD 데이터 표시 ──────│                          │
    │                          │                          │
    │ (사용자가 퍼즐 플레이)    │                          │
    │                          │                          │
    │─ POST /...apod/complete →│                          │
    │  { playTime: 120 }       │                          │
    │                          │─ BEGIN TRANSACTION       │
    │                          │─ INSERT apod_completions │
    │                          │─ UPDATE users            │
    │                          │   (stars +10, parts +1)  │
    │                          │─ COMMIT                  │
    │←─ 보상 지급 완료 ─────────│                          │
    │  (stars: 10, parts: 1)   │                          │
```

---

## 🎯 프론트엔드에서 사용하는 방법

### **1. APOD 정보 화면 접근:**
```
Lobby → APOD 창문 클릭 → /apod-info
```

### **2. APOD 데이터 표시:**
- 제목, 날짜, 이미지, 설명 표시
- media_type이 "video"면 퍼즐 불가 알림

### **3. 퍼즐 시작:**
```javascript
navigate('/puzzle', {
  state: {
    celestialBody: {
      id: 'apod',
      name: apodData.title,
      difficulty: '스페셜',
      gridSize: 5,
      image: apodData.hdurl || apodData.url,
      isApod: true,
    },
    nasaId: 'apod',
  },
});
```

### **4. 퍼즐 완료 시:**
```javascript
POST /celestial-objects/apod/complete
Body: { playTime: 120 }
```

---

## ⚠️ 주의사항

### **1. NASA API 키:**
- 무료 키: 시간당 1000 요청 제한
- 하루 캐싱 필수!

### **2. 이미지 타입 확인:**
- `media_type: "video"` → 퍼즐 불가
- 프론트엔드에서 처리하지만, 백엔드도 체크 권장

### **3. 에러 처리:**
- NASA API 다운 시: 이전 APOD 사용 또는 에러 메시지
- 네트워크 타임아웃: 30초 설정

### **4. CORS:**
- 프론트엔드 도메인 허용 필수

---

## 🎨 커스터마이제이션 시스템 (우주선 꾸미기)

### **6️⃣ 커스터마이제이션: 현재 설정 조회**

#### **엔드포인트:**
```
GET /user/customization
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}" // 필수
}
```

#### **응답 형식 (200 OK):**
```json
{
  "background": "bg_luxury",
  "cockpit": "cockpit_advanced",
  "items": [
    {
      "itemId": "item_plant",
      "x": 100,
      "y": 200
    },
    {
      "itemId": "item_poster",
      "x": 300,
      "y": 150
    }
  ]
}
```

**설명:**
- `background`: 현재 설정된 우주선 내부 배경 ID
- `cockpit`: 현재 설정된 조종석 ID
- `items`: 배치된 아이템 목록 (위치 정보 포함)

---

### **7️⃣ 커스터마이제이션: 배경/조종석 설정**

#### **엔드포인트:**
```
POST /user/customization/set
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

#### **요청 바디:**
```json
{
  "type": "background",
  "itemId": "bg_luxury"
}
```

**또는:**
```json
{
  "type": "cockpit",
  "itemId": "cockpit_advanced"
}
```

**필드 설명:**
- `type`: "background" 또는 "cockpit"
- `itemId`: 설정할 아이템 ID (반드시 구매한 아이템이어야 함)

#### **응답 형식 (200 OK):**
```json
{
  "success": true,
  "message": "Customization updated",
  "currentBackground": "bg_luxury",
  "currentCockpit": "cockpit_default"
}
```

#### **에러 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "Item not purchased" // 또는 "Invalid item type"
}
```

---

### **8️⃣ 커스터마이제이션: 아이템 배치**

#### **엔드포인트:**
```
POST /user/customization/place-item
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

#### **요청 바디:**
```json
{
  "itemId": "item_plant",
  "x": 150,
  "y": 300
}
```

**필드 설명:**
- `itemId`: 배치할 아이템 ID (반드시 구매한 아이템이고 type이 "placeable"이어야 함)
- `x`, `y`: 화면상의 위치 (픽셀 좌표)

#### **응답 형식 (200 OK):**
```json
{
  "success": true,
  "message": "Item placed",
  "items": [
    {
      "itemId": "item_plant",
      "x": 150,
      "y": 300
    }
  ]
}
```

#### **에러 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "Item not purchased" // 또는 "Invalid item type"
}
```

---

### **9️⃣ 커스터마이제이션: 아이템 제거**

#### **엔드포인트:**
```
DELETE /user/customization/remove-item
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

#### **요청 바디:**
```json
{
  "itemId": "item_plant"
}
```

#### **응답 형식 (200 OK):**
```json
{
  "success": true,
  "message": "Item removed",
  "items": []
}
```

---

## 📝 테스트 체크리스트

### **API 테스트:**
- [ ] `/user/stats` GET 요청 성공 (별, 우주 부품 반환)
- [ ] `/apod/today` GET 요청 성공
- [ ] `/celestial-objects/apod/complete` POST 요청 성공
- [ ] NASA API 응답을 정확히 파싱
- [ ] 캐싱이 24시간 동안 유지됨
- [ ] 로그인 없이도 APOD 데이터 조회 가능
- [ ] 로그인한 사용자만 퍼즐 완료 기록 가능

### **보상 시스템 테스트:**
- [ ] 신규 유저 가입 시 우주 부품 20개 지급됨
- [ ] APOD 완료 시 별 10개 지급됨
- [ ] APOD 완료 시 우주 부품 5개 지급됨
- [ ] 보상 후 users 테이블이 정확히 업데이트됨
- [ ] 같은 날짜의 APOD를 여러 번 완료해도 보상은 한 번만 지급됨
- [ ] 중복 완료 시도 시 적절한 메시지 반환

### **상점 시스템 테스트:**
- [ ] `/shop/purchased` GET 요청으로 구매 내역 조회됨
- [ ] `/shop/purchase` POST 요청으로 아이템 구매 가능
- [ ] **구매 시 우주 부품만 사용됨 (별은 사용하지 않음)**
- [ ] 구매 시 우주 부품이 정확히 차감됨
- [ ] 자원 부족 시 구매 실패 및 적절한 에러 메시지 반환
- [ ] 같은 아이템 중복 구매 방지됨
- [ ] 트랜잭션으로 안전하게 처리됨
- [ ] 아이템 카테고리(background/item/cockpit)가 정확히 저장됨

### **커스터마이제이션 시스템 테스트:**
- [ ] `/user/customization` GET 요청으로 현재 설정 조회됨
- [ ] `/user/customization/set` POST 요청으로 배경/조종석 변경 가능
- [ ] `/user/customization/place-item` POST 요청으로 아이템 배치 가능
- [ ] `/user/customization/remove-item` DELETE 요청으로 아이템 제거 가능
- [ ] 구매하지 않은 아이템은 설정/배치 불가
- [ ] 배경/조종석은 한 번에 하나만 활성화됨
- [ ] 배치 가능한 아이템만 배치됨 (type: "placeable")
- [ ] 아이템 위치 정보가 정확히 저장됨
- [ ] 신규 유저는 기본 배경/조종석으로 초기화됨

### **에러 처리:**
- [ ] 에러 처리가 적절함 (NASA API 다운 등)
- [ ] 트랜잭션 실패 시 롤백됨
- [ ] 동시성 문제 없음 (FOR UPDATE 사용)

---

## 🚀 배포 전 확인사항

1. **환경 변수 설정:**
   ```
   NASA_API_KEY=your_nasa_api_key_here
   ```

2. **데이터베이스 마이그레이션:**
   ```bash
   # apod_completions 테이블 생성
   npm run migrate
   ```

3. **CORS 설정:**
   ```javascript
   app.use(cors({
     origin: 'https://your-frontend-domain.com'
   }));
   ```

---

## 📞 문의

프론트엔드 팀에서 추가로 필요한 데이터나 기능이 있으면 알려주세요!
