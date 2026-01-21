# 🚀 SpacePuzzle - 우주선 꾸미기 (Room Builder) API 명세서

## 📌 기본 정보

**Base URL:** `https://spacepuzzle.onrender.com`

**인증:** Bearer Token (Supabase JWT)
```
Authorization: Bearer {access_token}
```

---

## 🎨 아이템 카테고리

### 1. **벽지/바닥재 (Wallpaper & Flooring)**
- 타일 전체에 적용되는 배경 스타일
- 그리드 셀의 `wallColor` 또는 `floorColor` 속성으로 저장
- 예: 우주 테마 벽지, 금속 바닥, 나무 바닥 등

### 2. **일반 아이템 (Furniture Items)**
- 그리드 위에 배치되는 오브젝트
- 크기(width, height), 높이(z축), 희귀도를 가짐
- 예: 침대, 의자, 책상, 식물, 장식품 등

### 3. **조종실 (Cockpit)**
- 특별한 기능성 아이템 카테고리
- 우주선 조종/항해와 관련된 필수 장비
- 예: 조종석, 내비게이션 콘솔, 레이더, 통신 장비 등

---

## 📦 데이터 구조

### ItemCategory (아이템 카테고리)
```typescript
type ItemCategory = 'WALLPAPER' | 'FLOORING' | 'FURNITURE' | 'COCKPIT';
```

### Rarity (희귀도)
```typescript
type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
```

### TileType (타일 종류)
```typescript
type TileType = 'NONE' | 'FLOOR' | 'WALL';
```

### Item (아이템 정보)
```typescript
{
  "id": "item_bed_001",
  "name": "우주 침대",
  "category": "FURNITURE",           // 카테고리
  "rarity": "Rare",                  // 희귀도
  "price": {
    "credits": 50,                   // 크레딧 가격 (null이면 크레딧으로 구매 불가)
    "stars": null,                   // 별 가격 (null이면 별로 구매 불가)
    "spaceParts": null               // 우주 부품 가격 (null이면 부품으로 구매 불가)
  },
  "size": [3, 2, 1],                 // [width, height, z-height] (그리드 칸 단위)
  "placeType": "FLOOR",              // "FLOOR" (바닥), "WALL" (벽)
  "imageUrl": "https://cdn.../bed.png",
  "description": "편안한 우주 침대",
  "unlockCondition": null            // 잠금 조건 (null이면 누구나 구매 가능)
}
```

### PlacedItem (배치된 아이템)
```typescript
{
  "placementId": "placement_123",    // 배치 고유 ID
  "itemId": "item_bed_001",          // 아이템 ID
  "originX": 5,                      // 그리드 X 좌표
  "originY": 3,                      // 그리드 Y 좌표
  "heightRange": [0, 1]              // [최소 높이, 최대 높이]
}
```

### GridCell (그리드 셀)
```typescript
{
  "tileType": "FLOOR",               // 타일 종류
  "wallColor": "#3a3a3a",            // 벽 색상 (벽지 ID로 변경 가능)
  "floorColor": "#1a1a1a",           // 바닥 색상 (바닥재 ID로 변경 가능)
  "items": []                        // 배치된 아이템 배열
}
```

### RoomLayout (전체 방 레이아웃)
```typescript
{
  "userId": "uuid-...",
  "roomId": "main",                  // "main", "storage", "gallery" 등
  "gridWidth": 32,                   // 그리드 너비 (타일 수)
  "gridHeight": 18,                  // 그리드 높이 (타일 수)
  "grid": GridCell[][],              // 2D 배열
  "updatedAt": "2026-01-20T12:00:00Z"
}
```

---

## 🔗 API 엔드포인트

### 1. 📋 전체 아이템 목록 조회
```
GET /shop/items
```

**Query Parameters:**
```
?category=FURNITURE      // 선택: WALLPAPER, FLOORING, FURNITURE, COCKPIT
?rarity=Rare             // 선택: Common, Rare, Epic, Legendary
?placeType=FLOOR         // 선택: FLOOR, WALL
```

**응답 예시:**
```json
{
  "items": [
    {
      "id": "item_bed_001",
      "name": "우주 침대",
      "category": "FURNITURE",
      "rarity": "Rare",
      "price": {
        "credits": 50,
        "stars": null,
        "spaceParts": null
      },
      "size": [3, 2, 1],
      "placeType": "FLOOR",
      "imageUrl": "https://cdn.../bed.png",
      "description": "편안한 우주 침대",
      "unlockCondition": null
    },
    {
      "id": "wallpaper_space_001",
      "name": "우주 배경 벽지",
      "category": "WALLPAPER",
      "rarity": "Common",
      "price": {
        "credits": 10,
        "stars": null,
        "spaceParts": null
      },
      "size": [1, 1, 0],
      "placeType": "WALL",
      "imageUrl": "https://cdn.../wallpaper.png",
      "description": "우주를 테마로 한 벽지",
      "unlockCondition": null
    }
  ],
  "total": 50
}
```

**설명:**
- 상점에서 구매 가능한 모든 아이템 조회
- 카테고리별, 희귀도별 필터링 가능
- 프론트엔드는 이 데이터를 상점과 아이템 배치 UI에 사용

---

### 2. 🛒 아이템 구매
```
POST /shop/purchase
```

**Request Body:**
```json
{
  "itemId": "item_bed_001",
  "quantity": 1
}
```

**응답:**
```json
{
  "success": true,
  "message": "구매 완료!",
  "purchased": {
    "itemId": "item_bed_001",
    "quantity": 1
  },
  "userBalance": {
    "credits": 150,
    "stars": 10,
    "spaceParts": 3
  }
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": "INSUFFICIENT_CREDITS",
  "message": "크레딧이 부족합니다"
}
```

**에러 코드:**
- `INSUFFICIENT_CREDITS`: 크레딧 부족
- `INSUFFICIENT_STARS`: 별 부족
- `INSUFFICIENT_PARTS`: 우주 부품 부족
- `ITEM_NOT_FOUND`: 아이템을 찾을 수 없음
- `LOCKED_ITEM`: 잠금 조건 미충족

---

### 3. 🎒 보유 아이템 목록 조회
```
GET /inventory
```

**Query Parameters:**
```
?category=FURNITURE      // 선택: WALLPAPER, FLOORING, FURNITURE, COCKPIT
```

**응답:**
```json
{
  "items": [
    {
      "itemId": "item_bed_001",
      "itemData": {
        "id": "item_bed_001",
        "name": "우주 침대",
        "category": "FURNITURE",
        "rarity": "Rare",
        "size": [3, 2, 1],
        "placeType": "FLOOR",
        "imageUrl": "https://cdn.../bed.png"
      },
      "quantity": 2,
      "acquiredAt": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 15
}
```

**설명:**
- 유저가 보유한 모든 아이템 조회
- 카테고리별 필터링 가능
- 프론트엔드는 이 데이터를 아이템 배치 사이드바에 사용

---

### 4. 💾 방 레이아웃 저장
```
POST /room/save
```

**Request Body:**
```json
{
  "roomId": "main",
  "gridWidth": 32,
  "gridHeight": 18,
  "grid": [
    [
      {
        "tileType": "FLOOR",
        "wallColor": "#3a3a3a",
        "floorColor": "#1a1a1a",
        "items": [
          {
            "placementId": "placement_123",
            "itemId": "item_bed_001",
            "originX": 5,
            "originY": 3,
            "heightRange": [0, 1]
          }
        ]
      }
    ]
  ]
}
```

**응답:**
```json
{
  "success": true,
  "message": "레이아웃 저장 완료",
  "roomId": "main",
  "updatedAt": "2026-01-20T12:00:00Z"
}
```

**설명:**
- 유저의 방 꾸미기 레이아웃 저장
- 전체 그리드 상태 전송
- 백엔드는 JSON 형태로 DB에 저장

---

### 5. 📂 방 레이아웃 불러오기
```
GET /room/load/:roomId
```

**Path Parameters:**
```
roomId: "main" | "storage" | "gallery"
```

**응답:**
```json
{
  "roomId": "main",
  "gridWidth": 32,
  "gridHeight": 18,
  "grid": [
    [
      {
        "tileType": "FLOOR",
        "wallColor": "#3a3a3a",
        "floorColor": "#1a1a1a",
        "items": []
      }
    ]
  ],
  "updatedAt": "2026-01-20T12:00:00Z"
}
```

**설명:**
- 저장된 방 레이아웃 불러오기
- 방 ID별로 조회 (main, storage, gallery 등)
- 저장된 레이아웃이 없으면 빈 그리드 반환

---

### 6. 🗑️ 배치된 아이템 제거 (인벤토리로 반환)
```
DELETE /room/item/:placementId
```

**Path Parameters:**
```
placementId: "placement_123"
```

**응답:**
```json
{
  "success": true,
  "message": "아이템이 인벤토리로 반환되었습니다",
  "placementId": "placement_123",
  "itemId": "item_bed_001"
}
```

**설명:**
- 그리드에서 아이템 제거
- 제거된 아이템은 인벤토리 수량 +1
- 프론트엔드는 이후 `/room/save`로 전체 레이아웃 저장

---

## 💡 프론트엔드 ↔ 백엔드 플로우

### 🛒 상점에서 아이템 구매
```
1. GET /shop/items (카테고리별 아이템 조회)
2. POST /shop/purchase (아이템 구매)
3. GET /inventory (업데이트된 인벤토리 조회)
```

### 🎨 방 꾸미기 (편집 모드)
```
1. GET /room/load/main (기존 레이아웃 불러오기)
2. GET /inventory (보유 아이템 조회)
3. [유저가 아이템 배치/제거]
4. POST /room/save (변경사항 저장)
```

### 📦 아이템 제거
```
1. DELETE /room/item/:placementId (아이템 제거 + 인벤토리 반환)
2. POST /room/save (업데이트된 레이아웃 저장)
```

---

## 🎁 신규 유저 기본 아이템 지급

### 최초 회원가입 시 자동 지급
신규 유저 생성 시 (`POST /auth/login`에서 `isNewUser: true`일 때), 다음 아이템들을 **자동으로 인벤토리에 추가**합니다:

#### 1. 기본 벽지 (회색 철판)
```json
{
  "itemId": "wallpaper_metal_gray",
  "quantity": 1
}
```

#### 2. 기본 조종석 (목재)
```json
{
  "itemId": "cockpit_wooden_basic",
  "quantity": 1
}
```

### 구현 로직 (백엔드)
```javascript
// POST /auth/login 핸들러 내부
if (isNewUser) {
  // 기본 자원 지급 (기존)
  await createUser({
    stars: 0,
    credits: 20,
    spaceParts: 0
  });
  
  // 기본 아이템 자동 지급 (추가)
  await addToInventory(userId, 'wallpaper_metal_gray', 1);
  await addToInventory(userId, 'cockpit_wooden_basic', 1);
}
```

### 프론트엔드 처리
- 신규 유저가 최초 로그인 시, 자동으로 기본 아이템이 인벤토리에 들어있음
- 별도 구매 없이 바로 사용 가능
- 튜토리얼에서 "이미 기본 벽지와 조종석이 있습니다" 안내 가능

---

## 🔐 보안 및 검증

### 1. 아이템 구매 검증
- 백엔드는 반드시 **아이템 가격을 재검증**
- 프론트에서 전송된 가격 무시, DB의 실제 가격 사용
- 유저 잔액 확인 후 차감

### 2. 인벤토리 검증
- 아이템 배치 시 백엔드에서 **보유 여부 확인**
- 보유하지 않은 아이템은 배치 불가
- 수량 초과 배치 방지

### 3. 그리드 크기 검증
- `gridWidth`, `gridHeight`가 고정값(32x18)인지 확인
- 범위 초과 배치 방지

---

## 📊 데이터베이스 스키마 제안

### `items` 테이블
```sql
CREATE TABLE items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('WALLPAPER', 'FLOORING', 'FURNITURE', 'COCKPIT') NOT NULL,
  rarity ENUM('Common', 'Rare', 'Epic', 'Legendary') NOT NULL,
  price_credits INT,
  price_stars INT,
  price_space_parts INT,
  size_x INT NOT NULL,
  size_y INT NOT NULL,
  size_z INT NOT NULL,
  place_type ENUM('FLOOR', 'WALL') NOT NULL,
  image_url TEXT,
  description TEXT,
  unlock_condition TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `user_inventory` 테이블
```sql
CREATE TABLE user_inventory (
  user_id VARCHAR(50),
  item_id VARCHAR(50),
  quantity INT DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### `room_layouts` 테이블
```sql
CREATE TABLE room_layouts (
  user_id VARCHAR(50),
  room_id VARCHAR(20),
  grid_width INT DEFAULT 32,
  grid_height INT DEFAULT 18,
  grid_data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, room_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🎯 초기 데이터 예시

### 벽지 (Wallpaper)
```json
[
  {
    "id": "wallpaper_metal_gray",
    "name": "회색 철판 벽",
    "category": "WALLPAPER",
    "rarity": "Common",
    "price": { "credits": null, "stars": null, "spaceParts": null },
    "size": [1, 1, 0],
    "placeType": "WALL",
    "imageUrl": "metal_gray_wallpaper.png",
    "description": "기본으로 제공되는 회색 철판 벽",
    "isStarterItem": true
  },
  {
    "id": "wallpaper_default",
    "name": "기본 벽지",
    "category": "WALLPAPER",
    "rarity": "Common",
    "price": { "credits": 0 },
    "size": [1, 1, 0],
    "placeType": "WALL",
    "imageUrl": "default_wallpaper.png"
  },
  {
    "id": "wallpaper_space",
    "name": "우주 벽지",
    "category": "WALLPAPER",
    "rarity": "Rare",
    "price": { "credits": 50 },
    "size": [1, 1, 0],
    "placeType": "WALL",
    "imageUrl": "space_wallpaper.png"
  }
]
```

### 바닥재 (Flooring)
```json
[
  {
    "id": "flooring_default",
    "name": "기본 바닥",
    "category": "FLOORING",
    "rarity": "Common",
    "price": { "credits": 0 },
    "size": [1, 1, 0],
    "placeType": "FLOOR",
    "imageUrl": "default_floor.png"
  },
  {
    "id": "flooring_metal",
    "name": "금속 바닥",
    "category": "FLOORING",
    "rarity": "Rare",
    "price": { "credits": 30 },
    "size": [1, 1, 0],
    "placeType": "FLOOR",
    "imageUrl": "metal_floor.png"
  }
]
```

### 가구 (Furniture)
```json
[
  {
    "id": "furniture_bed_001",
    "name": "우주 침대",
    "category": "FURNITURE",
    "rarity": "Rare",
    "price": { "credits": 100 },
    "size": [3, 2, 1],
    "placeType": "FLOOR",
    "imageUrl": "bed.png"
  },
  {
    "id": "furniture_chair_001",
    "name": "의자",
    "category": "FURNITURE",
    "rarity": "Common",
    "price": { "credits": 20 },
    "size": [1, 1, 1],
    "placeType": "FLOOR",
    "imageUrl": "chair.png"
  }
]
```

### 조종실 (Cockpit)
```json
[
  {
    "id": "cockpit_wooden_basic",
    "name": "기본 목재 조종석",
    "category": "COCKPIT",
    "rarity": "Common",
    "price": { "credits": null, "stars": null, "spaceParts": null },
    "size": [3, 2, 1],
    "placeType": "FLOOR",
    "imageUrl": "wooden_cockpit.png",
    "description": "기본으로 제공되는 목재 조종석",
    "isStarterItem": true
  },
  {
    "id": "cockpit_console_001",
    "name": "조종 콘솔",
    "category": "COCKPIT",
    "rarity": "Epic",
    "price": { "credits": 500, "spaceParts": 5 },
    "size": [4, 2, 2],
    "placeType": "FLOOR",
    "imageUrl": "console.png"
  },
  {
    "id": "cockpit_radar_001",
    "name": "레이더 시스템",
    "category": "COCKPIT",
    "rarity": "Legendary",
    "price": { "credits": null, "spaceParts": 10 },
    "size": [2, 2, 3],
    "placeType": "WALL",
    "imageUrl": "radar.png"
  }
]
```

---

## ✅ 체크리스트

### 백엔드 구현 필수 사항
- [ ] `items` 테이블 생성 및 초기 데이터 삽입
- [ ] `user_inventory` 테이블 생성
- [ ] `room_layouts` 테이블 생성
- [ ] **신규 유저 기본 아이템 자동 지급 (`wallpaper_metal_gray`, `cockpit_wooden_basic`)**
- [ ] GET `/shop/items` (카테고리별 아이템 조회)
- [ ] POST `/shop/purchase` (아이템 구매 + 가격 검증)
- [ ] GET `/inventory` (보유 아이템 조회)
- [ ] POST `/room/save` (방 레이아웃 저장)
- [ ] GET `/room/load/:roomId` (방 레이아웃 불러오기)
- [ ] DELETE `/room/item/:placementId` (아이템 제거)
- [ ] 인벤토리 수량 검증 로직
- [ ] JWT 인증 미들웨어 적용

### 프론트엔드 연동 준비
- [ ] API 클라이언트 함수 작성 (`/src/services/roomApi.js`)
- [ ] 상점 UI에서 카테고리별 필터링
- [ ] 아이템 구매 플로우 구현
- [ ] 방 꾸미기 저장/불러오기 연동
- [ ] 에러 핸들링 (잔액 부족, 네트워크 오류 등)

---

## 📞 문의사항

프론트엔드 담당자: `wanipark1004`  
백엔드 연동 관련 질문은 이슈로 등록해주세요!

---

**작성일:** 2026-01-20  
**버전:** 1.0.0
