import { useState, useEffect, useRef } from 'react';

const AnimatedCockpitBackground = ({ className = '', style = {} }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spriteData, setSpriteData] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // 스프라이트시트 데이터 로드
  useEffect(() => {
    const loadSpriteData = async () => {
      try {
        const jsonPath = new URL('../assets/cockpit/backgrounds/cockpit-background.json', import.meta.url).href;
        const response = await fetch(jsonPath);
        const data = await response.json();
        setSpriteData(data);
      } catch (error) {
        console.error('❌ 조종석 배경 JSON 로드 실패:', error);
      }
    };
    loadSpriteData();
  }, []);

  // 이미지 로드
  useEffect(() => {
    if (!spriteData) return;
    
    const img = new Image();
    const imagePath = new URL('../assets/cockpit/backgrounds/cockpit-background.png', import.meta.url).href;
    
    img.onload = () => {
      imageRef.current = img;
    };
    
    img.onerror = () => {
      console.error('❌ 조종석 배경 이미지 로드 실패');
    };
    
    img.src = imagePath;
  }, [spriteData]);

  // 애니메이션 프레임 전환
  useEffect(() => {
    if (!spriteData) return;

    const frames = Object.values(spriteData.frames);
    if (frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, frames[0]?.duration || 100);

    return () => clearInterval(interval);
  }, [spriteData]);

  // 캔버스에 현재 프레임 그리기
  useEffect(() => {
    if (!spriteData || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const frames = Object.values(spriteData.frames);
    const frameData = frames[currentFrame];

    if (!frameData) return;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 스프라이트시트에서 현재 프레임 추출하여 그리기
    ctx.drawImage(
      imageRef.current,
      frameData.frame.x,
      frameData.frame.y,
      frameData.frame.w,
      frameData.frame.h,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }, [currentFrame, spriteData]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        imageRendering: 'pixelated',
        ...style
      }}
    />
  );
};

export default AnimatedCockpitBackground;
