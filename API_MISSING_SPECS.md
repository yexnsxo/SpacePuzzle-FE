# 🔧 백엔드 API 누락된 명세

## 필수 추가 사항

---

## **🎮 Customization API**

### **GET /user/customization**

현재 배경/조종석/배치 아이템 조회

**Response**
```json
{
  "background": "bg_luxury",
  "cockpit": "cockpit_advanced",
  "items": [
    { "itemId": "item_plant", "x": 120, "y": 200 },
    { "itemId": "item_poster", "x": 300, "y": 150 }
  ]
}
```

---

### **POST /user/customization/set**

배경/조종석 설정

**Body**
```json
{ "type": "background", "itemId": "bg_luxury" }
```

**Response**
```json
{
  "success": true,
  "message": "배경이 변경되었습니다."
}
```

---

### **POST /user/customization/place-item**

아이템 배치

**Body**
```json
{ "itemId": "item_plant", "x": 120, "y": 200 }
```

**Response**
```json
{
  "success": true,
  "message": "아이템이 배치되었습니다."
}
```

---

### **DELETE /user/customization/remove-item**

아이템 제거

**Body**
```json
{ "itemId": "item_plant" }
```

**Response**
```json
{
  "success": true,
  "message": "아이템이 제거되었습니다."
}
```

---

## **🛒 Shop API**

### **POST /shop/purchase**

아이템 구매

**Body**
```json
{ "itemId": "item_plant" }
```

**Response** (수정 필요)
```json
{
  "success": true,
  "itemId": "item_plant",
  "remainingStars": 10,
  "remainingCredits": 15,        // ← 추가 필요!
  "remainingSpaceParts": 3
}
```

**변경 이유:**
- 크레딧으로 구매하는 아이템도 있어서 `remainingCredits` 필드 필요
- 현재는 `remainingStars`, `remainingSpaceParts`만 있음

---

## 📋 요약

### **추가 필요한 응답 형식**

1. ✅ `GET /user/customization` → 전체 커스터마이제이션 데이터 반환
2. ✅ `POST /user/customization/set` → `{ success, message }` 반환
3. ✅ `POST /user/customization/place-item` → `{ success, message }` 반환
4. ✅ `DELETE /user/customization/remove-item` → `{ success, message }` 반환
5. ✅ `POST /shop/purchase` → `remainingCredits` 필드 추가

---

## 🎯 구현 우선순위

**최우선:**
- `remainingCredits` 추가 (Shop)
- Customization API 응답 형식 구현

**이유:** 
- 프론트엔드에서 이미 이 응답 형식을 기대하고 있음
- 없으면 UI 업데이트가 제대로 안됨
