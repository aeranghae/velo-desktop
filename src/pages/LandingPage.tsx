import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from '../components/Experience'; 

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

const TUBES_CDN_URL =
  "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

export default function LandingPage({ onLogin }: LandingPageProps) {
  const tubesInstanceRef = useRef<any>(null);
  const canvasTubesRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    let clickListener: () => void;
    let readyListener: () => void;

    const randomColors = (count: number) =>
      new Array(count).fill(0).map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));

    const init = (TubesCursor: any) => {
      if (!mounted) return;
      const canvas = canvasTubesRef.current;
      if (!canvas || !TubesCursor) return;

      try {
        tubesInstanceRef.current = TubesCursor(canvas, {
          tubes: {
            colors: ["#f967fb", "#53bc28", "#6958d5"],
            lights: { intensity: 200, colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"] },
          },
        });

        // 🌟 튜브 라이브러리의 WebGL 렌더러 클리어 컬러를 강제 투명화
        const inst = tubesInstanceRef.current;
        const renderer = inst?.renderer || inst?.three?.renderer || inst?.gl;
        if (renderer && typeof renderer.setClearColor === 'function') {
          renderer.setClearColor(0x000000, 0);
        }
        if (inst?.scene) inst.scene.background = null;

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
    //잠시 주석
    // if (cached) {
    //   init(cached);
    // } else {
    //   readyListener = () => init((window as any).__TubesCursor);
    //   window.addEventListener('__tubesCursorReady' as string, readyListener);

    //   if (!document.getElementById('tubes-cursor-loader')) {
    //     const script = document.createElement('script');
    //     script.id = 'tubes-cursor-loader';
    //     script.type = 'module';
    //     script.textContent = `
    //       import TubesCursor from "${TUBES_CDN_URL}";
    //       window.__TubesCursor = TubesCursor;
    //       window.dispatchEvent(new Event('__tubesCursorReady'));
    //     `;
    //     document.head.appendChild(script);
    //   }
    // }

    let animationFrameId: number;
    let hardScroll = 0;
    let softScroll = 0;

    const handleScroll = () => { hardScroll = window.scrollY; };

    const updateSmoothScroll = () => {
      softScroll += (hardScroll - softScroll) * 0.05;
      if (scrollContentRef.current) {
        scrollContentRef.current.style.transform = `translateY(${-softScroll}px)`;
      }
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.transform = `translateY(${-softScroll}px)`;
      }
      animationFrameId = requestAnimationFrame(updateSmoothScroll);
    };

    window.addEventListener('scroll', handleScroll);
    animationFrameId = requestAnimationFrame(updateSmoothScroll);

    return () => {
      mounted = false;
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
      //if (readyListener) window.removeEventListener('__tubesCursorReady' as string, readyListener);
      if (clickListener) document.body.removeEventListener('click', clickListener);
      if (tubesInstanceRef.current) {
        if (typeof tubesInstanceRef.current.destroy === 'function') tubesInstanceRef.current.destroy();
        else if (typeof tubesInstanceRef.current.dispose === 'function') tubesInstanceRef.current.dispose();
        tubesInstanceRef.current = null;
      }
    };
  }, []);

  return (
  <div ref={scrollContainerRef} className="w-full min-h-[220vh] text-white relative">

    {/* 🌟 그라데이션 배경 레이어 - 튜브 캔버스의 직속 형제로 배치
        → screen 블렌드의 블렌드 타겟이 됨 */}
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -0,
        background: `
          radial-gradient(ellipse 75% 60% at 50% 0%, rgba(99,102,241,0.55) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 100% 100%, rgba(168,85,247,0.45) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 0% 85%, rgba(59,130,246,0.40) 0%, transparent 60%),
          linear-gradient(180deg, #0e1030 0%, #0a0b1f 55%, #07081a 100%)
        `,
      }}
    />

    {/* 3D 튜브 배경 커서 */}
    <canvas ref={canvasTubesRef} id="canvas-tubes" className="fixed inset-0 w-screen h-screen block z-[1] pointer-events-none" />

      {/* 🌟 3D 구체 스테이지 - WebGL 클리어 컬러 강제 투명화 */}
      <div
        ref={canvasContainerRef}
        className="fixed inset-0 w-screen h-screen z-10 pointer-events-none will-change-transform"
        style={{ background: 'transparent' }}
      >
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 75 }}
          gl={{ alpha: true, premultipliedAlpha: false, antialias: true }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(0x000000, 0);  // 알파 0 = 완전 투명
            scene.background = null;
          }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={1.0} />
          <Experience />
        </Canvas>
      </div>

      <div ref={scrollContentRef} className="w-full min-h-screen fixed inset-0 flex flex-col justify-between items-center p-8 z-20 will-change-transform">
        
        <header className="w-full max-w-7xl h-16 glass-card rounded-full px-8 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />
            <span className="font-black text-xl tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">VELO</span>
          </div>
          <button onClick={onLogin} className="text-sm font-semibold tracking-wide text-gray-300 hover:text-white transition-colors cursor-pointer">
            Sign In
          </button>
        </header>

        <section className="text-center flex flex-col items-center justify-center flex-1 max-w-3xl pointer-events-none select-none my-24">
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
        </section>

        <footer className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mt-auto mb-4 pointer-events-auto">
          <div className="glass-card p-6 rounded-[20px] transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-bold text-base text-blue-400 mb-2">Accelerated Velocity</h3>
            <p className="text-xs text-gray-400 leading-relaxed">빌드, 테스트, 배포 파이프라인의 전 과정을 완전 자동화하여 런타임 속도를 최대화합니다.</p>
          </div>
          <div className="glass-card p-6 rounded-[24px] transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-bold text-base text-indigo-400 mb-2">Pure Logic Focus</h3>
            <p className="text-xs text-gray-400 leading-relaxed">환경 설정 스트레스 없이, 개발자가 구현해야 하는 핵심 알고리즘 구조에만 자원을 집중시킵니다.</p>
          </div>
          <div className="glass-card p-6 rounded-[24px] transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-bold text-base text-purple-400 mb-2">Smart Optimization</h3>
            <p className="text-xs text-gray-400 leading-relaxed">프로젝트 규격에 맞추어 유기적인 결합 구조를 자동 계산하고 소스코드를 최적 정렬합니다.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}