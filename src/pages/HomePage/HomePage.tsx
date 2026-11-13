import { useNavigate } from 'react-router-dom';
import { Settings, Utensils, Activity, Dumbbell, Flame, Target, Zap, TrendingDown, TrendingUp, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CalorieRing from '@/components/CalorieRing';
import NutrientProgress from '@/components/NutrientProgress';
import EmptyState from '@/components/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useGoal } from '@/hooks/useGoal';
import { useDietRecords } from '@/hooks/useDietRecords';
import { useExerciseRecords } from '@/hooks/useExerciseRecords';
import { GOAL_LABELS } from '@/lib/constants';
import { calcWeightProgress } from '@/lib/calculations';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const navigate = useNavigate();
  const { profile, isSet, getTargets } = useProfile();
  const { goal } = useGoal();
  const { daySummary } = useDietRecords();
  const { dayTotal, weeklyHours } = useExerciseRecords(profile.weight || 60);

  const targets = isSet ? getTargets(goal.type, weeklyHours) : null;
  const totalBurned = targets ? targets.metrics.bmr + dayTotal.totalCalories : 0;
  const targetCalories = targets?.targetCalories ?? 2000;

  if (!isSet) {
    return (
      <div className="min-h-screen px-4 pt-8">
        <div className="mx-auto max-w-md">
          <EmptyState
            icon={Target}
            title="开始你的健康之旅"
            description="先填写身体数据，我们将为你计算体脂率、基础代谢并定制专属计划"
            action={
              <Button onClick={() => navigate('/profile')}>
                填写身体数据
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const macros = targets?.macros ?? { protein: 100, carbs: 200, fat: 60 };
  const consumed = daySummary.sum;
  const bmr = targets?.metrics.bmr ?? 0;
  const tdee = targets?.metrics.tdee ?? 0;
  const bmi = targets?.metrics.bmi ?? 0;
  const bodyFat = targets?.metrics.bodyFat;
  const bodyFatAccuracy = targets?.metrics.bodyFatAccuracy ?? 'none';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 pt-4">
        {/* 顶部用户信息 */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm">
              {goal.type === 'fat' ? '减脂' : '增肌'}
            </div>
            <div>
              <div className="text-[15px] font-medium text-foreground">
                {GOAL_LABELS[goal.type]}
              </div>
              <div className="text-xs text-muted-foreground">
                {profile.weight}kg · 目标 {targetCalories} kcal
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            aria-label="设置"
          >
            <Settings className="size-4" />
          </Button>
        </div>

        {/* 热量进度环 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="flex items-center justify-center p-6">
            <CalorieRing
              consumed={consumed.calories}
              burned={totalBurned}
              target={targetCalories}
              size={200}
            />
          </CardContent>
        </Card>

        {/* 身体指标卡片 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="grid grid-cols-4 gap-1 px-2 py-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Gauge className="size-3.5 text-info" />
                BMI
              </div>
              <div className="mt-1 text-base font-semibold text-foreground tabular-nums">
                {bmi || '--'}
              </div>
              <div className="text-[10px] text-muted-foreground">kg/m²</div>
            </div>
            <div className="border-l border-border/70 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Flame className="size-3.5 text-primary" />
                基础代谢
              </div>
              <div className="mt-1 text-base font-semibold text-foreground tabular-nums">
                {bmr}
              </div>
              <div className="text-[10px] text-muted-foreground">kcal</div>
            </div>
            <div className="border-l border-border/70 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Zap className="size-3.5 text-warning" />
                总消耗
              </div>
              <div className="mt-1 text-base font-semibold text-foreground tabular-nums">
                {tdee}
              </div>
              <div className="text-[10px] text-muted-foreground">kcal</div>
            </div>
            <div className="border-l border-border/70 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Target className="size-3.5 text-success" />
                体脂率
              </div>
              <div className="mt-1 text-base font-semibold text-foreground tabular-nums">
                {bodyFat ?? '--'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {bodyFat ? '%' : '--'}
                {bodyFatAccuracy === 'high' && (
                  <Badge
                    variant="outline"
                    className="ml-0.5 scale-75 border-success/40 text-[9px] text-success"
                  >
                    高精度
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 目标体重进度 */}
        {goal.targetWeight && goal.targetWeight > 0 && (
          <Card className="mt-3 border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {goal.type === 'fat' ? (
                    <TrendingDown className="size-4 text-primary" />
                  ) : (
                    <TrendingUp className="size-4 text-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    体重目标进度
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {profile.weight}kg → {goal.targetWeight}kg
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${calcWeightProgress(profile.weight, goal.targetWeight, goal.type)}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {goal.type === 'fat'
                    ? profile.weight > goal.targetWeight
                      ? `距离目标还差 ${(profile.weight - goal.targetWeight).toFixed(1)} kg`
                      : profile.weight === goal.targetWeight
                      ? '已达成目标'
                      : `已超过目标 ${(goal.targetWeight - profile.weight).toFixed(1)} kg`
                    : profile.weight < goal.targetWeight
                    ? `距离目标还差 ${(goal.targetWeight - profile.weight).toFixed(1)} kg`
                    : profile.weight === goal.targetWeight
                    ? '已达成目标'
                    : `已超过目标 ${(profile.weight - goal.targetWeight).toFixed(1)} kg`}
                </span>
                <span className="font-medium text-primary">
                  {calcWeightProgress(profile.weight, goal.targetWeight, goal.type)}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 三大营养素进度 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-medium text-foreground">今日营养</h3>
            <NutrientProgress
              label="蛋白质"
              value={consumed.protein}
              target={macros.protein}
              color="info"
            />
            <NutrientProgress
              label="碳水化合物"
              value={consumed.carbs}
              target={macros.carbs}
              color="warning"
            />
            <NutrientProgress
              label="脂肪"
              value={consumed.fat}
              target={macros.fat}
              color="destructive"
            />
          </CardContent>
        </Card>

        {/* 健康警告 */}
        {targets?.warning && (
          <div className="mt-3 rounded-md border border-destructive/30 bg-error/5 p-3 text-xs text-destructive">
            ⚠️ {targets.warning}
          </div>
        )}

        {/* 快捷入口 */}
        <div className="mt-3 grid grid-cols-3 gap-2 pb-4">
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-3"
            onClick={() => navigate('/diet')}
          >
            <Utensils className="size-5 text-primary" />
            <span className="text-xs font-normal">记录饮食</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-3"
            onClick={() => navigate('/exercise')}
          >
            <Activity className="size-5 text-info" />
            <span className="text-xs font-normal">记录运动</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-3"
            onClick={() => navigate('/training')}
          >
            <Dumbbell className="size-5 text-chart-5" />
            <span className="text-xs font-normal">训练计划</span>
          </Button>
        </div>

        {/* 底部留白避免 Tab 遮挡 */}
        <div className="h-2" />
      </div>
    </div>
  );
}
