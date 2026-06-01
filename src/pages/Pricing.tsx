import React, { useState } from 'react';
import { Coins, Plus, ShieldCheck, Zap, BarChart3, Binary, Blocks } from 'lucide-react';
import CreditCardModal from '../components/CreditCardModal'; 

const Pricing: React.FC = () => {
  const [userCredit, setUserCredit] = useState<number>(14200);
  
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const handleChargeSuccess = () => {
    alert(" PG사 실시간 인증 성공! 크레딧 +₩10,000이 안전하게 충전되었습니다.");
    setUserCredit(prev => prev + 10000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-700 font-sans text-white pb-6">
      
      {/* 타이틀 헤더 구역 */}
      <header className="mb-8 shrink-0">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-emerald-500">Billing</h1>
        <p className="text-gray-400 text-sm mt-1">크레딧을 충전하고 사용 중인 후불 종량제 플랜의 단계별 인프라 단가를 모니터링합니다.</p>
      </header>

      <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
        
        {/* 1. 상단 현재 잔액 랙 패널 */}
        <div className="bg-gradient-to-br from-emerald-600/10 to-blue-600/5 border border-emerald-500/20 rounded-[32px] p-8 flex items-center justify-between shadow-2xl shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Coins size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">현재 사용 가능한 보유 크레딧</p>
              <h2 className="text-4xl font-black font-mono tracking-tight text-emerald-400 mt-1">
                ₩{userCredit.toLocaleString()}
              </h2>
            </div>
          </div>
          
          {/* 충전 단추를 누르면 3D 카드 입력 모달이 활성화 */}
          <button 
            onClick={() => setIsCardModalOpen(true)}
            className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-lg shadow-emerald-500/20 font-bold transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} /> 크레딧 충전하기
          </button>
        </div>

        {/* 2. 하단 2열 상세 안내 및 스펙 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
          
          {/* 좌측 슬롯: 실시간 AI 파이프라인 종량제 단가표 */}
          <section className="bg-white/5 border border-white/10 rounded-[32px] p-6">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-200">
              <Zap size={18} className="text-amber-400" /> 파이프라인 단계별 소모 단가
            </h3>
            
            <div className="space-y-3">
              {/* Phase 1 단가 */}
              <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><BarChart3 size={16} /></div>
                  <div>
                    <span className="text-sm font-semibold block">Phase 1. 요구사항 분석 및 아키텍처 수립</span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">LLM 기반 에이전트 인터페이스 요구사항 명세 파싱</span>
                  </div>
                </div>
                <span className="font-mono text-sm text-gray-300 font-bold shrink-0">₩2,000 <span className="text-xs text-gray-500 font-sans">/ 기본</span></span>
              </div>

              {/* Phase 2 단가 */}
              <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Binary size={16} /></div>
                  <div>
                    <span className="text-sm font-semibold block">Phase 2. 소스코드 정밀 생성 및 빌드</span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">컴포넌트 및 비즈니스 로직 풀 스택 코드 생성 파이프라인</span>
                  </div>
                </div>
                <span className="font-mono text-sm text-gray-300 font-bold shrink-0">₩3,000 <span className="text-xs text-gray-500 font-sans">/ 기본</span></span>
              </div>

              {/* 대용량 오버헤드 추가 연산 옵션 */}
              <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-500/10 text-gray-400 rounded-lg"><Blocks size={16} /></div>
                  <div>
                    <span className="text-sm font-semibold block">추가 인프라 스케일 아웃 및 대용량 연산</span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">엔터프라이즈급 대규모 모듈 분할 및 종속성 최적화 복잡도 증가시</span>
                  </div>
                </div>
                <span className="font-mono text-sm text-gray-400 font-bold shrink-0">₩5,000+ <span className="text-xs text-gray-600 font-sans">/ 가산</span></span>
              </div>
            </div>
          </section>

          {/* 우측 슬롯: 요금 안전장치 명세 정책 및 한도 설명 */}
          <section className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-200">
                <ShieldCheck size={18} className="text-blue-400" /> 안심 보장 방어선 정책
              </h3>
              <ul className="space-y-3 text-xs text-gray-400 font-medium leading-relaxed pl-1">
                <li>• 간단한 표준 프로젝트의 일괄 생성 예상 비용은 약 <span className="text-emerald-400 font-bold">₩5,000 안팎</span>으로 산정됩니다.</li>
                <li>• 보유하신 크레딧 한도 내에서만 연산이 차감되므로 사후 무단 과금이 절대 발생하지 않습니다.</li>
                <li>• 새 프로젝트 생성 단계에서 최대 소모 상한 크레딧을 미리 제어해 둘 수 있어 폭탄 요금을 원천 차단합니다.</li>
                <li>• 잔액이 부족해질 경우 AI 에이전트가 코딩을 안전하게 세이브존에 저장하고 작업을 일시정지합니다.</li>
              </ul>
            </div>
            <p className="text-[11px] text-emerald-500/70 font-semibold bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 mt-4">
              ✨ 효율적인 자원 소모와 무차별 AI 크롤링 트래픽 낭비를 막기 위한 AI AutoStudio의 안전 정산 프레임워크입니다.
            </p>
          </section>

        </div>
      </div>

      {/* 카드 입력 3D 애니메이션 모달 */}
      <CreditCardModal 
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSuccess={handleChargeSuccess}
      />

    </div>
  );
};

export default Pricing;