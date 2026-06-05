import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Snapshot } from '../../types';
import { formatCurrency, formatDate } from '../../lib/format';

interface NetWorthLineProps {
  snapshots: Snapshot[];
}

interface ChartPoint {
  date: string;
  label: string;
  netWorth: number;
}

interface TooltipPayloadItem {
  payload: ChartPoint;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md dark:border-slate-700 dark:bg-slate-800">
      <p className="font-medium">{formatDate(d.date)}</p>
      <p className="text-slate-500 dark:text-slate-300">
        {formatCurrency(d.netWorth)}
      </p>
    </div>
  );
}

/** Courbe d'évolution du patrimoine net à partir des snapshots. */
export function NetWorthLine({ snapshots }: NetWorthLineProps) {
  const data: ChartPoint[] = snapshots.map((s) => ({
    date: s.date,
    label: formatDate(s.date),
    netWorth: s.netWorth,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-400">
        Aucun instantané enregistré pour le moment.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1b5cf5" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#1b5cf5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          stroke="currentColor"
          className="text-slate-400"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          width={80}
          stroke="currentColor"
          className="text-slate-400"
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="#1b5cf5"
          strokeWidth={2}
          fill="url(#nwGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
