import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  Bitcoin,
  Building2,
  Coins,
  CreditCard,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  Settings,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Entrées de la navigation latérale, dans l'ordre demandé. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/bourse', label: 'Bourse', icon: TrendingUp },
  { to: '/crypto', label: 'Crypto', icon: Bitcoin },
  { to: '/immobilier', label: 'Immobilier', icon: Building2 },
  { to: '/liquidites', label: 'Liquidités', icon: Banknote },
  { to: '/assurance-vie', label: 'Assurance-vie', icon: ShieldCheck },
  { to: '/retraite', label: 'Épargne retraite', icon: PiggyBank },
  { to: '/autres', label: 'Autres actifs', icon: Coins },
  { to: '/passifs', label: 'Passifs', icon: CreditCard },
  { to: '/evolution', label: 'Évolution', icon: LineChart },
  { to: '/reglages', label: 'Réglages', icon: Settings },
];
