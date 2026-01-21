import { useState, useEffect } from 'react';
import AnimatedNebula from './AnimatedNebula';

const NebulaView = ({ celestialBodies, selectedBody, onBodyClick, folder = 'nebulae' }) => {
  const [nebulaeOffsets, setNebulaeOffsets] = useState({});
  const [nebulaeVelocities, setNebulaeVelocities] = useState({});
  const [draggedNebula, setDraggedNebula] = useState(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // 각 성운의 초기 위치 및 속도 설정
  useEffect(() => {
    const initialOffsets = {};
    const initialVelocities = {};
    
    // 미리 정의된 위치들 (겹치지 않도록 배치)
    const positions = [
      { x: -250, y: -150 },
      { x: 250, y: -150 },
      { x: -250, y: 150 },
      { x: 250, y: 150 },
      { x: 0, y: -200 },
      { x: 0, y: 200 },
      { x: -350, y: 0 },
      { x: 350, y: 0 },
    ];
    
    celestialBodies.forEach((body, index) => {
      // 위치 순환 배치
      const position = positions[index % positions.length];
      initialOffsets[body.id] = { ...position };
      
      // 각 성운에 무작위 초기 속도 부여 (천천히 떠다니는 느낌)
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5 + 0.2; // 0.2 ~ 0.7
      initialVelocities[body.id] = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
    });
    
    setNebulaeOffsets(initialOffsets);
    setNebulaeVelocities(initialVelocities);
  }, [celestialBodies]);

  // 무중력 관성 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      const BOUNDARY_X = 450; // 화면 경계 (크기 줄여서 범위 확대)
      const BOUNDARY_Y = 350;

      setNebulaeOffsets((prevOffsets) => {
        const newOffsets = { ...prevOffsets };
        Object.keys(prevOffsets).forEach((id) => {
          if (draggedNebula !== id) {
            const velocity = nebulaeVelocities[id] || { x: 0, y: 0 };
            // 최소 속도 제한을 낮춰서 천천히 계속 움직이도록
            if (Math.abs(velocity.x) > 0.05 || Math.abs(velocity.y) > 0.05) {
              let newX = prevOffsets[id].x + velocity.x;
              let newY = prevOffsets[id].y + velocity.y;

              // 경계 체크 - 부딪히면 반사
              if (Math.abs(newX) > BOUNDARY_X) {
                newX = prevOffsets[id].x;
                // 속도 반전 (튕기는 효과)
                setNebulaeVelocities(prev => ({
                  ...prev,
                  [id]: { x: -prev[id].x * 0.8, y: prev[id].y }
                }));
              }
              if (Math.abs(newY) > BOUNDARY_Y) {
                newY = prevOffsets[id].y;
                // 속도 반전 (튕기는 효과)
                setNebulaeVelocities(prev => ({
                  ...prev,
                  [id]: { x: prev[id].x, y: -prev[id].y * 0.8 }
                }));
              }

              newOffsets[id] = { x: newX, y: newY };
            }
          }
        });
        return newOffsets;
      });

      setNebulaeVelocities((prevVelocities) => {
        const newVelocities = { ...prevVelocities };
        Object.keys(prevVelocities).forEach((id) => {
          if (draggedNebula !== id) {
            const velocity = prevVelocities[id];
            // 감속을 덜 해서 더 오래 움직이도록 (0.97 → 0.995)
            newVelocities[id] = {
              x: velocity.x * 0.995,
              y: velocity.y * 0.995,
            };
          }
        });
        return newVelocities;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [draggedNebula, nebulaeVelocities]);

  const handleMouseDown = (e, bodyId) => {
    setDraggedNebula(bodyId);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setNebulaeVelocities((prev) => ({ ...prev, [bodyId]: { x: 0, y: 0 } }));
  };

  const handleMouseMove = (e) => {
    if (draggedNebula) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;

      setNebulaeOffsets((prev) => ({
        ...prev,
        [draggedNebula]: {
          x: prev[draggedNebula].x + deltaX,
          y: prev[draggedNebula].y + deltaY,
        },
      }));
      
      setNebulaeVelocities((prev) => ({
        ...prev,
        [draggedNebula]: { x: deltaX * 0.3, y: deltaY * 0.3 },
      }));

      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDraggedNebula(null);
  };

  useEffect(() => {
    if (draggedNebula) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedNebula, lastMousePos]);

  return (
    <div className="relative w-full h-[700px] flex items-center justify-center overflow-hidden">
      {/* 심연 섹터 전용 효과 */}
      {folder === 'deep-space' && (
        <>
          {/* 중앙 블랙홀 효과 */}
          <div className="absolute" style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(75,0,130,0) 0%, rgba(75,0,130,0.2) 40%, rgba(0,0,0,0.8) 80%)',
            boxShadow: '0 0 100px 30px rgba(138,43,226,0.4), inset 0 0 80px rgba(138,43,226,0.6)',
            animation: 'deepSpacePulse 4s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
          
          {/* 배경 별 입자 */}
          {[...Array(50)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full bg-white pointer-events-none"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.5 + 0.3,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
          
          <style>{`
            @keyframes deepSpacePulse {
              0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
              50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
            }
            
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.5); }
            }
          `}</style>
        </>
      )}
      
      {/* 성운들 (무중력으로 떠다님) */}
      {celestialBodies.map((body) => {
        const offset = nebulaeOffsets[body.id] || { x: 0, y: 0 };

        return (
          <div
            key={body.id}
            className="absolute"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              transition: draggedNebula === body.id ? 'none' : 'transform 0.05s linear',
              cursor: body.locked ? 'not-allowed' : 'grab',
            }}
            onMouseDown={(e) => {
              if (!body.locked) {
                e.preventDefault();
                handleMouseDown(e, body.id);
              }
            }}
            onClick={(e) => {
              if (!body.locked && draggedNebula !== body.id) {
                onBodyClick(body);
              }
            }}
          >
            <div
              className={`relative ${body.locked ? 'opacity-40' : ''}`}
              style={{
                cursor: draggedNebula === body.id ? 'grabbing' : body.locked ? 'not-allowed' : 'grab',
              }}
            >
              {body.locked && (
                <div className="absolute inset-0 flex items-center justify-center text-6xl z-10">
                  🔒
                </div>
              )}
              
              <div style={{
                // 심연 섹터 전용 발광 효과
                filter: folder === 'deep-space' 
                  ? `drop-shadow(0 0 ${selectedBody?.id === body.id ? 30 : 20}px rgba(138,43,226,0.8)) 
                     drop-shadow(0 0 ${selectedBody?.id === body.id ? 15 : 10}px rgba(100,200,255,0.6))
                     hue-rotate(${(Date.now() / 50) % 360}deg)`
                  : 'none',
                animation: folder === 'deep-space' 
                  ? `deepSpaceFloat ${3 + Math.random()}s ease-in-out infinite` 
                  : 'none',
                animationDelay: `${Math.random() * 2}s`,
              }}>
                <AnimatedNebula
                  nebulaName={
                    folder === 'deep-space'
                      ? (body.nasaId || body.nameEn).replace(/\([^)]*\)/g, '').trim().replace(/\s+/g, '_')
                      : (body.nasaId || body.nameEn).replace(/\([^)]*\)/g, '').trim()
                  }
                  size={
                    // 심연 섹터도 성운과 비슷한 크기
                    folder === 'deep-space'
                      ? 70
                      : (body.nasaId === 'Crab Nebula' || body.nasaId === 'Orion Nebula')
                        ? 60
                        : 90
                  }
                  isSelected={selectedBody?.id === body.id}
                  isCleared={body.isCleared}
                  folder={folder}
                />
              </div>
              
              {folder === 'deep-space' && (
                <style>{`
                  @keyframes deepSpaceFloat {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-15px) scale(1.05); }
                  }
                `}</style>
              )}
              
              {body.isCleared && !body.locked && (
                <div className="absolute top-4 right-4 text-sm">✅</div>
              )}
              
              {selectedBody?.id === body.id && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
            </div>
            
            <p className="korean-font text-white text-sm mt-2 text-center whitespace-nowrap">
              {body.name}
            </p>
            
            {body.locked && (
              <p className="korean-font text-yellow-500 text-xs text-center">⭐ {body.requiredStars}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NebulaView;
