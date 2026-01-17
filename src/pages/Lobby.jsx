import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import spaceshipInterior from '../assets/login/spaceship-interior.jpg';

/**
 * 로비 페이지 (우주선 내부)
 * 로그인 후 메인 화면 - 2개 방으로 구성
 */
const Lobby = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('main'); // 'main' or 'gallery'

  useEffect(() => {
    // localStorage에서 유저 정보 가져오기
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // 로그인 정보가 없으면 로그인 페이지로
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const goToGallery = () => {
    setCurrentRoom('gallery');
  };

  const goToMain = () => {
    setCurrentRoom('main');
  };

  const goToCockpit = () => {
    navigate('/cockpit');
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
        }}
      />
      
      {/* 살짝 어두운 오버레이 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 10,
        }}
      />

      <div className="relative z-20 p-6">
        {/* 왼쪽 상단 탭 메뉴 (메인 방에서만 표시) */}
        {currentRoom === 'main' && (
          <div className="flex flex-col gap-3" style={{ width: 'fit-content' }}>
            {/* 메뉴 */}
            <button className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500">
              <span className="text-2xl">☰</span>
              <span className="pixel-font text-lg">메뉴</span>
            </button>

            {/* 리더보드 */}
            <button className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500">
              <span className="text-2xl">📊</span>
              <span className="pixel-font text-lg">리더보드</span>
            </button>

            {/* 업적 */}
            <button className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500">
              <span className="text-2xl">🏆</span>
              <span className="pixel-font text-lg">업적</span>
            </button>

            {/* 상점 */}
            <button className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500">
              <span className="text-2xl">🛒</span>
              <span className="pixel-font text-lg">상점</span>
            </button>

            {/* 설정 */}
            <button className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500">
              <span className="text-2xl">⚙️</span>
              <span className="pixel-font text-lg">설정</span>
            </button>
          </div>
        )}

        {/* 유저 정보 (오른쪽 상단) */}
        {user && (
          <div className="absolute top-6 right-6 text-right">
            <p className="text-white text-lg mb-2">
              <span className="text-blue-400 font-bold">{user.nickname}</span>님
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* 방 전환 화살표 (왼쪽) */}
        {currentRoom === 'main' && (
          <div className="absolute left-0" style={{ top: '60%' }}>
            <button
              onClick={goToGallery}
              className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white p-4 rounded-r-lg transition-all border-r border-t border-b border-gray-700 hover:border-blue-500"
              title="갤러리로 이동"
            >
              <span className="text-3xl">←</span>
            </button>
            <p className="text-white text-sm mt-2 pl-2 pixel-font">모은 액자들</p>
          </div>
        )}

        {/* 조종실로 이동 화살표 (오른쪽) */}
        {currentRoom === 'main' && (
          <div className="absolute right-0" style={{ top: '60%' }}>
            <button
              onClick={goToCockpit}
              className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white p-4 rounded-l-lg transition-all border-l border-t border-b border-gray-700 hover:border-blue-500"
              title="조종실로 이동"
            >
              <span className="text-3xl">→</span>
            </button>
            <p className="text-white text-sm mt-2 pr-2 pixel-font">조종실</p>
          </div>
        )}

        {/* 방 전환 화살표 (오른쪽) */}
        {currentRoom === 'gallery' && (
          <div className="absolute right-0" style={{ top: '70%' }}>
            <button
              onClick={goToMain}
              className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white p-4 rounded-l-lg transition-all border-l border-t border-b border-gray-700 hover:border-blue-500"
              title="메인 방으로 돌아가기"
            >
              <span className="text-3xl">→</span>
            </button>
            <p className="text-white text-sm mt-2 pr-2 pixel-font">돌아가기</p>
          </div>
        )}

        {/* 중앙 콘텐츠 영역 */}
        <div 
          className="absolute inset-0 flex justify-center pointer-events-none" 
          style={{ 
            alignItems: currentRoom === 'gallery' ? 'flex-start' : 'center',
            paddingTop: currentRoom === 'gallery' ? '200px' : '0'
          }}
        >
          <div className="pointer-events-auto">
            {currentRoom === 'main' ? (
              /* 메인 방 (우주선 내부) */
              <div className="text-center">
                <h2 className="pixel-font text-3xl text-white mb-4">우주선 내부</h2>
              </div>
            ) : (
              /* 갤러리 방 (액자들) */
              <div className="text-center">
                <h2 className="pixel-font text-3xl text-white mb-8">🖼️ 갤러리</h2>
                
                {/* 액자 그리드 */}
                <div className="grid grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div
                      key={num}
                      className="w-32 h-32 bg-gray-800 border-4 border-amber-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-amber-500 transition-all transform hover:scale-105"
                      style={{
                        boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      <span className="text-4xl">🌌</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
