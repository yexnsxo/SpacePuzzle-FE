# 🖼️ APOD 이미지 프록시 API 명세

## 문제 상황

- NASA APOD 이미지는 외부 도메인(`apod.nasa.gov`)에서 제공됨
- 브라우저 CORS 정책으로 인해 Canvas에 외부 이미지를 직접 그릴 수 없음
- 프론트엔드에서 퍼즐 생성 시 이미지 로드 실패

## 해결 방법

백엔드에서 이미지 프록시 API를 구현하여 CORS 문제 우회

---

## 📡 API 명세

### **GET /api/proxy-image**

외부 이미지를 프록시하여 CORS 헤더를 추가해 반환

#### **Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `url` | string | ✅ | 프록시할 이미지의 원본 URL (URL 인코딩 필요) |

#### **Request Example**

```http
GET /api/proxy-image?url=https%3A%2F%2Fapod.nasa.gov%2Fapod%2Fimage%2F2601%2FCtb1_Konzelmann_4009.jpg
```

#### **Response**

- **Content-Type**: 원본 이미지의 Content-Type (예: `image/jpeg`, `image/png`)
- **Access-Control-Allow-Origin**: `*` (CORS 허용)
- **Cache-Control**: `public, max-age=86400` (24시간 캐시)
- **Body**: 이미지 바이너리 데이터

#### **Error Responses**

| 상태 코드 | 설명 |
|---------|------|
| 400 | `url` 파라미터 누락 |
| 500 | 원본 이미지 다운로드 실패 |

---

## 🛠️ 백엔드 구현 예시

### **Node.js + Express**

```javascript
const express = require('express');
const axios = require('axios');

app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('🖼️ Proxying image:', imageUrl);

    // 원본 이미지 다운로드
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 30000, // 30초 타임아웃
    });

    // CORS 헤더 추가
    res.set('Content-Type', response.headers['content-type']);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400'); // 24시간 캐시
    res.set('Content-Length', response.data.length);

    // 이미지 데이터 반환
    res.send(Buffer.from(response.data));

    console.log('✅ Image proxied successfully');
  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    res.status(500).json({ 
      error: 'Failed to proxy image',
      details: error.message 
    });
  }
});
```

### **Python + Flask**

```python
from flask import Flask, request, Response
import requests

@app.route('/api/proxy-image')
def proxy_image():
    try:
        image_url = request.args.get('url')
        
        if not image_url:
            return {'error': 'URL parameter is required'}, 400

        print(f'🖼️ Proxying image: {image_url}')

        # 원본 이미지 다운로드
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()

        # CORS 헤더 추가하여 반환
        return Response(
            response.content,
            mimetype=response.headers.get('Content-Type'),
            headers={
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400',
            }
        )

    except Exception as e:
        print(f'❌ Image proxy error: {str(e)}')
        return {'error': 'Failed to proxy image', 'details': str(e)}, 500
```

---

## 🔄 프론트엔드 사용 예시

### **ApodInfo.jsx**

```javascript
const originalImageUrl = apodData.hdurl || apodData.url;
const proxyImageUrl = `https://spacepuzzle.onrender.com/api/proxy-image?url=${encodeURIComponent(originalImageUrl)}`;

navigate('/puzzle', {
  state: {
    celestialBody: {
      // ...
      image: proxyImageUrl, // 백엔드 프록시 사용
      // ...
    },
  },
});
```

---

## 📋 체크리스트

백엔드 구현 시 확인할 사항:

- [ ] `GET /api/proxy-image` 엔드포인트 생성
- [ ] `url` 쿼리 파라미터 검증
- [ ] 외부 이미지 다운로드 (axios, requests 등)
- [ ] CORS 헤더 추가:
  - [ ] `Access-Control-Allow-Origin: *`
  - [ ] `Cache-Control: public, max-age=86400`
- [ ] Content-Type을 원본 이미지와 동일하게 설정
- [ ] 에러 처리 (타임아웃, 404, 500 등)
- [ ] 로깅 추가 (디버깅용)

---

## 🚀 테스트 방법

### **1. 백엔드 API 테스트**

```bash
curl "https://spacepuzzle.onrender.com/api/proxy-image?url=https%3A%2F%2Fapod.nasa.gov%2Fapod%2Fimage%2F2601%2FCtb1_Konzelmann_4009.jpg" --output test.jpg
```

성공 시 `test.jpg` 파일이 생성됨

### **2. 브라우저에서 테스트**

```
https://spacepuzzle.onrender.com/api/proxy-image?url=https%3A%2F%2Fapod.nasa.gov%2Fapod%2Fimage%2F2601%2FCtb1_Konzelmann_4009.jpg
```

브라우저에서 이미지가 정상적으로 표시되어야 함

### **3. 프론트엔드 통합 테스트**

1. APOD 정보 페이지 접속
2. "퍼즐 시작" 버튼 클릭
3. 브라우저 콘솔 확인:

```
📷 원본 이미지 URL: https://apod.nasa.gov/apod/image/2601/Ctb1_Konzelmann_4009.jpg
📷 프록시 이미지 URL: https://spacepuzzle.onrender.com/api/proxy-image?url=...
🖼️ 이미지 로드 시작: https://spacepuzzle.onrender.com/api/proxy-image?url=...
✅ 이미지 로드 성공: 4009 x 2672
```

---

## ⚠️ 주의사항

### **보안**

- 악의적인 사용자가 임의의 URL을 프록시하지 못하도록 제한 고려:
  ```javascript
  // URL 화이트리스트 검증
  const allowedDomains = ['apod.nasa.gov', 'nasa.gov'];
  const url = new URL(imageUrl);
  if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }
  ```

### **성능**

- 이미지 캐싱 구현 (Redis, S3 등)
- 이미지 크기 제한 (예: 10MB)
- Rate limiting 적용

### **비용**

- 대용량 이미지 프록시는 대역폭 비용 발생
- 필요시 이미지 리사이징 고려

---

## 🎯 최종 목표

1. ✅ 백엔드에 `/api/proxy-image` API 구현
2. ✅ 프론트엔드에서 백엔드 프록시 사용
3. ✅ APOD 퍼즐 이미지 정상 로드
4. ✅ Canvas에 이미지 그리기 성공
5. ✅ 퍼즐 게임 플레이 가능

---

## 📞 지원

백엔드 구현 중 문제가 발생하면:

1. 백엔드 로그 확인
2. 브라우저 Network 탭에서 `/api/proxy-image` 요청 상태 확인
3. Response Headers에 CORS 헤더가 있는지 확인

```
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=86400
Content-Type: image/jpeg
```
