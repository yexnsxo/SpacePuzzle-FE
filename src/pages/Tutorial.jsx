import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import spaceshipInterior from '../assets/login/spaceship-interior.jpg';

/**
 * 신규 유저 컷신 페이지
 */
const Tutorial = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);

  const cutscenes = [
    {
      text: "우주 탐험가 여러분, 환영합니다.",
      subText: "당신은 지금 우주선에 탑승했습니다.",
    },
    {
      text: "당신의 임무는...",
      subText: "우주의 신비를 풀고, 천체들을 수집하는 것입니다.",
    },
    {
      text: "첫 번째 임무를 시작하겠습니다.",
      subText: "지구 퍼즐을 완성하세요!",
    },
  ];

  useEffect(() => {
    setFadeIn(true);
    
    // 🔧 게스트 자원 확인 (이미 Login.jsx에서 초기화됨, 여기서는 확인만)
    const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"stars": 0, "credits": 20, "spaceParts": 0}');
    console.log('📚 튜토리얼 시작 - 현재 자원:', guestStats);
    
    // 각 씬 자동 넘김 (5초마다)
    const sceneTimer = setInterval(() => {
      setCurrentScene(prev => {
        if (prev < cutscenes.length - 1) {
          return prev + 1;
        } else {
          // 마지막 씬 후 지구 퍼즐 게임으로
          clearInterval(sceneTimer);
          setTimeout(() => {
            console.log('📚 튜토리얼 완료 - 지구 퍼즐로 이동');
            navigate('/puzzle', {
              state: {
                celestialBody: {
                  id: 'earth',
                  name: '지구',
                  nameEn: 'Earth',
                  difficulty: '쉬움',
                  gridSize: 3,
                  rewardStars: 3,
                  image: null,
                },
                sectorSlug: 'solar-system',
              }
            });
          }, 3000);
          return prev;
        }
      });
    }, 5000);

    return () => clearInterval(sceneTimer);
  }, [navigate]);

  const handleSkip = () => {
    navigate('/puzzle', {
      state: {
        celestialBody: {
          id: 'earth',
          name: '지구',
          nameEn: 'Earth',
          difficulty: '쉬움',
          gridSize: 3,
          rewardStars: 3,
          image: null,
        },
        sectorSlug: 'solar-system',
      }
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 우주선 내부 배경 */}
      <img
        src={spaceshipInterior}
        alt="Spaceship Interior"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          zIndex: 0,
          opacity: 0.3,
        }}
      />
      
      {/* 어두운 오버레이 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10,
        }}
      />

      {/* Skip 버튼 */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-30 pixel-font bg-gray-700 bg-opacity-80 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-gray-500"
      >
        Skip →
      </button>

      {/* 컷신 텍스트 */}
      <div className="relative z-20 flex items-center justify-center h-full">
        <div 
          className={`text-center max-w-3xl px-8 transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
          key={currentScene}
        >
          <h1 className="pixel-font text-5xl text-white mb-8 leading-relaxed">
            {cutscenes[currentScene].text}
          </h1>
          
          <p className="text-2xl text-gray-300 leading-relaxed mb-12">
            {cutscenes[currentScene].subText}
          </p>

          {/* 진행 표시 */}
          <div className="flex justify-center gap-3">
            {cutscenes.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentScene 
                    ? 'bg-blue-500 w-8' 
                    : index < currentScene 
                    ? 'bg-blue-700' 
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="absolute bottom-8 left-0 right-0 z-20 text-center">
        <p className="text-gray-400 text-sm">
          {currentScene === cutscenes.length - 1 
            ? '잠시 후 게임이 시작됩니다...' 
            : '자동으로 넘어갑니다...'}
        </p>
      </div>
    </div>
  );
};

export default Tutorial;
