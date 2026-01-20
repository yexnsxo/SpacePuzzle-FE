import { useState, useEffect } from 'react';
import spriteSheet from '../../assets/animations/Earth-Like planet.png';
import spriteData from '../../assets/animations/Earth-Like planet.json';

/**
 * 스프라이트시트 애니메이션 컴포넌트
 * Aseprite로 만든 애니메이션을 재생합니다.
 */
const PlanetAnimation = () => {
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // 프레임 데이터 파싱
  const frames = Object.values(spriteData.frames);
  const totalFrames = frames.length;
  
  // 스프라이트시트 정보
  const spriteSheetWidth = spriteData.meta.size.w; // 2304
  const spriteSheetHeight = spriteData.meta.size.h; // 1152
  
  useEffect(() => {
    // 프레임 애니메이션 (100ms마다 프레임 전환)
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 100);
    
    return () => clearInterval(interval);
  }, [totalFrames]);
  
  if (!frames[currentFrame]) {
    return null;
  }
  
  const frameData = frames[currentFrame].frame;
  const frameWidth = frameData.w; // 256
  const frameHeight = frameData.h; // 128
  
  // 표시할 크기
  const displayWidth = 300;
  const displayHeight = (frameHeight / frameWidth) * displayWidth; // 비율 유지
  
  // 스프라이트시트 스케일 계산
  const scale = displayWidth / frameWidth;
  const scaledSheetWidth = spriteSheetWidth * scale;
  const scaledSheetHeight = spriteSheetHeight * scale;
  
  // 배경 위치 계산
  const bgX = -(frameData.x * scale);
  const bgY = -(frameData.y * scale);
  
  return (
    <div 
      className="relative drop-shadow-2xl"
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
    >
      {/* 스프라이트시트에서 현재 프레임만 표시 */}
      <div
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          backgroundImage: `url(${spriteSheet})`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          backgroundSize: `${scaledSheetWidth}px ${scaledSheetHeight}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated', // 픽셀 아트 스타일 유지
        }}
      />
    </div>
  );
};

export default PlanetAnimation;
