import React, { useState } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, Check, 
  Info, FileText, ShieldCheck, RefreshCw, AlertCircle, History,
  Terminal, BookOpen, Layers, Server, Globe
} from 'lucide-react';
import { projectService, ProjectCreateRequestDto } from '../services/projectService';
import SpotlightCardGroup, { SpotlightCardData } from '../components/SpotlightCardGroup';
import GenerateButton from '../components/GenerateButton';

interface CreateProjectProps {
  onGenerate: (data: any) => void;
}

interface AnalysisVersion {
  one_line_summary: string;
  primary_actions: string[];
  core_features: { name: string; description: string }[];
  user_constraints?: string;
  external_integration?: string;
  architecture_type: 'FULL_STACK' | 'CLIENT_SERVER';
  app_form: { value: string; isInferred: boolean; reasoning?: string };
  programming_language: { value: string; isInferred: boolean; reasoning?: string };
  recommended_stack: {
    unified?: { name: string; reason: string }; 
    backend?: { name: string; reason: string };
    frontend?: { name: string; reason: string };
  };
  prompt: string;
  timestamp: string;
}

const CreateProject: React.FC<CreateProjectProps> = ({ onGenerate }) => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStackGuide, setShowStackGuide] = useState(false);
  const [selectedGuideStack, setSelectedGuideStack] = useState('React');

  const [formData, setFormData] = useState({
    projectName: '',
    artifact: 'autostudio',
    prompt: '',
    analysisHistory: [] as AnalysisVersion[],
    selectedHistoryIdx: -1,
    finalAnalysis: null as AnalysisVersion | null,
    license: 'MIT',
  });

  const licenseGuideTexts: { [key: string]: string } = {
    'MIT': '가장 직관적이고 제약이 없는 오픈소스 양식입니다. 누구나 자유롭게 코드를 복제, 수정, 배포, 상업적 이용을 할 수 있으며 소스코드 공개 의무도 존재하지 않습니다. 원저작권 고지 조항만 유지하면 모든 행위가 법적으로 허용됩니다.',
    'Apache 2.0': 'MIT의 장점에 더해 특허권 라이선스 허용 및 특허 침해 소송에 대한 방어 조항이 명시되어 있습니다. 기업 환경 및 대규모 협업 프로젝트에서 법적 안전장치로 매우 선호하는 강력하고 안전한 계약 규격입니다.',
    'GPL 3.0': '강한 전염성을 가진 강력한 카피레프트(Copyleft) 라이선스입니다. 이 코드를 수정하거나 결합하여 배포하는 파생 소프트웨어는 상업적 목적이라 하더라도 무조건 전체 소스코드를 대중에게 투명하게 무상 공개해야 합니다.',
    'BSD 2-Clause': '수정과 배포가 극도로 자유로운 미니멀한 규격입니다. 소스코드 공개 의무가 전혀 없으며, 소프트웨어를 재배포할 때 원 저작권자가 명시한 저작권 고지문과 면책조항만 코드 내에 누락 없이 포함시키면 됩니다.',
    'None': '오픈소스 규칙을 배포 규격에 명시하지 않은 독점적 저작권 상태입니다. 타인이 본 소스코드를 무단 복제, 배포, 변경하는 모든 행위가 법적으로 전면 제한되며 오직 작성자 본인에게만 독점권이 부여됩니다.'
  };

  const licenseSpecs: { [key: string]: { allow: string[]; restrict: string[] } } = {
    'MIT': { allow: ['상업적 이용 가능', '코드 수정 및 배포', '비공개 프로젝트 적용'], restrict: ['원저작권 고지 유지 필수'] },
    'Apache 2.0': { allow: ['상업적 이용 가능', '코드 수정 및 배포', '특허 라이선스 전면 허용'], restrict: ['수정 파일 변경 고지 필수'] },
    'GPL 3.0': { allow: ['상업적 이용 가능', '복제 및 배포 가능'], restrict: ['파생 코드 전체 공개 필수', '동일 라이선스 강제'] },
    'BSD 2-Clause': { allow: ['상업적 이용 가능', '코드 수정 및 배포', '독점 소프트웨어 결합'], restrict: ['저작권 및 면책고지 유지'] },
    'None': { allow: ['개인적 열람 및 확인'], restrict: ['무단 복제/배포 금지', '상업적 활용 불가', '파생 저작물 작성 제한'] }
  };

  const frameworkIdMap: { [key: string]: string } = {
    'React': 'react', 'Vue': 'vue', 'FastAPI': 'fastapi', 'Next.js': 'nextjs', 'NestJS': 'nestjs', 'Spring Boot': 'spring-boot',
  };

  const toFrameworkId = (name?: string): string => {
    if (!name) return "";
    return frameworkIdMap[name] || name.toLowerCase().replace(/[\s.]/g, '');
  };

  const handleGenerateProject = async () => {
    if (!formData.finalAnalysis) return alert("요구사항 분석을 먼저 완료해주세요!");
    if (!formData.artifact.trim()) return alert("Artifact 이름을 입력해주세요!");

    setIsGenerating(true);

    let mappedLicense = formData.license.toUpperCase();
    if (mappedLicense === 'APACHE 2.0') mappedLicense = 'APACHE-2.0';
    if (mappedLicense === 'GPL 3.0') mappedLicense = 'GPL-3.0';
    if (mappedLicense === 'BSD 2-CLAUSE') mappedLicense = 'BSD-2-CLAUSE';
    if (mappedLicense === 'BSD 3-CLAUSE') mappedLicense = 'BSD-3-CLAUSE';
    if (mappedLicense === 'NONE (라이선스 없음)') mappedLicense = 'NONE';

    const stack = formData.finalAnalysis.recommended_stack;
    const fullstackFw = toFrameworkId(stack.unified?.name);
    const backendFw   = toFrameworkId(stack.backend?.name);
    const frontendFw  = toFrameworkId(stack.frontend?.name);

    const hasBoth = !!backendFw && !!frontendFw;
    const hasOne  = (!!backendFw || !!frontendFw) && !hasBoth;
    const archType: string = (fullstackFw || hasBoth) ? 'FULL_STACK' : (hasOne ? 'CLIENT_SERVER' : 'FULL_STACK');

    const requestDto: ProjectCreateRequestDto = {
      projectName: formData.projectName || "New_Project",
      artifact: formData.artifact, 
      architecture_type: archType,
      fullstack_framework: fullstackFw,
      fullstack_language: fullstackFw ? formData.finalAnalysis.programming_language.value : "",
      backend_framework: backendFw,
      frontend_framework: frontendFw,
      backend_language: backendFw ? "python" : "",
      frontend_language: frontendFw ? "typescript" : "",
      database: "SQLite",
      license: mappedLicense,
      model: "gemini-1.5-flash",
      prompt: formData.prompt,
    };

    console.log("=== 전송 요청 객체 ===", JSON.stringify(requestDto, null, 2));

    try {
      const result = await projectService.generateProject(requestDto);
      onGenerate(result); 
      alert("프로젝트 생성이 성공적으로 요청되었습니다!");
    } catch (error: any) {
      console.error("전송 에러:", error);
      if (error?.response?.status === 429) {
        alert("요청이 일시적으로 제한되었습니다 (429).\n잠시 후 다시 시도해주세요.");
      } else {
        alert("서버 통신 중 오류가 발생했습니다. 주소나 네트워크 설정을 확인해주세요.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const stackGuides: { [key: string]: string } = {
    'React': '가장 대중적인 UI 라이브러리입니다. 풍부한 생태계와 컴포넌트 재사용성이 강점입니다.',
    'Next.js': 'React 기반 프레임워크로, 서버 사이드 렌더링(SSR)과 SEO 최적화에 특화되어 있습니다.',
    'Spring Boot': '안정적이고 확장성이 뛰어난 Java 기반 프레임워크입니다. 복잡한 비즈니스 로직 처리에 좋습니다.',
    'FastAPI': 'Python 기반의 현대적이고 빠른 웹 프레임워크로 비동기 처리에 강력합니다.'
  };

  const handleAnalyze = async () => {
    if (!formData.prompt.trim()) return alert("프롬프트를 입력해주세요.");

    setIsAnalyzing(true);
    try {
      const res = await projectService.analyzeProject(formData.prompt);

      const fw = res.framework || { unified: '', backend: '', frontend: '' };
      const lang = res.language || { unified: '', backend: '', frontend: '' };

      const recommended_stack: AnalysisVersion['recommended_stack'] = {};
      if (fw.unified)  recommended_stack.unified  = { name: fw.unified, reason: res.rationale };
      if (fw.backend)  recommended_stack.backend  = { name: fw.backend, reason: res.rationale };
      if (fw.frontend) recommended_stack.frontend = { name: fw.frontend, reason: res.rationale };

      const langValue = lang.unified || [lang.backend, lang.frontend].filter(Boolean).join(' / ') || '';

      const newVersion: AnalysisVersion = {
        one_line_summary: res.subject || res.projectDescription || '',
        primary_actions: res.coreFeatures || [],
        core_features: (res.coreFeatures || []).map(f => ({ name: f, description: '' })),
        user_constraints: (res.constraints || []).join(', '),
        architecture_type: res.architectureType,
        app_form: {
          value: res.architectureType === 'FULL_STACK' ? 'Full Stack Web App' : 'Single Component',
          isInferred: true
        },
        programming_language: { value: langValue, isInferred: true },
        recommended_stack,
        prompt: formData.prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setFormData(prev => ({
        ...prev,
        analysisHistory: [newVersion, ...prev.analysisHistory],
        selectedHistoryIdx: 0,
      }));
      setShowStackGuide(false);
    } catch (error: any) {
      console.error("분석 에러:", error);
      if (error?.response?.status === 429) {
        alert("분석 요청이 일시적으로 제한되었습니다 (429).\n잠시 후 다시 시도해주세요.");
      } else {
        alert("요구사항 분석 중 오류가 발생했습니다. 서버 보안 응답 대기 중입니다.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        const currentAnalysis = formData.analysisHistory[formData.selectedHistoryIdx];
        return (
          <div className="flex gap-8 h-full animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex-[1.2] flex flex-col gap-6">
              
              {/* 인풋 영역 반반 분할 레이아웃 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] ml-1">Project Name</label>
                  <input 
                    type="text" 
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:border-blue-500 transition-all font-medium text-sm" 
                    placeholder="프로젝트명 입력" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] ml-1">Artifact (소문자/공백제거 자동)</label>
                  <input 
                    type="text" 
                    value={formData.artifact}
                    onChange={(e) => setFormData({...formData, artifact: e.target.value.toLowerCase().replace(/\s/g, '')})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:border-emerald-500 transition-all font-mono text-sm tracking-tight text-emerald-200" 
                    placeholder="예: autostudio" 
                  />
                </div>
              </div>

              {/* 🟢 [완벽 삭제]: 눈에 가시 같던 수동 가짜 Stack Mode 제어판(Grid 박스 구역) 통째로 영구 도려냄 */}

              <div className="flex-1 flex flex-col relative min-h-0">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <div className="flex gap-2">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] ml-1">Requirements Prompt</label>
                    <button 
                      onClick={() => setShowStackGuide(!showStackGuide)}
                      className={`text-[9px] flex items-center gap-1 px-2 py-0.5 rounded border font-bold transition-all ${showStackGuide ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'}`}
                    >
                      <BookOpen size={10}/> 기술 스택 가이드
                    </button>
                  </div>
                  <button 
                    onClick={() => setFormData({ 
                      ...formData, 
                      prompt: `[누가 사용하나요?]\n- \n\n[핵심 목적]\n- \n\n[가장 필요한 기능 설명]\n- ` 
                    })} 
                    className="text-[10px] bg-purple-600/20 text-purple-400 px-3 py-1.5 rounded-xl border border-purple-500/30 hover:bg-purple-600/30 font-bold transition-all"
                  >
                    가이드라인 불러오기
                  </button>
                </div>
                <textarea 
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 outline-none focus:border-purple-500 resize-none transition-all text-sm leading-relaxed custom-scrollbar shadow-inner" 
                  placeholder="아이디어를 입력하세요. 가이드를 참고하면 더 정확한 분석이 가능합니다."
                  value={formData.prompt}
                  onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                />
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="mt-4 w-full py-5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/10 rounded-2xl font-bold hover:from-blue-600/20 hover:to-purple-600/20 transition-all flex items-center justify-center gap-2 group shadow-xl"
                >
                  {isAnalyzing ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} className="text-purple-400" />}
                  {formData.analysisHistory.length > 0 ? '수정하여 재분석하기' : 'AI 요구사항 분석하기'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-blue-600/5 border border-blue-500/20 rounded-[32px] p-6 flex flex-col shadow-2xl overflow-hidden relative">
              {showStackGuide ? (
                <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-blue-400 mb-6"><Layers size={18}/> Stack Guide</h3>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {Object.keys(stackGuides).map(stack => (
                      <button 
                        key={stack} 
                        onClick={() => setSelectedGuideStack(stack)}
                        className={`p-3 rounded-xl text-[11px] font-bold border transition-all ${selectedGuideStack === stack ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                      >
                        {stack}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] text-blue-400 font-black uppercase mb-3 tracking-widest">{selectedGuideStack} Detail</p>
                    <p className="text-sm text-gray-300 leading-relaxed italic mb-4">"{stackGuides[selectedGuideStack]}"</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-blue-400"><History size={18} /> Analysis Spec</h3>
                    <div className="flex gap-1.5">
                      {formData.analysisHistory.slice(0, 3).map((_, idx) => (
                        <button key={idx} onClick={() => setFormData({...formData, selectedHistoryIdx: idx})} className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all ${formData.selectedHistoryIdx === idx ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}>V{formData.analysisHistory.length - idx}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-20">
                    {isAnalyzing ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50"><RefreshCw size={30} className="animate-spin text-blue-500" /><p className="text-xs">요구사항 모델링 중...</p></div>
                    ) : currentAnalysis ? (
                      <div className="animate-in fade-in slide-in-from-right-4 space-y-7">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-blue-500 font-black uppercase mb-2 tracking-widest">Summary</p>
                          <p className="text-sm font-bold text-white leading-snug italic">"{currentAnalysis.one_line_summary}"</p>
                        </div>
                        <div className="space-y-4">
                          <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2"><Terminal size={12}/> Architecture Detail</p>
                          <div className="space-y-2">
                             <p className="text-[10px] text-blue-300 font-bold ml-1">● 핵심 동작 및 기능</p>
                            {currentAnalysis.primary_actions.map((act, i) => (
                              <div key={i} className="text-[11px] text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                                <Check size={14} className="text-blue-500" /> {act}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-white/5">
                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                 <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Type</p>
                                 <p className="text-[10px] font-bold text-white uppercase">{currentAnalysis.architecture_type.replace('_', ' ')}</p>
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                 <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Language</p>
                                 <p className="text-[10px] font-bold text-blue-400 uppercase">{currentAnalysis.programming_language.value}</p>
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => setFormData({...formData, finalAnalysis: currentAnalysis})}
                          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${formData.finalAnalysis === currentAnalysis ? 'bg-emerald-600 text-white shadow-lg' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}
                        >
                          {formData.finalAnalysis === currentAnalysis ? <><Check size={18}/> 확정된 분석 버전</> : '이 버전 사용하기'}
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pt-20"><AlertCircle size={40} className="mb-3" /><p className="text-xs">프롬프트를 분석해 주세요.</p></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        const current = formData.finalAnalysis;
        const stackCards: SpotlightCardData[] = [];

        if (current) {
          if (current.architecture_type === 'FULL_STACK' && current.recommended_stack.unified) {
            stackCards.push({
              id: 'unified-stack',
              hue: 280, saturation: 70, lightness: 60,
              content: (
                <div className="p-12 flex flex-col items-center text-center h-[340px] relative group overflow-hidden">
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-purple-400 uppercase tracking-[0.3em]">Full Stack Architecture</div>
                  <div className="w-24 h-24 bg-purple-500/10 rounded-[32px] flex items-center justify-center text-purple-400 mb-6 mt-6 border border-purple-500/20 shrink-0">
                    <Sparkles size={44} />
                  </div>
                  <h4 className="text-3xl font-black mb-3 tracking-tighter italic uppercase text-white shrink-0">{current.recommended_stack.unified.name}</h4>
                  
                  <div className="flex-grow w-full overflow-y-auto custom-scrollbar px-2 text-left">
                    <p className="text-xs text-gray-500 leading-relaxed">"{current.recommended_stack.unified.reason}"</p>
                  </div>
                </div>
              ),
            });
          } else {
            if (current.recommended_stack.backend) {
              stackCards.push({
                id: 'backend-stack',
                hue: 210, saturation: 80, lightness: 55,
                content: (
                  <div className="p-10 flex flex-col items-center text-center h-[340px] relative overflow-hidden">
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Backend</div>
                    <div className="w-20 h-20 bg-blue-500/10 rounded-[28px] flex items-center justify-center text-blue-400 mb-6 mt-6 border border-blue-500/20 shrink-0">
                      <Server size={36} />
                    </div>
                    <h4 className="text-2xl font-black mb-2 italic uppercase text-white shrink-0">{current.recommended_stack.backend.name}</h4>
                    
                    <div className="flex-grow w-full overflow-y-auto custom-scrollbar px-2 text-left">
                      <p className="text-[11px] text-gray-500 leading-relaxed">"{current.recommended_stack.backend.reason}"</p>
                    </div>
                  </div>
                ),
              });
            }
            if (current.recommended_stack.frontend) {
              stackCards.push({
                id: 'frontend-stack',
                hue: 180, saturation: 80, lightness: 50,
                content: (
                  <div className="p-10 flex flex-col items-center text-center h-[340px] relative overflow-hidden">
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em]">Frontend</div>
                    <div className="w-20 h-20 bg-cyan-500/10 rounded-[28px] flex items-center justify-center text-cyan-400 mb-6 mt-6 border border-cyan-500/20 shrink-0">
                      <Globe size={36} />
                    </div>
                    <h4 className="text-2xl font-black mb-2 italic uppercase text-white shrink-0">{current.recommended_stack.frontend.name}</h4>
                    
                    <div className="flex-grow w-full overflow-y-auto custom-scrollbar px-2 text-left">
                      <p className="text-[11px] text-gray-500 leading-relaxed">"{current.recommended_stack.frontend.reason}"</p>
                    </div>
                  </div>
                ),
              });
            }
          }
        }

        return (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-45 text-center shrink-0">
              <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-2 ${current?.architecture_type === 'FULL_STACK' ? 'text-purple-400' : 'text-blue-400'}`}>
                {current?.architecture_type === 'FULL_STACK' ? 'Full Stack Recommendation' : 'Single Component Selection'}
              </h3>
              <p className="text-gray-400 text-xs italic font-medium">프로젝트 성격에 최적화된 아키텍처 스택입니다.</p>
            </div>
            
            <div className="flex-1 flex items-center justify-center max-w-5xl mx-auto w-full min-h-0">
              <SpotlightCardGroup cards={stackCards} />
            </div>

            <div className="mt-50 mb-0 bg-white/5 border border-white/5 rounded-3xl p-4 flex items-center gap-4 max-w-4xl mx-auto w-full shrink-0">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0"><Info size={14}/></div>
              <p className="text-[12px] text-gray-400 leading-relaxed font-medium">
                {current?.architecture_type === 'FULL_STACK' 
                  ? "백엔드와 프론트엔드가 모두 포함된 완전한 웹 애플리케이션 구조입니다." 
                  : "서버 또는 클라이언트 단일 컴포넌트로 구성된 독립 프로젝트입니다."}
              </p>
            </div>
          </div>
        );

      case 3:
        const licenseList = ['MIT', 'Apache 2.0', 'GPL 3.0', 'BSD 2-Clause', 'None'];
        const currentSpec = licenseSpecs[formData.license] || { allow: [], restrict: [] };

        return (
          <div className="flex gap-8 h-full animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest sticky top-0 bg-[#242426] pb-2 z-10">License Policy</h3>
              {licenseList.map(lic => (
                <button 
                  key={lic} 
                  onClick={() => setFormData({...formData, license: lic})} 
                  className={`w-full p-6 rounded-3xl border transition-all flex justify-between items-center ${formData.license === lic ? 'bg-orange-600/15 border-orange-500 shadow-lg' : 'bg-white/5 border-white/10'}`}
                >
                  <span className="font-bold text-sm">{lic} License</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.license === lic ? 'border-orange-500' : 'border-white/20'}`}>
                    {formData.license === lic && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="w-80 bg-orange-600/5 border border-orange-500/20 rounded-[32px] p-6 shrink-0 flex flex-col justify-between h-full max-h-[400px]">
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-orange-400"><ShieldCheck size={18} /> License Detail</h3>
                <p className="text-[13px] text-gray-300 leading-relaxed font-medium bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  {licenseGuideTexts[formData.license] || '프로젝트의 법적 권한을 설정합니다.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Permission Scope</p>
                <div className="space-y-1.5">
                  {currentSpec.allow.map((allowText, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1.5 rounded-xl border border-emerald-500/10">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full" /> {allowText}
                    </div>
                  ))}
                  {currentSpec.restrict.map((restrictText, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-amber-400 font-bold bg-amber-500/5 px-2.5 py-1.5 rounded-xl border border-amber-500/10">
                      <div className="w-1 h-1 bg-amber-400 rounded-full" /> {restrictText}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
             <div className="flex-1 bg-black/20 border border-white/5 rounded-[40px] p-10 overflow-y-auto mb-6 custom-scrollbar shadow-inner">
              <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-5 text-blue-400">
                <FileText size={28} />
                <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-4 decoration-blue-600">Final Build Report</h2>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6 text-sm">
                  <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Project Identity</p><p className="text-xl font-bold">{formData.projectName || 'New Project'}</p></div>
                  <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Build Artifact Target</p>
                    <p className="text-sm font-mono font-bold text-orange-400">{formData.artifact}</p>
                  </div>
                  <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Stack Architecture</p>
                    <p className="text-sm font-bold text-emerald-400 uppercase">{formData.finalAnalysis?.architecture_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="space-y-6 text-sm">
                  <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Legal Policy</p><p className="text-xl font-bold text-orange-400">{formData.license}</p></div>
                </div>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full px-6 py-4">
      <header className="mb-8 shrink-0 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
              <Sparkles size={26} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase text-white">Project Architect</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1.5">
            {[1,2,3,4].map(n => <div key={n} className={`w-10 h-1.5 rounded-full transition-all duration-500 ${step >= n ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-white/10'}`} />)}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">STEP {step}</span>
        </div>
      </header>

      <div className="flex-1 min-h-0 bg-[#242426]/50 border border-white/10 rounded-[56px] p-10 relative shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="h-full pb-20 relative z-10">
          {renderContent()}
        </div>

        <div className="absolute bottom-4 left-12 right-12 flex justify-between items-center z-20">
          <button onClick={() => setStep(s => Math.max(1, s-1))} className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 border border-white/5 ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}><ChevronLeft size={22} /> BACK</button>
          <div className="flex gap-5">
            {step < 4 ? (
              <button onClick={() => setStep(s => Math.min(4, s+1))} disabled={step === 1 && !formData.finalAnalysis} className={`px-10 py-4 rounded-2xl font-black text-sm tracking-widest transition-all shadow-2xl flex items-center gap-4 active:scale-95 ${(step === 1 && !formData.finalAnalysis) ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-white/5' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40'}`}>NEXT STEP <ChevronRight size={22} /></button>
            ) : (
              <GenerateButton onClick={handleGenerateProject} disabled={isGenerating}>{isGenerating ? "GENERATING..." : "Generate Project"}</GenerateButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;