import PixelStarfield from './PixelStarfield';

/**
 * 픽셀 도트가 흐르는 우주 배경
 */
const SpaceBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 픽셀 도트가 뒤로 흐르는 배경 */}
      <PixelStarfield />

    </div>
  );
};

export default SpaceBackground;
