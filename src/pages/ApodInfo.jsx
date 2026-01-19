import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ApodInfo = () => {
  const navigate = useNavigate();
  const [apodData, setApodData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 리더보드 상태
  const [leaderboard, setLeaderboard] = useState(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    fetchApodData();
    fetchLeaderboard();
  }, []);

  const fetchApodData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 백엔드에서 APOD 데이터 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const headers = accessToken 
        ? { Authorization: `Bearer ${accessToken}` }
        : {};

      const response = await fetch(
        'https://spacepuzzle.onrender.com/apod/today',
        { headers }
      );

      if (!response.ok) {
        throw new Error(`APOD 데이터를 불러오지 못했습니다. (${response.status})`);
      }

      const data = await response.json();
      setApodData(data);
    } catch (err) {
      console.error('APOD 데이터 로드 실패:', err);
      setError(err.message || 'APOD 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      console.log('🔐 로그인 상태:', accessToken ? '로그인됨' : '로그인 안됨');
      
      if (!accessToken) {
        // 로그인하지 않은 경우 리더보드를 가져오지 않음
        setLeaderboard(null);
        return;
      }

      console.log('📡 APOD 리더보드 요청 시작...');
      // APOD는 nasaId가 'apod'
      const response = await fetch(
        'https://spacepuzzle.onrender.com/celestial-objects/apod/leaderboard',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📥 APOD 리더보드 응답:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ APOD 리더보드 데이터:', data);
        setLeaderboard(data);
      } else {
        const errorText = await response.text();
        console.error('❌ APOD 리더보드 API 에러:', response.status, errorText);
        setLeaderboard(null);
      }
    } catch (err) {
      console.error('❌ 리더보드 가져오기 실패:', err);
      setLeaderboard(null);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const handleStartPuzzle = async () => {
    if (!apodData) return;

    try {
      // 백엔드에 APOD 퍼즐 시작 요청
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        alert('로그인이 필요합니다!');
        navigate('/login');
        return;
      }

      // APOD 퍼즐 페이지로 이동
      const originalImageUrl = apodData.hdurl || apodData.url;
      
      console.log('📷 원본 이미지 URL:', originalImageUrl);
      
      // 백엔드 프록시를 통해 이미지 로드 (CORS 우회)
      // 백엔드에서 /api/proxy-image API를 구현해야 합니다
      const proxyImageUrl = `https://spacepuzzle.onrender.com/api/proxy-image?url=${encodeURIComponent(originalImageUrl)}`;
      
      console.log('📷 프록시 이미지 URL:', proxyImageUrl);
      
      navigate('/puzzle', {
        state: {
          celestialBody: {
            id: 'apod',
            name: apodData.title || 'Astronomy Picture of the Day',
            difficulty: '스페셜',
            gridSize: 7, // APOD는 7x7 고정
            image: proxyImageUrl, // 백엔드 프록시 사용
            isApod: true,
          },
          nasaId: 'apod',
        },
      });
    } catch (err) {
      console.error('APOD 퍼즐 시작 실패:', err);
      alert('퍼즐을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-black">
      {/* 별 배경 */}
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-pulse"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 2 + 's',
          }}
        />
      ))}

      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate('/lobby')}
        className="absolute top-6 left-6 z-30 pixel-font bg-gray-800 bg-opacity-80 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-600 hover:border-blue-400"
      >
        ← 로비로 돌아가기
      </button>

      {/* 메인 콘텐츠 */}
      <div className="absolute inset-0 flex items-start justify-center z-10 p-8 overflow-y-auto">
        <div className="max-w-4xl w-full bg-gray-900 bg-opacity-90 rounded-2xl p-8 shadow-2xl border-4 border-blue-500 my-8">
          {isLoading ? (
            <div className="text-center">
              <p className="pixel-font text-2xl text-white mb-4">🌌 오늘의 천문 사진 불러오는 중...</p>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto"></div>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="pixel-font text-2xl text-red-400 mb-4">❌ 오류 발생</p>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={fetchApodData}
                className="pixel-font bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-all"
              >
                다시 시도
              </button>
            </div>
          ) : apodData ? (
            <div className="space-y-6">
              {/* 제목 */}
              <h1 className="pixel-font text-3xl text-center text-blue-400 mb-2">
                🌟 Astronomy Picture of the Day
              </h1>
              <h2 className="text-2xl text-center text-white font-bold mb-4">
                {apodData.title}
              </h2>

              {/* 날짜 */}
              <p className="text-center text-gray-400 mb-4">
                📅 {apodData.date}
              </p>

              {/* 이미지 */}
              {apodData.media_type === 'image' ? (
                <div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden border-4 border-blue-500">
                  <img
                    src={`https://spacepuzzle.onrender.com/api/proxy-image?url=${encodeURIComponent(apodData.url)}`}
                    alt={apodData.title}
                    className="w-full h-full object-contain bg-black"
                    onError={(e) => {
                      // 프록시 실패 시 원본 이미지로 폴백
                      e.target.src = apodData.url;
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-yellow-400 mb-6">
                  ⚠️ 오늘은 이미지가 아닌 영상입니다. 퍼즐을 만들 수 없습니다.
                </div>
              )}

              {/* 설명 */}
              <div className="bg-gray-800 bg-opacity-80 rounded-lg p-6 mb-6">
                <h3 className="pixel-font text-xl text-blue-400 mb-3">📝 설명</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {apodData.explanation}
                </p>
              </div>

              {/* 저작권 */}
              {apodData.copyright && (
                <p className="text-center text-gray-500 text-sm">
                  © {apodData.copyright}
                </p>
              )}

              {/* 보상 정보 */}
              {apodData.media_type === 'image' && (
                <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4 mb-4 border-2 border-purple-500">
                  <p className="text-center text-purple-300 mb-2">🎁 스페셜 보상!</p>
                  <div className="flex justify-center">
                    <div className="text-center">
                      <span className="text-5xl">🔧</span>
                      <p className="text-purple-400 font-bold text-3xl mt-2">1</p>
                    </div>
                  </div>
                  <p className="text-center text-gray-400 text-sm mt-2">우주 부품 1개</p>
                </div>
              )}

              {/* 리더보드 */}
              {apodData.media_type === 'image' && (
                <div className="bg-gray-800 bg-opacity-80 rounded-lg p-6 mb-6">
                  <h3 className="text-yellow-400 text-2xl pixel-font mb-4 text-center">🏆 리더보드</h3>
                  
                  {isLoadingLeaderboard ? (
                    <div className="text-center text-gray-400 pixel-font">로딩 중...</div>
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
                        <p className="text-center text-gray-400 mb-4">아직 기록이 없습니다</p>
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
                    <div className="text-center text-gray-400">
                      🔒 로그인하고 전 세계 유저와 경쟁하세요!
                    </div>
                  )}
                </div>
              )}

              {/* 퍼즐 시작 버튼 */}
              {apodData.media_type === 'image' && (
                <button
                  onClick={handleStartPuzzle}
                  className="w-full pixel-font text-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-lg transition-all border-4 border-blue-400 shadow-lg"
                >
                  🧩 이 이미지로 퍼즐 시작하기
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ApodInfo;
