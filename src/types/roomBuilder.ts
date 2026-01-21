// 가구 등급 타입
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

// 타일 종류 (바닥, 벽, 빈 공간)
export type TileType = 'NONE' | 'FLOOR' | 'WALL';

// 아이템(가구) 정보
export type Item = {
  id: string;
  name: string;
  rarity: Rarity;
  size: [number, number, number]; // [x(가로), y(세로), z(높이)]
  placeType: 'FLOOR' | 'WALL'; // 바닥에 놓는지, 벽에 거는지
  imageUrl?: string;
};

// 배치된 아이템 정보
export type PlacedItem = {
  placementId: string;     // 배치 고유 ID (각 배치마다 다름)
  itemId: string;          // 아이템 타입 ID (침대, 선반 등)
  itemData: Item;
  originX: number;         // 배치된 원래 x 좌표
  originY: number;         // 배치된 원래 y 좌표
  heightRange: [number, number]; // [0, height] - 상대 높이 (바닥/벽 기준)
};

// 그리드 한 칸의 상태
export type GridCell = {
  tileType: TileType;
  items: PlacedItem[];     // 이 칸에 배치된 아이템들
  wallColor?: string;      // 벽 색상 (벽지)
  floorColor?: string;     // 바닥 색상 (바닥재)
};

// 상수
export const TILE_SIZE = 32; // 32x32 픽셀
export const GRID_BASE_SIZE = 15; // 기본 그리드 크기 (x, y 방향)
export const MAX_HEIGHT = 100; // 최대 절대 높이 (충분히 크게)
