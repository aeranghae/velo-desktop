import React, { useState } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, Check, 
  Info, FileText, ShieldCheck, RefreshCw, AlertCircle, History,
  Terminal, BookOpen, Layers, Server, Globe, Target, Sparkle, UserCheck, X
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
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);

  const [guidelineForm, setGuidelineForm] = useState({
    targetUser: '',
    corePurpose: '',
    coreFeatures: ''
  });

  const [formData, setFormData] = useState({
    projectName: '',
    artifact: 'autostudio',
    prompt: '',
    analysisHistory: [] as AnalysisVersion[],
    selectedHistoryIdx: -1,
    finalAnalysis: null as AnalysisVersion | null,
    license: 'MIT',
  });

  const stackGuides: { [key: string]: string } = {
    'React': '가장 대중적인 UI 라이브러리입니다. 풍부한 생태계와 컴포넌트 재사용성이 강점입니다.',
    'Next.js': 'React 기반 프레임워크로, 서버 사이드 렌더링(SSR)과 SEO 최적화에 특화되어 있습니다.',
    'Spring Boot': '안정적이고 확장성이 뛰어난 Java 기반 프레임워크입니다. 복잡한 비즈니스 로직 처리에 좋습니다.',
    'FastAPI': 'Python 기반의 현대적이고 빠른 웹 프레임워크로 비동기 처리에 강력합니다.'
  };

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
    const backendFw = toFrameworkId(stack.backend?.name);
    const frontendFw = toFrameworkId(stack.frontend?.name);

    const hasBoth = !!backendFw && !!frontendFw;
    const hasOne = (!!backendFw || !!frontendFw) && !hasBoth;
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

  const handleAnalyze = async () => {
    if (!formData.prompt.trim()) return alert("프롬프트를 입력하거나 요구사항 가이드를 작성해주세요.");

    setIsAnalyzing(true);
    try {
      const res = await projectService.analyzeProject(formData.prompt);
      const fw = res.framework || { unified: '', backend: '', frontend: '' };
      const lang = res.language || { unified: '', backend: '', frontend: '' };
      const recommended_stack: AnalysisVersion['recommended_stack'] = {};
      if (fw.unified) recommended_stack.unified = { name: fw.unified, reason: res.rationale };
      if (fw.backend) recommended_stack.backend = { name: fw.backend, reason: res.rationale };
      if (fw.frontend) recommended_stack.frontend = { name: fw.frontend, reason: res.rationale };
      const langValue = lang.unified || [lang.backend, lang.frontend].filter(Boolean).join(' / ') || '';

      const newVersion: AnalysisVersion = {
        one_line_summary: res.subject || res.projectDescription || '',
        primary_actions: res.coreFeatures || [],
        core_features: (res.coreFeatures || []).map(f => ({ name: f, description: '' })),
        user_constraints: (res.constraints || []).join(', '),
        architecture_type: res.architectureType,
        app_form: { value: res.architectureType === 'FULL_STACK' ? 'Full Stack Web App' : 'Single Component', isInferred: true },
        programming_language: { value: langValue, isInferred: true },
        recommended_stack,
        prompt: formData.prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setFormData(prev => ({ ...prev, analysisHistory: [newVersion, ...prev.analysisHistory], selectedHistoryIdx: 0 }));
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

  const handleSaveGuidelineForm = () => {
    if (!guidelineForm.targetUser.trim() || !guidelineForm.corePurpose.trim() || !guidelineForm.coreFeatures.trim()) {
      return alert("모든 가이드라인 질문칸을 입력해 주세요!");
    }
    const combinedPrompt = `[누가 사용하나요?]\n- ${guidelineForm.targetUser}\n\n[핵심 목적]\n- ${guidelineForm.corePurpose}\n\n[가장 필요한 기능 설명]\n- ${guidelineForm.coreFeatures}`;
    setFormData({ ...formData, prompt: combinedPrompt });
    setIsGuidelineModalOpen(false);
  };

  const renderContent = () => {
    switch (step) {
      case 1: {
        const currentAnalysis = formData.analysisHistory[formData.selectedHistoryIdx];
        return (
          <div className="flex gap-8 h-full animate-in fade-in slide-in-from-right-8 duration-500">

            {/* ── 왼쪽 패널 ── */}
            <div className="flex-[1.2] flex flex-col gap-6">

              {/* 프로젝트명 / Artifact 입력 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] ml-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:border-blue-500/80 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 font-semibold text-sm text-white placeholder:text-gray-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    placeholder="프로젝트명 입력"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] ml-1">
                    Artifact
                  </label>
                  <input
                    type="text"
                    value={formData.artifact}
                    onChange={(e) => setFormData({ ...formData, artifact: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:border-emerald-500/80 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all duration-300 font-mono text-sm tracking-tight text-emerald-200 placeholder:text-gray-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    placeholder="예: autostudio"
                  />
                </div>
              </div>

              {/* 프롬프트 에디터 영역 */}
              <div className="flex-1 min-h-0 flex flex-col relative">

                {/* 상단 버튼 바 */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
                  <div className="flex items-center">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] ml-1">
                      Requirements Prompt
                    </label>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {/* 기술 스택 가이드 */}
                    <button
                      onClick={() => setShowStackGuide(!showStackGuide)}
                      className={`text-[9px] py-1 px-3.5 whitespace-nowrap rounded-full font-black border transition-all duration-300 flex items-center gap-1.5 h-7 shadow-md active:scale-95 cursor-pointer ${
                        showStackGuide
                          ? 'bg-blue-600 border-transparent text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                          : 'bg-white/[0.03] text-blue-400 border-white/10 hover:bg-white/[0.08] hover:border-blue-500/30'
                      }`}
                    >
                      <BookOpen size={11} />
                      <span>기술 스택 가이드</span>
                    </button>
                    {/* 자유 메모장 지우기 */}
                    <button
                      onClick={() => {
                        setFormData({ ...formData, prompt: '' });
                        setGuidelineForm({ targetUser: '', corePurpose: '', coreFeatures: '' });
                      }}
                      className="text-[9px] py-1 px-3.5 whitespace-nowrap rounded-full font-black border bg-white/[0.03] text-purple-400 border-white/10 hover:bg-white/[0.08] hover:border-purple-500/30 transition-all duration-300 flex items-center gap-1.5 h-7 shadow-md active:scale-95 cursor-pointer"
                    >
                      <Sparkle size={10} className="text-purple-400" />
                      <span>지우기</span>
                    </button>
                    {/* 요구사항 가이드 팝업 */}
                    <button
                      onClick={() => setIsGuidelineModalOpen(true)}
                      className="text-[9px] py-1 px-4 whitespace-nowrap rounded-full font-black border bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border-purple-500/30 hover:from-purple-600/30 hover:to-indigo-600/30 hover:border-purple-500/60 transition-all duration-300 flex items-center gap-1.5 h-7 shadow-[0_4px_12px_rgba(168,85,247,0.15)] active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={11} className="text-purple-300 animate-pulse" />
                      <span>요구사항 가이드 팝업</span>
                    </button>
                  </div>
                </div>

                {/* 에디터 메인 컨테이너 */}
                <div className="flex-1 min-h-0 relative bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden focus-within:border-purple-500/50 focus-within:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-300">
                  {formData.prompt.includes('[핵심 목적]') ? (
                    // 구조화 요약 뷰
                    <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar space-y-4 bg-gradient-to-b from-purple-950/10 to-transparent">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className="text-[11px] font-black text-purple-400 tracking-wider uppercase flex items-center gap-1.5">
                          <Sparkles size={13} className="text-purple-400 animate-pulse" />
                          작성된 프롬프트
                        </span>
                        <button
                          onClick={() => setIsGuidelineModalOpen(true)}
                          className="text-[10px] font-bold text-gray-400 hover:text-purple-300 underline transition-colors cursor-pointer"
                        >
                          재작성 / 수정
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner">
                          <p className="text-[9px] font-bold text-purple-300 uppercase tracking-widest mb-1">Target User</p>
                          <p className="text-xs text-gray-200 font-semibold truncate">{guidelineForm.targetUser}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner">
                          <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-1">Core Purpose</p>
                          <p className="text-xs text-gray-200 font-semibold truncate">{guidelineForm.corePurpose}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner flex flex-col">
                        <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest mb-1.5">
                          Required Features List
                        </p>
                        <p className="text-xs text-gray-300 font-medium whitespace-pre-wrap leading-relaxed max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                          {guidelineForm.coreFeatures}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // 자유 메모장
                    <textarea
                      className="w-full h-full bg-transparent p-6 outline-none resize-none text-sm leading-relaxed custom-scrollbar text-white placeholder:text-gray-500 font-sans font-semibold"
                      placeholder="프로젝트 기획 아이디어를 자유롭게 서술하세요. 또는 상단의 '요구사항 가이드 팝업' 단추를 이용하면 훨씬 명확한 컴포넌트 추출이 가능합니다."
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    />
                  )}
                </div>

                {/* 분석 버튼 */}
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="mt-4 w-full py-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 hover:from-blue-600/20 hover:to-purple-600/20 backdrop-blur-md border border-white/10 rounded-2xl font-black text-sm tracking-widest text-white hover:text-purple-200 hover:border-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_20px_40px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-98 cursor-pointer"
                >
                  {isAnalyzing
                    ? <RefreshCw size={16} className="animate-spin text-blue-400" />
                    : <Sparkles size={16} className="text-purple-400 group-hover:rotate-12 transition-transform" />
                  }
                  {formData.analysisHistory.length > 0 ? '수정하여 재분석' : 'AI 요구사항 분석하기'}
                </button>

              </div>
            </div>{/* ── 왼쪽 패널 끝 ── */}

            {/* ── 오른쪽 패널 ── */}
            <div className="flex-1 bg-white/[0.03] backdrop-blur-2xl saturate-150 border border-white/10 rounded-[32px] p-6 flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden relative">

              {showStackGuide ? (
                // 스택 가이드 뷰
                <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-blue-400 mb-6">
                    <Layers size={18} /> Stack Guide
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {Object.keys(stackGuides).map(stack => (
                      <button
                        key={stack}
                        onClick={() => setSelectedGuideStack(stack)}
                        className={`p-3 rounded-xl text-[11px] font-black border transition-all duration-300 cursor-pointer ${
                          selectedGuideStack === stack
                            ? 'bg-blue-600 border-transparent text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {stack}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 bg-black/20 rounded-2xl p-5 border border-white/5 overflow-y-auto custom-scrollbar shadow-inner">
                    <p className="text-[10px] text-blue-400 font-black uppercase mb-3 tracking-widest">
                      {selectedGuideStack} Detail
                    </p>
                    <p className="text-xs text-gray-200 leading-relaxed italic mb-4 font-semibold">
                      "{stackGuides[selectedGuideStack]}"
                    </p>
                  </div>
                </div>
              ) : (
                // 분석 스펙 뷰
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-6 shrink-0 w-full">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-blue-400">
                      <History size={18} /> Analysis Spec
                    </h3>
                    <div className="flex gap-1.5 ml-auto pr-1">
                      {formData.analysisHistory.slice(0, 3).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFormData({ ...formData, selectedHistoryIdx: idx })}
                          className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all duration-200 cursor-pointer ${
                            formData.selectedHistoryIdx === idx
                              ? 'bg-blue-600 border-transparent text-white shadow-md'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          V{formData.analysisHistory.length - idx}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-20">
                    {isAnalyzing ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50 pt-16">
                        <RefreshCw size={30} className="animate-spin text-blue-500" />
                        <p className="text-xs text-white">요구사항 모델링 파싱 중...</p>
                      </div>
                    ) : currentAnalysis ? (
                      <div className="animate-in fade-in slide-in-from-right-4 space-y-7">

                        {/* Summary */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                          <p className="text-[10px] text-blue-400 font-black uppercase mb-2 tracking-widest">Summary</p>
                          <p className="text-xs font-bold text-gray-200 leading-relaxed italic">
                            "{currentAnalysis.one_line_summary}"
                          </p>
                        </div>

                        {/* Architecture Detail */}
                        <div className="space-y-4">
                          <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-2 tracking-wider">
                            <Terminal size={12} /> Architecture Detail
                          </p>
                          <div className="space-y-2">
                            <p className="text-[10px] text-blue-400 font-black tracking-wide ml-1">● 추출된 컴포넌트 리스트</p>
                            {currentAnalysis.primary_actions.map((act, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-gray-200 bg-white/[0.04] p-3 rounded-xl border border-white/5 flex items-center gap-2 font-semibold shadow-sm"
                              >
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span className="truncate">{act}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Type / Language */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 shadow-inner">
                              <p className="text-[9px] text-gray-400 font-bold mb-1 uppercase tracking-widest">Type</p>
                              <p className="text-[10px] font-black text-white uppercase tracking-tight">
                                {currentAnalysis.architecture_type.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 shadow-inner">
                              <p className="text-[9px] text-gray-400 font-bold mb-1 uppercase tracking-widest">Language</p>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-tight">
                                {currentAnalysis.programming_language.value}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 확정 버튼 */}
                        <button
                          onClick={() => setFormData({ ...formData, finalAnalysis: currentAnalysis })}
                          className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-widest transition-all duration-300 cursor-pointer ${
                            formData.finalAnalysis === currentAnalysis
                              ? 'bg-emerald-600 border-transparent text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                              : 'bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20'
                          }`}
                        >
                          {formData.finalAnalysis === currentAnalysis
                            ? <><Check size={14} className="inline mr-1" /> 확정된 버전</>
                            : '이 요구사항 확정하기'
                          }
                        </button>

                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pt-20">
                        <AlertCircle size={36} className="mb-3 text-gray-400" />
                        <p className="text-xs text-white font-bold">
                          기획 내용을 기입한 후<br />분석 모델을 호출해 주세요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>{/* ── 오른쪽 패널 끝 ── */}

            {/* ════════════════════════════════════════
                요구사항 가이드 팝업 모달
            ════════════════════════════════════════ */}
            {isGuidelineModalOpen && (
              <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/30 backdrop-blur-3xl animate-in fade-in duration-300">
                <div
                  className="w-full max-w-4xl min-h-[550px] bg-gradient-to-br from-[#1c1c1e]/95 to-[#0c0c0e]/95 backdrop-blur-3xl border border-white/20 rounded-[40px] p-8 flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] animate-in zoom-in-95 duration-300 relative"
                  style={{ maxHeight: 'calc(100vh - 80px)' }}
                >
                  {/* 모달 헤더 */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 shrink-0 select-none">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                        <Sparkles size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-white">요구사항 세부 구조화 가이드북</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          세 칸의 핵심 질문에 채워주시면 빌드에 가장 알맞은 특화 프롬프트가 AI를 통해 조립됩니다.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsGuidelineModalOpen(false)}
                      className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* 모달 폼 */}
                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar mb-6">
                    <div className="grid grid-cols-2 gap-6">

                      {/* 01. Target User */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-extrabold text-purple-300 uppercase tracking-wider select-none">
                          <UserCheck size={14} className="text-purple-400" />
                          <span>01. 어떤 타겟 유저가 사용하나요?</span>
                        </div>
                        <input
                          type="text"
                          value={guidelineForm.targetUser}
                          onChange={(e) => setGuidelineForm({ ...guidelineForm, targetUser: e.target.value })}
                          placeholder="예: 반려동물 영양 관리사, 시니어 견주 가족 전원"
                          className="w-full bg-gradient-to-br from-white/[0.08] to-white-500/[0.03] backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-white-400 focus:bg-white/[0.14] focus:shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all duration-300 font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                        />
                      </div>

                      {/* 02. Core Purpose */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-extrabold text-blue-300 uppercase tracking-wider select-none">
                          <Target size={14} className="text-blue-400" />
                          <span>02. 프로젝트 제작의 핵심 목적</span>
                        </div>
                        <input
                          type="text"
                          value={guidelineForm.corePurpose}
                          onChange={(e) => setGuidelineForm({ ...guidelineForm, corePurpose: e.target.value })}
                          placeholder="예: 사료 및 영양제 투약 스케줄 가족 실시간 동기화 서비스"
                          className="w-full bg-gradient-to-br from-white/[0.08] to-purple-500/[0.03] backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-white-400 focus:bg-white/[0.14] focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all duration-300 font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                        />
                      </div>

                    </div>

                    {/* 03. Required Features */}
                    <div className="space-y-2 flex flex-col">
                      <div className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider select-none">
                        <Layers size={14} className="text-emerald-400" />
                        <span>03. 구현을 원하는 필수 기능 목록 서술</span>
                      </div>
                      <textarea
                        value={guidelineForm.coreFeatures}
                        onChange={(e) => setGuidelineForm({ ...guidelineForm, coreFeatures: e.target.value })}
                        placeholder="기능 명세를 개조식으로 상세히 서술해 주세요.&#13;예:&#13;1. 오전/오후 정밀 정량 푸시 알림 타이머 팝업 기능&#13;2. 캘린더 내부 복용 완료 체크박스 및 가족 알림 공유 파이프라인&#13;3. 몸무게 및 수분 섭취량 변화 추적 월간 선형 그래프 차트 모듈"
                        className="w-full min-h-[160px] bg-gradient-to-br from-white/[0.08] to-purple-500/[0.03] backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-800 focus:bg-white/[0.12] focus:shadow-[0_0_20px_rgba(6,78,59,0.05)] transition-all duration-300 resize-none custom-scrollbar leading-relaxed font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                      />
                    </div>
                  </div>

                  {/* 모달 하단 버튼 */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10 shrink-0 select-none">
                    <button
                      onClick={() => setIsGuidelineModalOpen(false)}
                      className="px-6 py-3 rounded-xl font-bold text-xs bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveGuidelineForm}
                      className="px-8 py-3 bg-gradient-to-r from-purple-950/40 via-indigo-900/40 to-purple-900/40 hover:from-purple-900/50 hover:to-indigo-800/50 text-purple-200 border border-purple-500/20 rounded-xl font-black text-xs tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-purple-400/40 hover:scale-[1.03] hover:text-white active:scale-[0.97] transition-all duration-200 cursor-pointer"
                    >
                      프롬프트 작성 완료
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        );
      }

      case 2: {
        const current = formData.finalAnalysis;
        const stackCards: SpotlightCardData[] = [];

        if (current) {
          if (current.architecture_type === 'FULL_STACK' && current.recommended_stack.unified) {
            stackCards.push({
              id: 'unified-stack',
              hue: 280, saturation: 70, lightness: 60,
              content: (
                <div className="w-full min-h-[380px] pt-8 pb-6 px-10 flex flex-col items-center justify-between text-center relative overflow-hidden group">
                  
                  {/* 1. 서브 타이틀 */}
                  <div className="text-[13px] font-black text-purple-400 uppercase tracking-[0.34em] shrink-0 mb-2">
                    Full Stack Recommendation
                  </div>
                  
                  {/* 2. 아이콘 크기 고정 및 마진 최적화 */}
                  <div className="w-22 h-22 bg-purple-500/10 rounded-[28px] flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0 my-2">
                    <Sparkles size={44} />
                  </div>
                  
                  {/* 3. 메인 스택 이름 */}
                  <h4 className="text-4xl font-black tracking-tight italic uppercase text-white shrink-0 my-1">
                    {current.recommended_stack.unified.name}
                  </h4>
                  
                  {/* 4. 가로로 넓게 펼쳐진 설명란 */}
                  <div className="w-full max-w-3xl px-6 flex-1 flex items-center justify-center min-h-0 mt-3">
                    <p className="text-[13px] text-gray-400 leading-relaxed font-medium break-keep text-center">
                      "{current.recommended_stack.unified.reason}"
                    </p>
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
                  <div className="w-full min-h-[380px] pt-8 pb-6 px-10 flex flex-col items-center justify-between text-center relative overflow-hidden">
                    <div className="text-[13px] font-black text-blue-400 uppercase tracking-[0.34em] shrink-0 mb-2">
                      Backend Recommendation
                    </div>
                    <div className="w-22 h-22 bg-blue-500/10 rounded-[28px] flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0 my-2">
                      <Server size={40} />
                    </div>
                    <h4 className="text-3xl font-black italic uppercase text-white shrink-0 my-1">
                      {current.recommended_stack.backend.name}
                    </h4>
                    <div className="w-full max-w-3xl px-6 flex-1 flex items-center justify-center min-h-0 mt-3">
                      <p className="text-[12px] text-gray-400 leading-relaxed font-medium break-keep text-center">
                        "{current.recommended_stack.backend.reason}"
                      </p>
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
                  <div className="w-full min-h-[380px] pt-8 pb-6 px-10 flex flex-col items-center justify-between text-center relative overflow-hidden">
                    <div className="text-[13px] font-black text-cyan-400 uppercase tracking-[0.34em] shrink-0 mb-2">
                      Frontend Recommendation
                    </div>
                    <div className="w-22 h-22 bg-cyan-500/10 rounded-[28px] flex items-center justify-center text-cyan-400 border border-cyan-500/20 shrink-0 my-2">
                      <Globe size={40} />
                    </div>
                    <h4 className="text-3xl font-black italic uppercase text-white shrink-0 my-1">
                      {current.recommended_stack.frontend.name}
                    </h4>
                    <div className="w-full max-w-3xl px-6 flex-1 flex items-center justify-center min-h-0 mt-3">
                      <p className="text-[12px] text-gray-400 leading-relaxed font-medium break-keep text-center">
                        "{current.recommended_stack.frontend.reason}"
                      </p>
                    </div>
                  </div>
                ),
              });
            }
          }
        }

        return (
          <div className="flex flex-col h-full justify-start pt-0 pb-24 -mt-7">
            
            {/* 상단 안내 문구 */}
            <div className="text-center shrink-0 pt-0 mb-4">
              <p className="text-gray-500 text-xs italic font-medium">아키텍처 분석 결과에 따른 추천 스택 세부 정보입니다.</p>
            </div>

            {/* 메인 와이드 카드 영역 */}
            <div className="flex-none flex items-center justify-center max-w-5xl mx-auto w-full py-1 mb-4">
              {stackCards.length > 0 ? (
                <SpotlightCardGroup 
                  cards={stackCards} 
                  cardClassName="!max-w-3xl !flex-none w-full" 
                />
              ) : (
                <p className="text-gray-500 text-sm">추천 스택 데이터가 없습니다.</p>
              )}
            </div>

            {/*  하단 팁 바 박스 */}
            <div className="mt-0 -mt-3 mb-16 bg-white/5 border border-white/5 rounded-3xl p-4 flex items-center gap-4 max-w-4xl mx-auto w-full shrink-0">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0"><Info size={14}/></div>
              <p className="text-[12px] text-gray-400 leading-relaxed font-medium">
                {current?.architecture_type === 'FULL_STACK' 
                  ? "백엔드와 프론트엔드가 모두 포함된 완전한 웹 애플리케이션 구조입니다." 
                  : "서버 또는 클라이언트 단일 컴포넌트로 구성된 독립 프로젝트입니다."}
              </p>
            </div>

          </div>
        );
      }

      case 3: {
        const licenseList = ['MIT', 'Apache 2.0', 'GPL 3.0', 'BSD 2-Clause', 'None'];
        const currentSpec = licenseSpecs[formData.license] || { allow: [], restrict: [] };
        return (
          <div className="flex gap-8 h-full animate-in fade-in slide-in-from-right-8 duration-500">

            {/* 라이선스 선택 목록 */}
            <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest sticky top-0 bg-[#1e1e24]/80 backdrop-blur-md pb-2 z-10">
                License Policy
              </h3>
              {licenseList.map(lic => (
                <button
                  key={lic}
                  onClick={() => setFormData({ ...formData, license: lic })}
                  className={`w-full p-5 rounded-3xl border transition-all duration-300 flex justify-between items-center cursor-pointer shadow-sm ${
                    formData.license === lic
                      ? 'bg-orange-600/10 border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  <span className="font-bold text-sm text-white">{lic} License</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.license === lic ? 'border-orange-500' : 'border-white/20'}`}>
                    {formData.license === lic && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                  </div>
                </button>
              ))}
            </div>

            {/* 라이선스 상세 패널 */}
            <div className="w-80 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shrink-0 flex flex-col justify-between h-full max-h-[400px] shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-orange-400">
                  <ShieldCheck size={18} /> License Detail
                </h3>
                <p className="text-[12px] text-gray-200 leading-relaxed font-semibold bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                  {licenseGuideTexts[formData.license] || '프로젝트의 법적 권한을 설정합니다.'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] text-purple-300 font-black uppercase tracking-wider">Permission Scope</p>
                <div className="space-y-1.5">
                  {currentSpec.allow.map((allowText, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1.5 rounded-xl border border-emerald-500/10">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_#34d399]" />
                      {allowText}
                    </div>
                  ))}
                  {currentSpec.restrict.map((restrictText, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-amber-400 font-bold bg-amber-500/5 px-2.5 py-1.5 rounded-xl border border-amber-500/10">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_#fbbf24]" />
                      {restrictText}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        );
      }

      case 4:
        return (
          <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
            <div className="flex-1 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 overflow-y-auto mb-6 custom-scrollbar shadow-[0_30px_60px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-5 text-blue-400">
                <FileText size={28} />
                <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-4 decoration-blue-600">
                  Final Build Report
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Project Identity</p>
                    <p className="text-xl font-bold text-white">{formData.projectName || 'New Project'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Build Artifact Target</p>
                    <p className="text-sm font-mono font-bold text-orange-400">{formData.artifact}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Stack Architecture</p>
                    <p className="text-sm font-bold text-emerald-400 uppercase">
                      {formData.finalAnalysis?.architecture_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="space-y-6 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-widest">Legal Policy</p>
                    <p className="text-xl font-bold text-orange-400">{formData.license}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full px-6 py-4">

      {/* 헤더 */}
      <header className="mb-8 shrink-0 flex justify-between items-end select-none">
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
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className={`w-10 h-1.5 rounded-full transition-all duration-500 ${
                  step >= n ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">STEP {step}</span>
        </div>
      </header>

      {/* 메인 카드 */}
      <div className="flex-1 min-h-0 bg-white/[0.03] backdrop-blur-3xl saturate-150 border border-white/10 rounded-[56px] p-10 relative shadow-[0_30px_100px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
        <div className="h-full pb-20 relative z-10">
          {renderContent()}
        </div>

        {/* 하단 네비게이션 */}
        <div className="absolute bottom-6 left-12 right-12 flex justify-between items-center z-20">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={`px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 border ${
              step === 1
                ? 'opacity-0 pointer-events-none'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 cursor-pointer active:scale-95'
            }`}
          >
            <ChevronLeft size={22} /> BACK
          </button>
          <div className="flex gap-5">
            {step < 4 ? (
              <button
                onClick={() => setStep(s => Math.min(4, s + 1))}
                disabled={step === 1 && !formData.finalAnalysis}
                className={`px-10 py-3.5 rounded-2xl font-black text-sm tracking-widest transition-all duration-300 shadow-2xl flex items-center gap-4 active:scale-95 cursor-pointer ${
                  step === 1 && !formData.finalAnalysis
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                    : 'bg-blue-600 border-transparent text-white shadow-blue-600/40 hover:bg-blue-500'
                }`}
              >
                NEXT STEP <ChevronRight size={22} />
              </button>
            ) : (
              <GenerateButton onClick={handleGenerateProject} disabled={isGenerating}>
                {isGenerating ? "GENERATING..." : "Generate Project"}
              </GenerateButton>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CreateProject;