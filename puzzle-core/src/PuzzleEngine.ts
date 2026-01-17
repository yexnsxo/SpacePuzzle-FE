// src/PuzzleEngine.ts
import type { Group } from './Group';
import type { Piece } from './Piece';

export class PuzzleEngine {
  static SNAP_THRESHOLD = 20;

  static tryMerge(active: Group, target: Group): boolean {
    if (active === target || active.pieces.length === 0 || target.pieces.length === 0) return false;

    for (const pieceA of active.pieces) {
      for (const pieceB of target.pieces) {
        const isNeighbor = Math.abs(pieceA.gridX - pieceB.gridX) + Math.abs(pieceA.gridY - pieceB.gridY) === 1;

        if (isNeighbor) {
          const worldAx = active.position.x + pieceA.relativePos.x;
          const worldAy = active.position.y + pieceA.relativePos.y;
          const worldBx = target.position.x + pieceB.relativePos.x;
          const worldBy = target.position.y + pieceB.relativePos.y;

          const idealBx = worldAx + (pieceB.gridX - pieceA.gridX) * pieceA.size;
          const idealBy = worldAy + (pieceB.gridY - pieceA.gridY) * pieceA.size;

          const dist = Math.sqrt(Math.pow(worldBx - idealBx, 2) + Math.pow(worldBy - idealBy, 2));

          if (dist < this.SNAP_THRESHOLD) {
            this.executeMerge(active, target, idealBx, idealBy, pieceB);
            return true;
          }
        }
      }
    }
    return false;
  }

  private static executeMerge(active: Group, target: Group, idealBx: number, idealBy: number, anchorPieceB: Piece) {
    // [핵심 수정] 타겟이 고정(Locked) 상태라면 타겟의 위치를 절대로 변경하지 않습니다.
    if (target.isLocked) {
      console.log("📌 고정된 조각은 움직이지 않고, 드래그하던 조각이 스냅됩니다.");
    } else {
      // 타겟이 고정되지 않았을 때만 위치를 보정합니다.
      target.position.x = idealBx - anchorPieceB.relativePos.x;
      target.position.y = idealBy - anchorPieceB.relativePos.y;
    }

    active.pieces.forEach(p => {
      const gridDiffX = p.gridX - anchorPieceB.gridX;
      const gridDiffY = p.gridY - anchorPieceB.gridY;

      const newRelX = anchorPieceB.relativePos.x + (gridDiffX * p.size);
      const newRelY = anchorPieceB.relativePos.y + (gridDiffY * p.size);

      target.addPiece(p, newRelX, newRelY);
    });

    // [핵심 수정] 둘 중 하나라도 고정되어 있었다면 병합된 결과물도 고정합니다.
    if (active.isLocked || target.isLocked) {
      target.lock();
    }

    active.pieces = []; 
  }
}