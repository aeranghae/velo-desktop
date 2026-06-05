import { useEffect, useRef, useState } from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onStart: () => void;
}

const TUBES_CDN_URL =
  "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

export default function LandingPage({ onLogin }: LandingPageProps) {
  const canvasTubesRef = useRef<HTMLCanvasElement>(null);
  const tubesInstanceRef = useRef<any>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);

  // 3D 캐러셀 제어를 위한 독립 휠 인덱스 상태 셋업
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  // 3D 캐러셀 슬라이딩 데이터셋
  const CAROUSEL_CARDS = [
    {
      num: "01",
      title: "LLM 자동 코드 빌더",
      desc: "단순 프롬프트를 넘어서 개발 문맥을 관통하는 최적의 파일 아키텍처와 엔티티 스펙을 설계하고 자동 코딩을 지원합니다."
    },
    {
      num: "02",
      title: "실시간 UI/UX 프로토타이핑",
      desc: "생성된 프론트엔드 컴포넌트와 인터랙션 레이아웃을 웹 스튜디오 내부에서 즉각적으로 프리뷰하고 검증할 수 있습니다."
    },
    {
      num: "03",
      title: "자동 인프라 파이프라인",
      desc: "빌드된 소스코드를 별도의 복잡한 연산이나 셋업 없이 클라우드 컨테이너 에이전트를 통해 원클릭 배포 단계까지 가속화합니다."
    }
  ];

  const totalCards = CAROUSEL_CARDS.length;
  const angleStep = 360 / totalCards; 
  const radius = 340; 
  
  // 구체 관련 모션/수치 및 레이아웃 고정
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

        /* SCROLL DOWN 버튼의 부드러운 네온 숨쉬기 아우라 키프레임 */
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.4); }
          50% { box-shadow: 0 0 30px rgba(96, 165, 250, 0.6), inset 0 1px 0 rgba(255,255,255,0.2); border-color: rgba(147, 197, 253, 0.8); }
        }
        .animate-neon-pulse {
          animation: neonPulse 2.5s ease-in-out infinite;
        }
        @keyframes customBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-custom-bounce {
          animation: customBounce 2s ease-in-out infinite;
        }
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

      const CURSOR_SCALE = 0.95;
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

  const nextCard = () => setActiveCardIdx((prev) => (prev + 1) % totalCards);
  const prevCard = () => setActiveCardIdx((prev) => (prev - 1 + totalCards) % totalCards);

  return (
    <div 
      className="w-full h-screen overflow-hidden text-white relative select-none"
      style={{
        background: `
          radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.18) 0%, transparent 65%),
          radial-gradient(circle at 90% 15%, rgba(139, 92, 246, 0.22) 0%, transparent 55%),
          radial-gradient(circle at 10% 85%, rgba(59, 130, 246, 0.15) 0%, transparent 60%),
          linear-gradient(180deg, #04040c 0%, #070616 50%, #030308 100%)
        `
      }}
    >
      
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
              <stop offset="0%" stopColor="#fbd5ff" />
              <stop offset="45%" stopColor="#9842e8" />
              <stop offset="85%" stopColor="#34174d" />
              <stop offset="100%" stopColor="#080718" />
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
          
          {/* LAYER 1: BACKSTAGE LAYER */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 transform translate-y-[45px] transition-transform duration-300" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <path className="liquid-back-3 will-change-transform" d="M 120,530 Q 100,450 180,440 Q 260,430 280,510 Q 300,590 240,620 Q 160,650 120,580 Q 100,560 120,530 Z" fill="url(#blob-deep)" opacity="0.38" />
            <path className="liquid-back-2 will-change-transform" d="M 900,160 Q 940,110 1000,150 Q 1050,200 1020,250 Q 970,290 920,260 Q 860,220 900,160 Z" fill="url(#blob-light)" opacity="0.43" />
          </svg>

          {/* 캡슐 플로팅 형태의 고급 글래스모피즘 네비게이션 바 */}
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-68px)] max-w-5xl">
            <header className="w-full h-16 px-8 rounded-full flex items-center justify-between bg-white/[0.04] backdrop-blur-[20px] border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset 0_1px_0_rgba(255,255,255,0.15)] hover:border-white/30 transition-all duration-300">
              <div className="flex items-center gap-2 select-none">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse" />
                <span className="font-black text-xl tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">VELO</span>
              </div>
              
              {/* 네온 바이올렛 3D 입체 변형 펄스 SIGN IN 유닛 */}
              <div className="btn-wrapper pointer-events-auto">
                <button onClick={onLogin} className="btn">
                  <span className="btn-txt">SIGN IN</span>
                </button>
                <div className="dot pulse"></div>
              </div>
            </header>
          </div>

          {/* LAYER 2: MAIN CARD LAYER */}
          <main className="relative z-10 flex items-center justify-center px-8 flex-1">
            <div
              className="relative w-full max-w-4xl flex flex-col items-center justify-center text-center px-12 py-24 rounded-3xl mt-12 transition-all duration-300 backdrop-blur-md"
              style={{
                background: 'radial-gradient(ellipse at 50% 120%, rgba(236, 170, 246, 0.25) 0%, rgba(101, 37, 131, 0.4) 50%, rgba(30, 27, 75, 0.75) 100%)',
                boxShadow: '0 30px 100px rgba(168, 85, 247, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {/* DEVELOP 글자 분할 및 VELO 강조  */}
              <h1 className="font-black text-6xl md:text-8xl tracking-[0.25em] mb-10 select-none flex items-center justify-center filter drop-shadow-[0_0_20px_rgba(168,85,247,0.65)] drop-shadow-[0_0_50px_rgba(99,102,241,0.4)]">
                <span className="text-white/25 opacity-25">DE</span>
                <span className="mx-4 bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent transform scale-105 select-none tracking-[0.22em]">
                  VELO
                </span>
                <span className="text-white/25 opacity-25 -ml-6">P</span>
              </h1>
              
              <p className="bg-gradient-to-b from-white via-white to-purple-200 bg-clip-text text-transparent text-xs md:text-sm tracking-widest font-semibold leading-[2.2] mb-12 max-w-2xl mx-auto select-none">
                가장 완벽한 속도<span className="text-blue-300">(Velocity)</span>로 마주하는 지능형 소프트웨어 아키텍처.<br />
                복잡한 연산을 관통하는 <span className="text-purple-300">VELO</span> 엔진의 혁신적인 코드 자동 생성을 경험하고,<br />
                당신이 설계할 상상력의 본질에만 온전히 몰입하세요.
              </p>
              
              {/* 클릭 유도 장치가 적용된 SCROLL DOWN 버튼 */}
              <button
                onClick={handleScrollDown}
                className="group border border-white/30 text-white/90 text-[10px] font-bold tracking-[0.35em] px-9 py-4 rounded-full bg-white/[0.02] hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 pointer-events-auto flex items-center gap-3 shadow-lg cursor-pointer scale-100 hover:scale-105 active:scale-95 animate-custom-bounce animate-neon-pulse"
              >
                SCROLL DOWN 
                <span className="inline-block text-xs transform group-hover:translate-y-1 group-hover:scale-110 transition-all duration-300 text-blue-300 group-hover:text-white">
                  ↴
                </span>
              </button>
            </div>
          </main>

          {/* LAYER 3: FOREGROUND OVERLAP LAYER */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 transform translate-y-[45px] transition-transform duration-300" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <path className="liquid-front-left will-change-transform" d="M 80,240 C 20,150 160,100 230,160 C 300,220 300,320 210,340 C 120,360 40,330 80,240 Z" fill="url(#blob-light)" opacity="0.75" />
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
            background: 'linear-gradient(180deg, transparent 0%, #09081a 40%, #05050f 100%)'
          }}
        >
          <div className="w-full max-w-5xl mx-auto text-center flex flex-col items-center">
            
            <span className="text-xs font-bold tracking-[0.4em] text-purple-400 block mb-3 uppercase">
              VELO Platform
            </span>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-wider mb-12 bg-gradient-to-r from-white via-gray-200 to-purple-300 bg-clip-text text-transparent">
              상상하는 구조 그대로,<br />코드는 AI가 완성합니다.
            </h2>

            {/* 3D 원형 무대 래퍼 소켓 빌드 */}
            <div 
              className="relative w-full h-[400px] flex items-center justify-center overflow-visible mb-12"
              style={{ perspective: '1200px' }}
            >
              <div 
                className="relative w-full h-full flex items-center justify-center transition-transform duration-700 ease-out"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {CAROUSEL_CARDS.map((card, i) => {
                  const computedAngle = (i - activeCardIdx) * angleStep;
                  const x = Math.sin((computedAngle * Math.PI) / 180) * radius;
                  const z = Math.cos((computedAngle * Math.PI) / 180) * radius;
                  const isActive = i === activeCardIdx;

                  return (
                    <div
                      key={i}
                      className={`absolute w-[300px] md:w-[340px] h-[240px] bg-white/[0.02] border rounded-2xl p-8 backdrop-blur-xl transition-all duration-500 flex flex-col justify-center text-left pointer-events-auto select-none ${
                        isActive 
                          ? 'border-purple-500/60 shadow-[0_0_50px_rgba(168,85,247,0.3)] opacity-100 scale-105 z-30' 
                          : 'border-white/10 opacity-40 blur-[0.5px] scale-95 z-10'
                      }`}
                      style={{
                        transform: `translateX(${x}px) translateZ(${z}px) rotateY(${computedAngle}deg)`,
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'visible'
                      }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg mb-4 transition-colors ${
                        isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-500'
                      }`}>
                        {card.num}
                      </div>
                      <h3 className={`text-xl font-bold tracking-wide mb-3 transition-colors ${isActive ? 'text-purple-300' : 'text-white'}`}>
                        {card.title}
                      </h3>
                      <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3D 조작 인터랙션 바 패키지 */}
            <div className="flex items-center gap-6 mb-16 z-30">
              <button 
                onClick={prevCard}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-gray-400 hover:text-purple-400 hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto text-xl shadow-lg"
              >
                ◀
              </button>
              
              <div className="flex gap-2.5">
                {CAROUSEL_CARDS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCardIdx(i)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer pointer-events-auto ${
                      i === activeCardIdx ? 'w-8 bg-purple-400 shadow-[0_0_12px_#a855f7]' : 'w-2.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <button 
                onClick={nextCard}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-gray-400 hover:text-purple-400 hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto text-xl shadow-lg"
              >
                ▶
              </button>
            </div>

            <div className="mt-8 p-12 rounded-2xl bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/10 border border-white/5 backdrop-blur-lg max-w-3xl mx-auto flex flex-col items-center">
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