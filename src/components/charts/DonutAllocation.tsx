import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatPercent } from '../../lib/format';

export interface AllocationDatum {
  key: string;
  label: string;
  value: number;
  color: string;
  percent: number;
}

interface DonutAllocationProps {
  data: AllocationDatum[];
}

interface TooltipPayloadItem {
  payload: AllocationDatum;
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
      <p className="font-medium">{d.label}</p>
      <p className="text-slate-500 dark:text-slate-300">
        {formatCurrency(d.value)} · {formatPercent(d.percent)}
      </p>
    </div>
  );
}

/** Graphique en anneau (donut) de répartition des actifs. */
export function DonutAllocation({ data }: DonutAllocationProps) {
  const positive = data.filter((d) => d.value > 0);

  if (positive.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Aucun actif à répartir.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={positive}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          stroke="none"
        >
          {positive.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
