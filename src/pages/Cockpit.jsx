import { useNavigate } from 'react-router-dom';

/**
 * 조종실 페이지
 * 우주 배경 + 하단 조종칸
 */
const Cockpit = () => {
  const navigate = useNavigate();

  const goBackToLobby = () => {
    navigate('/lobby');
  };

  const goToSector = () => {
    navigate('/sector');
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
        <div className="relative z-10 flex items-center justify-center h-full">
          {/* 태양계 섹터 (더미) */}
          <div 
            className="cursor-pointer transform hover:scale-110 transition-all"
            onClick={goToSector}
          >
            {/* 더미 행성 이미지 */}
            <div className="relative">
              {/* 행성 */}
              <div 
                className="w-40 h-40 rounded-full bg-gradient-to-br from-orange-500 via-yellow-400 to-orange-600"
                style={{
                  boxShadow: '0 0 60px rgba(251, 146, 60, 0.8), inset -20px -20px 40px rgba(0,0,0,0.3)',
                }}
              />
              {/* 고리 (토성 스타일) */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-8 rounded-full bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-60"
                style={{
                  transform: 'translate(-50%, -50%) rotateX(75deg)',
                }}
              />
              {/* 섹터 이름 */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                <h3 className="pixel-font text-2xl text-white mb-1">태양계</h3>
                <p className="text-gray-400 text-sm">Solar System</p>
              </div>
            </div>
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
    </div>
  );
};

export default Cockpit;
