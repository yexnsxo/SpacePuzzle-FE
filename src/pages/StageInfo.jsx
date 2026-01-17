import { useNavigate, useLocation } from 'react-router-dom';

const StageInfo = () => {
  const navigate = useNavigate();
  
  // 더미 데이터 (나중에 API나 props로 받을 예정)
  const stageData = {
    name: '지구',
    nameEn: 'Earth',
    description: '태양계에서 세 번째 행성으로, 생명체가 살고 있는 유일한 알려진 천체입니다. 푸른 대양과 대륙, 구름이 아름다운 조화를 이루고 있습니다.',
    difficulty: 2,
    sector: '태양계',
  };

  // 더미 랭킹 데이터
  const rankings = [
    { rank: 1, nickname: '우주탐험가', time: '00:45', stars: 3 },
    { rank: 2, nickname: 'SpaceMaster', time: '00:52', stars: 3 },
    { rank: 3, nickname: '퍼즐왕', time: '01:03', stars: 3 },
    { rank: 4, nickname: 'Galaxy_Pro', time: '01:15', stars: 2 },
    { rank: 5, nickname: '별빛여행자', time: '01:28', stars: 2 },
  ];

  const getDifficultyText = (level) => {
    const difficulties = ['매우 쉬움', '쉬움', '보통', '어려움', '매우 어려움'];
    return difficulties[level] || '보통';
  };

  const getDifficultyColor = (level) => {
    const colors = ['text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
    return colors[level] || 'text-yellow-400';
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-black">
      {/* 별 배경 */}
      <div className="absolute inset-0">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/sector')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-gray-700 hover:border-blue-500"
      >
        <span className="text-xl">←</span>
        <span className="pixel-font">섹터로</span>
      </button>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex items-center justify-center h-full px-8 py-20">
        <div className="max-w-5xl w-full grid grid-cols-2 gap-6">
          
          {/* 왼쪽: 천체 이미지 */}
          <div className="bg-gray-900 bg-opacity-90 rounded-2xl p-8 border-2 border-purple-500 flex flex-col items-center justify-center">
            {/* 더미 천체 이미지 (흑백, 누끼) */}
            <div 
              className="w-64 h-64 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 mb-6"
              style={{
                filter: 'grayscale(100%) contrast(1.2)',
                boxShadow: '0 0 60px rgba(150, 150, 150, 0.6), inset -30px -30px 60px rgba(0,0,0,0.5)',
              }}
            />
            
            <h1 className="pixel-font text-5xl text-white mb-2">{stageData.name}</h1>
            <p className="text-gray-400 text-xl mb-4">{stageData.nameEn}</p>
            
            {/* 난이도 */}
            <div className="flex items-center gap-2 bg-gray-800 bg-opacity-70 rounded-full px-6 py-2">
              <span className="text-white">난이도:</span>
              <span className={`pixel-font text-lg ${getDifficultyColor(stageData.difficulty)}`}>
                {getDifficultyText(stageData.difficulty)}
              </span>
              <span className="text-yellow-400">
                {'★'.repeat(stageData.difficulty + 1)}
              </span>
            </div>
          </div>

          {/* 오른쪽: 정보 */}
          <div className="flex flex-col gap-6">
            
            {/* 천체 설명 */}
            <div className="bg-gray-900 bg-opacity-90 rounded-2xl p-6 border-2 border-blue-500">
              <h3 className="pixel-font text-2xl text-white mb-3 flex items-center gap-2">
                <span>📖</span>
                <span>천체 정보</span>
              </h3>
              <p className="text-gray-300 leading-relaxed">{stageData.description}</p>
            </div>

            {/* 전세계 랭킹 */}
            <div className="bg-gray-900 bg-opacity-90 rounded-2xl p-6 border-2 border-yellow-500 flex-1">
              <h3 className="pixel-font text-2xl text-white mb-4 flex items-center gap-2">
                <span>🏆</span>
                <span>전세계 랭킹</span>
              </h3>
              
              <div className="space-y-2">
                {rankings.map((user) => (
                  <div 
                    key={user.rank}
                    className="flex items-center justify-between bg-gray-800 bg-opacity-50 rounded-lg px-4 py-2 hover:bg-opacity-70 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`pixel-font text-xl ${
                        user.rank === 1 ? 'text-yellow-400' : 
                        user.rank === 2 ? 'text-gray-300' : 
                        user.rank === 3 ? 'text-orange-400' : 'text-gray-400'
                      }`}>
                        #{user.rank}
                      </span>
                      <span className="text-white">{user.nickname}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-blue-400 font-mono">{user.time}</span>
                      <span className="text-yellow-400">{'⭐'.repeat(user.stars)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 플레이 버튼 */}
            <button
              onClick={() => alert('게임 플레이 화면으로 이동 (추후 구현)')}
              className="pixel-font text-3xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white py-4 rounded-xl transition-all transform hover:scale-105 border-2 border-green-400 shadow-lg"
              style={{
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)',
              }}
            >
              ▶ 퍼즐 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageInfo;
