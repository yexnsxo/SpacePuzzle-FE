import { motion } from 'framer-motion';
import { useState } from 'react';
import playButtonImg from '../../assets/landing/play-button.png';
import playButtonHoverImg from '../../assets/landing/play-button-hover.png';

/**
 * 플레이 버튼 컴포넌트
 * 호버 효과 및 클릭 이벤트
 */
const PlayButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = () => {
    setIsHovered(true);
  };

  const handleClick = () => {
    console.log('🎯 Play 버튼 클릭됨');
    onClick?.();
  };

  return (
    <motion.button
      className="relative z-10 cursor-pointer"
      onMouseEnter={handleHover}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      {/* 호버 상태에 따라 이미지 변경 */}
      <img
        src={isHovered ? playButtonHoverImg : playButtonImg}
        alt="Play"
        className="w-72 h-auto mx-auto transition-all duration-200"
        style={{
          imageRendering: 'pixelated',
        }}
        onError={(e) => {
          // 이미지 로드 실패 시 텍스트 버튼으로 대체
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      
      {/* 이미지 로드 실패 시 대체 텍스트 버튼 */}
      <div
        className="hidden pixel-font text-4xl text-white bg-blue-600 px-12 py-4 rounded-lg border-4 border-white"
        style={{
          boxShadow: isHovered
            ? '0 0 20px rgba(59, 130, 246, 0.8)'
            : '0 0 10px rgba(59, 130, 246, 0.5)',
        }}
      >
        ▶ PLAY
      </div>
    </motion.button>
  );
};

export default PlayButton;
