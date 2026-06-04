import { useEffect, useRef } from 'react';

interface LandingPageProps {
  onLogin: () => void;
}

const TUBES_CDN_URL =
  "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

export default function LandingPage({ onLogin }: LandingPageProps) {
  const canvasTubesRef = useRef<HTMLCanvasElement>(null);
  const tubesInstanceRef = useRef<any>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);
  
  //구체 관련 모션/수치 및 레이아웃 100% 고정
  useEffect(() => {
    let mounted = true;
    let clickListener: (() => void) | null = null;
    let readyListener: (() => void) | null = null;

    if (!document.getElementById('velo-layout-optimized-styles')) {
      const style = document.createElement('style');
      style.id = 'velo-layout-optimized-styles';
      style.textContent = `
        @keyframes smoothLiquid {
          0% { baseFrequency: 0.005 0.007; }
          50% { baseFrequency: 0.007 0.005; }
          100% { baseFrequency: 0.005 0.007; }
        }
        @keyframes blobFloatA { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(1deg); } }
        @keyframes blobFloatB { 0%, 100% { transform: translate(0px, 0px) rotate(0deg); } 50% { transform: translate(10px, -10px) rotate(-1deg); } }
        @keyframes floatFrontLeft { 0%, 100% { transform: translate(0px, 0px) scale(1); } 50% { transform: translate(12px, 15px) scale(1.02); } }
        @keyframes floatFrontRight { 0%, 100% { transform: translate(0px, 0px) scale(1); } 50% { transform: translate(-15px, -10px) scale(1.01); } }

        #velo-optimized-filter feTurbulence { animation: smoothLiquid 12s linear infinite; }
        .liquid-back-2 { animation: blobFloatB 10s ease-in-out infinite; filter: url(#velo-optimized-filter); }
        .liquid-back-3 { animation: blobFloatA 9s ease-in-out infinite; filter: url(#velo-optimized-filter); }
        .liquid-front-left { animation: floatFrontLeft 9.5s ease-in-out infinite; filter: url(#velo-optimized-filter); }
        .liquid-front-right { animation: floatFrontRight 11s ease-in-out infinite; animation-delay: -2.5s; filter: url(#velo-optimized-filter); }
      `;
      document.head.appendChild(style);
    }

    const randomColors = (count: number) => {
      const veloPalette = ["#818cf8", "#6366f1", "#a855f7", "#c084fc", "#e9d5ff"];
      return new Array(count).fill(0).map(() => veloPalette[Math.floor(Math.random() * veloPalette.length)]);
    };

    const initTubes = (TubesCursor: any) => {
      if (!mounted) return;
      const canvas = canvasTubesRef.current;
      if (!canvas || !TubesCursor) return;

      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        setTimeout(() => { if (mounted) initTubes(TubesCursor); }, 50);
        return;
      }

      try {
        tubesInstanceRef.current = TubesCursor(canvas, {
          tubes: {
            colors: ["#818cf8", "#a855f7", "#c084fc"],
            lights: { 
              intensity: 90, 
              colors: ["#c7d2fe", "#e9d5ff", "#6366f1"] 
            },
          },
        });

        (window as any).__tubesInst = tubesInstanceRef.current;

        const inst = tubesInstanceRef.current;
        const gl = inst?.gl || inst?.renderer || inst?.three?.renderer;
        if (gl && typeof gl.setClearColor === 'function') {
          gl.setClearColor(0x000000, 0); 
        }
        if (inst?.scene) {
          inst.scene.background = null;
        }

        window.dispatchEvent(new Event('resize'));

        clickListener = () => {
          if (tubesInstanceRef.current?.tubes) {
            tubesInstanceRef.current.tubes.colors = randomColors(3);
          }
        };
        document.body.addEventListener('click', clickListener);

      } catch (err) {
        console.error("TubesCursor 로딩 실패:", err);
      }
    };

    const cached = (window as any).__TubesCursor;
    if (cached) {
      initTubes(cached);
    } else {
      readyListener = () => initTubes((window as any).__TubesCursor);
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

    let animationFrameId: number;

    const updateLoop = () => {
      const inst = tubesInstanceRef.current;
      
      if (inst) {
        const gl = inst?.gl || inst?.renderer || inst?.three?.renderer;
        if (gl && typeof gl.setClearColor === 'function') {
          gl.setClearColor(0x000000, 0);
        }

        if (inst.input && inst.input.bounds) {
          inst.input.bounds.width = window.innerWidth;
          inst.input.bounds.height = window.innerHeight;
          inst.input.bounds.top = 0;
          inst.input.bounds.left = 0;
        }

        if (inst.pointer) {
          inst.pointer.x = currentX;
          inst.pointer.y = currentY;
        } else if (inst.input && inst.input.mouse) {
          inst.input.mouse.x = currentX;
          inst.input.mouse.y = currentY;
        }
      }
      //커서 이펙트 크키
      const CURSOR_SCALE = 1.0;
      const tubesScene = inst?.tubes;
      if (tubesScene?.children) {
        tubesScene.children.forEach((child: any) => {
          if (child.isMesh && child.scale) {
            child.scale.set(CURSOR_SCALE, CURSOR_SCALE, CURSOR_SCALE);
          }
        });
      }

      animationFrameId = requestAnimationFrame(updateLoop);
    };

    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(updateLoop);

    return () => {
      mounted = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (readyListener) window.removeEventListener('__tubesCursorReady', readyListener);
      if (clickListener) document.body.removeEventListener('click', clickListener);
      
      if (tubesInstanceRef.current) {
        if (typeof tubesInstanceRef.current.destroy === 'function') tubesInstanceRef.current.destroy();
        else if (typeof tubesInstanceRef.current.dispose === 'function') tubesInstanceRef.current.dispose();
        tubesInstanceRef.current = null;
      }
    };
  }, []);

  const handleScrollDown = () => {
    contentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollUp = () => {
    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full h-screen overflow-hidden text-white bg-[#050816] relative select-none">
      
      <canvas 
        ref={canvasTubesRef} 
        id="canvas-tubes-v2" 
        className="fixed inset-0 w-screen h-screen block z-[999] pointer-events-none bg-transparent" 
        style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}
      />
      <div className="w-full h-full overflow-x-hidden overflow-y-auto scroll-smooth relative z-10">
        
        <svg className="absolute w-0 h-0 invisible select-none pointer-events-none">
          <defs>
            <filter id="velo-optimized-filter" x="-60%" y="-60%" width="220%" height="220%">
              <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="1" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            
            <radialGradient id="blob-light" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="45%" stopColor="#a855f7" />
              <stop offset="85%" stopColor="#6b21a8" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </radialGradient>
            <radialGradient id="blob-deep" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#090514" />
            </radialGradient>
          </defs>
        </svg>

        {/* ========================================================
           [SECTION 1: HERO STAGE]
        ======================================================== */}
        <div ref={heroSectionRef} className="w-full h-screen relative flex flex-col justify-between shrink-0">
          
          {/* LAYER 1: BACKSTAGE LAYER - 형태/위치 수치  */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <path className="liquid-back-3 will-change-transform" d="M 120,530 Q 100,450 180,440 Q 260,430 280,510 Q 300,590 240,620 Q 160,650 120,580 Q 100,560 120,530 Z" fill="url(#blob-deep)" opacity="0.38" />
            <path className="liquid-back-2 will-change-transform" d="M 900,160 Q 940,110 1000,150 Q 1050,200 1020,250 Q 970,290 920,260 Q 860,220 900,160 Z" fill="url(#blob-light)" opacity="0.43" />
          </svg>

          {/* 상단 헤더 구역 */}
          <header className="relative z-10 w-full max-w-7xl mx-auto h-20 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse" />
              <span className="font-black text-xl tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent select-none">VELO</span>
            </div>
            <button 
              onClick={onLogin} 
              className="text-xs font-semibold tracking-[0.2em] text-gray-300 hover:text-white transition-colors cursor-pointer pointer-events-auto"
            >
              SIGN IN
            </button>
          </header>

          {/* LAYER 2: MAIN CARD LAYER */}
          <main className="relative z-10 flex items-center justify-center px-8 flex-1">
            <div
              className="relative w-full max-w-3xl flex flex-col items-center justify-center text-center px-12 py-20 rounded-lg"
              style={{
                background: 'radial-gradient(ellipse at 50% 100%, #e879f9 0%, #a21caf 25%, #581c87 60%, #1e1b4b 100%)',
                boxShadow: '0 20px 80px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* DEVELOP 글자 분할 및 VELO 강조  */}
              <h1 className="font-black text-5xl md:text-7xl tracking-[0.25em] mb-8 select-none flex items-center justify-center">
                <span className="text-white/40 opacity-40">DE</span>
                <span className="mx-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent transform scale-105 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                  VELO
                </span>
                <span className="text-white/40 opacity-40">P</span>
              </h1>
              
              <p className="text-white/80 text-xs md:text-sm tracking-wide font-medium leading-relaxed mb-10 max-w-md mx-auto select-none">
                대규모 언어 모델(LLM) 기반의 자동 코드 생성 스튜디오.<br />
                복잡한 프롬프트를 완벽한 구조의 코드로 설계하고,<br />
                본질적인 아키텍처 비전에 몰입하세요.
              </p>
              
              <button
                onClick={handleScrollDown}
                className="group border-2 border-white/80 text-white text-[10px] font-bold tracking-[0.3em] px-8 py-3.5 rounded-full hover:bg-white hover:text-purple-900 transition-all pointer-events-auto flex items-center gap-2 shadow-lg cursor-pointer"
              >
                SCROLL DOWN <span className="inline-block transform group-hover:translate-y-1 transition-transform">↴</span>
              </button>
            </div>
          </main>

          {/* LAYER 3: FOREGROUND OVERLAP LAYER  */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <path className="liquid-front-left will-change-transform" d="M 120,240 C 60,150 200,100 270,160 C 340,220 340,320 250,340 C 160,360 80,330 120,240 Z" fill="url(#blob-light)" opacity="0.75" />
            <path className="liquid-front-right will-change-transform" d="M 940,580 Q 890,480 990,430 Q 1080,410 1120,490 Q 1160,580 1090,650 Q 1000,700 950,640 Q 910,610 940,580 Z" fill="url(#blob-deep)" opacity="0.70" />
          </svg>
        </div>

        {/* ========================================================
            [SECTION 2: APP DESCRIPTION 구역]
        ======================================================== */}
        <div 
          ref={contentSectionRef}
          className="relative z-20 w-full min-h-screen py-32 px-8 flex flex-col items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(180deg, #050816 0%, #0d0a21 50%, #050816 100%)'
          }}
        >
          <div className="w-full max-w-5xl mx-auto text-center">
            
            <span className="text-xs font-bold tracking-[0.4em] text-purple-400 block mb-3 uppercase">
              VELO Platform
            </span>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-wider mb-16 bg-gradient-to-r from-white via-gray-200 to-purple-300 bg-clip-text text-transparent">
              상상하는 구조 그대로,<br />코드는 AI가 완성합니다.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 backdrop-blur-xl hover:border-purple-500/30 transition-all hover:-translate-y-1 shadow-2xl">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-lg mb-6">01</div>
                <h3 className="text-lg font-bold tracking-wide mb-3">LLM 자동 코드 빌더</h3>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">단순 프롬프트를 넘어서 개발 문맥을 관통하는 최적의 파일 아키텍처와 엔티티 스펙을 설계하고 자동 코딩을 지원합니다.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 backdrop-blur-xl hover:border-blue-500/30 transition-all hover:-translate-y-1 shadow-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-lg mb-6">02</div>
                <h3 className="text-lg font-bold tracking-wide mb-3">실시간 UI/UX 프로토타이핑</h3>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">생성된 프론트엔드 컴포넌트와 인터랙션 레이아웃을 웹 스튜디오 내부에서 즉각적으로 프리뷰하고 검증할 수 있습니다.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 backdrop-blur-xl hover:border-indigo-500/30 transition-all hover:-translate-y-1 shadow-2xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg mb-6">03</div>
                <h3 className="text-lg font-bold tracking-wide mb-3">자동 인프라 파이프라인</h3>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">빌드된 소스코드를 별도의 복잡한 연산이나 셋업 없이 클라우드 컨테이너 에이전트를 통해 원클릭 배포 단계까지 가속화합니다.</p>
              </div>

            </div>

            <div className="mt-20 p-12 rounded-2xl bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/10 border border-white/5 backdrop-blur-lg max-w-3xl mx-auto flex flex-col items-center">
              <p className="text-xs md:text-sm text-gray-400 mb-6">지금 바로 AI AutoStudio의 지능형 개발 사이클을 경험하고 플랫폼의 본질에 집중하세요.</p>
              
              <button 
                onClick={handleScrollUp}
                className="text-[10px] font-bold tracking-[0.3em] border border-white/20 hover:border-white text-gray-300 hover:text-white px-6 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-md bg-black/20"
              >
                SCROLL UP ⬆
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}