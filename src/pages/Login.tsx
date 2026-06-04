import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google'; 
import axios from 'axios';

interface LoginProps {
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const [step, setStep] = useState<'login' | 'signup' | 'already_logged_in'>('login');
  const [userData, setUserData] = useState({ nickname: '' });

  const API_BASE_URL = 'https://oxxultus.cloud'; 

  useEffect(() => {
    const token = localStorage.getItem('aeranghae_token');
    const userName = localStorage.getItem('aeranghae_user_name');
    if (token && userName) {
      setUserData({ nickname: userName });
      setStep('already_logged_in');
    }
  }, []);

  const handleLoginSuccess = async (credentialResponse: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
        credential: credentialResponse.credential
      });

      const { accessToken, name, role, nickname } = response.data;
      localStorage.setItem('aeranghae_token', accessToken);

      if (role === 'USER') {
        const finalName = nickname || name;
        localStorage.setItem('aeranghae_user_name', finalName);
        setUserData({ nickname: finalName });
        setStep('already_logged_in');
        return;
      }

      if (role === 'GUEST') {
        setStep('signup');
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      alert("인증에 실패했습니다.");
    }
  };

  const handleSignupSubmit = async () => {
    const token = localStorage.getItem('aeranghae_token');
    if (!userData.nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    try {
      // 1. 닉네임 설정 요청 (DB 업데이트)
      await axios.post(`${API_BASE_URL}/api/user/signup`, 
        { nickname: userData.nickname },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2.가입 성공 후 서버에서 최신 정보(Role.USER가 된 상태)를 다시 가져옴
      const userRes = await axios.get(`${API_BASE_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. 로컬 스토리지에 최신 닉네임 저장 및 종료
      localStorage.setItem('aeranghae_user_name', userRes.data.nickname);
      alert("가입이 완료되었습니다!");
      onClose(); 
    } catch (error) {
      console.error("가입 에러:", error);
      alert("닉네임 설정 중 오류 발생");
    }
  };

  return (
    <div className="relative w-[768px] h-[480px] bg-[#1C1C1E] rounded-[30px] overflow-hidden shadow-2xl border border-white/5 flex text-white font-sans animate-in zoom-in-95 duration-300">
      <button onClick={onClose} className="absolute top-6 right-6 z-[110] p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-all">
        <X size={20} />
      </button>

      <div className="flex-1 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <h1 className="text-4xl font-black tracking-tighter mb-6 text-[32px]">VELO</h1>
          <p className="text-base opacity-90 leading-relaxed font-medium max-w-[240px]">아이디어를 실제 코드로 바꾸는 가장 스마트한 방법</p>
          <div className="mt-10 flex items-center gap-2 text-xs font-bold tracking-widest text-white/50 uppercase">
              <Sparkles size={14} /> VELO Platform
          </div>
      </div>

      <div className="flex-1 bg-[#1C1C1E] p-12 flex flex-col justify-center items-center">
        {step === 'already_logged_in' ? (
          <div className="w-full max-w-[280px] text-center">
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
              <ShieldCheck size={40} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">현재 <span className="text-white font-bold">{userData.nickname}</span>님으로<br/>로그인되어 있습니다.</p>
            <button onClick={onClose} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
              대시보드로 입장하기 <ArrowRight size={18} />
            </button>
          </div>
        ) : step === 'login' ? (
          <div className="w-full max-w-[280px] text-center animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Welcome</h2>
            <p className="text-gray-400 text-sm mb-10">Google 계정으로 간편하게 시작하세요.</p>
            <div className="flex justify-center scale-110 mb-8">
              <GoogleLogin onSuccess={handleLoginSuccess} onError={() => alert("인증 실패")} theme="filled_black" shape="pill" />
            </div>
            <button onClick={onClose} className="text-xs text-gray-500 hover:text-blue-400 transition-all underline underline-offset-4">
              로그인 없이 게스트로 시작하기
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[280px] text-center animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Almost Done!</h2>
            <p className="text-gray-400 text-sm mb-8 font-sans">
              AERANGHAE에서 사용할 <br/> 
              <span className="text-blue-400 font-bold">닉네임을 설정해주세요.</span>
            </p>
            <div className="space-y-4">
              <input 
                type="text" 
                value={userData.nickname} 
                onChange={(e) => setUserData({nickname: e.target.value})} 
                placeholder="닉네임 입력" 
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-all" 
              />
              <button onClick={handleSignupSubmit} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                <CheckCircle size={18} /> 설정 완료하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;