import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * 픽셀 도트가 뒤로 흐르는 우주 배경
 * 우주선이 앞으로 나아가는 효과
 */
const PixelStarfield = () => {
  // 3개 레이어의 별 생성 (깊이감을 위해)
  const starLayers = useMemo(() => {
    // 별을 상하 전체에 고르게 분포
    const generateStars = (count, minSize, maxSize, id) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `${id}-${i}`,
        x: Math.random() * 150, // 가로 0~150%
        y: (i / count) * 100 + (Math.random() * (100 / count)), // 균등 분포
        size: Math.random() * (maxSize - minSize) + minSize,
      }));
    };

    return [
      // 레이어 1: 가까운 별 (크고 빠름)
      {
        stars: generateStars(50, 2, 5, 'near'),
        speed: 8,
        blur: 0,
      },
      // 레이어 2: 중간 별
      {
        stars: generateStars(80, 1, 3, 'mid'),
        speed: 15,
        blur: 0.5,
      },
      // 레이어 3: 먼 별 (작고 느림)
      {
        stars: generateStars(120, 0.5, 2, 'far'),
        speed: 25,
        blur: 1,
      },
    ];
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 약한 그라디언트 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-indigo-950 to-black opacity-80" />

      {/* 별 레이어들 */}
      {starLayers.map((layer, layerIndex) => (
        <div key={layerIndex} className="absolute inset-0">
          {/* 2개의 동일한 세트로 무한 스크롤 */}
          {[0, 1].map((setIndex) => (
            <motion.div
              key={`${layerIndex}-${setIndex}`}
              className="absolute top-0 bottom-0"
              style={{
                width: '200%',
                left: setIndex === 0 ? '100%' : '0%',
              }}
              animate={{
                x: ['0%', '-100%'],
              }}
              transition={{
                duration: layer.speed,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {layer.stars.map((star) => (
                <div
                  key={star.id}
                  className="absolute rounded-full bg-white"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    filter: layer.blur > 0 ? `blur(${layer.blur}px)` : 'none',
                    imageRendering: 'pixelated',
                    boxShadow: '0 0 2px rgba(255, 255, 255, 0.5)',
                  }}
                />
              ))}
            </motion.div>
          ))}
        </div>
      ))}

      {/* 대형 별/행성 (포인트) */}
      <motion.div
        className="absolute w-5 h-5 rounded-full bg-blue-300"
        style={{
          top: '20%',
          imageRendering: 'pixelated',
          boxShadow: '0 0 10px rgba(147, 197, 253, 0.8)',
        }}
        animate={{
          x: ['120%', '-20%'],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <motion.div
        className="absolute w-4 h-4 rounded-full bg-purple-300"
        style={{
          top: '60%',
          imageRendering: 'pixelated',
          boxShadow: '0 0 8px rgba(216, 180, 254, 0.8)',
        }}
        animate={{
          x: ['120%', '-20%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
          delay: 2,
        }}
      />

      {/* 오른쪽 페이드 효과 (별이 나타나는 부분) - 약하게 */}
      <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none z-10 opacity-50" />
      
      {/* 왼쪽 페이드 효과 (별이 사라지는 부분) - 약하게 */}
      <div className="absolute top-0 left-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none z-10 opacity-50" />
    </div>
  );
};

export default PixelStarfield;
