import { useState, useEffect, useCallback, useMemo } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { MOCK_FOODS, type IFood } from '@/data/foods';
import { genId } from '@/lib/utils';

const STORAGE_KEY = 'custom_foods';

export function useFoodLibrary() {
  const [customFoods, setCustomFoods] = useState<IFood[]>(() =>
    storageGet<IFood[]>(STORAGE_KEY, []),
  );

  useEffect(() => {
    storageSet(STORAGE_KEY, customFoods);
  }, [customFoods]);

  // 合并内置 + 自定义食物
  const allFoods = useMemo<IFood[]>(() => [...MOCK_FOODS, ...customFoods], [customFoods]);

  // 日常食物（按克）
  const dailyFoods = useMemo(
    () => allFoods.filter((f) => f.unitType !== 'piece'),
    [allFoods],
  );

  // 餐厅食物（按份）
  const restaurantFoods = useMemo(
    () => allFoods.filter((f) => f.unitType === 'piece'),
    [allFoods],
  );

  // 添加自定义食物
  const addCustomFood = useCallback((food: Omit<IFood, 'id' | 'source'>) => {
    const newFood: IFood = {
      ...food,
      id: `custom_${genId()}`,
      source: 'user_custom',
    };
    setCustomFoods((prev) => [...prev, newFood]);
    return newFood;
  }, []);

  // 编辑自定义食物
  const updateCustomFood = useCallback((id: string, patch: Partial<IFood>) => {
    setCustomFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }, []);

  // 删除自定义食物
  const removeCustomFood = useCallback((id: string) => {
    setCustomFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // 根据 name 查找是否已存在
  const findByName = useCallback(
    (name: string) => {
      return allFoods.find(
        (f) => f.name === name || f.name.includes(name) || name.includes(f.name),
      );
    },
    [allFoods],
  );

  return {
    allFoods,
    customFoods,
    dailyFoods,
    restaurantFoods,
    addCustomFood,
    updateCustomFood,
    removeCustomFood,
    findByName,
  };
}
