// 퍼즐 조각 그리기 유틸리티
export function drawPuzzleShape(ctx, x, y, size, edges) {
  const tabSize = size * 0.15; // 요철의 돌출 크기
  const tabWidth = size * 0.2; // 요철의 폭

  ctx.beginPath();

  // 상단 변: (x, y) → (x+size, y)
  ctx.moveTo(x, y);
  if (edges.top === 0) {
    ctx.lineTo(x + size, y);
  } else {
    const mid = x + size / 2;
    ctx.lineTo(mid - tabWidth, y); // 요철 시작까지 직선
    // 요철 그리기 (위로 튀어나감: +, 아래로 들어감: -)
    ctx.quadraticCurveTo(
      mid - tabWidth, y - edges.top * tabSize,
      mid, y - edges.top * tabSize
    );
    ctx.quadraticCurveTo(
      mid + tabWidth, y - edges.top * tabSize,
      mid + tabWidth, y
    );
    ctx.lineTo(x + size, y); // 요철 끝부터 끝까지 직선
  }

  // 우측 변: (x+size, y) → (x+size, y+size)
  if (edges.right === 0) {
    ctx.lineTo(x + size, y + size);
  } else {
    const mid = y + size / 2;
    ctx.lineTo(x + size, mid - tabWidth); // 요철 시작까지 직선
    // 요철 그리기 (오른쪽으로 튀어나감: +, 왼쪽으로 들어감: -)
    ctx.quadraticCurveTo(
      x + size + edges.right * tabSize, mid - tabWidth,
      x + size + edges.right * tabSize, mid
    );
    ctx.quadraticCurveTo(
      x + size + edges.right * tabSize, mid + tabWidth,
      x + size, mid + tabWidth
    );
    ctx.lineTo(x + size, y + size); // 요철 끝부터 끝까지 직선
  }

  // 하단 변: (x+size, y+size) → (x, y+size)
  if (edges.bottom === 0) {
    ctx.lineTo(x, y + size);
  } else {
    const mid = x + size / 2;
    ctx.lineTo(mid + tabWidth, y + size); // 요철 시작까지 직선
    // 요철 그리기 (아래로 튀어나감: +, 위로 들어감: -)
    ctx.quadraticCurveTo(
      mid + tabWidth, y + size + edges.bottom * tabSize,
      mid, y + size + edges.bottom * tabSize
    );
    ctx.quadraticCurveTo(
      mid - tabWidth, y + size + edges.bottom * tabSize,
      mid - tabWidth, y + size
    );
    ctx.lineTo(x, y + size); // 요철 끝부터 끝까지 직선
  }

  // 좌측 변: (x, y+size) → (x, y)
  if (edges.left === 0) {
    ctx.lineTo(x, y);
  } else {
    const mid = y + size / 2;
    ctx.lineTo(x, mid + tabWidth); // 요철 시작까지 직선
    // 요철 그리기 (왼쪽으로 튀어나감: -, 오른쪽으로 들어감: +)
    ctx.quadraticCurveTo(
      x - edges.left * tabSize, mid + tabWidth,
      x - edges.left * tabSize, mid
    );
    ctx.quadraticCurveTo(
      x - edges.left * tabSize, mid - tabWidth,
      x, mid - tabWidth
    );
    ctx.lineTo(x, y); // 요철 끝부터 끝까지 직선
  }

  ctx.closePath();
}
