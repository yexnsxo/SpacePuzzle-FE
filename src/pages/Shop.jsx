import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
      id: 'bg_default',
      name: '기본 우주선',
      description: '기본 우주선 내부 배경',
      icon: '🌌',
      price: 0,
      priceType: 'credits',
      rarity: 'common',
      category: 'background',
      type: 'background',
    },
    {
      id: 'bg_cozy',
      name: '아늑한 우주선',
      description: '따뜻한 조명의 아늑한 공간',
      icon: '🏡',
      price: 10,
      priceType: 'credits',
      rarity: 'common',
      category: 'background',
      type: 'background',
    },
    {
      id: 'bg_industrial',
      name: '산업용 우주선',
      description: '기능성에 중점을 둔 실용적 공간',
      icon: '⚙️',
      price: 15,
      priceType: 'credits',
      rarity: 'common',
      category: 'background',
      type: 'background',
    },
    {
      id: 'bg_luxury',
      name: '럭셔리 우주선',
      description: '고급스러운 금색 테마의 우주선',
      icon: '✨',
      price: 30,
      priceType: 'credits',
      rarity: 'rare',
      category: 'background',
      type: 'background',
    },
    {
      id: 'bg_military',
      name: '군용 우주선',
      description: '투박하지만 튼튼한 군용 우주선',
      icon: '🛡️',
      price: 5,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'background',
      type: 'background',
    },
    {
      id: 'bg_futuristic',
      name: '미래형 우주선',
      description: '최첨단 네온 테마의 우주선',
      icon: '🔮',
      price: 8,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'background',
      type: 'background',
    },
    {
      id: 'bg_hologram',
      name: '홀로그램 우주선',
      description: '미래형 홀로그램 배경',
      icon: '🌈',
      price: 15,
      priceType: 'spaceParts',
      rarity: 'legendary',
      category: 'background',
      type: 'background',
    },

    // 🪑 배치 가능한 아이템 (인테리어) - 크레딧
    {
      id: 'item_poster',
      name: '은하 포스터',
      description: '벽에 배치할 수 있는 은하 포스터',
      icon: '🖼️',
      price: 3,
      priceType: 'credits',
      rarity: 'common',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_lamp',
      name: '네온 램프',
      description: '우주선에 배치할 수 있는 네온 조명',
      icon: '💡',
      price: 5,
      priceType: 'credits',
      rarity: 'common',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_chair',
      name: '편안한 의자',
      description: '푹신한 우주 안락의자',
      icon: '🪑',
      price: 8,
      priceType: 'credits',
      rarity: 'common',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_desk',
      name: '작업 책상',
      description: '정돈된 작업 공간',
      icon: '🗄️',
      price: 12,
      priceType: 'credits',
      rarity: 'rare',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'ai_robot_arm',
      name: 'AI 로봇 팔',
      description: '정밀 작업을 돕는 로봇 팔',
      icon: '🦾',
      price: 15,
      priceType: 'credits',
      rarity: 'rare',
      category: 'item',
      type: 'placeable',
    },

    // 🌟 배치 가능한 아이템 (인테리어) - 우주부품
    {
      id: 'item_plant',
      name: '우주 식물',
      description: '산소를 생성하는 특수 식물',
      icon: '🌿',
      price: 3,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_telescope',
      name: '망원경',
      description: '고성능 우주 망원경',
      icon: '🔭',
      price: 5,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_robot',
      name: 'AI 로봇',
      description: '귀여운 AI 동료 로봇',
      icon: '🤖',
      price: 7,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_hologram',
      name: '홀로그램 디스플레이',
      description: '3D 홀로그램 프로젝터',
      icon: '📺',
      price: 10,
      priceType: 'spaceParts',
      rarity: 'legendary',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_music',
      name: '음악 플레이어',
      description: '은하계 음악 스트리밍 시스템',
      icon: '🎵',
      price: 4,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_aquarium',
      name: '우주 수족관',
      description: '희귀한 외계 생명체 수족관',
      icon: '🐠',
      price: 12,
      priceType: 'spaceParts',
      rarity: 'legendary',
      category: 'item',
      type: 'placeable',
    },
    {
      id: 'item_gravitylamp',
      name: '무중력 램프',
      description: '공중에 떠다니는 램프',
      icon: '🕯️',
      price: 15,
      priceType: 'spaceParts',
      rarity: 'legendary',
      category: 'item',
      type: 'placeable',
    },

    // 🎮 조종석 (조종실 하단 이미지)
    {
      id: 'cockpit_default',
      name: '기본 조종석',
      description: '기본 우주선 조종석',
      icon: '🕹️',
      price: 0,
      priceType: 'credits',
      rarity: 'common',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_standard',
      name: '표준 조종석',
      description: '업그레이드된 표준형 조종석',
      icon: '🎛️',
      price: 20,
      priceType: 'credits',
      rarity: 'common',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_racing',
      name: '레이싱 조종석',
      description: '빠른 기동을 위한 레이싱 시트',
      icon: '🏎️',
      price: 35,
      priceType: 'credits',
      rarity: 'rare',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_advanced',
      name: '고급 조종석',
      description: '최신형 디스플레이가 장착된 조종석',
      icon: '⚡',
      price: 8,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_retro',
      name: '레트로 조종석',
      description: '빈티지 스타일의 조종석',
      icon: '🎮',
      price: 10,
      priceType: 'spaceParts',
      rarity: 'epic',
      category: 'cockpit',
      type: 'cockpit',
    },
    {
      id: 'cockpit_captain',
      name: '함장 조종석',
      description: '럭셔리한 함장 전용 시트',
      icon: '👑',
      price: 20,
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
        const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"totalStars": 0, "credits": 20, "spaceParts": 0}');
        setUserStats({
          stars: guestStats.totalStars || 0,
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
      // 게스트 모드 체크
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isGuest) {
        const guestPurchased = JSON.parse(localStorage.getItem('guestPurchasedItems') || '[]');
        // 기본 아이템 (price 0) 자동 추가
        const defaultItems = shopItems.filter(item => item.price === 0).map(item => item.id);
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
        setPurchasedItems(data.items || []);
      } else if (response.status === 404) {
        // 백엔드 API가 아직 없으면 기본값 사용
        console.warn('⚠️ 백엔드 API 미구현: /shop/purchased (기본값 사용)');
        setPurchasedItems(['bg_default', 'cockpit_default']);
      }
    } catch (error) {
      console.error('구매 내역 가져오기 실패:', error);
      setPurchasedItems(['bg_default', 'cockpit_default']);
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
        const guestStats = JSON.parse(localStorage.getItem('guestStats') || '{"totalStars": 0, "credits": 20, "spaceParts": 0}');
        
        // 💰 가격 타입에 따라 차감
        if (item.priceType === 'credits') {
          guestStats.credits -= item.price;
        } else {
          guestStats.spaceParts -= item.price;
        }
        
        localStorage.setItem('guestStats', JSON.stringify(guestStats));

        // 게스트 구매 목록 업데이트
        const guestPurchased = JSON.parse(localStorage.getItem('guestPurchasedItems') || '[]');
        guestPurchased.push(item.id);
        localStorage.setItem('guestPurchasedItems', JSON.stringify(guestPurchased));

        alert(`🎉 ${item.name} 구매 완료!`);
        
        // 통계 업데이트
        setUserStats({
          stars: guestStats.totalStars || 0,
          credits: guestStats.credits || 0,
          spaceParts: guestStats.spaceParts || 0,
        });
        
        // 구매 목록 업데이트
        setPurchasedItems([...purchasedItems, item.id]);
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
          alert(`🎉 ${item.name} 구매 완료!`);
          
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
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-black">
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
          className="pixel-font bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-all border border-gray-600"
        >
          ← 로비
        </button>

        {/* 제목 */}
        <h1 className="pixel-font text-4xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
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
            className={`pixel-font px-6 py-3 rounded-lg transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🌟 전체
          </button>
          <button
            onClick={() => setSelectedCategory('background')}
            className={`pixel-font px-6 py-3 rounded-lg transition-all ${
              selectedCategory === 'background'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🎨 배경
          </button>
          <button
            onClick={() => setSelectedCategory('item')}
            className={`pixel-font px-6 py-3 rounded-lg transition-all ${
              selectedCategory === 'item'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🪑 아이템
          </button>
          <button
            onClick={() => setSelectedCategory('cockpit')}
            className={`pixel-font px-6 py-3 rounded-lg transition-all ${
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
            <p className="pixel-font text-2xl text-white mb-4">🌌 상점 불러오는 중...</p>
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
                  <h3 className="pixel-font text-xl text-white text-center mb-2">
                    {item.name}
                  </h3>

                  {/* 등급 */}
                  <div className="text-center mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full bg-${rarityColor}-900 text-${rarityColor}-400 border border-${rarityColor}-500`}>
                      {item.rarity === 'common' && '일반'}
                      {item.rarity === 'rare' && '레어'}
                      {item.rarity === 'epic' && '에픽'}
                      {item.rarity === 'legendary' && '전설'}
                    </span>
                  </div>

                  {/* 설명 */}
                  <p className="text-gray-400 text-sm text-center mb-4 h-12">
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
                    className={`w-full pixel-font py-3 rounded-lg transition-all ${
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
