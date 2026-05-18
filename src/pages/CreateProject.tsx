import React, { useState } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, Check, 
  Info, FileText, ShieldCheck, RefreshCw, AlertCircle, History,
  Terminal, BookOpen, Layers, Cpu, Layout
} from 'lucide-react';
import { projectService, ProjectCreateRequestDto } from '../services/projectService';
import SpotlightCardGroup, { SpotlightCardData } from '../components/SpotlightCardGroup';
import GenerateButton from '../components/GenerateButton';

interface CreateProjectProps {
  onGenerate: (data: any) => void;
}

// llm 도메인 모델에 맞춘 상세 분석 결과 타입
interface AnalysisVersion {
  one_line_summary: string;           // 아이디어 한줄 요약
  primary_actions: string[];          // 핵심 동작들
  core_features: { name: string; description: string }[]; // 핵심 기능
  user_constraints?: string;          // 제약사항 (선택적)
  external_integration?: string;      // 외부 연동 (선택적)
  app_form: { value: string; isInferred: boolean; reasoning?: string }; // 프로그램 형태
  programming_language: { value: string; isInferred: boolean; reasoning?: string }; // 프로그래밍 언어
  recommended_stack: { name: string; reason: string; type: string }[]; // AI 추천 스택 (DB 제외)
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
    prompt: '',
    analysisHistory: [] as AnalysisVersion[],
    selectedHistoryIdx: -1,
    finalAnalysis: null as AnalysisVersion | null,
    license: 'MIT',
  });

  //백엔드 POST 요청 핸들러
  const handleGenerateProject = async () => {
    if (!formData.finalAnalysis) return alert("요구사항 분석을 먼저 완료해주세요!");

    setIsGenerating(true);
    
    let mappedLicense = formData.license.toUpperCase();
    if (mappedLicense === 'APACHE 2.0') mappedLicense = 'APACHE-2.0';
    if (mappedLicense === 'GPL 3.0') mappedLicense = 'GPL-3.0';
    if (mappedLicense === 'BSD 2-CLAUSE') mappedLicense = 'BSD-2-CLAUSE';
    if (mappedLicense === 'BSD 3-CLAUSE') mappedLicense = 'BSD-3-CLAUSE';
    if (mappedLicense === 'NONE (라이선스 없음)') mappedLicense = 'NONE';

    //DTO 규격 매핑
    const requestDto: ProjectCreateRequestDto = {
      projectName: formData.projectName || "SpringBoot_Test",
      framework: "spring-boot", 
      language: "Java",
      license: mappedLicense,
      model: "gemini-1.5-pro", // 협의된 모델명
      prompt: formData.prompt
    };

    try {
      // 서버로 전송
      const result = await projectService.generateProject(requestDto);
      onGenerate(result); 
      alert("프로젝트 생성이 성공적으로 요청되었습니다!");
    } catch (error) {
      console.error("전송 에러:", error);
      alert("서버 통신 중 오류가 발생했습니다. 주소나 네트워크 설정을 확인해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const stackGuides: { [key: string]: string } = {
    'React': '가장 대중적인 UI 라이브러리입니다. 풍부한 생태계와 컴포넌트 재사용성이 강점입니다.',
    'Next.js': 'React 기반 프레임워크로, 서버 사이드 렌더링(SSR)과 SEO 최적화에 특화되어 있습니다.',
    'Spring Boot': '안정적이고 확장성이 뛰어난 Java 기반 프레임워크입니다. 복잡한 비즈니스 로직 처리에 좋습니다.',
    'Node.js': 'JavaScript를 사용하여 빠른 개발 속도와 높은 확장성을 가진 서버 환경을 제공합니다.',
    'React Native': '하나의 코드로 iOS와 Android 앱을 동시에 개발할 수 있는 모바일 프레임워크입니다.'
  };

  const handleAnalyze = async () => {
    if (!formData.prompt.trim()) return alert("프롬프트를 입력해주세요.");
    
    setIsAnalyzing(true);
    setTimeout(() => {
      // 명시적 언어 확인 로직 예시
      const hasExplicitLang = formData.prompt.includes("Java") || formData.prompt.includes("Python") || formData.prompt.includes("TypeScript");
      const hasConstraint = formData.prompt.includes("로컬") || formData.prompt.includes("보안");
      const hasIntegration = formData.prompt.includes("연동") || formData.prompt.includes("API");

      const newVersion: AnalysisVersion = {
        one_line_summary: "시니어 반려견 건강 데이터 동기화 및 가족 공동 케어 시스템",
        primary_actions: ["일일 건강 수치 기록", "복약 시간 알림 발송", "이상 데이터 AI 탐지"],
        core_features: [
          { name: "실시간 동기화", description: "가족 구성원 간 실시간 데이터 업데이트" },
          { name: "지능형 리포트", description: "활동량 변화에 따른 건강 상태 리포트 생성" }
        ],
        // 사용자가 직접 명시했을 때만 데이터 주입
        user_constraints: hasConstraint ? "데이터 보안을 위해 로컬 스토리지 우선 활용" : undefined,
        external_integration: hasIntegration ? "공공 유기견 데이터베이스 오픈 API 연동" : undefined,
        
        // 프로그램 형태 (추론 근거 포함)
        app_form: { 
          value: "Cross-platform Mobile App", 
          isInferred: true, 
          reasoning: "실시간 알림과 일상적인 기록이 핵심이므로 모바일 접근성이 필수적입니다." 
        },
        // 프로그래밍 언어 (사용자 명시 여부에 따른 근거 포함)
        programming_language: { 
          value: hasExplicitLang ? "User Defined" : "TypeScript", 
          isInferred: !hasExplicitLang,
          reasoning: !hasExplicitLang ? "데이터 무결성과 유지보수 편의를 위해 정적 타입 언어를 추천합니다." : undefined
        },
        //2단계용 추천 스택 (데이터베이스 제외)
        recommended_stack: [
          { name: 'React Native', reason: '멀티 플랫폼 대응을 위한 최적의 UI 프레임워크', type: 'Frontend' },
          { name: 'Node.js', reason: '비동기 이벤트 처리를 통한 빠른 알림 서비스 구현', type: 'Backend' }
        ],
        prompt: formData.prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setFormData(prev => ({
        ...prev,
        analysisHistory: [newVersion, ...prev.analysisHistory],
        selectedHistoryIdx: 0,
      }));
      setIsAnalyzing(false);
      setShowStackGuide(false);
    }, 1200);
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        const currentAnalysis = formData.analysisHistory[formData.selectedHistoryIdx];
        return (
          <div className="flex gap-8 h-full animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex-[1.2] flex flex-col gap-6">
              <div>
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] ml-1">Project Name</label>
                <input 
                  type="text" 
                  value={formData.projectName}
                  onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:border-blue-500 transition-all font-medium" 
                  placeholder="프로젝트 이름을 입력하세요" 
                />
              </div>
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
                  placeholder="아이디어를 적으세요. 가이드를 참고하면 더 정확한 분석이 가능합니다."
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
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">이 정보를 참고하여 프롬프트의 기술 섹션을 작성해 보세요.</p>
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
                        {/* 1. 아이디어 요약 */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-blue-500 font-black uppercase mb-2 tracking-widest">Summary</p>
                          <p className="text-sm font-bold text-white leading-snug italic">"{currentAnalysis.one_line_summary}"</p>
                        </div>

                        {/* 2. 핵심 동작 & 기능 */}
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

                        {/* 3. 제약사항 & 외부연동 (조건부 노출) */}
                        {(currentAnalysis.user_constraints || currentAnalysis.external_integration) && (
                          <div className="space-y-4 pt-4 border-t border-white/5">
                             {currentAnalysis.user_constraints && (
                               <div>
                                  <p className="text-[10px] text-orange-400 font-bold uppercase mb-1.5">User Constraints</p>
                                  <p className="text-xs text-gray-400 bg-orange-400/5 p-3 rounded-xl border border-orange-500/10 italic">"{currentAnalysis.user_constraints}"</p>
                               </div>
                             )}
                             {currentAnalysis.external_integration && (
                               <div>
                                  <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1.5">External Integration</p>
                                  <p className="text-xs text-gray-400 bg-emerald-400/5 p-3 rounded-xl border border-emerald-500/10 italic">"{currentAnalysis.external_integration}"</p>
                               </div>
                             )}
                          </div>
                        )}

                        {/* 4. 프로그램 형태 및 언어 (추론 근거 포함) */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                 <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase tracking-widest">System Form</p>
                                 <p className="text-xs font-bold text-white uppercase">{currentAnalysis.app_form.value}</p>
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                 <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Language</p>
                                 <p className="text-xs font-bold text-blue-400 uppercase">{currentAnalysis.programming_language.value}</p>
                              </div>
                           </div>
                           {/* AI 분석 근거 표시 */}
                           {(currentAnalysis.app_form.isInferred || currentAnalysis.programming_language.isInferred) && (
                             <div className="p-4 bg-blue-900/10 rounded-2xl border border-blue-500/10">
                               <p className="text-[10px] text-blue-400 font-black mb-2 uppercase flex items-center gap-1"><Sparkles size={12}/> AI Analysis Reasoning</p>
                               <div className="space-y-2">
                                  {currentAnalysis.app_form.isInferred && <p className="text-[10px] text-gray-500 italic leading-relaxed">● [형태] {currentAnalysis.app_form.reasoning}</p>}
                                  {currentAnalysis.programming_language.isInferred && <p className="text-[10px] text-gray-500 italic leading-relaxed">● [언어] {currentAnalysis.programming_language.reasoning}</p>}
                               </div>
                             </div>
                           )}
                        </div>

                        <button 
                          onClick={() => setFormData({...formData, finalAnalysis: currentAnalysis})}
                          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${formData.finalAnalysis === currentAnalysis ? 'bg-emerald-600 text-white shadow-lg' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}
                        >
                          {formData.finalAnalysis === currentAnalysis ? <><Check size={18}/> 확정된 분석 버전</> : '이 버전 사용하기'}
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pt-20"><AlertCircle size={40} className="mb-3" /><p className="text-xs leading-relaxed">프롬프트를 분석하면 전문적인<br/>설계 명세서가 작성됩니다.</p></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        const stackCards: SpotlightCardData[] = (formData.finalAnalysis?.recommended_stack || []).map((stack, i) => ({
          id: `stack-${i}`,
          hue: stack.type === 'Frontend' ? 190 : 160,
          saturation: 85,
          lightness: 55,
          content: (
            <div className="p-12 flex flex-col items-center text-center h-full relative group">
              <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-500/30 uppercase tracking-[0.3em]">
                {stack.type}
              </div>
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[28px] flex items-center justify-center text-emerald-400 mb-8 mt-6 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                {stack.type === 'Frontend' ? <Layout size={36} /> : <Cpu size={36} />}
              </div>
              <h4 className="text-2xl font-black mb-3 tracking-tighter italic uppercase">{stack.name}</h4>
              <p className="text-xs text-gray-500 leading-relaxed italic px-4">"{stack.reason}"</p>
            </div>
          ),
        }));

        return (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
            {/* 상단 헤더 - 마진 축소 */}
            <div className="mb-45 text-center shrink-0">
              <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">AI Recommended Frameworks</h3>
              <p className="text-gray-400 text-xs italic font-medium">AI가 추천하는 핵심 프레임워크 리스트입니다.</p>
            </div>
            
            {/*중앙 카드 영역 - flex-1로 가운데 차지 */}
            <div className="flex-1 flex items-center justify-center max-w-5xl mx-auto w-full min-h-0">
              <SpotlightCardGroup cards={stackCards} />
            </div>

            {/*하단 안내 박스 - 마진 축소 + 버튼과 겹치지 않게 조정 */}
            <div className="mt-45.5 mb-2 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-4 flex items-center gap-4 max-w-5xl mx-auto w-full shrink-0">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
                <Info size={10}/>
              </div>
              <p className="text-[13px] text-gray-400 leading-relaxed font-medium">위 조합은 프로젝트의 기획 의도와 데이터 흐름에 최적화된 프레임워크입니다.</p>
            </div>
          </div>
        );

      case 3:
        const licenseList = [
          'MIT', 
          'Apache 2.0', 
          'GPL 3.0', 
          'BSD 2-Clause', 
          'BSD 3-Clause', 
          'ISC', 
          'None (라이선스 없음)'
        ];

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
                  <span className="font-bold text-sm">{lic} {lic.includes('None') ? '' : 'License'}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.license === lic ? 'border-orange-500' : 'border-white/20'}`}>
                    {formData.license === lic && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="w-80 bg-orange-600/5 border border-orange-500/20 rounded-[32px] p-6 shrink-0">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4"><ShieldCheck size={18} className="text-orange-400" /> License Detail</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                오픈소스 프로젝트로서의 법적 권한을 설정합니다.
              </p>
              <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-[11px] text-gray-500 leading-relaxed">
                현재 선택: <strong className="text-orange-400 font-black">{formData.license}</strong>
                <p className="mt-2">이 설정은 백엔드의 라이선스 공장 인프라와 100% 맵핑되어 동기화됩니다.</p>
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
              <div className="grid grid-cols-2 gap-10 mb-10">
                <div className="space-y-6 text-sm">
                  <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Project Identity</p><p className="text-xl font-bold">{formData.projectName || 'New Project'}</p></div>
                  <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Built-in Frameworks</p>
                    <div className="flex gap-2 mt-2">
                        {formData.finalAnalysis?.recommended_stack.map((s, idx) => <div key={idx} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] font-bold text-emerald-400">#{s.name}</div>)}
                    </div>
                  </div>
                </div>
                <div className="space-y-6 text-sm">
                  <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Legal Policy</p><p className="text-xl font-bold text-orange-400">{formData.license}</p></div>
                  <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Build ID</p><p className="text-xs font-mono text-gray-600 uppercase tracking-tighter italic opacity-40">#AER-{Math.floor(Math.random()*10000)}-STABLE</p></div>
                </div>
              </div>
              <div className="pt-8 border-t border-white/5">
                 <p className="text-[10px] text-blue-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2"><Sparkles size={14}/> 확정된 시스템 아키텍처 명세</p>
                 <div className="grid grid-cols-2 gap-3">
                    {formData.finalAnalysis?.primary_actions.map((act, i) => (
                      <div key={i} className="flex gap-3 text-xs text-gray-300 bg-white/5 p-4 rounded-2xl border border-white/5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" /> {act}</div>
                    ))}
                 </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mb-2 font-medium italic opacity-50 uppercase tracking-widest">System environment ready for construction.</p>
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
          <p className="text-gray-400 text-sm ml-1 font-medium italic opacity-70">AI-Powered System Design Engine v4.0</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1.5">
            {[1,2,3,4].map(n => <div key={n} className={`w-10 h-1.5 rounded-full transition-all duration-500 ${step >= n ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-white/10'}`} />)}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">STEP {step}</span>
        </div>
      </header>

      <div className="flex-1 min-h-0 bg-[#242426]/50 border border-white/10 rounded-[56px] p-10 relative shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="h-full pb-20 relative z-10">
          {renderContent()}
        </div>

        <div className="absolute bottom-4 left-12 right-12 flex justify-between items-center z-20">
          <button 
            onClick={() => setStep(s => Math.max(1, s-1))} 
            className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 border border-white/5 ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <ChevronLeft size={22} /> BACK
          </button>
          
          <div className="flex gap-5">
            {step < 4 ? (
              <button 
                onClick={() => setStep(s => Math.min(4, s+1))}
                disabled={step === 1 && !formData.finalAnalysis}
                className={`px-10 py-4 rounded-2xl font-black text-sm tracking-widest transition-all shadow-2xl flex items-center gap-4 active:scale-95 ${
                  (step === 1 && !formData.finalAnalysis)
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-white/5' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40'
                }`}
              >
                NEXT STEP <ChevronRight size={22} />
              </button>
            ) : (
              <>
                <GenerateButton 
                  onClick={handleGenerateProject}
                  disabled={isGenerating}
                >
                  {isGenerating ? "GENERATING..." : "Generate Project"}
                </GenerateButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;