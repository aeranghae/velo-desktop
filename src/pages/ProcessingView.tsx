import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, Cpu, Loader2, Clock } from 'lucide-react';

interface ProcessingViewProps {
  onComplete: () => void;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'success' }[]>([
    { msg: "System: AI Generation Engine initialized.", type: 'info' }
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤 기능
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  /**
   * [참고용 API 설계 명세]
   * 백엔드에서 실시간으로 갱신해줘야 할 핵심 단계 리스트(추가될수도)
   */
  const steps = [
    { id: 1, label: '프로젝트 폴더 생성 완료', threshold: 15 },
    { id: 2, label: '프로젝트 프로토타입 생성 완료', threshold: 35 },
    { id: 3, label: '라이선스 추가 중...', threshold: 55 },
    { id: 4, label: '코드 생성 중...', threshold: 80 },
    { id: 5, label: '코드 컴파일 중...', threshold: 100 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = prev + 1;

        // 1. 시스템 스트리밍 로그 (자잘한 정보성 로그)
        if (next % 6 === 0) {
          const randomLogs = [
            `Allocating virtual infrastructure... ${next}%`,
            `Injecting dependencies into build.gradle...`,
            `Running static analysis check...`,
            `Mapping domain model architecture...`
          ];
          setLogs(prevLogs => [...prevLogs, { msg: randomLogs[Math.floor(Math.random() * randomLogs.length)], type: 'info' }]);
        }

        // 2. 굵직한 단계별 로그 (로그 텍스트 출력)
        steps.forEach(step => {
          if (next === step.threshold) {
            setLogs(prevLogs => [...prevLogs, { msg: `✓ ${step.label}`, type: 'success' }]);
          }
        });

        return next;
      });
    }, 100); // 로그 찍히는 속도
    return () => clearInterval(timer);
  }, []);

  const isFinished = progress === 100;

  //[가이드용 예상 남은 시간 계산] (초 단위로 계산)
  const fakeRemainingSeconds = Math.max(Math.ceil((100 - progress) * 0.2), 0);

  return (
    <div className="h-full flex flex-col gap-8 p-10 text-white relative overflow-hidden">
      
      {/* 배경 광채 효과 (Orb) */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 
        ${isFinished ? 'bg-emerald-500/10' : 'bg-cyan-500/10 animate-pulse'}`} 
      />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-10">
        
        {/* 1. 중앙 CPU 애니메이션 (회전 스피너) */}
        <div className="relative">
          <div className={`w-40 h-40 rounded-[40px] border-4 flex items-center justify-center transition-all duration-700
            ${isFinished 
                ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] bg-emerald-500/5' 
                : 'border-cyan-500/30 animate-[spin_12s_linear_infinite] bg-cyan-500/5' 
            }`}>
            <div className={`w-28 h-28 rounded-[30px] border-t-4 flex items-center justify-center transition-all duration-700
                ${isFinished ? 'border-emerald-400' : 'border-cyan-400 animate-[spin_3s_linear_infinite_reverse]'}`} 
            />
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
             {isFinished ? (
                 <CheckCircle2 size={48} className="text-emerald-400 animate-in zoom-in duration-500" />
             ) : (
                 <>
                  <Cpu size={48} className="text-white animate-pulse" />
                  <span className="text-[10px] font-black text-cyan-400 tracking-[0.3em] animate-pulse uppercase">Building</span>
                 </>
             )}
          </div>
        </div>

        {/* 2. 상태 텍스트 및 진행 바 (퍼센트 + 남은 시간) */}
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">
              {isFinished ? "Generation Complete" : "Architectural Processing"}
            </h2>
            <p className="text-gray-400 text-xs font-medium">
              {isFinished ? "모든 코드가 성공적으로 생성되었습니다." : "AI 엔진이 프로젝트의 뼈대를 설계 중입니다."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
              <span className={isFinished ? "text-emerald-400" : "text-cyan-400"}>Progress Status</span>
              
              {/* [퍼센트 + 남은 시간 표출 구역] */}
              <span className={`flex items-center gap-2 ${isFinished ? "text-emerald-400" : "text-cyan-400"}`}>
                <span className="font-black text-xs">{progress}%</span>
                {!isFinished && (
                  <span className="text-cyan-400 flex items-center gap-1.5 font-bold normal-case tracking-normal bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md animate-pulse">
                    <Clock size={12} className="text-cyan-400" /> 약 {fakeRemainingSeconds}초 남음
                  </span>
                )}
              </span>
            </div>
            
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1.5px]">
              <div 
                className={`h-full rounded-full transition-all duration-300 relative ${isFinished ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}
                style={{ width: `${progress}%` }}
              >
                {!isFinished && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
            </div>
          </div>
        </div>

        {/* 3. 실시간 터미널 로그 출력창 */}
        <div className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 h-56 flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center gap-2 mb-4 text-gray-500 border-b border-white/5 pb-2 shrink-0 uppercase font-black text-[10px] tracking-widest">
                <Terminal size={14} /> System Live Output
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] custom-scrollbar scroll-smooth pr-2">
                {logs.map((log, idx) => (
                    <div key={idx} className={`flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300 ${log.type === 'success' ? 'text-cyan-400 font-bold' : 'text-gray-500'}`}>
                        <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                        <span>{log.msg}</span>
                    </div>
                ))}
                {!isFinished && (
                    <div className="flex items-center gap-2 opacity-50 mt-2">
                        <Loader2 size={12} className="text-cyan-500 animate-spin" />
                        <span className="text-cyan-500 text-[10px] italic">Processing data stream...</span>
                    </div>
                )}
                <div ref={logEndRef} />
            </div>
        </div>

        {/* 4. 오픈 액션 버튼 */}
        <button 
            onClick={onComplete}
            disabled={!isFinished}
            className={`px-20 py-5 rounded-2xl font-black tracking-[0.2em] transition-all text-sm
                ${isFinished 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 cursor-pointer' 
                    : 'bg-white/5 text-gray-700 border border-white/5 cursor-not-allowed'
                }`}
        >
            {isFinished ? "OPEN PROJECT LIBRARY" : "GENERATING..."}
        </button>

      </div>
    </div>
  );
};

export default ProcessingView;