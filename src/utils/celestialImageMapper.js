/**
 * 천체 이미지 매핑 유틸리티
 * 백엔드 데이터와 프론트엔드 assets를 연결
 */

// 태양계 이미지
import earthImg from '../assets/celestial/earth.jpg';
import mercuryImg from '../assets/celestial/mercury.jpg';
import venusImg from '../assets/celestial/venus.jpg';
import marsImg from '../assets/celestial/mars.jpg';

// 외계행성 이미지 동적 로드 함수
const getExoplanetImage = async (name) => {
  try {
    const imageName = name.replace(/\s+/g, '_');
    const imagePath = new URL(`../assets/exoplanets/${imageName}/${imageName}.png`, import.meta.url).href;
    return imagePath;
  } catch (error) {
    console.error('외계행성 이미지 로드 실패:', name, error);
    return null;
  }
};

// 성운 이미지 동적 로드 함수
const getNebulaImage = async (name) => {
  try {
    // 성운은 공백 그대로
    const imagePath = new URL(`../assets/nebulae/${name}/${name}.png`, import.meta.url).href;
    return imagePath;
  } catch (error) {
    console.error('성운 이미지 로드 실패:', name, error);
    return null;
  }
};

// 은하 이미지 동적 로드 함수
const getGalaxyImage = async (name) => {
  try {
    // 괄호 제거 후 공백 그대로
    const imageName = name.replace(/\([^)]*\)/g, '').trim();
    const imagePath = new URL(`../assets/galaxies/${imageName}/${imageName}.png`, import.meta.url).href;
    return imagePath;
  } catch (error) {
    console.error('은하 이미지 로드 실패:', name, error);
    return null;
  }
};

// 심연 이미지 동적 로드 함수
const getDeepSpaceImage = async (name) => {
  try {
    // 괄호 제거 후 언더스코어 변환
    const imageName = name.replace(/\([^)]*\)/g, '').trim().replace(/\s+/g, '_');
    const imagePath = new URL(`../assets/deep-space/${imageName}/${imageName}.png`, import.meta.url).href;
    return imagePath;
  } catch (error) {
    console.error('심연 이미지 로드 실패:', name, error);
    return null;
  }
};

// 태양계 이미지 맵 (정적 import)
const solarSystemImages = {
  'Earth': earthImg,
  'Mercury': mercuryImg,
  'Venus': venusImg,
  'Mars': marsImg,
};

/**
 * 천체 데이터에 이미지 URL 추가
 * @param {Array} celestials - 백엔드에서 받은 천체 배열
 * @returns {Promise<Array>} - 이미지 URL이 추가된 천체 배열
 */
export const mapCelestialImages = async (celestials) => {
  console.log('🗺️ 이미지 매핑 시작, 천체 개수:', celestials.length);
  
  const mapped = await Promise.all(
    celestials.map(async (celestial) => {
      const nameEn = celestial.nameEn || celestial.nasaId || celestial.name;
      const category = celestial.category;
      const sectorSlug = celestial.sectorSlug || celestial.sector;
      
      console.log(`🔍 매핑 중: ${nameEn}, category: ${category}, sectorSlug: ${sectorSlug}`);
      
      let imageUrl = null;

      // category를 sectorSlug로 변환
      let sector = sectorSlug;
      if (!sector && category) {
        if (category === 'planet') sector = 'solar-system';
        else if (category === 'exoplanet') sector = 'exoplanet-systems';
        else if (category === 'nebula') sector = 'nebulae';
        else if (category === 'galaxy') sector = 'galaxies';
        else if (category === 'deepspace') sector = 'deep-space-extremes';
      }

      console.log(`  → 최종 섹터: ${sector}`);

      // 섹터별 이미지 로드
      if (sector === 'solar-system') {
        imageUrl = solarSystemImages[nameEn] || null;
        console.log(`  → 태양계 이미지:`, imageUrl ? '발견' : '없음');
      } else if (sector === 'exoplanet-systems') {
        imageUrl = await getExoplanetImage(nameEn);
        console.log(`  → 외계행성 이미지:`, imageUrl);
      } else if (sector === 'nebulae') {
        imageUrl = await getNebulaImage(nameEn);
        console.log(`  → 성운 이미지:`, imageUrl);
      } else if (sector === 'galaxies') {
        imageUrl = await getGalaxyImage(nameEn);
        console.log(`  → 은하 이미지:`, imageUrl);
      } else if (sector === 'deep-space-extremes') {
        imageUrl = await getDeepSpaceImage(nameEn);
        console.log(`  → 심연 이미지:`, imageUrl);
      }

      console.log(`  → 최종 이미지 URL:`, imageUrl);

      return {
        ...celestial,
        image: imageUrl || celestial.image || null,
      };
    })
  );

  return mapped;
};
