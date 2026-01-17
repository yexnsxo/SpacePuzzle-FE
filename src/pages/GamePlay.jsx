import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { solarSystemBodies } from '../data/celestialData';

const GamePlay = () => {
  const navigate = useNavigate();
  const [selectedBody, setSelectedBody] = useState(null);
  
  // 실제 천체 데이터 사용
  const celestialBodies = solarSystemBodies;

  const handleBodyClick = (body) => {
    if (!body.locked) {
      setSelectedBody(body);
    }
  };

  const handleStartPuzzle = () => {
    if (selectedBody) {
      // 선택한 천체 데이터를 PuzzleGame으로 전달
      navigate('/puzzle', { state: { celestialBody: selectedBody } });
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-black">
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
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
        onClick={() => navigate('/sector')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-gray-700 hover:border-blue-500"
      >
        <span className="text-xl">←</span>
        <span className="pixel-font">섹터 소개로</span>
      </button>

      <div className="relative z-10 h-full flex">
        <div className="w-2/3 p-8 flex items-center justify-center">
          <div className="max-w-3xl w-full">
            <h2 className="pixel-font text-4xl text-white mb-8 text-center">천체 선택</h2>
            
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
                  {/* 천체 이미지 또는 플레이스홀더 */}
                  {body.image ? (
                    <img
                      src={body.image}
                      alt={body.name}
                      className={`w-28 h-28 mx-auto rounded-full mb-4 object-cover ${
                        body.locked ? 'filter grayscale' : 'filter grayscale'
                      }`}
                      style={{
                        boxShadow: body.locked ? 'none' : '0 0 30px rgba(150, 150, 150, 0.5)',
                      }}
                    />
                  ) : (
                    <div 
                      className={`w-28 h-28 mx-auto rounded-full mb-4 ${
                        body.locked ? 'bg-gray-700' : 'bg-gradient-to-br from-gray-300 to-gray-600'
                      }`}
                      style={{
                        filter: 'grayscale(100%)',
                        boxShadow: body.locked ? 'none' : '0 0 30px rgba(150, 150, 150, 0.5)',
                      }}
                    />
                  )}
                  
                  <p className="pixel-font text-center text-white text-lg mb-1">{body.name}</p>
                  <p className="text-center text-gray-400 text-sm">{body.nameEn}</p>
                  
                  {body.locked && (
                    <>
                      <div className="absolute top-4 right-4 text-3xl">🔒</div>
                      <p className="text-center text-yellow-500 text-xs mt-2">⭐ {body.requiredStars}개 필요</p>
                    </>
                  )}
                  
                  {body.cleared && !body.locked && (
                    <div className="absolute top-4 right-4 text-2xl">✅</div>
                  )}
                  
                  {selectedBody?.id === body.id && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-xl">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-1/3 bg-gray-900 bg-opacity-90 p-8 border-l-2 border-blue-500 flex items-center">
          {selectedBody ? (
            <div className="w-full">
              <h3 className="pixel-font text-3xl text-white mb-6 text-center">스테이지 정보</h3>
              
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                {/* 천체 이미지 */}
                {selectedBody.image ? (
                  <img
                    src={selectedBody.image}
                    alt={selectedBody.name}
                    className="w-40 h-40 mx-auto rounded-full mb-4 object-cover filter grayscale"
                    style={{
                      boxShadow: '0 0 40px rgba(150, 150, 150, 0.6)',
                    }}
                  />
                ) : (
                  <div 
                    className="w-40 h-40 mx-auto rounded-full mb-4 bg-gradient-to-br from-gray-300 to-gray-600"
                    style={{
                      filter: 'grayscale(100%)',
                      boxShadow: '0 0 40px rgba(150, 150, 150, 0.6)',
                    }}
                  />
                )}
                
                <h4 className="pixel-font text-2xl text-white text-center mb-2">{selectedBody.name}</h4>
                <p className="text-blue-400 text-center mb-4">{selectedBody.nameEn}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-gray-700 rounded px-4 py-2">
                    <span className="text-gray-300">난이도:</span>
                    <span className={`pixel-font ${
                      selectedBody.difficultyKo === '쉬움' ? 'text-green-400' :
                      selectedBody.difficultyKo === '보통' ? 'text-yellow-400' :
                      selectedBody.difficultyKo === '어려움' ? 'text-orange-400' :
                      selectedBody.difficultyKo === '매우 어려움' ? 'text-red-400' :
                      'text-purple-400'
                    }`}>{selectedBody.difficultyKo}</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-gray-700 rounded px-4 py-2">
                    <span className="text-gray-300">퍼즐 크기:</span>
                    <span className="pixel-font text-blue-400">{selectedBody.gridSize}×{selectedBody.gridSize}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-700 rounded px-4 py-2">
                    <span className="text-gray-300">보상 별:</span>
                    <span className="pixel-font text-yellow-400">⭐ {selectedBody.rewardStars}개</span>
                  </div>
                </div>

                {/* 설명 */}
                <p className="text-gray-400 text-sm mt-4 text-center italic">
                  {selectedBody.description}
                </p>
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
            <div className="text-center w-full">
              <p className="text-gray-400 text-lg">천체를 선택하세요</p>
              <p className="text-gray-500 text-sm mt-2">좌측에서 천체를 클릭하면<br/>상세 정보가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
