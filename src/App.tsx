import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { StockScreener } from './components/dashboard/StockScreener';
import { WatchlistView } from './components/dashboard/WatchlistView';
import { SettingsView } from './components/dashboard/SettingsView';
import { DnaMatchView } from './components/analysis/DnaMatchView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<StockScreener />} /> {/* Step 1: Discovery is Home */}
          <Route path="scan" element={<Navigate to="/" replace />} />
          <Route path="scanner" element={<Navigate to="/" replace />} />
          <Route path="stock/:id" element={<DnaMatchView />} /> {/* Step 3: Analysis */}
          <Route path="watchlist" element={<WatchlistView />} /> {/* Step 2: Exploration */}
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
