import Phaser from 'phaser';
import { Piece } from '../puzzle/Piece';
import { Group } from '../puzzle/Group';
import { PuzzleEngine } from '../puzzle/PuzzleEngine';
import { drawPuzzleShapePhaser } from './utils';

/**
 * Phaser 기반 퍼즐 Scene
 * 기존 퍼즐 로직(PuzzleEngine, Group, Piece)을 완전히 그대로 사용
 */
export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PuzzleScene' });
  }

  init(data) {
    // React에서 전달받은 데이터
    this.puzzleConfig = data.puzzleConfig;
    this.imageUrl = data.imageUrl;
    this.onComplete = data.onComplete;
    this.onProgressUpdate = data.onProgressUpdate;
    this.onPause = data.onPause;
    
    // 퍼즐 판 설정
    this.BOARD_SIZE = 500;
    this.CANVAS_WIDTH = 800;
    this.BOARD_OFFSET_X = (this.CANVAS_WIDTH - this.BOARD_SIZE) / 2;
    this.BOARD_OFFSET_Y = 20;
    
    // 조각 보관소 설정
    this.TRAY_COLS = 8;
    this.TRAY_VISIBLE_ROWS = 2;
    this.TRAY_X = 10;
    this.TRAY_Y = this.BOARD_OFFSET_Y + this.BOARD_SIZE + 40;
    this.TRAY_WIDTH = this.CANVAS_WIDTH - 20;
    this.TRAY_PIECE_SIZE = (this.TRAY_WIDTH - 100) / this.TRAY_COLS;
    this.TRAY_HEIGHT = (this.TRAY_PIECE_SIZE + 15) * this.TRAY_VISIBLE_ROWS + 40;
    this.CANVAS_HEIGHT = this.TRAY_Y + this.TRAY_HEIGHT + 20;
    
    // 게임 상태
    this.groups = [];
    this.draggedGroup = null;
    this.pieces = [];
    this.floatingTime = 0;
    this.isPaused = false;
  }

  preload() {
    // 퍼즐 이미지 로드
    console.log('🖼️ Phaser 이미지 로드 시작:', this.imageUrl);
    
    // 이미지 로드 실패 시 에러 핸들링
    this.load.on('loaderror', (file) => {
      console.error('❌ Phaser 이미지 로드 실패:', file.key, file.src);
      alert('이미지를 불러올 수 없습니다. URL을 확인하거나 CORS 설정을 확인해주세요.');
    });
    
    this.load.image('puzzle', this.imageUrl);
  }

  create() {
    const { gridSize, seed } = this.puzzleConfig;
    const actualPieceSize = this.BOARD_SIZE / gridSize;
    
    console.log('✅ Phaser create 시작');
    console.log('  - gridSize:', gridSize);
    console.log('  - 이미지 로드 완료:', this.textures.exists('puzzle'));
    
    // 배경 생성
    this.createBackground();
    
    // 퍼즐 판 (실루엣)
    this.createBoard();
    
    // 조각 보관소
    this.createTray();
    
    // 퍼즐 조각 생성 (기존 로직 그대로)
    this.pieces = this.generatePuzzlePieces(gridSize, seed, actualPieceSize);
    this.groups = this.pieces.map((piece, i) => {
      const col = i % this.TRAY_COLS;
      const row = Math.floor(i / this.TRAY_COLS);
      const startX = this.TRAY_X + 40 + col * (this.TRAY_PIECE_SIZE + 10);
      const startY = this.TRAY_Y + 40 + row * (this.TRAY_PIECE_SIZE + 15);
      
      return new Group(piece, { x: startX, y: startY });
    });
    
    // Phaser 스프라이트 컨테이너 생성
    this.createPuzzleSprites();
    
    // 입력 설정
    this.setupInput();
    
    // 물리 효과 업데이트
    this.events.on('update', this.updatePhysics, this);
  }

  createBackground() {
    // 우주 배경 그라디언트
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1e1450, 0x1e1450, 0x0a001e, 0x0a001e, 1);
    graphics.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // 별들 (반짝임 효과)
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Math.random() * this.CANVAS_WIDTH,
        Math.random() * this.CANVAS_HEIGHT,
        Math.random() * 1.5 + 0.5,
        0xffffff,
        0.8
      );
      
      this.tweens.add({
        targets: star,
        alpha: Math.random() * 0.3 + 0.3,
        duration: Math.random() * 2000 + 1000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createBoard() {
    // 퍼즐 판 테두리 (점선)
    const boardGraphics = this.add.graphics();
    boardGraphics.lineStyle(2, 0x666666, 1);
    boardGraphics.strokeRect(
      this.BOARD_OFFSET_X,
      this.BOARD_OFFSET_Y,
      this.BOARD_SIZE,
      this.BOARD_SIZE
    );
    
    // 실루엣 (흐리게)
    const silhouette = this.add.image(
      this.BOARD_OFFSET_X + this.BOARD_SIZE / 2,
      this.BOARD_OFFSET_Y + this.BOARD_SIZE / 2,
      'puzzle'
    );
    silhouette.setDisplaySize(this.BOARD_SIZE, this.BOARD_SIZE);
    silhouette.setAlpha(0.1);
  }

  createTray() {
    // 조각 보관소 배경
    const trayGraphics = this.add.graphics();
    trayGraphics.fillStyle(0x1a1a1a, 1);
    trayGraphics.fillRoundedRect(this.TRAY_X, this.TRAY_Y, this.TRAY_WIDTH, this.TRAY_HEIGHT, 20);
    
    // 스크롤바는 나중에 구현 (일단 기본 기능 먼저)
  }

  generatePuzzlePieces(gridSize, seed, actualPieceSize) {
    // 기존 로직 완전히 동일
    const rng = this.createSeededRng(seed);
    const edgeGrid = {};
    const pieces = [];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const edges = {
          top: row === 0 ? 0 : -edgeGrid[`${col},${row - 1}`].bottom,
          right: col === gridSize - 1 ? 0 : (rng() > 0.5 ? 1 : -1),
          bottom: row === gridSize - 1 ? 0 : (rng() > 0.5 ? 1 : -1),
          left: col === 0 ? 0 : -edgeGrid[`${col - 1},${row}`].right,
        };

        edgeGrid[`${col},${row}`] = edges;
        pieces.push(new Piece(`${col}-${row}`, col, row, edges, actualPieceSize));
      }
    }

    // 셔플 (기존 로직)
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }

    return pieces;
  }

  createSeededRng(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = Math.imul(value ^ (value >>> 15), 1 | value);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  createPuzzleSprites() {
    // 각 그룹에 대한 컨테이너 생성
    this.groupContainers = [];
    
    this.groups.forEach((group, idx) => {
      const container = this.add.container(group.position.x, group.position.y);
      container.setSize(this.TRAY_PIECE_SIZE, this.TRAY_PIECE_SIZE);
      container.setInteractive({ draggable: true });
      container.setData('groupIndex', idx);
      container.setData('group', group);
      
      // 조각 렌더링 (Graphics로)
      this.renderGroupPieces(container, group);
      
      // 무중력 floating 효과 데이터
      container.setData('floatPhase', Math.random() * Math.PI * 2);
      container.setData('isInTray', true);
      
      this.groupContainers.push(container);
    });
  }

  renderGroupPieces(container, group) {
    const isInTray = container.y > this.TRAY_Y - 50;
    const scale = isInTray ? this.TRAY_PIECE_SIZE / group.pieces[0].size : 1;
    
    group.pieces.forEach(piece => {
      const x = piece.relativePos.x * scale;
      const y = piece.relativePos.y * scale;
      const size = piece.size * scale;
      
      // 퍼즐 모양 Graphics 생성
      const maskGraphics = this.make.graphics();
      drawPuzzleShapePhaser(maskGraphics, 0, 0, size, piece.edges);
      maskGraphics.fillPath();
      
      // 이미지 적용
      const img = this.add.image(
        -piece.gridX * size,
        -piece.gridY * size,
        'puzzle'
      );
      img.setOrigin(0, 0);
      img.setDisplaySize(this.BOARD_SIZE * scale, this.BOARD_SIZE * scale);
      
      // 마스크 적용 (퍼즐 모양으로 자르기)
      const geometryMask = maskGraphics.createGeometryMask();
      img.setMask(geometryMask);
      
      // 테두리 그리기
      const borderGraphics = this.add.graphics();
      drawPuzzleShapePhaser(borderGraphics, 0, 0, size, piece.edges);
      borderGraphics.lineStyle(1.5, 0xffffff, group.isLocked ? 0.15 : 0.3);
      borderGraphics.strokePath();
      
      // 컨테이너에 추가
      const pieceContainer = this.add.container(x, y);
      pieceContainer.add([img, maskGraphics, borderGraphics]);
      
      container.add(pieceContainer);
    });
  }

  setupInput() {
    // 드래그 시작
    this.input.on('dragstart', (pointer, gameObject) => {
      if (this.isPaused) return;
      
      const group = gameObject.getData('group');
      if (group.isLocked) return;
      
      this.draggedGroup = group;
      gameObject.setData('isDragging', true);
      gameObject.setDepth(1000); // 맨 위로
      
      // 속도 추적 초기화
      this.lastDragPos = { x: pointer.x, y: pointer.y };
      this.lastDragTime = Date.now();
    });
    
    // 드래그 중
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (this.isPaused) return;
      
      const group = gameObject.getData('group');
      
      // 위치 업데이트
      gameObject.x = dragX;
      gameObject.y = dragY;
      group.position.x = dragX;
      group.position.y = dragY;
      
      // 속도 계산 (관성용)
      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastDragTime;
      
      if (deltaTime > 0) {
        const deltaX = pointer.x - this.lastDragPos.x;
        const deltaY = pointer.y - this.lastDragPos.y;
        
        group.velocity = {
          x: (deltaX / deltaTime) * 50, // 강한 관성
          y: (deltaY / deltaTime) * 50,
        };
      }
      
      this.lastDragPos = { x: pointer.x, y: pointer.y };
      this.lastDragTime = currentTime;
    });
    
    // 드래그 끝
    this.input.on('dragend', (pointer, gameObject) => {
      if (this.isPaused) return;
      
      const group = gameObject.getData('group');
      gameObject.setData('isDragging', false);
      gameObject.setDepth(0);
      
      const speed = Math.sqrt(group.velocity.x ** 2 + group.velocity.y ** 2);
      if (speed > 1) {
        console.log('🚀 관성 발동! 속도:', speed.toFixed(2));
      }
      
      // 병합 시도 (기존 로직)
      this.tryMerge(group);
      
      // 스냅 시도
      this.trySnap(group);
      
      this.draggedGroup = null;
      this.updateProgress();
    });
  }

  tryMerge(activeGroup) {
    let mergedAny = true;
    while (mergedAny) {
      mergedAny = false;
      for (const targetGroup of this.groups) {
        if (targetGroup === activeGroup || targetGroup.pieces.length === 0) continue;
        
        if (PuzzleEngine.tryMerge(activeGroup, targetGroup)) {
          console.log('🔗 병합 성공');
          activeGroup.velocity = { x: 0, y: 0 }; // 병합시 관성 제거
          mergedAny = true;
          
          if (targetGroup.isLocked) {
            break;
          }
        }
      }
    }
  }

  trySnap(group) {
    if (group.isLocked || group.pieces.length === 0) return;
    
    let maxDistance = 0;
    let minPieceSize = Infinity;
    
    for (const piece of group.pieces) {
      const wx = group.position.x + piece.relativePos.x;
      const wy = group.position.y + piece.relativePos.y;
      
      const targetX = this.BOARD_OFFSET_X + piece.gridX * piece.size;
      const targetY = this.BOARD_OFFSET_Y + piece.gridY * piece.size;
      
      const distance = Math.sqrt(Math.pow(wx - targetX, 2) + Math.pow(wy - targetY, 2));
      maxDistance = Math.max(maxDistance, distance);
      minPieceSize = Math.min(minPieceSize, piece.size);
    }
    
    const snapThreshold = minPieceSize * 0.08;
    
    if (maxDistance < snapThreshold) {
      group.position.x = this.BOARD_OFFSET_X;
      group.position.y = this.BOARD_OFFSET_Y;
      group.pieces.forEach(p => {
        p.relativePos.x = p.gridX * p.size;
        p.relativePos.y = p.gridY * p.size;
      });
      group.lock();
      group.velocity = { x: 0, y: 0 };
      
      console.log('✅ 스냅 성공!');
    }
  }

  updatePhysics(time, delta) {
    if (this.isPaused) return;
    
    this.floatingTime += delta;
    
    // 관성 + floating 효과
    this.groupContainers.forEach((container, idx) => {
      const group = this.groups[idx];
      if (!group || group.pieces.length === 0 || group.isLocked) return;
      
      const isDragging = container.getData('isDragging');
      const isInTray = container.y > this.TRAY_Y - 50;
      
      // 관성 효과 (드래그 중이 아닐 때)
      if (!isDragging) {
        const speed = Math.sqrt(group.velocity.x ** 2 + group.velocity.y ** 2);
        
        if (speed > 0.3) {
          group.position.x += group.velocity.x;
          group.position.y += group.velocity.y;
          
          container.x = group.position.x;
          container.y = group.position.y;
          
          // 우주 감속
          group.velocity.x *= 0.96;
          group.velocity.y *= 0.96;
        } else {
          group.velocity.x = 0;
          group.velocity.y = 0;
        }
      }
      
      // 무중력 floating 효과 (보관소에 있을 때)
      if (isInTray && !isDragging) {
        const phase = container.getData('floatPhase');
        const floatY = Math.sin(this.floatingTime * 0.0025 + phase) * 8;
        const floatX = Math.cos(this.floatingTime * 0.002 + phase * 0.7) * 4;
        
        container.x = group.position.x + floatX;
        container.y = group.position.y + floatY;
      }
    });
  }

  updateProgress() {
    const totalPieces = this.pieces.length;
    const lockedPieces = this.groups.reduce((sum, g) => {
      return g.isLocked ? sum + g.pieces.length : sum;
    }, 0);
    
    const progress = Math.round((lockedPieces / totalPieces) * 100);
    
    if (this.onProgressUpdate) {
      this.onProgressUpdate(progress);
    }
    
    // 완료 체크
    if (progress === 100 && this.onComplete) {
      this.onComplete();
    }
  }

  pause() {
    this.isPaused = true;
    this.scene.pause();
  }

  resume() {
    this.isPaused = false;
    this.scene.resume();
  }
}
