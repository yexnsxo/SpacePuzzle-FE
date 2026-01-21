import { useState, useEffect } from 'react';
import { TileType, GridCell, Item, GRID_BASE_SIZE, PlacedItem } from '../types';

const SAVE_KEY = 'spaceship-builder-data';

export const useGrid = (baseSize: number = GRID_BASE_SIZE) => {
  // 초기 그리드 생성
  const createInitialGrid = (): GridCell[][] => {
    return Array(baseSize)
      .fill(null)
      .map(() =>
        Array(baseSize)
          .fill(null)
          .map(() => ({
            tileType: 'NONE',
            items: [],
          }))
      );
  };

  // 로컬 스토리지에서 데이터 로드
  const [grid, setGrid] = useState<GridCell[][]>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // 데이터 마이그레이션
        const migrated = parsed.map((row: any[], rowIndex: number) => 
          row.map((cell: any, colIndex: number) => {
            let items = Array.isArray(cell.items) ? cell.items : [];
            
            items = items.map((item: any) => {
              const migrated = { ...item };
              
              if (!migrated.placementId) {
                migrated.placementId = `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              }
              if (migrated.originX === undefined) {
                migrated.originX = colIndex;
              }
              if (migrated.originY === undefined) {
                migrated.originY = rowIndex;
              }
              if (!migrated.heightRange) {
                const height = item.itemData?.size?.[2] || 1;
                migrated.heightRange = [0, height];
              }
              
              return migrated;
            });
            
            return {
              tileType: cell.tileType || 'NONE',
              items: items,
            };
          })
        );
        
        console.log("✅ 저장된 데이터 불러오기 성공!");
        return migrated;
      } catch (e) {
        console.error("❌ 데이터 복구 실패:", e);
      }
    }
    return createInitialGrid();
  });

  // 자동 저장
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(grid));
  }, [grid]);

  /**
   * 벽이 바닥과 연결되었는지 확인
   */
  const isWallConnectedToFloor = (x: number, y: number): boolean => {
    if (grid[y][x].tileType !== 'WALL') return false;
    
    for (let checkY = y + 1; checkY < baseSize; checkY++) {
      const cellBelow = grid[checkY][x];
      if (cellBelow.tileType === 'FLOOR') return true;
      if (cellBelow.tileType === 'WALL') continue;
      return false;
    }
    
    return false;
  };

  /**
   * 벽을 세울 수 있는지 확인
   */
  const canPlaceWall = (x: number, y: number): boolean => {
    const currentCell = grid[y][x];
    
    if (currentCell.tileType !== 'NONE') return false;
    const items = Array.isArray(currentCell.items) ? currentCell.items : [];
    if (items.length > 0) return false;
    if (y + 1 >= baseSize) return false;
    
    const cellBelow = grid[y + 1][x];
    
    if (cellBelow.tileType === 'FLOOR') return true;
    if (cellBelow.tileType === 'WALL') {
      return isWallConnectedToFloor(x, y + 1);
    }
    
    return false;
  };

  /**
   * 타일 업데이트
   */
  const updateTile = (x: number, y: number, type: TileType) => {
    setGrid((prevGrid) => {
      const currentCell = prevGrid[y][x];

      // 지우기 모드
      if (type === 'NONE') {
        // 1. 아이템 우선 제거
        const items = Array.isArray(currentCell.items) ? currentCell.items : [];
        if (items.length > 0) {
          // originX, originY가 현재 칸인 아이템 찾기 (중복 방지)
          const originItems = items.filter(item => 
            item.originX === x && item.originY === y
          );
          
          if (originItems.length > 0) {
            const topItem = originItems[0];
            
            console.log(`🗑️ [${x}, ${y}] 아이템 제거: ${topItem.itemData.name}`);
            
            const newGrid = prevGrid.map(row => row.map(cell => ({ 
              ...cell, 
              items: Array.isArray(cell.items) ? [...cell.items] : []
            })));
            
            // 해당 아이템이 차지하는 모든 칸에서 제거
            const [sizeX, sizeY] = topItem.itemData.size;
            for (let dy = 0; dy < sizeY; dy++) {
              for (let dx = 0; dx < sizeX; dx++) {
                const targetY = topItem.originY + dy;
                const targetX = topItem.originX + dx;
                if (targetY < baseSize && targetX < baseSize) {
                  newGrid[targetY][targetX].items = newGrid[targetY][targetX].items.filter(
                    item => item.placementId !== topItem.placementId
                  );
                }
              }
            }
            
            return newGrid;
          }
        }

        // 2. 벽은 위에서부터 지워야 함!
        if (currentCell.tileType === 'WALL') {
          // 위에 벽이 있으면 지우기 불가
          if (y > 0 && prevGrid[y - 1][x].tileType === 'WALL') {
            console.log(`❌ [${x}, ${y}] 위에 벽이 있어서 지우기 불가! (위에서부터 지워야 함)`);
            return prevGrid;
          }
          console.log(`✅ [${x}, ${y}] 벽 지우기!`);
        }

        // 3. 바닥/벽 위에 벽이 있으면 지우기 불가
        if (y > 0 && prevGrid[y - 1][x].tileType === 'WALL') {
          console.log(`❌ [${x}, ${y}] 위에 벽이 있어서 지우기 불가!`);
          return prevGrid;
        }

        console.log(`🗑️ [${x}, ${y}] 타일 지우기`);
      }

      // 벽 설치 확인
      if (type === 'WALL') {
        if (!canPlaceWall(x, y)) {
          console.log(`❌ [${x}, ${y}] 벽 설치 불가!`);
          return prevGrid;
        }
        console.log(`✅ [${x}, ${y}] 벽 설치!`);
      }

      // 타일 업데이트
      const newGrid = prevGrid.map(row => row.map(cell => ({ 
        ...cell, 
        items: Array.isArray(cell.items) ? [...cell.items] : []
      })));
      newGrid[y][x].tileType = type;
      
      return newGrid;
    });
  };

  /**
   * 아이템 배치 가능 여부 확인 (3D 공간 충돌!)
   */
  const canPlaceItem = (x: number, y: number, item: Item): boolean => {
    const [sizeX, sizeY, sizeZ] = item.size;
    
    console.log(`\n=== [${x}, ${y}] ${item.name} (${item.placeType}, ${sizeX}x${sizeY}x${sizeZ}) 배치 검사 ===`);
    
    // 1. 타일 타입 확인
    for (let dy = 0; dy < sizeY; dy++) {
      for (let dx = 0; dx < sizeX; dx++) {
        const targetX = x + dx;
        const targetY = y + dy;
        
        if (targetX >= baseSize || targetY >= baseSize) {
          console.log(`❌ 범위 초과!`);
          return false;
        }
        
        const cell = grid[targetY][targetX];
        
        if (item.placeType === 'FLOOR' && cell.tileType !== 'FLOOR') {
          console.log(`❌ [${targetX}, ${targetY}] 바닥이 아님!`);
          return false;
        }
        if (item.placeType === 'WALL' && cell.tileType !== 'WALL') {
          console.log(`❌ [${targetX}, ${targetY}] 벽이 아님!`);
          return false;
        }
      }
    }
    
    // 2. 같은 타입끼리 충돌 검사 (같은 x,y에서 높이 겹침)
    const newHeightRange: [number, number] = [0, sizeZ];
    
    for (let dy = 0; dy < sizeY; dy++) {
      for (let dx = 0; dx < sizeX; dx++) {
        const targetX = x + dx;
        const targetY = y + dy;
        const cell = grid[targetY][targetX];
        const items = Array.isArray(cell.items) ? cell.items : [];
        
        for (const existingItem of items) {
          if (existingItem.itemData.placeType !== item.placeType) continue;
          
          const [exStart, exEnd] = existingItem.heightRange;
          const heightOverlap = !(newHeightRange[1] <= exStart || newHeightRange[0] >= exEnd);
          
          if (heightOverlap) {
            console.log(`❌ [${targetX}, ${targetY}] 같은 타입 충돌! 기존: ${existingItem.itemData.name} (${exStart}~${exEnd}), 신규: (${newHeightRange[0]}~${newHeightRange[1]})`);
            return false;
          }
        }
      }
    }
    
    // 3. 다른 타입과의 3D 충돌 검사!
    if (item.placeType === 'FLOOR') {
      // 바닥에 설치: 같은 x의 벽들 중 높이(sizeZ)만큼 위쪽 확인
      console.log(`  바닥 설치 → 같은 x의 벽 확인 (y=${y-sizeZ}~${y-1})`);
      
      for (let dx = 0; dx < sizeX; dx++) {
        const checkX = x + dx;
        
        // 높이만큼 위쪽 벽들 확인
        for (let checkY = y - sizeZ; checkY < y; checkY++) {
          if (checkY < 0 || checkY >= baseSize) continue;
          
          const wallCell = grid[checkY][checkX];
          if (wallCell.tileType !== 'WALL') continue;
          
          const wallItems = Array.isArray(wallCell.items) ? wallCell.items : [];
          
          for (const wallItem of wallItems) {
            if (wallItem.itemData.placeType !== 'WALL') continue;
            
            const [wallStart, wallEnd] = wallItem.heightRange;
            
            // 바닥 높이: 0~sizeZ, 벽 튀어나온 정도: wallStart~wallEnd
            const overlap = !(sizeZ <= wallStart || 0 >= wallEnd);
            
            if (overlap) {
              console.log(`  ❌ 충돌! 벽 [${checkX}, ${checkY}]의 ${wallItem.itemData.name} (튀어나온: ${wallStart}~${wallEnd})`);
              return false;
            }
          }
        }
      }
    } else if (item.placeType === 'WALL') {
      // 벽에 설치: 같은 x의 바닥들 중 튀어나온 정도(sizeZ)만큼 아래쪽 확인
      console.log(`  벽 설치 → 같은 x의 바닥 확인 (y=${y+1}~${y+sizeZ})`);
      
      for (let dx = 0; dx < sizeX; dx++) {
        const checkX = x + dx;
        
        // 튀어나온 정도만큼 아래쪽 바닥들 확인
        for (let checkY = y + 1; checkY <= y + sizeZ; checkY++) {
          if (checkY >= baseSize) break;
          
          const floorCell = grid[checkY][checkX];
          if (floorCell.tileType !== 'FLOOR') continue;
          
          const floorItems = Array.isArray(floorCell.items) ? floorCell.items : [];
          
          for (const floorItem of floorItems) {
            if (floorItem.itemData.placeType !== 'FLOOR') continue;
            
            const [floorStart, floorEnd] = floorItem.heightRange;
            
            // 벽 튀어나온 정도: 0~sizeZ, 바닥 높이: floorStart~floorEnd
            const overlap = !(sizeZ <= floorStart || 0 >= floorEnd);
            
            if (overlap) {
              console.log(`  ❌ 충돌! 바닥 [${checkX}, ${checkY}]의 ${floorItem.itemData.name} (높이: ${floorStart}~${floorEnd})`);
              return false;
            }
          }
        }
      }
    }
    
    console.log(`✅ 배치 가능!`);
    return true;
  };

  /**
   * 아이템 배치
   */
  const placeItem = (x: number, y: number, item: Item): boolean => {
    if (!canPlaceItem(x, y, item)) return false;

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ 
        ...cell, 
        items: Array.isArray(cell.items) ? [...cell.items] : []
      })));
      const [sizeX, sizeY, sizeZ] = item.size;
      
      // 고유한 배치 ID 생성
      const placementId = `${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const placedItem: PlacedItem = {
        placementId: placementId,
        itemId: item.id,
        itemData: item,
        originX: x,
        originY: y,
        heightRange: [0, sizeZ], // 상대 높이 (0에서 sizeZ까지)
      };
      
      // 배치한 x,y 칸에만 저장
      for (let dy = 0; dy < sizeY; dy++) {
        for (let dx = 0; dx < sizeX; dx++) {
          const targetX = x + dx;
          const targetY = y + dy;
          
          if (targetY >= 0 && targetY < baseSize && targetX >= 0 && targetX < baseSize) {
            newGrid[targetY][targetX].items.push(placedItem);
          }
        }
      }
      
      console.log(`✅ [${x}, ${y}] ${item.name} 배치! 높이: ${0}~${sizeZ}`);
      return newGrid;
    });
    return true;
  };

  /**
   * 초기화
   */
  const resetGrid = () => {
    if (window.confirm("우주선의 모든 배치를 초기화하시겠습니까?")) {
      setGrid(createInitialGrid());
      console.log("✅ 우주선 초기화 완료!");
    }
  };

  /**
   * 벽지 색상 변경 (세로선으로 구분된 벽 영역 전체)
   */
  const updateWallColor = (x: number, y: number, color: string | null) => {
    setGrid((prevGrid) => {
      // 클릭한 칸이 벽이 아니면 무시
      if (prevGrid[y][x].tileType !== 'WALL') {
        console.log(`❌ [${x}, ${y}]는 벽이 아님`);
        return prevGrid;
      }
      
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      
      // 벽의 높이 계산 (로컬 함수)
      const getWallHeight = (x: number, y: number): number => {
        if (prevGrid[y][x].tileType !== 'WALL') return -1;
        
        let height = 0;
        let currentY = y + 1;
        
        while (currentY < baseSize) {
          const cell = prevGrid[currentY][x];
          if (cell.tileType === 'FLOOR') return height;
          if (cell.tileType === 'WALL') {
            height++;
            currentY++;
          } else {
            return -1;
          }
        }
        return -1;
      };
      
      // 좌측 경계선 필요 여부 (로컬 함수)
      const needsLeftBorder = (x: number, y: number): boolean => {
        if (x === 0) return false;
        const currentCell = prevGrid[y][x];
        if (currentCell.tileType !== 'WALL') return false;
        
        const leftCell = prevGrid[y][x - 1];
        if (leftCell.tileType !== 'WALL') return true;
        
        const currentHeight = getWallHeight(x, y);
        const leftHeight = getWallHeight(x - 1, y);
        return currentHeight !== leftHeight;
      };
      
      // 우측 경계선 필요 여부 (로컬 함수)
      const needsRightBorder = (x: number, y: number): boolean => {
        if (x === baseSize - 1) return false;
        const currentCell = prevGrid[y][x];
        if (currentCell.tileType !== 'WALL') return false;
        
        const rightCell = prevGrid[y][x + 1];
        if (rightCell.tileType !== 'WALL') return true;
        
        const currentHeight = getWallHeight(x, y);
        const rightHeight = getWallHeight(x + 1, y);
        return currentHeight !== rightHeight;
      };
      
      // Flood fill로 세로선으로 구분되지 않은 모든 벽 찾기
      const wallsToColor: {x: number, y: number}[] = [];
      const stack = [{x, y}];
      const visited = new Set<string>();
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        const key = `${current.x},${current.y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        const cell = prevGrid[current.y][current.x];
        if (cell.tileType !== 'WALL') continue;
        
        wallsToColor.push(current);
        
        // 상하 확인 (항상 가능)
        if (current.y > 0) {
          stack.push({x: current.x, y: current.y - 1});
        }
        if (current.y < baseSize - 1) {
          stack.push({x: current.x, y: current.y + 1});
        }
        
        // 좌우 확인 (경계선이 없을 때만)
        if (current.x > 0 && !needsLeftBorder(current.x, current.y)) {
          stack.push({x: current.x - 1, y: current.y});
        }
        if (current.x < baseSize - 1 && !needsRightBorder(current.x, current.y)) {
          stack.push({x: current.x + 1, y: current.y});
        }
      }
      
      // 모든 연결된 벽에 색상 적용
      wallsToColor.forEach(pos => {
        newGrid[pos.y][pos.x].wallColor = color || undefined;
      });
      
      console.log(`🎨 벽지 변경: ${wallsToColor.length}개 벽, 색상: ${color}`);
      return newGrid;
    });
  };

  /**
   * 바닥재 색상 변경 (연결된 바닥 전체)
   */
  const updateFloorColor = (x: number, y: number, color: string | null) => {
    setGrid((prevGrid) => {
      // 클릭한 칸이 바닥이 아니면 무시
      if (prevGrid[y][x].tileType !== 'FLOOR') {
        console.log(`❌ [${x}, ${y}]는 바닥이 아님`);
        return prevGrid;
      }
      
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      
      // Flood fill로 연결된 모든 바닥 찾기
      const floorsToColor: {x: number, y: number}[] = [];
      const stack = [{x, y}];
      const visited = new Set<string>();
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        const key = `${current.x},${current.y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        const cell = prevGrid[current.y][current.x];
        if (cell.tileType !== 'FLOOR') continue;
        
        floorsToColor.push(current);
        
        // 4방향 확인 (상하좌우)
        const directions = [
          {x: 0, y: -1}, // 위
          {x: 0, y: 1},  // 아래
          {x: -1, y: 0}, // 왼쪽
          {x: 1, y: 0}   // 오른쪽
        ];
        
        for (const dir of directions) {
          const newX = current.x + dir.x;
          const newY = current.y + dir.y;
          
          if (newX >= 0 && newX < baseSize && newY >= 0 && newY < baseSize) {
            stack.push({x: newX, y: newY});
          }
        }
      }
      
      // 모든 연결된 바닥에 색상 적용
      floorsToColor.forEach(pos => {
        newGrid[pos.y][pos.x].floorColor = color || undefined;
      });
      
      console.log(`🎨 바닥재 변경: ${floorsToColor.length}개 바닥, 색상: ${color}`);
      return newGrid;
    });
  };

  return { 
    grid, 
    updateTile, 
    placeItem, 
    canPlaceItem, 
    resetGrid,
    baseSize,
    updateWallColor,
    updateFloorColor,
  };
};
