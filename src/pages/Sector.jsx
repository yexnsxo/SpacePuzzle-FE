import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const SECTOR_SLUGS = {
  'solar-system': 'solar-system',
  '태양계': 'solar-system',
  'exo-systems': 'exo-systems',
  '외계 행성계': 'exo-systems',
  'nebulae': 'nebulae',
  '성운': 'nebulae',
  'galaxies': 'galaxies',
  '은하': 'galaxies',
  'deep-space-extremes': 'deep-space-extremes',
  '우주의 심연': 'deep-space-extremes',
};

const resolveSectorSlug = (value) => {
  if (!value || typeof value !== 'string') {
    return 'solar-system';
  }
  return SECTOR_SLUGS[value] || 'solar-system';
};

const Sector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sectorData, setSectorData] = useState(null);
  const [celestialBodies, setCelestialBodies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const sectorSlug = resolveSectorSlug(location.state?.sectorSlug || location.state?.sector);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchSectorData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const response = await fetch(
          `https://spacepuzzle.onrender.com/sectors/${sectorSlug}/celestial-objects`,
          { headers, signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`섹터 데이터를 불러오지 못했습니다. (${response.status})`);
        }

        const payload = await response.json();
        const normalizedBodies = (payload?.celestialObjects || []).map((body) => ({
          id: body.id,
          name: body.title || body.name || '',
          nameEn: body.nameEn || '',
          locked: Boolean(body.locked),
        }));

        if (isMounted) {
          setSectorData(payload?.sector || null);
          setCelestialBodies(normalizedBodies);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (isMounted) {
          setLoadError(error.message || '섹터 데이터를 불러오는 중 오류가 발생했습니다.');
          setSectorData(null);
          setCelestialBodies([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSectorData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [sectorSlug]);

  const handleEnterGameplay = () => {
    if (isLoading || loadError) return;
    navigate('/gameplay', { state: { sectorSlug } });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-black">
      <div className="absolute inset-0">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <button
        onClick={() => navigate('/cockpit')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg transition-all border border-gray-700 hover:border-blue-500"
      >
        <span className="text-xl">←</span>
        <span className="pixel-font">조종실로</span>
      </button>

      <div className="relative z-10 flex items-center justify-center h-full px-8">
        <div className="max-w-4xl w-full bg-gray-900 bg-opacity-90 rounded-2xl p-8 border-2 border-blue-500 shadow-2xl">
          {isLoading ? (
            <div className="text-center text-gray-400 pixel-font text-xl py-12">로딩 중...</div>
          ) : loadError ? (
            <div className="text-center text-red-400 py-12">
              <p className="pixel-font text-xl mb-2">데이터를 불러오지 못했습니다</p>
              <p className="text-sm text-gray-400">{loadError}</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="pixel-font text-5xl text-white mb-2">{sectorData?.name || '섹터'}</h1>
                <p className="text-blue-400 text-xl mb-4">{sectorData?.nameEn || ''}</p>
                
                <div className="inline-flex items-center gap-2 bg-yellow-600 bg-opacity-30 border border-yellow-500 rounded-full px-4 py-2">
                  <span className="text-2xl">⭐</span>
                  <span className="pixel-font text-white">필요한 별: {sectorData?.requiredStars ?? 0}개</span>
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 mb-6">
                <p className="text-gray-300 leading-relaxed">{sectorData?.description || '섹터 설명이 없습니다.'}</p>
              </div>

              <div className="mb-6">
                <h3 className="pixel-font text-2xl text-white mb-4 flex items-center gap-2">
                  <span>🌍</span>
                  <span>탐험 가능한 천체</span>
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {celestialBodies.map((body) => (
                    <div
                      key={body.id}
                      className={`relative bg-gray-800 rounded-lg p-4 border-2 ${
                        body.locked ? 'border-gray-600 opacity-60' : 'border-blue-500 opacity-90'
                      }`}
                    >
                      <div 
                        className="w-20 h-20 mx-auto rounded-full mb-3 bg-gray-700"
                        style={{
                          filter: 'grayscale(100%)',
                        }}
                      />
                      
                      <p className="pixel-font text-center text-white text-sm">{body.name}</p>
                      <p className="text-center text-gray-400 text-xs">{body.nameEn}</p>
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-center text-sm mt-3">※ 섹터 진입 후 선택 가능</p>
              </div>
            </>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={handleEnterGameplay}
              disabled={isLoading || Boolean(loadError)}
              className={`pixel-font text-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-12 py-4 rounded-lg transition-all transform hover:scale-105 border-2 border-blue-400 shadow-lg ${
                isLoading || loadError ? 'opacity-60 cursor-not-allowed hover:scale-100' : ''
              }`}
              style={{
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
              }}
            >
              ▶ 섹터 진입하기
            </button>
            <p className="text-gray-400 text-sm mt-2">천체를 선택하여 퍼즐을 시작하세요</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sector;
