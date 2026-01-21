import { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import spaceshipInterior from '../assets/login/spaceship-interior.jpg?v=2';
import { supabase } from '../supabaseClient'; // Supabase 클라이언트 추가

export const baseURL = `${import.meta.env.VITE_API_BASE_URL}`;

const LoginPage = () => {
  const GOOGLE_CLIENT_ID = `${import.meta.env.VITE_GOOGLE_CLIENT_ID}`;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // 디버그: 이미지 로드 확인
  console.log('🖼️ 로그인 배경 이미지:', spaceshipInterior);

  const handleLogin = async (googleResp) => {
    const SERVER_URL = `${baseURL}/auth/login`;
    setIsLoading(true); // 로딩 시작
    try {
      // 1) Google ID token → Supabase 세션 생성
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: googleResp.credential
      });
  
      if (error) throw error;
  
      const accessToken = data.session.access_token;
  
      // 2) 백엔드에 Supabase access_token 전달
      const serverResp = await axios.post(
        SERVER_URL,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      localStorage.setItem("user", JSON.stringify(serverResp.data.user));
      
      // 🎯 기본 커스터마이제이션 설정 (신규/기존 모두)
      const defaultCustomization = {
        background: 'wall_gray_iron_plate',
        cockpit: 'cockpit_wooden_basic',
        items: [],
      };
      
      // 신규 유저인 경우 백엔드에 기본 설정 + 아이템 구매
      if (serverResp.data.isNewUser) {
        try {
          console.log('🆕 신규 유저 - 기본 아이템 및 커스터마이제이션 설정 시작');
          
          // 1. localStorage에 즉시 기본값 설정 (화면 깜빡임 방지)
          localStorage.setItem('cachedCustomization', JSON.stringify(defaultCustomization));
          console.log('✅ 1단계: 캐시 즉시 저장');
          
          // 2. 기본 아이템 구매 (병렬 처리)
          await Promise.all([
            axios.post(
              `${baseURL}/shop/purchase`,
              { itemId: 'wall_gray_iron_plate' },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            ).catch(() => console.log('기본 배경 이미 보유 중')),
            
            axios.post(
              `${baseURL}/shop/purchase`,
              { itemId: 'cockpit_wooden_basic' },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            ).catch(() => console.log('기본 조종석 이미 보유 중'))
          ]);
          console.log('✅ 2단계: 기본 아이템 구매 완료');
          
          // 3. 백엔드에 커스터마이제이션 설정 (병렬 처리)
          await Promise.all([
            axios.post(
              `${baseURL}/user/customization/set`,
              { type: 'background', itemId: 'wall_gray_iron_plate' },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            ).catch((err) => {
              console.log('⚠️ 배경 설정 API 실패:', err.response?.data || err.message);
              // wall 필드로도 시도 (백엔드 API 호환성)
              return axios.post(
                `${baseURL}/user/customization/set`,
                { type: 'wall', itemId: 'wall_gray_iron_plate' },
                { headers: { Authorization: `Bearer ${accessToken}` } }
              ).catch(() => console.log('wall 필드로도 실패'));
            }),
            
            axios.post(
              `${baseURL}/user/customization/set`,
              { type: 'cockpit', itemId: 'cockpit_wooden_basic' },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            ).catch((err) => {
              console.log('⚠️ 조종석 설정 API 실패:', err.response?.data || err.message);
            })
          ]);
          console.log('✅ 3단계: 백엔드 커스터마이제이션 설정 완료');
          
          // 4. 설정 완료 후 백엔드에서 다시 불러와서 확인
          try {
            const customizationResp = await axios.get(
              `${baseURL}/user/customization`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            console.log('✅ 4단계: 백엔드에서 확인:', customizationResp.data);
            
            // 백엔드 응답 형식에 맞춰 캐시 업데이트
            const finalCustomization = {
              background: customizationResp.data.wall || customizationResp.data.background || 'wall_gray_iron_plate',
              cockpit: customizationResp.data.cockpit || 'cockpit_wooden_basic',
              items: customizationResp.data.items || [],
            };
            localStorage.setItem('cachedCustomization', JSON.stringify(finalCustomization));
            console.log('✅ 최종 캐시 업데이트:', finalCustomization);
          } catch (err) {
            console.log('⚠️ 커스터마이제이션 확인 실패, 기본값 유지:', err.message);
          }
          
        } catch (error) {
          console.error('❌ 기본 설정 중 오류:', error);
          // 오류가 발생해도 기본값은 캐시에 저장되어 있음
        }
        
        navigate("/tutorial");
      } else {
        // 기존 유저 - 캐시가 없으면 기본값으로 초기화
        if (!localStorage.getItem('cachedCustomization')) {
          localStorage.setItem('cachedCustomization', JSON.stringify(defaultCustomization));
          console.log('✅ 기존 유저 캐시 초기화');
        }
        navigate("/lobby");
      }
    } catch (error) {
      console.error("로그인 실패", error);
      alert("로그인 실패");
      setIsLoading(false); // 로딩 종료
    }
  };

  const handleGuestPlay = () => {
    console.log('🎮 게스트 플레이 시작 - 새로운 게스트 세션 생성');
    
    // 🆔 고유한 게스트 ID 생성
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 새로운 게스트 ID:', guestId);
    
    // 게스트 유저 정보 저장 (고유 ID 포함)
    const guestUser = {
      email: 'guest@spacepuzzle.com',
      nickname: 'Guest Player',
      isGuest: true,
      guestId: guestId, // 고유 ID 추가
    };
    localStorage.setItem('user', JSON.stringify(guestUser));
    console.log('✅ 게스트 유저 정보 저장:', guestUser);
    
    // 게스트별 localStorage 키 생성
    const statsKey = `guestStats_${guestId}`;
    const sectorsKey = `guestUnlockedSectors_${guestId}`;
    const purchasedKey = `guestPurchasedItems_${guestId}`;
    const clearedKey = `guestClearedCelestials_${guestId}`;
    const customizationKey = `guestCustomization_${guestId}`;
    
    // 게스트 초기 자원 설정
    const guestStats = {
      stars: 0,
      credits: 20,
      spaceParts: 0,
    };
    localStorage.setItem(statsKey, JSON.stringify(guestStats));
    console.log('✅ 게스트 초기 자원:', guestStats);
    
    // 게스트 해금 섹터 초기화
    localStorage.setItem(sectorsKey, JSON.stringify([1]));
    
    // 게스트 구매 아이템 초기화
    localStorage.setItem(purchasedKey, JSON.stringify([]));
    
    // 게스트 클리어한 천체 초기화
    localStorage.setItem(clearedKey, JSON.stringify([]));
    console.log('✅ 게스트 클리어 천체 초기화: []');
    
    // 게스트 커스터마이제이션 초기화
    const guestCustomization = {
      background: 'wall_gray_iron_plate',
      cockpit: 'cockpit_wooden_basic',
      items: [],
    };
    localStorage.setItem(customizationKey, JSON.stringify(guestCustomization));
    
    // 게스트 마일스톤 달성 초기화
    localStorage.setItem('guestMilestones', JSON.stringify([]));
    
    console.log('✅ 게스트 플레이 초기화 완료 - 튜토리얼로 이동');
    
    // 튜토리얼로 이동 (로비 아님!)
    navigate('/tutorial');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-red-500">
        {/* 우주선 내부 배경 - 절대 위치 */}
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
          onLoad={() => console.log('✅ 이미지 로드 성공! 화면에 보여야 함!')}
          onError={(e) => console.error('❌ 이미지 로드 실패:', e)}
        />
        
        {/* 살짝 어두운 오버레이 */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 10,
          }}
        />

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 회전하는 로딩 스피너 */}
            <div 
              className="animate-spin"
              style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(255, 255, 255, 0.2)',
                borderTop: '4px solid #60a5fa',
                borderRadius: '50%',
                marginBottom: '20px',
              }}
            />
            <p className="pixel-font text-white text-2xl mb-2">로그인 중...</p>
            <p className="korean-font text-gray-300 text-sm">잠시만 기다려주세요</p>
          </div>
        )}

        {/* 로그인 카드 (반투명 어두운 배경) */}
        <div 
          className="bg-gray-900 bg-opacity-85 backdrop-blur-md rounded-2xl p-12 shadow-2xl border border-gray-700"
          style={{ zIndex: 20, position: 'relative' }}
        >
          <div className="text-center mb-8">
            <h1 className="pixel-font text-4xl text-white mb-4">SPACE PUZZLE</h1>
            <p className="korean-font text-gray-300 text-lg">우주 탐험을 시작하세요</p>
          </div>

          {/* Google 로그인 버튼 */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleLogin}
              onError={() => {
                console.log('Login Failed');
                alert('로그인에 실패했습니다. 다시 시도해주세요.');
              }}
              theme="filled_black"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <p className="korean-font text-gray-400 text-sm text-center mt-6">
            구글 계정으로 간편하게 로그인하세요
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
