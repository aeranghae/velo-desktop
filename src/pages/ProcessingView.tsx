import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, Cpu, Loader2, Clock } from 'lucide-react';

interface ProcessingViewProps {
  isGenerating?: boolean; 
  onComplete: () => void;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ isGenerating = true, onComplete }) => {
  const [progress, setProgress] = useState(isGenerating ? 0 : 100);
  
  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'success' }[]>(
    isGenerating 
      ? [{ msg: "System: AI Generation Engine initialized.", type: 'info' }]
      : [
          { msg: "System: AI Generation Engine initialized.", type: 'info' },
          { msg: "✓ 프로젝트 폴더 생성 완료", type: 'success' },
          { msg: "✓ 프로젝트 프로토타입 생성 완료", type: 'success' },
          { msg: "✓ 라이선스 추가 중...", type: 'success' },
          { msg: "✓ 코드 생성 중...", type: 'success' },
          { msg: "✓ 코드 컴파일 중...", type: 'success' }
        ]
  );
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const steps = [
    { id: 1, label: '프로젝트 폴더 생성 완료', threshold: 15 },
    { id: 2, label: '프로젝트 프로토타입 생성 완료', threshold: 35 },
    { id: 3, label: '라이선스 추가 중...', threshold: 55 },
    { id: 4, label: '코드 생성 중...', threshold: 80 },
    { id: 5, label: '코드 컴파일 중...', threshold: 100 },
  ];

  useEffect(() => {
    if (!isGenerating) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = prev + 1;

        if (next % 6 === 0) {
          const randomLogs = [
            `Allocating virtual infrastructure... ${next}%`,
            `Injecting dependencies into build.gradle...`,
            `Running static analysis check...`,
            `Mapping domain model architecture...`
          ];
          setLogs(prevLogs => [...prevLogs, { msg: randomLogs[Math.floor(Math.random() * randomLogs.length)], type: 'info' }]);
        }

        steps.forEach(step => {
          if (next === step.threshold) {
            setLogs(prevLogs => [...prevLogs, { msg: `✓ ${step.label}`, type: 'success' }]);
          }
        });

        return next;
      });
    }, 100); 
    return () => clearInterval(timer);
  }, [isGenerating]);

  const isFinished = progress === 100;
  const fakeRemainingSeconds = Math.max(Math.ceil((100 - progress) * 0.2), 0);

  return (
    <div className="w-full h-full max-h-[calc(100vh-140px)] flex flex-col justify-between p-6 text-white relative overflow-hidden bg-[#0D0D0E]">
      
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 
        ${isFinished ? 'bg-emerald-500/5' : 'bg-cyan-500/5 animate-pulse'}`} 
      />

      {/*내부 컴포넌트 간 간격을 과도하지 않게 gap-5로 축소 조율 */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-5 min-h-0">
        
        {/* 1. 중앙 CPU 애니메이션 (스케일 85% 압축하여 상단 공간 확보) */}
        <div className="relative scale-85 my-1 shrink-0">
          <div className={`w-36 h-36 rounded-[36px] border-4 flex items-center justify-center transition-all duration-700
            ${isFinished 
                ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-emerald-500/5' 
                : 'border-cyan-500/30 animate-[spin_12s_linear_infinite] bg-cyan-500/5' 
            }`}>
            <div className={`w-24 h-24 rounded-[26px] border-t-4 flex items-center justify-center transition-all duration-700
                ${isFinished ? 'border-emerald-400' : 'border-cyan-400 animate-[spin_3s_linear_infinite_reverse]'}`} 
            />
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
             {isFinished ? (
                 <CheckCircle2 size={40} className="text-emerald-400 animate-in zoom-in duration-500" />
             ) : (
                 <>
                  <Cpu size={40} className="text-white animate-pulse" />
                  <span className="text-[9px] font-black text-cyan-400 tracking-[0.3em] animate-pulse uppercase">Building</span>
                 </>
             )}
          </div>
        </div>

        {/* 2. 상태 텍스트 및 진행 바 (마진 좁히고 간결화) */}
        <div className="w-full max-w-lg text-center space-y-3 shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">
              {isFinished ? "Generation Complete" : "Architectural Processing"}
            </h2>
            <p className="text-gray-400 text-[11px] font-medium">
              {isFinished ? "모든 코드가 성공적으로 생성되었습니다." : "AI 엔진이 프로젝트의 뼈대를 설계 중입니다."}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest px-1">
              <span className={isFinished ? "text-emerald-400" : "text-cyan-400"}>Progress Status</span>
              <span className={`flex items-center gap-2 ${isFinished ? "text-emerald-400" : "text-cyan-400"}`}>
                <span className="font-black text-xs">{progress}%</span>
                {!isFinished && (
                  <span className="text-cyan-400 flex items-center gap-1 font-bold normal-case tracking-normal bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md animate-pulse text-[10px]">
                    <Clock size={10} className="text-cyan-400" /> 약 {fakeRemainingSeconds}초 남음
                  </span>
                )}
              </span>
            </div>
            
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div 
                className={`h-full rounded-full transition-all duration-300 relative ${isFinished ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}
                style={{ width: `${progress}%` }}
              >
                {!isFinished && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
            </div>
          </div>
        </div>

        {/* 3. 실시간 터미널 로그 출력창 (높이를 h-44로 줄이고 min-h-0 처리하여 화면 비율 유연하게 대응) */}
        <div className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-[24px] p-5 h-44 min-h-0 flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center gap-2 mb-3 text-gray-500 border-b border-white/5 pb-1.5 shrink-0 uppercase font-black text-[9px] tracking-widest">
                <Terminal size={12} /> System Live Output
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] custom-scrollbar scroll-smooth pr-2">
                {logs.map((log, idx) => (
                    <div key={idx} className={`flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300 ${log.type === 'success' ? 'text-cyan-400 font-bold' : 'text-gray-500'}`}>
                        <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                        <span>{log.msg}</span>
                    </div>
                ))}
                {!isFinished && (
                    <div className="flex items-center gap-2 opacity-50 mt-1">
                        <Loader2 size={11} className="text-cyan-500 animate-spin" />
                        <span className="text-cyan-500 text-[10px] italic">Processing data stream...</span>
                    </div>
                )}
                <div ref={logEndRef} />
            </div>
        </div>

        {/* 4. 오픈 액션 버튼 */}
        <button 
            onClick={onComplete}
            className={`px-16 py-3.5 rounded-xl font-black tracking-[0.2em] text-xs cursor-pointer shrink-0 mt-1 transition-all duration-300
                ${isFinished 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95' 
                    : 'bg-white/5 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/5'
                }`}
        >
            {isFinished ? "OPEN CODE INSPECTOR" : "RETURN TO WORKSPACE"}
        </button>

      </div>
    </div>
  );
};

export default ProcessingView;