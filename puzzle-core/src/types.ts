// src/types.ts

export interface Point {
    x: number;
    y: number;
  }
  
  // 조각 변의 모양: 평평함(0), 튀어나옴(1), 들어감(-1)
  export type EdgeType = 0 | 1 | -1;
  
  // 조각의 4면 요철 정보를 담는 인터페이스
  export interface PieceEdges {
    top: EdgeType;
    right: EdgeType;
    bottom: EdgeType;
    left: EdgeType;
  }