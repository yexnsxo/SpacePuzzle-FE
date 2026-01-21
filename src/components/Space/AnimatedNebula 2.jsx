import { useState, useEffect, useRef } from 'react';

// Vite의 glob import로 모든 JSON과 PNG를 미리 로드
const nebulaeJsons = import.meta.glob('../../assets/nebulae/**/*.json');
const nebulaeImages = import.meta.glob('../../assets/nebulae/**/*.png', { eager: false });
const deepSpaceJsons = import.meta.glob('../../assets/deep-space/**/*.json');
const deepSpaceImages = import.meta.glob('../../assets/deep-space/**/*.png', { eager: false });
const galaxiesJsons = import.meta.glob('../../assets/galaxies/**/*.json');
const galaxiesImages = import.meta.glob('../../assets/galaxies/**/*.png', { eager: false });

const AnimatedNebula = ({ nebulaName, size = 400, isSelected = false, isCleared = false, onClick, folder = 'nebulae' }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spriteData, setSpriteData] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // 스프라이트시트 데이터 로드
  useEffect(() => {
    const loadSpriteData = async () => {
      try {
        console.log('📄 JSON 로드 시도:', folder, nebulaName);
        
        // glob 목록에서 일치하는 파일 찾기
        const jsons = folder === 'deep-space' ? deepSpaceJsons : folder === 'galaxies' ? galaxiesJsons : nebulaeJsons;
        const jsonPath = `../../assets/${folder}/${nebulaName}/${nebulaName}.json`;
        
        const loader = jsons[jsonPath];
        if (!loader) {
          console.error('❌ JSON 파일을 찾을 수 없음:', jsonPath);
          console.log('사용 가능한 경로들:', Object.keys(jsons));
          return;
        }
        
        const jsonModule = await loader();
        const data = jsonModule.default || jsonModule;
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
    
    const loadImage = async () => {
      try {
        console.log('🖼️ 이미지 로드 시도:', folder, nebulaName);
        
        // glob 목록에서 일치하는 파일 찾기
        const images = folder === 'deep-space' ? deepSpaceImages : folder === 'galaxies' ? galaxiesImages : nebulaeImages;
        const imagePath = `../../assets/${folder}/${nebulaName}/${nebulaName}.png`;
        
        const loader = images[imagePath];
        if (!loader) {
          console.error('❌ PNG 파일을 찾을 수 없음:', imagePath);
          console.log('사용 가능한 경로들:', Object.keys(images));
          return;
        }
        
        const imageModule = await loader();
        const img = new Image();
        img.src = imageModule.default;
        
        img.onload = () => {
          imageRef.current = img;
          console.log('✅ 이미지 로드 성공:', nebulaName);
        };
        
        img.onerror = (error) => {
          console.error('❌ 이미지 로드 실패:', nebulaName, error);
        };
      } catch (error) {
        console.error('❌ 이미지 import 실패:', nebulaName, error);
      }
    };
    
    loadImage();
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

    // 클리어 상태에 따른 필터 적용
    if (isCleared) {
      // 클리어됨: 컬러 (필터 없음)
      ctx.filter = 'none';
    } else {
      // 클리어 안됨: 흑백
      ctx.filter = 'grayscale(100%) brightness(0.7)';
    }

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

    // 필터 리셋 (다음 그리기에 영향 없도록)
    ctx.filter = 'none';
  }, [currentFrame, spriteData, isCleared]);

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
        }}
        className={`${isSelected ? 'animate-pulse' : ''}`}
      />
    </div>
  );
};

export default AnimatedNebula;
