import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpaceBackground from '../components/Landing/SpaceBackground';
import Spaceship from '../components/Landing/Spaceship';
import PixelTitle from '../components/Landing/PixelTitle';
import PlayButton from '../components/Landing/PlayButton';
import ZoomTransition from '../components/Landing/ZoomTransition';

/**
 * 랜딩 페이지
 * 게임 시작 화면
 */
const Landing = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  console.log('🚀 Landing 페이지 렌더링');

  const handlePlayClick = () => {
    console.log('🎮 Play 버튼 클릭!');
    setIsTransitioning(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 배경 - NASA API + 별 배경 */}
      <SpaceBackground />

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* 제목 */}
        {!isTransitioning && <PixelTitle />}

        {/* 우주선 - 항상 표시 */}
        <Spaceship isTransitioning={isTransitioning} />

        {/* 플레이 버튼 */}
        {!isTransitioning && (
          <div className="-mt-12">
            <PlayButton onClick={handlePlayClick} />
          </div>
        )}
      </div>

      {/* 줌인 전환 효과 */}
      <ZoomTransition isActive={isTransitioning} targetRoute="/login" />
    </div>
  );
};

export default Landing;
