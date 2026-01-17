import { useNavigate } from 'react-router-dom';

const Sector = () => {
  const navigate = useNavigate();
  
  const sectorData = {
    name: '태양계',
    nameEn: 'Solar System',
    requiredStars: 0,
    description: '태양을 중심으로 8개의 행성과 수많은 소행성, 혜성들이 공전하는 우리의 고향 행성계입니다.',
    celestialBodies: [
      { id: 1, name: '수성', nameEn: 'Mercury', locked: false },
      { id: 2, name: '금성', nameEn: 'Venus', locked: false },
      { id: 3, name: '지구', nameEn: 'Earth', locked: false },
      { id: 4, name: '화성', nameEn: 'Mars', locked: true },
      { id: 5, name: '목성', nameEn: 'Jupiter', locked: true },
      { id: 6, name: '토성', nameEn: 'Saturn', locked: true },
    ],
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-black">
      <div className="absolute inset-0">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <button
        onClick={() => navigate('/cockpit')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-gray-700 hover:border-blue-500"
      >
        <span className="text-xl">←</span>
        <span className="pixel-font">조종실로</span>
      </button>

      <div className="relative z-10 flex items-center justify-center h-full px-8">
        <div className="max-w-4xl w-full bg-gray-900 bg-opacity-90 rounded-2xl p-8 border-2 border-blue-500 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="pixel-font text-5xl text-white mb-2">{sectorData.name}</h1>
            <p className="text-blue-400 text-xl mb-4">{sectorData.nameEn}</p>
            
            <div className="inline-flex items-center gap-2 bg-yellow-600 bg-opacity-30 border border-yellow-500 rounded-full px-4 py-2">
              <span className="text-2xl">⭐</span>
              <span className="pixel-font text-white">필요한 별: {sectorData.requiredStars}개</span>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 mb-6">
            <p className="text-gray-300 leading-relaxed">{sectorData.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="pixel-font text-2xl text-white mb-4 flex items-center gap-2">
              <span>🌍</span>
              <span>탐험 가능한 천체</span>
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              {sectorData.celestialBodies.map((body) => (
                <div
                  key={body.id}
                  className="relative bg-gray-800 rounded-lg p-4 border-2 border-gray-600 opacity-80"
                >
                  <div 
                    className="w-20 h-20 mx-auto rounded-full mb-3 bg-gray-700"
                    style={{
                      filter: 'grayscale(100%)',
                    }}
                  />
                  
                  <p className="pixel-font text-center text-white text-sm">{body.name}</p>
                  <p className="text-center text-gray-400 text-xs">{body.nameEn}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-center text-sm mt-3">※ 섹터 진입 후 선택 가능</p>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/gameplay')}
              className="pixel-font text-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-12 py-4 rounded-lg transition-all transform hover:scale-105 border-2 border-blue-400 shadow-lg"
              style={{
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
              }}
            >
              ▶ 섹터 진입하기
            </button>
            <p className="text-gray-400 text-sm mt-2">천체를 선택하여 퍼즐을 시작하세요</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sector;
