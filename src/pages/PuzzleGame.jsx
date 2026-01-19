import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Piece } from '../game/puzzle/Piece';
import { Group } from '../game/puzzle/Group';
import { PuzzleEngine } from '../game/puzzle/PuzzleEngine';
import { drawPuzzleShape } from '../game/puzzle/utils';
import { supabase } from '../supabaseClient';

const createSeededRng = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const PuzzleGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  
  // 천체 데이터 (GamePlay에서 전달받음)
  const celestialBody = location.state?.celestialBody || {
    id: 'earth',
    name: '지구',
    difficulty: '쉬움',
    gridSize: 3,
    image: null,
  };

  const [puzzleData, setPuzzleData] = useState(null);
  const [isPuzzleLoading, setIsPuzzleLoading] = useState(true);
  const [puzzleError, setPuzzleError] = useState(null);

  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const timeRef = useRef(0);
  
  // 퍼즐 게임 상태
  const groupsRef = useRef([]);
  const draggedGroupRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const puzzleImageRef = useRef(null);
  const isLoadedRef = useRef(false);
  const completeRequestRef = useRef(false);

  const nasaIdFromState = location.state?.nasaId
    || celestialBody.nasaId
    || (typeof celestialBody.nameEn === 'string' ? celestialBody.nameEn.toLowerCase() : null)
    || 'earth';

  const puzzleSeed = puzzleData?.puzzleConfig?.seed ?? puzzleData?.puzzleSeed;
  const puzzleBody = {
    ...celestialBody,
    gridSize: puzzleData?.puzzleConfig?.gridSize ?? puzzleData?.gridSize ?? celestialBody.gridSize,
    image: puzzleData?.imageUrl ?? celestialBody.image,
    difficulty: puzzleData?.difficulty ?? celestialBody.difficulty,
  };
  
  // 🔍 APOD 디버깅
  console.log('🔍 Puzzle Body:', puzzleBody);
  console.log('🔍 Image URL:', puzzleBody.image);
  console.log('🔍 Grid Size:', puzzleBody.gridSize);
  console.log('🔍 Puzzle Data:', puzzleData);
  
  // 퍼즐 판 설정 (puzzleBody 정의 후에 계산)
  const BOARD_SIZE = 500; // 고정된 퍼즐 판 크기
  const CANVAS_WIDTH = 800;
  const BOARD_OFFSET_X = (CANVAS_WIDTH - BOARD_SIZE) / 2; // 퍼즐판을 캔버스 중앙에 배치
  const BOARD_OFFSET_Y = 20;
  
  const TRAY_COLS = 8;
  const TRAY_VISIBLE_ROWS = 2;
  const TRAY_X = 10;
  const TRAY_Y = BOARD_OFFSET_Y + BOARD_SIZE + 40;
  const TRAY_WIDTH = CANVAS_WIDTH - 20;
  const TRAY_PIECE_SIZE = (TRAY_WIDTH - 100) / TRAY_COLS;
  const TRAY_HEIGHT = (TRAY_PIECE_SIZE + 15) * TRAY_VISIBLE_ROWS + 40;
  const CANVAS_HEIGHT = TRAY_Y + TRAY_HEIGHT + 20;
  
  // 스크롤 상태
  const trayScrollYRef = useRef(0);
  const totalTrayHeightRef = useRef(0);
  const isDraggingScrollBarRef = useRef(false);
  const lastMouseYRef = useRef(0);

  useEffect(() => {
    isLoadedRef.current = false;
    groupsRef.current = [];
    puzzleImageRef.current = null;
    completeRequestRef.current = false;
    setProgress(0);
    setTime(0);
  }, [nasaIdFromState]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchPuzzleData = async () => {
      setIsPuzzleLoading(true);
      setPuzzleError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        
        // APOD 퍼즐인 경우와 일반 퍼즐 구분
        const isApodPuzzle = celestialBody.isApod || nasaIdFromState === 'apod';
        
        let payload;
        if (isApodPuzzle) {
          // APOD 퍼즐: celestialBody에서 이미 전달된 데이터 사용
          // ApodInfo에서 이미 APOD 데이터를 가져왔으므로, 이를 활용
          payload = {
            nasaId: 'apod',
            title: celestialBody.name || 'APOD',
            imageUrl: celestialBody.image,
            puzzleType: 'jigsaw',
            difficulty: celestialBody.difficulty || '스페셜',
            gridSize: 7, // APOD 퍼즐은 7x7 고정
            rewardStars: 0, // APOD는 별 보상 없음, 우주 부품만 지급
            puzzleSeed: Date.now(), // 현재 시간으로 시드 생성
            puzzleConfig: {
              gridSize: 7, // APOD 퍼즐은 7x7 고정
              seed: Date.now(),
            }
          };
        } else {
          // 일반 퍼즐: 백엔드 API 호출
          const response = await fetch(
            `https://spacepuzzle.onrender.com/celestial-objects/${nasaIdFromState}/puzzle`,
            { headers, signal: controller.signal }
          );

          if (!response.ok) {
            throw new Error(`퍼즐 데이터를 불러오지 못했습니다. (${response.status})`);
          }

          payload = await response.json();
        }
        
        if (isMounted) {
          setPuzzleData(payload);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (isMounted) {
          setPuzzleError(error.message || '퍼즐 데이터를 불러오는 중 오류가 발생했습니다.');
          setPuzzleData(null);
        }
      } finally {
        if (isMounted) {
          setIsPuzzleLoading(false);
        }
      }
    };

    fetchPuzzleData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [nasaIdFromState]);

  const shouldShowLoading = isPuzzleLoading;
  const shouldShowError = Boolean(puzzleError);

  // 타이머
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // 퍼즐 초기화
  useEffect(() => {
    if (isPuzzleLoading || puzzleError) return;
    if (!canvasRef.current || isLoadedRef.current) return;
    if (!puzzleBody.image) {
      setPuzzleError('이미지 정보를 찾을 수 없습니다.');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gridSize = puzzleBody.gridSize;
    const rng = Number.isFinite(Number(puzzleSeed))
      ? createSeededRng(Number(puzzleSeed))
      : Math.random;

    // 이미지 로드
    const img = new Image();
    img.crossOrigin = 'anonymous';
    console.log('🖼️ 이미지 로드 시작:', puzzleBody.image);
    img.src = puzzleBody.image;
    
    img.onload = () => {
      console.log('✅ 이미지 로드 성공:', img.width, 'x', img.height);
      // 이미지를 정사각형으로 크롭하고 리사이즈
      const size = Math.min(img.width, img.height);
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;
      
      // 임시 캔버스 생성
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = BOARD_SIZE;
      tempCanvas.height = BOARD_SIZE;
      const tempCtx = tempCanvas.getContext('2d');
      
      // 정사각형으로 크롭하여 BOARD_SIZE로 리사이즈
      tempCtx.drawImage(
        img,
        offsetX, offsetY, size, size, // 소스 (크롭)
        0, 0, BOARD_SIZE, BOARD_SIZE   // 대상 (리사이즈)
      );
      
      // 리사이즈된 이미지를 사용
      puzzleImageRef.current = tempCanvas;
      isLoadedRef.current = true;
      
      // 퍼즐 조각 생성
      initializePuzzle(gridSize, rng);
      
      // 첫 렌더링
      renderPuzzle();
    };

    img.onerror = (error) => {
      console.error('❌ 이미지 로드 실패:', puzzleBody.image);
      console.error('❌ 에러 상세:', error);
      console.error('❌ APOD 여부:', celestialBody.isApod);
      alert('이미지를 불러올 수 없습니다. CORS 문제일 수 있습니다. 다시 시도해주세요.');
      navigate(celestialBody.isApod ? '/lobby' : '/gameplay');
    };
  }, [puzzleBody, isPuzzleLoading, puzzleError, puzzleSeed, navigate]);

  // 퍼즐 초기화 함수
  const initializePuzzle = (gridSize, rng) => {
    const pieces = [];
    const groups = [];
    const actualPieceSize = BOARD_SIZE / gridSize;

    // 1. 모든 조각 생성 (요철 패턴 결정)
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const edges = {
          top: row === 0 ? 0 : rng() > 0.5 ? 1 : -1,
          right: col === gridSize - 1 ? 0 : rng() > 0.5 ? 1 : -1,
          bottom: row === gridSize - 1 ? 0 : rng() > 0.5 ? 1 : -1,
          left: col === 0 ? 0 : rng() > 0.5 ? 1 : -1,
        };

        // 인접한 조각과 요철이 맞물리도록 조정
        if (row > 0) {
          const topPiece = pieces[(row - 1) * gridSize + col];
          edges.top = -topPiece.edges.bottom;
        }
        if (col > 0) {
          const leftPiece = pieces[row * gridSize + (col - 1)];
          edges.left = -leftPiece.edges.right;
        }

        const piece = new Piece(
          `piece-${row}-${col}`,
          col,
          row,
          edges,
          actualPieceSize
        );
        pieces.push(piece);
      }
    }

    // 2. 조각 섞기
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }

    // 3. 조각을 보관소에 그리드로 배치
    const spacing = 10;
    pieces.forEach((piece, index) => {
      const r = Math.floor(index / TRAY_COLS);
      const c = index % TRAY_COLS;
      const currentX = TRAY_X + 25 + c * (TRAY_PIECE_SIZE + spacing);
      const currentY = TRAY_Y + 20 + r * (TRAY_PIECE_SIZE + spacing);
      
      const group = new Group(piece, { x: currentX, y: currentY });
      groups.push(group);
    });

    // 전체 보관소 높이 계산
    totalTrayHeightRef.current = Math.ceil(pieces.length / TRAY_COLS) * (TRAY_PIECE_SIZE + spacing) + 40;
    
    groupsRef.current = groups;
  };

  // 둥근 모서리 사각형 그리기
  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
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
  };

  // 렌더링 함수
  const renderPuzzle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = puzzleImageRef.current;
    const actualPieceSize = BOARD_SIZE / puzzleBody.gridSize;

    // 배경 클리어
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1️⃣ 퍼즐 판 그리기 (반투명 실루엣 + 점선 테두리)
    ctx.save();
    ctx.strokeStyle = '#666';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.strokeRect(BOARD_OFFSET_X, BOARD_OFFSET_Y, BOARD_SIZE, BOARD_SIZE);
    ctx.setLineDash([]);
    
    // 실루엣 (매우 흐리게)
    if (img) {
      ctx.globalAlpha = 0.1;
      ctx.drawImage(img, BOARD_OFFSET_X, BOARD_OFFSET_Y, BOARD_SIZE, BOARD_SIZE);
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    // 2️⃣ 조각 보관소 배경 그리기
    ctx.fillStyle = '#1a1a1a';
    drawRoundedRect(ctx, TRAY_X, TRAY_Y, TRAY_WIDTH, TRAY_HEIGHT, 20);
    ctx.fill();

    // 3️⃣ 스크롤바 그리기
    const scrollTrackHeight = TRAY_HEIGHT - 40;
    const scrollRange = Math.max(0, totalTrayHeightRef.current - TRAY_HEIGHT);
    let thumbHeight = (TRAY_HEIGHT / totalTrayHeightRef.current) * scrollTrackHeight;
    thumbHeight = Math.min(scrollTrackHeight * 0.5, Math.max(30, thumbHeight));
    const thumbY = TRAY_Y + 20 + (scrollRange > 0 ? (-trayScrollYRef.current / scrollRange) * (scrollTrackHeight - thumbHeight) : 0);
    
    ctx.fillStyle = '#333';
    drawRoundedRect(ctx, TRAY_X + TRAY_WIDTH - 15, TRAY_Y + 20, 8, scrollTrackHeight, 4);
    ctx.fill();
    ctx.fillStyle = isDraggingScrollBarRef.current ? '#888' : '#555';
    drawRoundedRect(ctx, TRAY_X + TRAY_WIDTH - 15, thumbY, 8, thumbHeight, 4);
    ctx.fill();

    // 4️⃣ 보관소 클리핑 영역 설정
    ctx.save();
    const clipPath = new Path2D();
    clipPath.rect(TRAY_X, TRAY_Y, TRAY_WIDTH - 20, TRAY_HEIGHT);

    // 5️⃣ 모든 그룹의 조각들 그리기
    groupsRef.current.forEach((group) => {
      if (group.pieces.length === 0) return;

      const isInTrayArea = group.position.y > TRAY_Y - 50 && group !== draggedGroupRef.current;
      const scale = isInTrayArea ? TRAY_PIECE_SIZE / actualPieceSize : 1;
      const renderX = group.position.x;
      const renderY = isInTrayArea ? group.position.y + trayScrollYRef.current : group.position.y;

      if (isInTrayArea) {
        ctx.save();
        ctx.clip(clipPath);
      }

      // 그룹 내 조각들의 위치를 Set으로 저장 (외부 변 판단용)
      const groupPositions = new Set();
      group.pieces.forEach(p => {
        groupPositions.add(`${p.gridX},${p.gridY}`);
      });

      group.pieces.forEach((piece) => {
        const currentSize = piece.size * scale;
        const wx = renderX + piece.relativePos.x * scale;
        const wy = renderY + piece.relativePos.y * scale;

        // 화면 밖 컬링
        if (wy + currentSize < TRAY_Y || wy > TRAY_Y + TRAY_HEIGHT) {
          if (isInTrayArea) return;
        }

        ctx.save();
        drawPuzzleShape(ctx, wx, wy, currentSize, piece.edges);
        ctx.clip();

        // 이미지 그리기
        if (img) {
          ctx.drawImage(
            img,
            wx - (piece.gridX * currentSize),
            wy - (piece.gridY * currentSize),
            BOARD_SIZE * scale,
            BOARD_SIZE * scale
          );
        }

        ctx.restore();

        // 테두리 - 고정된 그룹은 그룹 외곽선만 연한 녹색으로
        ctx.beginPath();
        drawPuzzleShape(ctx, wx, wy, currentSize, piece.edges);
        ctx.lineWidth = 1.5;
        
        if (group.isLocked) {
          // 인접한 위치 확인 (같은 그룹에 속하는지)
          const hasTop = groupPositions.has(`${piece.gridX},${piece.gridY - 1}`);
          const hasRight = groupPositions.has(`${piece.gridX + 1},${piece.gridY}`);
          const hasBottom = groupPositions.has(`${piece.gridX},${piece.gridY + 1}`);
          const hasLeft = groupPositions.has(`${piece.gridX - 1},${piece.gridY}`);
          
          // 외부 변 확인: 인접한 조각이 그룹에 없거나 퍼즐 경계(edge === 0)인 경우
          const isOuterTop = !hasTop || piece.edges.top === 0;
          const isOuterRight = !hasRight || piece.edges.right === 0;
          const isOuterBottom = !hasBottom || piece.edges.bottom === 0;
          const isOuterLeft = !hasLeft || piece.edges.left === 0;
          
          const hasOuterEdge = isOuterTop || isOuterRight || isOuterBottom || isOuterLeft;
          
          if (hasOuterEdge) {
            ctx.strokeStyle = 'rgba(100, 255, 100, 0.15)'; // 아주 연한 녹색 (인지만 가능)
          } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)'; // 거의 안 보임 (내부 변)
          }
        } else if (group === draggedGroupRef.current) {
          ctx.strokeStyle = '#fff'; // 드래그 중: 흰색
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.3)'; // 일반: 연한 흰색
        }
        
        ctx.stroke();
      });

      if (isInTrayArea) ctx.restore();
    });

    ctx.restore();

    // 6️⃣ 드래그 중인 그룹을 맨 위에 그리기
    if (draggedGroupRef.current) {
      // 스냅 위치 확인 (자동 고정용, 시각적 프리뷰 없음)
      const snapPos = checkSnapPosition(draggedGroupRef.current);
      snapPositionRef.current = snapPos;

      // 실제 드래그 중인 조각 그리기
      draggedGroupRef.current.pieces.forEach((piece) => {
        const wx = draggedGroupRef.current.position.x + piece.relativePos.x;
        const wy = draggedGroupRef.current.position.y + piece.relativePos.y;

        ctx.save();
        drawPuzzleShape(ctx, wx, wy, piece.size, piece.edges);
        ctx.clip();

        if (img) {
          ctx.drawImage(
            img,
            wx - (piece.gridX * piece.size),
            wy - (piece.gridY * piece.size),
            BOARD_SIZE,
            BOARD_SIZE
          );
        }

        ctx.restore();

        // 드래그 중: 흰색 테두리
        ctx.beginPath();
        drawPuzzleShape(ctx, wx, wy, piece.size, piece.edges);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    } else {
      snapPositionRef.current = null;
    }

    // 진행률 계산: 고정된 조각 개수 기준
    const totalPieces = puzzleBody.gridSize * puzzleBody.gridSize;
    
    // 모든 그룹에서 고정된 조각 개수 세기
    let lockedPiecesCount = 0;
    groupsRef.current.forEach(group => {
      if (group.isLocked) {
        lockedPiecesCount += group.pieces.length;
      }
    });
    
    // 진행률: 고정된 조각 개수 / 전체 조각 개수 * 100
    const newProgress = totalPieces > 0 
      ? Math.round((lockedPiecesCount / totalPieces) * 100)
      : 0;
    setProgress(newProgress);

    // 완성 체크: 모든 조각이 고정되었을 때
    if (lockedPiecesCount === totalPieces && !completeRequestRef.current) {
      completeRequestRef.current = true;
      setProgress(100); // 확실하게 100%로 설정
      
      // 🌟 별 개수는 고정 (시간 무관)
      const isApodPuzzle = celestialBody.isApod || nasaIdFromState === 'apod';
      const starsEarned = isApodPuzzle ? 0 : getFixedStars();
      
      // 완료 처리 (별 저장 또는 우주 부품 지급)
      completePuzzle(starsEarned);
      
      setTimeout(() => {
        const mins = Math.floor(timeRef.current / 60);
        const secs = timeRef.current % 60;
        
        if (isApodPuzzle) {
          alert(`🎉 APOD 퍼즐 완성! 축하합니다!\n\n⏱️ 클리어 시간: ${mins}분 ${secs}초\n🔧 획득한 우주 부품: 1개`);
          navigate('/lobby');
        } else {
          alert(`🎉 퍼즐 완성! 축하합니다!\n\n⏱️ 클리어 시간: ${mins}분 ${secs}초\n⭐ 획득한 별: ${starsEarned}개`);
          navigate('/gameplay', {
            state: {
              sectorSlug: location.state?.sectorSlug,
              refreshKey: Date.now(),
            },
          });
        }
      }, 500);
    }
  };

  // 🌟 별 개수는 천체마다 고정 (시간에 무관)
  const getFixedStars = () => {
    // celestialBody의 rewardStars 사용 (없으면 기본값 3)
    return celestialBody.rewardStars || 3;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleGiveUp = () => {
    if (window.confirm('정말 포기하시겠습니까?')) {
      navigate('/gameplay');
    }
  };

  const handleHint = () => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };

  const completePuzzle = async (starsEarned) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        // 게스트 모드: localStorage에 별 저장
        console.log('게스트 모드: 퍼즐 완료 처리 시작');
        const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"stars": 0, "credits": 20, "spaceParts": 0}');
        
        const isApodPuzzle = celestialBody.isApod || nasaIdFromState === 'apod';
        
        // 🔧 이미 클리어한 천체인지 확인 (중복 방지)
        const guestCleared = JSON.parse(localStorage.getItem('guestClearedCelestials') || '[]');
        const alreadyCleared = guestCleared.find(c => c.id === celestialBody.id);
        
        if (alreadyCleared && !isApodPuzzle) {
          console.log(`⚠️ 이미 클리어한 천체 (${celestialBody.name}) - 별 추가 안함`);
          return { starsEarned: 0, spaceParts: 0 }; // 중복 클리어
        }
        
        // APOD 퍼즐인 경우 우주 부품만 추가 (별 없음)
        if (isApodPuzzle) {
          guestStats.spaceParts = (guestStats.spaceParts || 0) + 1;
          console.log(`🎁 APOD 퍼즐 보너스: 우주 부품 1개 추가!`);
          console.log(`   총 우주 부품: ${guestStats.spaceParts}`);
          localStorage.setItem('guestStats', JSON.stringify(guestStats));
          return { starsEarned: 0, spaceParts: 1 };
        } else {
          // 일반 퍼즐: 별 추가
          guestStats.stars = (guestStats.stars || 0) + starsEarned;
          console.log(`✅ 게스트 모드: ${starsEarned}개의 별 획득! 총 별: ${guestStats.stars}`);
          localStorage.setItem('guestStats', JSON.stringify(guestStats));
          
          // 클리어 기록 저장
          const clearedRecord = {
            id: celestialBody.id,
            name: celestialBody.name,
            nameEn: celestialBody.nameEn,
            image: celestialBody.image,
            starsEarned: starsEarned,
            clearedAt: new Date().toISOString(),
            playTime: timeRef.current,
          };
          guestCleared.push(clearedRecord);
          localStorage.setItem('guestClearedCelestials', JSON.stringify(guestCleared));
          console.log(`✅ 클리어 기록 저장:`, clearedRecord);
          
          return { starsEarned: starsEarned, spaceParts: 0 };
        }
        
        // return 추가 (실행되지 않지만 안전을 위해)
      }

      // 로그인 모드: 백엔드에 완료 요청
      const isApodPuzzle = celestialBody.isApod || nasaIdFromState === 'apod';
      
      let requestUrl, requestBody;
      if (isApodPuzzle) {
        // APOD 퍼즐 완료 API
        requestUrl = `https://spacepuzzle.onrender.com/celestial-objects/apod/complete`;
        requestBody = {
          playTime: timeRef.current,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
          title: celestialBody.name || 'APOD'
        };
      } else {
        // 일반 퍼즐 완료 API
        requestUrl = `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(nasaIdFromState)}/complete`;
        requestBody = { playTime: timeRef.current };
      }
      
      console.log('📡 백엔드 완료 요청 시작:');
      console.log('  - URL:', requestUrl);
      console.log('  - 퍼즐 타입:', isApodPuzzle ? 'APOD' : '일반');
      console.log('  - 천체 ID:', nasaIdFromState);
      console.log('  - 플레이 시간:', timeRef.current, '초');
      console.log('  - 예상 별:', starsEarned, '개');
      console.log('  - 요청 Body:', JSON.stringify(requestBody));
      console.log('  - 토큰:', accessToken ? '✅ 있음' : '❌ 없음');
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 백엔드 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        // 🔧 에러 응답의 상세 내용 확인
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = JSON.stringify(errorData);
          console.error('❌ 백엔드 에러 응답:', errorData);
        } catch (e) {
          const errorText = await response.text();
          errorDetail = errorText;
          console.error('❌ 백엔드 에러 텍스트:', errorText);
        }
        throw new Error(`퍼즐 완료 처리가 실패했습니다. (${response.status})\n상세: ${errorDetail}`);
      }

      const data = await response.json();
      console.log('✅ 퍼즐 완료 처리 성공:', data);
      
      // 백엔드 응답에서 받은 별 개수를 localStorage에도 저장 (캐싱용)
      if (data.totalStars !== undefined) {
        const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"stars": 0, "credits": 20, "spaceParts": 0}');
        guestStats.stars = data.totalStars;
        localStorage.setItem('guestStats', JSON.stringify(guestStats));
      }
      
      // 실제로 지급된 보상 반환
      return {
        starsEarned: data.data?.starsEarned || 0,
        spaceParts: data.data?.rewardParts || 0,
      };
    } catch (error) {
      console.error('퍼즐 완료 처리 실패:', error);
      return { starsEarned: 0, spaceParts: 0 };
    }
  };

  // 스냅 위치 계산 (드래그 중 프리뷰용)
  const snapPositionRef = useRef(null);

  // 정확한 위치에 가까운지 확인하고 스냅 위치 반환
  const checkSnapPosition = (group) => {
    if (!group || group.pieces.length === 0) return null;
    
    // 그룹의 모든 조각이 올바른 위치 근처에 있는지 확인
    let maxDistance = 0;
    let minPieceSize = Infinity;
    
    for (const piece of group.pieces) {
      const wx = group.position.x + piece.relativePos.x;
      const wy = group.position.y + piece.relativePos.y;
      
      // 각 조각의 정답 위치
      const targetX = BOARD_OFFSET_X + piece.gridX * piece.size;
      const targetY = BOARD_OFFSET_Y + piece.gridY * piece.size;
      
      // 현재 위치와 정답 위치의 거리
      const distance = Math.sqrt(Math.pow(wx - targetX, 2) + Math.pow(wy - targetY, 2));
      maxDistance = Math.max(maxDistance, distance);
      minPieceSize = Math.min(minPieceSize, piece.size);
    }
    
    // 조각 크기의 8% 이내면 스냅 가능 (상대적 거리)
    // 모든 조각이 이 범위 내에 있어야 함!
    // 3x3: 166 * 0.08 = 13.3px
    // 5x5: 100 * 0.08 = 8px
    // 7x7: 71 * 0.08 = 5.7px
    const snapThreshold = minPieceSize * 0.08;
    
    if (maxDistance < snapThreshold) {
      return {
        x: BOARD_OFFSET_X,
        y: BOARD_OFFSET_Y,
        canSnap: true,
        distance: maxDistance,
        threshold: snapThreshold
      };
    }
    
    return {
      distance: maxDistance,
      threshold: snapThreshold,
      canSnap: false
    };
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e) => {
    if (isPaused) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 스크롤바 드래그 체크
    if (mouseX >= TRAY_X + TRAY_WIDTH - 25 && mouseY >= TRAY_Y && mouseY <= TRAY_Y + TRAY_HEIGHT) {
      isDraggingScrollBarRef.current = true;
      lastMouseYRef.current = mouseY;
      return;
    }

    // 클릭한 위치에 있는 그룹 찾기 (역순으로 검색 - 위에 있는 조각 우선)
    const actualPieceSize = BOARD_SIZE / puzzleBody.gridSize;
    
    for (let i = groupsRef.current.length - 1; i >= 0; i--) {
      const group = groupsRef.current[i];
      if (group.pieces.length === 0) continue;
      
      // 🔒 고정된 그룹은 드래그 불가
      if (group.isLocked) {
        console.log('🔒 고정된 조각은 이동 불가:', group.pieces.map(p => `(${p.gridX},${p.gridY})`).join(', '));
        continue;
      }

      const isInTray = group.position.y > TRAY_Y - 50;
      const scale = isInTray ? TRAY_PIECE_SIZE / actualPieceSize : 1;
      
      const renderX = group.position.x;
      const renderY = isInTray ? group.position.y + trayScrollYRef.current : group.position.y;
      
      // 그룹의 경계 상자(Bounding Box) 계산
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      group.pieces.forEach(p => {
        const px = renderX + p.relativePos.x * scale;
        const py = renderY + p.relativePos.y * scale;
        const pSize = p.size * scale;
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px + pSize);
        maxY = Math.max(maxY, py + pSize);
      });

      // 경계 상자 내부 체크 (여유 공간 추가)
      const padding = 10; // 클릭 영역 확장
      if (mouseX >= minX - padding && mouseX <= maxX + padding &&
          mouseY >= minY - padding && mouseY <= maxY + padding) {
        
        console.log('🖱️ 클릭 감지:', {
          pieces: group.pieces.map(p => `(${p.gridX},${p.gridY})`).join(', '),
          position: `(${Math.round(group.position.x)}, ${Math.round(group.position.y)})`,
          isInTray: isInTray
        });
        
        draggedGroupRef.current = group;
        
        // 보관소에서 꺼낼 때 실제 위치로 설정 (스크롤 보정 제거)
        // renderY는 이미 스크롤 오프셋이 적용된 위치이므로
        // 드래그 시작 시 별도의 오프셋 적용 불필요
        
        dragOffsetRef.current = {
          x: mouseX - renderX,
          y: mouseY - renderY,
        };

        // 드래그 중인 그룹을 맨 위로
        groupsRef.current.splice(i, 1);
        groupsRef.current.push(group);
        renderPuzzle();
        return;
      }
    }
    
    console.log('❌ 클릭 실패: 아무 조각도 감지되지 않음', { mouseX, mouseY });
  };

  const handleMouseMove = (e) => {
    if (isPaused) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedGroupRef.current) {
      const group = draggedGroupRef.current;
      
      // 새 위치 계산
      let newX = mouseX - dragOffsetRef.current.x;
      let newY = mouseY - dragOffsetRef.current.y;
      
      // 그룹의 경계 계산
      let minRelX = Infinity, minRelY = Infinity, maxRelX = -Infinity, maxRelY = -Infinity;
      group.pieces.forEach(p => {
        minRelX = Math.min(minRelX, p.relativePos.x);
        minRelY = Math.min(minRelY, p.relativePos.y);
        maxRelX = Math.max(maxRelX, p.relativePos.x + p.size);
        maxRelY = Math.max(maxRelY, p.relativePos.y + p.size);
      });
      
      // 캔버스 영역 제한 (조각의 50%까지 밖으로 나갈 수 있음)
      const pieceSize = group.pieces[0].size;
      const allowedOutside = pieceSize * 0.5;
      
      const minX = -minRelX - allowedOutside;
      const maxX = CANVAS_WIDTH - maxRelX + allowedOutside;
      const minY = -minRelY - allowedOutside;
      const maxY = CANVAS_HEIGHT - maxRelY + allowedOutside;
      
      // 경계 내로 제한
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      
      group.position.x = newX;
      group.position.y = newY;
      renderPuzzle();
    } else if (isDraggingScrollBarRef.current) {
      const deltaY = mouseY - lastMouseYRef.current;
      const scrollTrackHeight = TRAY_HEIGHT - 40;
      
      let thumbHeight = (TRAY_HEIGHT / totalTrayHeightRef.current) * scrollTrackHeight;
      thumbHeight = Math.min(scrollTrackHeight * 0.5, Math.max(30, thumbHeight));
      
      const scrollRange = Math.max(0, totalTrayHeightRef.current - TRAY_HEIGHT);
      const usableTrackHeight = scrollTrackHeight - thumbHeight;

      if (scrollRange > 0 && usableTrackHeight > 0) {
        trayScrollYRef.current -= (deltaY / usableTrackHeight) * scrollRange;
        trayScrollYRef.current = Math.max(-scrollRange, Math.min(0, trayScrollYRef.current));
      }
      
      lastMouseYRef.current = mouseY;
      renderPuzzle();
    }
  };

  const handleMouseUp = () => {
    if (isPaused) return;

    if (draggedGroupRef.current) {
      const activeGroup = draggedGroupRef.current;
      
      // 1️⃣ 다른 그룹과 병합 시도 (먼저 실행)
      let mergedAny = true;
      while (mergedAny) {
        mergedAny = false;
        for (const targetGroup of groupsRef.current) {
          if (targetGroup === activeGroup || targetGroup.pieces.length === 0) continue;
          
          if (PuzzleEngine.tryMerge(activeGroup, targetGroup)) {
            console.log('🔗 병합 성공:', activeGroup.pieces.map(p => `(${p.gridX},${p.gridY})`).join(', '));
            mergedAny = true;
            if (targetGroup.isLocked) {
              draggedGroupRef.current = null;
              mergedAny = false;
              break;
            }
          }
        }
        if (!draggedGroupRef.current) break;
      }
      
      // 2️⃣ 병합 후, 퍼즐 판에 가까우면 자동으로 정확한 위치로 이동 후 고정
      if (activeGroup && !activeGroup.isLocked) {
        const snapPos = checkSnapPosition(activeGroup);
        if (snapPos && snapPos.canSnap) {
          console.log('📍 스냅 성공!', {
            pieces: activeGroup.pieces.map(p => `(${p.gridX},${p.gridY})`).join(', '),
            maxDistance: Math.round(snapPos.distance) + 'px',
            threshold: Math.round(snapPos.threshold) + 'px'
          });
          
          // 정확한 위치로 자동 이동!
          activeGroup.position.x = snapPos.x;
          activeGroup.position.y = snapPos.y;
          activeGroup.pieces.forEach(p => {
            p.relativePos.x = p.gridX * p.size;
            p.relativePos.y = p.gridY * p.size;
          });
          activeGroup.lock();
          console.log('✅ 자동 고정 완료!');
        } else if (snapPos && !snapPos.canSnap) {
          console.log('❌ 스냅 실패 (거리 초과):', {
            pieces: activeGroup.pieces.map(p => `(${p.gridX},${p.gridY})`).join(', '),
            maxDistance: Math.round(snapPos.distance) + 'px',
            threshold: Math.round(snapPos.threshold) + 'px',
            diff: '+' + Math.round(snapPos.distance - snapPos.threshold) + 'px'
          });
        }
      }
    }

    // 빈 그룹 제거
    groupsRef.current = groupsRef.current.filter(g => g.pieces.length > 0);

    draggedGroupRef.current = null;
    isDraggingScrollBarRef.current = false;
    snapPositionRef.current = null;
    renderPuzzle();
  };

  // Canvas 이벤트 리스너 등록
  useEffect(() => {
    if (shouldShowLoading || shouldShowError) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPaused, shouldShowLoading, shouldShowError]);

  // 렌더링 루프 (드래그 중 부드러운 업데이트)
  useEffect(() => {
    if (!isPaused && isLoadedRef.current) {
      const interval = setInterval(() => {
        renderPuzzle();
      }, 16); // 약 60 FPS
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {shouldShowLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <p className="pixel-font text-xl text-gray-300">퍼즐 데이터를 불러오는 중...</p>
        </div>
      ) : shouldShowError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <p className="pixel-font text-xl text-red-400 mb-4">퍼즐을 불러오지 못했습니다</p>
            <p className="text-sm text-gray-400 mb-6">{puzzleError}</p>
            <button
              type="button"
              onClick={() => navigate('/gameplay')}
              className="pixel-font text-lg bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-all"
            >
              돌아가기
            </button>
          </div>
        </div>
      ) : (
        <>
      {/* 우주 배경 - 진행률에 따라 밝아짐 */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `linear-gradient(to bottom, 
            rgb(${30 + progress}, ${20 + progress}, ${80 + progress}), 
            rgb(${10 + progress * 0.5}, ${0 + progress * 0.5}, ${30 + progress * 0.5}))`,
        }}
      >
        {/* 별들 */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}

        {/* 별똥별 */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`meteor-${i}`}
            className="absolute w-1 h-20 bg-gradient-to-b from-white to-transparent animate-pulse"
            style={{
              top: Math.random() * 50 + '%',
              left: Math.random() * 100 + '%',
              transform: 'rotate(45deg)',
              animation: `fall 3s linear infinite`,
              animationDelay: i * 1 + 's',
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* 상단 UI */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
        {/* 왼쪽: 게임 정보 + 타이머 + 진행률 */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => navigate(celestialBody.isApod ? '/lobby' : '/gameplay')}
            className="bg-gray-900 bg-opacity-80 hover:bg-opacity-100 rounded-lg px-4 py-2 border border-gray-600 hover:border-blue-400 transition-all"
          >
            <p className="pixel-font text-white">← 돌아가기</p>
          </button>
          
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-blue-500">
            <p className="pixel-font text-white text-lg">{puzzleBody.name}</p>
          </div>
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-yellow-500">
            <p className="pixel-font text-yellow-400">난이도: {puzzleBody.difficulty}</p>
          </div>
          
          {/* 타이머 */}
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-green-500">
            <p className="pixel-font text-green-400 text-lg">⏱ {formatTime(time)}</p>
          </div>
          
          {/* 진행률 */}
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-purple-500 min-w-[200px]">
            <p className="pixel-font text-purple-400 mb-2">진행률: {progress}%</p>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 오른쪽: 컨트롤 버튼 */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={handleHint}
            className="bg-yellow-600 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-yellow-400 pixel-font"
          >
            💡 힌트
          </button>
          <button
            onClick={handlePause}
            className="bg-blue-600 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-blue-400 pixel-font"
          >
            {isPaused ? '▶ 재개' : '⏸ 일시정지'}
          </button>
          <button
            onClick={handleGiveUp}
            className="bg-red-600 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-red-400 pixel-font"
          >
            🏳 포기
          </button>
        </div>
      </div>

      {/* 중앙: 퍼즐 영역 */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative flex flex-col items-center">
          {/* 힌트 오버레이 */}
          {showHint && puzzleImageRef.current && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-90 rounded-lg">
              <div className="text-center">
                <p className="pixel-font text-yellow-400 text-xl mb-4">💡 힌트: 완성된 이미지</p>
                <canvas
                  ref={(el) => {
                    if (el && puzzleImageRef.current) {
                      const ctx = el.getContext('2d');
                      ctx.drawImage(puzzleImageRef.current, 0, 0, BOARD_SIZE, BOARD_SIZE);
                    }
                  }}
                  width={BOARD_SIZE}
                  height={BOARD_SIZE}
                  className="border-4 border-yellow-400 rounded-lg mx-auto"
                />
              </div>
            </div>
          )}

          {/* Canvas 퍼즐판 */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="bg-gray-900 bg-opacity-30 rounded-lg border-4 border-blue-500 cursor-grab active:cursor-grabbing shadow-2xl"
            style={{
              imageRendering: 'auto',
            }}
          />

          {/* 안내 문구 */}
          <div className="text-center text-white mt-4 pixel-font space-y-1">
            <p className="text-lg">🧩 위쪽: 퍼즐 판 | 아래쪽: 조각 보관소</p>
            <p className="text-sm text-gray-300">조각을 드래그해서 원래 위치에 가까이 가져다 놓으면 자동으로 붙습니다!</p>
          </div>
        </div>
      </div>

      {/* 일시정지 오버레이 */}
      {isPaused && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center">
            <p className="pixel-font text-white text-5xl mb-8">⏸ 일시정지</p>
            <button
              onClick={handlePause}
              className="pixel-font text-2xl bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-lg transition-all"
            >
              ▶ 게임 재개
            </button>
          </div>
        </div>
      )}

          <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) translateX(0) rotate(45deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(100vh) translateX(-100px) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
        </>
      )}
    </div>
  );
};

export default PuzzleGame;