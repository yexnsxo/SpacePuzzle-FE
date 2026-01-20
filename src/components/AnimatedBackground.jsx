import { useState, useEffect } from 'react';
import spriteSheet from '../assets/animations/backgrounds/Starry background.png';

/**
 * 스크롤링 배경 애니메이션 컴포넌트
 * 배경이 천천히 이동하면서 무한 반복됩니다.
 */
const AnimatedBackground = ({ speed = 50 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => ({
        x: (prev.x - 0.5) % 100, // 왼쪽으로 스크롤
        y: (prev.y - 0.3) % 100, // 위로 스크롤 (느리게)
      }));
    }, speed);
    
    return () => clearInterval(interval);
  }, [speed]);
  
  return (
    <div 
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${spriteSheet})`,
        backgroundSize: 'cover',
        backgroundPosition: `${position.x}% ${position.y}%`,
        backgroundRepeat: 'repeat',
        transition: 'background-position 0.1s linear',
      }}
    />
  );
};

export default AnimatedBackground;
