/**
 * 🔐 인증 관련 유틸리티 함수
 */

/**
 * localStorage에서 access_token 가져오기
 * @returns {string | null} access_token
 */
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * localStorage에서 refresh_token 가져오기
 * @returns {string | null} refresh_token
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

/**
 * localStorage에서 user 정보 가져오기
 * @returns {object | null} user 객체
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Authorization 헤더 생성
 * @returns {object} axios headers 객체
 */
export const getAuthHeaders = () => {
  const token = getAccessToken();
  if (!token) {
    console.warn('⚠️ access_token이 없습니다!');
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * 로그아웃 처리 (localStorage 초기화)
 */
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  console.log('✅ 로그아웃 완료');
};

/**
 * 로그인 상태 확인
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};
