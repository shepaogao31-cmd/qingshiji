interface CalorieRingProps {
  consumed: number;
  burned: number; // 总消耗（基础代谢+运动）
  target: number; // 目标热量
  size?: number;
}

export default function CalorieRing({
  consumed,
  burned,
  target,
  size = 200,
}: CalorieRingProps) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // 摄入进度（占目标的比例）
  const consumeProgress = Math.min(consumed / Math.max(target, 1), 1);
  const consumeOffset = circumference * (1 - consumeProgress);

  // 消耗进度（虚线，从另一侧）
  const burnProgress = Math.min(burned / Math.max(target, 1), 1);
  const burnOffset = circumference * (1 - burnProgress);

  const deficit = burned - consumed; // 正=缺口，负=盈余
  const deficitLabel = deficit >= 0 ? '热量缺口' : '热量盈余';
  const deficitColor = deficit >= 0 ? 'text-success' : 'text-warning';

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* 背景轨道 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        {/* 消耗进度（外层，虚线） */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + stroke + 4}
          fill="none"
          stroke="hsl(var(--chart-3))"
          strokeWidth={4}
          strokeDasharray="6 4"
          strokeDashoffset={burnOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
        {/* 摄入进度 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={consumeOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      {/* 中心文字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs text-muted-foreground">今日摄入</div>
        <div className="text-2xl font-semibold text-foreground tabular-nums">
          {Math.round(consumed)}
        </div>
        <div className="text-xs text-muted-foreground">
          / {Math.round(target)} kcal
        </div>
        <div className={`mt-1 text-xs font-medium ${deficitColor}`}>
          {deficitLabel} {Math.abs(Math.round(deficit))} kcal
        </div>
      </div>
    </div>
  );
}
