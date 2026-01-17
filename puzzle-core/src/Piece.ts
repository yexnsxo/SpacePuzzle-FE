// src/Piece.ts
import type { Point, EdgeType, PieceEdges } from './types';

export class Piece {
  public relativePos: Point = { x: 0, y: 0 };
  public edges: PieceEdges; // 각 면의 요철 상태

  constructor(
    public id: string,
    public gridX: number,
    public gridY: number,
    edges: PieceEdges, // 생성 시 모양 정보를 받음
    public size: number = 100
  ) {
    this.edges = edges;
  }

  // 이 조각이 퍼즐판 위에서 가져야 할 '정답 월드 좌표'
  get targetPos(): Point {
    return {
      x: this.gridX * this.size,
      y: this.gridY * this.size
    };
  }
}