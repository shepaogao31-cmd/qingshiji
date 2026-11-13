import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Flame,
  Zap,
  Target,
  Activity,
  Search,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { useExerciseRecords } from '@/hooks/useExerciseRecords';
import { useProfile } from '@/hooks/useProfile';
import { useGoal } from '@/hooks/useGoal';
import { useDietRecords } from '@/hooks/useDietRecords';
import { MOCK_MOVEMENTS, type IMovement } from '@/data/met';
import { todayStr, formatDate, parseDateStr } from '@/lib/utils';
import { calcExerciseCalories } from '@/lib/calculations';
import EmptyState from '@/components/EmptyState';

export default function ExercisePage() {
  const navigate = useNavigate();
  const { profile, isSet, getTargets } = useProfile();
  const { goal } = useGoal();
  const { weeklyHours, getDayRecords, addRecord, removeRecord, dayTotal } =
    useExerciseRecords(profile.weight || 60);
  const { getDayRecords: getDietDayRecords } = useDietRecords();

  const [currentDate, setCurrentDate] = useState(todayStr());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<IMovement | null>(null);
  const [duration, setDuration] = useState('30');

  const targets = isSet ? getTargets(goal.type, weeklyHours) : null;
  const bmr = targets?.metrics.bmr ?? 0;
  const targetCal = targets?.targetCalories ?? 2000;

  const dayExercise = getDayRecords(currentDate);
  const dayDiet = getDietDayRecords(currentDate);
  const isToday = currentDate === todayStr();

  const dayCaloriesBurned = dayExercise.reduce((a, b) => a + b.calories, 0);
  const dayDuration = dayExercise.reduce((a, b) => a + b.duration, 0);
  const dayCaloriesConsumed = dayDiet.reduce((a, b) => a + b.calories, 0);

  const totalBurned = bmr + dayCaloriesBurned;
  const balance = totalBurned - dayCaloriesConsumed; // 正=缺口
  const balanceLabel = balance >= 0 ? '热量缺口' : '热量盈余';
  const hasData = dayCaloriesConsumed > 0 || dayCaloriesBurned > 0;
  const balanceStatus = !hasData
    ? '暂无数据'
    : goal.type === 'fat'
    ? balance >= 200
      ? '减脂友好'
      : balance > 0
      ? '轻度缺口'
      : balance === 0
      ? '收支平衡'
      : '超标'
    : balance <= -200
    ? '增肌盈余'
    : balance < 0
    ? '轻度盈余'
    : balance === 0
    ? '收支平衡'
    : '不足';
  const balanceColor = !hasData
    ? 'text-muted-foreground'
    : goal.type === 'fat'
    ? balance >= 200
      ? 'text-success'
      : balance > 0
      ? 'text-primary'
      : balance === 0
      ? 'text-muted-foreground'
      : 'text-warning'
    : balance <= -200
    ? 'text-success'
    : balance < 0
    ? 'text-primary'
    : balance === 0
    ? 'text-muted-foreground'
    : 'text-warning';

  const changeDate = (delta: number) => {
    const d = parseDateStr(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(formatDate(d));
  };

  const filteredMovements = useMemo(() => {
    if (!keyword.trim()) return MOCK_MOVEMENTS;
    return MOCK_MOVEMENTS.filter((m) =>
      m.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [keyword]);

  const handleAdd = () => {
    if (!selectedMovement) {
      toast.error('请选择运动类型');
      return;
    }
    const mins = parseFloat(duration) || 30;
    addRecord({
      movement: selectedMovement,
      duration: mins,
      date: currentDate,
      weight: profile.weight || 60,
    });
    toast.success(`已添加 ${selectedMovement.name}`);
    setSheetOpen(false);
    setSelectedMovement(null);
    setDuration('30');
    setKeyword('');
  };

  const previewCalories = selectedMovement
    ? calcExerciseCalories(selectedMovement.met, profile.weight || 60, parseFloat(duration) || 0)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 pt-4">
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
            <h1 className="text-[16px] font-medium text-foreground">运动记录</h1>
          </div>
        </div>

        {/* 日期选择 */}
        <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-card px-2 py-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeDate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-medium text-foreground">
              {currentDate}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isToday ? '今天' : ''}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => changeDate(1)}
            disabled={isToday}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* 热量平衡卡 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-foreground">今日热量平衡</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Target className="size-3 text-success" />
                  摄入
                </div>
                <div className="mt-0.5 text-base font-semibold text-foreground tabular-nums">
                  {Math.round(dayCaloriesConsumed)}
                </div>
                <div className="text-[10px] text-muted-foreground">kcal</div>
              </div>
              <div className="border-x border-border/70">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Flame className="size-3 text-primary" />
                  总消耗
                </div>
                <div className="mt-0.5 text-base font-semibold text-foreground tabular-nums">
                  {Math.round(totalBurned)}
                </div>
                <div className="text-[10px] text-muted-foreground">kcal</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Zap className="size-3 text-warning" />
                  {balanceLabel}
                </div>
                <div className={`mt-0.5 text-base font-semibold tabular-nums ${balanceColor}`}>
                  {Math.abs(Math.round(balance))}
                </div>
                <div className="text-[10px] text-muted-foreground">kcal</div>
              </div>
            </div>
            <div className="mt-3 text-center text-xs">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 text-primary"
              >
                {balanceStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 运动消耗汇总 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs text-muted-foreground">运动消耗</div>
              <div className="text-xl font-semibold text-foreground tabular-nums">
                {dayCaloriesBurned}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  kcal
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                共 {dayDuration} 分钟
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-md bg-primary/10">
              <Activity className="size-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* 运动记录列表 */}
        <div className="mt-3 pb-24">
          <h3 className="mb-2 text-sm font-medium text-foreground">运动记录</h3>
          {dayExercise.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="今日还未记录运动"
              description="添加运动记录，追踪每日消耗"
            />
          ) : (
            <div className="space-y-2">
              {dayExercise.map((r) => (
                <Card key={r.id} className="border-border shadow-sm">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md bg-info/10">
                        <Activity className="size-4 text-info" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {r.exerciseType}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.duration} 分钟 · MET {r.met}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {r.calories}
                      </span>
                      <span className="text-[11px] text-muted-foreground">kcal</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="!size-7"
                        onClick={() => removeRecord(r.id)}
                        aria-label="删除"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加运动悬浮按钮 */}
      <div className="fixed bottom-20 left-0 right-0 z-30 flex justify-center px-4">
        <div className="mx-auto w-full max-w-md">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="default" className="h-9 w-full shadow-sm">
                <Plus className="mr-1.5 size-4" />
                添加运动
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-md px-0 pb-0">
              <SheetHeader className="px-4 pb-2">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-base font-medium">添加运动</SheetTitle>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="!size-8">
                      <X className="size-4" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="space-y-3 px-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索运动类型"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="h-9 pl-9"
                  />
                </div>

                <div className="max-h-[40vh] space-y-1.5 overflow-y-auto pr-1">
                  {filteredMovements.length === 0 ? (
                    <EmptyState title="未找到相关运动" />
                  ) : (
                    filteredMovements.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMovement(m)}
                        className={`flex w-full items-center justify-between rounded-md border p-2.5 text-left transition-colors ${
                          selectedMovement?.id === m.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {m.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            MET {m.met} ·{' '}
                            {m.intensity === 'low'
                              ? '低强度'
                              : m.intensity === 'medium'
                              ? '中强度'
                              : '高强度'}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`ml-2 shrink-0 text-[10px] ${
                            m.intensity === 'high'
                              ? 'border-warning/40 text-warning'
                              : m.intensity === 'medium'
                              ? 'border-primary/40 text-primary'
                              : ''
                          }`}
                        >
                          {m.category === 'cardio'
                            ? '有氧'
                            : m.category === 'strength'
                            ? '力量'
                            : m.category === 'flexibility'
                            ? '柔韧'
                            : '日常'}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>

                {selectedMovement && (
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-xs text-muted-foreground">时长</span>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="h-9 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">分钟</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      约消耗 {previewCalories} kcal（按体重 {profile.weight || 60}kg 估算）
                    </div>
                    <Button className="h-8 w-full" onClick={handleAdd}>
                      添加运动记录
                    </Button>
                  </div>
                )}
              </div>
              <div className="h-8" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
