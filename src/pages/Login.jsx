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

  // 디버그: 이미지 로드 확인
  console.log('🖼️ 로그인 배경 이미지:', spaceshipInterior);

  const handleLogin = async (googleResp) => {
    const SERVER_URL = `${baseURL}/auth/login`;
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
      if (serverResp.data.isNewUser) navigate("/tutorial");
      else navigate("/lobby");
    } catch (error) {
      console.error("로그인 실패", error);
      alert("로그인 실패");
    }
  };

  const handleGuestPlay = () => {
    // 게스트 유저 정보 저장
    const guestUser = {
      email: 'guest@spacepuzzle.com',
      nickname: 'Guest Player',
      isGuest: true,
    };
    localStorage.setItem('user', JSON.stringify(guestUser));
    
    // 로비로 이동
    navigate('/lobby');
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

        {/* 로그인 카드 (반투명 어두운 배경) */}
        <div 
          className="bg-gray-900 bg-opacity-85 backdrop-blur-md rounded-2xl p-12 shadow-2xl border border-gray-700"
          style={{ zIndex: 20, position: 'relative' }}
        >
          <div className="text-center mb-8">
            <h1 className="pixel-font text-4xl text-white mb-4">SPACE PUZZLE</h1>
            <p className="text-gray-300 text-lg">우주 탐험을 시작하세요</p>
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

          <p className="text-gray-400 text-sm text-center mt-6">
            구글 계정으로 간편하게 로그인하세요
          </p>
        </div>

        {/* 게스트 플레이 버튼 (오른쪽 아래) */}
        <button
          onClick={handleGuestPlay}
          className="absolute bottom-8 right-8 z-30 pixel-font bg-gray-700 bg-opacity-80 hover:bg-opacity-100 text-white px-6 py-3 rounded-lg transition-all border border-gray-500 hover:border-blue-400"
        >
          🎮 게스트로 플레이
        </button>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
