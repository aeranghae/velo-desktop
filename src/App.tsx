import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import Library from './pages/Library';
import Settings from './pages/Settings';
import LoginPage from './pages/Login';
import ProjectDetail from './pages/ProjectDetail';
import LandingPage from './pages/LandingPage';
import './assets/index.css';

// 백엔드 폴링 설계 규격에 맞춘 진행 상태 타입 정의
export interface ProjectProgress {
  uuid: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number;                    
  currentStep: string;                  
  completedSteps: string[];            
  estimatedSecondsRemaining: number;   
  startedAt: number;                   
}

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 동적 연동을 위해 현재 선택된 프로젝트의 UUID를 보관할 상태 주머니 추가
  const [activeProjectUuid, setActiveProjectUuid] = useState<string>('');

  //외부 키와 내부 필드의 uuid를 'design-guide-dummy-uuid'로 일치
  const [generatingProjects] = useState<{ [uuid: string]: ProjectProgress }>({
    'design-guide-dummy-uuid': {
      uuid: 'design-guide-dummy-uuid',
      status: 'generating',
      progress: 45, //언제든 UI 요소(퍼센트, 로그 위치)를 볼 수 있게 45% 상시 가동 상태 유지
      currentStep: '라이선스 공장 가동 및 LICENSE.md 매핑 중...',
      completedSteps: ['프로젝트 폴더 구조 생성', '기본 도메인 아키텍처 설계 명세 수립'],
      estimatedSecondsRemaining: 25,
      startedAt: Date.now() - 30000,
    }
  });

  const [bgConfig, setBgConfig] = useState({
    orb1: 'bg-blue-600/20', orb2: 'bg-purple-600/20',
    pos1: 'top-0 left-0', pos2: 'bottom-0 right-0'
  });

  useEffect(() => {
    document.title = " ";

    const checkLoginStatus = async () => {
      const token = localStorage.getItem('aeranghae_token');
      if (token) {
        try {
          const res = await axios.get('https://oxxultus.cloud/api/user/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const finalName = res.data.name || res.data.nickname;
          if (finalName) {
            localStorage.setItem('aeranghae_user_name', finalName);
            setIsLoggedIn(true);
          }
        } catch (err) {
          localStorage.removeItem('aeranghae_token');
          localStorage.removeItem('aeranghae_user_name');
          setIsLoggedIn(false);
        }
      }
      setIsLoading(false);
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    switch (activeMenu) {
      case 'dashboard':
        setBgConfig({ orb1: 'bg-blue-600/20', orb2: 'bg-purple-600/20', pos1: 'top-[-10%] left-[-10%]', pos2: 'bottom-[-10%] right-[-10%]' });
        break;
      case 'create':
        setBgConfig({ orb1: 'bg-cyan-500/20', orb2: 'bg-indigo-500/20', pos1: 'top-[10%] left-[20%]', pos2: 'bottom-[10%] right-[20%]' });
        break;
      case 'library':
        setBgConfig({ orb1: 'bg-emerald-600/15', orb2: 'bg-teal-600/15', pos1: 'top-[-5%] right-[-5%]', pos2: 'bottom-[-5%] left-[-5%]' });
        break;
    }
  }, [activeMenu]);

  // 프로젝트 생성 핸들러
  const handleGenerate = (newProjectData: any) => {
    const realUuid = newProjectData?.uuid;
    if (!realUuid) {
      alert("프로젝트 생성 오류: UUID를 정상적으로 수령하지 못했습니다.");
      return;
    }

    setActiveProjectUuid(realUuid);
    setActiveMenu('library');
  };

  // 라이브러리 카드 분기 핸들러 (개편: 어떤 카드든 무조건 상세화면 detail로 유도)
  const handleSelectProject = (uuid: string) => {
    setActiveProjectUuid(uuid);
    setActiveMenu('detail');
  };

  const handleEntryComplete = () => {
    const token = localStorage.getItem('aeranghae_token');
    if (token) {
      setIsLoggedIn(true);
      setIsGuest(false);
    } else {
      setIsGuest(true);
    }
  };

  if (isLoading) return <div className="h-screen w-full bg-[#1C1C1E]" />;

  // 비로그인 및 비게스트 상태일 때 3D 메인 랜딩 페이지 표출
  if (!isLoggedIn && !isGuest) {
    return (
      <div className="w-full h-screen bg-[#1C1C1E] text-white relative font-sans overflow-hidden select-none">
        <LandingPage 
          onStart={() => setIsGuest(true)} 
          onLogin={() => setShowAuthModal(true)} 
        />
        
        {showAuthModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative">
              <LoginPage onClose={() => {
                handleEntryComplete();
                setShowAuthModal(false);
              }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 로그인 완료 혹은 게스트 입장 시 대시보드 진입
  return (
    <div className="flex h-screen w-full min-w-[1100px] bg-[#1C1C1E] text-white overflow-hidden relative font-sans select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-[1500ms] ease-in-out ${bgConfig.orb1} ${bgConfig.pos1}`} />
        <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-[1500ms] ease-in-out ${bgConfig.orb2} ${bgConfig.pos2}`} />
      </div>

      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <main className="flex-1 p-8 flex flex-col relative pt-12 h-screen overflow-hidden z-10 animate-in slide-in-from-left-4 duration-1000">
        {activeMenu === 'dashboard' && <Dashboard setActiveMenu={setActiveMenu} />}
        {activeMenu === 'create' && <CreateProject onGenerate={handleGenerate} />}
        
        {activeMenu === 'library' && (
          <Library 
            onSelectProject={handleSelectProject} 
            generatingProjects={generatingProjects}
            activeMenu={activeMenu}
          />
        )}
        
        {activeMenu === 'detail' && (
          <ProjectDetail 
            projectUuid={activeProjectUuid} 
            generatingProjects={generatingProjects}
          />
        )}
        {activeMenu === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;