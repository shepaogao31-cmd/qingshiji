import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useFoodLibrary } from '@/hooks/useFoodLibrary';
import { type IFood } from '@/data/foods';
import {
  MEAL_LABELS,
  type MealType,
} from '@/lib/constants';
import { useDietRecords } from '@/hooks/useDietRecords';

export default function FoodEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addCustomFood, updateCustomFood, removeCustomFood, allFoods } = useFoodLibrary();
  const { addRecord } = useDietRecords();

  const foodId = searchParams.get('id') || '';
  const meal = (searchParams.get('meal') as MealType) || 'lunch';
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const mode = searchParams.get('mode') || 'add'; // add / edit / search-add
  const prefillName = searchParams.get('name') || '';
  const prefillCalories = parseFloat(searchParams.get('calories') || '0') || 0;
  const prefillProtein = parseFloat(searchParams.get('protein') || '0') || 0;
  const prefillCarbs = parseFloat(searchParams.get('carbs') || '0') || 0;
  const prefillFat = parseFloat(searchParams.get('fat') || '0') || 0;
  const prefillUnitType = (searchParams.get('unitType') as 'grams' | 'piece') || 'grams';
  const prefillServingWeight = parseFloat(searchParams.get('servingWeight') || '0') || undefined;

  const existingFood = foodId ? allFoods.find((f) => f.id === foodId) : null;

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [unitType, setUnitType] = useState<'grams' | 'piece'>('grams');
  const [servingWeight, setServingWeight] = useState('');
  const [amount, setAmount] = useState('100'); // 用于添加到餐次的份量

  useEffect(() => {
    if (existingFood && mode === 'edit') {
      setName(existingFood.name);
      setCalories(String(existingFood.calories));
      setProtein(String(existingFood.protein));
      setCarbs(String(existingFood.carbs));
      setFat(String(existingFood.fat));
      setUnitType(existingFood.unitType);
      setServingWeight(existingFood.servingWeight ? String(existingFood.servingWeight) : '');
      setAmount(existingFood.unitType === 'piece' ? '1' : '100');
    } else if (mode === 'search-add') {
      setName(prefillName);
      setCalories(prefillCalories ? String(prefillCalories) : '');
      setProtein(prefillProtein ? String(prefillProtein) : '');
      setCarbs(prefillCarbs ? String(prefillCarbs) : '');
      setFat(prefillFat ? String(prefillFat) : '');
      setUnitType(prefillUnitType);
      setServingWeight(prefillServingWeight ? String(prefillServingWeight) : '');
      setAmount(prefillUnitType === 'piece' ? '1' : '100');
    } else {
      setUnitType(prefillUnitType);
    }
  }, [existingFood, mode, prefillName, prefillCalories, prefillProtein, prefillCarbs, prefillFat, prefillUnitType, prefillServingWeight]);

  const pageTitle =
    mode === 'edit' ? '编辑食物' : mode === 'search-add' ? '保存到食物库' : '新增食物';

  const previewAmount = parseFloat(amount) || 0;
  const calPer100g = parseFloat(calories) || 0;
  const proteinPer100g = parseFloat(protein) || 0;
  const carbsPer100g = parseFloat(carbs) || 0;
  const fatPer100g = parseFloat(fat) || 0;
  const servingW = parseFloat(servingWeight) || 0;

  const totalCalories = unitType === 'piece'
    ? calPer100g * previewAmount
    : (calPer100g * previewAmount) / 100;
  const totalProtein = unitType === 'piece'
    ? proteinPer100g * previewAmount
    : (proteinPer100g * previewAmount) / 100;
  const totalCarbs = unitType === 'piece'
    ? carbsPer100g * previewAmount
    : (carbsPer100g * previewAmount) / 100;
  const totalFat = unitType === 'piece'
    ? fatPer100g * previewAmount
    : (fatPer100g * previewAmount) / 100;

  const validate = (): boolean => {
    if (!name.trim()) {
      toast.error('请填写食物名称');
      return false;
    }
    if (!calPer100g || calPer100g <= 0) {
      toast.error('请填写有效的热量值');
      return false;
    }
    return true;
  };

  const buildFoodPayload = (): Omit<IFood, 'id' | 'source'> => ({
    name: name.trim(),
    category: 'custom',
    calories: calPer100g,
    protein: proteinPer100g,
    carbs: carbsPer100g,
    fat: fatPer100g,
    unitType,
    servingWeight: servingW > 0 ? servingW : undefined,
  });

  const handleSaveOnly = () => {
    if (!validate()) return;
    if (mode === 'edit' && existingFood) {
      updateCustomFood(existingFood.id, buildFoodPayload());
      toast.success('已保存修改');
    } else {
      addCustomFood(buildFoodPayload());
      toast.success('已添加到食物库');
    }
    navigate(-1);
  };

  const handleSaveAndAdd = () => {
    if (!validate()) return;
    let food: IFood;
    if (mode === 'edit' && existingFood) {
      updateCustomFood(existingFood.id, buildFoodPayload());
      food = { ...existingFood, ...buildFoodPayload() };
      toast.success('已保存修改');
    } else {
      food = addCustomFood(buildFoodPayload());
    }
    const amt = unitType === 'piece' ? previewAmount || 1 : previewAmount || 100;
    addRecord({ food, amount: amt, meal, date });
    toast.success(`已添加到${MEAL_LABELS[meal]}`);
    // 返回饮食页
    navigate('/diet');
  };

  const handleDelete = () => {
    if (!existingFood || mode !== 'edit') return;
    removeCustomFood(existingFood.id);
    toast.success('已删除');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 pt-4 pb-40">
        {/* 顶部导航 */}
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
            <h1 className="text-[16px] font-medium text-foreground">{pageTitle}</h1>
          </div>
          {mode === 'edit' && existingFood?.source === 'user_custom' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              aria-label="删除"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>

        {/* 表单区 */}
        <div className="mt-3 space-y-3">
          <Card className="border-border shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs">食物名称</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：全麦面包"
                  className="h-8"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">计量单位</Label>
                <Tabs
                  value={unitType}
                  onValueChange={(v) => {
                    setUnitType(v as 'grams' | 'piece');
                    setAmount(v === 'piece' ? '1' : '100');
                  }}
                >
                  <TabsList className="grid h-8 w-full grid-cols-2">
                    <TabsTrigger value="grams" className="text-xs">
                      按克（每100g营养）
                    </TabsTrigger>
                    <TabsTrigger value="piece" className="text-xs">
                      按份/个（每份营养）
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    热量（{unitType === 'piece' ? 'kcal/份' : 'kcal/100g'}）
                  </Label>
                  <Input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">蛋白质（g）</Label>
                  <Input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">碳水（g）</Label>
                  <Input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">脂肪（g）</Label>
                  <Input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className="h-8"
                  />
                </div>
              </div>

              {unitType === 'piece' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">每份重量（克，可选）</Label>
                  <Input
                    type="number"
                    value={servingWeight}
                    onChange={(e) => setServingWeight(e.target.value)}
                    placeholder="如：150"
                    inputMode="decimal"
                    className="h-8"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 份量预览 + 添加到餐次 */}
          <Card className="border-border shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="text-sm font-medium text-foreground">
                添加到{MEAL_LABELS[meal]}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs text-muted-foreground">份量</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-9 flex-1"
                  inputMode="decimal"
                />
                <span className="text-xs text-muted-foreground">
                  {unitType === 'piece' ? '份/个' : '克'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 rounded-md border border-border/60 bg-muted/40 p-2 text-center text-xs">
                <div>
                  <div className="font-medium text-foreground tabular-nums">
                    {Math.round(totalCalories)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">热量kcal</div>
                </div>
                <div>
                  <div className="font-medium text-foreground tabular-nums">
                    {totalProtein.toFixed(1)}g
                  </div>
                  <div className="text-[10px] text-muted-foreground">蛋白</div>
                </div>
                <div>
                  <div className="font-medium text-foreground tabular-nums">
                    {totalCarbs.toFixed(1)}g
                  </div>
                  <div className="text-[10px] text-muted-foreground">碳水</div>
                </div>
                <div>
                  <div className="font-medium text-foreground tabular-nums">
                    {totalFat.toFixed(1)}g
                  </div>
                  <div className="text-[10px] text-muted-foreground">脂肪</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部固定操作栏 —— 位于全局底部Tab上方，确保按钮完整可见、可点击 */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm shadow-2xs">
        <div className="mx-auto max-w-md px-4 pt-3 pb-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9 flex-1"
              onClick={handleSaveOnly}
            >
              仅保存
            </Button>
            <Button className="h-9 flex-1" onClick={handleSaveAndAdd}>
              <Save className="mr-1.5 size-3.5" />
              保存并添加
            </Button>
          </div>
        </div>
        {/* 适配 iPhone 安全区 */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </div>
    </div>
  );
}
