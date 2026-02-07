import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { DailyPicks } from './components/dashboard/DailyPicks';
import { WatchlistView } from './components/dashboard/WatchlistView';
import { SettingsView } from './components/dashboard/SettingsView';
import { DnaMatchView } from './components/analysis/DnaMatchView';
import { BacktestingDashboard } from './components/dashboard/BacktestingDashboard';
import { PersonaPerformance } from './components/dashboard/PersonaPerformance';
import { SimulatorView } from './components/dashboard/SimulatorView';
import { ScannerPage } from './pages/ScannerPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/" element={<DailyPicks />} /> {/* Step 1: Discovery with AI Rankings */}
              <Route path="scan" element={<Navigate to="/scanner" replace />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="stock/:id" element={<DnaMatchView />} /> {/* Step 3: Analysis */}
              <Route path="watchlist" element={<WatchlistView />} /> {/* Step 2: Exploration */}
              <Route path="backtesting" element={<BacktestingDashboard />} />
              <Route path="personas" element={<PersonaPerformance />} />
              <Route path="simulator" element={<SimulatorView />} />
              <Route path="settings" element={<SettingsView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
