import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { StockScreener } from './components/dashboard/StockScreener';
import { DnaMatchView } from './components/analysis/DnaMatchView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<StockScreener />} /> {/* Step 1: Discovery is Home */}
          <Route path="scan" element={<Navigate to="/" replace />} />
          <Route path="scanner" element={<Navigate to="/" replace />} />
          <Route path="stock/:id" element={<DnaMatchView />} /> {/* Step 3: Analysis */}
          <Route path="watchlist" element={<Navigate to="/" replace />} />
          <Route path="settings" element={<div className="text-slate-500 p-8 text-center">Settings panel coming soon</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
