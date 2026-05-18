import React, { useState, useEffect } from 'react';
import { Search, Folder, MoreVertical, Calendar, Download, RefreshCw, CheckCircle2, Trash2, Edit2, Cpu, DownloadCloud, AlertCircle } from 'lucide-react';
import { projectService, ProjectResponseDto } from '../services/projectService';
import { ProjectProgress } from '../App';

interface LibraryProps {
  onSelectProject?: (uuid: string) => void;
  generatingProjects?: { [uuid: string]: ProjectProgress }; 
}

const Library: React.FC<LibraryProps> = ({ onSelectProject, generatingProjects = {} }) => {
  const [projectsList, setProjectsList] = useState<ProjectResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectResponseDto | null>(null);
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null); 
  const [editTitleInput, setEditTitleInput] = useState<string>('');
  
  //중복 호출을 막고 재사용하기 위해 프로젝트 목록 가져오는 함수를 밖으로 분리
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await projectService.getProjects();
      setProjectsList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("라이브러리 목록 로드 실패:", error);
      alert("프로젝트 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  //프로젝트 ZIP 다운로드 실행 트리거
  const handleDownloadProject = async (uuid: string, projectName: string) => {
    if (uuid === 'design-guide-dummy-uuid') {
      alert("가이드용 더미 프로젝트는 다운로드할 수 없습니다.\n실제 완성된 프로젝트를 다운로드해 주세요.");
      return;
    }
    
    try {
      alert(`[${projectName}] 프로젝트 소스코드 압축 다운로드를 요청합니다.`);
      //console.log(`📡 [API 발사 예정] GET /(주소 정해지면 적기)`);
    } catch (error) {
      console.error("프로젝트 다운로드 중 에러 발생:", error);
      alert("다운로드 요청 중 오류가 발생했습니다.");
    }
  };

  //확장된 ProjectResponseDto 스펙에 맞춰 framework와 status 기본값 강제 매핑
  const buildDisplayList = (): ProjectResponseDto[] => {
    const dummyGeneratingCards: ProjectResponseDto[] = Object.values(generatingProjects).map(p => ({
      uuid: p.uuid, 
      projectName: `[API 설계용] 아키텍처 실시간 제작 프로세스 분석 창`,
      model: 'gemini-1.5-pro',
      framework: 'SPRING BOOT',
      status: 'GENERATING',    
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      size: 0,
      fileCount: 0,
    }));

    return [...dummyGeneratingCards, ...projectsList];
  };

  const handleProjectClick = (item: ProjectResponseDto) => {
    if (!item || !item.uuid || editingProjectId === item.uuid) return;

    if (onSelectProject) {
      onSelectProject(item.uuid);
    }
  };

  const handleStartEditUI = (item: ProjectResponseDto) => {
    if (!item || !item.uuid) return;
    setEditingProjectId(item.uuid);
    setEditTitleInput(item.projectName || '이름 없음');
    setActiveMenuId(null); 
  };

  const handleSaveTitleUI = async () => {
    if (!editingProjectId) return;
    if (!editTitleInput.trim()) {
      alert("변경할 이름을 입력해 주세요.");
      return;
    }

    try {
      setIsLoading(true); 
      await projectService.updateProjectName(editingProjectId, editTitleInput);
      setEditingProjectId(null);
      await fetchProjects();
    } catch (error) {
      alert("이름 변경 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeleteUI = async () => {
    if (!projectToDelete || !projectToDelete.uuid) return;

    try {
      setIsLoading(true); 
      await projectService.deleteProject(projectToDelete.uuid);
      setProjectToDelete(null);
      setActiveMenuId(null);
      await fetchProjects();
    } catch (error) {
      alert("프로젝트 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const displayList = buildDisplayList();

  return (
    <div className="flex flex-col h-full overflow-hidden relative text-white">
      <header className="flex justify-between items-center mb-8 shrink-0 relative z-10">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-blue-600">My Library</h1>
          <p className="text-gray-400 text-sm mt-1">생성 중인 프로젝트와 완성된 코드를 관리하세요.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 w-64 transition-all"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {isLoading && displayList.length === 1 ? ( 
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <RefreshCw className="animate-spin text-blue-500" size={40} />
            <p className="text-sm text-gray-400 font-medium">프로젝트 보관함을 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {displayList && displayList.length > 0 ? (
              displayList.map((item) => {
                if (!item || !item.uuid) return null;

                const currentUuid = item.uuid;
                const displayTitle = item.projectName || "이름 없는 프로젝트";
                
                const isGenerating = currentUuid === 'design-guide-dummy-uuid';
                const progress = generatingProjects[currentUuid];

                return (
                  <div 
                    key={currentUuid} 
                    onClick={() => handleProjectClick(item)}
                    className={`relative bg-[#1A1A1C] border transition-all cursor-pointer group shadow-xl rounded-[32px] p-6 hover:-translate-y-1
                      ${isGenerating 
                        ? 'border-blue-500/50 hover:border-blue-400 shadow-blue-600/10' 
                        : 'border-white/5 hover:border-white/20'
                      }`}
                  >
                    {isGenerating && (
                      <div className="absolute inset-0 rounded-[32px] pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse" />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-6 relative">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                        ${isGenerating 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-white/5 text-blue-400 group-hover:bg-blue-500 group-hover:text-white'
                        }`}
                      >
                        {isGenerating 
                          ? <Cpu size={24} className="animate-spin" style={{ animationDuration: '3s' }} /> 
                          : <Folder size={24} />
                        }
                      </div>
                      
                      {!isGenerating && (
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setActiveMenuId(activeMenuId === currentUuid ? null : currentUuid);
                            }}
                            className="p-1 rounded-lg hover:bg-white/5 text-gray-600 hover:text-white transition-all"
                          >
                            <MoreVertical size={20} />
                          </button>

                          {activeMenuId === currentUuid && (
                            <>
                              <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                              <div className="absolute right-0 mt-2 w-36 bg-[#242426] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleStartEditUI(item); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-white/5 rounded-xl transition-all mb-0.5"
                                >
                                  <Edit2 size={13} /> 이름 변경
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); handleDownloadProject(currentUuid, displayTitle); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all mb-0.5"
                                >
                                  <DownloadCloud size={13} /> 소스 다운로드
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setProjectToDelete(item); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                  <Trash2 size={13} /> 프로젝트 삭제
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 mb-1">
                      {editingProjectId === currentUuid ? (
                        <div className="flex gap-2 relative" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text"
                            value={editTitleInput}
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitleUI()}
                            autoFocus
                            className="flex-1 min-w-0 bg-black/30 border border-blue-500 rounded-xl px-3 py-1.5 text-base text-white focus:outline-none font-bold"
                          />
                          <button onClick={handleSaveTitleUI} className="bg-blue-600 hover:bg-blue-500 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0">저장</button>
                          <button onClick={() => setEditingProjectId(null)} className="bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all text-gray-400 shrink-0">취소</button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <h3 className="font-bold text-xl truncate relative">{displayTitle}</h3>
                          {/*프레임워크 배지 시각화 구역 */}
                          {!isGenerating && (
                            <div className="flex">
                              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-wider">
                                {item.framework || 'SPRING BOOT'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 상태값 동적 처리 구역 (COMPLETED / FAILED / GENERATING 방어 분기) */}
                    {isGenerating ? (
                      <p className="text-xs text-blue-400 mt-2 flex items-center gap-1.5 font-bold relative tracking-tight">
                        <RefreshCw size={12} className="animate-spin" /> 
                        Generating... {progress?.progress || 45}%
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 relative">
                        {item.status === 'FAILED' ? (
                          <><AlertCircle size={12} className="text-red-500" /> Generation Failed</>
                        ) : (
                          <><CheckCircle2 size={12} className="text-emerald-500" /> Generation Complete</>
                        )}
                      </p>
                    )}
                    
                    {isGenerating && (
                      <div className="mt-4 mb-1 relative">
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-[45%] relative" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 italic font-medium truncate">
                          {progress?.currentStep || '준비 중...'}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-6 mt-6 border-t border-white/5 font-bold uppercase tracking-tighter relative">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} /> 
                        {isGenerating ? 'BUILDING' : (item.createdAt && typeof item.createdAt === 'string' ? item.createdAt.substring(0, 10) : '2026-05-18')}
                      </div>
                      
                      {isGenerating ? (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Download size={12} /> {item.fileCount || 0} files
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleDownloadProject(currentUuid, displayTitle);
                          }}
                          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-500/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <Download size={12} className="animate-bounce" style={{ animationDuration: '2s' }} /> 
                          <span>Download ZIP</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[40px]">
                <p className="text-gray-500 font-bold">저장된 프로젝트가 없습니다.</p>
                <p className="text-xs text-gray-600 mt-2">새 프로젝트 생성을 시작해 보세요.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {projectToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] text-white">
          <div className="bg-[#242426] border border-white/10 w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">프로젝트 삭제</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              정말로 <span className="text-white font-bold">"{projectToDelete.projectName || '이름 없음'}"</span>을<br/>
              삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setProjectToDelete(null)} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-gray-400 transition-all">취소</button>
              <button onClick={handleConfirmDeleteUI} className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-red-600/20">삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;