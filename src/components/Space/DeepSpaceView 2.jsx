import { useState, useEffect, useRef } from 'react';
import AnimatedNebula from './AnimatedNebula';

const DeepSpaceView = ({ celestialBodies, selectedBody, onBodyClick }) => {
  const [objectsState, setObjectsState] = useState({});
  const [particles, setParticles] = useState([]);
  const [shockwaves, setShockwaves] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const draggedObject = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 블랙홀 중력 중심
  const BLACK_HOLE = { x: 0, y: 0, mass: 5000 };

  // 초기화: 각 천체의 궤도 및 속성 설정
  useEffect(() => {
    const initialState = {};
    
    celestialBodies.forEach((body, index) => {
      const angle = (index * Math.PI * 2) / celestialBodies.length;
      const radius = 200 + (index * 50);
      const speed = 0.0008 + Math.random() * 0.0004;
      
      initialState[body.id] = {
        // 위치
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        // 속도
        vx: -Math.sin(angle) * speed * radius,
        vy: Math.cos(angle) * speed * radius,
        // 궤도
        angle: angle,
        orbitRadius: radius,
        orbitSpeed: speed,
        // 시각 효과
        rotation: Math.random() * 360,
        rotationSpeed: 0.5 + Math.random() * 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
        glowIntensity: 0.5 + Math.random() * 0.5,
        hue: Math.random() * 360,
        hueShift: 0.2 + Math.random() * 0.3,
        // 꼬리 효과
        trail: [],
      };
    });
    
    setObjectsState(initialState);
  }, [celestialBodies]);

  // 입자 생성
  const createParticles = (x, y, count = 20) => {
    const newParticles = [];
    const baseId = Date.now() * 1000 + Math.random() * 1000;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      newParticles.push({
        id: baseId + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 2 + Math.random() * 3,
        color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // 충격파 생성
  const createShockwave = (x, y) => {
    setShockwaves(prev => [...prev, {
      id: Date.now() * 1000 + Math.random() * 1000,
      x,
      y,
      radius: 0,
      maxRadius: 300,
      opacity: 1,
    }]);
  };

  // 중력 계산
  const applyGravity = (obj) => {
    const dx = BLACK_HOLE.x - obj.x;
    const dy = BLACK_HOLE.y - obj.y;
    const distSq = dx * dx + dy * dy + 1000; // 최소 거리 방지
    const dist = Math.sqrt(distSq);
    const force = BLACK_HOLE.mass / distSq;
    
    return {
      ax: (dx / dist) * force,
      ay: (dy / dist) * force,
    };
  };

  // 시간 왜곡 (블랙홀 근처에서 느려짐)
  const getTimeWarp = (x, y) => {
    const dx = BLACK_HOLE.x - x;
    const dy = BLACK_HOLE.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0.3, Math.min(1, dist / 300));
  };

  // 메인 애니메이션 루프
  useEffect(() => {
    const animate = () => {
      setObjectsState(prevState => {
        const newState = { ...prevState };
        
        Object.keys(newState).forEach(id => {
          const obj = newState[id];
          if (draggedObject.current === id) return;

          // 시간 왜곡
          const timeWarp = getTimeWarp(obj.x, obj.y);
          
          // 중력 적용
          const gravity = applyGravity(obj);
          obj.vx += gravity.ax * timeWarp;
          obj.vy += gravity.ay * timeWarp;
          
          // 속도 제한
          const speed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);
          const maxSpeed = 5;
          if (speed > maxSpeed) {
            obj.vx = (obj.vx / speed) * maxSpeed;
            obj.vy = (obj.vy / speed) * maxSpeed;
          }
          
          // 위치 업데이트
          obj.x += obj.vx * timeWarp;
          obj.y += obj.vy * timeWarp;
          
          // 회전
          obj.rotation = (obj.rotation + obj.rotationSpeed * timeWarp) % 360;
          
          // 펄스 효과
          obj.pulsePhase += 0.05 * timeWarp;
          
          // 색상 변화
          obj.hue = (obj.hue + obj.hueShift * timeWarp) % 360;
          
          // 꼬리 효과
          obj.trail.push({ x: obj.x, y: obj.y, opacity: 1 });
          if (obj.trail.length > 15) obj.trail.shift();
          obj.trail.forEach(t => t.opacity *= 0.9);
          
          // 주기적으로 입자 방출
          if (Math.random() < 0.05) {
            createParticles(obj.x, obj.y, 3);
          }
        });
        
        return newState;
      });

      // 입자 업데이트
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02,
        }))
        .filter(p => p.life > 0)
      );

      // 충격파 업데이트
      setShockwaves(prev => prev
        .map(s => ({
          ...s,
          radius: s.radius + 8,
          opacity: s.opacity - 0.02,
        }))
        .filter(s => s.opacity > 0 && s.radius < s.maxRadius)
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // 드래그 핸들러
  const handleMouseDown = (id, e) => {
    e.preventDefault();
    draggedObject.current = id;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    createShockwave(objectsState[id]?.x || 0, objectsState[id]?.y || 0);
    createParticles(objectsState[id]?.x || 0, objectsState[id]?.y || 0, 30);
  };

  const handleMouseMove = (e) => {
    if (!draggedObject.current) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    setObjectsState(prev => ({
      ...prev,
      [draggedObject.current]: {
        ...prev[draggedObject.current],
        x: prev[draggedObject.current].x + dx,
        y: prev[draggedObject.current].y + dy,
        vx: dx * 0.5,
        vy: dy * 0.5,
      },
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    if (draggedObject.current) {
      const obj = objectsState[draggedObject.current];
      createShockwave(obj?.x || 0, obj?.y || 0);
      createParticles(obj?.x || 0, obj?.y || 0, 50);
    }
    draggedObject.current = null;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [objectsState]);

  console.log('🌌 DeepSpaceView 렌더링됨!');

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
      {/* 테스트 텍스트 */}
      <div className="absolute text-white text-4xl z-50">DeepSpaceView 작동 중!</div>
      
      {/* 블랙홀 중심 */}
      <div className="absolute" style={{
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(139,0,139,0.3) 40%, rgba(0,0,0,0.9) 70%, black 100%)',
        boxShadow: '0 0 100px 50px rgba(139,0,139,0.5), inset 0 0 50px rgba(139,0,139,0.8)',
        animation: 'blackHolePulse 3s ease-in-out infinite',
      }} />

      {/* 입자 효과 */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            width: p.size + 'px',
            height: p.size + 'px',
            backgroundColor: p.color,
            opacity: p.life,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* 충격파 */}
      {shockwaves.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `calc(50% + ${s.x}px)`,
            top: `calc(50% + ${s.y}px)`,
            width: s.radius * 2 + 'px',
            height: s.radius * 2 + 'px',
            border: `2px solid rgba(100, 200, 255, ${s.opacity})`,
            boxShadow: `0 0 20px rgba(100, 200, 255, ${s.opacity})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* 천체들 */}
      {celestialBodies.map((body) => {
        const state = objectsState[body.id];
        if (!state) return null;

        const isSelected = selectedBody?.id === body.id;
        const isCleared = !body.locked;
        const pulse = 0.8 + Math.sin(state.pulsePhase) * 0.2;
        const glowSize = 70 * pulse * state.glowIntensity;
        
        let objectName = (body.nameEn || body.nasaId || '').replace(/\([^)]*\)/g, '').trim().replace(/\s+/g, '_');

        return (
          <div key={body.id}>
            {/* 꼬리 효과 */}
            {state.trail.map((t, i) => (
              <div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `calc(50% + ${t.x}px)`,
                  top: `calc(50% + ${t.y}px)`,
                  width: '4px',
                  height: '4px',
                  backgroundColor: `hsl(${state.hue}, 100%, 60%)`,
                  opacity: t.opacity * 0.3,
                  boxShadow: `0 0 10px hsl(${state.hue}, 100%, 60%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            {/* 천체 본체 */}
            <div
              className="absolute transition-none"
              style={{
                left: `calc(50% + ${state.x}px)`,
                top: `calc(50% + ${state.y}px)`,
                transform: `translate(-50%, -50%) rotate(${state.rotation}deg) scale(${isSelected ? 1.3 : 1})`,
                border: '2px solid red', // 디버그: 천체 위치 확인
                cursor: 'grab',
                filter: `drop-shadow(0 0 ${glowSize}px hsl(${state.hue}, 100%, 60%)) 
                        drop-shadow(0 0 ${glowSize * 0.5}px hsl(${state.hue}, 100%, 80%))
                        hue-rotate(${state.hue * 0.3}deg)`,
                animation: `float ${2 + Math.random()}s ease-in-out infinite`,
                zIndex: isSelected ? 100 : 50,
              }}
              onMouseDown={(e) => handleMouseDown(body.id, e)}
              onClick={() => !draggedObject.current && onBodyClick(body)}
            >
              <AnimatedNebula
                nebulaName={objectName}
                size={isSelected ? 100 : 70}
                isSelected={isSelected}
                isCleared={isCleared}
                folder="deep-space"
              />
            </div>

            {/* 이름 표시 */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `calc(50% + ${state.x}px)`,
                top: `calc(50% + ${state.y + 50}px)`,
                transform: 'translate(-50%, 0)',
              }}
            >
              <p className="korean-font text-white text-lg drop-shadow-lg whitespace-nowrap"
                 style={{ textShadow: `0 0 10px hsl(${state.hue}, 100%, 60%)` }}>
                {body.name || objectName.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes blackHolePulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default DeepSpaceView;
