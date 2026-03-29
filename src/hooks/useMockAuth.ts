import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useMockAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const signIn = async (redirectUrl: string = '/stock/dashboard') => {
    setIsLoading(true);
    // 0.8초의 인위적 지연으로 실제 네트워크 요청처럼 시뮬레이션
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsAuthenticated(true);
        setIsLoading(false);
        resolve();
        navigate(redirectUrl, { replace: true });
      }, 800);
    });
  };

  const signOut = () => {
    setIsAuthenticated(false);
    navigate('/', { replace: true });
  };

  return {
    isLoading,
    isAuthenticated,
    signIn,
    signOut
  };
}
