import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Skeleton } from './components/ui/Skeleton';
import { queryClient } from './lib/queryClient';

// Lazy Loading 적용으로 초기 로딩 속도 개선
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ScannerPage = lazy(() => import('./pages/ScannerPage').then(m => ({ default: m.ScannerPage })));
const DnaMatchView = lazy(() => import('./components/analysis/DnaMatchView').then(m => ({ default: m.DnaMatchView })));
const WatchlistView = lazy(() => import('./components/dashboard/WatchlistView').then(m => ({ default: m.WatchlistView })));
const SimulatorView = lazy(() => import('./components/dashboard/SimulatorView').then(m => ({ default: m.SimulatorView })));
const PersonaPerformance = lazy(() => import('./components/dashboard/PersonaPerformance').then(m => ({ default: m.PersonaPerformance })));
const BacktestingDashboard = lazy(() => import('./components/dashboard/BacktestingDashboard').then(m => ({ default: m.BacktestingDashboard })));
const SettingsView = lazy(() => import('./components/dashboard/SettingsView').then(m => ({ default: m.SettingsView })));

// 로딩 폴백 컴포넌트
const PageLoadingFallback = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-[60px] w-full" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-[300px] w-full lg:col-span-2" />
      <Skeleton className="h-[300px] w-full" />
    </div>
    <Skeleton className="h-[400px] w-full" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Step 1: Discovery - AI 기반 종목 발굴 */}
                <Route index element={<Dashboard />} />
                
                {/* Step 2: Exploration - 관심 종목 탐색 */}
                <Route path="scanner" element={<ScannerPage />} />
                <Route path="scan" element={<Navigate to="/scanner" replace />} />
                <Route path="watchlist" element={<WatchlistView />} />
                
                {/* Step 3: Analysis - 심층 분석 */}
                <Route path="analysis/:id" element={<DnaMatchView />} />
                {/* 하위 호환성 유지 */}
                <Route path="stock/:id" element={<Navigate to="/analysis/:id" replace />} />
                
                {/* Tools - 전략 시뮬레이션 */}
                <Route path="simulator" element={<SimulatorView />} />
                <Route path="backtesting" element={<BacktestingDashboard />} />
                <Route path="personas" element={<PersonaPerformance />} />
                
                {/* Settings */}
                <Route path="settings" element={<SettingsView />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
