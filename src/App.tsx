import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useStore } from './store/useStore';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Bourse from './pages/Bourse';
import Crypto from './pages/Crypto';
import Immobilier from './pages/Immobilier';
import Liquidites from './pages/Liquidites';
import AssuranceVie from './pages/AssuranceVie';
import Retraite from './pages/Retraite';
import Autres from './pages/Autres';
import Passifs from './pages/Passifs';
import Evolution from './pages/Evolution';
import Reglages from './pages/Reglages';
import NotFound from './pages/NotFound';

export default function App() {
  const init = useStore((s) => s.init);
  const loaded = useStore((s) => s.loaded);

  useEffect(() => {
    void init();
  }, [init]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        <Loader2 className="mr-2 animate-spin" size={20} />
        Chargement…
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="bourse" element={<Bourse />} />
        <Route path="crypto" element={<Crypto />} />
        <Route path="immobilier" element={<Immobilier />} />
        <Route path="liquidites" element={<Liquidites />} />
        <Route path="assurance-vie" element={<AssuranceVie />} />
        <Route path="retraite" element={<Retraite />} />
        <Route path="autres" element={<Autres />} />
        <Route path="passifs" element={<Passifs />} />
        <Route path="evolution" element={<Evolution />} />
        <Route path="reglages" element={<Reglages />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
