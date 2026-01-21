import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getGuestStats, setGuestStats, getGuestPurchasedItems, setGuestPurchasedItems } from '../utils/guestStorage';

const Shop = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    stars: 0,
    credits: 0,
    spaceParts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [purchasedItems, setPurchasedItems] = useState([]);

  // 💰 상점 아이템 목록 (크레딧 & 우주부품)
  const shopItems = [
    // 🎨 배경 (우주선 내부 배경)
    {
      id: 'wall_gray_iron_plate',
      name: '회색 철판 벽',
      description: '산업용 철판으로 만든 기본 벽',
      icon: '🔩',
      price: 0,
      priceType: 'credits',
      rarity: 'common',
      category: 'background',
      type: 'wall',
    },
    {
      id: 'wall_sleepy_moon_cloud',
      name: '졸린 달님과 구름',
      description: '귀여운 달과 구름이 있는 벽',
      icon: '🌙',
      price: 10,
      priceType: 'credits',
      rarity: 'common',
      category: 'background',
      type: 'wall',
    },
    {
      id: 'wall_pastel_pink_cotton',
      name: '파스텔 핑크 코튼',
      description: '부드러운 파스텔 핑크 벽',
      icon: '🩷',
      price: 15,
      priceType: 'credits',
      rarity: 'common',
      category: 'background',
      type: 'wall',
    },
    {
      id: 'wall_candy_planet_system',
      name: '캔디 행성계',
      description: '달콤한 캔디 테마의 행성계',
      icon: '🍬',
      price: 18,
      priceType: 'credits',
      rarity: 'rare',
      category: 'background',
      type: 'wall',
    },
    {
      id: 'wall_nasa_white_panel',
      name: 'NASA 스타일 화이트 패널',
      description: 'NASA 스타일의 과학적 패널',
      icon: '🚀',
      price: 30,
      priceType: 'credits',
      rarity: 'rare',
      category: 'background',
      type: 'wall',
    },
    {
      id: 'wall_dyson_sphere_interior',
      name: '다이슨 스피어 내부',
      description: '거대한 다이슨 스피어 내부 전망',
      icon: '⚛️',
      price: 10,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'background',
      type: 'wall',
    },
    {
      id: 'wall_window_aurora_nebula',
      name: '오로라 성운 창문',
      description: '아름다운 오로라 성운이 보이는 창',
      icon: '🌌',
      price: 15,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'background',
      type: 'wall',
    },
    {
      id: 'wall_window_blackhole_abyss',
      name: '심연의 블랙홀 관측창',
      description: '블랙홀을 관측할 수 있는 특수 창',
      icon: '🕳️',
      price: 20,
      priceType: 'spaceParts',
      rarity: 'legendary',
      category: 'background',
      type: 'wall',
    },
    {
      id: 'wall_supernova_remnant',
      name: '초신성 폭발 잔해',
      description: '초신성 폭발의 장엄한 잔해',
      icon: '💥',
      price: 25,
      priceType: 'spaceParts',
      rarity: 'legendary',
      category: 'background',
      type: 'wall',
    },

    // 🪑 배치 가능한 아이템 (인테리어) - 크레딧
    // 🎨 애니메이션 아이템 (assets/item 폴더)
    {
      id: 'item_floating_saturn_planter',
      name: '떠다니는 토성 화분',
      description: '무중력으로 떠다니는 토성 모양 화분',
      icon: '🪴',
      price: 8,
      priceType: 'credits',
      rarity: 'rare',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_industrial_toolbox_greasy',
      name: '산업용 공구 상자',
      description: '기름때 묻은 오래된 공구 상자',
      icon: '🧰',
      price: 5,
      priceType: 'credits',
      rarity: 'common',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_flying_bird',
      name: '날아다니는 새',
      description: '우주에서도 날아다니는 신비한 새',
      icon: '🐦',
      price: 12,
      priceType: 'credits',
      rarity: 'rare',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_cute_stardust_jar',
      name: '귀여운 별가루 병',
      description: '반짝이는 별가루가 담긴 병',
      icon: '✨',
      price: 6,
      priceType: 'credits',
      rarity: 'common',
      category: 'item',
      type: 'placeable',
    },

    // 🎮 조종석 (조종실 하단 이미지)
    {
      id: 'cockpit_wooden_basic',
      name: '기본 목재 조종석',
      description: '심플한 목재 조종석',
      icon: '🪵',
      price: 0,
      priceType: 'credits',
      rarity: 'common',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_seat_pink_jelly_cat',
      name: '핑크 젤리 캣 시트',
      description: '귀여운 핑크 젤리 고양이 시트',
      icon: '🐱',
      price: 10,
      priceType: 'credits',
      rarity: 'common',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_seat_nasa_ergonomic',
      name: 'NASA 표준 인체공학석',
      description: 'NASA에서 개발한 인체공학 시트',
      icon: '🚀',
      price: 15,
      priceType: 'credits',
      rarity: 'common',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_dash_space_whale',
      name: '우주 고래 대시보드',
      description: '우주 고래 모양의 대시보드',
      icon: '🐋',
      price: 18,
      priceType: 'credits',
      rarity: 'rare',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_stealth_ship',
      name: '스텔스 함선 콕핏',
      description: '은폐 기능이 있는 스텔스 콕핏',
      icon: '🥷',
      price: 30,
      priceType: 'credits',
      rarity: 'rare',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_nest_space_bear',
      name: '우주 곰돌이 둥지',
      description: '푹신한 곰돌이 테마의 둥지',
      icon: '🧸',
      price: 10,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_bio_organic_alien',
      name: '외계 유기체 생체석',
      description: '살아있는 유기체로 만든 생체석',
      icon: '👽',
      price: 15,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_antigravity_command',
      name: '반중력 커맨드 포드',
      description: '반중력 기술이 적용된 포드',
      icon: '🛸',
      price: 20,
      priceType: 'spaceParts',
      rarity: 'legendary',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_item_star_wand',
      name: '마법소녀 스타 완드',
      description: '마법소녀 테마의 별 지팡이',
      icon: '⭐',
      price: 25,
      priceType: 'spaceParts',
      rarity: 'legendary',
      category: 'cockpit',
      type: 'cockpit',
    },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchUserStats();
    fetchPurchasedItems();
  }, []);

  const fetchUserStats = async () => {
    setIsLoading(true);
    try {
      // 게스트 모드 체크
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isGuest) {
        const guestStats = getGuestStats();
        setUserStats({
          stars: guestStats.stars || 0,
          credits: guestStats.credits || 20,
          spaceParts: guestStats.spaceParts || 0,
        });
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        console.warn('토큰 없음: 게스트 모드');
        setIsLoading(false);
        return;
      }

      // 🔄 백엔드 API 변경: /user/resources 사용
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
        setUserStats({
          stars: data.stars || 0,
          credits: data.credits || 0,
          spaceParts: data.spaceParts || 0,
        });
      } else {
        console.error('자원 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('유저 통계 가져오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchasedItems = async () => {
    try {
      // 기본 아이템 ID (price 0인 아이템들)
      const defaultItems = ['wall_gray_iron_plate', 'cockpit_wooden_basic'];
      
      // 게스트 모드 체크
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isGuest) {
        const guestPurchased = getGuestPurchasedItems();
        // 기본 아이템 자동 추가
        setPurchasedItems([...new Set([...defaultItems, ...guestPurchased])]);
        return;
      }

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
        const purchasedFromServer = data.items || [];
        // 기본 아이템 자동 추가
        setPurchasedItems([...new Set([...defaultItems, ...purchasedFromServer])]);
      } else if (response.status === 404) {
        // 백엔드 API가 아직 없으면 기본값 사용
        console.warn('⚠️ 백엔드 API 미구현: /shop/purchased (기본값 사용)');
        setPurchasedItems(defaultItems);
      }
    } catch (error) {
      console.error('구매 내역 가져오기 실패:', error);
      setPurchasedItems(defaultItems);
    }
  };

  const handlePurchase = async (item) => {
    // 이미 구매한 아이템인지 확인
    if (purchasedItems.includes(item.id)) {
      alert('이미 구매한 아이템입니다!');
      return;
    }

    // 💰 구매 가능 여부 확인 (가격 타입에 따라)
    const currency = item.priceType === 'credits' ? userStats.credits : userStats.spaceParts;
    const canAfford = currency >= item.price;
    const currencyIcon = item.priceType === 'credits' ? '💰' : '🔧';
    const currencyName = item.priceType === 'credits' ? '크레딧' : '우주 부품';

    if (!canAfford) {
      alert(`${currencyName}이(가) 부족합니다!`);
      return;
    }

    if (!window.confirm(`${item.name}을(를) 구매하시겠습니까?\n${currencyIcon} ${item.price}개 사용`)) {
      return;
    }

    try {
      // 게스트 모드 처리
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isGuest) {
        // 게스트 자원 차감
        const guestStats = getGuestStats();
        
        // 💰 가격 타입에 따라 차감
        if (item.priceType === 'credits') {
          guestStats.credits -= item.price;
        } else {
          guestStats.spaceParts -= item.price;
        }
        
        setGuestStats(guestStats);

        // 게스트 구매 목록 업데이트
        const guestPurchased = getGuestPurchasedItems();
        guestPurchased.push(item.id);
        setGuestPurchasedItems(guestPurchased);

        // 통계 업데이트
        setUserStats({
          stars: guestStats.totalStars || 0,
          credits: guestStats.credits || 0,
          spaceParts: guestStats.spaceParts || 0,
        });
        
        // 구매 목록 업데이트
        setPurchasedItems([...purchasedItems, item.id]);
        
        // 🎨 배경 또는 조종석이면 즉시 적용
        if (item.category === 'background' || item.category === 'cockpit') {
          const guestCustomization = JSON.parse(
            localStorage.getItem('guestCustomization') || 
            '{"background": "wall_gray_iron_plate", "cockpit": "cockpit_wooden_basic", "items": []}'
          );
          
          if (item.category === 'background') {
            guestCustomization.background = item.id;
          } else if (item.category === 'cockpit') {
            guestCustomization.cockpit = item.id;
          }
          
          localStorage.setItem('guestCustomization', JSON.stringify(guestCustomization));
          alert(`🎉 ${item.name} 구매 완료!\n즉시 적용되었습니다.`);
          
          // 로비로 이동하여 변경사항 반영
          setTimeout(() => {
            navigate('/lobby', { state: { refreshCustomization: true } });
          }, 500);
        } else {
          alert(`🎉 ${item.name} 구매 완료!`);
        }
        
        return;
      }

      // 일반 유저 처리
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        alert('로그인이 필요합니다!');
        navigate('/login');
        return;
      }

      // 🔄 백엔드 API 변경: itemId만 전달
      const response = await fetch(
        'https://spacepuzzle.onrender.com/shop/purchase',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: item.id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // 📊 백엔드 응답: remainingStars, remainingSpaceParts
          // ⚠️ remainingCredits는 없으므로 로컬에서 계산
          setUserStats({
            stars: data.remainingStars || userStats.stars,
            credits: item.priceType === 'credits' ? userStats.credits - item.price : userStats.credits,
            spaceParts: data.remainingSpaceParts || userStats.spaceParts,
          });
          
          // 구매 목록 업데이트
          setPurchasedItems([...purchasedItems, item.id]);
          console.log('✅ 구매 완료 (백엔드):', item.id);
          
          // 🎨 배경 또는 조종석이면 즉시 적용
          if (item.category === 'background' || item.category === 'cockpit') {
            try {
              const updateResponse = await fetch(
                'https://spacepuzzle.onrender.com/user/customization/set',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    type: item.type,
                    itemId: item.id,
                  }),
                }
              );
              
              if (updateResponse.ok) {
                alert(`🎉 ${item.name} 구매 완료!\n즉시 적용되었습니다.`);
              } else {
                console.error('커스터마이제이션 업데이트 실패:', updateResponse.status);
                alert(`🎉 ${item.name} 구매 완료!`);
              }
            } catch (error) {
              console.error('커스터마이제이션 업데이트 실패:', error);
              alert(`🎉 ${item.name} 구매 완료!`);
            }
            
            // 로비로 이동하여 변경사항 반영
            setTimeout(() => {
              navigate('/lobby', { state: { refreshCustomization: true } });
            }, 500);
          } else {
            alert(`🎉 ${item.name} 구매 완료!`);
          }
        } else {
          alert(`구매 실패: ${data.message || '알 수 없는 오류'}`);
        }
      } else {
        // 🔍 디버깅: 자세한 에러 로그
        console.error('❌ 구매 실패');
        console.error('📍 URL:', 'https://spacepuzzle.onrender.com/shop/purchase');
        console.error('📊 상태 코드:', response.status);
        console.error('📦 요청 Body:', { itemId: item.id });
        
        let errorMsg = '알 수 없는 오류';
        let errorDetail = '';
        
        try {
          const error = await response.json();
          console.error('📥 응답 내용:', error);
          errorMsg = error.message || error.error || errorMsg;
          errorDetail = JSON.stringify(error);
        } catch (e) {
          const errorText = await response.text();
          console.error('📄 응답 텍스트:', errorText);
          errorMsg = `서버 에러 (${response.status})`;
          errorDetail = errorText;
        }
        
        alert(`구매 실패\n\n상태: ${response.status}\n메시지: ${errorMsg}\n\n콘솔을 확인해주세요!`);
      }
    } catch (error) {
      console.error('구매 실패:', error);
      alert('구매 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-black korean-font">
      {/* 별 배경 */}
      {[...Array(100)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-pulse"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 2 + 's',
          }}
        />
      ))}

      {/* 상단 헤더 */}
      <div className="relative z-20 p-6 flex justify-between items-center border-b border-gray-700 bg-gray-900 bg-opacity-80">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate('/lobby')}
          className="korean-font bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-all border border-gray-600"
        >
          ← 로비
        </button>

        {/* 제목 */}
        <h1 className="korean-font text-4xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          🛒 우주 상점
        </h1>

        {/* 보유 자원 */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <span className="text-yellow-400 font-bold text-xl">{userStats.stars}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-green-400 font-bold text-xl">{userStats.credits}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <span className="text-purple-400 font-bold text-xl">{userStats.spaceParts}</span>
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="relative z-10 p-6 border-b border-gray-700 bg-gray-900 bg-opacity-80">
        <div className="max-w-7xl mx-auto flex justify-center gap-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`korean-font px-6 py-3 rounded-lg transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🌟 전체
          </button>
          <button
            onClick={() => setSelectedCategory('background')}
            className={`korean-font px-6 py-3 rounded-lg transition-all ${
              selectedCategory === 'background'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🎨 배경
          </button>
          <button
            onClick={() => setSelectedCategory('item')}
            className={`korean-font px-6 py-3 rounded-lg transition-all ${
              selectedCategory === 'item'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🪑 아이템
          </button>
          <button
            onClick={() => setSelectedCategory('cockpit')}
            className={`korean-font px-6 py-3 rounded-lg transition-all ${
              selectedCategory === 'cockpit'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🎮 조종석
          </button>
        </div>
      </div>

      {/* 상점 아이템 그리드 */}
      <div className="relative z-10 p-8 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
        {isLoading ? (
          <div className="text-center mt-20">
            <p className="korean-font text-2xl text-white mb-4">🌌 상점 불러오는 중...</p>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopItems
              .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
              .map((item) => {
              const isPurchased = purchasedItems.includes(item.id);
              
              // 💰 가격 타입에 따라 구매 가능 여부 확인
              const currency = item.priceType === 'credits' ? userStats.credits : userStats.spaceParts;
              const canAfford = currency >= item.price;
              const currencyIcon = item.priceType === 'credits' ? '💰' : '🔧';
              const currencyColor = item.priceType === 'credits' ? 'green' : 'purple';
              
              // 🎨 등급별 색상
              const rarityColors = {
                common: 'gray',
                rare: 'blue',
                epic: 'purple',
                legendary: 'yellow',
              };
              const rarityColor = rarityColors[item.rarity] || 'gray';

              return (
                <div
                  key={item.id}
                  className={`bg-gray-900 bg-opacity-90 rounded-xl p-6 border-2 transition-all transform hover:scale-105 ${
                    isPurchased
                      ? 'border-green-500'
                      : canAfford
                      ? `border-${rarityColor}-500 hover:border-${rarityColor}-400`
                      : 'border-gray-700 opacity-75'
                  }`}
                >
                  {/* 아이콘 */}
                  <div className="text-center mb-4">
                    <span className="text-6xl">{item.icon}</span>
                    {isPurchased && (
                      <div className="inline-block ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        ✓ 구매완료
                      </div>
                    )}
                  </div>

                  {/* 이름 */}
                  <h3 className="korean-font text-xl text-white text-center mb-2">
                    {item.name}
                  </h3>

                  {/* 등급 */}
                  <div className="text-center mb-2">
                    <span className={`korean-font text-xs px-2 py-1 rounded-full bg-${rarityColor}-900 text-${rarityColor}-400 border border-${rarityColor}-500`}>
                      {item.rarity === 'common' && '일반'}
                      {item.rarity === 'rare' && '레어'}
                      {item.rarity === 'epic' && '에픽'}
                      {item.rarity === 'legendary' && '전설'}
                    </span>
                  </div>

                  {/* 설명 */}
                  <p className="korean-font text-gray-400 text-sm text-center mb-4 h-12">
                    {item.description}
                  </p>

                  {/* 가격 (크레딧 또는 우주 부품) */}
                  <div className="flex justify-center mb-4">
                    <div className={`flex items-center gap-2 bg-${currencyColor}-900 bg-opacity-50 px-6 py-3 rounded-lg border border-${currencyColor}-500`}>
                      <span className="text-3xl">{currencyIcon}</span>
                      <span className={`font-bold text-2xl ${canAfford ? `text-${currencyColor}-400` : 'text-red-400'}`}>
                        {item.price}
                      </span>
                    </div>
                  </div>

                  {/* 구매 버튼 */}
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={isPurchased || !canAfford}
                    className={`w-full korean-font py-3 rounded-lg transition-all ${
                      isPurchased
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : canAfford
                        ? `bg-${currencyColor}-600 hover:bg-${currencyColor}-500 text-white`
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isPurchased ? '✓ 보유 중' : canAfford ? '구매하기' : (item.priceType === 'credits' ? '크레딧 부족' : '부품 부족')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
