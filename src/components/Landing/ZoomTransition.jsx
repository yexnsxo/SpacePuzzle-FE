import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * 화면 전환 컴포넌트
 * 우주선 확대 + 화이트 아웃
 */
const ZoomTransition = ({ isActive, targetRoute = '/login' }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive) {
      // 1.2초 후 다음 화면으로 이동
      const timer = setTimeout(() => {
        navigate(targetRoute);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isActive, navigate, targetRoute]);

  if (!isActive) return null;

  return (
    <>
      {/* 점점 하얗게 되는 오버레이 */}
      <motion.div
        className="fixed inset-0 z-40 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1,
          ease: 'easeIn',
        }}
      />

      {/* 로딩 텍스트 */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="pixel-font text-black text-2xl">Entering Spaceship...</p>
      </motion.div>
    </>
  );
};

export default ZoomTransition;
