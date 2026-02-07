// src/services/pythonService.ts
import axios from 'axios';

// 1. 개발 환경(Proxy) vs 배포 환경(URL) 자동 구분
const BASE_URL = import.meta.env.PROD 
  ? 'https://your-railway-app.com' // 배포 후엔 실제 주소 입력
  : '/py-api'; // 로컬에선 vite.config.ts의 프록시 사용

// 2. 관리자 키 가져오기 (.env)
const ADMIN_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY;

// API 클라이언트 설정
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pythonService = {
  // [기능 1] 사냥 시작 (관리자 전용)
  triggerHunt: async () => {
    try {
      const response = await api.post('/api/hunt', {}, {
        headers: {
          'X-Admin-Key': ADMIN_KEY // 👈 핵심: 인증 헤더 추가
        }
      });
      return response.data;
    } catch (error) {
      console.error("Hunt trigger failed:", error);
      throw error;
    }
  },

  // [기능 2] 최근 발견된 보석 조회 (수집 현황)
  getDiscoveries: async () => {
    try {
      const response = await api.get('/api/discoveries');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch discoveries:", error);
      return [];
    }
  },

  // [기능 4] 타임머신 백테스팅
  backtestStock: async (ticker: string, period: string = "1y", initialCapital: number = 10000.0) => {
    try {
      const response = await api.post('/api/backtest', { 
        ticker, 
        period, 
        initial_capital: initialCapital 
      });
      return response.data;
    } catch (error) {
      console.error("Backtest failed:", error);
      throw error;
    }
  }
};
