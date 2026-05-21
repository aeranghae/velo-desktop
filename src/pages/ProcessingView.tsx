import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, Cpu, Loader2, AlertTriangle } from 'lucide-react';
import { projectService, ProjectStatus } from '../services/projectService';

interface ProcessingViewProps {
  projectUuid?: string;
  onComplete: () => void;
}

// status별 진행률 바 대략값 매핑
const STATUS_PROGRESS: { [key in ProjectStatus]: number } = {
  INIT: 5,
  CREATED: 10,
  PROVISIONING: 20,
  CONFIGURING: 30,
  ANALYZING: 45,
  CODING: 65,
  GENERATING: 75,
  EXECUTING: 90,
  COMPLETED: 100,
  FAILED: 100,
};

// 종료 상태 (이외에는 모두 진행 중으로 간주 → SSE 연결)
const TERMINAL_STATUS: ProjectStatus[] = ['COMPLETED', 'FAILED'];

// 상태 한글 라벨
const STATUS_LABEL: { [key in ProjectStatus]: string } = {
  INIT: '초기화 중',
  CREATED: '프로젝트 생성됨',
  PROVISIONING: '인프라 준비 중',
  CONFIGURING: '환경 구성 중',
  ANALYZING: '요구사항 분석 중',
  CODING: '코드 작성 중',
  GENERATING: '코드 생성 중',
  EXECUTING: '빌드 실행 중',
  COMPLETED: '생성 완료',
  FAILED: '생성 실패',
};

const ProcessingView: React.FC<ProcessingViewProps> = ({ projectUuid, onComplete }) => {
  const [status, setStatus] = useState<ProjectStatus>('INIT');
  const [progress, setProgress] = useState(0);
  // 로그는 \n 포함 단일 텍스트로 관리 (white-space: pre-wrap으로 렌더링)
  const [logText, setLogText] = useState<string>('System: AI Generation Engine initialized.\n');
  const [loadError, setLoadError] = useState<string>('');

  const logEndRef = useRef<HTMLDivElement>(null);
  // SSE 연결 해제 함수 보관
  const closeStreamRef = useRef<(() => void) | null>(null);

  // 로그 갱신 시 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logText]);

  // 초기 상태 조회 → 진행 중이면 SSE 연결
  useEffect(() => {
    if (!projectUuid) return;

    let cancelled = false;

    // 초기 상태/과거 로그 조회 (SSE 종료 후 최종 상태 재확인에도 재사용)
    const fetchInitialData = async (): Promise<ProjectStatus | null> => {
      try {
        const data = await projectService.getProjectInitialLog(projectUuid);
        if (cancelled) return null;

        setStatus(data.status);
        setProgress(STATUS_PROGRESS[data.status] ?? 0);
        if (data.previousLogs) {
          setLogText(data.previousLogs.endsWith('\n') ? data.previousLogs : data.previousLogs + '\n');
        }
        setLoadError('');
        return data.status;
      } catch (error: any) {
        console.error('초기 로그 조회 실패:', error);
        if (!cancelled) {
          if (error?.response?.status === 403) {
            setLoadError('실시간 로그 API 연동 대기 중입니다. (백엔드 준비 중 / 403)');
          } else {
            setLoadError('로그 정보를 불러오지 못했습니다.');
          }
        }
        return null;
      }
    };

    const init = async () => {
      const initialStatus = await fetchInitialData();
      if (cancelled || !initialStatus) return;

      // 종료 상태가 아니면 실시간 스트림 연결
      if (!TERMINAL_STATUS.includes(initialStatus)) {
        closeStreamRef.current = projectService.connectProjectLogStream(
          projectUuid,
          // onLog: 새 로그 라인 append
          (line) => setLogText((prev) => prev + line + '\n'),
          // onStatus: 4파트 중 status로 상단 진행 상태 갱신
          (newStatus) => {
            setStatus(newStatus);
            setProgress(STATUS_PROGRESS[newStatus] ?? 0);
          },
          // onError/onclose: 스트림 종료 → 최종 상태 재조회
          () => { fetchInitialData(); }
        );
      }
    };

    init();

    // 언마운트 시 SSE 정리
    return () => {
      cancelled = true;
      closeStreamRef.current?.();
      closeStreamRef.current = null;
    };
  }, [projectUuid]);

  const isFinished = status === 'COMPLETED';
  const isFailed = status === 'FAILED';
  const isDone = isFinished || isFailed;

  return (
    <div className="w-full h-full max-h-[calc(100vh-140px)] flex flex-col justify-between p-6 text-white relative overflow-hidden bg-[#0D0D0E]">

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000
        ${isFinished ? 'bg-emerald-500/5' : isFailed ? 'bg-red-500/5' : 'bg-cyan-500/5 animate-pulse'}`}
      />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-5 min-h-0">

        {/* 1. 중앙 CPU 애니메이션 */}
        <div className="relative scale-85 my-1 shrink-0">
          <div className={`w-36 h-36 rounded-[36px] border-4 flex items-center justify-center transition-all duration-700
            ${isFinished
                ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-emerald-500/5'
                : isFailed
                ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] bg-red-500/5'
                : 'border-cyan-500/30 animate-[spin_12s_linear_infinite] bg-cyan-500/5'
            }`}>
            <div className={`w-24 h-24 rounded-[26px] border-t-4 flex items-center justify-center transition-all duration-700
                ${isFinished ? 'border-emerald-400' : isFailed ? 'border-red-400' : 'border-cyan-400 animate-[spin_3s_linear_infinite_reverse]'}`}
            />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
             {isFinished ? (
                 <CheckCircle2 size={40} className="text-emerald-400 animate-in zoom-in duration-500" />
             ) : isFailed ? (
                 <AlertTriangle size={40} className="text-red-400 animate-in zoom-in duration-500" />
             ) : (
                 <>
                  <Cpu size={40} className="text-white animate-pulse" />
                  <span className="text-[9px] font-black text-cyan-400 tracking-[0.3em] animate-pulse uppercase">Building</span>
                 </>
             )}
          </div>
        </div>

        {/* 2. 상태 텍스트 및 진행 바 */}
        <div className="w-full max-w-lg text-center space-y-3 shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">
              {isFinished ? 'Generation Complete' : isFailed ? 'Generation Failed' : 'Architectural Processing'}
            </h2>
            <p className="text-gray-400 text-[11px] font-medium">
              {isFinished ? '모든 코드가 성공적으로 생성되었습니다.'
                : isFailed ? '생성 중 오류가 발생했습니다. 로그를 확인해주세요.'
                : 'AI 엔진이 프로젝트의 뼈대를 설계 중입니다.'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest px-1">
              <span className={isFinished ? 'text-emerald-400' : isFailed ? 'text-red-400' : 'text-cyan-400'}>
                {STATUS_LABEL[status]}
              </span>
              <span className={`font-black text-xs ${isFinished ? 'text-emerald-400' : isFailed ? 'text-red-400' : 'text-cyan-400'}`}>
                {progress}%
              </span>
            </div>

            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-500 relative ${isFinished ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : isFailed ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}
                style={{ width: `${progress}%` }}
              >
                {!isDone && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
            </div>
          </div>
        </div>

        {/* 3. 실시간 터미널 로그 출력창 */}
        <div className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-[24px] p-5 h-44 min-h-0 flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center gap-2 mb-3 text-gray-500 border-b border-white/5 pb-1.5 shrink-0 uppercase font-black text-[9px] tracking-widest">
                <Terminal size={12} /> System Live Output
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] custom-scrollbar scroll-smooth pr-2">
                {loadError ? (
                    <span className="text-red-400">{loadError}</span>
                ) : (
                    <pre className="whitespace-pre-wrap break-words text-gray-400 font-mono">{logText}</pre>
                )}
                {!isDone && !loadError && (
                    <div className="flex items-center gap-2 opacity-50 mt-1">
                        <Loader2 size={11} className="text-cyan-500 animate-spin" />
                        <span className="text-cyan-500 text-[10px] italic">Processing data stream...</span>
                    </div>
                )}
                <div ref={logEndRef} />
            </div>
        </div>

        {/* 4. 액션 버튼 */}
        <button
            onClick={onComplete}
            className={`px-16 py-3.5 rounded-xl font-black tracking-[0.2em] text-xs cursor-pointer shrink-0 mt-1 transition-all duration-300
                ${isFinished
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95'
                    : isFailed
                    ? 'bg-red-600/80 hover:bg-red-600 text-white'
                    : 'bg-white/5 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/5'
                }`}
        >
            {isFinished ? 'OPEN CODE INSPECTOR' : 'RETURN TO WORKSPACE'}
        </button>

      </div>
    </div>
  );
};

export default ProcessingView;