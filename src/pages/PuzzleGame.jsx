import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Piece } from '../game/puzzle/Piece';
import { Group } from '../game/puzzle/Group';
import { PuzzleEngine } from '../game/puzzle/PuzzleEngine';
import { drawPuzzleShape } from '../game/puzzle/utils';
import { supabase } from '../supabaseClient';
import Phaser from 'phaser';
import { getSectorColors } from '../utils/sectorColors';
import { getGuestStats, setGuestStats, getGuestClearedCelestials, setGuestClearedCelestials, getPuzzleSave, setPuzzleSave } from '../utils/guestStorage';

// 버튼 이미지 import
import pauseButton from '../assets/game-ui/pause-button.png';
import pauseButtonPressed from '../assets/game-ui/pause-button-pressed.png';
import resumeButton from '../assets/game-ui/resume-button.png';
import resumeButtonPressed from '../assets/game-ui/resume-button-pressed.png';
import hintButton from '../assets/game-ui/hint-button.png';
import hintButtonPressed from '../assets/game-ui/hint-button-pressed.png';
import giveupButton from '../assets/game-ui/giveup-button.png';
import giveupButtonPressed from '../assets/game-ui/giveup-button-pressed.png';

const createSeededRng = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const SECTOR_SLUGS = {
  'solar-system': 'solar-system',
  '태양계': 'solar-system',
  'exoplanet-systems': 'exoplanet-systems',
  'exo-systems': 'exoplanet-systems',
  '외계 행성계': 'exoplanet-systems',
  'nebulae': 'nebulae',
  '성운': 'nebulae',
  'galaxies': 'galaxies',
  '은하': 'galaxies',
  'deep-space-extremes': 'deep-space-extremes',
  '우주의 심연': 'deep-space-extremes',
};

const resolveSectorSlug = (value) => {
  if (!value || typeof value !== 'string') {
    return 'solar-system';
  }
  return SECTOR_SLUGS[value] || 'solar-system';
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

  // 섹터 정보 및 색상
  const sectorSlug = resolveSectorSlug(
    location.state?.sectorSlug
      || location.state?.celestialBody?.sectorSlug
      || celestialBody.sectorSlug
      || location.state?.celestialBody?.sector
      || celestialBody.sector
  );
  const sectorColors = getSectorColors(sectorSlug);

  const [puzzleData, setPuzzleData] = useState(null);
  const [isPuzzleLoading, setIsPuzzleLoading] = useState(true);
  const [puzzleError, setPuzzleError] = useState(null);
  const [continuousStars, setContinuousStars] = useState([]); // 로딩 중 계속 생성되는 별들

  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const timeRef = useRef(0);
  const [hasSavedState, setHasSavedState] = useState(false);
  const saveIntervalRef = useRef(null);
  
  // 버튼 클릭 상태 (눌렀을 때 이미지 변경용)
  const [isPauseButtonPressed, setIsPauseButtonPressed] = useState(false);
  const [isHintButtonPressed, setIsHintButtonPressed] = useState(false);
  const [isGiveUpButtonPressed, setIsGiveUpButtonPressed] = useState(false);
  
  // 클릭 가능한 영역 체크 함수 (200x200 이미지 기준)
  const isClickableArea = (event, buttonElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 이미지 크기에 맞게 스케일 조정
    const scaleX = 200 / rect.width;
    const scaleY = 200 / rect.height;
    const normalizedX = x * scaleX;
    const normalizedY = y * scaleY;
    
    // 세로: 중앙 36px (82 ~ 118)
    const isVerticalValid = normalizedY >= 82 && normalizedY <= 118;
    
    // 가로: 왼쪽 108px (0 ~ 108) 또는 오른쪽 108px (92 ~ 200)
    const isHorizontalValid = 
      (normalizedX >= 0 && normalizedX <= 108) || 
      (normalizedX >= 92 && normalizedX <= 200);
    
    return isVerticalValid && isHorizontalValid;
  };
  
  
  // 퍼즐 게임 상태
  const groupsRef = useRef([]);
  const draggedGroupRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const puzzleImageRef = useRef(null);
  const isLoadedRef = useRef(false);
  const completeRequestRef = useRef(false);
  
  // 물리 효과를 위한 속성
  const groupPhysicsRef = useRef(new Map()); // groupId -> {vx, vy}
  const dragStartPosRef = useRef({ x: 0, y: 0, time: 0 }); // 드래그 시작 위치
  
  // 별 배경을 한 번만 생성 (렌더링마다 재생성 방지)
  const stars = useMemo(() => {
    return [...Array(150)].map(() => {
      const isTwinkling = Math.random() > 0.7; // 30% 확률로 반짝임
      return {
        width: isTwinkling ? Math.random() * 3 + 2 : Math.random() * 2 + 1,
        height: isTwinkling ? Math.random() * 3 + 2 : Math.random() * 2 + 1,
        top: Math.random() * 100,
        left: Math.random() * 100,
        opacity: isTwinkling ? 0.3 : Math.random() * 0.5 + 0.3,
        isTwinkling,
        animationDelay: Math.random() * 3,
      };
    });
  }, []); // 빈 의존성 배열 = 컴포넌트 마운트 시 한 번만 실행
  
  // UI 요소들의 무중력 효과를 위한 상태
  const [uiFloatOffsets, setUiFloatOffsets] = useState({
    backButton: { x: 0, y: 0 },
    nameBox: { x: 0, y: 0 },
    difficultyBox: { x: 0, y: 0 },
    timerBox: { x: 0, y: 0 },
    progressBox: { x: 0, y: 0 },
    hintButton: { x: 0, y: 0 },
    pauseButton: { x: 0, y: 0 },
    giveUpButton: { x: 0, y: 0 },
  });

  const nasaIdFromState = location.state?.nasaId
    || celestialBody.nasaId
    || (typeof celestialBody.nameEn === 'string' ? celestialBody.nameEn.toLowerCase() : null)
    || 'earth';

  const puzzleSeed = puzzleData?.puzzleConfig?.seed ?? puzzleData?.puzzleSeed;
  
  // useMemo로 puzzleBody 메모이제이션하여 무한 루프 방지
  const puzzleBody = useMemo(() => ({
    ...celestialBody,
    gridSize: puzzleData?.puzzleConfig?.gridSize ?? puzzleData?.gridSize ?? celestialBody.gridSize,
    image: puzzleData?.imageUrl ?? celestialBody.image,
    difficulty: puzzleData?.difficulty ?? celestialBody.difficulty,
  }), [
    celestialBody,
    puzzleData?.puzzleConfig?.gridSize,
    puzzleData?.gridSize,
    puzzleData?.imageUrl,
    puzzleData?.difficulty,
  ]);
  
  // 난이도를 별 개수로 변환 (실제 보상 별 개수 사용)
  const getDifficultyStars = () => {
    // APOD 퍼즐인 경우 별 없음
    const isApodPuzzle = celestialBody.isApod || nasaIdFromState === 'apod';
    if (isApodPuzzle) {
      return '🔧'; // 우주 부품 아이콘
    }
    
    // puzzleData에서 rewardStars 가져오기, 없으면 celestialBody에서
    const starCount = puzzleData?.rewardStars ?? celestialBody.rewardStars ?? 2;
    return '⭐'.repeat(starCount);
  };
  
  // 화면 전체 크기를 캔버스로 사용
  const CANVAS_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const CANVAS_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 1080;
  
  // 퍼즐 판 설정 (화면 중앙 상단에 배치)
  const BOARD_SIZE = 500; // 고정된 퍼즐 판 크기
  const BOARD_OFFSET_X = (CANVAS_WIDTH - BOARD_SIZE) / 2; // 퍼즐판을 화면 중앙에 배치
  const BOARD_OFFSET_Y = 20;
  
  // 보관소 설정 (화면 하단 중앙에 배치)
  const TRAY_COLS = 8; // 열 개수 감소 (10 → 8) - 조각을 더 크게
  const TRAY_VISIBLE_ROWS = 2; // 2줄로 줄여서 높이 감소
  const TRAY_WIDTH = 1000;
  const TRAY_SCROLLBAR_WIDTH = 25; // 스크롤바 영역 너비
  const TRAY_X = (CANVAS_WIDTH - TRAY_WIDTH) / 2;
  const TRAY_PADDING_X = 40; // 좌우 여백 증가
  const TRAY_PADDING_Y = 30; // 상하 여백 감소 (40 → 30)
  const TRAY_SPACING = 45; // 조각 간격 크게 증가 (30 → 45)
  // 정확한 조각 크기 계산: (전체 너비 - 양쪽 여백 - 스크롤바 영역 - 모든 간격) / 열 개수
  const TRAY_PIECE_SIZE = (TRAY_WIDTH - (TRAY_PADDING_X * 2) - TRAY_SCROLLBAR_WIDTH - (TRAY_SPACING * (TRAY_COLS - 1))) / TRAY_COLS;
  // 보이는 영역 높이 계산: 여백 + (조각 크기 * 줄 수) + (간격 * (줄 수 - 1))
  const TRAY_HEIGHT = TRAY_PADDING_Y * 2 + TRAY_PIECE_SIZE * TRAY_VISIBLE_ROWS + TRAY_SPACING * (TRAY_VISIBLE_ROWS - 1);
  const TRAY_Y = CANVAS_HEIGHT - TRAY_HEIGHT - 5; // 화면 하단에 거의 붙임 (20 → 5)
  
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

  // 로딩 중 별 계속 생성
  useEffect(() => {
    if (!isPuzzleLoading) {
      setContinuousStars([]);
      return;
    }

    let starId = 0;
    const interval = setInterval(() => {
      // 매 50ms마다 새로운 별 30개 추가
      const newStars = [...Array(30)].map(() => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = Math.random() * 3 + 1;
        const dx = (left - 50) * 30;
        const dy = (top - 50) * 30;
        
        return {
          id: starId++,
          left,
          top,
          size,
          dx,
          dy,
          opacity: Math.random() * 0.7 + 0.3,
        };
      });

      setContinuousStars(prev => {
        // 최대 300개까지만 유지 (성능 고려)
        const updated = [...prev, ...newStars];
        return updated.slice(-300);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPuzzleLoading]);
  
  // UI 요소들의 무중력 효과 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() * 0.001;
      setUiFloatOffsets({
        backButton: {
          x: Math.sin(time * 1.3) * 3,
          y: Math.cos(time * 1.1) * 3,
        },
        nameBox: {
          x: Math.sin(time * 1.5 + 0.5) * 2,
          y: Math.cos(time * 1.2 + 0.5) * 2,
        },
        difficultyBox: {
          x: Math.sin(time * 1.4 + 1) * 2.5,
          y: Math.cos(time * 1.3 + 1) * 2.5,
        },
        timerBox: {
          x: Math.sin(time * 1.6 + 1.5) * 2,
          y: Math.cos(time * 1.1 + 1.5) * 2,
        },
        progressBox: {
          x: Math.sin(time * 1.2 + 2) * 2.5,
          y: Math.cos(time * 1.4 + 2) * 2.5,
        },
        hintButton: {
          x: Math.sin(time * 1.7 + 2.5) * 3,
          y: Math.cos(time * 1.3 + 2.5) * 3,
        },
        pauseButton: {
          x: Math.sin(time * 1.5 + 3) * 2.5,
          y: Math.cos(time * 1.2 + 3) * 2.5,
        },
        giveUpButton: {
          x: Math.sin(time * 1.3 + 3.5) * 3,
          y: Math.cos(time * 1.6 + 3.5) * 3,
        },
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, []);

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
    
    img.onload = async () => {
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
      
      // 저장된 상태 확인 및 복원 시도
      console.log('🔍 저장된 상태 확인 중...');
      const savedState = await fetchSavedState();
      console.log('🔍 불러온 저장 상태:', savedState);
      let stateRestored = false;
      
      if (savedState) {
        console.log('✅ 저장된 상태 발견! 복원 시도...');
        // 퍼즐 조각 먼저 생성 (복원에 필요)
        initializePuzzle(gridSize, rng);
        // 저장된 상태로 복원
        stateRestored = loadSavedState(savedState);
        console.log('복원 결과:', stateRestored ? '성공' : '실패');
      }
      
      if (!stateRestored) {
        // 저장된 상태가 없거나 복원 실패 시 새로 생성
        console.log('ℹ️ 새로운 퍼즐 생성');
        initializePuzzle(gridSize, rng);
      }
      
      // 첫 렌더링
      renderPuzzle();
    };

    img.onerror = (error) => {
      console.error('❌ 이미지 로드 실패:', puzzleBody.image);
      console.error('❌ 에러 상세:', error);
      console.error('❌ APOD 여부:', celestialBody.isApod);
      alert('이미지를 불러올 수 없습니다. CORS 문제일 수 있습니다. 다시 시도해주세요.');
      if (celestialBody.isApod) {
        navigate('/lobby');
      } else {
        navigate('/gameplay', {
          state: {
            sectorSlug,
          },
        });
      }
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
    const physics = new Map();
    const totalRows = Math.ceil(pieces.length / TRAY_COLS);
    
    pieces.forEach((piece, index) => {
      const r = Math.floor(index / TRAY_COLS);
      const c = index % TRAY_COLS;
      
      // 조각 배치 위치: 각 행/열마다 일정한 간격으로 배치
      const currentX = TRAY_X + TRAY_PADDING_X + c * (TRAY_PIECE_SIZE + TRAY_SPACING);
      const currentY = TRAY_Y + TRAY_PADDING_Y + r * (TRAY_PIECE_SIZE + TRAY_SPACING);
      
      const group = new Group(piece, { x: currentX, y: currentY });
      groups.push(group);
      
      // 각 그룹에 물리 속성 초기화
      physics.set(group, {
        vx: 0, // X 속도
        vy: 0, // Y 속도
      });
    });

    // 전체 보관소 높이 계산: 여백 + (조각 크기 × 행 수) + (간격 × (행 수 - 1))
    totalTrayHeightRef.current = TRAY_PADDING_Y * 2 + totalRows * TRAY_PIECE_SIZE + Math.max(0, totalRows - 1) * TRAY_SPACING;
    
    groupsRef.current = groups;
    groupPhysicsRef.current = physics;
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

  // 물리 시뮬레이션 업데이트
  const updatePhysics = () => {
    const time = Date.now() * 0.001; // 초 단위
    
    groupsRef.current.forEach((group) => {
      // 고정된 조각은 효과 적용 안함
      if (group.isLocked) {
        group.floatOffset = { x: 0, y: 0 };
        return;
      }
      
      const physics = groupPhysicsRef.current.get(group);
      if (!physics) return;
      
      // 1️⃣ 관성 적용 (드래그 중이 아닐 때, 일시정지가 아닐 때만)
      if (!isPaused && group !== draggedGroupRef.current) {
        group.position.x += physics.vx;
        group.position.y += physics.vy;
        
        // 화면 경계 체크 (퍼즐 조각 크기 고려)
        const pieceSize = BOARD_SIZE / puzzleBody.gridSize;
        const margin = pieceSize / 2; // 조각의 중심을 기준으로 경계 설정
        
        // 왼쪽 경계
        if (group.position.x < margin) {
          group.position.x = margin;
          physics.vx = 0;
        }
        // 오른쪽 경계
        if (group.position.x > CANVAS_WIDTH - margin) {
          group.position.x = CANVAS_WIDTH - margin;
          physics.vx = 0;
        }
        // 위쪽 경계
        if (group.position.y < margin) {
          group.position.y = margin;
          physics.vy = 0;
        }
        // 아래쪽 경계
        if (group.position.y > CANVAS_HEIGHT - margin) {
          group.position.y = CANVAS_HEIGHT - margin;
          physics.vy = 0;
        }
        
        // 서서히 감속 (마찰)
        physics.vx *= 0.95;
        physics.vy *= 0.95;
        
        // 일정 속도 이하가 되면 완전히 멈춤
        if (Math.abs(physics.vx) < 0.05) physics.vx = 0;
        if (Math.abs(physics.vy) < 0.05) physics.vy = 0;
      }
      
      // 2️⃣ 가만히 있을 때 흔들리는 효과 (항상 적용, 일시정지 중에도 적용)
      // Phaser의 Sin/Cos를 활용한 부드러운 흔들림
      const floatOffsetX = Math.sin(time * 1.5 + group.position.x * 0.01) * 2;
      const floatOffsetY = Math.cos(time * 1.2 + group.position.y * 0.01) * 2;
      
      // 흔들림을 임시 오프셋으로만 적용 (실제 위치는 변경 안함)
      group.floatOffset = { x: floatOffsetX, y: floatOffsetY };
    });
  };

  // 렌더링 함수
  const renderPuzzle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = puzzleImageRef.current;
    const actualPieceSize = BOARD_SIZE / puzzleBody.gridSize;

    // 물리 시뮬레이션 업데이트 (무중력 효과)
    updatePhysics();

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
      
      // 흔들림 효과 적용 (floatOffset)
      const floatOffset = group.floatOffset || { x: 0, y: 0 };
      const renderX = group.position.x + floatOffset.x;
      const renderY = isInTrayArea ? group.position.y + trayScrollYRef.current : group.position.y + floatOffset.y;

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

        // 테두리 - 입체감 있는 이중 테두리
        if (group.isLocked) {
          // 고정된 조각: 테두리 없음 (완전히 제거)
        } else {
          // 고정되지 않은 조각: 입체감 있는 이중 테두리
          
          // 1. 어두운 그림자 테두리 (아래/오른쪽)
          ctx.beginPath();
          drawPuzzleShape(ctx, wx + 1, wy + 1, currentSize, piece.edges);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          
          // 2. 밝은 하이라이트 테두리 (위/왼쪽)
          ctx.beginPath();
          drawPuzzleShape(ctx, wx - 0.5, wy - 0.5, currentSize, piece.edges);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // 3. 메인 테두리
          ctx.beginPath();
          drawPuzzleShape(ctx, wx, wy, currentSize, piece.edges);
          if (group === draggedGroupRef.current) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.lineWidth = 1.5;
          }
          ctx.stroke();
        }
      });

      if (isInTrayArea) ctx.restore();
    });

    ctx.restore();

    // 6️⃣ 드래그 중인 그룹을 맨 위에 그리기
    if (draggedGroupRef.current) {
      // 스냅 위치 확인 (자동 고정용, 시각적 프리뷰 없음)
      const snapPos = checkSnapPosition(draggedGroupRef.current);
      snapPositionRef.current = snapPos;

      // 실제 드래그 중인 조각 그리기 (흔들림 효과 포함)
      const floatOffset = draggedGroupRef.current.floatOffset || { x: 0, y: 0 };
      draggedGroupRef.current.pieces.forEach((piece) => {
        const wx = draggedGroupRef.current.position.x + piece.relativePos.x + floatOffset.x;
        const wy = draggedGroupRef.current.position.y + piece.relativePos.y + floatOffset.y;

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

        // 드래그 중: 입체감 있는 테두리
        // 1. 어두운 그림자
        ctx.beginPath();
        drawPuzzleShape(ctx, wx + 1.5, wy + 1.5, piece.size, piece.edges);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 2. 밝은 하이라이트
        ctx.beginPath();
        drawPuzzleShape(ctx, wx - 0.5, wy - 0.5, piece.size, piece.edges);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // 3. 메인 테두리 (밝고 뚜렷하게)
        ctx.beginPath();
        drawPuzzleShape(ctx, wx, wy, piece.size, piece.edges);
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
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
        } else if (location.state?.isTutorial) {
          // 튜토리얼 완료 시 로비로
          alert(`🎉 첫 퍼즐 완성! 축하합니다!\n\n⏱️ 클리어 시간: ${mins}분 ${secs}초\n⭐ 획득한 별: ${starsEarned}개\n\n이제 우주 탐험을 시작하세요!`);
          navigate('/lobby');
        } else {
          alert(`🎉 퍼즐 완성! 축하합니다!\n\n⏱️ 클리어 시간: ${mins}분 ${secs}초\n⭐ 획득한 별: ${starsEarned}개`);
          navigate('/gameplay', {
            state: {
              sectorSlug,
              refreshKey: Date.now(),
            },
          });
        }
      }, 500);
    }
  };

  // 🌟 별 개수는 천체마다 고정 (시간에 무관)
  const getFixedStars = () => {
    // puzzleData 또는 celestialBody의 rewardStars 사용 (없으면 기본값 2)
    return puzzleData?.rewardStars ?? celestialBody.rewardStars ?? 2;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = async () => {
    // 즉시 일시정지 상태 변경
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    // 일시정지 시 현재 상태 저장 (비동기로 백그라운드에서 실행)
    if (newPausedState && isLoadedRef.current && !completeRequestRef.current) {
      savePuzzleState().catch(err => {
        console.error('일시정지 중 저장 실패:', err);
      });
    }
  };

  const handleGiveUp = async () => {
    if (window.confirm('정말 포기하시겠습니까?')) {
      // 포기 시 저장 상태 삭제
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        // nasaId 가져오기
        const giveupNasaId = celestialBody.nasaId 
          || (typeof celestialBody.nameEn === 'string' ? celestialBody.nameEn.toLowerCase() : null)
          || nasaIdFromState;

        if (!accessToken) {
          // 게스트 모드: 저장 상태 삭제
          setPuzzleSave(giveupNasaId, null);
          console.log('✅ 포기: 게스트 모드 저장 상태 삭제됨');
        } else {
          // 로그인 모드: 백엔드에 삭제 요청
          const url = `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(giveupNasaId)}/save`;
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              saveState: null,
              playTime: 0,
            }),
          });
          console.log('✅ 포기: 백엔드 저장 상태 삭제 요청 완료');
          
          // localStorage에도 삭제
          setPuzzleSave(giveupNasaId, null);
        }
      } catch (error) {
        console.error('❌ 저장 상태 삭제 실패:', error);
      }
      if (celestialBody.isApod || nasaIdFromState === 'apod') {
        navigate('/lobby');
      } else {
        navigate('/gameplay', {
          state: {
            sectorSlug,
          },
        });
      }
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
      
      // nasaId 가져오기
      const completeNasaId = celestialBody.nasaId 
        || (typeof celestialBody.nameEn === 'string' ? celestialBody.nameEn.toLowerCase() : null)
        || nasaIdFromState;

      // 퍼즐 완료 시 저장된 상태 삭제
      if (!accessToken) {
        // 게스트 모드: 저장 상태 삭제
        setPuzzleSave(completeNasaId, null);
        console.log('✅ 완료: 게스트 모드 저장 상태 삭제됨');
      } else {
        // 로그인 모드: 백엔드에 명시적으로 저장 상태 삭제 요청
        try {
          const deleteUrl = `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(completeNasaId)}/save`;
          await fetch(deleteUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              saveState: null,
              playTime: 0,
            }),
          });
          console.log('✅ 완료: 백엔드 저장 상태 삭제 요청 완료');
        } catch (error) {
          console.error('❌ 저장 상태 삭제 실패:', error);
        }
        
        // localStorage에도 삭제
        setPuzzleSave(completeNasaId, null);
      }
      
      if (!accessToken) {
        // 게스트 모드: localStorage에 별 저장
        console.log('게스트 모드: 퍼즐 완료 처리 시작');
        const guestStats = getGuestStats();
        
        const isApodPuzzle = celestialBody.isApod || nasaIdFromState === 'apod';
        
        // 🔧 이미 클리어한 천체인지 확인 (중복 방지)
        const guestCleared = getGuestClearedCelestials();
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
          setGuestStats(guestStats);
          return { starsEarned: 0, spaceParts: 1 };
        } else {
          // 일반 퍼즐: 별 추가
          guestStats.stars = (guestStats.stars || 0) + starsEarned;
          console.log(`✅ 게스트 모드: ${starsEarned}개의 별 획득! 총 별: ${guestStats.stars}`);
          setGuestStats(guestStats);
          
          // 클리어 기록 저장
          const clearedRecord = {
            id: celestialBody.id,
            name: celestialBody.name,
            nameEn: celestialBody.nameEn || celestialBody.nasaId,
            nasaId: celestialBody.nasaId,
            sectorSlug: celestialBody.sectorSlug || location.state?.sectorSlug,
            image: celestialBody.image,
            starsEarned: starsEarned,
            clearedAt: new Date().toISOString(),
            playTime: timeRef.current,
          };
          guestCleared.push(clearedRecord);
          setGuestClearedCelestials(guestCleared);
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
        const guestStats = getGuestStats();
        guestStats.stars = data.totalStars;
        setGuestStats(guestStats);
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

  // 퍼즐 상태 직렬화 (저장용) - 고정된 조각만 저장
  const serializePuzzleState = () => {
    // isLocked가 true인 그룹만 저장
    const lockedGroups = groupsRef.current
      .filter(group => group.isLocked)
      .map(group => ({
        pieces: group.pieces.map(piece => ({
          gridX: piece.gridX,
          gridY: piece.gridY,
          edges: { ...piece.edges },
        })),
        position: { ...group.position },
        isLocked: true,
      }));

    return {
      groups: lockedGroups,
      time: timeRef.current,
      puzzleSeed: puzzleData?.puzzleSeed || Date.now(),
      gridSize: puzzleBody.gridSize,
    };
  };

  // 퍼즐 상태 저장 (API 호출)
  const savePuzzleState = async () => {
    try {
      console.log('💾 저장 시작...');
      console.log('현재 그룹 수:', groupsRef.current.length);
      console.log('고정된 그룹 수:', groupsRef.current.filter(g => g.isLocked).length);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const saveState = serializePuzzleState();
      
      console.log('💾 직렬화된 상태:', saveState);
      console.log('💾 저장할 고정 그룹 수:', saveState.groups.length);
      
      // nasaId 가져오기 (UUID가 아닌 실제 nasaId 사용)
      const saveNasaId = celestialBody.nasaId 
        || (typeof celestialBody.nameEn === 'string' ? celestialBody.nameEn.toLowerCase() : null)
        || nasaIdFromState;
      
      console.log('💾 저장할 nasaId:', saveNasaId);
      const isApodPuzzle = celestialBody.isApod || saveNasaId === 'apod';

      if (!accessToken) {
        // 게스트 모드: 저장
        const dataToSave = {
          saveState,
          lastAttemptAt: new Date().toISOString(),
          isCompleted: false,
        };
        setPuzzleSave(saveNasaId, dataToSave);
        console.log('✅ 게스트 모드: 퍼즐 상태 저장됨');
        console.log('저장된 데이터:', dataToSave);
        
        // 저장 확인
        const saved = getPuzzleSave(saveNasaId);
        console.log('저장 확인:', saved ? '성공' : '실패');
        return;
      }

      // 로그인 모드: 백엔드 API 호출
      const url = `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(saveNasaId)}/save`;
      console.log('📡 백엔드 저장 요청:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          saveState,
          playTime: timeRef.current,
        }),
      });

      if (response.ok) {
        console.log('✅ 퍼즐 상태 저장 성공 (백엔드)');
      } else {
        console.error('❌ 퍼즐 상태 저장 실패:', response.status);
        const errorText = await response.text();
        console.error('에러 내용:', errorText);
      }
    } catch (error) {
      console.error('❌ 퍼즐 상태 저장 중 오류:', error);
    }
  };

  // 저장된 퍼즐 상태 불러오기
  const fetchSavedState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      // nasaId 가져오기 (UUID가 아닌 실제 nasaId 사용)
      const loadNasaId = celestialBody.nasaId 
        || (typeof celestialBody.nameEn === 'string' ? celestialBody.nameEn.toLowerCase() : null)
        || nasaIdFromState;

      console.log('📥 불러오기 시도 - nasaId:', loadNasaId);
      console.log('📥 로그인 상태:', accessToken ? '로그인' : '게스트');

      if (!accessToken) {
        // 게스트 모드: 저장 데이터 불러오기
        console.log('📥 게스트 모드 - nasaId:', loadNasaId);
        const data = getPuzzleSave(loadNasaId);
        console.log('📥 저장 데이터:', data);
        
        if (data) {
          console.log('📥 파싱된 데이터:', data);
          
          // saveState가 있고, 그룹이 있으면 불러오기 (isCompleted 무시)
          if (data.saveState && data.saveState.groups && data.saveState.groups.length > 0) {
            console.log('✅ 게스트 모드: 저장된 퍼즐 상태 발견 (localStorage)');
            console.log('📥 고정된 그룹 수:', data.saveState.groups.length);
            return data.saveState;
          } else {
            console.log('⚠️ 데이터는 있지만 조건 불만족 - isCompleted:', data.isCompleted, 'saveState:', !!data.saveState);
            if (data.saveState) {
              console.log('⚠️ saveState.groups:', data.saveState.groups);
            }
          }
        } else {
          console.log('ℹ️ localStorage에 저장된 데이터 없음');
        }
        return null;
      }

      // 로그인 모드: 백엔드 API 호출
      const url = `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(loadNasaId)}/state`;
      console.log('📥 백엔드 요청:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log('📥 백엔드 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📥 백엔드 응답 데이터:', data);
        
        // saveState가 있고, 그룹이 있으면 불러오기 (isCompleted 무시)
        if (data.saveState && data.saveState.groups && data.saveState.groups.length > 0) {
          console.log('✅ 저장된 퍼즐 상태 발견 (백엔드)');
          console.log('📥 고정된 그룹 수:', data.saveState.groups.length);
          return data.saveState;
        } else {
          console.log('⚠️ 데이터는 있지만 조건 불만족 - isCompleted:', data.isCompleted, 'saveState:', !!data.saveState);
          if (data.saveState) {
            console.log('⚠️ saveState.groups:', data.saveState.groups);
          }
        }
      } else {
        const errorText = await response.text();
        console.log('❌ 백엔드 에러:', errorText);
      }
      return null;
    } catch (error) {
      console.error('❌ 저장된 상태 불러오기 실패:', error);
      return null;
    }
  };

  // 저장된 상태로 퍼즐 복원 (고정된 조각만 복원)
  const loadSavedState = (savedState) => {
    if (!savedState || !savedState.groups || savedState.groups.length === 0) return false;

    try {
      console.log('🔄 저장된 퍼즐 상태 복원 중... (고정된 조각만)');
      
      // 시간 복원
      timeRef.current = savedState.time || 0;
      setTime(savedState.time || 0);

      // 저장된 고정 조각들의 gridX, gridY Set 생성
      const lockedPieceCoords = new Set();
      savedState.groups.forEach(groupData => {
        groupData.pieces.forEach(pieceData => {
          lockedPieceCoords.add(`${pieceData.gridX},${pieceData.gridY}`);
        });
      });

      console.log('복원할 고정 조각 좌표:', Array.from(lockedPieceCoords));

      // 기존 groups에서 고정될 조각들을 제거
      const remainingGroups = groupsRef.current.filter(group => {
        // 이 그룹의 모든 조각이 lockedPieceCoords에 없으면 유지
        return !group.pieces.some(piece => 
          lockedPieceCoords.has(`${piece.gridX},${piece.gridY}`)
        );
      });

      console.log(`기존 그룹 ${groupsRef.current.length}개 중 ${remainingGroups.length}개 유지`);

      // 저장된 고정 그룹 복원
      const restoredLockedGroups = savedState.groups.map(groupData => {
        const pieces = groupData.pieces.map(pieceData => {
          // 기존 pieces에서 해당 좌표의 piece 찾기
          const existingPiece = groupsRef.current
            .flatMap(g => g.pieces)
            .find(p => p.gridX === pieceData.gridX && p.gridY === pieceData.gridY);
          
          if (existingPiece) {
            return existingPiece;
          }
          
          // edges 정보가 있으면 사용, 없으면 기본값
          const edges = pieceData.edges || { top: 0, right: 0, bottom: 0, left: 0 };
          
          return new Piece(
            pieceData.gridX,
            pieceData.gridY,
            BOARD_SIZE / savedState.gridSize,
            edges
          );
        });

        // 고정된 조각은 보드 위의 정확한 위치에 배치
        // 첫 번째 조각을 기준으로 보드 위 위치 계산
        const firstPiece = pieces[0];
        const correctPosition = {
          x: BOARD_OFFSET_X + firstPiece.gridX * firstPiece.size,
          y: BOARD_OFFSET_Y + firstPiece.gridY * firstPiece.size,
        };

        console.log(`복원: (${firstPiece.gridX}, ${firstPiece.gridY}) -> (${correctPosition.x}, ${correctPosition.y})`);

        const group = new Group(firstPiece, correctPosition);
        group.pieces = pieces;
        
        // relativePos 재계산
        pieces.forEach(piece => {
          piece.relativePos = {
            x: (piece.gridX - firstPiece.gridX) * piece.size,
            y: (piece.gridY - firstPiece.gridY) * piece.size,
          };
        });

        group.lock(); // 고정된 상태로 복원

        return group;
      });

      // 남은 그룹 + 복원된 고정 그룹 합치기
      groupsRef.current = [...remainingGroups, ...restoredLockedGroups];

      console.log(`복원 완료: 고정 ${restoredLockedGroups.length}개, 미완성 ${remainingGroups.length}개`);

      // 물리 속성 초기화
      const physics = new Map();
      groupsRef.current.forEach(group => {
        physics.set(group, { vx: 0, vy: 0 });
      });
      groupPhysicsRef.current = physics;

      console.log('✅ 퍼즐 상태 복원 완료');
      setHasSavedState(true);
      return true;
    } catch (error) {
      console.error('❌ 퍼즐 상태 복원 실패:', error);
      return false;
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
        
        // 드래그 시작 시 속도 초기화
        const physics = groupPhysicsRef.current.get(group);
        if (physics) {
          physics.vx = 0;
          physics.vy = 0;
        }
        
        // 드래그 시작 위치 저장 (속도 계산용)
        dragStartPosRef.current = {
          x: group.position.x,
          y: group.position.y,
          time: Date.now()
        };
        
        // 드래그 오프셋 설정 (렌더링 좌표 기준)
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
      
      // 새 위치 계산 (화면 좌표)
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
      
      // 화면 경계 제한 (캔버스가 화면 전체이므로 화면 어디든 가능)
      const minX = -minRelX;
      const maxX = CANVAS_WIDTH - maxRelX;
      const minY = -minRelY;
      const maxY = CANVAS_HEIGHT - maxRelY;
      
      // 경계 내로 제한
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      
      // 트레이에 있는지 확인 (화면 좌표 기준)
      const isInTrayNow = newY > TRAY_Y;
      
      // position 업데이트 (트레이에 있으면 스크롤 오프셋 제거)
      group.position.x = newX;
      group.position.y = isInTrayNow ? newY - trayScrollYRef.current : newY;
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
          
          // 고정된 조각은 물리 효과 없음
          const physics = groupPhysicsRef.current.get(activeGroup);
          if (physics) {
            physics.vx = 0;
            physics.vy = 0;
          }
        } else if (snapPos && !snapPos.canSnap) {
          console.log('❌ 스냅 실패 (거리 초과):', {
            pieces: activeGroup.pieces.map(p => `(${p.gridX},${p.gridY})`).join(', '),
            maxDistance: Math.round(snapPos.distance) + 'px',
            threshold: Math.round(snapPos.threshold) + 'px',
            diff: '+' + Math.round(snapPos.distance - snapPos.threshold) + 'px'
          });
          
          // 드래그 후 관성 적용
          const physics = groupPhysicsRef.current.get(activeGroup);
          if (physics) {
            const now = Date.now();
            const dt = now - dragStartPosRef.current.time;
            
            if (dt > 0 && dt < 500) { // 500ms 이내의 드래그만 고려
              // 드래그 속도 계산
              const dx = activeGroup.position.x - dragStartPosRef.current.x;
              const dy = activeGroup.position.y - dragStartPosRef.current.y;
              
              // 속도 = 거리 / 시간 (픽셀/ms를 픽셀/프레임으로 변환)
              physics.vx = (dx / dt) * 16 * 0.5; // 감쇠 적용
              physics.vy = (dy / dt) * 16 * 0.5;
              
              // 속도 제한
              const maxSpeed = 15;
              const speed = Math.sqrt(physics.vx * physics.vx + physics.vy * physics.vy);
              if (speed > maxSpeed) {
                physics.vx = (physics.vx / speed) * maxSpeed;
                physics.vy = (physics.vy / speed) * maxSpeed;
              }
            }
          }
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

  // 렌더링 루프 (무중력 효과를 위해 항상 실행)
  useEffect(() => {
    if (!isPuzzleLoading && !puzzleError && canvasRef.current) {
      const interval = setInterval(() => {
        if (isLoadedRef.current) {
          renderPuzzle();
        }
      }, 16); // 약 60 FPS
      return () => clearInterval(interval);
    }
  }, [isPuzzleLoading, puzzleError]);

  // 자동 저장 (10초마다)
  useEffect(() => {
    if (!isLoadedRef.current || completeRequestRef.current) return;

    saveIntervalRef.current = setInterval(() => {
      savePuzzleState();
    }, 10000); // 10초

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [isLoadedRef.current]);

  // 페이지 떠날 때 저장
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isLoadedRef.current && !completeRequestRef.current) {
        // beforeunload는 동기적으로 처리해야 하므로 직접 localStorage에 저장
        try {
          const saveState = serializePuzzleState();
          
          // nasaId 가져오기
          const unloadNasaId = celestialBody.nasaId 
            || (typeof celestialBody.nameEn === 'string' ? celestialBody.nameEn.toLowerCase() : null)
            || nasaIdFromState;
          
          setPuzzleSave(unloadNasaId, {
            saveState,
            lastAttemptAt: new Date().toISOString(),
            isCompleted: false,
          });
          console.log('페이지 떠남: 퍼즐 상태 저장됨');
          
          // 로그인 상태라면 백엔드에도 저장 시도 (navigator.sendBeacon 사용)
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.access_token) {
              const url = `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(unloadNasaId)}/save`;
              const blob = new Blob([JSON.stringify({
                saveState,
                playTime: timeRef.current,
              })], { type: 'application/json' });
              
              // sendBeacon은 페이지가 닫혀도 요청을 보냄
              navigator.sendBeacon(url, blob);
            }
          });
        } catch (error) {
          console.error('페이지 떠날 때 저장 실패:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-gradient-to-b ${sectorColors.bg}`}>
      {/* 워프 효과 + 반짝임 효과용 스타일 */}
      <style>{`
        @keyframes warpStar {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(4);
            opacity: 0;
          }
        }
        .warp-star {
          animation: warpStar 0.6s ease-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .star-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* 별 배경 (로딩 중 움직임, 로드 후 정지 + 반짝임) */}
      <div className="absolute inset-0">
        {/* 기본 별 배경 (150개) */}
        {stars.map((star, i) => {
          const dx = (star.left - 50) * 30;
          const dy = (star.top - 50) * 30;
          
          return (
            <div
              key={i}
              className={`absolute bg-white rounded-full ${isPuzzleLoading ? 'warp-star' : star.isTwinkling ? 'star-twinkle' : ''}`}
              style={{
                width: star.width + 'px',
                height: star.height + 'px',
                top: star.top + '%',
                left: star.left + '%',
                opacity: star.opacity,
                '--tx': `${dx}vw`,
                '--ty': `${dy}vh`,
                animationDelay: star.isTwinkling && !isPuzzleLoading ? `${star.animationDelay}s` : undefined,
              }}
            />
          );
        })}
        
        {/* 로딩 중 계속 생성되는 별들 */}
        {continuousStars.map((star) => (
          <div
            key={`continuous-${star.id}`}
            className="absolute bg-white rounded-full warp-star"
            style={{
              width: star.size + 'px',
              height: star.size + 'px',
              top: star.top + '%',
              left: star.left + '%',
              opacity: star.opacity,
              '--tx': `${star.dx}vw`,
              '--ty': `${star.dy}vh`,
            }}
          />
        ))}
      </div>
      
      {shouldShowLoading ? (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <p className="korean-font text-2xl text-gray-300" style={{ imageRendering: 'pixelated' }}>
            퍼즐 데이터를 불러오는 중...
          </p>
        </div>
      ) : shouldShowError ? (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center bg-gray-900 bg-opacity-90 border-4 border-red-500 px-8 py-6">
            <p className="korean-font text-2xl text-red-400 mb-4" style={{ imageRendering: 'pixelated' }}>
              퍼즐을 불러오지 못했습니다
            </p>
            <p className="korean-font text-base text-gray-400 mb-6" style={{ imageRendering: 'pixelated' }}>
              {puzzleError}
            </p>
            <button
              type="button"
              onClick={() => navigate('/gameplay', {
                state: {
                  sectorSlug,
                },
              })}
              className="korean-font text-xl bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 border-4 border-blue-400 transition-all"
              style={{ imageRendering: 'pixelated' }}
            >
              돌아가기
            </button>
          </div>
        </div>
      ) : (
        <>
      {/* 상단 UI - 무중력 효과 적용 */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        {/* 왼쪽: 게임 정보 + 타이머 + 진행률 */}
        <div className="flex flex-col gap-3 pointer-events-auto" style={{ maxWidth: '300px' }}>
          {/* 뒤로가기 버튼 */}
          <button
            onClick={async () => {
              // 돌아가기 전 현재 상태 저장
              if (isLoadedRef.current && !completeRequestRef.current) {
                await savePuzzleState();
              }
              if (celestialBody.isApod) {
                navigate('/lobby');
              } else {
                navigate('/gameplay', {
                  state: {
                    sectorSlug,
                  },
                });
              }
            }}
            className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 px-5 py-3 border-4 border-gray-600 hover:border-blue-400 active:border-gray-800 active:bg-opacity-70 transition-all korean-font text-white text-base shadow-lg"
            style={{
              transform: `translate(${uiFloatOffsets.backButton.x}px, ${uiFloatOffsets.backButton.y}px)`,
              imageRendering: 'pixelated',
            }}
          >
            ← 돌아가기
          </button>
          
          {/* 천체 이름 */}
          <div 
            className="bg-gray-900 bg-opacity-90 px-5 py-3 border-4 border-blue-500 shadow-lg"
            style={{
              transform: `translate(${uiFloatOffsets.nameBox.x}px, ${uiFloatOffsets.nameBox.y}px)`,
              imageRendering: 'pixelated',
            }}
          >
            <p className="korean-font text-white text-xl">{puzzleBody.name}</p>
          </div>
          
          {/* 난이도 (별로 표시) */}
          <div 
            className="bg-gray-900 bg-opacity-90 px-5 py-3 border-4 border-yellow-500 shadow-lg"
            style={{
              transform: `translate(${uiFloatOffsets.difficultyBox.x}px, ${uiFloatOffsets.difficultyBox.y}px)`,
              imageRendering: 'pixelated',
            }}
          >
            <p className="korean-font text-yellow-400 text-xl">{getDifficultyStars()}</p>
          </div>
          
          {/* 타이머 */}
          <div 
            className="bg-gray-900 bg-opacity-90 px-5 py-3 border-4 border-green-500 shadow-lg"
            style={{
              transform: `translate(${uiFloatOffsets.timerBox.x}px, ${uiFloatOffsets.timerBox.y}px)`,
              imageRendering: 'pixelated',
            }}
          >
            <p className="korean-font text-green-400 text-xl">⏱ {formatTime(time)}</p>
          </div>
          
          {/* 진행률 */}
          <div 
            className="bg-gray-900 bg-opacity-90 px-5 py-3 border-4 border-purple-500 min-w-[220px] shadow-lg"
            style={{
              transform: `translate(${uiFloatOffsets.progressBox.x}px, ${uiFloatOffsets.progressBox.y}px)`,
              imageRendering: 'pixelated',
            }}
          >
            <p className="korean-font text-purple-400 mb-2 text-lg">{progress}%</p>
            <div className="w-full h-4 bg-gray-700 border-2 border-gray-600 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* 오른쪽 상단 컨트롤 버튼 - 독립적인 absolute 배치 */}
      <div 
        className="absolute -top-16 right-4 z-40 flex flex-col -space-y-52 pointer-events-none"
      >
        {/* 힌트 버튼 */}
        <button
          data-button-id="hint"
          onClick={(e) => {
            if (isClickableArea(e, e.currentTarget)) {
              handleHint();
              setTimeout(() => setIsHintButtonPressed(false), 100);
            } else {
              // 클릭 불가 영역이면 뒤의 버튼 찾아서 직접 실행
              const currentButton = e.currentTarget;
              currentButton.style.pointerEvents = 'none';
              const elementBehind = document.elementFromPoint(e.clientX, e.clientY);
              currentButton.style.pointerEvents = 'auto';
              
              if (elementBehind && elementBehind.tagName === 'BUTTON') {
                const buttonId = elementBehind.getAttribute('data-button-id');
                if (buttonId === 'pause') {
                  handlePause();
                  setTimeout(() => setIsPauseButtonPressed(false), 100);
                } else if (buttonId === 'giveup') {
                  handleGiveUp();
                  setTimeout(() => setIsGiveUpButtonPressed(false), 100);
                }
              }
            }
          }}
          onMouseDown={(e) => {
            if (isClickableArea(e, e.currentTarget)) {
              setIsHintButtonPressed(true);
            } else {
              // 클릭 불가 영역이면 뒤의 버튼 찾아서 직접 실행
              const currentButton = e.currentTarget;
              currentButton.style.pointerEvents = 'none';
              const elementBehind = document.elementFromPoint(e.clientX, e.clientY);
              currentButton.style.pointerEvents = 'auto';
              
              if (elementBehind && elementBehind.tagName === 'BUTTON') {
                const buttonId = elementBehind.getAttribute('data-button-id');
                if (buttonId === 'pause') setIsPauseButtonPressed(true);
                else if (buttonId === 'giveup') setIsGiveUpButtonPressed(true);
              }
            }
          }}
          onMouseUp={() => setIsHintButtonPressed(false)}
          onMouseLeave={() => setIsHintButtonPressed(false)}
          className="relative transition-all z-30 pointer-events-auto"
          style={{
            transform: `translate(${uiFloatOffsets.hintButton.x}px, ${uiFloatOffsets.hintButton.y}px)`,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <img
            src={isHintButtonPressed ? hintButtonPressed : hintButton}
            alt="힌트"
            className="w-auto h-72 pointer-events-none"
            style={{ 
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
        </button>
        
        {/* 일시정지 버튼 */}
        <button
          data-button-id="pause"
          onClick={(e) => {
            if (isClickableArea(e, e.currentTarget)) {
              handlePause();
              setTimeout(() => setIsPauseButtonPressed(false), 100);
            } else {
              // 클릭 불가 영역이면 뒤의 버튼 찾아서 직접 실행
              const currentButton = e.currentTarget;
              currentButton.style.pointerEvents = 'none';
              const elementBehind = document.elementFromPoint(e.clientX, e.clientY);
              currentButton.style.pointerEvents = 'auto';
              
              if (elementBehind && elementBehind.tagName === 'BUTTON') {
                const buttonId = elementBehind.getAttribute('data-button-id');
                if (buttonId === 'giveup') {
                  handleGiveUp();
                  setTimeout(() => setIsGiveUpButtonPressed(false), 100);
                }
              }
            }
          }}
          onMouseDown={(e) => {
            if (isClickableArea(e, e.currentTarget)) {
              setIsPauseButtonPressed(true);
            } else {
              // 클릭 불가 영역이면 뒤의 버튼 찾아서 직접 실행
              const currentButton = e.currentTarget;
              currentButton.style.pointerEvents = 'none';
              const elementBehind = document.elementFromPoint(e.clientX, e.clientY);
              currentButton.style.pointerEvents = 'auto';
              
              if (elementBehind && elementBehind.tagName === 'BUTTON') {
                const buttonId = elementBehind.getAttribute('data-button-id');
                if (buttonId === 'giveup') setIsGiveUpButtonPressed(true);
              }
            }
          }}
          onMouseUp={() => setIsPauseButtonPressed(false)}
          onMouseLeave={() => setIsPauseButtonPressed(false)}
          className="relative transition-all z-20 pointer-events-auto"
          style={{
            transform: `translate(${uiFloatOffsets.pauseButton.x}px, ${uiFloatOffsets.pauseButton.y}px)`,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <img
            src={
              isPaused
                ? (isPauseButtonPressed ? resumeButtonPressed : resumeButton)
                : (isPauseButtonPressed ? pauseButtonPressed : pauseButton)
            }
            alt={isPaused ? '재개' : '일시정지'}
            className="w-auto h-72 pointer-events-none"
            style={{ 
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
        </button>
        
        {/* 포기 버튼 */}
        <button
          data-button-id="giveup"
          onClick={(e) => {
            if (isClickableArea(e, e.currentTarget)) {
              handleGiveUp();
              setTimeout(() => setIsGiveUpButtonPressed(false), 100);
            }
          }}
          onMouseDown={(e) => {
            if (isClickableArea(e, e.currentTarget)) {
              setIsGiveUpButtonPressed(true);
            }
          }}
          onMouseUp={() => setIsGiveUpButtonPressed(false)}
          onMouseLeave={() => setIsGiveUpButtonPressed(false)}
          className="relative transition-all z-10 pointer-events-auto"
          style={{
            transform: `translate(${uiFloatOffsets.giveUpButton.x}px, ${uiFloatOffsets.giveUpButton.y}px)`,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <img
            src={isGiveUpButtonPressed ? giveupButtonPressed : giveupButton}
            alt="포기"
            className="w-auto h-72 pointer-events-none"
            style={{ 
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
        </button>
      </div>

      {/* 중앙: 퍼즐 영역 */}
      <div className="absolute inset-0 flex items-center justify-center z-30">
        <div className="relative flex flex-col items-center">
          {/* 힌트 오버레이 */}
          {showHint && puzzleImageRef.current && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-90">
              <div className="text-center bg-gray-900 bg-opacity-95 border-4 border-yellow-400 px-8 py-6">
                <p className="korean-font text-yellow-400 text-2xl mb-4" style={{ imageRendering: 'pixelated' }}>
                  💡 힌트: 완성된 이미지
                </p>
                <canvas
                  ref={(el) => {
                    if (el && puzzleImageRef.current) {
                      const ctx = el.getContext('2d');
                      ctx.drawImage(puzzleImageRef.current, 0, 0, BOARD_SIZE, BOARD_SIZE);
                    }
                  }}
                  width={BOARD_SIZE}
                  height={BOARD_SIZE}
                  className="border-4 border-yellow-400 mx-auto"
                />
              </div>
            </div>
          )}

          {/* Canvas 퍼즐판 */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="cursor-grab active:cursor-grabbing"
            style={{
              imageRendering: 'auto',
            }}
          />
        </div>
      </div>

      {/* 일시정지 오버레이 */}
      {isPaused && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center bg-gray-900 bg-opacity-95 border-4 border-blue-500 px-12 py-8">
            <p className="korean-font text-white text-6xl mb-8 hover:scale-110 transition-transform cursor-default" style={{ imageRendering: 'pixelated' }}>
              ⏸ 일시정지
            </p>
            <button
              onClick={handlePause}
              onMouseDown={() => setIsPauseButtonPressed(true)}
              onMouseUp={() => setIsPauseButtonPressed(false)}
              onMouseLeave={() => setIsPauseButtonPressed(false)}
              className="relative transition-all hover:scale-110"
              style={{ transform: 'scale(2)' }}
            >
              <img
                src={isPauseButtonPressed ? resumeButtonPressed : resumeButton}
                alt="게임 재개"
                className="w-auto h-96"
                style={{ imageRendering: 'pixelated' }}
              />
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default PuzzleGame;