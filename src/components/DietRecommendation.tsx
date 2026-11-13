import { useState, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { capabilityClient, logger } from '@lark-apaas/client-toolkit-lite';

import {
  PLUGIN_DIET_RECOMMENDATION,
  MEAL_LABELS,
  MEAL_ORDER,
  type MealType,
} from '@/lib/constants';
import type { IFood } from '@/data/foods';
import { genId } from '@/lib/utils';

export interface RecommendedMeal {
  meal_name: string;
  foods: {
    food_name: string;
    weight: number;
    calories: number;
    protein: number;
    carbohydrate: number;
    fat: number;
  }[];
  meal_calories: number;
  meal_protein: number;
  meal_carbohydrate: number;
  meal_fat: number;
}

export interface IDietRecommendation {
  daily_summary: {
    total_calories: number;
    total_protein: number;
    total_carbohydrate: number;
    total_fat: number;
  };
  meals: RecommendedMeal[];
}

type TabMode = 'all' | MealType;

interface DietRecommendationProps {
  targetWeight: number;
  tdee: number;
  goalType: 'muscle' | 'fat';
  date: string;
  onAddFood: (params: {
    food: IFood;
    amount: number;
    meal: MealType;
    date: string;
  }) => void;
  trigger?: React.ReactNode;
  initialMeal?: MealType | null;
}

// 将中文餐次名映射为 MealType
function mapMealKey(mealName: string): MealType {
  if (mealName.includes('早')) return 'breakfast';
  if (mealName.includes('午')) return 'lunch';
  if (mealName.includes('晚')) return 'dinner';
  return 'snack';
}

// 尝试从文本中解析 JSON（多种容错策略）
function parseJsonFromText(text: string): IDietRecommendation | null {
  // 策略1: 直接匹配最外层 {}
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]) as IDietRecommendation;
      if (data.meals && Array.isArray(data.meals) && data.meals.length > 0) {
        return data;
      }
    } catch {
      // 继续下一种策略
    }
  }
  // 策略2: 找代码块里的 JSON
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    try {
      const data = JSON.parse(codeMatch[1]) as IDietRecommendation;
      if (data.meals && Array.isArray(data.meals) && data.meals.length > 0) {
        return data;
      }
    } catch {
      // 继续
    }
  }
  // 策略3: 从第一个 { 到最后一个 }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      const data = JSON.parse(text.slice(firstBrace, lastBrace + 1)) as IDietRecommendation;
      if (data.meals && Array.isArray(data.meals) && data.meals.length > 0) {
        return data;
      }
    } catch {
      // 失败
    }
  }
  return null;
}

export default function DietRecommendation({
  targetWeight,
  tdee,
  goalType,
  date,
  onAddFood,
  trigger,
  initialMeal = null,
}: DietRecommendationProps) {
  const [open, setOpen] = useState(false);
  const [tabMode, setTabMode] = useState<TabMode>('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IDietRecommendation | null>(null);
  // 单餐推荐结果，按餐次存储
  const [mealResults, setMealResults] = useState<Record<MealType, RecommendedMeal | null>>({
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  });
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  // 已添加的食物 key: mealType-foodName
  const [addedFoods, setAddedFoods] = useState<Set<string>>(new Set());

  const goalLabel = goalType === 'fat' ? '减脂' : '增肌';

  // 统一调用 AI 生成
  const callAiGenerate = useCallback(
    async (promptParams: Record<string, string>): Promise<string> => {
      const executor = (capabilityClient as any).load(PLUGIN_DIET_RECOMMENDATION);
      let full = '';
      for await (const chunk of (executor as any).callStream('textGenerate', promptParams)) {
        const piece = chunk.content ?? '';
        if (piece) {
          full += piece;
        }
      }
      return full;
    },
    [],
  );

  // 生成全日推荐
  const generateDaily = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const full = await callAiGenerate({
        target_weight: String(targetWeight),
        daily_tdee: String(tdee),
        fitness_goal: goalLabel,
        dietary_preferences: '常见中餐食材，少油少盐，均衡营养',
      });
      const data = parseJsonFromText(full);
      if (data) {
        setResult(data);
        // 默认展开第一餐
        if (data.meals.length > 0) {
          setExpandedMeals({ [data.meals[0].meal_name]: true });
        }
        toast.success('已生成全日饮食推荐');
      } else {
        toast.error('生成失败，请稍后重试');
        logger.warn('diet recommendation parse failed, raw text length:', full.length);
      }
    } catch (err) {
      logger.error('diet recommendation failed:', String(err));
      toast.error('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [targetWeight, tdee, goalLabel, callAiGenerate]);

  // 生成单餐推荐
  const generateSingleMeal = useCallback(
    async (meal: MealType) => {
      setLoading(true);
      try {
        const mealLabel = MEAL_LABELS[meal];
        // 计算该餐大致热量占比
        const ratios: Record<MealType, number> = {
          breakfast: 0.3,
          lunch: 0.4,
          dinner: 0.25,
          snack: 0.05,
        };
        const mealCalories = Math.round(tdee * ratios[meal]);
        const full = await callAiGenerate({
          target_weight: String(targetWeight),
          daily_tdee: String(tdee),
          fitness_goal: goalLabel,
          dietary_preferences: `请仅推荐${mealLabel}的食物搭配，该餐目标热量约${mealCalories}大卡，使用常见中餐食材，少油少盐，均衡营养`,
        });

        // 单餐也可能返回 meals[0] 格式的 JSON，或者直接返回一餐的数据
        const data = parseJsonFromText(full);
        if (data && data.meals && data.meals.length > 0) {
          const firstMeal = data.meals[0];
          setMealResults((prev) => ({ ...prev, [meal]: firstMeal }));
          toast.success(`已生成${mealLabel}推荐`);
        } else {
          toast.error('生成失败，请稍后重试');
          logger.warn('single meal parse failed, raw text length:', full.length);
        }
      } catch (err) {
        logger.error('single meal recommendation failed:', String(err));
        toast.error('生成失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    },
    [targetWeight, tdee, goalLabel, callAiGenerate],
  );

  const handleOpen = () => {
    setOpen(true);
    if (initialMeal) {
      setTabMode(initialMeal);
    }
  };

  const toggleMeal = (mealName: string) => {
    setExpandedMeals((prev) => ({ ...prev, [mealName]: !prev[mealName] }));
  };

  const buildFoodFromRecommended = (
    f: RecommendedMeal['foods'][number],
  ): IFood => ({
    id: `ai_rec_${genId()}`,
    name: f.food_name,
    category: 'ai_search',
    calories: Math.round((f.calories / Math.max(f.weight, 1)) * 100),
    protein: Math.round((f.protein / Math.max(f.weight, 1)) * 100 * 10) / 10,
    carbs: Math.round((f.carbohydrate / Math.max(f.weight, 1)) * 100 * 10) / 10,
    fat: Math.round((f.fat / Math.max(f.weight, 1)) * 100 * 10) / 10,
    source: 'ai_search',
    unitType: 'grams',
  });

  const handleAddFood = (mealType: MealType, foodItem: RecommendedMeal['foods'][number]) => {
    const key = `${mealType}-${foodItem.food_name}`;
    if (addedFoods.has(key)) {
      toast.info('该食物已添加过');
      return;
    }
    const food = buildFoodFromRecommended(foodItem);
    onAddFood({ food, amount: foodItem.weight, meal: mealType, date });
    setAddedFoods((prev) => new Set(prev).add(key));
    toast.success(`已添加 ${foodItem.food_name}`);
  };

  const handleAddMeal = (mealType: MealType, meal: RecommendedMeal) => {
    meal.foods.forEach((f) => {
      const food = buildFoodFromRecommended(f);
      onAddFood({ food, amount: f.weight, meal: mealType, date });
    });
    const newSet = new Set(addedFoods);
    meal.foods.forEach((f) => newSet.add(`${mealType}-${f.food_name}`));
    setAddedFoods(newSet);
    toast.success(`已添加整餐 ${MEAL_LABELS[mealType]}`);
  };

  const isMealAllAdded = (mealType: MealType, meal: RecommendedMeal) =>
    meal.foods.every((f) => addedFoods.has(`${mealType}-${f.food_name}`));

  const renderMealCard = (mealType: MealType, meal: RecommendedMeal) => {
    const isExpanded = expandedMeals[meal.meal_name];
    const allAdded = isMealAllAdded(mealType, meal);
    return (
      <Card key={meal.meal_name} className="border-border shadow-sm">
        <button
          type="button"
          onClick={() => toggleMeal(meal.meal_name)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{meal.meal_name}</span>
            <Badge variant="outline" className="text-[10px]">
              {Math.round(meal.meal_calories)} kcal
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {allAdded && (
              <Badge variant="outline" className="text-[10px] text-success">
                <Check className="mr-0.5 size-3" />
                已添加
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </button>
        {isExpanded && (
          <div className="space-y-2 border-t border-border/60 px-3 py-2.5">
            <div className="space-y-1.5">
              {meal.foods.map((f, idx) => {
                const key = `${mealType}-${f.food_name}`;
                const isAdded = addedFoods.has(key);
                return (
                  <div
                    key={`${f.food_name}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/40 p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-foreground">
                        {f.food_name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {f.weight}g · {Math.round(f.calories)} kcal · 蛋白{f.protein}g · 碳水
                        {f.carbohydrate}g
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant={isAdded ? 'ghost' : 'secondary'}
                      className="!size-6 shrink-0"
                      onClick={() => handleAddFood(mealType, f)}
                      disabled={isAdded}
                      aria-label={isAdded ? '已添加' : '添加'}
                    >
                      {isAdded ? (
                        <Check className="size-3.5 text-success" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
            <Button
              size="sm"
              className="h-7 w-full text-xs"
              onClick={() => handleAddMeal(mealType, meal)}
              disabled={allAdded}
            >
              {allAdded ? '整餐已添加' : `一键添加到${MEAL_LABELS[mealType]}`}
            </Button>
          </div>
        )}
      </Card>
    );
  };

  const renderLoading = (text: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="mb-3 size-8 animate-spin text-primary" />
      <p className="text-sm text-foreground">{text}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        目标体重 {targetWeight}kg · TDEE {tdee} kcal · {goalLabel}
      </p>
    </div>
  );

  const renderEmpty = (mealType: MealType) => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Sparkles className="mb-2 size-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">
        暂无{MEAL_LABELS[mealType]}推荐
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        点击下方按钮生成专属推荐
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Sparkles className="mr-1 size-3.5 text-primary" />
            AI 推荐
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="size-4 text-primary" />
            AI 智能饮食推荐
            {loading && (
              <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" />
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tab 切换：全日 + 4 个餐次 */}
        <div className="px-2 pt-2">
          <Tabs value={tabMode} onValueChange={(v) => setTabMode(v as TabMode)}>
            <TabsList className="h-8 w-full">
              <TabsTrigger value="all" className="h-7 text-xs">
                全日
              </TabsTrigger>
              {MEAL_ORDER.map((m) => (
                <TabsTrigger key={m} value={m} className="h-7 text-xs">
                  {MEAL_LABELS[m]}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 全日推荐 */}
            <TabsContent value="all" className="mt-3">
              <div className="max-h-[60vh] space-y-3 overflow-y-auto px-2 pb-2">
                {loading && !result && renderLoading('正在生成全日饮食方案...')}
                {!loading && !result && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Sparkles className="mb-2 size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">根据你的目标生成全日饮食方案</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      涵盖三餐 + 加餐，热量与营养素均衡搭配
                    </p>
                  </div>
                )}
                {result && (
                  <>
                    {/* 全日汇总 */}
                    <Card className="border-border shadow-sm">
                      <CardContent className="p-3">
                        <div className="text-xs font-medium text-foreground">全日营养汇总</div>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-sm font-semibold tabular-nums text-foreground">
                              {Math.round(result.daily_summary.total_calories)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">热量 kcal</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold tabular-nums text-info">
                              {Math.round(result.daily_summary.total_protein)}g
                            </div>
                            <div className="text-[10px] text-muted-foreground">蛋白</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold tabular-nums text-warning">
                              {Math.round(result.daily_summary.total_carbohydrate)}g
                            </div>
                            <div className="text-[10px] text-muted-foreground">碳水</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold tabular-nums text-destructive">
                              {Math.round(result.daily_summary.total_fat)}g
                            </div>
                            <div className="text-[10px] text-muted-foreground">脂肪</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 餐次列表 */}
                    <div className="space-y-2">
                      {result.meals.map((meal) => {
                        const mealType = mapMealKey(meal.meal_name);
                        return renderMealCard(mealType, meal);
                      })}
                    </div>

                    {/* 重新生成 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full text-xs"
                      onClick={generateDaily}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                          重新生成中...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1.5 size-3.5" />
                          换一版全日推荐
                        </>
                      )}
                    </Button>
                  </>
                )}
                {!result && (
                  <Button className="w-full text-sm" onClick={generateDaily} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 size-4" />
                        生成全日推荐
                      </>
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* 各餐次单独推荐 */}
            {MEAL_ORDER.map((mealType) => (
              <TabsContent key={mealType} value={mealType} className="mt-3">
                <div className="max-h-[60vh] space-y-3 overflow-y-auto px-2 pb-2">
                  {loading && !mealResults[mealType] &&
                    renderLoading(`正在生成${MEAL_LABELS[mealType]}推荐...`)}
                  {!loading && !mealResults[mealType] && renderEmpty(mealType)}
                  {mealResults[mealType] && (
                    <>
                      {renderMealCard(mealType, mealResults[mealType]!)}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-full text-xs"
                        onClick={() => generateSingleMeal(mealType)}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            重新生成中...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-1.5 size-3.5" />
                            换一版{MEAL_LABELS[mealType]}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {!mealResults[mealType] && (
                    <Button
                      className="w-full text-sm"
                      onClick={() => generateSingleMeal(mealType)}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-1.5 size-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1.5 size-4" />
                          生成{MEAL_LABELS[mealType]}推荐
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
