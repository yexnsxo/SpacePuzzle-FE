# 🔧 프론트엔드-백엔드 필드명 불일치 해결

## 🔴 문제 상황

### **불일치:**
- **프론트엔드**: `celestialId` (UUID) 전송
- **백엔드**: `nasaId`로 조회

### **예시:**
```
프론트: /celestial-objects/2ecaf7b0-95bb-4124-be0d-10730e95df46/leaderboard
                          ↑ UUID (celestialId)

백엔드: SELECT * FROM celestial_objects WHERE nasa_id = '...'
                                              ↑ nasaId로 찾으려 함
결과: 찾지 못함 → 404
```

---

## ✅ 해결 방법

### **옵션 1: 프론트엔드 수정** (완료 ✅)

리더보드 조회 시 `nasaId`를 사용하도록 수정했습니다.

**변경 사항:**
```javascript
// 이전
const response = await fetch(
  `https://spacepuzzle.onrender.com/celestial-objects/${body.id}/leaderboard`
);

// 수정 후
const celestialIdentifier = body.nasaId || body.id;
const response = await fetch(
  `https://spacepuzzle.onrender.com/celestial-objects/${celestialIdentifier}/leaderboard`
);
```

**적용 파일:**
- ✅ `GamePlay.jsx`
- ✅ `ApodInfo.jsx`
- ✅ `StageInfo.jsx`

---

### **옵션 2: 백엔드 수정** (대안)

백엔드에서 `id` (UUID)로 조회하도록 변경:

**현재 코드 (문제):**
```javascript
app.get('/celestial-objects/:id/leaderboard', async (req, res) => {
  const { id } = req.params;
  
  // ❌ nasaId로 찾음
  const celestial = await db.query(
    'SELECT * FROM celestial_objects WHERE nasa_id = $1',
    [id]
  );
  
  if (!celestial.rows[0]) {
    return res.status(404).json({ error: '천체를 찾을 수 없습니다.' });
  }
  
  // 리더보드 조회...
});
```

**수정 코드 (해결):**
```javascript
app.get('/celestial-objects/:id/leaderboard', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // ✅ nasaId 또는 UUID 둘 다 지원
  const celestial = await db.query(`
    SELECT * FROM celestial_objects 
    WHERE nasa_id = $1 OR id = $1
  `, [id]);
  
  const celestialName = celestial.rows[0]?.name || '알 수 없음';
  const stageId = celestial.rows[0]?.nasa_id || id;
  
  // 리더보드 조회 (stage_completions에서는 nasa_id 사용)
  const topPlayers = await db.query(`
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
  `, [stageId]);
  
  const myRank = await db.query(`
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
  `, [stageId, userId]);
  
  res.json({
    celestialId: id,
    celestialName: celestialName,
    topPlayers: topPlayers.rows || [],
    myRank: myRank.rows[0] || null
  });
});
```

---

## 📊 데이터 구조 확인

### **celestial_objects 테이블:**
```
id          | nasa_id    | name
------------|------------|-------
uuid-1234   | mercury    | 수성
uuid-5678   | venus      | 금성
uuid-9012   | earth      | 지구
```

### **stage_completions 테이블:**
```
user_id  | stage_id   | play_time
---------|------------|----------
user-1   | mercury    | 120
user-2   | mercury    | 150
user-1   | earth      | 200
```

**중요:** `stage_completions.stage_id`는 `nasaId`를 저장합니다!

---

## 🎯 권장 방식

### **현재 적용: 옵션 1** (프론트엔드 수정)

**이유:**
- ✅ 빠른 적용 (프론트만 수정)
- ✅ 백엔드 로직 변경 불필요
- ✅ `nasaId` 우선 사용, 없으면 `id` 폴백

**단점:**
- ⚠️ 데이터에 `nasaId`가 반드시 있어야 함

---

## 🧪 테스트

### **1. nasaId 사용 (수정 후):**
```bash
curl -H "Authorization: Bearer {token}" \
  https://spacepuzzle.onrender.com/celestial-objects/mercury/leaderboard
```

**기대 결과:** 200 OK + 리더보드 데이터

### **2. UUID 사용 (폴백):**
```bash
curl -H "Authorization: Bearer {token}" \
  https://spacepuzzle.onrender.com/celestial-objects/2ecaf7b0-95bb-4124-be0d-10730e95df46/leaderboard
```

**기대 결과:** 
- `nasaId`가 없으면 UUID로 요청
- 백엔드가 옵션 2를 적용했다면 작동

---

## 📝 체크리스트

### **프론트엔드** ✅
- [x] `GamePlay.jsx` - `nasaId` 사용
- [x] `ApodInfo.jsx` - `nasaId` 사용
- [x] `StageInfo.jsx` - `nasaId` 사용

### **백엔드** (선택사항)
- [ ] `id` 또는 `nasaId` 둘 다 지원하도록 수정
- [ ] `stage_completions.stage_id`가 `nasaId`인지 확인
- [ ] 테스트

---

## 🚀 다음 단계

1. **페이지 새로고침**
2. **콘솔 확인:**
   ```
   📡 수성 리더보드 요청 시작...
      천체 NASA ID: mercury  ← 이게 나와야 함
   📥 수성 리더보드 응답: 200 OK  ← 성공!
   ```
3. **리더보드 확인**

---

**작성일:** 2026-01-19  
**적용 상태:** 프론트엔드 수정 완료 ✅  
**백엔드 조치:** 필요시 옵션 2 적용
