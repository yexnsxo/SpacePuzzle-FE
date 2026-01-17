import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * 별이 반짝이는 우주 배경
 * NASA API 없이도 멋진 배경 제공
 */
const StarryBackground = () => {
  // 랜덤 별 생성
  const stars = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 그라디언트 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-black" />
      
      {/* 별들 */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* 대형 별/행성 (포인트) */}
      <motion.div
        className="absolute top-20 right-32 w-4 h-4 rounded-full bg-blue-300 blur-sm"
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute bottom-40 left-24 w-3 h-3 rounded-full bg-purple-300 blur-sm"
        animate={{
          opacity: [0.4, 0.9, 0.4],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  );
};

export default StarryBackground;
