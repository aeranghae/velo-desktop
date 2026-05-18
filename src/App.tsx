import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import Library from './pages/Library';
import Settings from './pages/Settings';
import LoginPage from './pages/Login';
import ProcessingView from './pages/ProcessingView';
import ProjectDetail from './pages/ProjectDetail';
import LandingPage from './pages/LandingPage';
import './assets/index.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  //동적 연동을 위해 현재 선택된 프로젝트의 UUID를 보관할 상태 주머니 추가
  const [activeProjectUuid, setActiveProjectUuid] = useState<string>('');

  // 라이브러리에서 관리할 프로젝트 리스트 상태
  const [projects, setProjects] = useState([
    { id: 'p1', title: '사내 업무 자동화', status: 'completed', progress: 100, date: '2024.03.15', items: 12 },
    { id: 'p2', title: '쇼핑몰 기본 템플릿', status: 'completed', progress: 100, date: '2024.03.10', items: 5 },
  ]);

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
      case 'processing':
        setBgConfig({ orb1: 'bg-indigo-900/30', orb2: 'bg-blue-900/30', pos1: 'top-[50%] left-[50%]', pos2: 'bottom-[50%] right-[50%]' });
        break;
    }
  }, [activeMenu]);

  // 프로젝트 생성 핸들러
  const handleGenerate = (newProjectData: any) => {
  const newId = `p${Date.now()}`;
  const newProject = {
    id: newId,
    title: newProjectData.projectName || '새로운 프로젝트',
    status: 'processing',
    progress: 0,
    date: new Date().toLocaleDateString(),
    items: 0
  };

    // 1. 리스트에 추가
    setProjects([newProject, ...projects]);
    // 2. 라이브러리 화면으로 이동
    setActiveMenu('library');

    //시뮬레이션: 5초 뒤에 해당 프로젝트의 상태를 'completed'로 변경(디자인 테스트를 위한 임시용)
  setTimeout(() => {
    setProjects(currentProjects => 
      currentProjects.map(p => 
        p.id === newId 
          ? { ...p, status: 'completed', progress: 100, items: 15 } 
          : p
      )
    );
  }, 5000); // 5000ms = 5초
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

  // 3. 비로그인 및 비게스트 상태일 때 3D 메인 랜딩 페이지 표출
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
              {/* LoginPage 내부에 있는 원래 닫기 버튼이 onClose를 실행할 때 모달도 함께 닫히도록 함수 연결 */}
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
          <Library setActiveMenu={setActiveMenu} onSelectProject={(uuid) => setActiveProjectUuid(uuid)} />
        )}
        {activeMenu === 'processing' && <ProcessingView onComplete={() => setActiveMenu('library')} />}
        {activeMenu === 'detail' && <ProjectDetail projectUuid={activeProjectUuid} />}
        {activeMenu === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;