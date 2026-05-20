import React, { useState, useEffect } from 'react';
import { Cpu, Layout, HardDrive, Save, CheckCircle2, Sparkles, BrainCircuit, BotMessageSquare, Bell, Trash2 } from 'lucide-react';
import { userService } from '../services/userService';

// 공급자(provider) 기준 아이콘 맵핑 테이블
const PROVIDER_META_MAP: { [key: string]: { icon: React.ReactNode } } = {
  'OpenAI': { icon: <Sparkles size={20} /> },
  'Anthropic': { icon: <BrainCircuit size={20} /> },
  'Google': { icon: <BotMessageSquare size={20} /> },
  'DeepSeek': { icon: <Sparkles size={20} /> },
  'Mistral AI': { icon: <Sparkles size={20} /> },
  'Meta': { icon: <Sparkles size={20} /> },
};

// 백엔드 응답 데이터 구조 정의 (provider 필드 추가)
interface LlmModelData {
  id: string;
  name: string;
  provider: string;
}

const Settings: React.FC = () => {
  // 정적 배열 대신 서버에서 받아올 동적 모델 리스트 상태 정의
  const [aiModels, setAiModels] = useState<LlmModelData[]>([]);
  
  //서버에서 동적으로 가져오기 전까지 빈 상태
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  const [userName, setUserName] = useState(localStorage.getItem('aeranghae_user_name') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isModelSaving, setIsModelSaving] = useState(false);

  //개인 저장소 용량 상태 및 로딩 상태
  const [storageUsageBytes, setStorageUsageBytes] = useState<number>(0);
  const [isStorageLoading, setIsStorageLoading] = useState<boolean>(false);

  // 바이트 단위를 읽기 좋은 포맷(KB, MB, GB)으로 가공하는 유틸 함수
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fetchLlmModels = async () => {
    try {
      // 1. 사용 가능한 LLM 전체 리스트 조회
      const response = await userService.getLlmModelList();
      console.log("백엔드가 리턴한 LLM 모델 리스트 원본 데이터:", response);

      let rawList: any[] = [];
      if (Array.isArray(response)) {
        rawList = response;
      } else if (response && Array.isArray(response.data)) {
        rawList = response.data;
      } else if (response && Array.isArray(response.list)) {
        rawList = response.list;
      }

      const sanitizedModels = rawList.map((item: any) => {
        if (typeof item === 'string') {
          return { id: item, name: item.toUpperCase(), provider: 'AI System' };
        }
        const id = item.id || item.modelId || item.value || item.modelName || '';
        const name = item.name || item.modelName || item.label || id;
        const provider = item.provider || 'AI System';
        
        return { id, name, provider };
      }).filter(model => model.id !== '');

      if (sanitizedModels.length > 0) {
        setAiModels(sanitizedModels);
      } else {
        throw new Error("정상적인 데이터 형식이 감지되지 않았습니다.");
      }

      // 2. 내 정보조회(/api/user/me)를 연달아 호출해서 유저가 설정해둔 기존 디폴트 모델 파싱
      try {
        const userInfo = await userService.getUserInfo();
        console.log("📢 새로고침 후 유저 정보 내 모델 데이터 추적:", userInfo);
        
        // 다양한 응답 구조에 대비해 후보군을 모두 체크
        const userDefaultModel =
          userInfo?.model ||
          userInfo?.defaultModel ||
          userInfo?.data?.model ||
          userInfo?.data?.defaultModel;
        
        if (userDefaultModel) {
          console.log("매핑 성공한 디폴트 모델:", userDefaultModel);
          setActiveModelId(userDefaultModel);
          setSelectedModelId(userDefaultModel);
        } else {
          // 데이터가 없거나 꼬였을 때의 안전장치
          const fallbackId = sanitizedModels[0]?.id || 'gpt-4o';
          setActiveModelId(fallbackId);
          setSelectedModelId(fallbackId);
        }
      } catch (userError) {
        console.error("유저 정보에서 기본 모델 조회 실패, gpt-4o 디폴트 처리:", userError);
        setActiveModelId('gpt-4o');
        setSelectedModelId('gpt-4o');
      }

    } catch (error) {
      console.error("LLM 모델 리스트 로딩 실패, 안전용 로컬 백업 구동:", error);
      setAiModels([
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5', provider: 'Anthropic' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' }
      ]);
      setActiveModelId('gpt-4o');
      setSelectedModelId('gpt-4o');
    }
  };

  // 서비스에서 용량을 가져와 상태에 매핑하는 함수
  const formatStorageUsage = async () => {
    setIsStorageLoading(true);
    try {
      const data = await userService.getStorageUsage();
      const bytes = data && typeof data.usageBytes === 'number' ? data.usageBytes : 0;
      setStorageUsageBytes(bytes);
    } catch (error) {
      console.error("화면 저장소 데이터 갱신 실패:", error);
    } finally {
      setIsStorageLoading(false);
    }
  };

  // 컴포넌트 로드 시 자동으로 용량 조회 및 모델 리스트 조회 실행
  useEffect(() => {
    fetchLlmModels(); 
    formatStorageUsage();
  }, []);

  // 개별 모델 적용 버튼을 눌렀을 때 동작할 함수
  const handleApplyModel = async (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('aeranghae_token');
    if (!token) return alert("로그인이 필요한 기능입니다.");

    setIsModelSaving(true);
    try {
      await userService.setDefaultLlmModel(modelId);
      
      // 서버 정합성 확보를 위해 저장 후 유저 정보를 재조회해 실제 적용된 모델 ID를 반영
      const userInfo = await userService.getUserInfo();
      const appliedModel =
        userInfo?.model ||
        userInfo?.defaultModel ||
        userInfo?.data?.model ||
        userInfo?.data?.defaultModel ||
        modelId; // 못 읽으면 그래도 사용자가 누른 값 반영
      
      setActiveModelId(appliedModel);
      setSelectedModelId(appliedModel);
      alert(`AI 엔진이 ${appliedModel}(으)로 변경되었습니다. `);
    } catch (error: any) {
      console.error("모델 변경 실패:", error);
      alert("모델 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsModelSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    const token = localStorage.getItem('aeranghae_token');
    if (!token) return alert("로그인이 필요한 기능입니다.");
    if (!userName.trim()) return alert("닉네임을 입력해주세요.");

    setIsSaving(true);
    try {
      await userService.updateNickname(userName);
      const resData = await userService.getUserInfo();
      console.log("백엔드가 돌려준 /api/user/me 원본 데이터:", resData);

      const updatedName = resData?.name || resData?.nickname || resData?.data?.name || resData?.data?.nickname;
      
      if (updatedName) {
        localStorage.setItem('aeranghae_user_name', updatedName);
        setUserName(updatedName);
        window.dispatchEvent(new Event('user-name-changed'));
        alert("설정이 저장되었습니다.");
      } else {
        console.warn("백엔드 응답 데이터 구조에 name이나 nickname 필드가 없습니다.");
        alert("서버에 저장은 되었으나, 최신 닉네임 정보를 불러오지 못했습니다. 새로고침을 시도해 주세요.");
      }
    } catch (error: any) {
      console.error("설정 저장 중 진짜 에러 발생:", error);
      if (error.response) {
        console.error("서버가 응답한 에러 데이터:", error.response.data);
        alert(`변경에 실패했습니다: ${error.response.data?.message || '서버 오류'}`);
      } else {
        console.error("코드 실행 중 예기치 못한 에러:", error.message);
        alert(`오류 발생: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-700 font-sans text-white pb-6">
      
      <header className="mb-8 shrink-0">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-blue-600">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">시스템 환경 및 사용자 프로필을 관리합니다.</p>
      </header>

      <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
        
        {/* AI 엔진 섹션 (동적 모델 루프 구현 구역) */}
        <section className="bg-white/5 border border-white/10 rounded-[32px] p-6 shrink-0">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4">
            <Cpu size={20} className="text-purple-400" /> AI Engine
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {aiModels.map((model) => {
              const isSelected = selectedModelId === model.id;
              const isActive = activeModelId === model.id;
              
              // 공급자 기준 메타 데이터 추출 (없을 경우 기본 아이콘 폴백)
              const meta = PROVIDER_META_MAP[model.provider] || { icon: <Sparkles size={20} /> };

              return (
                <div 
                  key={model.id} 
                  onClick={() => setSelectedModelId(model.id)} 
                  className={`flex flex-col justify-between p-5 rounded-[26px] border transition-all h-[135px] cursor-pointer relative ${
                    isActive 
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.15)]' 
                    : isSelected 
                    ? 'bg-white/5 border-white/20' 
                    : 'bg-black/20 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{model.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{model.provider}</p>
                    </div>
                  </div>

                  {/* 우측 상단 상태 체크 아이콘 (진짜 활성화일때만 출력) */}
                  {isActive && (
                    <span className="absolute top-5 right-5 text-blue-400 flex items-center gap-1 text-[10px] bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      Active
                    </span>
                  )}

                  {/* 하단 개별 제어 버튼 구역 */}
                  <div className="flex justify-end items-center mt-2 h-8">
                    {isActive ? (
                      <span className="text-[11px] text-blue-400 font-bold flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                        <CheckCircle2 size={12} /> 현재 사용 중
                      </span>
                    ) : isSelected ? (
                      <button
                        onClick={(e) => handleApplyModel(model.id, e)}
                        disabled={isModelSaving}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        {isModelSaving ? '적용 중...' : '적용하기'}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 하단 2열 배치 섹션 (유저 프로필 & 메인터넌스) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
          <section className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <Layout size={20} className="text-blue-400" /> User Profile
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-wider">Nickname</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-gray-600" 
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 bg-black/20 rounded-xl opacity-50 select-none">
                  <span className="text-xs text-gray-300 ml-1 flex items-center gap-2">
                    <Bell size={14}/> Sound Alerts
                  </span>
                  <div className="w-8 h-4 bg-gray-600 rounded-full relative">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white/50 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px]">
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <HardDrive size={20} className="text-orange-400" /> Maintenance
            </h3>
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {isStorageLoading ? 'Loading...' : formatBytes(storageUsageBytes)}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">AI Storage Usage</p>
              </div>
              <button className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white border border-red-500/10 transition-all shadow-md">
                <Trash2 size={18} />
              </button>
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-6 shrink-0 pt-4 border-t border-white/5 flex justify-end">
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`w-full sm:w-56 py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
            isSaving 
            ? 'bg-gray-700 cursor-not-allowed opacity-50' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-600/20'
          }`}
        >
          <Save size={16} fill="currentColor" />
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </footer>

    </div>
  );
};

export default Settings;