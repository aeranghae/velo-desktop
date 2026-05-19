import React, { useState, useEffect } from 'react';
import { Code, Clock, ChevronRight, Layout, Cpu, BookOpenText, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import API from '../services'; 
import { FrameworkStats, FRAMEWORK_META } from '../services/statistics';

interface DashboardProps {
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveMenu }) => {
  // 백엔드 통계 데이터
  const [apiStats, setApiStats] = useState<FrameworkStats>({
    totalProjectCount: 0,
    frameworkCounts: {}
  });
  
  // 데이터 동기화 감지용 로딩 스위치
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 컴포넌트 마운트 시 기술 스택 분포 통계 API 호출
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        const response = await API.get('/api/storage/projects/framework/statistics');
        if (response.data) {
          setApiStats(response.data);
        }
      } catch (error) {
        console.error('기술 스택 통계 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // 백엔드 맵 데이터를 Recharts 차트 전용 배열 포맷으로 변환
  const techStackData = Object.entries(apiStats.frameworkCounts)
    .map(([key, value]) => {
      const meta = FRAMEWORK_META[key] || { name: key, color: '#6b7280' };
      return {
        name: meta.name,
        value: value,
        color: meta.color
      };
    })
    //[정렬 패치]사용 비율이 제일 높은 스택이 배열 0번째(차트 중앙 타겟)로 오도록 내림차순 정렬
    .sort((a, b) => b.value - a.value); 

  // 프로젝트가 0개여서 통계 정보가 비어있을 때 차트 레이아웃 깨짐을 막는 기본 홀더 데이터
  const isEmpty = techStackData.length === 0;
  const chartData = isEmpty ? [{ name: '프로젝트 없음', value: 1, color: 'rgba(255,255,255,0.05)' }] : techStackData;

  // 통계 카드 데이터 (전체 프로젝트 카운트에 API 동적 연동)
  const stats = [
    { label: '전체 프로젝트', value: String(apiStats.totalProjectCount), icon: <Layout size={18} />, color: 'text-blue-400' },
    { label: '시스템 상태', value: '정상', icon: <Cpu size={18} />, color: 'text-green-400' },
  ];

  // 기존 최근 프로젝트 목록
  const recentProjects = [
    { id: 1, name: '지능형 이커머스 플랫폼', tech: 'React, Spring Boot', date: '2시간 전' },
    { id: 2, name: 'AI 이미지 분석 엔진', tech: 'Python, FastAPI', date: '어제' },
    { id: 3, name: '사내 관리자 대시보드', tech: 'React, Node.js', date: '3일 전' },
  ];

  // 데이터 패치 시간 동안 구동될 프로페셔널 로딩 인디케이터 스크린
  if (isLoading && apiStats.totalProjectCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full gap-4 bg-[#1C1C1E] rounded-[32px]">
        <RefreshCw className="animate-spin text-blue-500" size={36} />
        <p className="text-xs text-gray-500 font-mono tracking-wider">LOADING METRICS STREAM...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-700 select-none">
      
      {/* 1. 상단 영역 (순서: 프로젝트 -> 상태 -> 기술 스택 확장) */}
      <div className="grid grid-cols-12 gap-6 mb-8 shrink-0">
        
        {/* 첫 번째: 전체 프로젝트 (3칸 차지) */}
        <div className="col-span-3 bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-md flex items-center justify-between group hover:bg-white/[0.07] transition-all h-[140px]">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{stats[0].label}</p>
            <h3 className="text-2xl font-black tracking-tight">{stats[0].value}</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-white/5 ${stats[0].color}`}>{stats[0].icon}</div>
        </div>

        {/* 두 번째: 시스템 상태 (3칸 차지) */}
        <div className="col-span-3 bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-md flex items-center justify-between group hover:bg-white/[0.07] transition-all h-[140px]">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{stats[1].label}</p>
            <h3 className="text-2xl font-black tracking-tight">{stats[1].value}</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-white/5 ${stats[1].color}`}>{stats[1].icon}</div>
        </div>

        {/* 세 번째: [크기 확장] 기술 스택 분포 (6칸 차지 - 2배 넓음) */}
        <div className="col-span-6 bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-md flex items-center shadow-xl h-[140px]">
          <div className="shrink-0 flex flex-col gap-1 ml-2 mr-8">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BookOpenText size={16} className="text-purple-400" /> 기술 스택 분포
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">최근 프로젝트 사용 비율</p>
          </div>
          
          <div className="flex-1 h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  cx="50%" cy="50%" 
                  innerRadius={35} 
                  outerRadius={48} 
                  paddingAngle={isEmpty ? 0 : 5} 
                  dataKey="value" 
                  cornerRadius={6}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                {!isEmpty && (
                  <Tooltip 
                    contentStyle={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                  />
                )}
                {!isEmpty && (
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle" 
                    iconType="circle" 
                    iconSize={8} 
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '30px' }} 
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
            {/* 차트 중앙 핵심 스택 안내 텍스트 */}
            <div className="absolute top-1/2 left-[39%] transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-tight">
                  {techStackData && techStackData.length > 0 ? techStackData[0].name : 'NONE'}
                </p>
            </div>
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
            {recentProjects.map((project) => (
              <div key={project.id} className="bg-white/5 border border-white/5 p-5 rounded-[24px] hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-inner">
                    <Code size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1 group-hover:text-blue-400 transition-colors">{project.name}</h4>
                    <p className="text-xs text-gray-500 font-medium">{project.tech} <span className="mx-2 text-white/10">|</span> {project.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">열기</span>
                  <ChevronRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
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
              {[
                { text: "AI 에이전트가 **인증 모듈** 생성을 성공적으로 완료했습니다.", time: "14:20:05", type: "success" },
                { text: "프로젝트 **'이미지 분석 엔진'**의 의존성 라이브러리를 업데이트했습니다.", time: "13:45:12", type: "info" },
                { text: "새로운 기술 스택 **FastAPI**가 시스템에 추가되었습니다.", time: "11:30:00", type: "system" },
                { text: "사용자 **Hyoju**님이 새로운 프로젝트 설계를 시작했습니다.", time: "09:15:22", type: "user" },
                { text: "데이터베이스 스키마 자동 설계가 완료되었습니다.", time: "어제", type: "success" }
              ].map((log, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)] ${
                    log.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-300 leading-relaxed font-medium">
                      {log.text.split('**').map((part, index) => 
                        index % 2 === 1 ? <b key={index} className="text-blue-400 font-bold">{part}</b> : part
                      )}
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