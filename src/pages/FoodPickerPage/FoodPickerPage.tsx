import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  Camera,
  Globe,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { toast } from 'sonner';
import { capabilityClient, logger } from '@lark-apaas/client-toolkit-lite';

import { useDietRecords } from '@/hooks/useDietRecords';
import { useFoodLibrary } from '@/hooks/useFoodLibrary';
import { type IFood } from '@/data/foods';
import {
  MEAL_LABELS,
  PLUGIN_FOOD_IMAGE,
  PLUGIN_FOOD_SEARCH,
  type MealType,
} from '@/lib/constants';
import { genId } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';

export default function FoodPickerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addRecord } = useDietRecords();
  const {
    dailyFoods,
    restaurantFoods,
    removeCustomFood,
    allFoods,
  } = useFoodLibrary();

  const meal = (searchParams.get('meal') as MealType) || 'lunch';
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const [foodTab, setFoodTab] = useState<'library' | 'photo' | 'search'>('library');
  const [foodCategory, setFoodCategory] = useState<'daily' | 'restaurant'>('daily');
  const [keyword, setKeyword] = useState('');
  const [selectedFood, setSelectedFood] = useState<IFood | null>(null);
  const [grams, setGrams] = useState('100');
  const [pieces, setPieces] = useState('1');

  // 拍照识别
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoRecognizing, setPhotoRecognizing] = useState(false);
  const [photoResult, setPhotoResult] = useState('');
  const [photoFoodName, setPhotoFoodName] = useState('');
  const [photoGrams, setPhotoGrams] = useState('200');

  // 联网搜索
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<IFood | null>(null);
  const [searchGrams, setSearchGrams] = useState('100');

  // 食物库筛选
  const filteredFoods = useMemo(() => {
    const list = foodCategory === 'daily' ? dailyFoods : restaurantFoods;
    if (!keyword.trim()) return list;
    return list.filter((f) =>
      f.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [keyword, foodCategory, dailyFoods, restaurantFoods]);

  // 切换分类时清空选择
  useEffect(() => {
    setSelectedFood(null);
  }, [foodCategory]);

  const handleAddFromLibrary = () => {
    if (!selectedFood) {
      toast.error('请先选择食物');
      return;
    }
    const amount = selectedFood.unitType === 'piece'
      ? parseFloat(pieces) || 1
      : parseFloat(grams) || 100;
    addRecord({ food: selectedFood, amount, meal, date });
    toast.success(`已添加 ${selectedFood.name}`);
    navigate('/diet');
  };

  // 拍照识别
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoResult('');
    setPhotoFoodName('');
  };

  const handlePhotoRecognize = async () => {
    if (!photoFile) return;
    setPhotoRecognizing(true);
    setPhotoResult('');
    try {
      const executor = (capabilityClient as any).load(PLUGIN_FOOD_IMAGE);
      let full = '';
      for await (const chunk of (executor as any).callStream('imageUnderstanding', {
        food_image: [photoFile],
      })) {
        const piece = chunk.content ?? '';
        if (piece) {
          full += piece;
          setPhotoResult(full);
        }
      }
      const match = full.match(/[\u4e00-\u9fa5A-Za-z]{2,15}(?=.*?\d+)/);
      if (match) {
        setPhotoFoodName(match[0]);
      } else if (full.length > 0) {
        const firstLine = full.split('\n')[0].replace(/^[\d\.\-\s]+/, '').slice(0, 10);
        setPhotoFoodName(firstLine || '识别食物');
      }
    } catch (err) {
      logger.error('food image recognition failed:', String(err));
      toast.error('识别失败，请重试或手动添加');
    } finally {
      setPhotoRecognizing(false);
    }
  };

  const handleAddFromPhoto = () => {
    if (!photoFoodName.trim()) {
      toast.error('请填写食物名称');
      return;
    }
    const g = parseFloat(photoGrams) || 200;
    const matched = allFoods.find(
      (f) => f.name === photoFoodName.trim() || f.name.includes(photoFoodName.trim()),
    );
    if (matched) {
      addRecord({ food: matched, amount: g, meal, date });
      toast.success(`已添加 ${matched.name}（食物库精确数据）`);
    } else {
      const estimatedFood: IFood = {
        id: `ai_${genId()}`,
        name: photoFoodName.trim(),
        category: 'ai_search',
        calories: 150,
        protein: 8,
        carbs: 15,
        fat: 6,
        source: 'ai_search',
        unitType: 'grams',
      };
      addRecord({ food: estimatedFood, amount: g, meal, date });
      toast.success('已添加（估算数据，仅供参考）');
    }
    navigate('/diet');
  };

  // 联网搜索
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const kw = searchKeyword.trim();
    if (!kw) return;
    const matched = allFoods.find(
      (f) => f.name === kw || f.name.includes(kw),
    );
    if (matched) {
      setSearchResult(matched);
      toast.info('该食物已在食物库中，使用精确数据');
      return;
    }
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const executor = (capabilityClient as any).load(PLUGIN_FOOD_SEARCH);
      let full = '';
      for await (const chunk of (executor as any).callStream('searchSummary', {
        food_name: kw,
      })) {
        const piece = chunk.summary ?? '';
        if (piece) {
          full += piece;
        }
      }
      const jsonMatch = full.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          const cal = parseFloat(data.calorie ?? data.calories) || 0;
          const carb = parseFloat(data.carbohydrate ?? data.carbs) || 0;
          const prot = parseFloat(data.protein) || 0;
          const fat = parseFloat(data.fat) || 0;
          if (cal > 0) {
            const food: IFood = {
              id: `search_${genId()}`,
              name: kw,
              category: 'ai_search',
              calories: cal,
              protein: prot,
              carbs: carb,
              fat: fat,
              source: 'ai_search',
              unitType: 'grams',
            };
            setSearchResult(food);
            toast.success('已获取营养数据');
            return;
          }
        } catch {
          // 解析失败
        }
      }
      toast.error('暂未找到该食物的营养数据');
    } catch (err) {
      logger.error('food search failed:', String(err));
      toast.error('搜索失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddFromSearch = () => {
    if (!searchResult) {
      toast.error('请先搜索并确认食物数据');
      return;
    }
    const g = parseFloat(searchGrams) || 100;
    addRecord({ food: searchResult, amount: g, meal, date });
    toast.success(`已添加 ${searchResult.name}`);
    navigate('/diet');
  };

  const handleAddSearchResultToLibrary = () => {
    if (!searchResult) return;
    const params = new URLSearchParams({
      mode: 'search-add',
      meal,
      date,
      name: searchResult.name,
      calories: String(searchResult.calories),
      protein: String(searchResult.protein),
      carbs: String(searchResult.carbs),
      fat: String(searchResult.fat),
      unitType: searchResult.unitType ?? 'grams',
    });
    if (searchResult.servingWeight) {
      params.set('servingWeight', String(searchResult.servingWeight));
    }
    navigate(`/food-edit?${params.toString()}`);
  };

  const openAddFood = () => {
    const params = new URLSearchParams({
      mode: 'add',
      meal,
      date,
      unitType: foodCategory === 'restaurant' ? 'piece' : 'grams',
    });
    navigate(`/food-edit?${params.toString()}`);
  };

  const openEditFood = (food: IFood) => {
    if (food.source !== 'user_custom') return;
    const params = new URLSearchParams({
      mode: 'edit',
      id: food.id,
      meal,
      date,
    });
    navigate(`/food-edit?${params.toString()}`);
  };

  const handleDeleteCustomFood = (id: string) => {
    removeCustomFood(id);
    if (selectedFood?.id === id) {
      setSelectedFood(null);
    }
    toast.success('已删除');
  };

  const totalCalories = useMemo(() => {
    if (!selectedFood) return 0;
    if (selectedFood.unitType === 'piece') {
      return Math.round(selectedFood.calories * parseFloat(pieces || '0'));
    }
    return Math.round((selectedFood.calories * parseFloat(grams || '0')) / 100);
  }, [selectedFood, pieces, grams]);

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
            <div>
              <h1 className="text-[16px] font-medium text-foreground">添加食物</h1>
              <p className="text-[11px] text-muted-foreground">
                餐次：{MEAL_LABELS[meal]}
              </p>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <Tabs
          value={foodTab}
          onValueChange={(v) => setFoodTab(v as typeof foodTab)}
          className="mt-4"
        >
          <TabsList className="grid h-8 w-full grid-cols-3">
            <TabsTrigger value="library" className="text-xs">
              食物库
            </TabsTrigger>
            <TabsTrigger value="photo" className="text-xs">
              拍照识别
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs">
              联网搜索
            </TabsTrigger>
          </TabsList>

          {/* 食物库 */}
          <TabsContent value="library" className="mt-3 space-y-3">
            {/* 分类切换 */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={foodCategory === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFoodCategory('daily')}
                className="h-8 text-xs"
              >
                日常食物（按克）
              </Button>
              <Button
                variant={foodCategory === 'restaurant' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFoodCategory('restaurant')}
                className="h-8 text-xs"
              >
                餐厅食物（按份）
              </Button>
            </div>

            {/* 搜索 + 新增 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={foodCategory === 'daily' ? '搜索日常食物' : '搜索餐厅/快餐'}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-8 pl-9 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={openAddFood}
                aria-label="新增自定义食物"
                title="新增食物"
                className="h-8 w-8"
              >
                <PlusCircle className="size-4 text-primary" />
              </Button>
            </div>

            {/* 食物列表 —— 全屏展示，点击即选，滚动流畅 */}
            <div className="space-y-1.5">
              {filteredFoods.length === 0 ? (
                <EmptyState
                  title="未找到相关食物"
                  description="点击右上角+号添加，或试试联网搜索"
                  className="py-8"
                />
              ) : (
                filteredFoods.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedFood(f);
                      if (f.unitType === 'piece') {
                        setPieces('1');
                      } else {
                        setGrams('100');
                      }
                    }}
                     className={`flex w-full items-center justify-between gap-2 rounded-md border p-3 text-left transition-colors ${
                       selectedFood?.id === f.id
                         ? 'border-primary bg-primary/5'
                         : 'border-border bg-card hover:border-primary/50'
                     }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                         <span className="truncate text-sm font-medium text-foreground">
                          {f.name}
                        </span>
                        {f.source === 'user_custom' && (
                          <Badge variant="outline" className="shrink-0 text-[9px] text-primary/80">
                            自定义
                          </Badge>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {f.unitType === 'piece'
                          ? `每份 ${f.calories} kcal · ${f.servingWeight ?? '--'}g`
                          : `${f.calories} kcal/100g · 蛋白${f.protein}g`}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {f.source === 'user_custom' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="!size-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditFood(f);
                            }}
                            aria-label="编辑"
                          >
                            <Edit3 className="size-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="!size-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomFood(f.id);
                            }}
                            aria-label="删除"
                          >
                            <Trash2 className="size-3.5 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                      <Badge
                        variant="outline"
                        className="ml-1 shrink-0 text-[10px]"
                      >
                        {f.unitType === 'piece' ? '份' : '克'}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          {/* 拍照识别 */}
          <TabsContent value="photo" className="mt-3 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            {!photoUrl ? (
              <Button
                variant="outline"
                className="h-32 w-full flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-6 text-primary" />
                <span className="text-sm">拍摄或选择食物照片</span>
                <span className="text-[10px] text-muted-foreground">
                  AI将自动识别食物种类和份量
                </span>
              </Button>
            ) : (
              <div className="space-y-3">
               <div className="relative overflow-hidden rounded-md">
                  <Image
                    src={photoUrl}
                    alt="待识别"
                    className="aspect-square w-full object-cover"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!absolute right-2 top-2"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoUrl(null);
                      setPhotoResult('');
                    }}
                  >
                    重新选择
                  </Button>
                </div>
                {!photoResult && (
                  <Button
                    className="w-full"
                    onClick={handlePhotoRecognize}
                    disabled={photoRecognizing}
                  >
                    {photoRecognizing ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        识别中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 size-4" />
                        AI识别食物
                      </>
                    )}
                  </Button>
                )}
                {photoResult && (
                  <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3">
                    <div className="text-xs font-medium text-foreground">
                      识别结果
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                      {photoResult}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="w-14 shrink-0 text-xs text-muted-foreground">
                        食物名称
                      </span>
                      <Input
                        value={photoFoodName}
                        onChange={(e) => setPhotoFoodName(e.target.value)}
                        placeholder="请确认或修改"
                        className="h-8 flex-1 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 shrink-0 text-xs text-muted-foreground">
                        份量
                      </span>
                      <Input
                        type="number"
                        value={photoGrams}
                        onChange={(e) => setPhotoGrams(e.target.value)}
                        className="h-8 flex-1"
                        inputMode="decimal"
                      />
                      <span className="text-xs text-muted-foreground">克</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* 联网搜索 */}
          <TabsContent value="search" className="mt-3 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="输入食物名称搜索"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="h-8 pl-9 text-xs"
                />
              </div>
              <Button type="submit" size="sm" disabled={searchLoading} className="h-8">
                {searchLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  '搜索'
                )}
              </Button>
            </form>
            {searchResult ? (
             <div className="space-y-3 rounded-md border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {searchResult.name}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    来自网络
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="font-semibold text-foreground tabular-nums">
                      {searchResult.calories}
                    </div>
                    <div className="text-[10px] text-muted-foreground">热量kcal</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground tabular-nums">
                      {searchResult.protein}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">蛋白</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground tabular-nums">
                      {searchResult.carbs}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">碳水</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground tabular-nums">
                      {searchResult.fat}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">脂肪</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-xs text-muted-foreground">
                    份量
                  </span>
                  <Input
                    type="number"
                    value={searchGrams}
                    onChange={(e) => setSearchGrams(e.target.value)}
                    className="h-8 flex-1"
                    inputMode="decimal"
                  />
                  <span className="text-xs text-muted-foreground">克</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleAddSearchResultToLibrary}
                  >
                    添加到食物库
                  </Button>
                </div>
              </div>
            ) : (
              !searchLoading && (
                <EmptyState
                  icon={Globe}
                  title="输入食物名称搜索"
                  description="联网搜索补充食物库中没有的营养数据"
                  className="py-8"
                />
              )
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 底部固定操作栏 —— 位于全局底部Tab上方，确保按钮完整可见、可点击 */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm shadow-2xs">
        <div className="mx-auto max-w-md px-4 pt-3 pb-2">
          {foodTab === 'library' && selectedFood && (
            <div className="space-y-2">
              {selectedFood.unitType === 'piece' ? (
                <div className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-xs text-muted-foreground">数量</span>
                  <Input
                    type="number"
                    value={pieces}
                    onChange={(e) => setPieces(e.target.value)}
                    className="h-9 flex-1"
                    inputMode="decimal"
                  />
                  <span className="text-xs text-muted-foreground">份/个</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-xs text-muted-foreground">份量</span>
                  <Input
                    type="number"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    className="h-9 flex-1"
                    inputMode="decimal"
                  />
                  <span className="text-xs text-muted-foreground">克</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {selectedFood.unitType === 'piece'
                    ? `每份约 ${selectedFood.servingWeight ?? '--'} g`
                    : `${selectedFood.calories} kcal/100g · 蛋白${selectedFood.protein}g`}
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  约 {totalCalories} kcal
                </span>
              </div>
              <Button className="h-9 w-full" onClick={handleAddFromLibrary}>
                添加到{MEAL_LABELS[meal]}
              </Button>
            </div>
          )}

          {foodTab === 'library' && !selectedFood && (
            <div className="py-1 text-center text-xs text-muted-foreground">
              请从上方列表中选择食物
            </div>
          )}

           {foodTab === 'photo' && photoResult && (
             <Button className="h-9 w-full" onClick={handleAddFromPhoto}>
              确认添加到{MEAL_LABELS[meal]}
            </Button>
          )}

          {foodTab === 'photo' && !photoResult && (
            <div className="py-1 text-center text-xs text-muted-foreground">
              {photoUrl ? '点击上方按钮开始识别' : '请先拍摄或选择照片'}
            </div>
          )}

           {foodTab === 'search' && searchResult && (
             <Button className="h-9 w-full" onClick={handleAddFromSearch}>
              添加到{MEAL_LABELS[meal]}
            </Button>
          )}

          {foodTab === 'search' && !searchResult && (
            <div className="py-1 text-center text-xs text-muted-foreground">
              搜索到食物后可添加到餐次
            </div>
          )}
        </div>
        {/* 适配 iPhone 安全区的额外底距 */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </div>
    </div>
  );
}
