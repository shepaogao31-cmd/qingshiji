import { useState, useEffect, useCallback, useMemo } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { genId, todayStr } from '@/lib/utils';
import type { IFood } from '@/data/foods';
import { MEAL_ORDER, type MealType } from '@/lib/constants';

export interface IDietRecord {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  foodId: string;
  foodName: string;
  grams: number; // 实际克数（统一存储为克数，便于汇总）
  quantity?: number; // 按份记录时的份数
  unitType?: 'grams' | 'piece'; // 记录时使用的单位
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'builtin' | 'ai_search' | 'user_custom';
  createdAt: number;
}

const KEY = 'diet_records';
const DEFAULT: IDietRecord[] = [];

/**
 * 根据食物 + 份量 计算该份营养
 * - grams 类型：按每100g换算
 * - piece 类型：按每份（servingWeight）计算，nutrients 直接是每份的值
 */
function calcFoodNutrients(
  food: IFood,
  amount: number,
): { nutrients: Omit<IDietRecord, 'id' | 'date' | 'meal' | 'foodId' | 'foodName' | 'grams' | 'source' | 'createdAt' | 'quantity' | 'unitType'>; actualGrams: number } {
  if (food.unitType === 'piece') {
    // 按份：nutrients 是每份的值，乘以份数
    return {
      nutrients: {
        calories: Math.round(food.calories * amount * 10) / 10,
        protein: Math.round(food.protein * amount * 10) / 10,
        carbs: Math.round(food.carbs * amount * 10) / 10,
        fat: Math.round(food.fat * amount * 10) / 10,
      },
      actualGrams: Math.round((food.servingWeight ?? 150) * amount * 10) / 10,
    };
  }
  // 按克：每100g换算
  const ratio = amount / 100;
  return {
    nutrients: {
      calories: Math.round(food.calories * ratio * 10) / 10,
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
    },
    actualGrams: Math.round(amount * 10) / 10,
  };
}

export function useDietRecords() {
  const [records, setRecordsState] = useState<IDietRecord[]>(() => storageGet(KEY, DEFAULT));

  useEffect(() => {
    storageSet(KEY, records);
  }, [records]);

  const addRecord = useCallback(
    (params: { food: IFood; amount: number; meal: MealType; date?: string }) => {
      const { food, amount, meal, date } = params;
      const { nutrients, actualGrams } = calcFoodNutrients(food, amount);
      const record: IDietRecord = {
        id: genId(),
        date: date ?? todayStr(),
        meal,
        foodId: food.id,
        foodName: food.name,
        grams: actualGrams,
        quantity: food.unitType === 'piece' ? amount : undefined,
        unitType: food.unitType ?? 'grams',
        ...nutrients,
        source: food.source,
        createdAt: Date.now(),
      };
      setRecordsState((prev) => [...prev, record]);
      return record;
    },
    [],
  );

  const removeRecord = useCallback((id: string) => {
    setRecordsState((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getDayRecords = useCallback(
    (date: string) => records.filter((r) => r.date === date),
    [records],
  );

  const daySummary = useMemo(() => {
    const today = todayStr();
    const list = records.filter((r) => r.date === today);
    const sum = list.reduce(
      (acc, r) => {
        acc.calories += r.calories;
        acc.protein += r.protein;
        acc.carbs += r.carbs;
        acc.fat += r.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    // 按餐次分组
    const byMeal: Record<MealType, IDietRecord[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    list.forEach((r) => {
      byMeal[r.meal].push(r);
    });
    return { today, list, byMeal, sum };
  }, [records]);

  // 统计最近7天运动小时数（用于自动判定活动等级）
  const getWeeklyHours = useCallback(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const start = todayStr(); // 简化：用已有记录的日期判断
    let total = 0;
    // 饮食记录不含运动时长，返回 0 由运动 hook 补充
    return total;
  }, [records]);

  return { records, addRecord, removeRecord, getDayRecords, daySummary, MEAL_ORDER };
}
