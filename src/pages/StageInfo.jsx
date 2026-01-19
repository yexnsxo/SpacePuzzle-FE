import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StageInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const celestialBody = location.state?.celestialBody;
  
  // 리더보드 상태
  const [leaderboard, setLeaderboard] = useState(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (celestialBody?.id) {
      fetchLeaderboard();
    }
  }, [celestialBody?.id]);

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      console.log('🔐 로그인 상태:', accessToken ? '로그인됨' : '로그인 안됨');
      
      if (!accessToken) {
        setLeaderboard(null);
        return;
      }

      console.log(`📡 ${celestialBody?.name || '천체'} 리더보드 요청 시작...`);
      
      // 🔧 백엔드는 nasaId를 사용 (문자열 식별자: "earth", "mars", "proxima-b" 등)
      const celestialIdentifier = celestialBody.nasaId || celestialBody.id;
      
      if (!celestialIdentifier) {
        console.warn(`⚠️ ${celestialBody?.name}: 천체 식별자가 없어서 리더보드를 불러올 수 없습니다.`);
        setLeaderboard(null);
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

      console.log(`📥 리더보드 응답:`, response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 리더보드 데이터:`, data);
        setLeaderboard(data);
      } else {
        const errorText = await response.text();
        console.error(`❌ 리더보드 API 에러:`, response.status, errorText);
        setLeaderboard(null);
      }
    } catch (err) {
      console.error('❌ 리더보드 가져오기 실패:', err);
      setLeaderboard(null);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // celestialBody가 없으면 기본값 사용
  const stageData = celestialBody || {
    name: '지구',
    nameEn: 'Earth',
    description: '태양계에서 세 번째 행성으로, 생명체가 살고 있는 유일한 알려진 천체입니다. 푸른 대양과 대륙, 구름이 아름다운 조화를 이루고 있습니다.',
    difficulty: 2,
    sector: '태양계',
    image: null,
  };

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
            {/* 천체 이미지 */}
            {stageData.image ? (
              <img
                src={`https://spacepuzzle.onrender.com/api/proxy-image?url=${encodeURIComponent(stageData.image)}`}
                alt={stageData.name}
                className="w-64 h-64 rounded-full mb-6 object-cover"
                style={{
                  filter: 'grayscale(100%) contrast(1.2)',
                  boxShadow: '0 0 60px rgba(150, 150, 150, 0.6)',
                }}
                onError={(e) => {
                  // 프록시 실패 시 원본 이미지로 폴백
                  e.target.src = stageData.image;
                }}
              />
            ) : (
              <div 
                className="w-64 h-64 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 mb-6"
                style={{
                  filter: 'grayscale(100%) contrast(1.2)',
                  boxShadow: '0 0 60px rgba(150, 150, 150, 0.6), inset -30px -30px 60px rgba(0,0,0,0.5)',
                }}
              />
            )}
            
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
            <p className="text-gray-300 leading-relaxed">
              {stageData.description || '천체에 대한 설명이 없습니다.'}
            </p>
            </div>

            {/* 전세계 랭킹 (리더보드) */}
            <div className="bg-gray-900 bg-opacity-90 rounded-2xl p-6 border-2 border-yellow-500 flex-1">
              <h3 className="pixel-font text-2xl text-white mb-4 flex items-center gap-2">
                <span>🏆</span>
                <span>리더보드</span>
              </h3>
              
              {isLoadingLeaderboard ? (
                <div className="text-center text-gray-400 pixel-font py-8">로딩 중...</div>
              ) : leaderboard ? (
                <>
                  {/* TOP 5 */}
                  {leaderboard.topPlayers && leaderboard.topPlayers.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {leaderboard.topPlayers.map((player, index) => (
                        <div
                          key={player.userId}
                          className={`flex items-center justify-between p-3 rounded ${
                            index === 0 ? 'bg-yellow-900 bg-opacity-40' :
                            index === 1 ? 'bg-gray-700 bg-opacity-40' :
                            index === 2 ? 'bg-orange-900 bg-opacity-40' :
                            'bg-gray-700 bg-opacity-30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                            </span>
                            <span className="text-white font-bold">{player.nickname}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-blue-400">⏱️ {Math.floor(player.playTime / 60)}분 {player.playTime % 60}초</p>
                            <p className="text-yellow-400 text-sm">⭐ {player.starsEarned}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 mb-4 py-8">아직 기록이 없습니다</p>
                  )}

                  {/* 내 기록 */}
                  {leaderboard.myRank ? (
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-blue-400 pixel-font mb-3 text-center">📍 내 기록</h4>
                      <div className="bg-blue-900 bg-opacity-40 rounded p-4 text-center">
                        <p className="text-white font-bold text-lg">
                          {leaderboard.myRank.rank}위 | 
                          ⏱️ {Math.floor(leaderboard.myRank.playTime / 60)}분 {leaderboard.myRank.playTime % 60}초 | 
                          ⭐ {leaderboard.myRank.starsEarned}
                        </p>
                        {leaderboard.myRank.rank > 5 && (
                          <p className="text-gray-400 text-sm mt-2">
                            💡 더 빠르게 풀어서 상위권에 도전하세요!
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-700 pt-4">
                      <p className="text-center text-gray-400">
                        아직 플레이 기록이 없습니다<br/>
                        첫 플레이어가 되어보세요! 🚀
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  🔒 로그인하고 전 세계 유저와 경쟁하세요!
                </div>
              )}
            </div>

            {/* 플레이 버튼 */}
            <button
              onClick={() => navigate('/puzzle', { state: { celestialBody: stageData } })}
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
