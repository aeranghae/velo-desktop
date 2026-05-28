import React, { useState, useEffect } from 'react';
import { Code, Clock, ChevronRight, Layout, Cpu, BookOpenText, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import API from '../services'; 
import { FrameworkStats } from '../services/statistics';
import { projectService, ProjectResponseDto } from '../services/projectService'; 

interface DashboardProps {
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
  onSelectProject?: (uuid: string) => void; 
}

interface ActivityLogItem {
  text: string;
  time: string;
  type: string;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveMenu, onSelectProject }) => {
  // 백엔드 통계 데이터
  const [apiStats, setApiStats] = useState<FrameworkStats>({
    totalProjectCount: 0,
    frameworkCounts: {}
  });

  // 최근 프로젝트 목록
  const [realRecentProjects, setRealRecentProjects] = useState<ProjectResponseDto[]>([]);
  
  // 데이터 동기화 감지용 로딩 스위치
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 활동 피드 목록을 실시간으로 반영 가능하도록 컴포넌트 상태로 관리
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  // 컴포넌트 마운트 시 기술 스택 분포 통계 및 실제 프로젝트 목록 호출
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // 1. 통계 데이터 패치
        const statsRes = await API.get('/api/storage/projects/framework/statistics');
        if (statsRes.data) {
          setApiStats(statsRes.data);
        }

        // 2. 내 프로젝트 리스트 긁어오기
        const projectsData = await projectService.getProjects();
        if (Array.isArray(projectsData)) {
          // 최근에 수정한 프로젝트가 상단에 오도록 정렬 후, 딱 3개만 도려내기
          const sorted = [...projectsData]
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
            .slice(0, 3);
          setRealRecentProjects(sorted);
        }

      } catch (error) {
        console.error('대시보드 메트릭 및 프로젝트 스트림 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    //SSE 스트림으로부터 넘어오는 활동 로그 실시간 전역 이벤트 리스너 등록
    const handleActivityUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ActivityLogItem>;
      if (customEvent.detail) {
        setActivityLogs((prev) => [customEvent.detail, ...prev]);
      }
    };

    window.addEventListener('dashboard-activity-update', handleActivityUpdate);
    return () => {
      window.removeEventListener('dashboard-activity-update', handleActivityUpdate);
    };
  }, []);

  // 백엔드 맵 데이터를 Recharts 차트 전용 배열 포맷으로 변환
  const techStackData = Object.entries(apiStats.frameworkCounts)
    .map(([key, value]) => {
      const rawKey = key.toLowerCase().trim();
      let name = key.toUpperCase();
      let color = '#6b7280'; 

      if (rawKey.includes('spring')) {
        name = 'SPRING BOOT';
        color = '#10b981';
      } else if (rawKey.includes('react')) {
        name = 'REACT';
        color = '#3b82f6';
      } else if (rawKey.includes('next')) {
        name = 'NEXT.JS';
        color = '#38bdf8'; 
      } else if (rawKey.includes('cpp')) {
        name = 'C++';
        color = '#f59e0b';
      } else if (rawKey.includes('python')) {
        name = 'PYTHON';
        color = '#a855f7';
      }

      return { name, value, color };
    })
    .sort((a, b) => b.value - a.value); 

  const isEmpty = techStackData.length === 0;
  const chartData = isEmpty ? [{ name: '프로젝트 없음', value: 1, color: 'rgba(255,255,255,0.05)' }] : techStackData;

  const stats = [
    { label: '전체 프로젝트', value: String(apiStats.totalProjectCount), icon: <Layout size={18} />, color: 'text-blue-400' },
    { label: '시스템 상태', value: '정상', icon: <Cpu size={18} />, color: 'text-green-400' },
  ];

  //최근 프로젝트 카드를 클릭했을 때 해당 상세 리그로 다이렉트 순간이동하는 핸들러
  const handleRecentCardClick = (uuid: string) => {
    if (onSelectProject) {
      onSelectProject(uuid);
    } else {
      setActiveMenu('library');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-700 select-none">
      
      {/* 1. 상단 카드 대시보드 영역 */}
      <div className="grid grid-cols-12 gap-6 mb-8 shrink-0">
        <div className="col-span-3 bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-md flex items-center justify-between group hover:bg-white/[0.07] transition-all h-[140px]">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{stats[0].label}</p>
            <h3 className="text-2xl font-black tracking-tight">{stats[0].value}</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-white/5 ${stats[0].color}`}>{stats[0].icon}</div>
        </div>

        <div className="col-span-3 bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-md flex items-center justify-between group hover:bg-white/[0.07] transition-all h-[140px]">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{stats[1].label}</p>
            <h3 className="text-2xl font-black tracking-tight">{stats[1].value}</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-white/5 ${stats[1].color}`}>{stats[1].icon}</div>
        </div>

        {/* 세 번째 카드: 기술 스택 분포 박스 */}
        <div className="col-span-6 bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-md flex items-center shadow-xl h-[140px]">
          <div className="shrink-0 flex flex-col gap-1 ml-2 mr-8">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BookOpenText size={16} className="text-purple-400" /> 기술 스택 분포
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">최근 프로젝트 사용 비율</p>
          </div>
          
          <div className="flex-1 h-full relative flex items-center justify-center">
            {isLoading ? (
              /* 차트 박스 영역 안에서만 우아하게 도는 마이크로 로딩 장치 */
              <div className="flex items-center gap-2 text-gray-500 text-xs font-mono">
                <RefreshCw className="animate-spin text-purple-400" size={14} />
                <span>LOADING GRAPH...</span>
              </div>
            ) : (
              /* 데이터 로드가 끝났을 때만 완벽하게 래핑되어 켜지는 진짜 그래픽 파트 */
              <div className="w-full h-full flex items-center justify-between" key={apiStats.totalProjectCount}>
                
                {/* 왼쪽: 도넛 스키마 */}
                <div className="w-[110px] h-[110px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={48} paddingAngle={isEmpty ? 0 : 5} dataKey="value" cornerRadius={6}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      {!isEmpty && <Tooltip contentStyle={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} />}
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 오른쪽: 하이퍼 커스텀 격리 범례 보드 */}
                <div className="flex-1 flex flex-col gap-2 pl-8 overflow-y-auto max-h-[110px] custom-scrollbar">
                  {techStackData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between w-full pr-2 text-[11px] font-bold text-gray-400">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="truncate font-mono uppercase tracking-tight text-gray-300">{entry.name}</span>
                      </div>
                      <span className="text-gray-600 font-mono text-[10px] shrink-0 ml-2">{entry.value}개</span>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* 2. 최근 프로젝트 목록 (왼쪽) */}
        <div className="col-span-8 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-5 px-1">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">최근 프로젝트</h3>
              <p className="text-xs text-gray-500 mt-1">최근에 작업한 AI 설계 내역입니다.</p>
            </div>
            <button onClick={() => setActiveMenu('create')} className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-xs font-bold transition-all active:scale-95">
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
                    className="bg-white/5 border border-white/5 p-5 rounded-[24px] hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-inner">
                        <Code size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-1 group-hover:text-blue-400 transition-colors">
                          {project.projectName || '이름 없는 프로젝트'}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">
                          {project.framework || 'SPRING BOOT'} 
                          <span className="mx-2 text-white/10">|</span> 
                          엔진: {project.model || 'gemini'} 
                          <span className="mx-2 text-white/10">|</span> 
                          {displayDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">열기</span>
                      <ChevronRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-white/5 border border-dashed border-white/5 rounded-[24px]">
                <p className="text-sm text-gray-500 font-bold">생성된 최근 프로젝트 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. 활동 피드 (오른쪽) */}
        <div className="col-span-4 flex flex-col min-h-0">
          <div className="mb-5 px-1">
            <h3 className="text-xl font-bold flex items-center gap-2">활동 피드</h3>
            <p className="text-xs text-gray-500 mt-1">AI 에이전트의 작업 로그</p>
          </div>
          
          <div className="flex-1 bg-black/20 border border-white/10 rounded-[32px] p-6 overflow-hidden flex flex-col shadow-inner">
            <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2">
              {activityLogs.map((log, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)] ${log.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-300 leading-relaxed font-medium">
                      {log.text.split('**').map((part, index) => index % 2 === 1 ? <b key={index} className="text-blue-400 font-bold">{part}</b> : part)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-gray-600" />
                      <span className="text-[10px] text-gray-600 font-mono tracking-tighter">{log.time}</span>
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