import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useStore } from './lib/store';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import NewDocument from './pages/NewDocument';
import SavedDocuments from './pages/SavedDocuments';
import Products from './pages/Products';
import Parties from './pages/Parties';
import Settings from './pages/Settings';

function Layout() {
  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <main className="flex-1 min-w-0 px-[30px] pt-[26px] pb-[60px]">
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}

function BootGate({ children }) {
  const loaded = useStore((s) => s.loaded);
  const loadError = useStore((s) => s.loadError);
  const loadAll = useStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loadError) {
    return (
      <CenterCard>
        <div className="text-danger font-semibold">{loadError}</div>
        <button
          className="mt-4 text-sm text-accent-dark underline"
          onClick={() => loadAll()}
        >
          Retry
        </button>
      </CenterCard>
    );
  }

  if (!loaded) {
    return (
      <CenterCard>
        <span className="text-muted">Loading…</span>
      </CenterCard>
    );
  }

  return children;
}

function CenterCard({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-paper border border-bordr rounded-xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 rounded-lg bg-accent text-white flex items-center justify-center text-lg font-bold">
          B
        </div>
        <h1 className="text-lg font-semibold text-navy mb-2">Bellavo Billing</h1>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BootGate>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="new" element={<NewDocument />} />
            <Route path="saved" element={<SavedDocuments />} />
            <Route path="products" element={<Products />} />
            <Route path="parties" element={<Parties />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BootGate>
    </BrowserRouter>
  );
}
