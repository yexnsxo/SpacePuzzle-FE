# 🆔 천체 식별자 가이드 (프론트-백엔드 연동)

## 📋 개요

프론트엔드와 백엔드 간의 천체 식별자 불일치 문제를 해결하기 위한 가이드입니다.

---

## 🔑 두 가지 식별자

### 1️⃣ **`id` (UUID)**
- **형식**: UUID v4 (예: `9e588969-eeec-47ca-8ffa-3d90aa34a4f0`)
- **용도**: 데이터베이스 Primary Key
- **특징**: 
  - 고유성 보장
  - 공백 없음
  - URL-safe

### 2️⃣ **`nasaId` (문자열 식별자)**
- **형식**: 소문자 + 하이픈 (예: `proxima-b`, `vela-pulsar`, `earth`)
- **용도**: API 엔드포인트, 사람이 읽기 쉬운 식별자
- **특징**:
  - 가독성 높음
  - URL-friendly (공백 없음, 하이픈 사용)
  - NASA 공식 명칭 기반

---

## 🔌 API 엔드포인트별 사용 식별자

| API | 엔드포인트 | 사용 식별자 | 예시 |
|-----|-----------|------------|------|
| **리더보드 조회** | `GET /celestial-objects/{celestialId}/leaderboard` | `nasaId` | `/celestial-objects/proxima-b/leaderboard` |
| **퍼즐 완료** | `POST /celestial-objects/{celestialId}/complete` | `nasaId` | `/celestial-objects/proxima-b/complete` |
| **천체 상세 조회** | `GET /celestial-objects/{celestialId}` | `nasaId` | `/celestial-objects/proxima-b` |
| **APOD 리더보드** | `GET /celestial-objects/apod/leaderboard` | 고정값 `"apod"` | `/celestial-objects/apod/leaderboard` |
| **APOD 완료** | `POST /celestial-objects/apod/complete` | 고정값 `"apod"` | `/celestial-objects/apod/complete` |

---

## 🗄️ 데이터베이스 스키마

### **`celestial_objects` 테이블**

```sql
CREATE TABLE celestial_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nasa_id VARCHAR(100) UNIQUE NOT NULL,  -- ⭐ 이 필드로 조회!
  title VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description TEXT,
  image_url TEXT,
  difficulty INTEGER DEFAULT 1,
  grid_size INTEGER DEFAULT 3,
  reward_stars INTEGER DEFAULT 3,
  puzzle_type VARCHAR(50) DEFAULT 'jigsaw',
  display_order INTEGER DEFAULT 0,
  required_stars INTEGER DEFAULT 0,
  locked BOOLEAN DEFAULT false,
  sector_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ⭐ nasa_id에 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX idx_celestial_objects_nasa_id ON celestial_objects(nasa_id);
```

---

## 💡 백엔드 구현 가이드

### **1. 리더보드 API**

```javascript
// ❌ 잘못된 방법 (UUID로 조회)
app.get('/celestial-objects/:celestialId/leaderboard', async (req, res) => {
  const { celestialId } = req.params;
  
  // UUID로 조회하면 실패!
  const celestial = await db.query(
    'SELECT * FROM celestial_objects WHERE id = $1',
    [celestialId]
  );
});

// ✅ 올바른 방법 (nasaId로 조회)
app.get('/celestial-objects/:celestialId/leaderboard', async (req, res) => {
  const { celestialId } = req.params;  // celestialId는 실제로는 nasaId
  
  // nasaId로 조회 (예: "proxima-b", "vela-pulsar")
  const celestial = await db.query(
    'SELECT * FROM celestial_objects WHERE nasa_id = $1',
    [celestialId]
  );
  
  if (!celestial.rows.length) {
    return res.status(404).json({ error: '천체를 찾을 수 없습니다.' });
  }
  
  // 리더보드 데이터 조회
  const leaderboard = await db.query(`
    SELECT 
      u.id as user_id,
      u.nickname,
      sc.play_time,
      sc.stars_earned,
      sc.completed_at,
      RANK() OVER (ORDER BY sc.play_time ASC) as rank
    FROM stage_completions sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.celestial_id = $1
    ORDER BY sc.play_time ASC
    LIMIT 5
  `, [celestial.rows[0].id]);  // ⚠️ 내부적으로는 UUID 사용
  
  res.json({
    celestialId: celestial.rows[0].nasa_id,
    celestialName: celestial.rows[0].title,
    topPlayers: leaderboard.rows,
    myRank: { /* ... */ }
  });
});
```

### **2. 퍼즐 완료 API**

```javascript
app.post('/celestial-objects/:celestialId/complete', async (req, res) => {
  const { celestialId } = req.params;  // nasaId (예: "proxima-b")
  const { playTime } = req.body;
  const userId = req.user.id;
  
  // nasaId로 천체 조회
  const celestial = await db.query(
    'SELECT * FROM celestial_objects WHERE nasa_id = $1',
    [celestialId]
  );
  
  if (!celestial.rows.length) {
    return res.status(404).json({ error: '천체를 찾을 수 없습니다.' });
  }
  
  // 완료 기록 저장 (UUID 사용)
  await db.query(`
    INSERT INTO stage_completions (user_id, celestial_id, play_time, stars_earned)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, celestial_id) 
    DO UPDATE SET 
      play_time = LEAST(stage_completions.play_time, EXCLUDED.play_time),
      updated_at = CURRENT_TIMESTAMP
  `, [userId, celestial.rows[0].id, playTime, celestial.rows[0].reward_stars]);
  
  res.json({ success: true, starsEarned: celestial.rows[0].reward_stars });
});
```

---

## 🎯 `nasaId` 작명 규칙

### **태양계 천체**
```
earth          → 지구
mars           → 화성
jupiter        → 목성
saturn         → 토성
uranus         → 천왕성
neptune        → 해왕성
pluto          → 명왕성
sun            → 태양
mercury        → 수성
venus          → 금성
```

### **외계 행성**
```
proxima-b      → 프록시마 b
kepler-186f    → 케플러-186f
trappist-1e    → 트라피스트-1e
```

### **성운**
```
crab-nebula    → 게 성운
orion-nebula   → 오리온 성운
helix-nebula   → 나선 성운
```

### **은하**
```
andromeda      → 안드로메다 은하
milky-way      → 우리 은하
whirlpool      → 소용돌이 은하
```

### **극한 천체**
```
vela-pulsar    → 벨라 펄서
cygnus-x1      → 백조자리 X-1
m87-black-hole → M87 블랙홀
```

### **APOD (특수 케이스)**
```
apod           → 오늘의 천문 사진
```

---

## 🔧 프론트엔드 데이터 예시

```json
{
  "id": "9e588969-eeec-47ca-8ffa-3d90aa34a4f0",
  "nasaId": "vela-pulsar",
  "title": "벨라 펄서",
  "nameEn": "Vela Pulsar",
  "description": "고속으로 회전하는 중성자별",
  "imageUrl": "https://science.nasa.gov/...",
  "difficulty": 5,
  "gridSize": 8,
  "rewardStars": 5,
  "puzzleType": "jigsaw",
  "displayOrder": 1,
  "locked": false,
  "isCleared": false
}
```

**API 호출 시:**
```javascript
// ✅ 올바른 방법
fetch(`/celestial-objects/${celestialBody.nasaId}/leaderboard`)
// → /celestial-objects/vela-pulsar/leaderboard

// ❌ 잘못된 방법
fetch(`/celestial-objects/${celestialBody.id}/leaderboard`)
// → /celestial-objects/9e588969-eeec-47ca-8ffa-3d90aa34a4f0/leaderboard
```

---

## ⚠️ 주의사항

### **1. URL 인코딩**
프론트엔드에서 `encodeURIComponent()`를 사용하므로, 백엔드는 자동으로 디코딩됩니다.

```javascript
// 프론트엔드
fetch(`/celestial-objects/${encodeURIComponent('vela-pulsar')}/leaderboard`)
// → /celestial-objects/vela-pulsar/leaderboard

// Express.js는 자동으로 디코딩
app.get('/celestial-objects/:celestialId/leaderboard', (req, res) => {
  console.log(req.params.celestialId);  // "vela-pulsar"
});
```

### **2. 대소문자 구분**
`nasaId`는 **소문자**로 통일합니다.

```javascript
// ✅ 올바름
"proxima-b", "vela-pulsar", "crab-nebula"

// ❌ 잘못됨
"Proxima-B", "Vela Pulsar", "Crab_Nebula"
```

### **3. 공백 금지**
`nasaId`에는 **공백 대신 하이픈(`-`)** 을 사용합니다.

```javascript
// ✅ 올바름
"vela-pulsar"

// ❌ 잘못됨 (URL 인코딩 문제 발생)
"Vela Pulsar"
```

---

## 🧪 테스트

### **1. 리더보드 조회 테스트**

```bash
# ✅ 성공
curl -H "Authorization: Bearer TOKEN" \
  https://spacepuzzle.onrender.com/celestial-objects/proxima-b/leaderboard

# ❌ 실패 (UUID 사용)
curl -H "Authorization: Bearer TOKEN" \
  https://spacepuzzle.onrender.com/celestial-objects/9e588969-eeec-47ca-8ffa-3d90aa34a4f0/leaderboard
```

### **2. 퍼즐 완료 테스트**

```bash
# ✅ 성공
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"playTime": 120}' \
  https://spacepuzzle.onrender.com/celestial-objects/vela-pulsar/complete
```

---

## 📊 데이터 삽입 예시

### **SQL 스크립트**

```sql
-- 외계 행성 섹터 천체 추가
INSERT INTO celestial_objects (
  nasa_id, 
  title, 
  name_en, 
  description, 
  difficulty, 
  grid_size, 
  reward_stars,
  sector_id
) VALUES 
  ('proxima-b', '프록시마 b', 'Proxima Centauri b', '가장 가까운 외계행성', 3, 5, 3, 'exoplanet-systems-uuid'),
  ('kepler-186f', '케플러-186f', 'Kepler-186f', '지구와 크기가 비슷한 외계행성', 2, 4, 2, 'exoplanet-systems-uuid'),
  ('trappist-1e', '트라피스트-1e', 'TRAPPIST-1e', '생명체 존재 가능성이 높은 행성', 3, 5, 3, 'exoplanet-systems-uuid');

-- 극한 천체 섹터
INSERT INTO celestial_objects (
  nasa_id, 
  title, 
  name_en, 
  description, 
  difficulty, 
  grid_size, 
  reward_stars,
  sector_id
) VALUES 
  ('vela-pulsar', '벨라 펄서', 'Vela Pulsar', '고속으로 회전하는 중성자별', 5, 8, 5, 'deep-space-extremes-uuid'),
  ('cygnus-x1', '백조자리 X-1', 'Cygnus X-1', '최초로 발견된 블랙홀', 5, 8, 5, 'deep-space-extremes-uuid');
```

---

## 🎯 요약

### **핵심 포인트**
1. **API 엔드포인트는 `nasaId`를 사용** (예: `proxima-b`, `vela-pulsar`)
2. **데이터베이스 내부는 `id` (UUID) 사용**
3. **`nasaId`는 소문자 + 하이픈, 공백 없음**
4. **백엔드는 `nasa_id` 컬럼으로 조회**
5. **프론트엔드는 `nasaId` 필드를 우선 사용**

### **문제 해결 체크리스트**
- [ ] `celestial_objects` 테이블에 `nasa_id` 컬럼 추가
- [ ] 모든 천체에 `nasa_id` 값 설정 (소문자 + 하이픈)
- [ ] API 엔드포인트에서 `nasa_id`로 조회
- [ ] `nasa_id` 컬럼에 UNIQUE 제약조건 추가
- [ ] `nasa_id` 컬럼에 인덱스 생성
- [ ] 404 에러 처리 추가
