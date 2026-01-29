import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { MorningBrief } from './components/dashboard/MorningBrief';
import { StockScreener } from './components/dashboard/StockScreener';
import { DnaMatchView } from './components/analysis/DnaMatchView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MorningBrief />} />
          <Route path="scan" element={<StockScreener />} />
          <Route path="scanner" element={<StockScreener />} />
          <Route path="stock/:id" element={<DnaMatchView />} />
          <Route path="watchlist" element={<Navigate to="/scanner" replace />} />
          <Route path="settings" element={<div className="text-slate-500 p-8 text-center">Settings panel coming soon</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
