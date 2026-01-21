import { useState, useEffect, useRef } from 'react';
import apodWindowStatic from '../assets/ui/apod-window.png';

const AnimatedApodWindow = ({ isHovered, width = 400, height = 300 }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spriteData, setSpriteData] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const staticImageRef = useRef(null);

  // 정적 이미지 로드
  useEffect(() => {
    const img = new Image();
    img.src = apodWindowStatic;
    img.onload = () => {
      staticImageRef.current = img;
    };
  }, []);

  // 스프라이트시트 데이터 로드
  useEffect(() => {
    const loadSpriteData = async () => {
      try {
        const jsonPath = new URL('../assets/ui/apod-window-hover.json', import.meta.url).href;
        console.log('📄 APOD 호버 애니메이션 JSON 로드 시도:', jsonPath);
        const response = await fetch(jsonPath);
        const data = await response.json();
        setSpriteData(data);
        console.log('✅ APOD 호버 스프라이트 데이터 로드 성공, 프레임 수:', Object.keys(data.frames).length);
      } catch (error) {
        console.error('❌ APOD 호버 스프라이트 데이터 로드 실패:', error);
      }
    };
    loadSpriteData();
  }, []);

  // 호버 애니메이션 이미지 로드
  useEffect(() => {
    if (!spriteData) return;
    
    const img = new Image();
    const imagePath = new URL('../assets/ui/apod-window-hover.png', import.meta.url).href;
    console.log('🖼️ APOD 호버 이미지 로드 시도:', imagePath);
    
    img.onload = () => {
      imageRef.current = img;
      console.log('✅ APOD 호버 이미지 로드 성공');
    };
    
    img.onerror = (error) => {
      console.error('❌ APOD 호버 이미지 로드 실패:', error);
    };
    
    img.src = imagePath;
  }, [spriteData]);

  // 애니메이션 프레임 전환 (호버 시에만)
  useEffect(() => {
    if (!spriteData || !isHovered) {
      setCurrentFrame(0);
      return;
    }

    const frames = Object.values(spriteData.frames);
    if (frames.length === 0) return;

    // 애니메이션 속도를 2배 느리게 (duration * 2)
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, (frames[0]?.duration || 100) * 2);

    return () => clearInterval(interval);
  }, [spriteData, isHovered]);

  // 캔버스에 현재 프레임 그리기
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isHovered && spriteData && imageRef.current) {
      // 호버 상태: 애니메이션 재생
      const frames = Object.values(spriteData.frames);
      const frameData = frames[currentFrame];

      if (frameData) {
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
      }
    } else if (staticImageRef.current) {
      // 기본 상태: 정적 이미지
      ctx.drawImage(
        staticImageRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  }, [currentFrame, spriteData, isHovered]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
      }}
    />
  );
};

export default AnimatedApodWindow;
