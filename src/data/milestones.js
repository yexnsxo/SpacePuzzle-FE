/**
 * 별 마일스톤 데이터
 * 경제 시스템의 핵심 - 별을 모으면 보상 지급
 */

export const MILESTONES = [
  {
    id: 1,
    requiredStars: 5,
    rewardCredits: 10,
    rewardSpaceParts: 1,
    unlocksSector: null,
    description: '첫 번째 마일스톤',
  },
  {
    id: 2,
    requiredStars: 10,
    rewardCredits: 10,
    rewardSpaceParts: 1,
    unlocksSector: null,
    description: '꾸준한 도전자',
  },
  {
    id: 3,
    requiredStars: 15,
    rewardCredits: 20,
    rewardSpaceParts: 2,
    unlocksSector: {
      id: 2,
      name: '외계 행성',
      bonusCredits: 20,
      bonusSpaceParts: 2,
    },
    description: '새로운 세계 발견',
  },
  {
    id: 4,
    requiredStars: 20,
    rewardCredits: 15,
    rewardSpaceParts: 1,
    unlocksSector: null,
    description: '우주 탐험가',
  },
  {
    id: 5,
    requiredStars: 28,
    rewardCredits: 25,
    rewardSpaceParts: 3,
    unlocksSector: {
      id: 3,
      name: '성운',
      bonusCredits: 25,
      bonusSpaceParts: 3,
    },
    description: '화려한 가스 구름',
  },
  {
    id: 6,
    requiredStars: 35,
    rewardCredits: 15,
    rewardSpaceParts: 2,
    unlocksSector: null,
    description: '중급 항해사',
  },
  {
    id: 7,
    requiredStars: 45,
    rewardCredits: 30,
    rewardSpaceParts: 4,
    unlocksSector: {
      id: 4,
      name: '은하',
      bonusCredits: 30,
      bonusSpaceParts: 4,
    },
    description: '거대한 우주',
  },
  {
    id: 8,
    requiredStars: 55,
    rewardCredits: 20,
    rewardSpaceParts: 3,
    unlocksSector: null,
    description: '숙련된 조종사',
  },
  {
    id: 9,
    requiredStars: 65,
    rewardCredits: 40,
    rewardSpaceParts: 5,
    unlocksSector: {
      id: 5,
      name: '심연',
      bonusCredits: 40,
      bonusSpaceParts: 5,
    },
    description: '블랙홀과 암흑 물질',
  },
  {
    id: 10,
    requiredStars: 85,
    rewardCredits: 50,
    rewardSpaceParts: 5,
    unlocksSector: null,
    description: '마스터 우주인',
  },
  {
    id: 11,
    requiredStars: 105,
    rewardCredits: 60,
    rewardSpaceParts: 8,
    unlocksSector: null,
    description: '전설적인 수집가',
  },
  {
    id: 12,
    requiredStars: 116,
    rewardCredits: 100,
    rewardSpaceParts: 10,
    unlocksSector: null,
    description: '완벽한 정복자',
  },
];

/**
 * 현재 별 개수로 달성한 마일스톤 목록 반환
 */
export const getAchievedMilestones = (currentStars) => {
  return MILESTONES.filter(m => currentStars >= m.requiredStars);
};

/**
 * 다음 달성할 마일스톤 반환
 */
export const getNextMilestone = (currentStars) => {
  return MILESTONES.find(m => currentStars < m.requiredStars);
};

/**
 * 다음 마일스톤까지 필요한 별 개수
 */
export const getStarsNeeded = (currentStars) => {
  const next = getNextMilestone(currentStars);
  return next ? next.requiredStars - currentStars : 0;
};

/**
 * 마일스톤 진행률 (0~100%)
 */
export const getMilestoneProgress = (currentStars) => {
  const next = getNextMilestone(currentStars);
  if (!next) return 100; // 모두 달성
  
  const prevMilestone = MILESTONES.find((m, i) => 
    MILESTONES[i + 1]?.id === next.id
  );
  
  const startStars = prevMilestone ? prevMilestone.requiredStars : 0;
  const progress = ((currentStars - startStars) / (next.requiredStars - startStars)) * 100;
  
  return Math.min(100, Math.max(0, progress));
};
