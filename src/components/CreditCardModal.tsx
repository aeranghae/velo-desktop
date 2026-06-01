import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 포커스 테두리가 추적할 영역의 스타일 타입 정의
interface FocusStyle {
  width: string;
  height: string;
  transform: string;
  opacity: number;
}

const CreditCardModal: React.FC<CreditCardModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusStyle, setFocusStyle] = useState<FocusStyle>({
    width: '0px',
    height: '0px',
    transform: 'translate(0px, 0px)',
    opacity: 0,
  });

  if (!isOpen) return null;

  // 1. 카드 번호 마스킹 및 포맷팅 처리 (처음 4자리, 마지막 4자리 제외 중간 '*' 처리)
  const renderCardNumber = () => {
    const rawValue = cardNumber.padEnd(16, '•'); // 빈 자리는 • 로 채우기
    const chars = rawValue.split('');
    
    return (
      <div className="flex gap-1.5 font-mono text-xl font-bold tracking-wider text-white drop-shadow-md">
        {Array.from({ length: 4 }).map((_, groupIdx) => (
          <div key={groupIdx} className="flex min-w-[56px] justify-center">
            {chars.slice(groupIdx * 4, (groupIdx + 1) * 4).map((char, cIdx) => {
              const globalIdx = groupIdx * 4 + cIdx;
              // 5번째 글자(인덱스4)부터 12번째 글자(인덱스11)까지 중, 입력된 숫자는 *로 렌더링
              const isMaskedZone = globalIdx >= 4 && globalIdx <= 11;
              const displayChar = isMaskedZone && char !== '•' ? '*' : char;

              return (
                <div key={cIdx} className="w-[14px] h-[28px] overflow-hidden relative flex justify-center items-center">
                  <span 
                    key={`${globalIdx}-${displayChar}`} 
                    className="absolute animate-card-roll-up block text-white font-bold"
                  >
                    {displayChar}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // 3. 입력창 포커스 시 테두리 가이드 박스 위치 제어 스위치
  const handleInputFocus = (targetZone: 'number' | 'holder' | 'expires' | 'cvv') => {
    if (targetZone === 'cvv') {
      setIsFlipped(true);
      setFocusStyle(prev => ({ ...prev, opacity: 0 })); // 뒷면일 땐 앞면 테두리 숨기기
      return;
    }

    setIsFlipped(false);
    
    // 카드 내부 실제 DOM 배치 비율에 맞춘 정확한 절대 좌표(px) 이동 제어 매핑
    switch (targetZone) {
      case 'number':
        setFocusStyle({
          width: 'calc(100% - 24px)',
          height: '42px',
          transform: 'translate(12px, 82px)',
          opacity: 1,
        });
        break;
      case 'holder':
        setFocusStyle({
          width: '210px',
          height: '46px',
          transform: 'translate(16px, 148px)',
          opacity: 1,
        });
        break;
      case 'expires':
        setFocusStyle({
          width: '90px',
          height: '46px',
          transform: 'translate(296px, 148px)',
          opacity: 1,
        });
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1C1C1E] border border-white/10 rounded-[32px] p-8 w-full max-w-[460px] relative shadow-2xl">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h3 className="text-base font-bold text-gray-300 mb-6 tracking-tight">신용카드 정보 등록</h3>

        {/* 3D 카드 플레이트 하우징 */}
        <div className="w-full h-[210px] perspective-1000 mb-8 select-none relative">
          <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/*  카드 앞면 (Front) */}
            <div className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br from-[#323941] to-[#061018] backface-hidden flex flex-col justify-between shadow-[0_33px_50px_-15px_rgba(50,55,63,0.66)] border border-white/10 overflow-hidden">
              
              {/* 3. 실시간으로 위치추적을 돌며 따라다니는 네온 테두리 가이드 포커싱 박스 */}
              <div 
                className="absolute border-2 border-emerald-500/80 rounded-xl pointer-events-none transition-all duration-300 ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-white/[0.02]"
                style={{
                  width: focusStyle.width,
                  height: focusStyle.height,
                  transform: focusStyle.transform,
                  opacity: focusStyle.opacity,
                  top: 0,
                  left: 0,
                  zIndex: 10,
                }}
              />

              <div className="flex justify-between items-start">
                <div className="w-11 h-8 bg-gradient-to-br from-amber-300 to-amber-500/80 rounded-md shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-px p-1 opacity-20"><div className="border border-black"></div><div className="border border-black"></div><div className="border border-black"></div><div className="border border-black"></div><div className="border border-black"></div><div className="border border-black"></div></div>
                </div>
                <span className="text-[10px] font-black tracking-widest text-white/30 italic uppercase">Credit Card</span>
              </div>
              
              {/* 계량기 롤링 애니메이션 기능이 내장된 카드 번호 구역 */}
              <div className="my-4 min-h-[28px] pl-2">
                {renderCardNumber()}
              </div>
              
              <div className="flex justify-between items-end font-mono pl-2">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-[8px] text-gray-500 uppercase font-sans tracking-wider">Card Holder</p>
                  <div className="text-xs font-bold truncate tracking-wide text-gray-300 uppercase mt-0.5 min-h-[16px] overflow-hidden relative">
                    <span key={cardHolder} className="animate-card-roll-up block">
                      {cardHolder || 'FULL NAME'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 pr-2">
                  <p className="text-[8px] text-gray-500 uppercase font-sans tracking-wider">Expires</p>
                  <p className="text-xs font-bold text-gray-300 mt-0.5">
                    {expMonth || 'MM'}/{expYear ? expYear.slice(-2) : 'YY'}
                  </p>
                </div>
              </div>
            </div>

            {/* 카드 뒷면 (Back - CVV) */}
            <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#323941] to-[#061018] rotate-y-180 backface-hidden flex flex-col justify-between py-6 shadow-[0_33px_50px_-15px_rgba(50,55,63,0.66)] border border-white/10">
              <div className="w-full h-11 bg-black/80 mt-2" />
              <div className="px-6 flex flex-col items-end">
                <p className="text-[8px] text-gray-500 uppercase font-sans tracking-wider mb-1 mr-1">CVV</p>
                <div className="w-full h-9 bg-white/90 rounded-lg flex items-center justify-end pr-4 text-black font-mono font-bold tracking-widest shadow-inner">
                  {cvv || '•••'}
                </div>
              </div>
              <div className="px-6 text-[8px] text-gray-600 font-sans tracking-tighter leading-none">
                This secure tokenized billing component is built for evaluation and demonstration.
              </div>
            </div>

          </div>
        </div>

        {/* 입력 폼 필드 제어 구역 */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Card Number</label>
            <input 
              type="text" maxLength={16} value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
              onFocus={() => handleInputFocus('number')} //포커스 시 박스 이동
              placeholder="카드 번호 16자리 숫자 입력"
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-emerald-500/50 transition-all font-mono text-white placeholder:text-gray-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Card Holder</label>
            <input 
              type="text" value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              onFocus={() => handleInputFocus('holder')} //포커스 시 박스 이동
              placeholder="영문 소유자명 입력"
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-emerald-500/50 transition-all uppercase text-white placeholder:text-gray-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Expiration Date</label>
              <div className="flex gap-2">
                <select 
                  value={expMonth} onChange={(e) => setExpMonth(e.target.value)} 
                  onFocus={() => handleInputFocus('expires')} //포커스 시 박스 이동
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500/50 transition-all text-gray-400" required
                >
                  <option value="" disabled>월</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
                <select 
                  value={expYear} onChange={(e) => setExpYear(e.target.value)} 
                  onFocus={() => handleInputFocus('expires')} //포커스 시 박스 이동
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500/50 transition-all text-gray-400" required
                >
                  <option value="" disabled>년</option>
                  {Array.from({ length: 10 }, (_, i) => String(2026 + i)).map(y => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">CVV</label>
              <input 
                type="password" maxLength={3} value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                onFocus={() => handleInputFocus('cvv')} //포커스 시 회전 처리
                placeholder="보안코드 3자리"
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-emerald-500/50 transition-all font-mono text-white placeholder:text-gray-700"
                required
              />
            </div>
          </div>

          <button 
            type="submit" disabled={isSubmitting}
            className="w-full mt-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all active:scale-95 disabled:opacity-40"
          >
            {isSubmitting ? '안전 인증 채널 동기화 중...' : '인증 및 크레딧 충전 완료'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CreditCardModal;