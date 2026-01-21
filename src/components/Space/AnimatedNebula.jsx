import { useState, useEffect, useRef } from 'react';

const AnimatedNebula = ({ nebulaName, size = 400, isSelected = false, isCleared = false, onClick, folder = 'nebulae' }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spriteData, setSpriteData] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // 스프라이트시트 데이터 로드
  useEffect(() => {
    const loadSpriteData = async () => {
      try {
        // JSON 파일명은 공백 그대로 사용 (폴더 지원)
        const jsonPath = new URL(`../../assets/${folder}/${nebulaName}/${nebulaName}.json`, import.meta.url).href;
        console.log('📄 JSON 로드 시도:', jsonPath);
        const response = await fetch(jsonPath);
        const data = await response.json();
        setSpriteData(data);
        console.log('✅ 스프라이트 데이터 로드 성공:', nebulaName, '프레임 수:', Object.keys(data.frames).length);
      } catch (error) {
        console.error('❌ 스프라이트 데이터 로드 실패:', nebulaName, error);
      }
    };
    loadSpriteData();
  }, [nebulaName, folder]);

  // 이미지 로드
  useEffect(() => {
    if (!spriteData) return;
    
    const img = new Image();
    
    // 두 가지 파일명 시도: [이름].png 또는 [이름]-sheet.png
    const tryLoadImage = async () => {
      const imageName = `${nebulaName}.png`;
      const sheetImageName = `${nebulaName}-sheet.png`;
      
      try {
        // 먼저 일반 파일명 시도 (폴더 지원)
        const imagePath = new URL(`../../assets/${folder}/${nebulaName}/${imageName}`, import.meta.url).href;
        console.log('🖼️ 이미지 로드 시도:', imagePath);
        
        img.onload = () => {
          imageRef.current = img;
          console.log('✅ 이미지 로드 성공:', imageName);
        };
        
        img.onerror = () => {
          // 실패하면 -sheet.png 시도
          console.log('🔄 -sheet.png 시도:', sheetImageName);
          const sheetPath = new URL(`../../assets/${folder}/${nebulaName}/${sheetImageName}`, import.meta.url).href;
          img.src = sheetPath;
        };
        
        img.src = imagePath;
      } catch (error) {
        console.error('❌ 이미지 로드 실패:', error);
      }
    };
    
    tryLoadImage();
  }, [nebulaName, spriteData, folder]);

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

  const visualFilter = isCleared ? 'none' : 'grayscale(100%) brightness(0.7)';

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
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 ${
        isSelected ? 'scale-110 drop-shadow-2xl' : 'hover:scale-105'
      }`}
      style={{
        width: size,
        height: size,
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          filter: visualFilter,
        }}
        className={`${isSelected ? 'animate-pulse' : ''}`}
      />
    </div>
  );
};

export default AnimatedNebula;
