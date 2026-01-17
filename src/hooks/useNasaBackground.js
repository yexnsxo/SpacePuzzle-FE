import { useState, useEffect } from 'react';
import { fetchNasaImage } from '../services/nasaApi';

/**
 * NASA API에서 배경 이미지를 가져오는 커스텀 훅
 */
export const useNasaBackground = () => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNasaImage = async () => {
      try {
        setLoading(true);
        console.log('🚀 NASA API 호출 시작...');
        const data = await fetchNasaImage();
        console.log('✅ NASA 이미지 로드 성공:', data);
        setImageData(data);
        setError(null);
      } catch (err) {
        console.error('❌ NASA 이미지 로드 실패:', err);
        console.error('에러 상세:', err.message);
        setError(err);
        // 실패 시 null을 설정하여 fallback 이미지 사용
        setImageData(null);
      } finally {
        setLoading(false);
        console.log('📍 로딩 완료');
      }
    };

    loadNasaImage();
  }, []);

  return { imageData, loading, error };
};
