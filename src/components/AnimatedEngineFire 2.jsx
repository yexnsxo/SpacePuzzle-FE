import { useState, useEffect, useRef } from 'react';

const AnimatedEngineFire = ({ size = 100 }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spriteData, setSpriteData] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // 스프라이트시트 데이터 로드
  useEffect(() => {
    const loadSpriteData = async () => {
      try {
        const jsonPath = new URL('../assets/tutorial/engine-fire.json', import.meta.url).href;
        console.log('📄 엔진 불꽃 JSON 로드 시도:', jsonPath);
        const response = await fetch(jsonPath);
        const data = await response.json();
        setSpriteData(data);
        console.log('✅ 엔진 불꽃 데이터 로드 성공, 프레임 수:', Object.keys(data.frames).length);
      } catch (error) {
        console.error('❌ 엔진 불꽃 데이터 로드 실패:', error);
      }
    };
    loadSpriteData();
  }, []);

  // 이미지 로드
  useEffect(() => {
    if (!spriteData) return;
    
    const img = new Image();
    const imagePath = new URL('../assets/tutorial/engine-fire.png', import.meta.url).href;
    console.log('🖼️ 엔진 불꽃 이미지 로드 시도:', imagePath);
    
    img.onload = () => {
      imageRef.current = img;
      console.log('✅ 엔진 불꽃 이미지 로드 성공');
    };
    
    img.onerror = (error) => {
      console.error('❌ 엔진 불꽃 이미지 로드 실패:', error);
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
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        transform: 'scaleY(-1)', // 상하 반전
      }}
    />
  );
};

export default AnimatedEngineFire;
