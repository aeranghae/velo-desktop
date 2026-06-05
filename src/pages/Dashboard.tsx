import React, { useState, useEffect } from 'react';
import { Code, Clock, ChevronRight, Layout, Cpu, HardDrive } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import API from '../services'; 
import { FrameworkStats } from '../services/statistics';
import { projectService, ProjectResponseDto } from '../services/projectService'; 
import { getActivityLogs, ActivityLogItem } from '../utils/activityLogger';

interface DashboardProps {
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
  onSelectProject?: (uuid: string) => void; 
}

interface ServerStatusResponse {
  status: string;       
  uptime: number;       
  cpuUsage: number;     
  totalMemory: number;  
  freeMemory: number;   
  usedMemory: number;   
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveMenu, onSelectProject }) => {
  // 백엔드 통계 데이터
  const [apiStats, setApiStats] = useState<FrameworkStats>({
    totalProjectCount: 0,
    frameworkCounts: {}
  });

  // 최근 프로젝트 목록
  const [realRecentProjects, setRealRecentProjects] = useState<ProjectResponseDto[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(
    () => getActivityLogs()
  );

  const [serverData, setServerData] = useState<ServerStatusResponse | null>(null);
  const [isConnectingSSE, setIsConnectingSSE] = useState<boolean>(true);
  const [sseError, setSseError] = useState<boolean>(false);

  // 바이트 단위를 GB 포맷으로 깔끔하게 바꾸는 헬퍼
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0.00 GB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await API.get('/api/storage/projects/framework/statistics');
        if (statsRes.data) {
          setApiStats(statsRes.data);
        }

        const projectsData = await projectService.getProjects();
        if (Array.isArray(projectsData)) {
          const sorted = [...projectsData]
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
            .slice(0, 3);
          setRealRecentProjects(sorted);
        }
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
      }
    };

    fetchDashboardData();

    const disconnectStream = projectService.connectServerStatusStream(
      () => {
        setIsConnectingSSE(false);
        setSseError(false);
      },
      (data) => {
        setServerData(data);
        setIsConnectingSSE(false);
        setSseError(false);
      },
      () => {
        setSseError(true);
        setIsConnectingSSE(false);
      }
    );

    const handleActivityUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ActivityLogItem>;
      if (customEvent.detail) {
        setActivityLogs((prev) => [customEvent.detail, ...prev]);
      }
    };

    window.addEventListener('dashboard-activity-update', handleActivityUpdate);
    
    return () => {
      disconnectStream();
      window.removeEventListener('dashboard-activity-update', handleActivityUpdate);
    };
  }, []);

  // 백엔드 맵 데이터를 Recharts 차트 전용 배열 포맷으로 변환
  const techStackData = Object.entries(apiStats.frameworkCounts)
    .map(([key, value]) => {
      const rawKey = key.toLowerCase().trim();
      let name = key.toUpperCase();
      let color = '#6b7280'; 

      if (rawKey.includes('spring')) { name = 'SPRING BOOT'; color = '#10b981'; } 
      else if (rawKey.includes('react')) { name = 'REACT'; color = '#3b82f6'; } 
      else if (rawKey.includes('next')) { name = 'NEXT.JS'; color = '#38bdf8'; } 
      else if (rawKey.includes('cpp')) { name = 'C++'; color = '#f59e0b'; } 
      else if (rawKey.includes('python')) { name = 'PYTHON'; color = '#a855f7'; }

      return { name, value, color };
    })
    .sort((a, b) => b.value - a.value); 

  const isEmpty = techStackData.length === 0;
  const chartData = isEmpty ? [{ name: '프로젝트 없음', value: 1, color: 'rgba(255,255,255,0.05)' }] : techStackData;

  const handleRecentCardClick = (uuid: string) => {
    if (onSelectProject) {
      onSelectProject(uuid);
    } else {
      setActiveMenu('library');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-700 select-none text-white">
      
      {/* 1. 상단 관제 카드 영역 (글래스모피즘 질감 초강화 레이어) */}
      <div className="grid grid-cols-12 gap-6 mb-8 shrink-0">
        
        {/* 카드 1: 전체 프로젝트 */}
        <div className="col-span-3 bg-white/[0.06] backdrop-blur-2xl saturate-150 border border-white/20 p-6 rounded-[24px] flex items-center justify-between group hover:bg-white/[0.1] hover:border-purple-400/40 transition-all duration-300 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] h-[140px]">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1 opacity-80">전체 프로젝트</p>
            <h3 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">{apiStats.totalProjectCount}개</h3>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-blue-400 shrink-0 ml-2 shadow-inner"><Layout size={18} /></div>
        </div>

        {/* 카드 2: 시스템 상태 */}
        <div className="col-span-3 bg-white/[0.06] backdrop-blur-2xl saturate-150 border border-white/20 p-6 rounded-[24px] flex items-center justify-between group hover:bg-white/[0.1] hover:border-purple-400/40 transition-all duration-300 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] h-[140px]">
          <div className="min-w-0 flex flex-col justify-between h-full py-0.5 flex-1">
            <div>
              <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1 opacity-80">인프라 코어 상태</p>
              <h3 className={`text-2xl font-black tracking-tight whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] ${sseError ? 'text-rose-400' : isConnectingSSE || !serverData ? 'text-amber-400' : 'text-emerald-400'}`}>
                {sseError ? '비정상' : isConnectingSSE || !serverData ? '점검 중' : `정상 (${Math.round(serverData.cpuUsage)}%)`}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${sseError ? 'bg-rose-500' : isConnectingSSE || !serverData ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">
                {sseError ? 'SYSTEM ERROR' : isConnectingSSE || !serverData ? 'TUNING' : 'LIVE TELEMETRY'}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-purple-400 shrink-0 ml-2 shadow-inner"><Cpu size={18} /></div>
        </div>

        {/* 카드 3: 서버 RAM 사용량 */}
        <div className="col-span-3 bg-white/[0.06] backdrop-blur-2xl saturate-150 border border-white/20 p-6 rounded-[24px] flex items-center justify-between group hover:bg-white/[0.1] hover:border-purple-400/40 transition-all duration-300 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] h-[140px]">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1 opacity-80">서버 RAM 사용량</p>
            <h3 className="text-xl font-black tracking-tight font-mono mt-1 text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.3)] whitespace-nowrap">
              {sseError ? '확인 불가' : isConnectingSSE || !serverData ? '0.00 GB' : formatBytes(serverData.usedMemory)}
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-2 block overflow-hidden text-ellipsis whitespace-nowrap">
              최대 할당: {serverData && serverData.totalMemory ? formatBytes(serverData.totalMemory) : '3.79 GB'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-orange-400 shrink-0 ml-2 shadow-inner"><HardDrive size={18} /></div>
        </div>

        {/* 카드 4: 기술 스택 분포 도넛형 */}
        <div className="col-span-3 bg-white/[0.06] backdrop-blur-2xl saturate-150 border border-white/20 p-5 rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] h-[140px]">
          <div className="flex items-center justify-between w-full h-full min-h-0">
            <div className="w-[68px] h-[68px] relative shrink-0 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={20} outerRadius={30} paddingAngle={isEmpty ? 0 : 4} dataKey="value" cornerRadius={4}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 pl-3 overflow-y-auto max-h-[110px] custom-scrollbar">
              {techStackData.slice(0, 3).map((entry, index) => (
                <div key={index} className="flex items-center justify-between w-full text-[10px] font-bold text-gray-300">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="font-mono uppercase tracking-tight text-gray-200 whitespace-nowrap">{entry.name}</span>
                  </div>
                  <span className="text-gray-400 font-mono text-[9px] shrink-0 ml-1.5">{entry.value}개</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 하단 프로젝트 목록 및 피드 */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        
        {/* 최근 프로젝트 목록 */}
        <div className="col-span-8 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-5 px-1">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">최근 프로젝트</h3>
              <p className="text-xs text-gray-400 mt-1">최근에 작업한 AI 설계 내역입니다.</p>
            </div>
            <button onClick={() => setActiveMenu('create')} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-black-500/30 text-blue-300 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.2)] cursor-pointer">
              + 새 프로젝트 생성
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {realRecentProjects && realRecentProjects.length > 0 ? (
              realRecentProjects.map((project) => {
                const displayDate = project.createdAt && typeof project.createdAt === 'string' 
                  ? project.createdAt.substring(0, 10) 
                  : '최근';

                return (
                  <div 
                    key={project.uuid} 
                    onClick={() => handleRecentCardClick(project.uuid)}
                    className="bg-white/[0.05] backdrop-blur-2xl saturate-150 border border-white/10 p-5 rounded-[24px] hover:bg-white/[0.1] hover:border-purple-400/40 transition-all duration-300 cursor-pointer group flex items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)]"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3.5 bg-purple-500/10 border border-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-inner">
                        <Code size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-1 group-hover:text-purple-400 transition-colors">
                          {project.projectName || '이름 없는 프로젝트'}
                        </h4>
                        <p className="text-xs text-gray-300 font-medium opacity-80">
                          {project.framework || 'SPRING BOOT'} 
                          <span className="mx-2 text-white/10">|</span> 
                          엔진: {project.model || 'gemini'} 
                          <span className="mx-2 text-white/10">|</span> 
                          {displayDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">열기</span>
                      <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-white/[0.04] backdrop-blur-2xl border border-dashed border-white/10 rounded-[24px] shadow-inner">
                <p className="text-sm text-gray-400 font-bold">생성된 최근 프로젝트 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 활동 피드 */}
        <div className="col-span-4 flex flex-col min-h-0">
          <div className="mb-5 px-1">
            <h3 className="text-xl font-bold flex items-center gap-2">활동 피드</h3>
            <p className="text-xs text-gray-400 mt-1">AI 에이전트의 작업 로그</p>
          </div>
          
          <div className="flex-1 bg-white/[0.04] backdrop-blur-3xl saturate-150 border border-white/10 rounded-[32px] p-6 overflow-hidden flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2">
              {activityLogs.map((log, i) => (
                <div key={i} className="flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)] ${log.type === 'success' ? 'bg-green-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-purple-400'}`} />
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-100 leading-relaxed font-medium">
                      {log.text.split('**').map((part, index) => index % 2 === 1 ? <b key={index} className="text-purple-300 font-bold drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]">{part}</b> : part)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;