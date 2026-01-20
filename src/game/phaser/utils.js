/**
 * Phaser Graphics에 퍼즐 모양을 그립니다
 * Canvas drawPuzzleShape를 Phaser용으로 변환
 * Note: Phaser Graphics는 quadraticCurveTo를 지원하지 않으므로 bezierCurveTo 사용
 */
export function drawPuzzleShapePhaser(graphics, x, y, size, edges) {
  const tabSize = size * 0.15; // 요철의 돌출 크기
  const tabWidth = size * 0.2; // 요철의 폭

  graphics.beginPath();

  // 상단 변: (x, y) → (x+size, y)
  graphics.moveTo(x, y);
  if (edges.top === 0) {
    graphics.lineTo(x + size, y);
  } else {
    const mid = x + size / 2;
    graphics.lineTo(mid - tabWidth, y);
    
    // quadraticCurveTo를 bezierCurveTo로 변환
    // Quadratic: P0, P1(control), P2
    // Cubic: P0, CP1 = P0 + 2/3(P1-P0), CP2 = P2 + 2/3(P1-P2), P2
    
    // 첫 번째 곡선
    const p0x = mid - tabWidth, p0y = y;
    const p1x = mid - tabWidth, p1y = y - edges.top * tabSize;
    const p2x = mid, p2y = y - edges.top * tabSize;
    const cp1x = p0x + (2/3) * (p1x - p0x);
    const cp1y = p0y + (2/3) * (p1y - p0y);
    const cp2x = p2x + (2/3) * (p1x - p2x);
    const cp2y = p2y + (2/3) * (p1y - p2y);
    graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2x, p2y);
    
    // 두 번째 곡선
    const p3x = mid, p3y = y - edges.top * tabSize;
    const p4x = mid + tabWidth, p4y = y - edges.top * tabSize;
    const p5x = mid + tabWidth, p5y = y;
    const cp3x = p3x + (2/3) * (p4x - p3x);
    const cp3y = p3y + (2/3) * (p4y - p3y);
    const cp4x = p5x + (2/3) * (p4x - p5x);
    const cp4y = p5y + (2/3) * (p4y - p5y);
    graphics.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, p5x, p5y);
    
    graphics.lineTo(x + size, y);
  }

  // 우측 변: (x+size, y) → (x+size, y+size)
  if (edges.right === 0) {
    graphics.lineTo(x + size, y + size);
  } else {
    const mid = y + size / 2;
    graphics.lineTo(x + size, mid - tabWidth);
    
    // 첫 번째 곡선
    const p0x = x + size, p0y = mid - tabWidth;
    const p1x = x + size + edges.right * tabSize, p1y = mid - tabWidth;
    const p2x = x + size + edges.right * tabSize, p2y = mid;
    const cp1x = p0x + (2/3) * (p1x - p0x);
    const cp1y = p0y + (2/3) * (p1y - p0y);
    const cp2x = p2x + (2/3) * (p1x - p2x);
    const cp2y = p2y + (2/3) * (p1y - p2y);
    graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2x, p2y);
    
    // 두 번째 곡선
    const p3x = x + size + edges.right * tabSize, p3y = mid;
    const p4x = x + size + edges.right * tabSize, p4y = mid + tabWidth;
    const p5x = x + size, p5y = mid + tabWidth;
    const cp3x = p3x + (2/3) * (p4x - p3x);
    const cp3y = p3y + (2/3) * (p4y - p3y);
    const cp4x = p5x + (2/3) * (p4x - p5x);
    const cp4y = p5y + (2/3) * (p4y - p5y);
    graphics.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, p5x, p5y);
    
    graphics.lineTo(x + size, y + size);
  }

  // 하단 변: (x+size, y+size) → (x, y+size)
  if (edges.bottom === 0) {
    graphics.lineTo(x, y + size);
  } else {
    const mid = x + size / 2;
    graphics.lineTo(mid + tabWidth, y + size);
    
    // 첫 번째 곡선
    const p0x = mid + tabWidth, p0y = y + size;
    const p1x = mid + tabWidth, p1y = y + size + edges.bottom * tabSize;
    const p2x = mid, p2y = y + size + edges.bottom * tabSize;
    const cp1x = p0x + (2/3) * (p1x - p0x);
    const cp1y = p0y + (2/3) * (p1y - p0y);
    const cp2x = p2x + (2/3) * (p1x - p2x);
    const cp2y = p2y + (2/3) * (p1y - p2y);
    graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2x, p2y);
    
    // 두 번째 곡선
    const p3x = mid, p3y = y + size + edges.bottom * tabSize;
    const p4x = mid - tabWidth, p4y = y + size + edges.bottom * tabSize;
    const p5x = mid - tabWidth, p5y = y + size;
    const cp3x = p3x + (2/3) * (p4x - p3x);
    const cp3y = p3y + (2/3) * (p4y - p3y);
    const cp4x = p5x + (2/3) * (p4x - p5x);
    const cp4y = p5y + (2/3) * (p4y - p5y);
    graphics.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, p5x, p5y);
    
    graphics.lineTo(x, y + size);
  }

  // 좌측 변: (x, y+size) → (x, y)
  if (edges.left === 0) {
    graphics.lineTo(x, y);
  } else {
    const mid = y + size / 2;
    graphics.lineTo(x, mid + tabWidth);
    
    // 첫 번째 곡선
    const p0x = x, p0y = mid + tabWidth;
    const p1x = x - edges.left * tabSize, p1y = mid + tabWidth;
    const p2x = x - edges.left * tabSize, p2y = mid;
    const cp1x = p0x + (2/3) * (p1x - p0x);
    const cp1y = p0y + (2/3) * (p1y - p0y);
    const cp2x = p2x + (2/3) * (p1x - p2x);
    const cp2y = p2y + (2/3) * (p1y - p2y);
    graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2x, p2y);
    
    // 두 번째 곡선
    const p3x = x - edges.left * tabSize, p3y = mid;
    const p4x = x - edges.left * tabSize, p4y = mid - tabWidth;
    const p5x = x, p5y = mid - tabWidth;
    const cp3x = p3x + (2/3) * (p4x - p3x);
    const cp3y = p3y + (2/3) * (p4y - p3y);
    const cp4x = p5x + (2/3) * (p4x - p5x);
    const cp4y = p5y + (2/3) * (p4y - p5y);
    graphics.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, p5x, p5y);
    
    graphics.lineTo(x, y);
  }

  graphics.closePath();
}
