import axios from 'axios';

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY;
const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';

/**
 * NASA APOD (Astronomy Picture of the Day) API에서 랜덤 우주 이미지를 가져옵니다.
 * @param {string} date - 특정 날짜 (YYYY-MM-DD), 없으면 랜덤
 * @returns {Promise<Object>} NASA 이미지 데이터
 */
export const fetchNasaImage = async (date = null) => {
  try {
    const params = {
      api_key: NASA_API_KEY,
    };

    // 날짜가 없으면 랜덤 날짜 생성 (1995-06-16 ~ 오늘)
    if (!date) {
      const startDate = new Date('1995-06-16');
      const today = new Date();
      const randomDate = new Date(
        startDate.getTime() + Math.random() * (today.getTime() - startDate.getTime())
      );
      params.date = randomDate.toISOString().split('T')[0];
    } else {
      params.date = date;
    }

    const response = await axios.get(NASA_APOD_URL, { params });
    
    // 이미지 타입만 반환 (비디오는 제외)
    if (response.data.media_type !== 'image') {
      // 비디오가 나오면 다시 시도
      return fetchNasaImage();
    }

    return {
      url: response.data.url,
      hdurl: response.data.hdurl,
      title: response.data.title,
      explanation: response.data.explanation,
      date: response.data.date,
    };
  } catch (error) {
    console.error('NASA API 호출 실패:', error);
    throw error;
  }
};

/**
 * 여러 개의 NASA 이미지를 가져옵니다.
 * @param {number} count - 가져올 이미지 개수
 * @returns {Promise<Array>} NASA 이미지 배열
 */
export const fetchMultipleNasaImages = async (count = 10) => {
  try {
    const response = await axios.get(NASA_APOD_URL, {
      params: {
        api_key: NASA_API_KEY,
        count,
      },
    });

    // 이미지 타입만 필터링
    return response.data
      .filter((item) => item.media_type === 'image')
      .map((item) => ({
        url: item.url,
        hdurl: item.hdurl,
        title: item.title,
        explanation: item.explanation,
        date: item.date,
      }));
  } catch (error) {
    console.error('NASA API 호출 실패:', error);
    throw error;
  }
};
