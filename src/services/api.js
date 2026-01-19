/**
 * 🌐 API 호출 예시
 * 
 * 다른 컴포넌트에서 이렇게 사용하세요!
 */

import axios from 'axios';
import { getAuthHeaders } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 예시 1: 유저 프로필 가져오기
 */
export const getUserProfile = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/profile`,
      { headers: getAuthHeaders() } // 🔐 토큰 자동 추가
    );
    return response.data;
  } catch (error) {
    console.error('❌ 프로필 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 예시 2: 퍼즐 완료 기록 저장
 */
export const savePuzzleRecord = async (puzzleData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/puzzle/complete`,
      puzzleData,
      { headers: getAuthHeaders() } // 🔐 토큰 자동 추가
    );
    return response.data;
  } catch (error) {
    console.error('❌ 퍼즐 기록 저장 실패:', error);
    throw error;
  }
};

/**
 * 예시 3: 리더보드 가져오기
 */
export const getLeaderboard = async (sectorId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/leaderboard/${sectorId}`,
      { headers: getAuthHeaders() } // 🔐 토큰 자동 추가
    );
    return response.data;
  } catch (error) {
    console.error('❌ 리더보드 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 예시 4: 상점 아이템 구매
 */
export const purchaseItem = async (itemId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/shop/purchase`,
      { itemId },
      { headers: getAuthHeaders() } // 🔐 토큰 자동 추가
    );
    return response.data;
  } catch (error) {
    console.error('❌ 아이템 구매 실패:', error);
    throw error;
  }
};
