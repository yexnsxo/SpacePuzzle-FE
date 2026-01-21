import React, { useState } from 'react';
import { useGrid } from '../../hooks/useRoomGrid';
import { TileType, TILE_SIZE, Item } from '../../types/roomBuilder';
import './RoomGrid.css';

// 테스트용 더미 가구 데이터
const MOCK_BED: Item = {
  id: 'bed_01',
  name: '안락한 침대',
  rarity: 'Common',
  size: [2, 1, 2], // [x(가로), y(세로), z(높이)] = 가로2, 세로1, 높이2
  placeType: 'FLOOR', // 바닥에만 배치 가능
};

const MOCK_SHELF: Item = {
  id: 'shelf_01',
  name: '우주 선반',
  rarity: 'Common',
  size: [1, 1, 2], // [x(가로), y(세로), z(높이)] = 1x1x2
  placeType: 'WALL', // 벽에만 배치 가능
};

// 색상 팔레트
const COLOR_PALETTE = [
  { name: '기본', color: null },
  { name: '빨강', color: '#ff6b6b' },
  { name: '파랑', color: '#4dabf7' },
  { name: '초록', color: '#51cf66' },
  { name: '노랑', color: '#ffd43b' },
  { name: '보라', color: '#cc5de8' },
  { name: '주황', color: '#ff922b' },
  { name: '분홍', color: '#ff6b9d' },
];

interface RoomGridProps {
  isUIHidden?: boolean;
}

const RoomGrid = ({ isUIHidden = false }: RoomGridProps) => {
  // 고정 그리드 크기: 가로 32칸, 세로 18칸
  const gridSize = { width: 32, height: 18 };
  
  const { grid, updateTile, placeItem, canPlaceItem, resetGrid, baseSize, updateWallColor, updateFloorColor } = useGrid(gridSize.width, gridSize.height);
  const [currentMode, setCurrentMode] = useState<TileType | 'ITEM' | 'WALLPAPER' | 'FLOORING'>('FLOOR');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null);


  // 색상에 흰색을 섞는 함수
  const mixWithWhite = (color: string | undefined, ratio: number = 0.5): string => {
    if (!color) return '#bbb'; // 기본 색상
    
    // #RRGGBB 형식 파싱
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 흰색(255, 255, 255)과 혼합
    const mixR = Math.round(r + (255 - r) * ratio);
    const mixG = Math.round(g + (255 - g) * ratio);
    const mixB = Math.round(b + (255 - b) * ratio);
    
    return `#${mixR.toString(16).padStart(2, '0')}${mixG.toString(16).padStart(2, '0')}${mixB.toString(16).padStart(2, '0')}`;
  };
  
  // useRef로 즉시 반영되는 상태들
  const isDraggingRef = React.useRef(false);
  const lastDragPosRef = React.useRef<{x: number, y: number} | null>(null);

  // 전역 마우스 이벤트 (그리드 밖에서도 드래그 작동)
  React.useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        console.log(`🖱️ 전역 마우스 업! 드래그 종료`);
        isDraggingRef.current = false;
        lastDragPosRef.current = null;
        setIsDragging(false);
        setDragStartPos(null);
      }
    };
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        console.log(`🖱️ 전역 마우스 이동 중... (드래그 활성)`);
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  const handleCellClick = (x: number, y: number) => {
    if (currentMode === 'ITEM' && selectedItem) {
      placeItem(x, y, selectedItem);
    } else if (currentMode === 'WALLPAPER') {
      // 벽지: 벽 클릭 시 색상 변경
      updateWallColor(x, y, selectedColor);
    } else if (currentMode === 'FLOORING') {
      // 바닥재: 바닥 클릭 시 색상 변경
      updateFloorColor(x, y, selectedColor);
    } else if (currentMode === 'NONE') {
      // 지우기: 아이템이 있는 칸만 가능
      const cell = grid[y][x];
      const items = Array.isArray(cell.items) ? cell.items : [];
      if (items.length > 0) {
        updateTile(x, y, currentMode as TileType);
      }
    } else {
      // 바닥깔기, 벽 세우기
      updateTile(x, y, currentMode as TileType);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault(); // 기본 동작 방지
    
    if (e.button !== 0) return; // 왼쪽 버튼만
    
    console.log(`🖱️ 마우스 다운: [${x}, ${y}], 모드: ${currentMode}`);
    
    // 첫 클릭 처리
    if (currentMode === 'ITEM' && selectedItem) {
      placeItem(x, y, selectedItem);
      return; // 아이템 모드는 드래그 안 함
    }
    
    if (currentMode === 'WALLPAPER') {
      updateWallColor(x, y, selectedColor);
      return; // 벽지 모드는 드래그 안 함
    }
    
    if (currentMode === 'FLOORING') {
      updateFloorColor(x, y, selectedColor);
      return; // 바닥재 모드는 드래그 안 함
    }
    
    if (currentMode === 'NONE') {
      const cell = grid[y][x];
      const items = Array.isArray(cell.items) ? cell.items : [];
      if (items.length > 0) {
        updateTile(x, y, currentMode as TileType);
      }
    } else {
      updateTile(x, y, currentMode as TileType);
    }
    
    // 드래그 시작
    isDraggingRef.current = true;
    lastDragPosRef.current = {x, y};
    setIsDragging(true);
    setDragStartPos({x, y});
    console.log(`  ✅ 드래그 시작! isDraggingRef = ${isDraggingRef.current}`);
  };

  const applyDragAction = (x: number, y: number) => {
    console.log(`  🎯 applyDragAction 호출: [${x}, ${y}]`);
    
    // 같은 칸이면 무시 (중복 처리 방지)
    if (lastDragPosRef.current && lastDragPosRef.current.x === x && lastDragPosRef.current.y === y) {
      console.log(`    ⏭️ 같은 칸 (${x},${y}) 건너뜀`);
      return;
    }
    
    console.log(`    📍 새 위치로 업데이트: [${x}, ${y}]`);
    lastDragPosRef.current = {x, y};
    
    if (currentMode === 'NONE') {
      // 지우기: 아이템이 있으면 아이템 지우기, 없으면 타일 지우기
      const cell = grid[y][x];
      const items = Array.isArray(cell.items) ? cell.items : [];
      
      console.log(`  🗑️ 지우기: 아이템 ${items.length}개, 타일 ${cell.tileType}`);
      
      // 아이템이 있거나 타일이 NONE이 아니면 지우기 시도
      if (items.length > 0 || cell.tileType !== 'NONE') {
        console.log(`    ✅ 지우기 실행!`);
        updateTile(x, y, currentMode as TileType);
      }
    } else if (currentMode === 'FLOOR') {
      // 바닥: 무조건 깔기
      const cell = grid[y][x];
      console.log(`  🟦 바닥: 현재 ${cell.tileType}`);
      if (cell.tileType !== 'FLOOR') {
        console.log(`    ✅ 바닥 설치!`);
        updateTile(x, y, 'FLOOR');
      } else {
        console.log(`    ⏭️ 이미 바닥임`);
      }
    } else if (currentMode === 'WALL') {
      // 벽: 조건 확인 후 깔기
      const cell = grid[y][x];
      console.log(`  🧱 벽: 현재 ${cell.tileType}`);
      if (cell.tileType !== 'WALL') {
        console.log(`    ✅ 벽 설치 시도!`);
        updateTile(x, y, 'WALL');
      } else {
        console.log(`    ⏭️ 이미 벽임`);
      }
    }
  };

  const handleMouseEnter = (x: number, y: number) => {
    setHoverPos({x, y});
    
    // 드래그 중이면 액션 적용
    if (isDraggingRef.current && currentMode !== 'ITEM') {
      console.log(`🖱️ MouseEnter [${x}, ${y}] → 드래그 중 → applyDragAction 호출`);
      applyDragAction(x, y);
    }
  };

  const handleMouseMove = (x: number, y: number) => {
    // 드래그 중이면 액션 적용 (mouseEnter보다 더 확실함)
    if (isDraggingRef.current && currentMode !== 'ITEM') {
      console.log(`🖱️ MouseMove: [${x}, ${y}], 드래그 중`);
      applyDragAction(x, y);
    }
  };

  const handleMouseUp = () => {
    console.log(`🖱️ 마우스 업!`);
    isDraggingRef.current = false;
    lastDragPosRef.current = null;
    setIsDragging(false);
    setDragStartPos(null);
  };

  const selectItem = (item: Item) => {
    setCurrentMode('ITEM');
    setSelectedItem(item);
  };

  // 벽의 높이 계산 (바닥까지의 거리)
  const getWallHeight = (x: number, y: number): number => {
    if (grid[y][x].tileType !== 'WALL') return -1;
    
    let height = 0;
    let currentY = y + 1;
    
    while (currentY < baseSize.height) {
      const cell = grid[currentY][x];
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

  // 왼쪽에 경계선이 필요한지 확인
  const needsLeftBorder = (x: number, y: number): boolean => {
    if (x === 0) return false;
    
    const currentHeight = getWallHeight(x, y);
    if (currentHeight === -1) return false;
    
    const leftCell = grid[y][x - 1];
    if (leftCell.tileType !== 'WALL') return true;
    
    const leftHeight = getWallHeight(x - 1, y);
    return currentHeight !== leftHeight;
  };

  // 오른쪽에 경계선이 필요한지 확인
  const needsRightBorder = (x: number, y: number): boolean => {
    if (x === baseSize.width - 1) return false;
    
    const currentHeight = getWallHeight(x, y);
    if (currentHeight === -1) return false;
    
    const rightCell = grid[y][x + 1];
    if (rightCell.tileType !== 'WALL') return true;
    
    const rightHeight = getWallHeight(x + 1, y);
    return currentHeight !== rightHeight;
  };

  // 바로 아래가 바닥인 벽인지 확인
  const isWallDirectlyOnFloor = (x: number, y: number): boolean => {
    if (grid[y][x].tileType !== 'WALL') return false;
    if (y + 1 < baseSize.height && grid[y + 1][x].tileType === 'FLOOR') {
      return true;
    }
    return false;
  };

  // 벽의 제일 위(꼭대기)인지 확인
  const isWallTop = (x: number, y: number): boolean => {
    if (grid[y][x].tileType !== 'WALL') return false;
    if (y === 0) return true;
    return grid[y - 1][x].tileType !== 'WALL';
  };

  return (
    <div className="builder-container">
      {/* 드래그 상태 표시 */}
      {isDragging && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 123, 255, 0.9)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          🖱️ 드래그 중... (마우스를 누른 채로 이동하세요)
        </div>
      )}
      
      {/* 상단 모드 선택 버튼 (UI 숨기기 시에도 표시) */}
      {!isUIHidden && (
      <div className="toolbar">
        <div style={{
          display: 'inline-block',
          marginRight: '20px',
          padding: '8px 16px',
          background: '#1a1a1a',
          borderRadius: '4px',
          color: '#0ff',
          fontWeight: 'bold',
        }}>
          현재 모드: {currentMode === 'FLOOR' ? '🟦 바닥 깔기' : 
                     currentMode === 'WALL' ? '🧱 벽 세우기' : 
                     currentMode === 'NONE' ? '🗑️ 지우기' : 
                     currentMode === 'WALLPAPER' ? '🎨 벽지' :
                     currentMode === 'FLOORING' ? '🎨 바닥재' :
                     currentMode === 'ITEM' && selectedItem ? `📦 ${selectedItem.name}` : '선택 안 됨'}
        </div>
        <button 
          className={currentMode === 'FLOOR' ? 'active' : ''} 
          onClick={() => { setCurrentMode('FLOOR'); setSelectedItem(null); }}
          title="클릭하거나 드래그하여 바닥을 깔 수 있습니다"
        >
          바닥 깔기
        </button>
        <button 
          className={currentMode === 'WALL' ? 'active' : ''} 
          onClick={() => { setCurrentMode('WALL'); setSelectedItem(null); }}
        >
          벽 세우기
        </button>
        <button 
          className={currentMode === 'NONE' ? 'active' : ''} 
          onClick={() => { setCurrentMode('NONE'); setSelectedItem(null); }}
        >
          지우기
        </button>
        <button 
          className={currentMode === 'WALLPAPER' ? 'active' : ''} 
          onClick={() => { setCurrentMode('WALLPAPER'); setSelectedItem(null); }}
        >
          🎨 벽지
        </button>
        <button 
          className={currentMode === 'FLOORING' ? 'active' : ''} 
          onClick={() => { setCurrentMode('FLOORING'); setSelectedItem(null); }}
        >
          🎨 바닥재
        </button>
        <button 
          className={currentMode === 'ITEM' && selectedItem?.id === 'bed_01' ? 'active' : ''} 
          onClick={() => selectItem(MOCK_BED)}
        >
          🛏️ 침대 (2x1x2)
        </button>
        <button 
          className={currentMode === 'ITEM' && selectedItem?.id === 'shelf_01' ? 'active' : ''} 
          onClick={() => selectItem(MOCK_SHELF)}
        >
          📦 선반 (1x1x2)
        </button>
        <button 
          className="reset-button"
          onClick={resetGrid}
        >
          🔄 초기화
        </button>
      </div>
      )}

      {/* 색상 팔레트 (벽지/바닥재 모드일 때만 표시, UI 숨기기 시에도 표시) */}
      {!isUIHidden && (currentMode === 'WALLPAPER' || currentMode === 'FLOORING') && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '8px',
          flexWrap: 'wrap',
          maxWidth: '600px',
        }}>
          <div style={{ color: '#fff', width: '100%', marginBottom: '5px' }}>
            색상 선택:
          </div>
          {COLOR_PALETTE.map((item) => (
            <button
              key={item.name}
              onClick={() => setSelectedColor(item.color)}
              style={{
                width: '60px',
                height: '60px',
                border: selectedColor === item.color ? '3px solid #0ff' : '2px solid #555',
                borderRadius: '8px',
                background: item.color || '#444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: item.color ? '#fff' : '#aaa',
                fontWeight: 'bold',
                textShadow: '0 0 3px rgba(0,0,0,0.8)',
              }}
              title={item.name}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {/* 그리드 판 */}
      <div 
        className={`grid-board ${isDragging ? 'dragging' : ''}`}
        onMouseLeave={() => { 
          console.log(`🖱️ 그리드 벗어남 (드래그: ${isDraggingRef.current})`);
          setHoverPos(null);
        }}
        onMouseUp={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${baseSize.width}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${baseSize.height}, ${TILE_SIZE}px)`,
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
      >
        {/* 그리드 셀들 */}
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const isWall = cell.tileType === 'WALL';
            const leftBorder = isWall && needsLeftBorder(x, y);
            const rightBorder = isWall && needsRightBorder(x, y);
            const hasItems = Array.isArray(cell.items) && cell.items.length > 0;
            const isErasable = currentMode === 'NONE' && hasItems;
            
            return (
              <div
                key={`${y}-${x}`}
                className={`grid-cell ${cell.tileType.toLowerCase()} ${leftBorder ? 'border-left' : ''} ${rightBorder ? 'border-right' : ''} ${isErasable ? 'erasable' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, x, y)}
                onMouseEnter={() => handleMouseEnter(x, y)}
                onMouseMove={() => handleMouseMove(x, y)}
                draggable={false}
                style={{
                  cursor: currentMode === 'ITEM' ? 'pointer' : 'crosshair',
                  backgroundColor: cell.tileType === 'WALL' && cell.wallColor ? cell.wallColor :
                                   cell.tileType === 'FLOOR' && cell.floorColor ? cell.floorColor : 
                                   undefined,
                }}
              >
                {/* 벽의 꼭대기 표시 (벽지 색 + 흰색 혼합) */}
                {cell.tileType === 'WALL' && isWallTop(x, y) && (
                  <div 
                    className="wall-ceiling" 
                    style={{
                      backgroundColor: mixWithWhite(cell.wallColor, 0.6)
                    }}
                  />
                )}
                
                {/* 바닥 바로 위의 벽 하단 표시 (갈색 고정) */}
                {cell.tileType === 'WALL' && isWallDirectlyOnFloor(x, y) && <div className="wall-top" />}
              </div>
            );
          })
        )}
        
        {/* 아이템들을 grid-board 레벨에서 렌더링 (overflow 문제 해결!) */}
        {(() => {
          const renderedItems = new Set<string>();
          const itemsToRender: JSX.Element[] = [];
          
          grid.forEach((row, y) => {
            row.forEach((cell, x) => {
              if (!cell.items || !Array.isArray(cell.items)) return;
              
              cell.items.forEach((placedItem) => {
                // 이미 렌더링된 아이템은 건너뛰기 (중복 방지)
                if (renderedItems.has(placedItem.placementId)) return;
                
                // originX, originY가 현재 칸인 아이템만 렌더링
                if (placedItem.originX !== x || placedItem.originY !== y) return;
                
                renderedItems.add(placedItem.placementId);
                
                const [sizeX, sizeY, sizeZ] = placedItem.itemData.size;
                const [heightStart, heightEnd] = placedItem.heightRange;
                const itemType = placedItem.itemData.placeType === 'FLOOR' ? 'floor-item' : 'wall-item';
                
                itemsToRender.push(
                  <div 
                    key={placedItem.placementId}
                    className={`item-sprite ${itemType}`}
                    style={{
                      position: 'absolute',
                      left: `${placedItem.originX * TILE_SIZE}px`,
                      top: `${placedItem.originY * TILE_SIZE}px`,
                      width: `${sizeX * TILE_SIZE}px`,
                      height: `${sizeY * TILE_SIZE}px`,
                      zIndex: 100 + heightEnd,
                    }}
                    title={`${placedItem.itemData.name} at [${placedItem.originX}, ${placedItem.originY}] 높이: ${heightStart}~${heightEnd}`}
                  >
                    <div>{placedItem.itemData.name}</div>
                    <small>h:{heightStart}~{heightEnd}</small>
                  </div>
                );
              });
            });
          });
          
          return itemsToRender;
        })()}

        {/* 배치를 도와주는 고스트 프리뷰 영역 */}
        {currentMode === 'ITEM' && hoverPos && selectedItem && (
          <div 
            className={`ghost-preview ${canPlaceItem(hoverPos.x, hoverPos.y, selectedItem) ? 'can-place' : 'cant-place'}`}
            style={{
              position: 'absolute',
              left: hoverPos.x * TILE_SIZE,
              top: hoverPos.y * TILE_SIZE,
              width: selectedItem.size[0] * TILE_SIZE,
              height: selectedItem.size[1] * TILE_SIZE,
              pointerEvents: 'none',
              zIndex: 100
            }}
          >
            {selectedItem.name}
            <br />
            {selectedItem.size[0]}x{selectedItem.size[1]}x{selectedItem.size[2]}
          </div>
        )}
      </div>

    </div>
  );
};

export default RoomGrid;
