# 🚀 SpacePuzzle 백엔드 API 명세서

## 📌 기본 정보

**Base URL:** `https://spacepuzzle.onrender.com`

**인증:** Bearer Token (Supabase JWT)
```
Authorization: Bearer {access_token}
```

---

## 🎮 API 목록

### 1. 🔐 로그인
```
POST /auth/login
```
**설명:** Supabase `access_token` 검증 + 유저 생성/갱신

**Headers:**
```
Authorization: Bearer {access_token}
```

**응답:**
```json
{
  "message": "로그인 성공!",
  "user": {
    "id": "uuid-...",
    "email": "user@example.com",
    "nickname": "SpaceExplorer",
    "stars": 0,
    "credits": 20,
    "spaceParts": 0
  },
  "isNewUser": true
}
```

**설명:**
- 신규 유저: `isNewUser: true`, 초기 자원 (별 0, 크레딧 20, 우주부품 0) 지급
- 기존 유저: `isNewUser: false`, 현재 자원 반환

---

### 2. 👤 유저 프로필 조회
```
GET /me
```
**설명:** 유저 프로필 + 최근 활동

**Query Parameters:**
```
?days=30  (1~365, 기본값: 30)
```

**응답:**
```json
{
  "nickname": "SpaceExplorer",
  "stars": 10,
  "parts": 2,
  "credits": 20,
  "totalClears": 5,
  "recentActivity": [
    { "date": "2026-01-19", "count": 2 }
  ]
}
```

**설명:**
- `days`: 조회할 최근 활동 일수 (기본 30일)
- `parts`: 우주 부품 개수
- `recentActivity`: 날짜별 퍼즐 클리어 횟수

---

### 3. 📖 클리어한 천체 목록 (도감)
```
GET /me/cleared-celestial-objects
```
**설명:** 유저가 클리어한 천체 목록 조회

**응답:**
```json
{
  "cleared": [
    {
      "id": "uuid-...",
      "nasaId": "earth",
      "title": "지구",
      "nameEn": "Earth",
      "imageUrl": "https://...",
      "difficulty": "2",
      "gridSize": 4,
      "rewardStars": 2,
      "clearedAt": "2026-01-19T10:30:00Z"
    }
  ]
}
```

**설명:**
- `cleared`: 클리어한 천체 배열 (최근 클리어 순)
- `difficulty`: 난이도 (1: 쉬움, 2: 보통, 3: 어려움)
- `gridSize`: 퍼즐 그리드 크기 (3x3, 4x4 등)
- `rewardStars`: 획득한 별 개수

---

### 4. 💎 유저 자원 조회
```
GET /user/resources
```
**설명:** 유저의 자원 + 해금된 섹터 목록

**응답:**
```json
{
  "stars": 25,
  "credits": 45,
  "spaceParts": 3,
  "unlockedSectors": ["sector-uuid-1", "sector-uuid-2"]
}
```

**설명:**
- `unlockedSectors`: 해금된 섹터의 UUID 배열

---

### 5. 🎁 마일스톤 목록
```
GET /milestones
```
**설명:** 별 마일스톤 목록 + 다음 목표

**응답:**
```json
{
  "milestones": [
    {
      "requiredStars": 15,
      "credits": 20,
      "spaceParts": 2,
      "sectorUnlock": {
        "id": "sector-uuid-...",
        "name": "외계 행성"
      },
      "achieved": true
    },
    {
      "requiredStars": 28,
      "credits": 25,
      "spaceParts": 3,
      "sectorUnlock": {
        "id": "sector-uuid-...",
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

**설명:**
- `milestones`: 모든 마일스톤 목록
- `achieved`: 달성 여부
- `nextMilestone`: 다음 달성 목표 (별 N개 필요)

---

## 🌍 Sector & Celestial API

### 6. 🌌 섹터 천체 목록 조회
```
GET /sectors/:slug/celestial-objects
```
**설명:** 섹터 정보 + 천체 목록 (잠금/클리어 포함)

**응답:**
```json
{
  "sector": {
    "id": "sector-uuid-...",
    "slug": "solar-system",
    "name": "태양계",
    "requiredStars": 0
  },
  "locked": false,
  "celestialObjects": [
    {
      "id": "celestial-uuid-...",
      "nasaId": "earth",
      "title": "지구",
      "nameEn": "Earth",
      "difficulty": "2",
      "gridSize": 4,
      "rewardStars": 2,
      "puzzleType": "jigsaw",
      "displayOrder": 3,
      "locked": false,
      "isCleared": true
    }
  ]
}
```

**설명:**
- `slug`: 섹터 슬러그 (예: solar-system, exo-systems)
- `locked`: 섹터 잠금 여부
- `isCleared`: 천체 클리어 여부

---

### 7. 🧩 퍼즐 시작 데이터
```
GET /celestial-objects/:nasaId/puzzle
```
**설명:** 퍼즐 시작 시 필요한 데이터 (seed/config 생성)

**응답:**
```json
{
  "nasaId": "earth",
  "title": "지구",
  "imageUrl": "https://...",
  "puzzleType": "jigsaw",
  "difficulty": "2",
  "gridSize": 4,
  "rewardStars": 2,
  "puzzleSeed": 123456,
  "puzzleConfig": {
    "gridSize": 4,
    "seed": 123456
  }
}
```

**설명:**
- `puzzleSeed`: 재현 가능한 퍼즐 생성을 위한 시드
- `puzzleConfig`: 프론트엔드 퍼즐 엔진에 전달할 설정

---

### 8. 💾 이어하기 상태 조회
```
GET /celestial-objects/:nasaId/state
```
**설명:** 저장된 퍼즐 진행 상태 조회

**응답:**
```json
{
  "saveState": {
    "pieces": [...],
    "playTime": 120
  },
  "lastAttemptAt": "2026-01-19T10:30:00Z",
  "isCompleted": false
}
```

**설명:**
- `saveState`: 퍼즐 진행 상태 (null이면 새로 시작)
- `isCompleted`: 이미 완료했는지 여부

---

### 9. 💾 이어하기 상태 저장
```
POST /celestial-objects/:nasaId/save
```
**설명:** 현재 퍼즐 진행 상태 저장

**요청:**
```json
{
  "saveState": {
    "pieces": [...],
    "groups": [...]
  },
  "playTime": 120
}
```

**응답:**
```json
{
  "success": true,
  "message": "저장 완료"
}
```

---

### 10. ✅ 퍼즐 완료
```
POST /celestial-objects/:nasaId/complete
```
**설명:** 퍼즐 완료 기록 + 보상 지급

**요청:**
```json
{
  "playTime": 120
}
```

**응답:**
```json
{
  "message": "퍼즐 완료 처리 완료",
  "isFirstClear": true,
  "rewardStars": 2,
  "totalStars": 12,
  "record": {
    "id": "record-uuid-...",
    "bestTime": 120,
    "completedAt": "2026-01-19T10:30:00Z"
  }
}
```

**설명:**
- `isFirstClear`: 첫 클리어 여부 (첫 클리어만 별 지급)
- `rewardStars`: 획득한 별 개수
- `totalStars`: 유저의 총 별 개수
- `record`: 최고 기록 (bestTime 갱신 시 업데이트)

---

### 11. 🏆 천체별 리더보드
```
GET /celestial-objects/:nasaId/leaderboard
```
**설명:** 특정 천체의 TOP 5 + 내 순위

**응답:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user-uuid-...",
      "nickname": "SpeedRunner",
      "bestTime": 42
    }
  ],
  "currentUser": {
    "userId": "user-uuid-...",
    "nickname": "MyName",
    "bestTime": 58,
    "rank": 7
  }
}
```

**설명:**
- `leaderboard`: TOP 5 플레이어
- `currentUser`: 내 순위 (null이면 기록 없음)
- `bestTime`: 최단 클리어 시간 (초 단위)

---

## 🌠 APOD API

### 12. 📸 NASA APOD 데이터
```
GET /apod/today
```
**설명:** NASA Astronomy Picture of the Day 데이터 조회

**응답:**
```json
{
  "date": "2026-01-19",
  "title": "M51: The Whirlpool Galaxy",
  "explanation": "Follow the handle of the Big Dipper...",
  "url": "https://apod.nasa.gov/apod/image/2601/...",
  "hdurl": "https://apod.nasa.gov/apod/image/2601/...hd.jpg",
  "media_type": "image"
}
```

**설명:**
- `media_type`: "image" 또는 "video"
- `hdurl`: 고해상도 이미지 URL

---

### 13. 🎁 APOD 퍼즐 완료
```
POST /celestial-objects/apod/complete
```
**설명:** APOD 퍼즐 완료 (우주 부품 5개 지급, gridSize=7)

**요청:**
```json
{
  "playTime": 180,
  "date": "2026-01-19",
  "title": "M51: The Whirlpool Galaxy"
}
```

**응답:**
```json
{
  "success": true,
  "message": "APOD puzzle completed successfully",
  "data": {
    "apodDate": "2026-01-19",
    "playTime": 180,
    "rewardParts": 5
  }
}
```

**설명:**
- APOD 퍼즐은 하루 1회만 완료 가능
- 우주 부품 5개 지급 (별은 지급하지 않음)
- gridSize는 항상 7x7 (고정)

---

### 14. 스테이지 완료
```
POST /stages/complete
```
**요청:**
```json
{
  "stageId": "earth_stage_1",
  "sectorId": 1,
  "playTime": 120,
  "starsEarned": 3
}
```
**응답:**
```json
{
  "success": true,
  "newTotalStars": 28,
  "credits": 45,
  "spaceParts": 3,
  "milestoneRewards": {
    "triggered": true,
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

---

## 🎮 게임 진행 API

### 15. 데일리 퍼즐 완료
```
POST /daily-puzzle/complete
```
**요청:**
```json
{
  "puzzleDate": "2026-01-19",
  "playTime": 180
}
```
**응답:**
```json
{
  "success": true,
  "spacePartsEarned": 1,
  "newTotalSpaceParts": 4
}
```

---

### 16. 섹터 목록 조회
```
GET /sectors
```
**응답:**
```json
{
  "sectors": [
    {
      "id": 1,
      "name": "태양계",
      "requiredStars": 0,
      "unlocked": true
    },
    {
      "id": 2,
      "name": "외계 행성",
      "requiredStars": 15,
      "unlocked": true
    }
  ],
  "currentStars": 25
}
```

---

## 🛍️ Shop API

### 17. 구매 내역 조회
```
GET /shop/purchased
```
**설명:** 유저가 구매한 아이템 목록 조회

**응답:**
```json
{
  "items": ["item_plant", "item_poster", "bg_luxury", "cockpit_advanced"]
}
```

**설명:**
- `items`: 구매한 아이템 ID 배열

---

### 18. 아이템 구매
```
POST /shop/purchase
```
**설명:** 상점에서 아이템 구매

**요청:**
```json
{
  "itemId": "item_plant"
}
```

**응답:**
```json
{
  "success": true,
  "itemId": "item_plant",
  "remainingStars": 10,
  "remainingSpaceParts": 3
}
```

**설명:**
- 중복 구매 방지 (이미 구매한 아이템은 구매 불가)
- 자원 부족 시 `success: false` 반환
- `remainingStars`, `remainingSpaceParts`: 구매 후 남은 자원

---

## 📊 Gallery & Leaderboard API

### 19. 리더보드 조회
```
GET /sectors/{sectorSlug}/leaderboard
```
**응답:**
```json
{
  "topPlayers": [
    {
      "nickname": "SpaceMaster",
      "totalStars": 85,
      "completedPuzzles": 25,
      "rank": 1
    }
  ],
  "myRank": {
    "nickname": "MyName",
    "totalStars": 45,
    "rank": 15
  }
}
```

---

### 20. 갤러리 조회
```
GET /user/gallery
```
**응답:**
```json
{
  "clearedCelestials": [
    {
      "id": "earth",
      "name": "지구",
      "image": "https://...",
      "starsEarned": 3,
      "clearedAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

## 🎨 커스터마이제이션 API

### 22. 커스터마이제이션 조회
```
GET /user/customization
```
**설명:** 유저의 현재 커스터마이제이션 설정 조회

**응답:**
```json
{
  "background": "bg_luxury",
  "cockpit": "cockpit_advanced",
  "items": [
    { "itemId": "item_plant", "x": 100, "y": 200 }
  ]
}
```

**설명:**
- `background`: 현재 설정된 배경 아이템 ID
- `cockpit`: 현재 설정된 조종석 아이템 ID
- `items`: 배치된 아이템 목록 (좌표 포함)

---

### 23. 배경/조종석 변경
```
POST /user/customization/set
```
**설명:** 배경 또는 조종석 변경

**요청:**
```json
{
  "type": "background",
  "itemId": "bg_luxury"
}
```

**응답:**
```json
{
  "success": true,
  "message": "배경이 변경되었습니다."
}
```

**설명:**
- `type`: "background" 또는 "cockpit"
- `itemId`: 변경할 아이템 ID (구매한 아이템만 가능)

---

### 24. 아이템 배치
```
POST /user/customization/place-item
```
**설명:** 우주선 내부에 아이템 배치

**요청:**
```json
{
  "itemId": "item_plant",
  "x": 150,
  "y": 300
}
```

**응답:**
```json
{
  "success": true,
  "message": "아이템이 배치되었습니다."
}
```

**설명:**
- 구매한 아이템만 배치 가능
- 동일한 아이템 중복 배치 가능

---

### 25. 아이템 제거
```
DELETE /user/customization/remove-item
```
**설명:** 배치된 아이템 제거

**요청:**
```json
{
  "itemId": "item_plant",
  "x": 150,
  "y": 300
}
```

**응답:**
```json
{
  "success": true,
  "message": "아이템이 제거되었습니다."
}
```

---

## 💾 데이터베이스 테이블

### users
```sql
- id (PK)
- total_stars (누적 별)
- credits (크레딧)
- space_parts (우주 부품)
```

### milestones
```sql
- required_stars
- reward_credits
- reward_space_parts
- unlocks_sector_id
```

### sectors
```sql
- id (PK)
- name
- required_stars
```

### stage_completions
```sql
- user_id
- stage_id
- stars_earned
- play_time
```

### shop_purchases
```sql
- user_id
- item_id
- item_category
- price_type
- price_amount
```

---

## 🎁 별 마일스톤

| 별 | 크레딧 | 우주부품 | 섹터 해금 |
|----|--------|---------|----------|
| 5 | 10 | 1 | - |
| 15 | 20 | 2 | 외계 행성 |
| 28 | 25 | 3 | 성운 |
| 45 | 30 | 4 | 은하 |
| 65 | 40 | 5 | 심연 |
| 116 | 100 | 10 | - |

---

## 🔑 핵심 로직

### 스테이지 완료 시:
1. 별 추가
2. 마일스톤 체크
3. 보상 지급 (크레딧 + 우주부품)
4. 섹터 해금 (조건 충족 시)

### 데일리 퍼즐:
- 하루 1회 제한
- 우주 부품 1개 지급

### 상점:
- 크레딧: 일반/레어 아이템
- 우주부품: 에픽/전설 아이템

---

## ✅ 구현 체크리스트

- [ ] 신규 유저 크레딧 20개 지급
- [ ] 별 마일스톤 보상 시스템
- [ ] 섹터 해금 시스템
- [ ] 데일리 퍼즐 제한
- [ ] 리더보드 (섹터별)
- [ ] 갤러리 (클리어 천체)
- [ ] 상점 구매 (중복 방지)
- [ ] 커스터마이제이션 저장

---

**끝!** 🎉
