import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PuzzleScene } from '../game/phaser/PuzzleScene';
import { supabase } from '../supabaseClient';

/**
 * Phaser 기반 퍼즐 게임 컴포넌트
 * 기존 퍼즐 로직(PuzzleEngine, Group, Piece)은 완전히 동일하게 유지
 */
const PuzzleGamePhaser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const gameContainerRef = useRef(null);
  const phaserGameRef = useRef(null);
  const sceneRef = useRef(null);
  
  // 천체 데이터
  const celestialBody = location.state?.celestialBody || {
    id: 'earth',
    name: '지구',
    difficulty: '쉬움',
    gridSize: 3,
    image: null,
  };

  const [puzzleData, setPuzzleData] = useState(null);
  const [isPuzzleLoading, setIsPuzzleLoading] = useState(true);
  const [puzzleError, setPuzzleError] = useState(null);
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  
  const timeRef = useRef(0);
  const completeRequestRef = useRef(false);

  const nasaIdFromState = location.state?.nasaId
    || celestialBody.nasaId
    || (typeof celestialBody.nameEn === 'string' ? celestialBody.nameEn.toLowerCase() : null)
    || 'earth';

  const puzzleSeed = puzzleData?.puzzleConfig?.seed ?? puzzleData?.puzzleSeed;
  const puzzleBody = {
    ...celestialBody,
    gridSize: puzzleData?.puzzleConfig?.gridSize ?? puzzleData?.gridSize ?? celestialBody.gridSize,
    image: puzzleData?.imageUrl ?? celestialBody.image,
    difficulty: puzzleData?.difficulty ?? celestialBody.difficulty,
  };

  // 퍼즐 데이터 페칭 (기존 로직 동일)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchPuzzleData = async () => {
      setIsPuzzleLoading(true);
      setPuzzleError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        
        const isApodPuzzle = celestialBody.isApod || nasaIdFromState === 'apod';
        
        let payload;
        if (isApodPuzzle) {
          payload = {
            nasaId: 'apod',
            title: celestialBody.name || 'APOD',
            imageUrl: celestialBody.image,
            puzzleType: 'jigsaw',
            difficulty: celestialBody.difficulty || '스페셜',
            gridSize: 7,
            rewardStars: 0,
            puzzleSeed: Date.now(),
            puzzleConfig: {
              gridSize: 7,
              seed: Date.now(),
            }
          };
        } else {
          const response = await fetch(
            `https://spacepuzzle.onrender.com/celestial-objects/${nasaIdFromState}/puzzle`,
            { headers, signal: controller.signal }
          );

          if (!response.ok) {
            throw new Error(`퍼즐 데이터를 불러오지 못했습니다. (${response.status})`);
          }

          payload = await response.json();
        }
        
        if (isMounted) {
          setPuzzleData(payload);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (isMounted) {
          setPuzzleError(error.message || '퍼즐 데이터를 불러오는 중 오류가 발생했습니다.');
          setPuzzleData(null);
        }
      } finally {
        if (isMounted) {
          setIsPuzzleLoading(false);
        }
      }
    };

    fetchPuzzleData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [nasaIdFromState]);

  // 타이머 (기존 로직 동일)
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // Phaser 게임 초기화
  useEffect(() => {
    if (isPuzzleLoading || puzzleError || !puzzleData || !gameContainerRef.current) return;
    if (phaserGameRef.current) return; // 이미 생성됨
    if (!puzzleBody.image) {
      setPuzzleError('이미지 정보를 찾을 수 없습니다.');
      return;
    }

    console.log('🎮 Phaser 게임 초기화 시작');

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 800,
      parent: gameContainerRef.current,
      backgroundColor: '#000000',
      scene: PuzzleScene,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      }
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Scene이 시작되면 데이터 전달
    game.events.once('ready', () => {
      const scene = game.scene.getScene('PuzzleScene');
      sceneRef.current = scene;
      
      scene.scene.start('PuzzleScene', {
        puzzleConfig: {
          gridSize: puzzleBody.gridSize,
          seed: Number.isFinite(Number(puzzleSeed)) ? Number(puzzleSeed) : Date.now(),
        },
        imageUrl: puzzleBody.image,
        onComplete: handlePuzzleComplete,
        onProgressUpdate: (prog) => setProgress(prog),
        onPause: () => setIsPaused(true),
      });
    });

    return () => {
      if (phaserGameRef.current) {
        console.log('🎮 Phaser 게임 종료');
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [isPuzzleLoading, puzzleError, puzzleData]);

  // 퍼즐 완료 처리 (기존 로직 동일)
  const handlePuzzleComplete = async () => {
    if (completeRequestRef.current) return;
    completeRequestRef.current = true;

    console.log('✅ 퍼즐 완성!');
    
    const finalTime = timeRef.current;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        console.log('🎮 게스트 모드 - 서버 기록 없음');
        const stars = calculateStars(finalTime, puzzleBody.gridSize);
        setCompletionData({
          clearTime: finalTime,
          stars: stars,
          isGuest: true,
        });
        setShowComplete(true);
        return;
      }

      const celestialIdentifier = celestialBody.nasaId || celestialBody.id;
      if (!celestialIdentifier) {
        console.error('❌ celestialId 누락');
        return;
      }

      const response = await fetch(
        `https://spacepuzzle.onrender.com/celestial-objects/${encodeURIComponent(celestialIdentifier)}/puzzle/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ clearTime: finalTime }),
        }
      );

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎉 서버 응답:', result);

      setCompletionData({
        clearTime: finalTime,
        stars: result.stars || result.starsEarned || 0,
        credits: result.credits || result.creditsEarned || 0,
        spaceParts: result.spaceParts || result.spacePartsEarned || 0,
        isGuest: false,
      });
      setShowComplete(true);

      // localStorage 업데이트
      const currentStars = parseInt(localStorage.getItem('stars') || '0', 10);
      const currentCredits = parseInt(localStorage.getItem('credits') || '0', 10);
      const currentParts = parseInt(localStorage.getItem('spaceParts') || '0', 10);
      
      localStorage.setItem('stars', String(currentStars + (result.stars || 0)));
      localStorage.setItem('credits', String(currentCredits + (result.credits || 0)));
      localStorage.setItem('spaceParts', String(currentParts + (result.spaceParts || 0)));

    } catch (error) {
      console.error('❌ 퍼즐 완료 처리 오류:', error);
      const stars = calculateStars(finalTime, puzzleBody.gridSize);
      setCompletionData({
        clearTime: finalTime,
        stars: stars,
        isGuest: true,
        error: true,
      });
      setShowComplete(true);
    }
  };

  const calculateStars = (seconds, gridSize) => {
    const baseTime = gridSize * gridSize * 10;
    if (seconds <= baseTime * 0.5) return 3;
    if (seconds <= baseTime) return 2;
    return 1;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}분 ${s}초`;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (sceneRef.current) {
      if (isPaused) {
        sceneRef.current.resume();
      } else {
        sceneRef.current.pause();
      }
    }
  };

  const handleHintToggle = () => {
    setShowHint(!showHint);
    // Phaser Scene에 힌트 토글 전달 (나중에 구현)
  };

  const handleRestart = () => {
    if (window.confirm('퍼즐을 처음부터 다시 시작하시겠습니까?')) {
      window.location.reload();
    }
  };

  if (isPuzzleLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <p className="pixel-font text-xl text-gray-300">퍼즐 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (puzzleError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="pixel-font text-xl text-red-400 mb-4">퍼즐을 불러오지 못했습니다</p>
          <p className="pixel-font text-gray-400 mb-6">{puzzleError}</p>
          <button
            onClick={() => navigate(celestialBody.isApod ? '/lobby' : '/gameplay')}
            className="pixel-font bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 상단 UI */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
        {/* 왼쪽: 게임 정보 */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => navigate(celestialBody.isApod ? '/lobby' : '/gameplay')}
            className="bg-gray-900 bg-opacity-80 hover:bg-opacity-100 rounded-lg px-4 py-2 border border-gray-600 hover:border-blue-400 transition-all"
          >
            <p className="pixel-font text-white">← 돌아가기</p>
          </button>
          
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-blue-500">
            <p className="pixel-font text-white text-lg">{puzzleBody.name}</p>
          </div>
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-yellow-500">
            <p className="pixel-font text-yellow-400">난이도: {puzzleBody.difficulty}</p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-green-500">
            <p className="pixel-font text-green-400 text-lg">⏱ {formatTime(time)}</p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-80 rounded-lg px-4 py-2 border border-purple-500 min-w-[200px]">
            <p className="pixel-font text-purple-400 mb-2">진행률: {progress}%</p>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 오른쪽: 컨트롤 버튼 */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={handlePause}
            className="bg-gray-900 bg-opacity-80 hover:bg-opacity-100 rounded-lg px-4 py-2 border border-yellow-500 hover:border-yellow-400 transition-all"
          >
            <p className="pixel-font text-yellow-400">{isPaused ? '▶ 계속' : '⏸ 일시정지'}</p>
          </button>
          
          <button
            onClick={handleHintToggle}
            className="bg-gray-900 bg-opacity-80 hover:bg-opacity-100 rounded-lg px-4 py-2 border border-cyan-500 hover:border-cyan-400 transition-all"
          >
            <p className="pixel-font text-cyan-400">{showHint ? '💡 힌트 숨기기' : '💡 힌트 보기'}</p>
          </button>
          
          <button
            onClick={handleRestart}
            className="bg-gray-900 bg-opacity-80 hover:bg-opacity-100 rounded-lg px-4 py-2 border border-red-500 hover:border-red-400 transition-all"
          >
            <p className="pixel-font text-red-400">🔄 다시 시작</p>
          </button>
        </div>
      </div>

      {/* Phaser 게임 컨테이너 */}
      <div 
        ref={gameContainerRef} 
        className="w-full h-full flex items-center justify-center"
      />

      {/* 일시정지 오버레이 */}
      {isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30">
          <div className="text-center">
            <p className="pixel-font text-4xl text-white mb-4">⏸ 일시정지</p>
            <button
              onClick={handlePause}
              className="pixel-font bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl"
            >
              게임 계속하기
            </button>
          </div>
        </div>
      )}

      {/* 완료 모달 */}
      {showComplete && completionData && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40">
          <div className="bg-gray-900 border-4 border-yellow-500 rounded-lg p-8 max-w-md text-center">
            <p className="pixel-font text-3xl text-yellow-400 mb-4">🎉 퍼즐 완성!</p>
            <p className="pixel-font text-xl text-white mb-2">축하합니다!</p>
            
            <div className="my-6 space-y-2">
              <p className="pixel-font text-lg text-gray-300">
                ⏱️ 클리어 시간: {formatTime(completionData.clearTime)}
              </p>
              <p className="pixel-font text-2xl text-yellow-400">
                ⭐ 획득한 별: {completionData.stars}개
              </p>
              {!completionData.isGuest && (
                <>
                  {completionData.credits > 0 && (
                    <p className="pixel-font text-lg text-green-400">
                      💰 크레딧: +{completionData.credits}
                    </p>
                  )}
                  {completionData.spaceParts > 0 && (
                    <p className="pixel-font text-lg text-blue-400">
                      🔧 우주 부품: +{completionData.spaceParts}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(celestialBody.isApod ? '/lobby' : '/gameplay')}
                className="pixel-font bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
              >
                돌아가기
              </button>
              <button
                onClick={handleRestart}
                className="pixel-font bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg"
              >
                다시 도전
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleGamePhaser;
