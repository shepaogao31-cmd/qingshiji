import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, Flame, Zap, AlertTriangle, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { useProfile } from '@/hooks/useProfile';
import { useGoal } from '@/hooks/useGoal';
import { useExerciseRecords } from '@/hooks/useExerciseRecords';
import { calcBodyMetrics, calcTargetCalories, calcMacroTargets, calcWeightProgress } from '@/lib/calculations';
import { GOAL_LABELS } from '@/lib/constants';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, setProfile, isSet } = useProfile();
  const { goal, setGoal } = useGoal();
  const { weeklyHours } = useExerciseRecords(profile.weight || 60);

  const [height, setHeight] = useState(profile.height ? String(profile.height) : '');
  const [weight, setWeight] = useState(profile.weight ? String(profile.weight) : '');
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [gender, setGender] = useState<'male' | 'female'>(profile.gender ?? 'female');
  const [waist, setWaist] = useState(profile.waist ? String(profile.waist) : '');
  const [neck, setNeck] = useState(profile.neck ? String(profile.neck) : '');
  const [targetWeight, setTargetWeight] = useState(goal.targetWeight ? String(goal.targetWeight) : '');
  const [durationWeeks, setDurationWeeks] = useState(goal.durationWeeks ? String(goal.durationWeeks) : '');

  // 实时计算
  const metrics = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) return null;
    return calcBodyMetrics(
      {
        height: h,
        weight: w,
        age: age ? parseFloat(age) : undefined,
        gender,
        waist: waist ? parseFloat(waist) : undefined,
        neck: neck ? parseFloat(neck) : undefined,
      },
      weeklyHours,
    );
  }, [height, weight, age, gender, waist, neck, weeklyHours]);

  const targetInfo = useMemo(() => {
    if (!metrics) return null;
    return calcTargetCalories(goal.type, metrics.tdee, metrics.bmr);
  }, [metrics, goal.type]);

  const macroTargets = useMemo(() => {
    if (!targetInfo) return null;
    const w = parseFloat(weight);
    if (!w) return null;
    return calcMacroTargets(goal.type, targetInfo.target, w);
  }, [targetInfo, goal.type, weight]);

  const handleSave = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) {
      toast.error('请填写身高和体重');
      return;
    }
    setProfile({
      height: h,
      weight: w,
      age: age ? parseFloat(age) : undefined,
      gender,
      waist: waist ? parseFloat(waist) : undefined,
      neck: neck ? parseFloat(neck) : undefined,
    });
    // 保存目标体重和周期
    const tw = parseFloat(targetWeight);
    const dw = parseFloat(durationWeeks);
    setGoal({
      type: goal.type,
      targetWeight: tw > 0 ? tw : undefined,
      durationWeeks: dw > 0 ? dw : undefined,
    });
    toast.success('已保存身体数据和目标设置');
    navigate(-1);
  };

  const handleGoalChange = (type: 'muscle' | 'fat') => {
    setGoal({ type });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 pt-4 pb-28">
        {/* 顶部 */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="返回"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h1 className="text-[16px] font-medium text-foreground">身体数据</h1>
          </div>
        </div>

        {/* 必填项 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-medium text-foreground">
              基础信息 <span className="text-destructive">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">身高</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    className="h-9 pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    cm
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">体重</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="65"
                    className="h-9 pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 可选项（提高精度） */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="space-y-3 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              提高估算精度（可选）
              <Badge variant="outline" className="text-[10px]">
                推荐填写
              </Badge>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">年龄</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    className="h-9 pr-7"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    岁
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">性别</Label>
                <Tabs
                  value={gender}
                  onValueChange={(v) => setGender(v as 'male' | 'female')}
                >
                  <TabsList className="grid h-8 w-full grid-cols-2">
                    <TabsTrigger value="male" className="text-xs">
                      男
                    </TabsTrigger>
                    <TabsTrigger value="female" className="text-xs">
                      女
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">腰围</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="80"
                    className="h-9 pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    cm
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">颈围</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={neck}
                    onChange={(e) => setNeck(e.target.value)}
                    placeholder="35"
                    className="h-9 pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    cm
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 实时计算结果 */}
        {metrics && (
          <Card className="mt-3 border-border shadow-sm">
            <CardContent className="space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Zap className="size-4 text-primary" />
                实时计算结果
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md border border-border/60 bg-card p-2">
                  <div className="text-[11px] text-muted-foreground">BMI</div>
                  <div className="text-base font-semibold text-foreground tabular-nums">
                    {metrics.bmi}
                  </div>
                </div>
                <div className="rounded-md border border-border/60 bg-card p-2">
                  <div className="text-[11px] text-muted-foreground">体脂率</div>
                  <div className="text-base font-semibold text-foreground tabular-nums">
                    {metrics.bodyFat ?? '--'}
                    <span className="text-xs font-normal text-muted-foreground">
                      {metrics.bodyFat ? '%' : ''}
                    </span>
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {metrics.bodyFatAccuracy === 'high'
                      ? '估算值·高精度'
                      : metrics.bodyFatAccuracy === 'basic'
                      ? '估算值·普通精度'
                      : '数据不足'}
                  </div>
                </div>
                <div className="rounded-md border border-border/60 bg-card p-2">
                  <div className="text-[11px] text-muted-foreground">
                    <Flame className="inline size-3 text-primary" /> BMR
                  </div>
                  <div className="text-base font-semibold text-foreground tabular-nums">
                    {metrics.bmr}
                  </div>
                  <div className="text-[9px] text-muted-foreground">kcal</div>
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-card p-2 text-center">
                <div className="text-[11px] text-muted-foreground">
                  TDEE 每日总消耗（{metrics.activityLevel}）
                </div>
                <div className="text-base font-semibold text-foreground tabular-nums">
                  {metrics.tdee}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    kcal
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 目标设置 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="space-y-3 p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Target className="size-4 text-primary" />
              我的目标
            </h3>
            <Tabs
              value={goal.type}
              onValueChange={(v) => handleGoalChange(v as 'muscle' | 'fat')}
            >
              <TabsList className="grid h-8 w-full grid-cols-2">
                <TabsTrigger value="fat" className="text-xs">
                  减脂
                </TabsTrigger>
                <TabsTrigger value="muscle" className="text-xs">
                  增肌
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 目标体重 + 周期 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">目标体重（可选）</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="60"
                    className="h-9 pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    kg
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">目标周期（可选）</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(e.target.value)}
                    placeholder="8"
                    className="h-9 pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    周
                  </span>
                </div>
              </div>
            </div>

            {/* 目标进度预览 */}
            {targetWeight && parseFloat(targetWeight) > 0 && parseFloat(weight) > 0 && (
              <div className="rounded-md bg-muted/50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">当前 {weight}kg</span>
                  <span className="text-muted-foreground">目标 {targetWeight}kg</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-border/70">
                  <div
                    className="h-full rounded-sm bg-primary transition-all"
                    style={{
                      width: `${Math.min(Math.max(calcWeightProgress(parseFloat(weight), parseFloat(targetWeight), goal.type), 0), 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  {goal.type === 'fat'
                    ? parseFloat(weight) > parseFloat(targetWeight)
                      ? `距离目标还差 ${(parseFloat(weight) - parseFloat(targetWeight)).toFixed(1)} kg`
                      : parseFloat(weight) === parseFloat(targetWeight)
                      ? '已达成目标'
                      : `已超过目标 ${(parseFloat(targetWeight) - parseFloat(weight)).toFixed(1)} kg`
                    : parseFloat(weight) < parseFloat(targetWeight)
                    ? `距离目标还差 ${(parseFloat(targetWeight) - parseFloat(weight)).toFixed(1)} kg`
                    : parseFloat(weight) === parseFloat(targetWeight)
                    ? '已达成目标'
                    : `已超过目标 ${(parseFloat(weight) - parseFloat(targetWeight)).toFixed(1)} kg`}
                </div>
              </div>
            )}

            {targetInfo && (
              <div className="space-y-2 rounded-md bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">每日目标热量</span>
                  <span className="text-base font-semibold text-foreground tabular-nums">
                    {targetInfo.target}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      kcal
                    </span>
                  </span>
                </div>
                {macroTargets && (
                  <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-2 text-center">
                    <div>
                      <div className="text-xs font-medium text-foreground tabular-nums">
                        {macroTargets.protein}g
                      </div>
                      <div className="text-[10px] text-muted-foreground">蛋白质</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground tabular-nums">
                        {macroTargets.carbs}g
                      </div>
                      <div className="text-[10px] text-muted-foreground">碳水</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground tabular-nums">
                        {macroTargets.fat}g
                      </div>
                      <div className="text-[10px] text-muted-foreground">脂肪</div>
                    </div>
                  </div>
                )}
                {targetInfo.warning && (
                  <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{targetInfo.warning}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 云端同步（占位） */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Cloud className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">云端同步</div>
                <div className="text-[11px] text-muted-foreground">
                  多设备数据互通，即将上线
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              即将上线
            </Badge>
          </CardContent>
        </Card>

        {/* 保存按钮 —— 位于底部 Tab 上方 */}
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-2.5 backdrop-blur-md">
          <div className="mx-auto max-w-md">
            <Button className="h-9 w-full" onClick={handleSave}>
              保存数据
            </Button>
          </div>
          <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </div>
      </div>
    </div>
  );
}
