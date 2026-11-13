import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { useDietRecords, type IDietRecord } from '@/hooks/useDietRecords';
import { useProfile } from '@/hooks/useProfile';
import { useGoal } from '@/hooks/useGoal';
import { useExerciseRecords } from '@/hooks/useExerciseRecords';
import { useFoodLibrary } from '@/hooks/useFoodLibrary';
import {
  MEAL_LABELS,
  MEAL_ORDER,
  type MealType,
} from '@/lib/constants';
import { todayStr, formatDate, parseDateStr } from '@/lib/utils';
import NutrientProgress from '@/components/NutrientProgress';
import EmptyState from '@/components/EmptyState';
import DietRecommendation from '@/components/DietRecommendation';
import type { IFood } from '@/data/foods';

export default function DietPage() {
  const navigate = useNavigate();
  const { profile, isSet, getTargets } = useProfile();
  const { goal } = useGoal();
  const { weeklyHours } = useExerciseRecords(profile.weight || 60);
  const { daySummary, addRecord, removeRecord, getDayRecords } = useDietRecords();
  const {
    allFoods,
    customFoods,
    dailyFoods,
    restaurantFoods,
    addCustomFood,
    updateCustomFood,
    removeCustomFood,
  } = useFoodLibrary();

  const [currentDate, setCurrentDate] = useState(todayStr());
  const [activeMeal, setActiveMeal] = useState<MealType>('lunch');

  const targets = isSet ? getTargets(goal.type, weeklyHours) : null;
  const macros = targets?.macros ?? { protein: 100, carbs: 200, fat: 60 };
  const targetCal = targets?.targetCalories ?? 2000;
  const tdee = targets?.metrics.tdee ?? 2000;
  const targetWeightVal = goal.targetWeight || profile.weight || 60;

  // 为每个餐次维护一个独立的推荐组件引用（通过 key 控制 initialMeal）
  const [recMealKey, setRecMealKey] = useState<number>(0);
  const [activeRecMeal, setActiveRecMeal] = useState<MealType | null>(null);

  const handleAddRecommendedFood = (params: {
    food: IFood;
    amount: number;
    meal: MealType;
    date: string;
  }) => {
    addRecord({ food: params.food, amount: params.amount, meal: params.meal, date: params.date });
  };

  const dayRecords = getDayRecords(currentDate);
  const isToday = currentDate === todayStr();

  const daySum = useMemo(() => {
    return dayRecords.reduce(
      (acc, r) => {
        acc.calories += r.calories;
        acc.protein += r.protein;
        acc.carbs += r.carbs;
        acc.fat += r.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [dayRecords]);

  const byMeal = useMemo(() => {
    const map: Record<MealType, IDietRecord[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    dayRecords.forEach((r) => {
      map[r.meal].push(r);
    });
    return map;
  }, [dayRecords]);

  const changeDate = (delta: number) => {
    const d = parseDateStr(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(formatDate(d));
  };

  // 跳转到食物选择页（新增食物）
  const openAddFood = () => {
    const params = new URLSearchParams({
      mode: 'add',
      meal: activeMeal,
      date: currentDate,
      unitType: 'grams',
    });
    navigate(`/food-edit?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 pt-4">
        {/* 顶部日期切换 + 返回 */}
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
            <h1 className="text-[16px] font-medium text-foreground">饮食记录</h1>
          </div>
        </div>

        {/* 日期选择器 */}
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

        {/* 当日营养汇总卡 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                当日摄入
              </span>
              <div className="flex items-center gap-2">
                {isSet && (
                  <DietRecommendation
                    targetWeight={targetWeightVal}
                    tdee={tdee}
                    goalType={goal.type}
                    date={currentDate}
                    onAddFood={handleAddRecommendedFood}
                  />
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(daySum.calories)} / {Math.round(targetCal)} kcal
                </span>
              </div>
            </div>
            <NutrientProgress
              label="蛋白质"
              value={daySum.protein}
              target={macros.protein}
              color="info"
            />
            <NutrientProgress
              label="碳水化合物"
              value={daySum.carbs}
              target={macros.carbs}
              color="warning"
            />
            <NutrientProgress
              label="脂肪"
              value={daySum.fat}
              target={macros.fat}
              color="destructive"
            />
          </CardContent>
        </Card>

        {/* 餐次列表 */}
        <div className="mt-3 space-y-3 pb-36">
          {MEAL_ORDER.map((meal) => {
            const list = byMeal[meal];
            const mealCal = list.reduce((a, b) => a + b.calories, 0);
            return (
              <Card key={meal} className="border-border shadow-sm">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <h3 className="text-sm font-medium text-foreground">
                    {MEAL_LABELS[meal]}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {Math.round(mealCal)} kcal
                    </span>
                  </div>
                </div>
                <CardContent className="pt-0 px-4 pb-3">
                  {list.length === 0 ? (
                    <div className="py-2 text-center text-xs text-muted-foreground">
                      暂无记录
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {list.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px]"
                            >
                              {r.unitType === 'piece' && r.quantity
                                ? `${r.quantity}份`
                                : `${Math.round(r.grams)}g`}
                            </Badge>
                            <span className="truncate text-sm text-foreground">
                              {r.foodName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              {Math.round(r.calories)} kcal
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="!size-6 shrink-0"
                              onClick={() => removeRecord(r.id)}
                              aria-label="删除"
                            >
                              <Trash2 className="size-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                   <div className="mt-2 flex gap-2">
                    <DietRecommendation
                      targetWeight={targetWeightVal}
                      tdee={tdee}
                      goalType={goal.type}
                      date={currentDate}
                      onAddFood={handleAddRecommendedFood}
                      initialMeal={meal}
                      key={`${meal}-${recMealKey}`}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 flex-1 text-[11px]"
                        >
                          <Sparkles className="mr-1 size-3 text-primary" />
                          AI推荐
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 text-xs text-primary"
                      onClick={() => {
                        const params = new URLSearchParams({
                          meal,
                          date: currentDate,
                        });
                        navigate(`/food-picker?${params.toString()}`);
                      }}
                    >
                      <Plus className="mr-1 size-3.5" />
                      添加食物
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {dayRecords.length === 0 && (
            <EmptyState
              title="今日还未记录饮食"
              description="点击下方按钮开始记录每一餐"
            />
          )}
        </div>
      </div>

      {/* 悬浮添加按钮 */}
      <div className="fixed bottom-20 left-0 right-0 z-30 flex justify-center px-4">
        <div className="mx-auto w-full max-w-md">
          <Button
            size="default"
            className="h-9 w-full shadow-sm"
            onClick={() => {
              const params = new URLSearchParams({
                meal: 'lunch',
                date: currentDate,
              });
              navigate(`/food-picker?${params.toString()}`);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            添加食物
          </Button>
        </div>
      </div>
    </div>
  );
}
