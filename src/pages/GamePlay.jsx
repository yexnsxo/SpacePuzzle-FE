import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SolarSystemView from '../components/Space/SolarSystemView';
import NebulaView from '../components/Space/NebulaView';
import GalaxyView from '../components/Space/GalaxyView';
import DeepSpaceView from '../components/Space/DeepSpaceView';
import { getSectorColors } from '../utils/sectorColors';

const SECTOR_SLUGS = {
  'solar-system': 'solar-system',
  '태양계': 'solar-system',
  'exoplanet-systems': 'exoplanet-systems',
  'exo-systems': 'exoplanet-systems', // 이전 버전 호환
  '외계 행성계': 'exoplanet-systems',
  'nebulae': 'nebulae',
  '성운': 'nebulae',
  'galaxies': 'galaxies',
  '은하': 'galaxies',
  'deep-space-extremes': 'deep-space-extremes',
  '우주의 심연': 'deep-space-extremes',
};

const DIFFICULTY_LABELS = {
  1: '쉬움',
  2: '보통',
  3: '어려움',
  4: '매우 어려움',
  5: '극한',
};

// 태양계 천체 매핑 (회전 애니메이션용)
const SOLAR_SYSTEM_PLANETS = {
  'sun': { name: 'Sun', nameKo: '태양', size: 150, speed: 50 },
  'mercury': { name: 'Mercury', nameKo: '수성', size: 80, speed: 100 },
  'venus': { name: 'Venus', nameKo: '금성', size: 100, speed: 120 },
  'earth': { name: 'Earth', nameKo: '지구', size: 100, speed: 100 },
  'mars': { name: 'Mars', nameKo: '화성', size: 90, speed: 110 },
  'jupiter': { name: 'Jupiter', nameKo: '목성', size: 130, speed: 80 },
  'saturn': { name: 'Saturn', nameKo: '토성', size: 120, speed: 90 },
  'uranus': { name: 'Uranus', nameKo: '천왕성', size: 110, speed: 100 },
  'neptune': { name: 'Neptune', nameKo: '해왕성', size: 110, speed: 100 },
};

// 🔧 더미 천체 데이터 (백엔드에 데이터가 없을 때 사용)
const DUMMY_CELESTIAL_DATA = {
  'exoplanet-systems': [
    {
      id: 'kepler-186f',
      nasaId: 'kepler-186f',
      title: '케플러-186f',
      nameEn: 'Kepler-186f',
      description: '지구와 크기가 비슷한 외계행성',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/09/Kepler-186f_artistconcept2-1.jpg',
      difficulty: '2',
      gridSize: 4,
      rewardStars: 2,
      puzzleType: 'jigsaw',
      displayOrder: 1,
      locked: false,
      isCleared: false,
    },
    {
      id: 'proxima-b',
      nasaId: 'proxima-b',
      title: '프록시마 b',
      nameEn: 'Proxima Centauri b',
      description: '가장 가까운 외계행성',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/09/eso1629a.jpg',
      difficulty: '3',
      gridSize: 5,
      rewardStars: 3,
      puzzleType: 'jigsaw',
      displayOrder: 2,
      locked: false,
      isCleared: false,
    },
    {
      id: 'trappist-1e',
      nasaId: 'trappist-1e',
      title: '트라피스트-1e',
      nameEn: 'TRAPPIST-1e',
      description: '생명체 존재 가능성이 높은 행성',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/09/pia21422.jpg',
      difficulty: '3',
      gridSize: 5,
      rewardStars: 3,
      puzzleType: 'jigsaw',
      displayOrder: 3,
      locked: false,
      isCleared: false,
    },
  ],
  'nebulae': [
    {
      id: 'orion-nebula',
      nasaId: 'orion-nebula',
      title: '오리온 성운',
      nameEn: 'Orion Nebula',
      description: '별이 탄생하는 거대한 성운',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/04/orion-nebula-mosaic-5856x3888-1.jpg',
      difficulty: '3',
      gridSize: 5,
      rewardStars: 3,
      puzzleType: 'jigsaw',
      displayOrder: 1,
      locked: false,
      isCleared: false,
    },
    {
      id: 'crab-nebula',
      nasaId: 'crab-nebula',
      title: '게 성운',
      nameEn: 'Crab Nebula',
      description: '초신성 폭발의 잔해',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/05/crab-nebula-5376x4848-1.jpg',
      difficulty: '4',
      gridSize: 6,
      rewardStars: 4,
      puzzleType: 'jigsaw',
      displayOrder: 2,
      locked: false,
      isCleared: false,
    },
    {
      id: 'eagle-nebula',
      nasaId: 'eagle-nebula',
      title: '독수리 성운',
      nameEn: 'Eagle Nebula',
      description: '창조의 기둥으로 유명한 성운',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/05/pillars-of-creation-4800x6000-1.jpg',
      difficulty: '4',
      gridSize: 6,
      rewardStars: 4,
      puzzleType: 'jigsaw',
      displayOrder: 3,
      locked: false,
      isCleared: false,
    },
  ],
  'galaxies': [
    {
      id: 'andromeda',
      nasaId: 'andromeda',
      title: '안드로메다 은하',
      nameEn: 'Andromeda Galaxy',
      description: '우리 은하와 가장 가까운 대형 은하',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/04/andromeda-m31-nasa-swift.jpg',
      difficulty: '4',
      gridSize: 6,
      rewardStars: 4,
      puzzleType: 'jigsaw',
      displayOrder: 1,
      locked: false,
      isCleared: false,
    },
    {
      id: 'whirlpool',
      nasaId: 'whirlpool',
      title: '소용돌이 은하',
      nameEn: 'Whirlpool Galaxy',
      description: '아름다운 나선 구조의 은하',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/04/whirlpool-galaxy-5408x6144-1.jpg',
      difficulty: '5',
      gridSize: 7,
      rewardStars: 5,
      puzzleType: 'jigsaw',
      displayOrder: 2,
      locked: false,
      isCleared: false,
    },
    {
      id: 'sombrero',
      nasaId: 'sombrero',
      title: '솜브레로 은하',
      nameEn: 'Sombrero Galaxy',
      description: '모자 모양의 독특한 은하',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/04/sombrero-galaxy-4800x2400-1.jpg',
      difficulty: '5',
      gridSize: 7,
      rewardStars: 5,
      puzzleType: 'jigsaw',
      displayOrder: 3,
      locked: false,
      isCleared: false,
    },
  ],
  'deep-space-extremes': [
    {
      id: 'black-hole',
      nasaId: 'black-hole-m87',
      title: 'M87 블랙홀',
      nameEn: 'M87 Black Hole',
      description: '인류가 촬영한 최초의 블랙홀',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/05/black-hole-m87-4096x2304-1.jpg',
      difficulty: '5',
      gridSize: 8,
      rewardStars: 5,
      puzzleType: 'jigsaw',
      displayOrder: 1,
      locked: false,
      isCleared: false,
    },
    {
      id: 'pillars-of-creation',
      nasaId: 'pillars-jwst',
      title: '창조의 기둥 (JWST)',
      nameEn: 'Pillars of Creation',
      description: '제임스 웹 망원경이 촬영한 창조의 기둥',
      imageUrl: 'https://science.nasa.gov/wp-content/uploads/2023/05/pillars-of-creation-4800x6000-1.jpg',
      difficulty: '5',
      gridSize: 8,
      rewardStars: 5,
      puzzleType: 'jigsaw',
      displayOrder: 2,
      locked: false,
      isCleared: false,
    },
  ],
};

const resolveSectorSlug = (value) => {
  if (!value || typeof value !== 'string') {
    return 'solar-system';
  }
  return SECTOR_SLUGS[value] || 'solar-system';
};

const normalizeClearedFlag = (value) => {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  return false;
};

const GamePlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedBody, setSelectedBody] = useState(null);
  const [celestialBodies, setCelestialBodies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isWarping, setIsWarping] = useState(false);
  const [continuousStars, setContinuousStars] = useState([]); // 로딩/워프 중 계속 생성되는 별들
  
  // 천체별 리더보드 상태
  const [celestialLeaderboard, setCelestialLeaderboard] = useState(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const sectorSlug = resolveSectorSlug(location.state?.sectorSlug || location.state?.sector);
  const sectorColors = getSectorColors(sectorSlug);
  const refreshKey = location.state?.refreshKey;
  const justClearedId = location.state?.justClearedId;
  const justClearedNasaId = location.state?.justClearedNasaId;

  const applyJustCleared = (body) => {
    if (!justClearedId && !justClearedNasaId) return body;
    const matches =
      (justClearedId && body.id === justClearedId)
      || (justClearedNasaId && body.nasaId === justClearedNasaId);
    if (!matches || body.isCleared) return body;
    return { ...body, isCleared: true };
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCelestialBodies = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        // 게스트 모드 체크
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isGuest = user.isGuest === true;
        
        // 🔧 게스트 모드일 때 클리어 기록 가져오기
        let guestClearedIds = [];
        if (isGuest) {
          const guestCleared = JSON.parse(localStorage.getItem('guestClearedCelestials') || '[]');
          guestClearedIds = guestCleared.map(c => c.id);
          console.log('게스트 클리어 기록:', guestClearedIds);
        }
        
        let normalizedBodies = [];
        
        // 🔧 백엔드에서 데이터 가져오기 시도
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
          const response = await fetch(
            `https://spacepuzzle.onrender.com/sectors/${sectorSlug}/celestial-objects`,
            { headers, signal: controller.signal }
          );

          if (response.ok) {
            const payload = await response.json();
            normalizedBodies = (payload?.celestialObjects || [])
              .map((body) => {
                const difficultyValue = Number(body.difficulty);
                
                // 🔧 게스트 모드일 때는 localStorage 기록 확인
                const isCleared = isGuest
                  ? guestClearedIds.includes(body.id)
                  : normalizeClearedFlag(body.isCleared);
                
                return {
                  id: body.id,
                  nasaId: body.nasaId,
                  name: body.title || body.name || '',
                  nameEn: body.nameEn || '',
                  description: body.description || '',
                  image: body.imageUrl || body.image || null,
                  locked: Boolean(body.locked),
                  requiredStars: body.requiredStars ?? payload?.sector?.requiredStars ?? 0,
                  difficulty: difficultyValue,
                  difficultyKo: DIFFICULTY_LABELS[difficultyValue] || '보통',
                  gridSize: body.gridSize || 3,
                  rewardStars: body.rewardStars || 0,
                  puzzleType: body.puzzleType,
                  displayOrder: body.displayOrder ?? 0,
                  isCleared: isCleared,
                };
              })
              .map(applyJustCleared)
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          }
        } catch (backendError) {
          console.warn('백엔드 데이터 가져오기 실패, 더미 데이터 사용:', backendError);
        }
        
        // 🔧 백엔드 데이터가 없으면 더미 데이터 사용
        if (normalizedBodies.length === 0 && DUMMY_CELESTIAL_DATA[sectorSlug]) {
          console.log(`📦 ${sectorSlug} 섹터의 더미 데이터 사용`);
          normalizedBodies = DUMMY_CELESTIAL_DATA[sectorSlug]
            .map((body) => {
            const difficultyValue = Number(body.difficulty);
            
            // 🔧 게스트 모드일 때는 localStorage 기록 확인
            const isCleared = isGuest
              ? guestClearedIds.includes(body.id)
              : normalizeClearedFlag(body.isCleared);
            
            return {
              ...body,
              name: body.title,
              image: body.imageUrl,
              difficulty: difficultyValue,
              difficultyKo: DIFFICULTY_LABELS[difficultyValue] || '보통',
              isCleared: isCleared,
            };
            })
            .map(applyJustCleared);
        }

        if (isMounted) {
          setCelestialBodies(normalizedBodies);
          setSelectedBody(null);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (isMounted) {
          setLoadError(error.message || '천체 데이터를 불러오는 중 오류가 발생했습니다.');
          setCelestialBodies([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCelestialBodies();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [sectorSlug, refreshKey]);

  const handleBodyClick = async (body) => {
    if (!body.locked) {
      setSelectedBody(body);
      
      // 천체별 리더보드 가져오기
      setIsLoadingLeaderboard(true);
      setCelestialLeaderboard(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        console.log('🔐 로그인 상태:', accessToken ? '로그인됨' : '로그인 안됨');
        
        if (accessToken) {
          console.log(`📡 ${body.name} 리더보드 요청 시작...`);
          console.log(`   천체 ID: ${body.id}`);
          console.log(`   천체 NASA ID: ${body.nasaId}`);
          console.log(`   천체 데이터:`, body);
          
          // 🔧 백엔드는 nasaId를 사용 (문자열 식별자: "earth", "mars", "proxima-b" 등)
          const celestialIdentifier = body.nasaId || body.id;
          
          if (!celestialIdentifier) {
            console.warn(`⚠️ ${body.name}: 천체 식별자가 없어서 리더보드를 불러올 수 없습니다.`);
            setCelestialLeaderboard(null);
            setIsLoadingLeaderboard(false);
            return;
          }
          
          console.log(`   🆔 사용할 식별자: ${celestialIdentifier}`);
          
          const response = await fetch(
            `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(celestialIdentifier)}/leaderboard`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          console.log(`📥 ${body.name} 리더보드 응답:`, response.status, response.statusText);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${body.name} 리더보드 데이터:`, data);
            setCelestialLeaderboard(data);
          } else {
            const errorText = await response.text();
            console.error(`❌ ${body.name} 리더보드 API 에러:`, response.status, errorText);
            setCelestialLeaderboard(null);
          }
        } else {
          // 로그인하지 않은 경우
          setCelestialLeaderboard(null);
        }
      } catch (error) {
        console.error('❌ 리더보드 가져오기 실패:', error);
        setCelestialLeaderboard(null);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    }
  };

  const handleStartPuzzle = () => {
    if (selectedBody && !isWarping) {
      // 워프 애니메이션 시작
      setIsWarping(true);
      
      // 0.5초 후 페이지 이동 (워프 상태 전달)
      setTimeout(() => {
        navigate('/puzzle', { 
          state: { 
            celestialBody: selectedBody,
            sectorSlug: sectorSlug,  // 섹터 정보 전달
            isWarping: true  // 워프 중 상태 전달
          } 
        });
      }, 500);
    }
  };

  // 로딩/워프 중 별 계속 생성
  useEffect(() => {
    if (!isLoading && !isWarping) {
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
  }, [isLoading, isWarping]);

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
      
      <div className="absolute inset-0">
        {/* 기본 별 배경 (150개) */}
        {[...Array(150)].map((_, i) => {
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const isTwinkling = Math.random() > 0.7;
          const size = isTwinkling ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
          const animationDelay = Math.random() * 3;
          
          const dx = (left - 50) * 30;
          const dy = (top - 50) * 30;
          
          return (
            <div
              key={i}
              className={`absolute bg-white rounded-full ${isWarping || isLoading ? 'warp-star' : isTwinkling ? 'star-twinkle' : ''}`}
              style={{
                width: size + 'px',
                height: size + 'px',
                top: top + '%',
                left: left + '%',
                opacity: isTwinkling && !isWarping && !isLoading ? 0.3 : Math.random() * 0.5 + 0.3,
                '--tx': `${dx}vw`,
                '--ty': `${dy}vh`,
                animationDelay: isTwinkling && !isWarping && !isLoading ? `${animationDelay}s` : undefined,
              }}
            />
          );
        })}
        
        {/* 로딩/워프 시 계속 생성되는 별들 */}
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

      <button
        onClick={() => navigate('/sector', {
          state: {
            sectorSlug: sectorSlug,
          },
        })}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-gray-700 hover:border-blue-500"
      >
        <span className="text-xl">←</span>
        <span className="korean-font">섹터 소개로</span>
      </button>

      <div className="relative z-10 h-full flex">
        <div className="w-2/3 p-8 flex items-center justify-center">
          <div className="max-w-5xl w-full">
            <h2 className="korean-font text-4xl text-white mb-8 text-center">천체 선택</h2>
            
            {isLoading ? (
              <div className="text-center text-gray-400 korean-font text-xl">로딩 중...</div>
            ) : loadError ? (
              <div className="text-center text-red-400">
                <p className="korean-font text-xl mb-2">데이터를 불러오지 못했습니다</p>
                <p className="korean-font text-sm text-gray-400">{loadError}</p>
              </div>
            ) : sectorSlug === 'solar-system' || sectorSlug === 'exoplanet-systems' ? (
              // 태양계 & 외계행성계: 중심 천체를 중심으로 공전하는 행성들
              <SolarSystemView
                celestialBodies={celestialBodies}
                selectedBody={selectedBody}
                onBodyClick={handleBodyClick}
                folder={sectorSlug === 'solar-system' ? 'solar-system' : 'exoplanets'}
              />
            ) : sectorSlug === 'nebulae' ? (
              // 성운: 무중력으로 떠다니는 대형 성운들
              <NebulaView
                celestialBodies={celestialBodies}
                selectedBody={selectedBody}
                onBodyClick={handleBodyClick}
              />
            ) : sectorSlug === 'galaxies' ? (
              // 은하: 궤도 회전과 자체 회전
              <GalaxyView
                celestialBodies={celestialBodies}
                selectedBody={selectedBody}
                onBodyClick={handleBodyClick}
              />
            ) : sectorSlug === 'deep-space-extremes' ? (
              // 심연: 무중력 + 화려한 시각 효과
              <NebulaView
                celestialBodies={celestialBodies}
                selectedBody={selectedBody}
                onBodyClick={handleBodyClick}
                folder="deep-space"
              />
            ) : (
              // 다른 섹터는 기본 그리드 UI
              <div className="grid grid-cols-3 gap-6">
                {celestialBodies.map((body) => (
                  <div
                    key={body.id}
                    onClick={() => handleBodyClick(body)}
                    className={`relative bg-gray-900 bg-opacity-80 rounded-xl p-6 border-2 transition-all ${
                      body.locked
                        ? 'border-gray-600 opacity-50 cursor-not-allowed'
                        : selectedBody?.id === body.id
                        ? 'border-yellow-400 shadow-lg shadow-yellow-500/50 scale-105'
                        : 'border-blue-500 hover:border-blue-400 cursor-pointer hover:scale-105'
                    }`}
                  >
                    {body.image ? (
                      <img
                        src={`https://spacepuzzle.onrender.com/api/proxy-image?url=${encodeURIComponent(body.image)}`}
                        alt={body.name}
                        className={`w-28 h-28 mx-auto rounded-full mb-4 object-cover ${
                          body.locked || !body.isCleared ? 'filter grayscale' : ''
                        }`}
                        style={{
                          boxShadow: body.locked ? 'none' : '0 0 30px rgba(150, 150, 150, 0.5)',
                        }}
                        onError={(e) => {
                          e.target.src = body.image;
                        }}
                      />
                    ) : (
                      <div 
                        className={`w-28 h-28 mx-auto rounded-full mb-4 ${
                          body.locked ? 'bg-gray-700' : 'bg-gradient-to-br from-gray-300 to-gray-600'
                        }`}
                        style={{
                          filter: body.locked || !body.isCleared ? 'grayscale(100%)' : 'none',
                          boxShadow: body.locked ? 'none' : '0 0 30px rgba(150, 150, 150, 0.5)',
                        }}
                      />
                    )}
                    
                    <p className="korean-font text-center text-white text-lg mb-1">{body.name}</p>
                    <p className="text-center text-gray-400 text-sm">{body.nameEn}</p>
                    
                    {body.locked && (
                      <>
                        <div className="absolute top-4 right-4 text-3xl">🔒</div>
                        <p className="korean-font text-center text-yellow-500 text-xs mt-2">⭐ {body.requiredStars}개 필요</p>
                      </>
                    )}
                    
                    {body.isCleared && !body.locked && (
                      <div className="absolute top-4 right-4 text-sm">✅</div>
                    )}
                    
                    {selectedBody?.id === body.id && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-1/3 bg-gray-900 bg-opacity-90 border-l-2 border-blue-500 overflow-y-auto">
          {selectedBody ? (
            <div className="w-full p-8">
              <h3 className="korean-font text-3xl text-white mb-6 text-center sticky top-0 bg-gray-900 bg-opacity-95 py-4 -mx-8 px-8 z-10">스테이지 정보</h3>
              
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                {/* 천체 이미지 */}
                {selectedBody.image ? (
                  <img
                    src={`https://spacepuzzle.onrender.com/api/proxy-image?url=${encodeURIComponent(selectedBody.image)}`}
                    alt={selectedBody.name}
                    className={`w-40 h-40 mx-auto rounded-full mb-4 object-cover ${
                      selectedBody.locked || !selectedBody.isCleared ? 'filter grayscale' : ''
                    }`}
                    style={{
                      boxShadow: '0 0 40px rgba(150, 150, 150, 0.6)',
                    }}
                    onError={(e) => {
                      // 프록시 실패 시 원본 이미지로 폴백
                      e.target.src = selectedBody.image;
                    }}
                  />
                ) : (
                  <div 
                    className="w-40 h-40 mx-auto rounded-full mb-4 bg-gradient-to-br from-gray-300 to-gray-600"
                    style={{
                      filter: selectedBody.locked || !selectedBody.isCleared ? 'grayscale(100%)' : 'none',
                      boxShadow: '0 0 40px rgba(150, 150, 150, 0.6)',
                    }}
                  />
                )}
                
                <h4 className="korean-font text-2xl text-white text-center mb-2">{selectedBody.name}</h4>
                <p className="text-blue-400 text-center mb-4">{selectedBody.nameEn}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-gray-700 rounded px-4 py-2">
                    <span className="korean-font text-gray-300">난이도:</span>
                    <span className={`korean-font ${
                      selectedBody.difficultyKo === '쉬움' ? 'text-green-400' :
                      selectedBody.difficultyKo === '보통' ? 'text-yellow-400' :
                      selectedBody.difficultyKo === '어려움' ? 'text-orange-400' :
                      selectedBody.difficultyKo === '매우 어려움' ? 'text-red-400' :
                      'text-purple-400'
                    }`}>{selectedBody.difficultyKo}</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-gray-700 rounded px-4 py-2">
                    <span className="korean-font text-gray-300">퍼즐 크기:</span>
                    <span className="pixel-font text-blue-400">{selectedBody.gridSize}×{selectedBody.gridSize}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-700 rounded px-4 py-2">
                    <span className="korean-font text-gray-300">보상 별:</span>
                    <span className="korean-font text-yellow-400">⭐ {selectedBody.rewardStars}개</span>
                  </div>
                </div>

                {/* 설명 */}
                <p className="korean-font text-gray-400 text-sm mt-4 text-center italic">
                  {selectedBody.description}
                </p>
              </div>

              {/* 천체별 리더보드 */}
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h4 className="text-yellow-400 text-xl korean-font mb-4 text-center">🏆 리더보드</h4>
                
                {isLoadingLeaderboard ? (
                  <div className="text-center text-gray-400 korean-font">로딩 중...</div>
                ) : celestialLeaderboard ? (
                  <>
                    {/* TOP 5 */}
                    {celestialLeaderboard.topPlayers && celestialLeaderboard.topPlayers.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {celestialLeaderboard.topPlayers.map((player, index) => (
                          <div
                            key={player.userId}
                            className={`flex items-center justify-between p-2 rounded ${
                              index === 0 ? 'bg-yellow-900 bg-opacity-30' :
                              index === 1 ? 'bg-gray-700 bg-opacity-30' :
                              index === 2 ? 'bg-orange-900 bg-opacity-30' :
                              'bg-gray-700 bg-opacity-20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                              </span>
                              <span className="text-white text-sm">{player.nickname}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-blue-400 text-xs">⏱️ {Math.floor(player.playTime / 60)}분 {player.playTime % 60}초</p>
                              <p className="text-yellow-400 text-xs">⭐ {player.starsEarned}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-400 text-sm mb-4">아직 기록이 없습니다</p>
                    )}

                    {/* 내 기록 */}
                    {celestialLeaderboard.myRank ? (
                      <div className="border-t border-gray-700 pt-4">
                        <h5 className="text-blue-400 text-sm pixel-font mb-2 text-center">📍 내 기록</h5>
                        <div className="bg-blue-900 bg-opacity-30 rounded p-3 text-center">
                          <p className="text-white font-bold">
                            {celestialLeaderboard.myRank.rank}위 | 
                            ⏱️ {Math.floor(celestialLeaderboard.myRank.playTime / 60)}분 {celestialLeaderboard.myRank.playTime % 60}초 | 
                            ⭐ {celestialLeaderboard.myRank.starsEarned}
                          </p>
                          {celestialLeaderboard.myRank.rank > 5 && (
                            <p className="text-gray-400 text-xs mt-1">
                              💡 더 빠르게 풀어서 상위권에 도전하세요!
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-700 pt-4">
                        <p className="text-center text-gray-400 text-sm">
                          아직 플레이 기록이 없습니다<br/>
                          첫 플레이어가 되어보세요! 🚀
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-400 text-sm">
                    🔒 로그인하고 전 세계 유저와 경쟁하세요!
                  </div>
                )}
              </div>

              <button
                onClick={handleStartPuzzle}
                className="w-full pixel-font text-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white py-4 rounded-lg transition-all transform hover:scale-105 border-2 border-green-400"
                style={{
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)',
                }}
              >
                🎮 퍼즐 시작!
              </button>
            </div>
          ) : (
            /* 천체 선택 안내 */
            <div className="w-full flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <div className="text-8xl mb-6">🌍</div>
                <h3 className="pixel-font text-2xl text-white mb-4">천체를 선택하세요</h3>
                <p className="text-gray-400 text-sm mb-2">좌측에서 천체를 클릭하면</p>
                <p className="text-gray-400 text-sm mb-6">상세 정보와 리더보드가 표시됩니다</p>
                
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 max-w-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📊</span>
                    <span className="text-white text-sm">천체별 랭킹 확인</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">⏱️</span>
                    <span className="text-white text-sm">최고 기록 도전</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <span className="text-white text-sm">전 세계 유저와 경쟁</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
