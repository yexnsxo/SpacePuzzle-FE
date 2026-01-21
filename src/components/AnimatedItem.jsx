import { useState, useEffect, useRef } from 'react';

/**
 * 애니메이션 아이템 컴포넌트 (Aseprite 스프라이트시트)
 * @param {string} itemId - 아이템 ID (예: 'item_floating_saturn_planter')
 * @param {number} size - 렌더링 크기 (기본: 64)
 * @param {boolean} isSelected - 선택 여부
 * @param {function} onClick - 클릭 핸들러
 */
const AnimatedItem = ({ itemId, size = 64, isSelected = false, onClick }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spriteData, setSpriteData] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // 스프라이트시트 데이터 로드
  useEffect(() => {
    const loadSpriteData = async () => {
      try {
        const jsonPath = new URL(`../assets/item/${itemId}/${itemId}.json`, import.meta.url).href;
        console.log('📄 아이템 JSON 로드:', jsonPath);
        const response = await fetch(jsonPath);
        const data = await response.json();
        setSpriteData(data);
        console.log('✅ 아이템 스프라이트 로드 성공:', itemId, '프레임:', Object.keys(data.frames).length);
      } catch (error) {
        console.error('❌ 아이템 스프라이트 로드 실패:', itemId, error);
      }
    };
    loadSpriteData();
  }, [itemId]);

  // 이미지 로드
  useEffect(() => {
    if (!spriteData) return;
    
    const img = new Image();
    const imagePath = new URL(`../assets/item/${itemId}/${itemId}.png`, import.meta.url).href;
    console.log('🖼️ 아이템 이미지 로드:', imagePath);
    
    img.onload = () => {
      imageRef.current = img;
      console.log('✅ 아이템 이미지 로드 성공:', itemId);
    };
    
    img.onerror = () => {
      console.error('❌ 아이템 이미지 로드 실패:', itemId);
    };
    
    img.src = imagePath;
  }, [itemId, spriteData]);

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
    <div
      onClick={onClick}
      className={`inline-block cursor-pointer transition-all duration-300 ${
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

export default AnimatedItem;
