import { Piece } from './Piece';
import { Group } from './Group';
import { PuzzleEngine } from './PuzzleEngine';
import type { PieceEdges, EdgeType } from './types';

const canvas = document.getElementById('puzzleCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// --- [설정] 판 크기 및 보관함 설정 ---
const BOARD_SIZE = 400; 
const rows = 10;         
const cols = 10;         
const pieceSize = BOARD_SIZE / cols; 

canvas.width = 800; 

const TRAY_COLS = 8;             
const TRAY_VISIBLE_ROWS = 3;     
const TRAY_X = 10;
const TRAY_Y = BOARD_SIZE + 30;
const TRAY_WIDTH = canvas.width - 20;
const TRAY_PIECE_SIZE = (TRAY_WIDTH - 100) / TRAY_COLS; 
const TRAY_HEIGHT = (TRAY_PIECE_SIZE + 15) * TRAY_VISIBLE_ROWS + 30; 
const TRAY_RADIUS = 20; 
const SCROLLBAR_WIDTH = 8;

canvas.height = TRAY_Y + TRAY_HEIGHT + 20;

let trayScrollY = 0;            
let totalTrayHeight = 0;         
let isScrollingTray = false;
let isDraggingScrollBar = false; 
let lastMouseY = 0;

const puzzleImage = new Image();
puzzleImage.crossOrigin = "Anonymous"; 
puzzleImage.src = `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`;

puzzleImage.onload = () => {
  initGame();
  render();
};

// --- 1. 유틸리티 함수 ---

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPuzzlePiecePath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, edges: PieceEdges) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  drawJigsawSide(ctx, {x, y}, {x: x + size, y: y}, edges.top, size);
  drawJigsawSide(ctx, {x: x + size, y: y}, {x: x + size, y: y + size}, edges.right, size);
  drawJigsawSide(ctx, {x: x + size, y: y + size}, {x: x, y: y + size}, edges.bottom, size);
  drawJigsawSide(ctx, {x: x, y: y + size}, {x: x, y: y}, edges.left, size);
  ctx.closePath();
}

function drawJigsawSide(ctx: CanvasRenderingContext2D, p1: {x:number, y:number}, p2: {x:number, y:number}, type: number, size: number) {
  if (type === 0) { ctx.lineTo(p2.x, p2.y); return; }
  const vx = p2.x - p1.x;
  const vy = p2.y - p1.y;
  const len = Math.sqrt(vx * vx + vy * vy);
  const unx = -vy / len; 
  const uny = vx / len;
  const tabHeight = size * 0.16 * type; 
  const neckWidth = size * 0.08;        
  const headWidth = size * 0.22;        
  const cp = (p: number, n: number) => ({ x: p1.x + vx * p + unx * n, y: p1.y + vy * p + uny * n });
  const pA = cp(0.5 - headWidth / size, 0); 
  const pB = cp(0.5 - neckWidth / size, tabHeight * 0.15);
  const pC = cp(0.5 - headWidth / size, tabHeight * 0.85);
  const pD = cp(0.5, tabHeight * 1.15); 
  const pE = cp(0.5 + headWidth / size, tabHeight * 0.85);
  const pF = cp(0.5 + neckWidth / size, tabHeight * 0.15);
  const pG = cp(0.5 + headWidth / size, 0);
  ctx.lineTo(pA.x, pA.y);
  ctx.bezierCurveTo(pB.x, pB.y, pC.x, pC.y, pD.x, pD.y);
  ctx.bezierCurveTo(pE.x, pE.y, pF.x, pF.y, pG.x, pG.y);
  ctx.lineTo(p2.x, p2.y);
}

// --- 2. 초기 데이터 세팅 ---

const horizontalEdges: number[][] = [];
const verticalEdges: number[][] = [];
const groups: Group[] = [];

function initGame() {
  for (let y = 0; y < rows; y++) {
    horizontalEdges[y] = [];
    for (let x = 0; x < cols - 1; x++) { horizontalEdges[y][x] = Math.random() > 0.5 ? 1 : -1; }
  }
  for (let y = 0; y < rows - 1; y++) {
    verticalEdges[y] = [];
    for (let x = 0; x < cols; x++) { verticalEdges[y][x] = Math.random() > 0.5 ? 1 : -1; }
  }

  const tempPieces: Piece[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      tempPieces.push(new Piece(`${x}-${y}`, x, y, getEdges(x, y), pieceSize));
    }
  }

  for (let i = tempPieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tempPieces[i], tempPieces[j]] = [tempPieces[j], tempPieces[i]];
  }

  const spacing = 10;
  tempPieces.forEach((piece, index) => {
    const r = Math.floor(index / TRAY_COLS);
    const c = index % TRAY_COLS;
    const currentX = TRAY_X + 25 + c * (TRAY_PIECE_SIZE + spacing);
    const currentY = TRAY_Y + 20 + r * (TRAY_PIECE_SIZE + spacing);
    groups.push(new Group(piece, { x: currentX, y: currentY }));
  });

  totalTrayHeight = Math.ceil(tempPieces.length / TRAY_COLS) * (TRAY_PIECE_SIZE + spacing) + 40;
}

function getEdges(x: number, y: number): PieceEdges {
  return {
    top: y === 0 ? 0 : -verticalEdges[y - 1][x],
    bottom: y === rows - 1 ? 0 : verticalEdges[y][x],
    left: x === 0 ? 0 : -horizontalEdges[y][x - 1],
    right: x === cols - 1 ? 0 : horizontalEdges[y][x],
  };
}

let selectedGroup: Group | null = null;
let offset = { x: 0, y: 0 };

// --- 3. 렌더링 루프 ---

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = '#333'; ctx.setLineDash([5, 5]);
  ctx.strokeRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  ctx.setLineDash([]); ctx.globalAlpha = 0.1;
  ctx.drawImage(puzzleImage, 0, 0, BOARD_SIZE, BOARD_SIZE); ctx.globalAlpha = 1.0;

  ctx.fillStyle = '#1a1a1a';
  drawRoundedRect(ctx, TRAY_X, TRAY_Y, TRAY_WIDTH, TRAY_HEIGHT, TRAY_RADIUS);
  ctx.fill();

  // --- [수정 핵심: 스크롤바 시각화 보정] ---
  const scrollTrackHeight = TRAY_HEIGHT - 40;
  const scrollRange = Math.max(0, totalTrayHeight - TRAY_HEIGHT);
  
  // 핸들 높이: 최소 30px, 최대 트랙의 50%로 제한하여 너무 길어지지 않게 함
  let thumbHeight = (TRAY_HEIGHT / totalTrayHeight) * scrollTrackHeight;
  thumbHeight = Math.min(scrollTrackHeight * 0.5, Math.max(30, thumbHeight));
  
  const thumbY = TRAY_Y + 20 + (scrollRange > 0 ? (-trayScrollY / scrollRange) * (scrollTrackHeight - thumbHeight) : 0);
  
  ctx.fillStyle = '#333';
  drawRoundedRect(ctx, TRAY_X + TRAY_WIDTH - 15, TRAY_Y + 20, SCROLLBAR_WIDTH, scrollTrackHeight, 4);
  ctx.fill();
  ctx.fillStyle = isDraggingScrollBar ? '#888' : '#555';
  drawRoundedRect(ctx, TRAY_X + TRAY_WIDTH - 15, thumbY, SCROLLBAR_WIDTH, thumbHeight, 4);
  ctx.fill();

  ctx.save();
  const clipPath = new Path2D();
  clipPath.rect(TRAY_X, TRAY_Y, TRAY_WIDTH - 20, TRAY_HEIGHT);
  
  groups.forEach((group) => {
    if (group.pieces.length === 0) return;
    
    const isInTrayArea = group.position.y > TRAY_Y - 50 && group !== selectedGroup;
    const renderX = group.position.x;
    const renderY = isInTrayArea ? group.position.y + trayScrollY : group.position.y;

    if (isInTrayArea) { ctx.save(); ctx.clip(clipPath); }

    group.pieces.forEach(p => {
      const scale = isInTrayArea ? TRAY_PIECE_SIZE / pieceSize : 1;
      const currentSize = p.size * scale;
      const wx = renderX + p.relativePos.x * scale;
      const wy = renderY + p.relativePos.y * scale;

      if (wy + currentSize < TRAY_Y || wy > TRAY_Y + TRAY_HEIGHT) { if (isInTrayArea) return; }

      ctx.save();
      drawPuzzlePiecePath(ctx, wx, wy, currentSize, p.edges);
      ctx.clip();
      ctx.drawImage(puzzleImage, wx - (p.gridX * currentSize), wy - (p.gridY * currentSize), BOARD_SIZE * scale, BOARD_SIZE * scale);
      ctx.restore();

      ctx.beginPath();
      drawPuzzlePiecePath(ctx, wx, wy, currentSize, p.edges);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = (group === selectedGroup) ? '#fff' : 'rgba(255,255,255,0.2)';
      ctx.stroke();
    });

    if (isInTrayArea) ctx.restore();
  });
  ctx.restore(); 

  if (selectedGroup) {
    selectedGroup.pieces.forEach(p => {
      const wx = selectedGroup!.position.x + p.relativePos.x;
      const wy = selectedGroup!.position.y + p.relativePos.y;
      ctx.save(); drawPuzzlePiecePath(ctx, wx, wy, p.size, p.edges); ctx.clip();
      ctx.drawImage(puzzleImage, wx - (p.gridX * p.size), wy - (p.gridY * p.size), BOARD_SIZE, BOARD_SIZE);
      ctx.restore();
      ctx.beginPath(); drawPuzzlePiecePath(ctx, wx, wy, p.size, p.edges);
      ctx.strokeStyle = '#fff'; ctx.stroke();
    });
  }
  requestAnimationFrame(render);
}

// --- 4. 마우스 인터랙션 ---

canvas.addEventListener('mousedown', (e) => {
  const { offsetX, offsetY } = e;
  
  if (offsetX >= TRAY_X + TRAY_WIDTH - 25 && offsetY >= TRAY_Y && offsetY <= TRAY_Y + TRAY_HEIGHT) {
    isDraggingScrollBar = true; lastMouseY = offsetY; return;
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]; if (g.isLocked) continue;

    const isInTray = g.position.y > TRAY_Y - 50;
    const scale = isInTray ? TRAY_PIECE_SIZE / pieceSize : 1;
    
    const renderX = g.position.x;
    const renderY = isInTray ? g.position.y + trayScrollY : g.position.y;
    
    const localX = (offsetX - renderX) / scale;
    const localY = (offsetY - renderY) / scale;

    if (g.isPointInside(localX + g.position.x, localY + g.position.y)) {
      selectedGroup = g;
      groups.push(groups.splice(i, 1)[0]);
      if (isInTray) { selectedGroup.position.y += trayScrollY; }
      offset.x = offsetX - selectedGroup.position.x;
      offset.y = offsetY - selectedGroup.position.y;
      return;
    }
  }

  if (offsetY >= TRAY_Y && offsetY <= TRAY_Y + TRAY_HEIGHT) {
    isScrollingTray = true; lastMouseY = offsetY;
  }
});

window.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (selectedGroup) {
    selectedGroup.position.x = mouseX - offset.x;
    selectedGroup.position.y = mouseY - offset.y;
  } else if (isDraggingScrollBar) {
    // --- [수정 핵심: 드래그 감도 보정] ---
    const deltaY = mouseY - lastMouseY;
    const scrollTrackHeight = TRAY_HEIGHT - 40;
    
    // 핸들 높이 계산 로직을 render와 동일하게 적용
    let thumbHeight = (TRAY_HEIGHT / totalTrayHeight) * scrollTrackHeight;
    thumbHeight = Math.min(scrollTrackHeight * 0.5, Math.max(30, thumbHeight));
    
    const scrollRange = Math.max(0, totalTrayHeight - TRAY_HEIGHT);
    const usableTrackHeight = scrollTrackHeight - thumbHeight;

    if (scrollRange > 0 && usableTrackHeight > 0) {
      // 마우스가 움직인 거리를 실제 스크롤 값으로 비례 계산
      trayScrollY -= (deltaY / usableTrackHeight) * scrollRange;
      trayScrollY = Math.max(-scrollRange, Math.min(0, trayScrollY));
    }
    lastMouseY = mouseY;
  } else if (isScrollingTray) {
    const deltaY = mouseY - lastMouseY;
    trayScrollY += deltaY;
    const scrollRange = Math.max(0, totalTrayHeight - TRAY_HEIGHT);
    trayScrollY = Math.max(-scrollRange, Math.min(0, trayScrollY));
    lastMouseY = mouseY;
  }
});

window.addEventListener('mouseup', () => {
  if (selectedGroup) {
    let mergedAny = true;
    while (mergedAny) {
      mergedAny = false;
      for (const target of groups) {
        if (target === selectedGroup || target.pieces.length === 0) continue;
        if (PuzzleEngine.tryMerge(selectedGroup, target)) {
          mergedAny = true; 
          if (target.isLocked) { selectedGroup = null; mergedAny = false; break; }
        }
      }
      if (!selectedGroup) break;
    }
    if (selectedGroup) checkBoardLock(selectedGroup);
  }
  selectedGroup = null; isScrollingTray = false; isDraggingScrollBar = false;
});

function checkBoardLock(group: Group) {
  if (group.pieces.length === 0) return;
  const anchor = group.pieces[0];
  const wx = group.position.x + anchor.relativePos.x;
  const wy = group.position.y + anchor.relativePos.y;
  if (Math.sqrt(Math.pow(wx - anchor.gridX * anchor.size, 2) + Math.pow(wy - anchor.gridY * anchor.size, 2)) < 25) {
    group.position.x = 0; group.position.y = 0;
    group.pieces.forEach(p => { p.relativePos.x = p.gridX * p.size; p.relativePos.y = p.gridY * p.size; });
    group.lock();
  }
}

render();