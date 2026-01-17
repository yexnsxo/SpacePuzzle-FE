export function drawPuzzleShape(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, edges: any) {
    const tabSize = size * 0.2; // 요철의 크기 (조각의 20%)
  
    ctx.beginPath();
    ctx.moveTo(x, y);
  
    // 상단 (Top)
    drawEdge(ctx, x, y, x + size, y, edges.top, tabSize, true);
    // 우측 (Right)
    drawEdge(ctx, x + size, y, x + size, y + size, edges.right, tabSize, true);
    // 하단 (Bottom)
    drawEdge(ctx, x + size, y + size, x, y + size, edges.bottom, tabSize, true);
    // 좌측 (Left)
    drawEdge(ctx, x, y + size, x, y, edges.left, tabSize, true);
  
    ctx.closePath();
  }
  
  function drawEdge(ctx: any, x1: number, y1: number, x2: number, y2: number, type: any, tabSize: number, horizontal: boolean) {
    if (type === 0) { // FLAT
      ctx.lineTo(x2, y2);
      return;
    }
  
    // 베지에 곡선을 이용해 볼록/오목 모양 그리기 (수학적 보간)
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const offset = type * tabSize;
  
    if (x1 === x2) { // 수직선 (좌우 면)
      ctx.bezierCurveTo(x1, y1 + tabSize, x1 + offset, y1 + tabSize, x1 + offset, cy);
      ctx.bezierCurveTo(x1 + offset, y2 - tabSize, x1, y2 - tabSize, x2, y2);
    } else { // 수평선 (상하 면)
      ctx.bezierCurveTo(x1 + tabSize, y1, x1 + tabSize, y1 + offset, cx, y1 + offset);
      ctx.bezierCurveTo(x2 - tabSize, y1 + offset, x2 - tabSize, y1, x2, y2);
    }
  }