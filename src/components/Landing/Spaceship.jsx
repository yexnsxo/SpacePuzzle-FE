import { motion } from 'framer-motion';
import spaceshipImg from '../../assets/landing/spaceship.png';

/**
 * 우주선 컴포넌트
 * 위아래 + 좌우 흔들림 + 살짝 회전하는 애니메이션
 * 전환 시 멈춤
 */
const Spaceship = ({ isTransitioning = false }) => {
  return (
    <motion.div
      className="relative z-10"
      style={{
        transformOrigin: isTransitioning ? '58% 50%' : 'center',
      }}
      animate={
        isTransitioning
          ? {
              scale: 15,
              y: 0,
              x: 80,
              rotate: 0,
            }
          : {
              scale: 1,
              y: [0, -30, 0],
              x: [0, -10, 0, 10, 0],
              rotate: [0, -2, 0, 2, 0],
            }
      }
      transition={
        isTransitioning
          ? {
              duration: 1,
              ease: 'easeIn',
            }
          : {
              y: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              x: {
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              rotate: {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
      }
    >
      <img
        src={spaceshipImg}
        alt="Spaceship"
        className="w-[800px] h-auto mx-auto"
        style={{
          imageRendering: 'pixelated', // 픽셀 아트 선명하게
        }}
      />
    </motion.div>
  );
};

export default Spaceship;
