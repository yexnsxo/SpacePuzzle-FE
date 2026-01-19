import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import spaceshipInterior from '../assets/login/spaceship-interior.jpg';
import { supabase } from '../supabaseClient';
import { MILESTONES, getNextMilestone, getAchievedMilestones, getStarsNeeded } from '../data/milestones';

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
  
  // 🎁 마일스톤 모달
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  
  // 커스터마이제이션 데이터
  const [customization, setCustomization] = useState({
    background: 'bg_default',
    cockpit: 'cockpit_default',
    items: [], // { itemId, x, y }
  });
  
  // 구매한 아이템 목록
  const [purchasedItems, setPurchasedItems] = useState([]);
  
  // 드래그 중인 아이템
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 갤러리 - 클리어한 천체 목록
  const [clearedCelestials, setClearedCelestials] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);

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
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);

  const fetchUserStats = async () => {
    setIsLoadingStats(true);
    try {
      // 게스트 모드 체크
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isGuest) {
        const guestStats = JSON.parse(
          localStorage.getItem('guestStats') || 
          '{"stars": 0, "credits": 20, "spaceParts": 0}'
        );
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
        const guestCustomization = JSON.parse(
          localStorage.getItem('guestCustomization') || 
          '{"background": "bg_default", "cockpit": "cockpit_default", "items": []}'
        );
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
        setCustomization(data);
      } else if (response.status === 404) {
        // 백엔드 API가 아직 없으면 기본값 사용
        console.warn('⚠️ 백엔드 API 미구현: /user/customization (기본값 사용)');
        setCustomization({
          background: 'bg_default',
          cockpit: 'cockpit_default',
          items: [],
        });
      }
    } catch (error) {
      console.error('커스터마이제이션 가져오기 실패:', error);
      setCustomization({
        background: 'bg_default',
        cockpit: 'cockpit_default',
        items: [],
      });
    }
  };

  const fetchPurchasedItems = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestPurchased = JSON.parse(localStorage.getItem('guestPurchasedItems') || '[]');
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
        setPurchasedItems(data.items || []);
      } else if (response.status === 404) {
        // 백엔드 API가 아직 없으면 기본값 사용
        console.warn('⚠️ 백엔드 API 미구현: /shop/purchased (기본값 사용)');
        setPurchasedItems(['bg_default', 'cockpit_default']);
      }
    } catch (error) {
      console.error('구매 내역 가져오기 실패:', error);
      // 에러 발생 시 기본값 사용
      setPurchasedItems(['bg_default', 'cockpit_default']);
    }
  };

  const fetchGallery = async () => {
    setIsLoadingGallery(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCleared = JSON.parse(localStorage.getItem('guestClearedCelestials') || '[]');
        setClearedCelestials(guestCleared);
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
        setClearedCelestials(data.cleared || []);
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
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCustomization = JSON.parse(
          localStorage.getItem('guestCustomization') || 
          '{"background": "bg_default", "cockpit": "cockpit_default", "items": []}'
        );
        guestCustomization.background = bgId;
        localStorage.setItem('guestCustomization', JSON.stringify(guestCustomization));
        setCustomization({ ...customization, background: bgId });
        setShowBackgroundModal(false);
        alert('배경이 변경되었습니다!');
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
            type: 'background',
            itemId: bgId,
          }),
        }
      );

      if (response.ok) {
        setCustomization({ ...customization, background: bgId });
        setShowBackgroundModal(false);
        alert('배경이 변경되었습니다!');
      } else {
        const error = await response.json();
        alert(`변경 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('배경 변경 실패:', error);
      alert('배경 변경 중 오류가 발생했습니다.');
    }
  };

  // 🎮 조종석 변경
  const changeCockpit = async (cockpitId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCustomization = JSON.parse(
          localStorage.getItem('guestCustomization') || 
          '{"background": "bg_default", "cockpit": "cockpit_default", "items": []}'
        );
        guestCustomization.cockpit = cockpitId;
        localStorage.setItem('guestCustomization', JSON.stringify(guestCustomization));
        setCustomization({ ...customization, cockpit: cockpitId });
        setShowCockpitModal(false);
        alert('조종석이 변경되었습니다!');
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

      if (response.ok) {
        setCustomization({ ...customization, cockpit: cockpitId });
        setShowCockpitModal(false);
        alert('조종석이 변경되었습니다!');
      } else {
        const error = await response.json();
        alert(`변경 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('조종석 변경 실패:', error);
      alert('조종석 변경 중 오류가 발생했습니다.');
    }
  };

  // 🪑 아이템 배치
  const placeItem = async (itemId, x, y) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 게스트 모드
      if (user.isGuest) {
        const guestCustomization = JSON.parse(
          localStorage.getItem('guestCustomization') || 
          '{"background": "bg_default", "cockpit": "cockpit_default", "items": []}'
        );
        
        // 기존 아이템 제거 후 새 위치에 추가
        guestCustomization.items = guestCustomization.items.filter(item => item.itemId !== itemId);
        guestCustomization.items.push({ itemId, x, y });
        
        localStorage.setItem('guestCustomization', JSON.stringify(guestCustomization));
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
        const guestCustomization = JSON.parse(
          localStorage.getItem('guestCustomization') || 
          '{"background": "bg_default", "cockpit": "cockpit_default", "items": []}'
        );
        
        guestCustomization.items = guestCustomization.items.filter(item => item.itemId !== itemId);
        localStorage.setItem('guestCustomization', JSON.stringify(guestCustomization));
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
    bg_default: { name: '기본 우주선', icon: '🌌', category: 'background' },
    bg_luxury: { name: '럭셔리 우주선', icon: '✨', category: 'background' },
    bg_military: { name: '군용 우주선', icon: '🛡️', category: 'background' },
    bg_futuristic: { name: '미래형 우주선', icon: '🔮', category: 'background' },
    cockpit_default: { name: '기본 조종석', icon: '🕹️', category: 'cockpit' },
    cockpit_advanced: { name: '고급 조종석', icon: '⚡', category: 'cockpit' },
    cockpit_retro: { name: '레트로 조종석', icon: '🎮', category: 'cockpit' },
    item_plant: { name: '우주 식물', icon: '🌿', category: 'item' },
    item_poster: { name: '은하 포스터', icon: '🖼️', category: 'item' },
    item_lamp: { name: '네온 램프', icon: '💡', category: 'item' },
    item_telescope: { name: '망원경', icon: '🔭', category: 'item' },
    item_robot: { name: 'AI 로봇', icon: '🤖', category: 'item' },
    item_hologram: { name: '홀로그램', icon: '📺', category: 'item' },
    item_music: { name: '음악 플레이어', icon: '🎵', category: 'item' },
    ai_robot_arm: { name: 'AI 로봇 팔', icon: '🦾', category: 'item' },
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-black"
      onMouseMove={isEditMode ? handleDragMove : undefined}
      onMouseUp={isEditMode ? handleDragEnd : undefined}
    >
      {/* 우주선 내부 배경 */}
      <img
        src={spaceshipInterior}
        alt="Spaceship Interior"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          zIndex: 0,
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
      {currentRoom === 'main' && customization.items.map((item) => {
        const itemData = shopItemsData[item.itemId];
        if (!itemData || itemData.category !== 'item') return null;
        
        return (
          <div
            key={item.itemId}
            className={`absolute z-30 p-4 rounded-lg transition-all ${
              isEditMode
                ? 'cursor-move bg-gray-800 bg-opacity-80 border-2 border-purple-500 hover:border-purple-300 hover:scale-110'
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
            <span className="text-4xl">{itemData.icon}</span>
          </div>
        );
      })}

      {/* 🛠️ 편집 모드 버튼 (하단 중앙) - 최상위 z-index */}
      {currentRoom === 'main' && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={toggleEditMode}
            className={`pixel-font px-8 py-4 rounded-lg transition-all text-lg font-bold shadow-2xl ${
              isEditMode
                ? 'bg-green-600 hover:bg-green-500 text-white border-4 border-green-400 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-500 text-white border-4 border-purple-400'
            }`}
          >
            {isEditMode ? '✅ 편집 완료' : '✏️ 우주선 꾸미기'}
          </button>
        </div>
      )}

      <div className="relative z-20 p-6">

        {/* 왼쪽 상단 탭 메뉴 (메인 방에서만 표시, 편집 모드 아닐 때만) */}
        {currentRoom === 'main' && !isEditMode && (
          <div className="flex flex-col gap-3" style={{ width: 'fit-content' }}>
            {/* 메뉴 */}
            <button className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500">
              <span className="text-2xl">☰</span>
              <span className="pixel-font text-lg">메뉴</span>
            </button>

            {/* 마일스톤 */}
            <button 
              onClick={() => setShowMilestoneModal(true)}
              className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-yellow-500"
            >
              <span className="text-2xl">🎁</span>
              <span className="pixel-font text-lg">마일스톤</span>
            </button>

            {/* 상점 */}
            <button 
              onClick={() => navigate('/shop')}
              className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500"
            >
              <span className="text-2xl">🛒</span>
              <span className="pixel-font text-lg">상점</span>
            </button>

            {/* 설정 */}
            <button className="flex items-center gap-3 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-700 hover:border-blue-500">
              <span className="text-2xl">⚙️</span>
              <span className="pixel-font text-lg">설정</span>
            </button>
          </div>
        )}

        {/* 🛠️ 편집 모드 패널 (왼쪽) */}
        {currentRoom === 'main' && isEditMode && (
          <div className="flex flex-col gap-3" style={{ width: 'fit-content' }}>
            {/* 배경 변경 */}
            <button
              onClick={() => setShowBackgroundModal(true)}
              className="flex items-center gap-3 bg-purple-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border-2 border-purple-500 hover:border-purple-300"
            >
              <span className="text-2xl">🎨</span>
              <span className="pixel-font text-lg">배경 변경</span>
            </button>

            {/* 조종석 변경 */}
            <button
              onClick={() => setShowCockpitModal(true)}
              className="flex items-center gap-3 bg-purple-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border-2 border-purple-500 hover:border-purple-300"
            >
              <span className="text-2xl">🎮</span>
              <span className="pixel-font text-lg">조종석 변경</span>
            </button>

            {/* 아이템 목록 토글 */}
            <button
              onClick={() => setShowItemSidebar(!showItemSidebar)}
              className="flex items-center gap-3 bg-purple-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border-2 border-purple-500 hover:border-purple-300"
            >
              <span className="text-2xl">🪑</span>
              <span className="pixel-font text-lg">아이템 배치</span>
            </button>

            {/* 상점 바로가기 */}
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center gap-3 bg-blue-900 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border-2 border-blue-500 hover:border-blue-300"
            >
              <span className="text-2xl">🛒</span>
              <span className="pixel-font text-lg">상점</span>
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
                      <span className="text-2xl">{itemData.icon}</span>
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
                    className="text-purple-400 hover:text-purple-300 underline mt-2"
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
          <div className="absolute top-6 right-6 text-right space-y-3">
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
          <div className="absolute left-0" style={{ top: '60%' }}>
            <button
              onClick={goToGallery}
              className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white p-4 rounded-r-lg transition-all border-r border-t border-b border-gray-700 hover:border-blue-500"
              title="갤러리로 이동"
            >
              <span className="text-3xl">←</span>
            </button>
            <p className="text-white text-sm mt-2 pl-2 pixel-font">모은 액자들</p>
          </div>
        )}

        {/* 조종실로 이동 화살표 (오른쪽) */}
        {currentRoom === 'main' && (
          <div className="absolute right-0" style={{ top: '60%' }}>
            <button
              onClick={goToCockpit}
              className="bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white p-4 rounded-l-lg transition-all border-l border-t border-b border-gray-700 hover:border-blue-500"
              title="조종실로 이동"
            >
              <span className="text-3xl">→</span>
            </button>
            <p className="text-white text-sm mt-2 pr-2 pixel-font">조종실</p>
          </div>
        )}

        {/* 방 전환 화살표 (오른쪽) */}
        {currentRoom === 'gallery' && (
          <div className="absolute right-0" style={{ top: '70%' }}>
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
            alignItems: currentRoom === 'gallery' ? 'flex-start' : 'center',
            paddingTop: currentRoom === 'gallery' ? '200px' : '0'
          }}
        >
          <div className="pointer-events-auto">
            {currentRoom === 'main' ? (
              /* 메인 방 (우주선 내부) */
              <div className="text-center">
                <h2 className="pixel-font text-3xl text-white mb-4">우주선 내부</h2>
                
                {/* 🎁 마일스톤 진행 상황 카드 (편집 모드가 아닐 때만) */}
                {!isEditMode && (
                  <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 mb-6 border-2 border-yellow-500 shadow-2xl max-w-md mx-auto">
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
                <button
                  onClick={() => navigate('/apod-info')}
                  className="group relative bg-gradient-to-br from-blue-900 to-purple-900 border-8 border-gray-700 rounded-3xl p-12 hover:border-blue-500 transition-all transform hover:scale-105 shadow-2xl"
                  style={{
                    width: '400px',
                    height: '300px',
                  }}
                >
                  {/* 창문 프레임 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent rounded-2xl pointer-events-none"></div>
                  
                  {/* 중앙 십자가 (창문 구조) */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-gray-700 transform -translate-x-1/2"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-700 transform -translate-y-1/2"></div>
                  
                  {/* 콘텐츠 */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <span className="text-7xl mb-4 group-hover:animate-pulse">🌌</span>
                    <p className="pixel-font text-2xl text-white mb-2">APOD Window</p>
                    <p className="text-sm text-blue-300">Astronomy Picture of the Day</p>
                    <p className="text-xs text-gray-400 mt-3">클릭해서 오늘의 천문 사진 보기</p>
                  </div>
                  
                  {/* 반짝임 효과 */}
                  <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
                  <div className="absolute bottom-6 right-6 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                </button>
              </div>
            ) : (
              /* 갤러리 방 (클리어한 천체들) */
              <div className="text-center">
                <h2 className="pixel-font text-3xl text-white mb-6">🖼️ 갤러리</h2>
                <p className="text-gray-400 text-sm mb-8">클리어한 천체들을 감상하세요</p>
                
                {isLoadingGallery ? (
                  <div className="text-gray-400 pixel-font">로딩 중...</div>
                ) : clearedCelestials.length > 0 ? (
                  /* 클리어한 천체 그리드 */
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
                        className="bg-gray-800 border-4 border-amber-700 rounded-xl p-4 cursor-pointer hover:border-amber-500 transition-all transform hover:scale-105 flex flex-col items-center"
                        style={{
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        }}
                        title={`${celestial.name} - ${celestial.clearedAt ? new Date(celestial.clearedAt).toLocaleDateString() : ''}`}
                      >
                        {/* 천체 이미지 */}
                        {celestial.image ? (
                          <img
                            src={celestial.image}
                            alt={celestial.name}
                            className="w-20 h-20 rounded-full mb-2 object-cover"
                            style={{
                              boxShadow: '0 0 20px rgba(200, 200, 200, 0.5)',
                            }}
                          />
                        ) : (
                          <div 
                            className="w-20 h-20 rounded-full mb-2 bg-gradient-to-br from-gray-300 to-gray-600"
                            style={{
                              boxShadow: '0 0 20px rgba(200, 200, 200, 0.5)',
                            }}
                          />
                        )}
                        
                        {/* 천체 이름 */}
                        <p className="text-white pixel-font text-sm text-center">{celestial.name}</p>
                        
                        {/* 클리어 표시 */}
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-green-400 text-xs">✓</span>
                          <span className="text-gray-400 text-xs">완료</span>
                        </div>
                        
                        {/* 별 개수 */}
                        {celestial.starsEarned > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-400 text-xs">⭐</span>
                            <span className="text-yellow-400 text-xs">{celestial.starsEarned}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 빈 갤러리 */
                  <div className="text-center py-12">
                    <p className="text-4xl mb-4">📭</p>
                    <p className="text-gray-400 pixel-font text-lg">아직 클리어한 천체가 없습니다</p>
                    <p className="text-gray-500 text-sm mt-2">퍼즐을 완료하면 여기에 표시됩니다!</p>
                    <button
                      onClick={goToMain}
                      className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg pixel-font transition-all"
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
                      className={`p-6 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-green-800 border-2 border-green-500'
                          : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'
                      }`}
                    >
                      <span className="text-6xl block mb-3">{bgData.icon}</span>
                      <p className="text-white font-bold">{bgData.name}</p>
                      {isSelected && <p className="text-green-300 text-sm mt-1">✓ 현재 사용 중</p>}
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
                      className={`p-6 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-green-800 border-2 border-green-500'
                          : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'
                      }`}
                    >
                      <span className="text-6xl block mb-3">{cockpitData.icon}</span>
                      <p className="text-white font-bold">{cockpitData.name}</p>
                      {isSelected && <p className="text-green-300 text-sm mt-1">✓ 현재 사용 중</p>}
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
