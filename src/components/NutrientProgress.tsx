interface NutrientProgressProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: string;
}

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
};

export default function NutrientProgress({
  label,
  value,
  target,
  unit = 'g',
  color,
}: NutrientProgressProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const barColor = COLOR_MAP[color] || 'bg-primary';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {Math.round(value)}{unit} / {Math.round(target)}{unit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-muted">
        <div
          className={`h-full rounded-sm ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
