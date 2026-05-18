import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FolderOpen, File, Cpu, Sparkles, RefreshCw, 
  Code2, Info, FileCode, Terminal, Globe, ChevronRight, ChevronDown,
  AlertCircle
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { storageService, ProjectNode } from '../services/storageService';
import ProcessingView from './ProcessingView';

interface ProjectDetailProps {
  projectUuid?: string; 
  generatingProjects?: any;
}

// [파일 확장자 → Prism 언어 식별자 매핑]
// Prism이 알아듣는 언어명으로 매핑해야 정확한 하이라이팅이 적용됨
const getLanguageFromPath = (filePath: string): string => {
  if (!filePath) return 'text';
  
  const fileName = filePath.split('/').pop() || '';
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
  
  // 확장자별 언어 매핑 테이블
  const langMap: { [key: string]: string } = {
    'js': 'javascript', 'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'tsx',
    'java': 'java', 'py': 'python', 'html': 'markup', 'css': 'css',
    'json': 'json', 'yml': 'yaml', 'yaml': 'yaml', 'sql': 'sql', 'md': 'markdown'
  };
  
  if (!extension) {
    if (fileName.toLowerCase() === 'dockerfile') return 'docker';
    return 'text';
  }
  
  return langMap[extension] || 'text';
};

//[재귀 트리 노드 컴포넌트] 깊이에 상관없이 모든 자식을 펼치도록 자기 자신을 호출
interface TreeNodeProps {
  node: ProjectNode;
  depth: number;
  selectedPath: string;
  onSelectFile: (filePath: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, selectedPath, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState<boolean>(depth < 2);
  const nodePath = (node as any).path || node.name;

  if (node.type === 'FILE') {
    return (
      <button 
        onClick={() => onSelectFile(nodePath)}
        className={`flex items-center justify-between text-[13px] w-full text-left transition-all hover:translate-x-1 py-1 px-2 rounded-lg ${selectedPath === nodePath ? 'text-cyan-400 bg-cyan-500/5 font-bold' : 'text-gray-400 hover:text-gray-200'}`}
      >
        <div className="flex items-center gap-2 truncate">
          <File size={12} className={selectedPath === nodePath ? 'text-cyan-400' : 'text-gray-500'} /> 
          <span className="truncate">{node.name}</span>
        </div>
        {(node as any).isNew && (
          <span className="text-[8px] bg-cyan-500 text-black font-black px-1.5 py-0.5 rounded tracking-tighter animate-pulse scale-90">NEW</span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 w-full text-left transition-all hover:opacity-80 py-0.5 ${
          depth === 0 
            ? 'text-[13px] text-blue-400 font-black uppercase tracking-wider' 
            : 'text-[12px] text-gray-400 font-bold'
        }`}
      >
        {isOpen ? <ChevronDown size={12} className="text-gray-600 shrink-0" /> : <ChevronRight size={12} className="text-gray-600 shrink-0" />}
        {isOpen ? <FolderOpen size={13} className="text-blue-400 shrink-0" /> : <Folder size={13} className="text-blue-500 shrink-0" />}
        <span className="truncate">{node.name}</span>
      </button>

      {isOpen && node.children && node.children.length > 0 && (
        <div className="pl-3.5 space-y-1 border-l border-white/5 ml-1.5">
          {node.children.map((childNode, idx) => (
            <TreeNode 
              key={`${childNode.name}-${idx}`}
              node={childNode}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectUuid, generatingProjects = {} }) => {
  const [viewMode, setViewMode] = useState<'code' | 'build'>('code');
  const [isTreeRefreshing, setIsTreeRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<'code' | 'info'>('code');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  const [serverFiles, setServerFiles] = useState<ProjectNode[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(false);
  const [fileContent, setFileContent] = useState<string>('// 좌측 탐색기에서 소스코드를 골라보세요.');
  const [isFileLoading, setIsFileLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>('');
  
  const fileContentCacheRef = useRef<{ [path: string]: string }>({});
  const fetchedUuidRef = useRef<string | null>(null);

  const isDummyProject = projectUuid === 'design-guide-dummy-uuid';
  const currentProgressInfo = projectUuid ? generatingProjects[projectUuid] : null;

  const parseFlatToTree = (flatList: any[]) => {
    const root: ProjectNode[] = [];
    const lookup: { [key: string]: ProjectNode } = {};
    const sortedList = [...flatList].sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    sortedList.forEach((node) => {
      const parts = node.path.split('/');
      const name = parts[parts.length - 1]; 
      
      const newNode: ProjectNode = {
        name: name,
        type: node.type === 'DIR' ? 'DIRECTORY' : 'FILE',
        children: node.type === 'DIR' ? [] : undefined
      };
      (newNode as any).path = node.path;
      lookup[node.path] = newNode;

      if (parts.length === 1) {
        root.push(newNode); 
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        if (lookup[parentPath]) {
          lookup[parentPath].children?.push(newNode);
        } else {
          root.push(newNode);
        }
      }
    });
    return root;
  };

  const loadInitialDummyTree = () => {
    const initialFlat = [
      { path: 'src', type: 'DIR' },
      { path: 'src/main', type: 'DIR' },
      { path: 'pom.xml', type: 'FILE' },
      { path: 'LICENSE.md', type: 'FILE' }
    ];
    setServerFiles(parseFlatToTree(initialFlat));
    setSelectedPath('pom.xml');
    setFileContent(`<?xml version="1.0" encoding="UTF-8"?>\n<project>\n    <modelVersion>4.0.0</modelVersion>\n    <artifactId>senior-dog-care-hub</artifactId>\n</project>`);
  };

  const handleRefreshTreeAction = () => {
    setIsTreeRefreshing(true);
    setTimeout(() => {
      setIsTreeRefreshing(false);
      if (isDummyProject) {
        const updatedFlat = [
          { path: 'src', type: 'DIR' },
          { path: 'src/main', type: 'DIR' },
          { path: 'src/main/java', type: 'DIR' },
          { path: 'src/main/java/MainApplication.java', type: 'FILE', isNew: true },
          { path: 'pom.xml', type: 'FILE' },
          { path: 'LICENSE.md', type: 'FILE' }
        ];
        const parsed = parseFlatToTree(updatedFlat);
        if (parsed[0]?.children?.[0]?.children?.[0]) {
          (parsed[0].children[0].children[0] as any).isNew = true;
        }
        setServerFiles(parsed);
        alert("[백엔드 폴링 완료] 실시간 빌드 중 생성 완료된 파일 스트림이 트리에 동적 동기화되었습니다!");
      } else {
        alert("원격지 저장소 트리가 갱신되었습니다.");
      }
    }, 800);
  };

  useEffect(() => {
    if (isDummyProject) {
      loadInitialDummyTree();
      return;
    }

    const fetchProjectTree = async () => {
      if (!projectUuid || projectUuid.trim() === "" || projectUuid === "undefined" || projectUuid.length < 30) return;
      if (fetchedUuidRef.current === projectUuid) return;
      fetchedUuidRef.current = projectUuid;
      
      setIsTreeLoading(true);
      try {
        const data = await storageService.getProjectTree(projectUuid);
        if (data && Array.isArray(data)) {
          const parsedTree = parseFlatToTree(data);
          setServerFiles(parsedTree);
          
          const findFirstFile = (nodes: ProjectNode[]): string | null => {
            for (const n of nodes) {
              if (n.type === 'FILE') return (n as any).path || n.name;
              if (n.children && n.children.length > 0) {
                const found = findFirstFile(n.children);
                if (found) return found;
              }
            }
            return null;
          };
          const first = findFirstFile(parsedTree);
          if (first) setSelectedPath(first);
        }
      } catch (error) {
        console.error(error);
        setServerFiles([]);
      } finally {
        setIsTreeLoading(false);
      }
    };
    fetchProjectTree();
  }, [projectUuid, isDummyProject]);

  useEffect(() => {
    if (isDummyProject) {
      if (selectedPath === 'src/main/java/MainApplication.java') {
        setFileContent(`package com.ae.autostudio;\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class MainApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(MainApplication.class, args);\n    }\n}`);
      } else if (selectedPath === 'LICENSE.md') {
        setFileContent(`MIT License\n\nCopyright (x) 2026 Seol Hyo-ju`);
      } else if (selectedPath === 'pom.xml') {
        setFileContent(`<?xml version="1.0" encoding="UTF-8"?>\n<project>\n    <modelVersion>4.0.0</modelVersion>\n    <artifactId>senior-dog-care-hub</artifactId>\n</project>`);
      }
      return;
    }

    const fetchFileContent = async () => {
      if (!projectUuid || !selectedPath) return;
      if (fileContentCacheRef.current[selectedPath] !== undefined) {
        setFileContent(fileContentCacheRef.current[selectedPath]);
        setFileError('');
        return;
      }
      
      setIsFileLoading(true);
      setFileError('');
      try {
        const content = await storageService.getFileContent(projectUuid, selectedPath);
        fileContentCacheRef.current[selectedPath] = content;
        setFileContent(content);
      } catch (error: any) {
        setFileError('파일 내용을 불러오는 중 오류가 발생했습니다.');
        setFileContent('');
      } finally {
        setIsFileLoading(false);
      }
    };
    fetchFileContent();
  }, [projectUuid, selectedPath, isDummyProject]);

  useEffect(() => {
    fileContentCacheRef.current = {};
  }, [projectUuid]);

  const handleModifyRequest = () => {
    if (!modifyPrompt.trim()) return;
    setIsModifying(true);
    setTimeout(() => {
      setIsModifying(false);
      setModifyPrompt('');
    }, 2000);
  };

  const displayFileName = selectedPath ? selectedPath.split('/').pop() : '';
  const currentLanguage = getLanguageFromPath(selectedPath);

  return (
    <div className="flex flex-col h-full w-full bg-[#0D0D0E] text-white overflow-hidden rounded-[36px] border border-white/5 shadow-2xl animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-10 py-5 border-b border-white/5 bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-900/20">
            <Code2 size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black italic tracking-tighter uppercase">
                {isDummyProject ? "[분석 모드] AI 아키텍처 코딩 룸" : "시니어 견주 건강관리 앱"}
              </h2>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-widest">
                {isDummyProject ? "Integrated View" : "Live Build"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1"><Globe size={10}/> 개발: 웹</span>
              <span className="flex items-center gap-1"><Cpu size={10}/> 엔진: Gemini-3-Flash</span>
            </div>
          </div>
        </div>

        {/* 탭 제어판 */}
        <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <button 
            onClick={() => { setViewMode('code'); setActiveTab('code'); }}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${viewMode === 'code' && activeTab === 'code' ? 'bg-[#242426] text-white border border-white/5 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <FileCode size={15} /> 소스코드 편집기
          </button>
          <button 
            onClick={() => { setViewMode('code'); setActiveTab('info'); }}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${viewMode === 'code' && activeTab === 'info' ? 'bg-[#242426] text-white border border-white/5 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Info size={15} /> 프로젝트 스펙
          </button>
          <button 
            onClick={() => setViewMode('build')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${viewMode === 'build' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 animate-none' : 'text-gray-500 hover:text-cyan-400 font-bold'}`}
          >
            <Terminal size={15} /> 실시간 생성 로그
            {currentProgressInfo && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping ml-1" />}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative bg-[#121214]">
        {viewMode === 'build' ? (
          <div className="h-full animate-in zoom-in-95 duration-300">
            <ProcessingView 
              isGenerating={isDummyProject} 
              onComplete={() => setViewMode('code')} 
            />
          </div>
        ) : activeTab === 'code' ? (
          <div className="flex h-full animate-in slide-in-from-right-4 duration-500">
            {/* 좌측 탐색기 구역 */}
            <aside className="w-72 border-r border-white/5 bg-black/30 p-6 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-6 shrink-0 border-b border-white/5 pb-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <ChevronRight size={12} className="text-blue-500" /> Project Explorer
                </p>
                {/*동적 새로고침 버튼 */}
                <button
                  onClick={handleRefreshTreeAction}
                  title="백엔드 폴링 데이터 강제 갱신"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white border border-white/5 transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw size={12} className={isTreeRefreshing ? "animate-spin text-cyan-400" : ""} />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {isTreeLoading ? (
                  <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin text-blue-500" /> 구조 동기화 중...
                  </div>
                ) : (
                  serverFiles.map((item, idx) => (
                    <TreeNode 
                      key={`${item.name}-${idx}`}
                      node={item}
                      depth={0}
                      selectedPath={selectedPath}
                      onSelectFile={setSelectedPath}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* 중앙 편집기 본체 */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0D0D0E] relative shadow-2xl">
              <div className="flex items-center justify-between px-8 py-3 bg-white/[0.03] border-b border-white/5">
                <div className="flex items-center gap-2">
                  <FileCode size={14} className="text-blue-500" />
                  <span className="text-[11px] font-mono font-bold text-gray-400 tracking-tight">
                    {displayFileName || 'No file selected'}
                  </span>
                  {selectedPath && currentLanguage !== 'text' && (
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-widest ml-2">
                      {currentLanguage}
                    </span>
                  )}
                  {isFileLoading && <RefreshCw size={11} className="animate-spin text-blue-400 ml-1" />}
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                {fileError ? (
                  <div className="p-10">
                    <div className="flex items-center gap-3 text-red-400 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                      <AlertCircle size={18} className="shrink-0" />
                      <div>
                        <p className="font-bold text-sm mb-1">파일을 불러올 수 없습니다</p>
                        <p className="text-xs text-red-400/70">{fileError}</p>
                      </div>
                    </div>
                  </div>
                ) : isFileLoading ? (
                  <div className="p-10 flex items-center gap-3 text-gray-500">
                    <RefreshCw size={14} className="animate-spin text-blue-500" />
                    <span className="text-xs">파일 내용을 가져오는 중...</span>
                  </div>
                ) : (
                  <SyntaxHighlighter
                    language={currentLanguage}
                    style={vscDarkPlus}
                    showLineNumbers={true}
                    wrapLongLines={false}
                    customStyle={{
                      background: 'transparent', margin: 0, padding: '2.5rem',
                      fontSize: '0.9rem', lineHeight: '1.7', fontFamily: 'inherit', textShadow: 'none',
                    }}
                    lineNumberStyle={{
                      color: '#52525b', minWidth: '3em', paddingRight: '1.5em',
                      userSelect: 'none', borderRight: '1px solid rgba(255,255,255,0.05)', marginRight: '1em',
                    }}
                  >
                    {fileContent || "// Empty File"}
                  </SyntaxHighlighter>
                )}
              </div>

              <div className="p-8 bg-[#131315] border-t border-white/5 relative">
                <div className="max-w-5xl mx-auto relative group">
                  <div className="absolute -top-5 left-5 flex items-center gap-2">
                    <Sparkles size={14} className={`text-purple-400 ${isModifying ? 'animate-spin' : 'animate-pulse'}`} />
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">AI Modifier Ready</span>
                  </div>
                  <div className="relative overflow-hidden rounded-[28px] p-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 group-focus-within:from-blue-500/50 group-focus-within:via-purple-500/50 group-focus-within:to-blue-500/50 transition-all duration-500">
                    <div className="bg-[#0D0D0E] rounded-[27px] relative">
                      <textarea 
                        value={modifyPrompt}
                        onChange={(e) => setModifyPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleModifyRequest(); } }}
                        rows={1}
                        className="w-full bg-transparent py-4 pl-12 pr-40 outline-none text-sm text-gray-200 placeholder:text-gray-600 transition-all resize-none min-h-[56px] max-h-[200px] custom-scrollbar"
                        placeholder="수정하고 싶은 내용을 입력하세요."
                      />
                      <div className="absolute left-5 bottom-6">
                        <Cpu size={22} className={`${isModifying ? 'text-purple-500' : 'text-gray-600 group-focus-within:text-blue-500'} transition-colors duration-500`} />
                      </div>
                      <button 
                        onClick={handleModifyRequest}
                        disabled={!modifyPrompt.trim() || isModifying}
                        className={`absolute right-3 bottom-3 px-7 py-3 rounded-2xl font-black text-[10px] tracking-widest transition-all ${modifyPrompt.trim() && !isModifying ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'bg-white/5 text-gray-700'}`}
                      >
                        {isModifying ? <RefreshCw size={14} className="animate-spin" /> : 'REQUEST MODIFY'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        ) : (
          <div className="h-full p-16 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-3 gap-12">
              <div className="col-span-2 space-y-12">
                <section className="space-y-5 border-l-4 border-blue-600 pl-8">
                  <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em]">Core Specification</h3>
                  <p className="text-3xl font-bold leading-tight tracking-tighter">"시니어 반려견 건강 관리 돌봄 허브"</p>
                </section>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 shadow-inner">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Target Stack</p>
                    <p className="text-xl font-bold text-emerald-400">TypeScript, React</p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 shadow-inner">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Policy</p>
                    <p className="text-xl font-bold text-orange-400">MIT License</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-600/5 border border-blue-500/20 rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl">
                 <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                   <Terminal size={18} /> Build Info
                 </h4>
                 <div className="space-y-6 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-4"><span className="text-gray-500">BUILD VERSION</span><span className="font-mono">v1.0.4-stable</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-4"><span className="text-gray-500">STATUS</span><span className="text-emerald-500 font-bold uppercase">Deployed</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-500 font-bold">TOTAL SOURCE</span><span className="text-blue-400 underline underline-offset-4 font-black">24 Files</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;