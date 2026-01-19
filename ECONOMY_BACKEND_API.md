# 🚀 SpacePuzzle 경제 시스템 백엔드 API 명세서

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [자원 시스템](#자원-시스템)
3. [별 마일스톤 시스템](#별-마일스톤-시스템)
4. [섹터 해금 시스템](#섹터-해금-시스템)
5. [API 엔드포인트](#api-엔드포인트)
6. [데이터베이스 스키마](#데이터베이스-스키마)
7. [구현 가이드](#구현-가이드)

---

## 🎯 시스템 개요

### **3대 핵심 자원**

| 자원 | 타입 | 초기값 | 용도 | 특징 |
|------|------|--------|------|------|
| **별 (Stars)** | 누적 | 0 | 섹터 해금, 마일스톤 트리거 | 소모 안됨 |
| **크레딧 (Credits)** | 소비 | 20 | 일반/레어 아이템 구매 | 소비 화폐 |
| **우주 부품 (Space Parts)** | 소비 | 0 | 에픽/전설 아이템 구매 | 희귀 화폐 |

---

## ⭐ 자원 시스템

### **1️⃣ 별 (Stars)**

**획득 방법:**
- 스테이지 클리어: 1~3개 (성과에 따라)
- 총 획득 가능: 116개

**용도:**
- 섹터 해금 조건
- 마일스톤 보상 트리거

**특징:**
- ✅ 절대 감소하지 않음
- ✅ 플레이어 진행도의 영구적 지표

---

### **2️⃣ 크레딧 (Credits)**

**초기 지급:** 20개

**획득 방법:**
- 별 마일스톤 보상
- 섹터 해금 보너스

**용도:**
- 일반(Common) 아이템: 3~10 크레딧
- 레어(Rare) 아이템: 15~40 크레딧

**상점 예시:**
```
[크레딧 상점]
- 기본 조종석: 5 C
- 형광등 조명: 8 C
- 표준 수납장: 12 C
- 색상 벽지: 15 C
- 고급 소파: 30 C
```

---

### **3️⃣ 우주 부품 (Space Parts)**

**초기 지급:** 0개

**획득 방법:**
- 데일리 퍼즐 완료: 1개 (매일)
- 별 마일스톤 보상: 1~10개

**용도:**
- 에픽(Epic) 아이템: 3~10 우주 부품
- 전설(Legendary) 아이템: 15~25 우주 부품

**상점 예시:**
```
[우주 부품 상점]
에픽:
- 식물 재배기: 5 P
- AI 로봇 팔: 7 P
- 네온 사인: 10 P

전설:
- 무중력 조종석: 20 P
- 홀로그램 지구본: 18 P
- 은하수 배경 창문: 25 P
```

---

## 🎁 별 마일스톤 시스템

### **마일스톤 보상 테이블**

| 누적 별 | 크레딧 | 우주 부품 | 섹터 해금 | 비고 |
|---------|--------|----------|----------|------|
| **0** | 20 | 0 | 섹터 1 (태양계) | 초기 지급 |
| **5** | 10 | 1 | - | 첫 마일스톤 |
| **10** | 10 | 1 | - | |
| **15** | 20 | 2 | **섹터 2 (외계 행성)** | 첫 섹터 해금 |
| **20** | 15 | 1 | - | |
| **28** | 25 | 3 | **섹터 3 (성운)** | 중급 단계 |
| **35** | 15 | 2 | - | |
| **45** | 30 | 4 | **섹터 4 (은하)** | 고급 단계 |
| **55** | 20 | 3 | - | |
| **65** | 40 | 5 | **섹터 5 (심연)** | 최종 섹터 |
| **85** | 50 | 5 | - | 마스터 단계 |
| **105** | 60 | 8 | - | 전설 수집가 |
| **116** | 100 | 10 | - | 졸업 보상 |

**총 보상:**
- 크레딧: 315개
- 우주 부품: 45개

---

## 🚪 섹터 해금 시스템

### **섹터 정보**

| 섹터 ID | 섹터 이름 | 필요 별 | 해금 보너스 | 테마 |
|---------|----------|---------|------------|------|
| 1 | 태양계 (Solar System) | 0 | - | 기본 |
| 2 | 외계 행성 (Exoplanets) | 15 | 20C + 2P | 미지의 세계 |
| 3 | 성운 (Nebula) | 28 | 25C + 3P | 화려한 가스 구름 |
| 4 | 은하 (Galaxy) | 45 | 30C + 4P | 거대한 우주 |
| 5 | 심연 (Deep Space) | 65 | 40C + 5P | 블랙홀과 암흑 물질 |

---

## 🔌 API 엔드포인트

### **1️⃣ 유저 자원 조회**

#### **엔드포인트:**
```
GET /user/resources
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}"
}
```

#### **응답 (200 OK):**
```json
{
  "stars": 25,
  "credits": 45,
  "spaceParts": 3,
  "unlockedSectors": [1, 2]
}
```

---

### **2️⃣ 스테이지 완료**

#### **엌드포인트:**
```
POST /stages/complete
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
  "stageId": "earth_stage_1",
  "sectorId": 1,
  "playTime": 120,
  "starsEarned": 3
}
```

#### **응답 (200 OK):**
```json
{
  "success": true,
  "newTotalStars": 28,
  "credits": 45,
  "spaceParts": 3,
  "milestoneRewards": {
    "triggered": true,
    "milestone": 28,
    "creditsEarned": 25,
    "spacePartsEarned": 3,
    "sectorUnlocked": {
      "id": 3,
      "name": "성운"
    }
  },
  "newUnlockedSectors": [1, 2, 3]
}
```

**필드 설명:**
- `starsEarned`: 이번 클리어로 획득한 별 (1~3)
- `newTotalStars`: 누적 별 개수
- `milestoneRewards.triggered`: 마일스톤 달성 여부
- `sectorUnlocked`: 새로 해금된 섹터 (없으면 null)

---

### **3️⃣ 데일리 퍼즐 완료**

#### **엔드포인트:**
```
POST /daily-puzzle/complete
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
  "puzzleDate": "2026-01-19",
  "playTime": 180
}
```

#### **응답 (200 OK):**
```json
{
  "success": true,
  "spacePartsEarned": 1,
  "newTotalSpaceParts": 4,
  "message": "오늘의 퍼즐 완료! 우주 부품 1개 획득!"
}
```

#### **에러 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "Already completed today's puzzle"
}
```

---

### **4️⃣ 마일스톤 보상 조회**

#### **엔드포인트:**
```
GET /milestones
```

#### **응답 (200 OK):**
```json
{
  "milestones": [
    {
      "requiredStars": 5,
      "credits": 10,
      "spaceParts": 1,
      "sectorUnlock": null,
      "achieved": true
    },
    {
      "requiredStars": 15,
      "credits": 20,
      "spaceParts": 2,
      "sectorUnlock": {
        "id": 2,
        "name": "외계 행성"
      },
      "achieved": true
    },
    {
      "requiredStars": 28,
      "credits": 25,
      "spaceParts": 3,
      "sectorUnlock": {
        "id": 3,
        "name": "성운"
      },
      "achieved": false
    }
  ],
  "nextMilestone": {
    "requiredStars": 28,
    "starsNeeded": 3
  }
}
```

---

### **5️⃣ 섹터 정보 조회**

#### **엔드포인트:**
```
GET /sectors
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}"
}
```

#### **응답 (200 OK):**
```json
{
  "sectors": [
    {
      "id": 1,
      "name": "태양계",
      "nameEn": "Solar System",
      "requiredStars": 0,
      "unlocked": true,
      "stages": [
        {
          "id": "earth",
          "name": "지구",
          "difficulty": "쉬움",
          "gridSize": 3,
          "completed": true,
          "stars": 3
        }
      ]
    },
    {
      "id": 2,
      "name": "외계 행성",
      "nameEn": "Exoplanets",
      "requiredStars": 15,
      "unlocked": true,
      "unlockBonus": {
        "credits": 20,
        "spaceParts": 2
      },
      "stages": []
    },
    {
      "id": 3,
      "name": "성운",
      "nameEn": "Nebula",
      "requiredStars": 28,
      "unlocked": false,
      "unlockBonus": {
        "credits": 25,
        "spaceParts": 3
      },
      "stages": []
    }
  ],
  "currentStars": 25
}
```

---

### **6️⃣ 상점 아이템 구매**

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
  "itemId": "epic_plant_grower",
  "itemName": "식물 재배기",
  "itemCategory": "item",
  "itemRarity": "epic",
  "priceType": "spaceParts",
  "priceAmount": 5
}
```

**필드 설명:**
- `priceType`: "credits" 또는 "spaceParts"
- `itemRarity`: "common", "rare", "epic", "legendary"

#### **응답 (200 OK):**
```json
{
  "success": true,
  "remainingCredits": 45,
  "remainingSpaceParts": 2,
  "message": "식물 재배기 구매 완료!"
}
```

#### **에러 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "Insufficient space parts" // 또는 "Insufficient credits"
}
```

---

## 💾 데이터베이스 스키마

### **1️⃣ users 테이블 (업데이트)**

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  
  -- 자원
  total_stars INTEGER DEFAULT 0,          -- 누적 별 (절대 감소 안 함)
  credits INTEGER DEFAULT 20,              -- 크레딧 (초기 20개)
  space_parts INTEGER DEFAULT 0,           -- 우주 부품 (초기 0개)
  
  -- 메타 정보
  tutorial_completed BOOLEAN DEFAULT FALSE,
  last_daily_puzzle_date DATE,            -- 마지막 데일리 퍼즐 날짜
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_stars ON users(total_stars);
```

---

### **2️⃣ milestones 테이블 (마스터 데이터)**

```sql
CREATE TABLE milestones (
  id SERIAL PRIMARY KEY,
  required_stars INTEGER NOT NULL UNIQUE,
  reward_credits INTEGER DEFAULT 0,
  reward_space_parts INTEGER DEFAULT 0,
  unlocks_sector_id INTEGER,              -- NULL이면 섹터 해금 없음
  milestone_order INTEGER NOT NULL
);

-- 초기 데이터 삽입
INSERT INTO milestones (required_stars, reward_credits, reward_space_parts, unlocks_sector_id, milestone_order) VALUES
(5, 10, 1, NULL, 1),
(10, 10, 1, NULL, 2),
(15, 20, 2, 2, 3),
(20, 15, 1, NULL, 4),
(28, 25, 3, 3, 5),
(35, 15, 2, NULL, 6),
(45, 30, 4, 4, 7),
(55, 20, 3, NULL, 8),
(65, 40, 5, 5, 9),
(85, 50, 5, NULL, 10),
(105, 60, 8, NULL, 11),
(116, 100, 10, NULL, 12);
```

---

### **3️⃣ user_milestones 테이블**

```sql
CREATE TABLE user_milestones (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  milestone_id INTEGER NOT NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (milestone_id) REFERENCES milestones(id),
  UNIQUE(user_id, milestone_id)
);

CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);
```

---

### **4️⃣ sectors 테이블 (마스터 데이터)**

```sql
CREATE TABLE sectors (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  required_stars INTEGER NOT NULL,
  unlock_bonus_credits INTEGER DEFAULT 0,
  unlock_bonus_space_parts INTEGER DEFAULT 0,
  sector_order INTEGER NOT NULL
);

-- 초기 데이터 삽입
INSERT INTO sectors (id, name, name_en, required_stars, unlock_bonus_credits, unlock_bonus_space_parts, sector_order) VALUES
(1, '태양계', 'Solar System', 0, 0, 0, 1),
(2, '외계 행성', 'Exoplanets', 15, 20, 2, 2),
(3, '성운', 'Nebula', 28, 25, 3, 3),
(4, '은하', 'Galaxy', 45, 30, 4, 4),
(5, '심연', 'Deep Space', 65, 40, 5, 5);
```

---

### **5️⃣ user_sectors 테이블**

```sql
CREATE TABLE user_sectors (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  sector_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (sector_id) REFERENCES sectors(id),
  UNIQUE(user_id, sector_id)
);

CREATE INDEX idx_user_sectors_user ON user_sectors(user_id);
```

---

### **6️⃣ stage_completions 테이블**

```sql
CREATE TABLE stage_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  stage_id VARCHAR(100) NOT NULL,
  sector_id INTEGER NOT NULL,
  stars_earned INTEGER NOT NULL CHECK (stars_earned BETWEEN 1 AND 3),
  play_time INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (sector_id) REFERENCES sectors(id)
);

CREATE INDEX idx_stage_completions_user ON stage_completions(user_id);
CREATE INDEX idx_stage_completions_stage ON stage_completions(stage_id);
```

---

### **7️⃣ daily_puzzle_completions 테이블**

```sql
CREATE TABLE daily_puzzle_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  puzzle_date DATE NOT NULL,
  play_time INTEGER NOT NULL,
  space_parts_earned INTEGER DEFAULT 1,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, puzzle_date)
);

CREATE INDEX idx_daily_puzzle_user ON daily_puzzle_completions(user_id);
CREATE INDEX idx_daily_puzzle_date ON daily_puzzle_completions(puzzle_date);
```

---

### **8️⃣ shop_items 테이블 (마스터 데이터)**

```sql
CREATE TABLE shop_items (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,         -- 'background', 'item', 'cockpit'
  item_type VARCHAR(50) NOT NULL,        -- 'background', 'placeable', 'cockpit'
  rarity VARCHAR(50) NOT NULL,           -- 'common', 'rare', 'epic', 'legendary'
  price_type VARCHAR(50) NOT NULL,       -- 'credits' or 'spaceParts'
  price_amount INTEGER NOT NULL,
  icon_emoji VARCHAR(10)
);

-- 예시 데이터
INSERT INTO shop_items VALUES
-- 크레딧 상점 (Common/Rare)
('basic_cockpit', '기본 조종석', '표준형 조종석', 'cockpit', 'cockpit', 'common', 'credits', 5, '🕹️'),
('fluorescent_light', '형광등 조명', '밝은 조명', 'item', 'placeable', 'common', 'credits', 8, '💡'),
('standard_cabinet', '표준 수납장', '기본 수납장', 'item', 'placeable', 'common', 'credits', 12, '🗄️'),
('color_wallpaper', '색상 벽지', '다양한 색상', 'background', 'background', 'rare', 'credits', 15, '🎨'),
('luxury_sofa', '고급 소파', '편안한 소파', 'item', 'placeable', 'rare', 'credits', 30, '🛋️'),

-- 우주 부품 상점 (Epic/Legendary)
('plant_grower', '식물 재배기', '우주에서 식물 재배', 'item', 'placeable', 'epic', 'spaceParts', 5, '🌿'),
('ai_robot_arm', 'AI 로봇 팔', '자동화 로봇', 'item', 'placeable', 'epic', 'spaceParts', 7, '🤖'),
('neon_sign', '네온 사인', '화려한 네온', 'item', 'placeable', 'epic', 'spaceParts', 10, '💫'),
('zero_g_cockpit', '무중력 조종석', '최첨단 조종석', 'cockpit', 'cockpit', 'legendary', 'spaceParts', 20, '⚡'),
('hologram_globe', '홀로그램 지구본', '3D 지구', 'item', 'placeable', 'legendary', 'spaceParts', 18, '🌍'),
('galaxy_window', '은하수 배경 창문', '우주 뷰', 'background', 'background', 'legendary', 'spaceParts', 25, '🌌');
```

---

### **9️⃣ shop_purchases 테이블 (기존 업데이트)**

```sql
CREATE TABLE shop_purchases (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  item_name VARCHAR(200),
  item_category VARCHAR(50),
  item_rarity VARCHAR(50),
  price_type VARCHAR(50) NOT NULL,       -- 'credits' or 'spaceParts'
  price_amount INTEGER NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES shop_items(id),
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_shop_purchases_user ON shop_purchases(user_id);
```

---

## 🔧 구현 가이드

### **1. 스테이지 완료 로직**

```javascript
async function completeStage(userId, stageId, sectorId, playTime, starsEarned) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. 유저 정보 조회
    const userResult = await client.query(
      'SELECT total_stars, credits, space_parts FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    const oldStars = user.total_stars;
    const newTotalStars = oldStars + starsEarned;
    
    // 2. 스테이지 완료 기록
    await client.query(
      'INSERT INTO stage_completions (user_id, stage_id, sector_id, stars_earned, play_time) VALUES ($1, $2, $3, $4, $5)',
      [userId, stageId, sectorId, starsEarned, playTime]
    );
    
    // 3. 별 업데이트
    await client.query(
      'UPDATE users SET total_stars = $1 WHERE id = $2',
      [newTotalStars, userId]
    );
    
    // 4. 마일스톤 체크 및 보상 지급
    const milestoneResult = await client.query(
      `SELECT * FROM milestones 
       WHERE required_stars <= $1 
       AND required_stars > $2 
       ORDER BY required_stars ASC`,
      [newTotalStars, oldStars]
    );
    
    let totalCreditsEarned = 0;
    let totalSpacePartsEarned = 0;
    let sectorUnlocked = null;
    
    for (const milestone of milestoneResult.rows) {
      // 마일스톤 달성 기록
      await client.query(
        'INSERT INTO user_milestones (user_id, milestone_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, milestone.id]
      );
      
      totalCreditsEarned += milestone.reward_credits;
      totalSpacePartsEarned += milestone.reward_space_parts;
      
      // 섹터 해금
      if (milestone.unlocks_sector_id) {
        await client.query(
          'INSERT INTO user_sectors (user_id, sector_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, milestone.unlocks_sector_id]
        );
        
        // 섹터 정보 조회
        const sectorInfo = await client.query(
          'SELECT id, name, unlock_bonus_credits, unlock_bonus_space_parts FROM sectors WHERE id = $1',
          [milestone.unlocks_sector_id]
        );
        
        if (sectorInfo.rows.length > 0) {
          sectorUnlocked = sectorInfo.rows[0];
          totalCreditsEarned += sectorInfo.rows[0].unlock_bonus_credits;
          totalSpacePartsEarned += sectorInfo.rows[0].unlock_bonus_space_parts;
        }
      }
    }
    
    // 5. 자원 지급
    if (totalCreditsEarned > 0 || totalSpacePartsEarned > 0) {
      await client.query(
        'UPDATE users SET credits = credits + $1, space_parts = space_parts + $2 WHERE id = $3',
        [totalCreditsEarned, totalSpacePartsEarned, userId]
      );
    }
    
    // 6. 해금된 섹터 목록 조회
    const unlockedSectorsResult = await client.query(
      'SELECT sector_id FROM user_sectors WHERE user_id = $1 ORDER BY sector_id',
      [userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      newTotalStars,
      credits: user.credits + totalCreditsEarned,
      spaceParts: user.space_parts + totalSpacePartsEarned,
      milestoneRewards: {
        triggered: milestoneResult.rows.length > 0,
        creditsEarned: totalCreditsEarned,
        spacePartsEarned: totalSpacePartsEarned,
        sectorUnlocked
      },
      newUnlockedSectors: unlockedSectorsResult.rows.map(r => r.sector_id)
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

### **2. 데일리 퍼즐 완료 로직**

```javascript
async function completeDailyPuzzle(userId, puzzleDate, playTime) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. 오늘 이미 완료했는지 체크
    const existingCompletion = await client.query(
      'SELECT * FROM daily_puzzle_completions WHERE user_id = $1 AND puzzle_date = $2',
      [userId, puzzleDate]
    );
    
    if (existingCompletion.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Already completed today\'s puzzle'
      };
    }
    
    // 2. 완료 기록
    await client.query(
      'INSERT INTO daily_puzzle_completions (user_id, puzzle_date, play_time, space_parts_earned) VALUES ($1, $2, $3, 1)',
      [userId, puzzleDate, playTime]
    );
    
    // 3. 우주 부품 지급
    await client.query(
      'UPDATE users SET space_parts = space_parts + 1 WHERE id = $1',
      [userId]
    );
    
    // 4. 현재 우주 부품 조회
    const userResult = await client.query(
      'SELECT space_parts FROM users WHERE id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      spacePartsEarned: 1,
      newTotalSpaceParts: userResult.rows[0].space_parts,
      message: '오늘의 퍼즐 완료! 우주 부품 1개 획득!'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

### **3. 상점 구매 로직 (업데이트)**

```javascript
async function purchaseShopItem(userId, itemId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. 아이템 정보 조회
    const itemResult = await client.query(
      'SELECT * FROM shop_items WHERE id = $1',
      [itemId]
    );
    
    if (itemResult.rows.length === 0) {
      throw new Error('Item not found');
    }
    
    const item = itemResult.rows[0];
    
    // 2. 유저 자원 확인
    const userResult = await client.query(
      'SELECT credits, space_parts FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // 3. 이미 구매했는지 확인
    const existingPurchase = await client.query(
      'SELECT * FROM shop_purchases WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    
    if (existingPurchase.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Item already purchased' };
    }
    
    // 4. 자원 부족 확인
    if (item.price_type === 'credits' && user.credits < item.price_amount) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Insufficient credits' };
    }
    
    if (item.price_type === 'spaceParts' && user.space_parts < item.price_amount) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Insufficient space parts' };
    }
    
    // 5. 구매 기록
    await client.query(
      `INSERT INTO shop_purchases 
       (user_id, item_id, item_name, item_category, item_rarity, price_type, price_amount) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, itemId, item.name, item.category, item.rarity, item.price_type, item.price_amount]
    );
    
    // 6. 자원 차감
    if (item.price_type === 'credits') {
      await client.query(
        'UPDATE users SET credits = credits - $1 WHERE id = $2',
        [item.price_amount, userId]
      );
    } else {
      await client.query(
        'UPDATE users SET space_parts = space_parts - $1 WHERE id = $2',
        [item.price_amount, userId]
      );
    }
    
    // 7. 최신 자원 조회
    const updatedUser = await client.query(
      'SELECT credits, space_parts FROM users WHERE id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      remainingCredits: updatedUser.rows[0].credits,
      remainingSpaceParts: updatedUser.rows[0].space_parts,
      message: `${item.name} 구매 완료!`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## 📊 테스트 체크리스트

### **자원 시스템:**
- [ ] 신규 유저 가입 시 크레딧 20개, 우주 부품 0개 지급
- [ ] 별은 절대 감소하지 않음
- [ ] 크레딧과 우주 부품은 구매 시 정확히 차감됨

### **마일스톤 시스템:**
- [ ] 별 5개 달성 시 크레딧 10, 우주 부품 1 지급
- [ ] 별 15개 달성 시 섹터 2 해금 + 보너스 지급
- [ ] 같은 마일스톤 중복 달성 방지
- [ ] 여러 마일스톤 동시 달성 시 모든 보상 지급

### **섹터 해금:**
- [ ] 필요 별 개수 충족 시 섹터 자동 해금
- [ ] 섹터 해금 보너스 정확히 지급
- [ ] 해금된 섹터는 영구적으로 접근 가능

### **데일리 퍼즐:**
- [ ] 매일 한 번만 완료 가능
- [ ] 완료 시 우주 부품 1개 정확히 지급
- [ ] 같은 날짜 중복 완료 방지

### **상점:**
- [ ] 크레딧 상점과 우주 부품 상점 분리
- [ ] 자원 부족 시 구매 실패
- [ ] 같은 아이템 중복 구매 방지
- [ ] 구매 후 자원 정확히 차감

---

## 🚀 배포 전 확인사항

1. **환경 변수:**
   - 데이터베이스 연결 정보
   - JWT 시크릿 키

2. **데이터베이스 마이그레이션:**
   ```bash
   # 테이블 생성
   npm run migrate
   
   # 마스터 데이터 삽입 (milestones, sectors, shop_items)
   npm run seed
   ```

3. **초기 데이터 검증:**
   - 마일스톤 12개 존재
   - 섹터 5개 존재
   - 상점 아이템 존재

---

### **7️⃣ 리더보드 조회**

#### **엔드포인트:**
```
GET /sectors/{sectorSlug}/leaderboard
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}"
}
```

#### **응답 (200 OK):**
```json
{
  "topPlayers": [
    {
      "userId": "user123",
      "nickname": "SpaceMaster",
      "totalStars": 85,
      "completedPuzzles": 25,
      "rank": 1
    },
    {
      "userId": "user456",
      "nickname": "PuzzleKing",
      "totalStars": 72,
      "completedPuzzles": 20,
      "rank": 2
    }
  ],
  "myRank": {
    "userId": "currentUser",
    "nickname": "MyName",
    "totalStars": 45,
    "completedPuzzles": 12,
    "rank": 15
  }
}
```

**필드 설명:**
- `topPlayers`: 상위 5명의 플레이어 (섹터별 총 별 개수 기준)
- `myRank`: 현재 사용자의 순위 정보
- `completedPuzzles`: 해당 섹터에서 완료한 퍼즐 개수

---

### **8️⃣ 갤러리 조회 (클리어한 천체 목록)**

#### **엔드포인트:**
```
GET /user/gallery
```

#### **헤더:**
```javascript
{
  "Authorization": "Bearer {access_token}"
}
```

#### **응답 (200 OK):**
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

**필드 설명:**
- `clearedCelestials`: 클리어한 모든 천체 목록 (최근 클리어 순)
- `totalCleared`: 전체 클리어한 천체 개수
- `totalStars`: 클리어로 획득한 총 별 개수

---

## 📞 문의

프론트엔드 팀에서 추가로 필요한 엔드포인트나 데이터가 있으면 알려주세요!
