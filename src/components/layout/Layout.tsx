import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { RefreshQuotesButton } from './RefreshQuotesButton';
import { useStore } from '../../store/useStore';
import { netWorth } from '../../lib/calculations';
import { formatCurrency } from '../../lib/format';

/** Coquille de l'application : sidebar + barre supérieure + contenu. */
export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const assets = useStore((s) => s.assets);
  const total = netWorth(assets);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400">Patrimoine net</p>
              <p className="text-lg font-semibold">{formatCurrency(total)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshQuotesButton />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
