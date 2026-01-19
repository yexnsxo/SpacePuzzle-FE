import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * 조종실 페이지
 * 우주 배경 + 하단 조종칸
 */

// 섹터 데이터
const SECTORS = [
  {
    id: 1,
    slug: 'solar-system',
    name: '태양계',
    nameEn: 'Solar System',
    requiredStars: 0,
    color: 'from-orange-500 via-yellow-400 to-orange-600',
    glowColor: 'rgba(251, 146, 60, 0.8)',
  },
  {
    id: 2,
    slug: 'exoplanet-systems',
    name: '외계 행성',
    nameEn: 'Exoplanet Systems',
    requiredStars: 15,
    color: 'from-purple-500 via-pink-400 to-purple-600',
    glowColor: 'rgba(168, 85, 247, 0.8)',
  },
  {
    id: 3,
    slug: 'nebulae',
    name: '성운',
    nameEn: 'Nebulae',
    requiredStars: 28,
    color: 'from-cyan-500 via-blue-400 to-cyan-600',
    glowColor: 'rgba(6, 182, 212, 0.8)',
  },
  {
    id: 4,
    slug: 'galaxies',
    name: '은하',
    nameEn: 'Galaxies',
    requiredStars: 45,
    color: 'from-violet-500 via-purple-400 to-violet-600',
    glowColor: 'rgba(139, 92, 246, 0.8)',
  },
  {
    id: 5,
    slug: 'deep-space-extremes',
    name: '심연',
    nameEn: 'Deep Space',
    requiredStars: 65,
    color: 'from-red-500 via-pink-400 to-red-600',
    glowColor: 'rgba(239, 68, 68, 0.8)',
  },
];

const Cockpit = () => {
  const navigate = useNavigate();
  const [userStars, setUserStars] = useState(0);

  useEffect(() => {
    // 별 개수 가져오기 (페이지 진입할 때마다 새로고침)
    const loadUserStars = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (accessToken) {
          // 로그인 상태: 백엔드에서 별 개수 가져오기
          console.log('🔐 로그인 상태 - 백엔드에서 별 개수 가져오기');
          const response = await fetch('https://spacepuzzle.onrender.com/user/resources', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ 백엔드 별 개수:', data.stars);
            setUserStars(data.stars || 0);
            
            // localStorage에도 캐싱 (오프라인 대비)
            const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"stars": 0, "credits": 20, "spaceParts": 0}');
            guestStats.stars = data.stars || 0;
            guestStats.credits = data.credits || 20;
            guestStats.spaceParts = data.spaceParts || 0;
            localStorage.setItem('guestStats', JSON.stringify(guestStats));
          } else {
            console.error('❌ 백엔드 별 개수 가져오기 실패:', response.status);
            // 실패 시 localStorage 폴백
            const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"stars": 0}');
            setUserStars(guestStats.stars || 0);
          }
        } else {
          // 게스트 모드: localStorage에서 별 개수 가져오기
          console.log('👤 게스트 모드 - localStorage에서 별 개수 가져오기');
          const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"stars": 0}');
          console.log('🚀 Cockpit - 별 개수 로드:', guestStats);
          setUserStars(guestStats.stars || 0);
        }
      } catch (error) {
        console.error('❌ 별 개수 로드 실패:', error);
        // 에러 시 localStorage 폴백
        const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"stars": 0}');
        setUserStars(guestStats.stars || 0);
      }
    };
    
    loadUserStars();
    
    // 페이지에 포커스될 때마다 별 개수 새로고침
    window.addEventListener('focus', loadUserStars);
    
    return () => {
      window.removeEventListener('focus', loadUserStars);
    };
  }, []);

  const goBackToLobby = () => {
    navigate('/lobby');
  };

  const handleSectorClick = (sector) => {
    if (userStars >= sector.requiredStars) {
      // 해금된 섹터 클릭 시 섹터 상세로 이동
      navigate('/sector', { state: { sectorSlug: sector.slug } });
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 우주 배경 (상단 80%) */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-black"
        style={{ height: '80%' }}
      >
        {/* 별들 효과 */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>

        {/* 섹터 선택 영역 */}
        <div className="relative z-10 flex items-center justify-center h-full px-8">
          <div className="flex items-center justify-center gap-8 max-w-7xl w-full">
            {SECTORS.map((sector) => {
              const isLocked = userStars < sector.requiredStars;
              
              return (
                <div
                  key={sector.id}
                  className={`relative ${
                    isLocked 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'cursor-pointer transform hover:scale-110 transition-all'
                  }`}
                  onClick={() => handleSectorClick(sector)}
                >
                  {/* 행성 */}
                  <div className="relative">
                    <div 
                      className={`w-32 h-32 rounded-full bg-gradient-to-br ${
                        isLocked ? 'from-gray-600 via-gray-500 to-gray-700' : sector.color
                      }`}
                      style={{
                        boxShadow: isLocked 
                          ? '0 0 30px rgba(100, 100, 100, 0.3), inset -15px -15px 30px rgba(0,0,0,0.5)' 
                          : `0 0 50px ${sector.glowColor}, inset -15px -15px 30px rgba(0,0,0,0.3)`,
                      }}
                    />
                    
                    {/* 잠금 아이콘 */}
                    {isLocked && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl">
                        🔒
                      </div>
                    )}
                    
                    {/* 섹터 이름 */}
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-40">
                      <h3 className={`pixel-font text-xl mb-1 ${
                        isLocked ? 'text-gray-500' : 'text-white'
                      }`}>
                        {sector.name}
                      </h3>
                      <p className={`text-xs ${
                        isLocked ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {sector.nameEn}
                      </p>
                      
                      {/* 필요한 별 개수 */}
                      {isLocked && (
                        <div className="mt-2">
                          <p className="text-yellow-500 text-xs">⭐ {sector.requiredStars}개 필요</p>
                          <p className="text-gray-500 text-xs">
                            ({userStars}/{sector.requiredStars})
                          </p>
                        </div>
                      )}
                      
                      {/* 해금됨 표시 */}
                      {!isLocked && (
                        <div className="mt-2">
                          <p className="text-green-400 text-xs">✓ 해금됨</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 조종칸 이미지 (하단 20%) */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gray-800"
        style={{ height: '20%' }}
      >
        {/* 더미 조종칸 이미지 (나중에 실제 이미지로 교체) */}
        <div className="w-full h-full bg-gradient-to-t from-gray-900 via-gray-700 to-gray-600 flex items-center justify-center border-t-4 border-gray-500">
          <div className="text-center">
            <p className="pixel-font text-2xl text-white mb-2">🎮 조종 패널</p>
            <p className="text-gray-400 text-sm">(나중에 조종칸 이미지로 교체 예정)</p>
          </div>
        </div>
      </div>

      {/* 왼쪽 상단 - 돌아가기 버튼 */}
      <button
        onClick={goBackToLobby}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-gray-700 hover:border-blue-500"
      >
        <span className="text-xl">←</span>
        <span className="pixel-font">우주선으로</span>
      </button>

      {/* 오른쪽 상단 - 별 개수 표시 */}
      <div className="absolute top-6 right-6 z-20 bg-gray-900 bg-opacity-90 text-white px-6 py-3 rounded-lg border border-yellow-500">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="pixel-font text-xl text-yellow-400">{userStars}</p>
            <p className="text-gray-400 text-xs">보유 별</p>
          </div>
        </div>
      </div>

      {/* 중앙 상단 - 안내 메시지 */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 bg-gray-900 bg-opacity-90 text-white px-6 py-3 rounded-lg border border-blue-500">
        <p className="pixel-font text-center">섹터를 선택하여 퍼즐 여행을 시작하세요</p>
      </div>
    </div>
  );
};

export default Cockpit;
