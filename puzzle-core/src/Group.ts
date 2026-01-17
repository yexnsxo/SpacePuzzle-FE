// src/Group.ts
import { Piece } from "./Piece";
import type { Point } from "./types";

export class Group {
  public pieces: Piece[] = [];
  public position: Point; 
  // [추가] 정답 위치에 고정되어 더 이상 드래그할 수 없는 상태인지 확인
  public isLocked: boolean = false; 

  constructor(initialPiece: Piece, startPos: Point) {
    this.position = startPos;
    this.addPiece(initialPiece, 0, 0);
  }

  addPiece(piece: Piece, relX: number, relY: number) {
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

  isPointInside(x: number, y: number): boolean {
    return this.pieces.some((p) => {
      const wx = this.position.x + p.relativePos.x;
      const wy = this.position.y + p.relativePos.y;
      return x >= wx && x <= wx + p.size && y >= wy && y <= wy + p.size;
    });
  }

  // [추가] 뭉텅이를 고정 상태로 만드는 메서드
  lock() {
    this.isLocked = true;
  }
}