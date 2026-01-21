import { useState, useEffect } from 'react';
import AnimatedNebula from './AnimatedNebula';

const GalaxyView = ({ celestialBodies, selectedBody, onBodyClick }) => {
  const [galaxiesOffsets, setGalaxiesOffsets] = useState({});
  const [galaxyOrbits, setGalaxyOrbits] = useState({});
  const [galaxyRotations, setGalaxyRotations] = useState({});
  const [draggedGalaxy, setDraggedGalaxy] = useState(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 });

  // 각 은하의 초기 궤도 및 회전 설정
  useEffect(() => {
    const initialOffsets = {};
    const initialOrbits = {};
    const initialRotations = {};
    
    celestialBodies.forEach((body, index) => {
      // 원형 궤도 설정 (각 은하마다 다른 반지름과 각도)
      const orbitRadius = 180 + (index * 60) % 240; // 180 ~ 420
      const orbitSpeed = 0.0003 + Math.random() * 0.0002; // 천천히 회전
      const initialAngle = (index * Math.PI * 2) / celestialBodies.length; // 균등 분포
      const clockwise = index % 2 === 0 ? 1 : -1; // 시계/반시계 방향 교대
      
      // 초기 위치 계산
      initialOffsets[body.id] = {
        x: Math.cos(initialAngle) * orbitRadius,
        y: Math.sin(initialAngle) * orbitRadius,
      };
      
      // 궤도 정보 저장
      initialOrbits[body.id] = {
        radius: orbitRadius,
        angle: initialAngle,
        speed: orbitSpeed * clockwise,
        centerX: 0,
        centerY: 0,
      };
      
      // 자체 회전 속도
      initialRotations[body.id] = {
        angle: Math.random() * 360,
        speed: 0.1 + Math.random() * 0.2, // 0.1 ~ 0.3도/프레임
      };
    });
    
    setGalaxiesOffsets(initialOffsets);
    setGalaxyOrbits(initialOrbits);
    setGalaxyRotations(initialRotations);
  }, [celestialBodies]);

  // 은하 궤도 운동 + 자체 회전 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      // 자체 회전 업데이트
      setGalaxyRotations((prevRotations) => {
        const newRotations = { ...prevRotations };
        Object.keys(prevRotations).forEach((id) => {
          newRotations[id] = {
            ...prevRotations[id],
            angle: (prevRotations[id].angle + prevRotations[id].speed) % 360,
          };
        });
        return newRotations;
      });

      // 궤도 운동 업데이트
      setGalaxyOrbits((prevOrbits) => {
        const newOrbits = { ...prevOrbits };
        
        setGalaxiesOffsets((prevOffsets) => {
          const newOffsets = { ...prevOffsets };
          
          Object.keys(prevOrbits).forEach((id) => {
            if (id === draggedGalaxy) {
              // 드래그 중인 은하는 건너뛰기
              return;
            }
            
            const orbit = prevOrbits[id];
            const newAngle = orbit.angle + orbit.speed;
            
            // 새로운 궤도 위치 계산
            newOffsets[id] = {
              x: orbit.centerX + Math.cos(newAngle) * orbit.radius,
              y: orbit.centerY + Math.sin(newAngle) * orbit.radius,
            };
            
            newOrbits[id] = { ...orbit, angle: newAngle };
          });
          
          return newOffsets;
        });
        
        return newOrbits;
      });

      // 드래그 관성 처리
      if (draggedGalaxy) {
        setDragVelocity((prevVel) => ({
          x: prevVel.x * 0.95,
          y: prevVel.y * 0.95,
        }));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [draggedGalaxy]);

  const handleMouseDown = (e, bodyId) => {
    setDraggedGalaxy(bodyId);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setDragVelocity({ x: 0, y: 0 });
  };

  const handleMouseMove = (e) => {
    if (draggedGalaxy) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;

      setGalaxiesOffsets((prev) => ({
        ...prev,
        [draggedGalaxy]: {
          x: prev[draggedGalaxy].x + deltaX,
          y: prev[draggedGalaxy].y + deltaY,
        },
      }));
      
      // 드래그 속도 저장 (튕겨내기 효과용)
      setDragVelocity({ x: deltaX * 0.5, y: deltaY * 0.5 });

      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (draggedGalaxy) {
      // 드래그 종료 시 현재 위치에서 가장 가까운 궤도로 재설정
      setGalaxyOrbits((prevOrbits) => {
        const newOrbits = { ...prevOrbits };
        const currentPos = galaxiesOffsets[draggedGalaxy];
        
        if (currentPos) {
          const distance = Math.sqrt(currentPos.x ** 2 + currentPos.y ** 2);
          const angle = Math.atan2(currentPos.y, currentPos.x);
          
          newOrbits[draggedGalaxy] = {
            ...prevOrbits[draggedGalaxy],
            radius: distance,
            angle: angle,
          };
        }
        
        return newOrbits;
      });
    }
    setDraggedGalaxy(null);
  };

  useEffect(() => {
    if (draggedGalaxy) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedGalaxy, lastMousePos]);

  return (
    <div className="relative w-full h-[700px] flex items-center justify-center">
      {/* 은하들 (궤도 운동 + 자체 회전) */}
      {celestialBodies.map((body) => {
        const offset = galaxiesOffsets[body.id] || { x: 0, y: 0 };
        const rotation = galaxyRotations[body.id] || { angle: 0 };
        // 괄호와 그 안의 내용 제거 (예: "Whirlpool Galaxy(M51)" → "Whirlpool Galaxy")
        const galaxyName = (body.nameEn || body.nasaId).replace(/\([^)]*\)/g, '').trim();

        return (
          <div
            key={body.id}
            className="absolute"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation.angle}deg)`,
              transition: draggedGalaxy === body.id ? 'none' : 'transform 0.3s ease-out',
              cursor: body.locked ? 'not-allowed' : 'grab',
            }}
            onMouseDown={(e) => {
              if (!body.locked) {
                e.preventDefault();
                handleMouseDown(e, body.id);
              }
            }}
            onClick={(e) => {
              if (!body.locked && draggedGalaxy !== body.id) {
                onBodyClick(body);
              }
            }}
          >
            <div
              className={`relative ${body.locked ? 'opacity-40' : ''}`}
              style={{
                cursor: draggedGalaxy === body.id ? 'grabbing' : body.locked ? 'not-allowed' : 'grab',
              }}
            >
              {body.locked && (
                <div className="absolute inset-0 flex items-center justify-center text-6xl z-10">
                  🔒
                </div>
              )}
              
              <AnimatedNebula
                nebulaName={galaxyName}
                size={100}
                isSelected={selectedBody?.id === body.id}
                isCleared={body.isCleared}
                folder="galaxies"
              />
              
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

export default GalaxyView;
