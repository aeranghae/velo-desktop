import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';

// 3D 인터랙티브 배경 오브젝트
function InteractiveCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    const { x, y } = state.pointer;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, y * 0.5, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * 0.5, 0.1);
  });
  return (
    <Float speed={2.5} rotationIntensity={1.2} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1.6, 64, 64]} scale={1.2}>
        <MeshDistortMaterial
          color="#3b82f6"
          clearcoat={1}
          clearcoatRoughness={0.1}
          radius={1}
          distort={0.4}
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

const TUBES_CDN_URL =
  "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

export default function LandingPage({ onStart, onLogin }: LandingPageProps) {
  const tubesInstanceRef = useRef<any>(null);
  const canvasTubesRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    let clickListener: (() => void) | null = null;
    let readyListener: (() => void) | null = null;

    const randomColors = (count: number) =>
      new Array(count)
        .fill(0)
        .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));

    const init = (TubesCursor: any) => {
      if (!mounted) return;
      const canvas = canvasTubesRef.current;
      if (!canvas || !TubesCursor) return;

      try {
        // canvas 엘리먼트(DOM 노드)를 직접 전달
        tubesInstanceRef.current = TubesCursor(canvas, {
          tubes: {
            colors: ["#f967fb", "#53bc28", "#6958d5"],
            lights: {
              intensity: 200,
              colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"],
            },
          },
        });

        // 초기 뷰포트 사이즈 강제 동기화
        window.dispatchEvent(new Event('resize'));

        clickListener = () => {
          if (tubesInstanceRef.current?.tubes) {
            tubesInstanceRef.current.tubes.setColors(randomColors(3));
            tubesInstanceRef.current.tubes.setLightsColors(randomColors(4));
          }
        };
        document.body.addEventListener('click', clickListener);
      } catch (err) {
        console.error("TubesCursor 초기화 실패:", err);
      }
    };

    const cached = (window as any).__TubesCursor;
    if (cached) {
      init(cached);
    } else {
      readyListener = () => init((window as any).__TubesCursor);
      window.addEventListener('__tubesCursorReady', readyListener);

      if (!document.getElementById('tubes-cursor-loader')) {
        const script = document.createElement('script');
        script.id = 'tubes-cursor-loader';
        script.type = 'module';
        script.textContent = `
          import TubesCursor from "${TUBES_CDN_URL}";
          window.__TubesCursor = TubesCursor;
          window.dispatchEvent(new Event('__tubesCursorReady'));
        `;
        document.head.appendChild(script);
      }
    }

    return () => {
      mounted = false;
      if (readyListener) window.removeEventListener('__tubesCursorReady', readyListener);
      if (clickListener) document.body.removeEventListener('click', clickListener);
      if (tubesInstanceRef.current) {
        if (typeof tubesInstanceRef.current.destroy === 'function') {
          tubesInstanceRef.current.destroy();
        } else if (typeof tubesInstanceRef.current.dispose === 'function') {
          tubesInstanceRef.current.dispose();
        }
        tubesInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative flex flex-col justify-between items-center p-8 overflow-hidden">

      <canvas
        ref={canvasTubesRef}
        id="canvas-tubes"
        className="fixed inset-0 w-screen h-screen block"
        style={{ zIndex: 0, pointerEvents: 'none' }}
      />

      {/* 상단 GNB 바 */}
      <header className="w-full max-w-7xl h-16 glass-card rounded-full px-8 flex items-center justify-between z-20 mt-2 pointer-events-auto">
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

      {/* R3F 구체 캔버스 — z-1은 Tailwind 기본에 없으므로 z-[1]로 임의값 지정 */}
      <div className="absolute inset-0 w-full h-full z-[1]" style={{ pointerEvents: 'none' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ alpha: true }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#5e5ce6" />
          <directionalLight position={[-5, 5, 2]} intensity={1.2} color="#0a84ff" />
          <InteractiveCore />
        </Canvas>
      </div>

      {/* 중앙 텍스트 */}
      <section className="text-center z-10 flex flex-col items-center justify-center flex-1 max-w-3xl pointer-events-none select-none">
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

        <div className="pointer-events-auto">
          <button onClick={onStart} className="generate-button">
            <svg className="generate-button__icon" viewBox="0 0 24 24">
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
            <span>Launch Dashboard</span>
          </button>
        </div>
      </section>

      {/* 하단 글래스 카드 */}
      <footer className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 z-10 mt-auto mb-4 pointer-events-auto">
        <div className="glass-card p-6 rounded-[20px] transition-all duration-300 hover:-translate-y-1">
          <h3 className="font-bold text-base text-blue-400 mb-2">Accelerated Velocity</h3>
          <p className="text-xs text-gray-400 leading-relaxed">빌드, 테스트, 배포 파이프라인의 전 과정을 완전 자동화하여 런타임 속도를 최대화합니다.</p>
        </div>
        <div className="glass-card p-6 rounded-[20px] transition-all duration-300 hover:-translate-y-1">
          <h3 className="font-bold text-base text-indigo-400 mb-2">Pure Logic Focus</h3>
          <p className="text-xs text-gray-400 leading-relaxed">환경 설정 스트레스 없이, 개발자가 구현해야 하는 핵심 알고리즘 구조에만 자원을 집중시킵니다.</p>
        </div>
        <div className="glass-card p-6 rounded-[20px] transition-all duration-300 hover:-translate-y-1">
          <h3 className="font-bold text-base text-purple-400 mb-2">Smart Optimization</h3>
          <p className="text-xs text-gray-400 leading-relaxed">프로젝트 규격에 맞추어 유기적인 결합 구조를 자동 계산하고 소스코드를 최적 정렬합니다.</p>
        </div>
      </footer>
    </div>
  );
}