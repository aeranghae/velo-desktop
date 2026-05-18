import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

// 3D 인터랙티브 배경 오브젝트 구성
function InteractiveCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  // 마우스의 미세한 움직임을 감지하여 오브젝트 각도에 반영
  useFrame((state) => {
    if (!meshRef.current) return;
    const { x, y } = state.pointer; // 마우스 좌표 (-1 ~ 1)
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, y * 0.5, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * 0.5, 0.1);
  });

  return (
    <Float speed={2.5} rotationIntensity={1.2} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1.6, 64, 64]} scale={1.2}>
        {/* 기존 사이트의 블루-퍼플 그라데이션 아이덴티티를 투영한 글래스 가공 질감 */}
        <MeshDistortMaterial
          color="#3b82f6"
          clearcoat={1}
          clearcoatRoughness={0.1}
          radius={1}
          distort={0.4} // 마우스 및 시간에 따라 유기적으로 일렁이는 왜곡 효과
          speed={3}
          roughness={0.2}
          metalness={0.1}
        />
      </Sphere>
    </Float>
  );
}

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onStart, onLogin }: LandingPageProps) {
  return (
    <div className="w-full h-full relative flex flex-col justify-between items-center p-8 z-10">
      
      {/* 상단 GNB 바 - 투명 유리막 가공 */}
      <header className="w-full max-w-7xl h-16 glass-card rounded-full px-8 flex items-center justify-between z-20 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />
          <span className="font-black text-xl tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">VELO</span>
        </div>
        <button 
          onClick={onLogin}
          className="text-sm font-semibold tracking-wide text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* 중앙 3D 렌더링 캔버스 영역 */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#5e5ce6" />
          <directionalLight position={[-5, 5, 2]} intensity={1.2} color="#0a84ff" />
          <InteractiveCore />
        </Canvas>
      </div>

      {/* 핵심 콘셉트 텍스트 & 인터랙션 카드 세션 */}
      <section className="text-center z-10 flex flex-col items-center justify-center flex-1 max-w-3xl pointer-events-none select-none">
        
        {/* DE-VELO-P 콘셉트 비주얼 타이포그래피 */}
        <div className="mb-4 flex items-center justify-center font-black tracking-tight text-5xl md:text-7xl">
          <span className="text-gray-600 opacity-40">DE</span>
          <span className="mx-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent transform scale-110 drop-shadow-[0_0_30px_rgba(10,132,255,0.3)]">
            VELO
          </span>
          <span className="text-gray-600 opacity-40">P</span>
        </div>

        <p className="text-lg md:text-xl text-gray-400 font-medium tracking-wide mb-8 max-w-xl leading-relaxed">
          개발의 시작과 끝을 관통하는 중심.<br />
          복잡한 인프라와 반복 연산을 자동화하고, 본질에 몰입하세요.
        </p>

        {/* 기존 소스코드에 내장되어 있던 시그니처 그라데이션 버튼 탑재 */}
        <div className="pointer-events-auto">
          <button onClick={onStart} className="generate-button">
            <svg className="generate-button__icon" viewBox="0 0 24 24">
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
            <span>Launch Dashboard</span>
          </button>
        </div>
      </section>

      {/* 하단 특장점 브리핑 3열 글래스 카드 세션 */}
      <footer className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 z-10 mt-auto mb-4">
        <div className="glass-card p-6 rounded-[20px] transition-all duration-300 hover:translate-y--1">
          <h3 className="font-bold text-base text-blue-400 mb-2">Accelerated Velocity</h3>
          <p className="text-xs text-gray-400 leading-relaxed">빌드, 테스트, 배포 파이프라인의 전 과정을 완전 자동화하여 런타임 속도를 최대화합니다.</p>
        </div>
        <div className="glass-card p-6 rounded-[20px] transition-all duration-300 hover:translate-y--1">
          <h3 className="font-bold text-base text-indigo-400 mb-2">Pure Logic Focus</h3>
          <p className="text-xs text-gray-400 leading-relaxed">환경 설정 스트레스 없이, 개발자가 구현해야 하는 핵심 알고리즘 구조에만 자원을 집중시킵니다.</p>
        </div>
        <div className="glass-card p-6 rounded-[20px] transition-all duration-300 hover:translate-y--1">
          <h3 className="font-bold text-base text-purple-400 mb-2">Smart Optimization</h3>
          <p className="text-xs text-gray-400 leading-relaxed">프로젝트 규격에 맞추어 유기적인 결합 구조를 자동 계산하고 소스코드를 최적 정렬합니다.</p>
        </div>
      </footer>

    </div>
  );
}