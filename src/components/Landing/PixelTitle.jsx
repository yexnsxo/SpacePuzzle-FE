import { motion } from 'framer-motion';

/**
 * 게임 제목 컴포넌트
 * 픽셀 폰트로 표시
 */
const PixelTitle = () => {
  return (
    <motion.div
      className="relative z-10 text-center mb-8"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
    >
      <h1 className="pixel-font text-6xl text-white drop-shadow-2xl">
        SPACE
      </h1>
      <h1 className="pixel-font text-6xl text-white drop-shadow-2xl mt-2">
        PUZZLE
      </h1>
      
      {/* 부제목 */}
      <motion.p
        className="pixel-font text-xl text-gray-300 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        Explore the Universe
      </motion.p>
    </motion.div>
  );
};

export default PixelTitle;
