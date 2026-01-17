// 퍼즐 조각 그룹 (병합된 조각들의 묶음)
export class Group {
  constructor(initialPiece, startPos) {
    this.pieces = [];
    this.position = startPos; // 그룹의 월드 좌표
    this.isLocked = false; // 정답 위치에 고정되었는지 여부
    this.addPiece(initialPiece, 0, 0);
  }

  addPiece(piece, relX, relY) {
    piece.relativePos = { x: relX, y: relY };
    this.pieces.push(piece);
  }

  getPiecesWorldPositions() {
    return this.pieces.map((p) => ({
      id: p.id,
      x: this.position.x + p.relativePos.x,
      y: this.position.y + p.relativePos.y,
    }));
  }

  isPointInside(x, y) {
    return this.pieces.some((p) => {
      const wx = this.position.x + p.relativePos.x;
      const wy = this.position.y + p.relativePos.y;
      return x >= wx && x <= wx + p.size && y >= wy && y <= wy + p.size;
    });
  }

  lock() {
    this.isLocked = true;
  }
}
