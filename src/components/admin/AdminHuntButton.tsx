import React, { useState } from 'react';
import { triggerHunt } from '../../services/pythonApiService';
import { Rocket, Loader2, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

interface AdminHuntButtonProps {
  className?: string;
}

export const AdminHuntButton: React.FC<AdminHuntButtonProps> = ({ className }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleClick = async () => {
    // 환경 변수에서 Admin Key 가져오기
    const adminKey = import.meta.env.VITE_ADMIN_SECRET_KEY;
    
    if (!adminKey) {
      setStatus('error');
      setMessage('Admin key not configured');
      return;
    }

    setStatus('loading');
    setMessage('수집 봇 발사 중...');

    const result = await triggerHunt(adminKey);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      // 10초 후 상태 초기화
      setTimeout(() => setStatus('idle'), 10000);
    } else {
      setStatus('error');
      setMessage(result.message);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>수집 중...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>발사 완료!</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>오류 발생</span>
          </>
        );
      default:
        return (
          <>
            <Rocket className="w-4 h-4" />
            <span>수동 수집 실행</span>
          </>
        );
    }
  };

  return (
    <div className={clsx("flex flex-col items-start gap-2", className)}>
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
          status === 'idle' && "bg-indigo-600 hover:bg-indigo-500 text-white",
          status === 'loading' && "bg-indigo-600/50 text-indigo-300 cursor-not-allowed",
          status === 'success' && "bg-emerald-600 text-white",
          status === 'error' && "bg-rose-600 text-white"
        )}
      >
        {getButtonContent()}
      </button>

      {message && (
        <p className={clsx(
          "text-xs flex items-center gap-1",
          status === 'success' && "text-emerald-400",
          status === 'error' && "text-rose-400",
          status === 'loading' && "text-slate-400"
        )}>
          <ShieldAlert className="w-3 h-3" />
          {message}
        </p>
      )}
    </div>
  );
};
