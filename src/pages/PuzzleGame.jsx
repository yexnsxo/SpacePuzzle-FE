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
  
  const PIECE_SIZE = 120;
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;

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
        const response = await fetch(
          `https://spacepuzzle.onrender.com/celestial-objects/${nasaIdFromState}/puzzle`,
          { headers, signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`퍼즐 데이터를 불러오지 못했습니다. (${response.status})`);
        }

        const payload = await response.json();
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
    img.src = puzzleBody.image;
    
    img.onload = () => {
      // 이미지를 정사각형으로 크롭하고 리사이즈
      const size = Math.min(img.width, img.height);
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;
      
      // 임시 캔버스 생성
      const tempCanvas = document.createElement('canvas');
      const puzzleSize = gridSize * PIECE_SIZE;
      tempCanvas.width = puzzleSize;
      tempCanvas.height = puzzleSize;
      const tempCtx = tempCanvas.getContext('2d');
      
      // 정사각형으로 크롭하여 리사이즈
      tempCtx.drawImage(
        img,
        offsetX, offsetY, size, size, // 소스 (크롭)
        0, 0, puzzleSize, puzzleSize   // 대상 (리사이즈)
      );
      
      // 리사이즈된 이미지를 사용
      puzzleImageRef.current = tempCanvas;
      isLoadedRef.current = true;
      
      // 퍼즐 조각 생성
      initializePuzzle(gridSize, rng);
      
      // 첫 렌더링
      renderPuzzle();
    };

    img.onerror = () => {
      console.error('이미지 로드 실패:', puzzleBody.image);
      alert('이미지를 불러올 수 없습니다. 다시 시도해주세요.');
      navigate('/gameplay');
    };
  }, [puzzleBody, isPuzzleLoading, puzzleError, puzzleSeed, navigate]);

  // 퍼즐 초기화 함수
  const initializePuzzle = (gridSize, rng) => {
    const pieces = [];
    const groups = [];

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
          PIECE_SIZE
        );
        pieces.push(piece);
      }
    }

    // 2. 각 조각을 개별 그룹으로 만들고 무작위로 배치
    const trayX = 50;
    const trayY = CANVAS_HEIGHT - 200;
    const trayWidth = CANVAS_WIDTH - 100;

    pieces.forEach((piece, idx) => {
      const randomX = trayX + rng() * (trayWidth - PIECE_SIZE);
      const randomY = trayY + rng() * 80;
      
      const group = new Group(piece, { x: randomX, y: randomY });
      groups.push(group);
    });

    groupsRef.current = groups;
  };

  // 렌더링 함수
  const renderPuzzle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = puzzleImageRef.current;

    // 배경 클리어
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 모든 그룹의 조각들 그리기
    groupsRef.current.forEach((group) => {
      if (group.pieces.length === 0) return;

      group.pieces.forEach((piece) => {
        const worldX = group.position.x + piece.relativePos.x;
        const worldY = group.position.y + piece.relativePos.y;

        // 요철 크기 계산
        const tabSize = PIECE_SIZE * 0.15;

        ctx.save();
        
        // 퍼즐 모양으로 클리핑
        drawPuzzleShape(ctx, worldX, worldY, PIECE_SIZE, piece.edges);
        ctx.clip();

        // 이미지 그리기 - 요철 영역까지 포함
        if (img) {
          // 소스 이미지의 조각 위치
          const srcX = piece.gridX * PIECE_SIZE;
          const srcY = piece.gridY * PIECE_SIZE;
          
          // 요철 확장을 고려한 소스 영역
          const srcExtendX = srcX - tabSize;
          const srcExtendY = srcY - tabSize;
          const srcExtendSize = PIECE_SIZE + tabSize * 2;
          
          // 그릴 위치도 확장
          const destX = worldX - tabSize;
          const destY = worldY - tabSize;
          const destSize = PIECE_SIZE + tabSize * 2;
          
          ctx.drawImage(
            img,
            srcExtendX, srcExtendY, srcExtendSize, srcExtendSize, // 소스 (확장)
            destX, destY, destSize, destSize // 목적지 (확장)
          );
        }

        ctx.restore();

        // 퍼즐 테두리
        ctx.save();
        drawPuzzleShape(ctx, worldX, worldY, PIECE_SIZE, piece.edges);
        ctx.strokeStyle = group.isLocked ? '#00ff00' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });
    });

    // 진행률 계산
    const totalPieces = puzzleBody.gridSize * puzzleBody.gridSize;
    const mergedPieces = groupsRef.current.filter(g => g.pieces.length > 0).length;
    const newProgress = Math.round(((totalPieces - mergedPieces + 1) / totalPieces) * 100);
    setProgress(newProgress);

    // 완성 체크
    if (mergedPieces === 1 && !completeRequestRef.current) {
      completeRequestRef.current = true;
      completePuzzle().then(() => {
        setTimeout(() => {
          alert('🎉 퍼즐 완성! 축하합니다!');
          navigate('/gameplay', {
            state: {
              sectorSlug: location.state?.sectorSlug,
              refreshKey: Date.now(),
            },
          });
        }, 500);
      });
    }
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

  const completePuzzle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(
        `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(nasaIdFromState)}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ playTime: timeRef.current }),
        }
      );

      if (!response.ok) {
        throw new Error(`퍼즐 완료 처리가 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('퍼즐 완료 처리 실패:', error);
    }
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e) => {
    if (isPaused) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 클릭한 위치에 있는 그룹 찾기 (역순으로 검색 - 위에 있는 조각 우선)
    for (let i = groupsRef.current.length - 1; i >= 0; i--) {
      const group = groupsRef.current[i];
      if (group.pieces.length === 0 || group.isLocked) continue;

      if (group.isPointInside(mouseX, mouseY)) {
        draggedGroupRef.current = group;
        dragOffsetRef.current = {
          x: mouseX - group.position.x,
          y: mouseY - group.position.y,
        };

        // 드래그 중인 그룹을 맨 위로
        groupsRef.current.splice(i, 1);
        groupsRef.current.push(group);
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedGroupRef.current || isPaused) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    draggedGroupRef.current.position.x = mouseX - dragOffsetRef.current.x;
    draggedGroupRef.current.position.y = mouseY - dragOffsetRef.current.y;

    renderPuzzle();
  };

  const handleMouseUp = () => {
    if (!draggedGroupRef.current || isPaused) return;

    const activeGroup = draggedGroupRef.current;
    let merged = false;

    // 다른 그룹과 병합 시도
    for (const targetGroup of groupsRef.current) {
      if (targetGroup === activeGroup || targetGroup.pieces.length === 0) continue;

      if (PuzzleEngine.tryMerge(activeGroup, targetGroup)) {
        merged = true;
        break;
      }
    }

    // 빈 그룹 제거
    groupsRef.current = groupsRef.current.filter(g => g.pieces.length > 0);

    draggedGroupRef.current = null;
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
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start">
        {/* 왼쪽: 게임 정보 */}
        <div className="flex flex-col gap-2">
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-blue-500">
            <p className="pixel-font text-white text-lg">{puzzleBody.name}</p>
          </div>
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-yellow-500">
            <p className="pixel-font text-yellow-400">난이도: {puzzleBody.difficulty}</p>
          </div>
        </div>

        {/* 중앙: 타이머 & 진행률 */}
        <div className="flex flex-col items-center gap-2">
          {/* 타이머 */}
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-6 py-3 border border-green-500">
            <p className="pixel-font text-green-400 text-2xl">⏱ {formatTime(time)}</p>
          </div>
          
          {/* 진행률 */}
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-6 py-3 border border-purple-500 min-w-[200px]">
            <p className="pixel-font text-purple-400 text-center mb-2">진행률: {progress}%</p>
            <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 오른쪽: 컨트롤 버튼 */}
        <div className="flex flex-col gap-2">
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
        <div className="relative">
          {/* 힌트 오버레이 */}
          {showHint && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-70 rounded-lg">
              <p className="pixel-font text-yellow-400 text-2xl">💡 완성된 이미지를 잠시 보여줍니다...</p>
            </div>
          )}

          {/* Canvas 퍼즐판 */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="bg-gray-900 bg-opacity-50 rounded-lg border-4 border-blue-500 cursor-grab active:cursor-grabbing"
            style={{
              imageRendering: 'pixelated',
            }}
          />

          {/* 퍼즐판 아래 설명 */}
          <p className="text-center text-white mt-4 pixel-font">
            퍼즐 조각을 드래그하여 완성하세요
          </p>
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
