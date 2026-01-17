// 퍼즐 조각 클래스
export class Piece {
  constructor(id, gridX, gridY, edges, size = 100) {
    this.id = id;
    this.gridX = gridX;
    this.gridY = gridY;
    this.edges = edges; // { top, right, bottom, left } - 각각 0(평평), 1(볼록), -1(오목)
    this.size = size;
    this.relativePos = { x: 0, y: 0 }; // 그룹 내에서의 상대 위치
  }

  // 이 조각이 퍼즐판 위에서 가져야 할 '정답 월드 좌표'
  get targetPos() {
    return {
      x: this.gridX * this.size,
      y: this.gridY * this.size
    };
  }
}
