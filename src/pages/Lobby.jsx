import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import spaceshipInterior from '../assets/login/spaceship-interior.jpg';
import { supabase } from '../supabaseClient';
import { MILESTONES, getNextMilestone, getAchievedMilestones, getStarsNeeded } from '../data/milestones';
import { getGuestStats, getGuestCustomization, getGuestPurchasedItems, getGuestClearedCelestials, setGuestStats, setGuestCustomization } from '../utils/guestStorage';
import AnimatedApodWindow from '../components/AnimatedApodWindow';
import AnimatedItem from '../components/AnimatedItem';
import frameImage from '../assets/ui/frame.png';
import { mapCelestialImages } from '../utils/celestialImageMapper';

// 배경 이미지 import
const BACKGROUND_IMAGES = {
  wall_gray_iron_plate: () => import('../assets/wall/wall_gray_iron_plate.png'),
  wall_sleepy_moon_cloud: () => import('../assets/wall/wall_sleepy_moon_cloud.png'),
  wall_pastel_pink_cotton: () => import('../assets/wall/wall_pastel_pink_cotton.png'),
  wall_candy_planet_system: () => import('../assets/wall/wall_candy_planet_system.png'),
  wall_nasa_white_panel: () => import('../assets/wall/wall_nasa_white_panel.png'),
  wall_dyson_sphere_interior: () => import('../assets/wall/wall_dyson_sphere_interior.png'),
  wall_window_aurora_nebula: () => import('../assets/wall/wall_window_aurora_nebula.png'),
  wall_window_blackhole_abyss: () => import('../assets/wall/wall_window_blackhole_abyss.png'),
  wall_supernova_remnant: () => import('../assets/wall/wall_supernova_remnant.png'),
};

/**
 * 로비 페이지 (우주선 내부)
 * 로그인 후 메인 화면 - 2개 방으로 구성
 */
const Lobby = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('main'); // 'main' or 'gallery'
  const [userResources, setUserResources] = useState({
    stars: 0,
    credits: 20,
    spaceParts: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // 🛠️ 편집 모드 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showCockpitModal, setShowCockpitModal] = useState(false);
  const [showItemSidebar, setShowItemSidebar] = useState(false);
  const [isChangingBackground, setIsChangingBackground] = useState(false);
  const [isChangingCockpit, setIsChangingCockpit] = useState(false);
  
  // 🎁 마일스톤 모달
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  
  // 커스터마이제이션 데이터 (초기값을 localStorage에서 읽기)
  const [customization, setCustomization] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isGuest) {
        // 게스트 모드: 고유 ID별 데이터 읽기
        return getGuestCustomization();
      } else {
        // 로그인 모드: 캐시된 값이 있으면 사용
        const cachedCustomization = localStorage.getItem('cachedCustomization');
        if (cachedCustomization) {
          return JSON.parse(cachedCustomization);
        }
      }
    } catch (error) {
      console.error('초기 customization 로드 실패:', error);
    }
    // 기본값
    return {
      background: 'wall_gray_iron_plate',
      cockpit: 'cockpit_wooden_basic',
      items: [],
    };
  });
  
  // 구매한 아이템 목록
  const [purchasedItems, setPurchasedItems] = useState([]);
  
  // 드래그 중인 아이템
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 갤러리 - 클리어한 천체 목록
  const [clearedCelestials, setClearedCelestials] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  
  // APOD 창문 호버 상태
  const [isApodHovered, setIsApodHovered] = useState(false);
  
  // 배경 이미지 상태
  const [backgroundImage, setBackgroundImage] = useState(spaceshipInterior);

  useEffect(() => {
    // localStorage에서 유저 정보 가져오기
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      // 유저 통계 가져오기
      fetchUserStats();
      // 커스터마이제이션 데이터 가져오기
      fetchCustomization();
      // 구매한 아이템 가져오기
      fetchPurchasedItems();
      // 갤러리 데이터 가져오기
      fetchGallery();
    } else {
      // 로그인 정보가 없으면 로그인 페이지로
      navigate('/login');
    }
    
    // 페이지에 포커스될 때마다 자원 새로고침
    const handleFocus = () => {
      fetchUserStats();
      fetchCustomization(); // 커스터마이제이션도 새로고침
      fetchPurchasedItems();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);
  
  // 배경 이미지 로드
  useEffect(() => {
    const loadBackgroundImage = async () => {
      // 배경이 설정되어 있으면 해당 이미지, 없으면 기본 배경 사용
      const backgroundKey = customization.background || 'wall_gray_iron_plate';
      console.log('🖼️ 배경 이미지 로드 시도:', backgroundKey);
      
      if (BACKGROUND_IMAGES[backgroundKey]) {
        try {
          const imageModule = await BACKGROUND_IMAGES[backgroundKey]();
          setBackgroundImage(imageModule.default);
          console.log('✅ 배경 이미지 로드 성공:', backgroundKey);
        } catch (error) {
          console.error('❌ 배경 이미지 로드 실패:', error);
          // 실패 시 기본 배경 시도
          try {
            const defaultModule = await BACKGROUND_IMAGES['wall_gray_iron_plate']();
            setBackgroundImage(defaultModule.default);
          } catch (err) {
            console.error('기본 배경 로드 실패:', err);
            setBackgroundImage(spaceshipInterior);
          }
        }
      }
    };
    
    loadBackgroundImage();
  }, [customization.background]);

  const fetchUserStats = async () => {
    setIsLoadingStats(true);
    try {
      // 게스트 모드 체크
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isGuest) {
        const guestStats = getGuestStats();
        setUserResources(guestStats);
        setIsLoadingStats(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        console.warn('토큰 없음: 게스트 모드');
        setIsLoadingStats(false);
        return;
      }

      const response = await fetch(
        'https://spacepuzzle.onrender.com/user/resources',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserResources({
          stars: data.stars || 0,
          credits: data.credits || 20,
          spaceParts: data.spaceParts || 0,
        });
      }
    } catch (error) {
      console.error('유저 자원 가져오기 실패:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchCustomization = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCustomization = getGuestCustomization();
        console.log('📥 Lobby - customization 불러오기:', guestCustomization);
        setCustomization(guestCustomization);
        return;
      }

      // 일반 유저
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) return;

      const response = await fetch(
        'https://spacepuzzle.onrender.com/user/customization',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // 백엔드는 { wall, cockpit, items } 형식으로 반환 (wall === background)
        const customizationData = {
          background: data.wall || 'wall_gray_iron_plate',
          cockpit: data.cockpit || 'cockpit_wooden_basic',
          items: data.items || [],
        };
        setCustomization(customizationData);
        // localStorage에 캐시 (다음 로딩 시 깜빡임 방지)
        localStorage.setItem('cachedCustomization', JSON.stringify(customizationData));
        console.log('📥 Lobby - customization 불러오기:', data);
      } else if (response.status === 404) {
        // 백엔드 API가 아직 없으면 기본값 사용
        console.warn('⚠️ 백엔드 API 미구현: /user/customization (기본값 사용)');
        setCustomization({
          background: 'wall_gray_iron_plate',
          cockpit: 'cockpit_wooden_basic',
          items: [],
        });
      }
    } catch (error) {
      console.error('커스터마이제이션 가져오기 실패:', error);
      setCustomization({
        background: 'wall_gray_iron_plate',
        cockpit: 'cockpit_wooden_basic',
        items: [],
      });
    }
  };

  const fetchPurchasedItems = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestPurchased = getGuestPurchasedItems();
        // 기본 아이템 추가
        setPurchasedItems(['bg_default', 'cockpit_default', ...guestPurchased]);
        return;
      }

      // 일반 유저
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) return;

      const response = await fetch(
        'https://spacepuzzle.onrender.com/shop/purchased',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // 기본 아이템 항상 포함
        const defaultItems = ['wall_gray_iron_plate', 'cockpit_wooden_basic'];
        const allItems = [...new Set([...defaultItems, ...(data.items || [])])];
        setPurchasedItems(allItems);
      } else if (response.status === 404) {
        // 백엔드 API가 아직 없으면 기본값 사용
        console.warn('⚠️ 백엔드 API 미구현: /shop/purchased (기본값 사용)');
        setPurchasedItems(['wall_gray_iron_plate', 'cockpit_wooden_basic']);
      }
    } catch (error) {
      console.error('구매 내역 가져오기 실패:', error);
      // 에러 발생 시 기본값 사용
      setPurchasedItems(['wall_gray_iron_plate', 'cockpit_wooden_basic']);
    }
  };

  const fetchGallery = async () => {
    setIsLoadingGallery(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCleared = getGuestClearedCelestials();
        console.log('🖼️ 게스트 갤러리 데이터:', guestCleared);
        
        // 프론트엔드 assets에서 이미지 매핑
        const celestialsWithImages = await mapCelestialImages(guestCleared);
        console.log('✅ 게스트 이미지 매핑 완료:', celestialsWithImages);
        
        setClearedCelestials(celestialsWithImages);
        setIsLoadingGallery(false);
        return;
      }

      // 일반 유저
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        setIsLoadingGallery(false);
        return;
      }

      const response = await fetch(
        'https://spacepuzzle.onrender.com/me/cleared-celestial-objects',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('🖼️ 백엔드 갤러리 데이터:', data.cleared);
        
        // imageUrl을 image 필드로 복사
        const celestialsWithImages = (data.cleared || []).map(celestial => ({
          ...celestial,
          image: celestial.imageUrl || celestial.image || null,
        }));
        
        console.log('✅ 이미지 URL 매핑 완료:', celestialsWithImages);
        
        setClearedCelestials(celestialsWithImages);
      } else if (response.status === 404) {
        // 백엔드 API가 아직 없으면 빈 배열 사용
        console.warn('⚠️ 백엔드 API 미구현: /me/cleared-celestial-objects (빈 배열 사용)');
        setClearedCelestials([]);
      }
    } catch (error) {
      console.error('갤러리 가져오기 실패:', error);
      setClearedCelestials([]);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const goToGallery = () => {
    setCurrentRoom('gallery');
  };

  const goToMain = () => {
    setCurrentRoom('main');
  };

  const goToCockpit = () => {
    navigate('/cockpit');
  };

  // 🛠️ 편집 모드 토글
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      setShowItemSidebar(true);
    } else {
      setShowItemSidebar(false);
    }
  };

  // 🎨 배경 변경
  const changeBackground = async (bgId) => {
    // 이미 변경 중이거나 현재 선택된 배경이면 무시
    if (isChangingBackground || customization.background === bgId) {
      return;
    }
    
    setIsChangingBackground(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCustomization = getGuestCustomization();
        guestCustomization.background = bgId;
        setGuestCustomization(guestCustomization);
        setCustomization({ ...customization, background: bgId });
        setShowBackgroundModal(false);
        alert('배경이 변경되었습니다!');
        console.log('✅ 게스트 배경 변경:', bgId);
        return;
      }

      // 일반 유저
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        alert('로그인이 필요합니다!');
        return;
      }

      const response = await fetch(
        'https://spacepuzzle.onrender.com/user/customization/set',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'wall',
            itemId: bgId,
          }),
        }
      );

      console.log('🎨 배경 변경 API 호출:', { type: 'wall', itemId: bgId });
      
      if (response.ok) {
        console.log('✅ 배경 변경 성공:', bgId);
        setCustomization({ ...customization, background: bgId });
        setShowBackgroundModal(false);
        alert('배경이 변경되었습니다!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 배경 변경 실패:', response.status, errorData);
        alert(`변경 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('배경 변경 실패:', error);
      alert('배경 변경 중 오류가 발생했습니다.');
    } finally {
      setIsChangingBackground(false);
    }
  };

  // 🎮 조종석 변경
  const changeCockpit = async (cockpitId) => {
    // 이미 변경 중이거나 현재 선택된 조종석이면 무시
    if (isChangingCockpit || customization.cockpit === cockpitId) {
      return;
    }
    
    setIsChangingCockpit(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCustomization = getGuestCustomization();
        guestCustomization.cockpit = cockpitId;
        setGuestCustomization(guestCustomization);
        setCustomization({ ...customization, cockpit: cockpitId });
        setShowCockpitModal(false);
        alert('조종석이 변경되었습니다!');
        console.log('✅ 게스트 조종석 변경:', cockpitId);
        return;
      }

      // 일반 유저
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        alert('로그인이 필요합니다!');
        return;
      }

      const response = await fetch(
        'https://spacepuzzle.onrender.com/user/customization/set',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'cockpit',
            itemId: cockpitId,
          }),
        }
      );

      console.log('🎮 조종석 변경 API 호출:', { type: 'cockpit', itemId: cockpitId });
      
      if (response.ok) {
        console.log('✅ 조종석 변경 성공:', cockpitId);
        setCustomization({ ...customization, cockpit: cockpitId });
        setShowCockpitModal(false);
        alert('조종석이 변경되었습니다!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 조종석 변경 실패:', response.status, errorData);
        alert(`변경 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('조종석 변경 실패:', error);
      alert('조종석 변경 중 오류가 발생했습니다.');
    } finally {
      setIsChangingCockpit(false);
    }
  };

  // 🪑 아이템 배치
  const placeItem = async (itemId, x, y) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCustomization = getGuestCustomization();
        
        // 기존 아이템 제거 후 새 위치에 추가
        guestCustomization.items = guestCustomization.items.filter(item => item.itemId !== itemId);
        guestCustomization.items.push({ itemId, x, y });
        
        setGuestCustomization(guestCustomization);
        // 🔧 전체 customization 객체를 업데이트
        setCustomization(guestCustomization);
        console.log('✅ 아이템 배치 저장:', itemId, 'at', x, y);
        console.log('📦 저장된 customization:', guestCustomization);
        return;
      }

      // 일반 유저
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        alert('로그인이 필요합니다!');
        return;
      }

      const response = await fetch(
        'https://spacepuzzle.onrender.com/user/customization/place-item',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId,
            x,
            y,
          }),
        }
      );

      if (response.ok) {
        // 🔧 백엔드가 성공하면 로컬 상태 업데이트
        const updatedItems = customization.items.filter(item => item.itemId !== itemId);
        updatedItems.push({ itemId, x, y });
        setCustomization({ ...customization, items: updatedItems });
        console.log('✅ 아이템 배치 (백엔드):', itemId, 'at', x, y);
      } else if (response.status === 404) {
        console.warn('⚠️ 백엔드 API 미구현: /user/customization/place-item');
        // 로컬에서만 업데이트
        const updatedItems = customization.items.filter(item => item.itemId !== itemId);
        updatedItems.push({ itemId, x, y });
        setCustomization({ ...customization, items: updatedItems });
      } else {
        let errorMsg = '알 수 없는 오류';
        try {
          const error = await response.json();
          errorMsg = error.message || errorMsg;
        } catch (e) {
          // JSON 파싱 실패
        }
        alert(`배치 실패: ${errorMsg}`);
      }
    } catch (error) {
      console.error('아이템 배치 실패:', error);
      alert('아이템 배치 중 오류가 발생했습니다.');
    }
  };

  // 🗑️ 아이템 제거
  const removeItem = async (itemId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCustomization = getGuestCustomization();
        
        guestCustomization.items = guestCustomization.items.filter(item => item.itemId !== itemId);
        setGuestCustomization(guestCustomization);
        // 🔧 전체 customization 객체를 업데이트
        setCustomization(guestCustomization);
        console.log('🗑️ 아이템 제거:', itemId);
        console.log('📦 저장된 customization:', guestCustomization);
        return;
      }

      // 일반 유저
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) return;

      const response = await fetch(
        'https://spacepuzzle.onrender.com/user/customization/remove-item',
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ itemId }),
        }
      );

      if (response.ok) {
        // 🔧 백엔드가 성공하면 로컬 상태에서 제거
        const updatedItems = customization.items.filter(item => item.itemId !== itemId);
        setCustomization({ ...customization, items: updatedItems });
        console.log('🗑️ 아이템 제거 (백엔드):', itemId);
      } else if (response.status === 404) {
        console.warn('⚠️ 백엔드 API 미구현: /user/customization/remove-item');
        // 로컬에서만 제거
        const updatedItems = customization.items.filter(item => item.itemId !== itemId);
        setCustomization({ ...customization, items: updatedItems });
      }
    } catch (error) {
      console.error('아이템 제거 실패:', error);
    }
  };

  // 드래그 시작
  const handleDragStart = (itemId, e) => {
    const existingItem = customization.items.find(item => item.itemId === itemId);
    
    if (existingItem) {
      // 이미 배치된 아이템을 드래그하는 경우
      setDraggedItem(itemId);
      setDragOffset({
        x: e.clientX - existingItem.x,
        y: e.clientY - existingItem.y,
      });
    } else {
      // 사이드바에서 새로 드래그하는 경우
      setDraggedItem(itemId);
      setDragOffset({ x: 50, y: 50 }); // 중앙 기준
    }
  };

  // 드래그 중
  const handleDragMove = (e) => {
    if (!draggedItem) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // 화면 밖으로 나가지 않도록
    const boundedX = Math.max(0, Math.min(window.innerWidth - 100, x));
    const boundedY = Math.max(0, Math.min(window.innerHeight - 100, y));
    
    // 임시로 업데이트 (실제 저장은 드래그 끝날 때)
    const updatedItems = customization.items.filter(item => item.itemId !== draggedItem);
    updatedItems.push({ itemId: draggedItem, x: boundedX, y: boundedY });
    setCustomization({ ...customization, items: updatedItems });
  };

  // 드래그 끝
  const handleDragEnd = (e) => {
    if (!draggedItem) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // 화면 밖으로 나가지 않도록
    const boundedX = Math.max(0, Math.min(window.innerWidth - 100, x));
    const boundedY = Math.max(0, Math.min(window.innerHeight - 100, y));
    
    // 서버에 저장
    placeItem(draggedItem, boundedX, boundedY);
    
    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // 상점 아이템 마스터 데이터
  const shopItemsData = {
    // 배경
    wall_gray_iron_plate: { name: '회색 철판 벽', icon: '🔩', category: 'background' },
    wall_sleepy_moon_cloud: { name: '졸린 달님과 구름', icon: '🌙', category: 'background' },
    wall_pastel_pink_cotton: { name: '파스텔 핑크 코튼', icon: '🩷', category: 'background' },
    wall_candy_planet_system: { name: '캔디 행성계', icon: '🍬', category: 'background' },
    wall_nasa_white_panel: { name: 'NASA 스타일 화이트 패널', icon: '🚀', category: 'background' },
    wall_dyson_sphere_interior: { name: '다이슨 스피어 내부', icon: '⚛️', category: 'background' },
    wall_window_aurora_nebula: { name: '오로라 성운 창문', icon: '🌌', category: 'background' },
    wall_window_blackhole_abyss: { name: '심연의 블랙홀 관측창', icon: '🕳️', category: 'background' },
    wall_supernova_remnant: { name: '초신성 폭발 잔해', icon: '💥', category: 'background' },
    
    // 조종석
    cockpit_wooden_basic: { name: '기본 목재 조종석', icon: '🪵', category: 'cockpit' },
    cockpit_seat_pink_jelly_cat: { name: '핑크 젤리 캣 시트', icon: '🐱', category: 'cockpit' },
    cockpit_seat_nasa_ergonomic: { name: 'NASA 표준 인체공학석', icon: '🚀', category: 'cockpit' },
    cockpit_dash_space_whale: { name: '우주 고래 대시보드', icon: '🐋', category: 'cockpit' },
    cockpit_stealth_ship: { name: '스텔스 함선 콕핏', icon: '🥷', category: 'cockpit' },
    cockpit_nest_space_bear: { name: '우주 곰돌이 둥지', icon: '🧸', category: 'cockpit' },
    cockpit_bio_organic_alien: { name: '외계 유기체 생체석', icon: '👽', category: 'cockpit' },
    cockpit_antigravity_command: { name: '반중력 커맨드 포드', icon: '🛸', category: 'cockpit' },
    cockpit_item_star_wand: { name: '마법소녀 스타 완드', icon: '⭐', category: 'cockpit' },
    
    // 배치 아이템 (애니메이션 - assets/item 폴더)
    item_floating_saturn_planter: { name: '떠다니는 토성 화분', icon: '🪴', category: 'item' },
    item_industrial_toolbox_greasy: { name: '산업용 공구 상자', icon: '🧰', category: 'item' },
    item_flying_bird: { name: '날아다니는 새', icon: '🐦', category: 'item' },
    item_cute_stardust_jar: { name: '귀여운 별가루 병', icon: '✨', category: 'item' },
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-black korean-font"
      onMouseMove={isEditMode ? handleDragMove : undefined}
      onMouseUp={isEditMode ? handleDragEnd : undefined}
    >
      {/* 떠다니는 효과 CSS */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes float-medium {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        
        .float-1 {
          animation: float 3s ease-in-out infinite;
        }
        
        .float-2 {
          animation: float 3.5s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        
        .float-3 {
          animation: float-slow 4s ease-in-out infinite;
          animation-delay: 0.4s;
        }
        
        .float-4 {
          animation: float-medium 3.2s ease-in-out infinite;
          animation-delay: 0.6s;
        }
        
        .float-5 {
          animation: float 3.8s ease-in-out infinite;
          animation-delay: 0.8s;
        }
      `}</style>
      {/* 우주선 내부 배경 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated',
        }}
      />
      
      {/* 살짝 어두운 오버레이 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 10,
        }}
      />

      {/* 배치된 아이템 렌더링 (메인 방에서만) */}
      {currentRoom === 'main' && customization.items.map((item, index) => {
        const itemData = shopItemsData[item.itemId];
        if (!itemData || itemData.category !== 'item') return null;
        
        const floatClass = `float-${(index % 5) + 1}`;
        
        return (
          <div
            key={item.itemId}
            className={`absolute z-30 rounded-lg transition-all ${floatClass} ${
              isEditMode
                ? 'cursor-move bg-gray-800 bg-opacity-80 border-2 border-purple-500 hover:border-purple-300 hover:scale-110 p-2'
                : 'cursor-default bg-transparent'
            }`}
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
            }}
            onMouseDown={isEditMode ? (e) => {
              e.preventDefault();
              handleDragStart(item.itemId, e);
            } : undefined}
            onDoubleClick={isEditMode ? () => {
              if (window.confirm(`${itemData.name}을(를) 제거하시겠습니까?`)) {
                removeItem(item.itemId);
              }
            } : undefined}
            title={isEditMode ? `${itemData.name} (더블클릭: 제거)` : itemData.name}
          >
            {/* 애니메이션 아이템 렌더링 */}
            <AnimatedItem 
              itemId={item.itemId} 
              size={80}
            />
          </div>
        );
      })}


      <div className="relative z-20 p-6">

        {/* 왼쪽 상단: 상점 & 우주선 꾸미기 버튼 (메인 방에서만 표시) */}
        {currentRoom === 'main' && (
          <div className="flex flex-col gap-3 float-1" style={{ width: 'fit-content' }}>
            {/* 상점 (편집 모드 아닐 때만) */}
            {!isEditMode && (
              <button 
                onClick={() => navigate('/shop')}
                className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500"
              >
                <span className="text-2xl">🛒</span>
                <span className="korean-font text-lg">상점</span>
              </button>
            )}
            
            {/* 우주선 꾸미기 / 편집 완료 */}
            <button
              onClick={toggleEditMode}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all border korean-font text-lg font-bold ${
                isEditMode
                  ? 'bg-green-600 hover:bg-green-500 text-white border-green-400 animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400'
              }`}
            >
              <span className="text-2xl">{isEditMode ? '✅' : '✏️'}</span>
              <span>{isEditMode ? '편집 완료' : '우주선 꾸미기'}</span>
            </button>
          </div>
        )}

        {/* 🛠️ 편집 모드 패널 (왼쪽) */}
        {currentRoom === 'main' && isEditMode && (
          <div className="flex flex-col gap-3 float-2" style={{ width: 'fit-content' }}>
            {/* 배경 변경 */}
            <button
              onClick={() => !showBackgroundModal && setShowBackgroundModal(true)}
              disabled={showBackgroundModal}
              className={`flex items-center gap-3 bg-purple-900 bg-opacity-90 text-white px-6 py-3 rounded-lg transition-all border-2 border-purple-500 ${
                showBackgroundModal 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-opacity-100 hover:border-purple-300'
              }`}
            >
              <span className="text-2xl">🎨</span>
              <span className="korean-font text-lg">배경 변경</span>
            </button>

            {/* 조종석 변경 */}
            <button
              onClick={() => !showCockpitModal && setShowCockpitModal(true)}
              disabled={showCockpitModal}
              className={`flex items-center gap-3 bg-purple-900 bg-opacity-90 text-white px-6 py-3 rounded-lg transition-all border-2 border-purple-500 ${
                showCockpitModal 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-opacity-100 hover:border-purple-300'
              }`}
            >
              <span className="text-2xl">🎮</span>
              <span className="korean-font text-lg">조종석 변경</span>
            </button>

            {/* 아이템 목록 토글 */}
            <button
              onClick={() => setShowItemSidebar(!showItemSidebar)}
              className="flex items-center gap-3 bg-purple-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border-2 border-purple-500 hover:border-purple-300"
            >
              <span className="text-2xl">🪑</span>
              <span className="korean-font text-lg">아이템 배치</span>
            </button>

            {/* 상점 바로가기 */}
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center gap-3 bg-blue-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border-2 border-blue-500 hover:border-blue-300"
            >
              <span className="text-2xl">🛒</span>
              <span className="korean-font text-lg">상점</span>
            </button>
          </div>
        )}

        {/* 🪑 아이템 사이드바 (편집 모드) */}
        {isEditMode && showItemSidebar && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-900 bg-opacity-95 p-4 rounded-r-lg border-2 border-purple-500 max-h-96 overflow-y-auto" style={{ width: '250px', marginLeft: '200px' }}>
            <h3 className="pixel-font text-white text-lg mb-3">보유 아이템</h3>
            <div className="space-y-2">
              {purchasedItems
                .filter(itemId => shopItemsData[itemId]?.category === 'item')
                .map((itemId) => {
                  const itemData = shopItemsData[itemId];
                  const isPlaced = customization.items.some(item => item.itemId === itemId);
                  
                  return (
                    <div
                      key={itemId}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-move transition-all ${
                        isPlaced
                          ? 'bg-green-800 border border-green-500'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(itemId, e)}
                    >
                      {/* 애니메이션 아이템 미리보기 */}
                      <div className="shrink-0">
                        <AnimatedItem 
                          itemId={itemId} 
                          size={40}
                        />
                      </div>
                      <div>
                        <p className="text-white text-sm">{itemData.name}</p>
                        {isPlaced && <p className="text-green-300 text-xs">✓ 배치됨</p>}
                      </div>
                    </div>
                  );
                })}
              {purchasedItems.filter(itemId => shopItemsData[itemId]?.category === 'item').length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  구매한 아이템이 없습니다.
                  <br />
                  <button
                    onClick={() => navigate('/shop')}
                    className="korean-font text-purple-400 hover:text-purple-300 underline mt-2"
                  >
                    상점으로 이동
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* 유저 정보 + 통계 (오른쪽 상단) */}
        {user && (
          <div className="absolute top-6 right-6 text-right space-y-3 float-3">
            {/* 유저 이름 */}
            <p className="text-white text-lg">
              <span className="text-blue-400 font-bold">{user.nickname}</span>님
            </p>
            
            {/* 자원 표시 (별, 크레딧, 우주 부품) */}
            <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 border border-gray-700 space-y-2">
              {isLoadingStats ? (
                <p className="text-gray-400 text-sm">로딩 중...</p>
              ) : (
                <>
                  {/* 별 개수 (누적 포인트) */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-yellow-400 text-2xl">⭐</span>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold text-xl">{userResources.stars}</p>
                      <p className="text-gray-400 text-xs">별</p>
                    </div>
                  </div>
                  
                  {/* 구분선 */}
                  <div className="border-t border-gray-700"></div>
                  
                  {/* 크레딧 (일반 화폐) */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-green-400 text-2xl">💰</span>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-xl">{userResources.credits}</p>
                      <p className="text-gray-400 text-xs">크레딧</p>
                    </div>
                  </div>
                  
                  {/* 구분선 */}
                  <div className="border-t border-gray-700"></div>
                  
                  {/* 우주 부품 (희귀 화폐) */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-purple-400 text-2xl">🔧</span>
                    <div className="text-right">
                      <p className="text-purple-400 font-bold text-xl">{userResources.spaceParts}</p>
                      <p className="text-gray-400 text-xs">우주 부품</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* 방 전환 화살표 (왼쪽) */}
        {currentRoom === 'main' && (
          <div className="absolute left-0" style={{ top: '400px' }}>
            <button
              onClick={goToGallery}
              className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white p-4 rounded-r-lg transition-all border-r border-t border-b border-gray-700 hover:border-blue-500"
              title="갤러리로 이동"
            >
              <span className="text-3xl">←</span>
            </button>
            <p className="text-white text-sm mt-2 pl-2 korean-font">모은 액자들</p>
          </div>
        )}

        {/* 조종실로 이동 화살표 (오른쪽) */}
        {currentRoom === 'main' && (
          <div className="absolute right-0" style={{ top: '400px' }}>
            <button
              onClick={goToCockpit}
              className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white p-4 rounded-l-lg transition-all border-l border-t border-b border-gray-700 hover:border-blue-500"
              title="조종실로 이동"
            >
              <span className="text-3xl">→</span>
            </button>
            <p className="text-white text-sm mt-2 pr-2 korean-font">조종실</p>
          </div>
        )}

        {/* 방 전환 화살표 (오른쪽) */}
        {currentRoom === 'gallery' && (
          <div className="absolute right-0" style={{ top: '400px' }}>
            <button
              onClick={goToMain}
              className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white p-4 rounded-l-lg transition-all border-l border-t border-b border-gray-700 hover:border-blue-500"
              title="메인 방으로 돌아가기"
            >
              <span className="text-3xl">→</span>
            </button>
            <p className="text-white text-sm mt-2 pr-2 pixel-font">돌아가기</p>
          </div>
        )}

        {/* 중앙 콘텐츠 영역 */}
        <div 
          className="absolute inset-0 flex justify-center pointer-events-none" 
          style={{ 
            alignItems: 'flex-start',
            paddingTop: currentRoom === 'gallery' ? '200px' : '80px'
          }}
        >
          <div className="pointer-events-auto">
            {currentRoom === 'main' ? (
              /* 메인 방 */
              <div className="flex gap-8 items-start">
                {/* 🎁 마일스톤 진행 상황 카드 (편집 모드가 아닐 때만) */}
                {!isEditMode && (
                  <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 mb-6 border-2 border-yellow-500 shadow-2xl max-w-md mx-auto float-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-left">
                        <p className="text-gray-300 text-sm mb-1">현재 진행</p>
                        <p className="pixel-font text-3xl text-yellow-400">⭐ {userResources.stars}</p>
                      </div>
                      <button
                        onClick={() => setShowMilestoneModal(true)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg pixel-font text-sm transition-all"
                      >
                        🎁 전체보기
                      </button>
                    </div>

                    {/* 다음 마일스톤 정보 */}
                    {getNextMilestone(userResources.stars) ? (
                      <>
                        <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 mb-3">
                          <p className="text-blue-300 text-sm mb-2">🎯 다음 목표</p>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white pixel-font">
                              별 <span className="text-yellow-400">{getNextMilestone(userResources.stars).requiredStars}</span>개
                            </p>
                            <p className="text-gray-400 text-sm">
                              {getStarsNeeded(userResources.stars)}개 남음
                            </p>
                          </div>
                          
                          {/* 진행 바 */}
                          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                              style={{ 
                                width: `${Math.min(100, (userResources.stars / getNextMilestone(userResources.stars).requiredStars) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>

                        {/* 보상 미리보기 */}
                        <div className="flex flex-wrap gap-2 justify-center">
                          <p className="text-gray-400 text-xs w-full mb-1">달성 시 보상:</p>
                          {getNextMilestone(userResources.stars).rewardCredits > 0 && (
                            <div className="flex items-center gap-1 bg-green-900 bg-opacity-50 px-3 py-1 rounded-lg border border-green-600">
                              <span className="text-sm">💰</span>
                              <span className="text-green-300 text-sm font-bold">+{getNextMilestone(userResources.stars).rewardCredits}</span>
                            </div>
                          )}
                          {getNextMilestone(userResources.stars).rewardSpaceParts > 0 && (
                            <div className="flex items-center gap-1 bg-purple-900 bg-opacity-50 px-3 py-1 rounded-lg border border-purple-600">
                              <span className="text-sm">🔧</span>
                              <span className="text-purple-300 text-sm font-bold">+{getNextMilestone(userResources.stars).rewardSpaceParts}</span>
                            </div>
                          )}
                          {getNextMilestone(userResources.stars).unlocksSector && (
                            <div className="flex items-center gap-1 bg-blue-900 bg-opacity-50 px-3 py-1 rounded-lg border border-blue-600">
                              <span className="text-sm">🚀</span>
                              <span className="text-blue-300 text-sm font-bold">{getNextMilestone(userResources.stars).unlocksSector.name}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-2xl mb-2">🏆</p>
                        <p className="text-yellow-400 pixel-font">모든 마일스톤 달성!</p>
                        <p className="text-gray-400 text-sm mt-1">완벽한 정복자입니다!</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* APOD 창문 버튼 */}
                {!isEditMode && (
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => navigate('/apod-info')}
                    className="group relative transition-all transform hover:scale-105 cursor-pointer"
                    style={{
                      width: '300px',
                      height: '225px',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                    }}
                    onMouseEnter={() => setIsApodHovered(true)}
                    onMouseLeave={() => setIsApodHovered(false)}
                  >
                    <AnimatedApodWindow 
                      isHovered={isApodHovered}
                      width={300}
                      height={225}
                    />
                  </button>
                  <div className="text-center mt-3">
                    <p className="pixel-font text-gray-300 text-xs">Astronomy Picture</p>
                    <p className="pixel-font text-gray-300 text-xs">of the Day</p>
                  </div>
                </div>
                )}
              </div>
            ) : (
              /* 갤러리 방 (클리어한 천체들) */
              <div className="text-center">
                <h2 className="korean-font text-3xl text-white mb-6">갤러리</h2>
                <p className="text-gray-400 text-sm mb-8">클리어한 천체들을 감상하세요</p>
                
                {isLoadingGallery ? (
                  <div className="text-gray-400 pixel-font">로딩 중...</div>
                ) : clearedCelestials.length > 0 ? (
                  /* 클리어한 천체 그리드 - 액자 형태 */
                  <div className="grid grid-cols-4 gap-6 max-h-96 overflow-y-auto">
                    {clearedCelestials.map((celestial) => (
                      <div
                        key={celestial.id}
                        onClick={() => {
                          // 천체 상세 정보 표시
                          const info = [
                            `🌍 ${celestial.title || celestial.name}`,
                            `🌎 ${celestial.nameEn || ''}`,
                            `⭐ 보상: ${celestial.rewardStars || 0}개`,
                            `📊 난이도: ${celestial.difficulty || '?'}`,
                            `🧩 크기: ${celestial.gridSize || '?'}×${celestial.gridSize || '?'}`,
                            `📅 클리어: ${celestial.clearedAt ? new Date(celestial.clearedAt).toLocaleDateString('ko-KR') : '정보 없음'}`,
                          ].join('\n');
                          alert(info);
                        }}
                        className="relative cursor-pointer transition-all transform hover:scale-105 flex flex-col items-center"
                        title={`${celestial.name} - ${celestial.clearedAt ? new Date(celestial.clearedAt).toLocaleDateString() : ''}`}
                      >
                        {/* 액자 + 천체 이미지 */}
                        <div className="relative" style={{ width: '180px', height: '180px' }}>
                          {/* 천체 이미지 (뒤쪽 레이어) */}
                          <div 
                            className="absolute flex items-center justify-center bg-black"
                            style={{ 
                              top: '38px',
                              left: '38px',
                              right: '38px',
                              bottom: '38px',
                              zIndex: 1,
                            }}
                          >
                            {celestial.image ? (
                              <img
                                src={celestial.image}
                                alt={celestial.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('❌ 천체 이미지 로드 실패:', celestial.name, celestial.image);
                                }}
                                onLoad={() => console.log('✅ 천체 이미지 로드 성공:', celestial.name, celestial.image)}
                              />
                            ) : (
                              <div 
                                className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500"
                              />
                            )}
                          </div>
                          
                          {/* 액자 프레임 (앞쪽 레이어) */}
                          <img
                            src={frameImage}
                            alt="frame"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            style={{
                              imageRendering: 'pixelated',
                              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
                              zIndex: 2,
                            }}
                          />
                        </div>
                        
                        {/* 천체 이름 */}
                        <p className="text-white korean-font text-xs text-center mt-2">{celestial.name}</p>
                        
                        {/* 별 개수 */}
                        {celestial.starsEarned > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-400 text-xs">⭐</span>
                            <span className="pixel-font text-yellow-400 text-xs">{celestial.starsEarned}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 빈 갤러리 */
                  <div className="text-center py-12">
                    <p className="text-4xl mb-4">📭</p>
                    <p className="text-gray-400 korean-font text-lg">아직 클리어한 천체가 없습니다</p>
                    <p className="text-gray-500 korean-font text-sm mt-2">퍼즐을 완료하면 여기에 표시됩니다!</p>
                    <button
                      onClick={goToMain}
                      className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg korean-font transition-all"
                    >
                      퍼즐 플레이하러 가기 →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🎨 배경 선택 모달 */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full border-2 border-purple-500">
            <h2 className="pixel-font text-3xl text-white mb-6 text-center">배경 선택</h2>
            
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {purchasedItems
                .filter(itemId => shopItemsData[itemId]?.category === 'background')
                .map((bgId) => {
                  const bgData = shopItemsData[bgId];
                  const isSelected = customization.background === bgId;
                  
                  return (
                    <button
                      key={bgId}
                      onClick={() => changeBackground(bgId)}
                      disabled={isChangingBackground}
                      className={`p-6 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-green-800 border-2 border-green-500'
                          : isChangingBackground
                          ? 'bg-gray-800 border-2 border-gray-600 opacity-50 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'
                      }`}
                    >
                      <span className="text-6xl block mb-3">{bgData.icon}</span>
                      <p className="text-white font-bold">{bgData.name}</p>
                      {isSelected && <p className="text-green-300 text-sm mt-1">✓ 현재 사용 중</p>}
                      {isChangingBackground && !isSelected && <p className="text-yellow-400 text-sm mt-1">변경 중...</p>}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => setShowBackgroundModal(false)}
              className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg pixel-font"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 🎮 조종석 선택 모달 */}
      {showCockpitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full border-2 border-purple-500">
            <h2 className="pixel-font text-3xl text-white mb-6 text-center">조종석 선택</h2>
            
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {purchasedItems
                .filter(itemId => shopItemsData[itemId]?.category === 'cockpit')
                .map((cockpitId) => {
                  const cockpitData = shopItemsData[cockpitId];
                  const isSelected = customization.cockpit === cockpitId;
                  
                  return (
                    <button
                      key={cockpitId}
                      onClick={() => changeCockpit(cockpitId)}
                      disabled={isChangingCockpit}
                      className={`p-6 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-green-800 border-2 border-green-500'
                          : isChangingCockpit
                          ? 'bg-gray-800 border-2 border-gray-600 opacity-50 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'
                      }`}
                    >
                      <span className="text-6xl block mb-3">{cockpitData.icon}</span>
                      <p className="text-white font-bold">{cockpitData.name}</p>
                      {isSelected && <p className="text-green-300 text-sm mt-1">✓ 현재 사용 중</p>}
                      {isChangingCockpit && !isSelected && <p className="text-yellow-400 text-sm mt-1">변경 중...</p>}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => setShowCockpitModal(false)}
              className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg pixel-font"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 🎁 마일스톤 모달 */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 rounded-xl p-8 max-w-4xl w-full border-2 border-yellow-500 max-h-[90vh] overflow-y-auto">
            <h2 className="pixel-font text-4xl text-white mb-2 text-center">🎁 별 마일스톤</h2>
            <p className="text-gray-400 text-center mb-6">
              별을 모아 보상을 받고 새로운 섹터를 해금하세요!
            </p>

            {/* 현재 진행 상황 */}
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 mb-6 border-2 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-300 text-sm mb-1">현재 보유 별</p>
                  <p className="pixel-font text-4xl text-yellow-400">⭐ {userResources.stars}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-300 text-sm mb-1">달성한 마일스톤</p>
                  <p className="pixel-font text-2xl text-green-400">
                    {getAchievedMilestones(userResources.stars).length} / {MILESTONES.length}
                  </p>
                </div>
              </div>

              {/* 다음 마일스톤 */}
              {getNextMilestone(userResources.stars) && (
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-blue-400">
                  <p className="text-blue-300 text-sm mb-2">🎯 다음 목표</p>
                  <div className="flex items-center justify-between">
                    <p className="text-white">
                      별 <span className="text-yellow-400 font-bold">{getNextMilestone(userResources.stars).requiredStars}</span>개 달성
                    </p>
                    <p className="text-gray-400 text-sm">
                      ({getStarsNeeded(userResources.stars)}개 남음)
                    </p>
                  </div>
                  {/* 진행 바 */}
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (userResources.stars / getNextMilestone(userResources.stars).requiredStars) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 마일스톤 목록 */}
            <div className="space-y-3">
              {MILESTONES.map((milestone) => {
                const isAchieved = userResources.stars >= milestone.requiredStars;
                const isCurrent = getNextMilestone(userResources.stars)?.id === milestone.id;
                
                return (
                  <div
                    key={milestone.id}
                    className={`rounded-lg p-5 border-2 transition-all ${
                      isAchieved
                        ? 'bg-green-900 bg-opacity-50 border-green-500'
                        : isCurrent
                        ? 'bg-blue-900 bg-opacity-50 border-blue-500 animate-pulse'
                        : 'bg-gray-800 bg-opacity-50 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {isAchieved ? '✅' : isCurrent ? '🎯' : '⭐'}
                        </span>
                        <div>
                          <p className="pixel-font text-xl text-white">
                            별 {milestone.requiredStars}개
                          </p>
                          <p className="text-gray-400 text-sm">{milestone.description}</p>
                        </div>
                      </div>
                      {isAchieved && (
                        <span className="pixel-font text-green-400 text-sm">달성 완료!</span>
                      )}
                    </div>

                    {/* 보상 정보 */}
                    <div className="flex flex-wrap gap-3 ml-12">
                      {milestone.rewardCredits > 0 && (
                        <div className="flex items-center gap-2 bg-green-900 bg-opacity-50 px-3 py-1 rounded-lg border border-green-600">
                          <span className="text-xl">💰</span>
                          <span className="text-green-300 font-bold">+{milestone.rewardCredits}</span>
                        </div>
                      )}
                      {milestone.rewardSpaceParts > 0 && (
                        <div className="flex items-center gap-2 bg-purple-900 bg-opacity-50 px-3 py-1 rounded-lg border border-purple-600">
                          <span className="text-xl">🔧</span>
                          <span className="text-purple-300 font-bold">+{milestone.rewardSpaceParts}</span>
                        </div>
                      )}
                      {milestone.unlocksSector && (
                        <div className="flex items-center gap-2 bg-blue-900 bg-opacity-50 px-3 py-1 rounded-lg border border-blue-600">
                          <span className="text-xl">🚀</span>
                          <span className="text-blue-300 font-bold">{milestone.unlocksSector.name} 해금</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowMilestoneModal(false)}
              className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg pixel-font text-lg"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
