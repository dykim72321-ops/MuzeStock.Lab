import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
