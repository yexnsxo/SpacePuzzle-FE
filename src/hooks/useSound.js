import { useEffect, useRef, useState } from 'react';

/**
 * 사운드 재생을 관리하는 커스텀 훅
 * @param {string} soundUrl - 사운드 파일 경로
 * @param {Object} options - 옵션 { loop, volume }
 */
export const useSound = (soundUrl, options = {}) => {
  const { loop = false, volume = 0.5 } = options;
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!soundUrl) return;

    // Audio 객체 생성
    audioRef.current = new Audio(soundUrl);
    audioRef.current.loop = loop;
    audioRef.current.volume = volume;

    // 로드 완료 이벤트
    audioRef.current.addEventListener('canplaythrough', () => {
      setIsLoaded(true);
    });

    // 재생 종료 이벤트
    audioRef.current.addEventListener('ended', () => {
      if (!loop) {
        setIsPlaying(false);
      }
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl, loop, volume]);

  const play = () => {
    if (audioRef.current && isLoaded) {
      audioRef.current.play().catch((err) => {
        console.error('사운드 재생 실패:', err);
      });
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const setVolume = (newVolume) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return { play, pause, stop, setVolume, isPlaying, isLoaded };
};
