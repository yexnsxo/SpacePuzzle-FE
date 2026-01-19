# 🐛 리더보드 404 에러 해결 방법

## 📋 문제 상황

### **에러 메시지:**
```
GET /celestial-objects/2ecaf7b0-95bb-4124-be0d-10730e95df46/leaderboard
Status: 404 Not Found
Response: {"error":"천체를 찾을 수 없습니다."}
```

### **원인:**
- 리더보드 API는 정상 작동하지만, 해당 천체 ID가 DB에 없음
- 천체 ID: `2ecaf7b0-95bb-4124-be0d-10730e95df46` (수성)

---

## ✅ 해결 방법 (2가지 옵션)

### **옵션 1: 천체 데이터 추가** (권장 ⭐)

프론트엔드가 사용하는 모든 천체를 DB에 추가하세요.

#### **확인할 천체 목록:**
브라우저 콘솔에서 다음 로그를 확인하여 모든 천체 ID를 수집:
```
📡 수성 리더보드 요청 시작...
   천체 ID: 2ecaf7b0-95bb-4124-be0d-10730e95df46
   천체 데이터: {id: '...', name: '수성', ...}
```

#### **SQL 예시:**
```sql
-- celestial_objects 테이블에 천체 추가
INSERT INTO celestial_objects (id, name, name_en, sector_id, difficulty, ...)
VALUES 
  ('2ecaf7b0-95bb-4124-be0d-10730e95df46', '수성', 'Mercury', 'solar-system', 2, ...),
  -- 다른 천체들도 추가...
ON CONFLICT (id) DO NOTHING;
```

---

### **옵션 2: 리더보드 API 수정**

천체가 없어도 빈 리더보드를 반환하도록 수정

#### **현재 코드 (문제):**
```javascript
app.get('/celestial-objects/:id/leaderboard', async (req, res) => {
  const { id } = req.params;
  
  // 천체 확인
  const celestial = await db.query(
    'SELECT * FROM celestial_objects WHERE id = $1',
    [id]
  );
  
  if (!celestial.rows[0]) {
    return res.status(404).json({ error: '천체를 찾을 수 없습니다.' }); // ❌
  }
  
  // 리더보드 조회...
});
```

#### **수정 코드 (해결):**
```javascript
app.get('/celestial-objects/:id/leaderboard', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // 현재 로그인한 유저
  
  // 천체 정보 조회 (선택사항)
  const celestialResult = await db.query(
    'SELECT name FROM celestial_objects WHERE id = $1',
    [id]
  );
  const celestialName = celestialResult.rows[0]?.name || '알 수 없음';
  
  // 리더보드 조회 (천체가 없어도 진행)
  const topPlayersResult = await db.query(`
    SELECT 
      u.id as "userId",
      u.nickname,
      sc.play_time as "playTime",
      sc.stars_earned as "starsEarned",
      sc.completed_at as "completedAt",
      ROW_NUMBER() OVER (ORDER BY sc.play_time ASC, sc.completed_at ASC) as rank
    FROM stage_completions sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.stage_id = $1
    ORDER BY sc.play_time ASC, sc.completed_at ASC
    LIMIT 5
  `, [id]);
  
  // 내 순위 조회
  const myRankResult = await db.query(`
    WITH ranked_completions AS (
      SELECT 
        user_id,
        play_time,
        stars_earned,
        completed_at,
        ROW_NUMBER() OVER (ORDER BY play_time ASC, completed_at ASC) as rank
      FROM stage_completions
      WHERE stage_id = $1
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
    WHERE rc.user_id = $2
  `, [id, userId]);
  
  // 천체가 없어도 빈 리더보드 반환 ✅
  res.json({
    celestialId: id,
    celestialName: celestialName,
    topPlayers: topPlayersResult.rows || [],
    myRank: myRankResult.rows[0] || null
  });
});
```

---

## 📊 데이터 확인 쿼리

### **1. 현재 등록된 천체 확인**
```sql
SELECT id, name, name_en, sector_id 
FROM celestial_objects 
ORDER BY name;
```

### **2. 특정 천체 ID 확인**
```sql
SELECT * FROM celestial_objects 
WHERE id = '2ecaf7b0-95bb-4124-be0d-10730e95df46';
```

### **3. 리더보드 데이터 확인**
```sql
SELECT 
  sc.*,
  u.nickname
FROM stage_completions sc
JOIN users u ON sc.user_id = u.id
WHERE sc.stage_id = '2ecaf7b0-95bb-4124-be0d-10730e95df46'
ORDER BY sc.play_time ASC;
```

---

## 🎯 권장 사항

### **단기 해결:**
옵션 2를 적용하여 천체가 없어도 에러가 나지 않도록 수정

### **장기 해결:**
1. 옵션 1을 적용하여 모든 천체 데이터를 DB에 추가
2. 프론트엔드와 백엔드 간 천체 ID 동기화
3. 천체 생성 API를 만들어서 자동으로 등록

---

## 🧪 테스트 방법

### **1. 천체가 있는 경우**
```bash
curl -H "Authorization: Bearer {token}" \
  https://spacepuzzle.onrender.com/celestial-objects/2ecaf7b0-95bb-4124-be0d-10730e95df46/leaderboard
```

**기대 결과:**
```json
{
  "celestialId": "2ecaf7b0-95bb-4124-be0d-10730e95df46",
  "celestialName": "수성",
  "topPlayers": [...],
  "myRank": {...}
}
```

### **2. 천체가 없는 경우**
```bash
curl -H "Authorization: Bearer {token}" \
  https://spacepuzzle.onrender.com/celestial-objects/non-existent-id/leaderboard
```

**기대 결과 (옵션 2 적용 후):**
```json
{
  "celestialId": "non-existent-id",
  "celestialName": "알 수 없음",
  "topPlayers": [],
  "myRank": null
}
```

---

## 📝 체크리스트

### **백엔드 팀**
- [ ] 모든 천체 데이터를 DB에 추가 (옵션 1)
- [ ] 또는 리더보드 API 수정 (옵션 2)
- [ ] 천체 ID 목록 프론트엔드 팀과 동기화
- [ ] 테스트 후 확인

### **프론트엔드 팀**
- [ ] 모든 천체 ID 로그 수집
- [ ] 백엔드 팀에 ID 목록 전달
- [ ] 수정 후 테스트

---

**작성일:** 2026-01-19  
**우선순위:** 🔴 높음  
**예상 해결 시간:** 30분 ~ 1시간
