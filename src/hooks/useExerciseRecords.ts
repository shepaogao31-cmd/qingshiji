import { useState, useEffect, useCallback, useMemo } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { genId, todayStr } from '@/lib/utils';
import { calcExerciseCalories } from '@/lib/calculations';
import type { IMovement } from '@/data/met';

export interface IExerciseRecord {
  id: string;
  date: string;
  exerciseType: string;
  movementId: string;
  duration: number; // 分钟
  calories: number;
  met: number;
  createdAt: number;
}

const KEY = 'exercise_records';
const DEFAULT: IExerciseRecord[] = [];

export function useExerciseRecords(userWeight: number) {
  const [records, setRecordsState] = useState<IExerciseRecord[]>(() => storageGet(KEY, DEFAULT));

  useEffect(() => {
    storageSet(KEY, records);
  }, [records]);

  const addRecord = useCallback(
    (params: { movement: IMovement; duration: number; date?: string; weight: number }) => {
      const { movement, duration, date, weight } = params;
      const calories = calcExerciseCalories(movement.met, weight, duration);
      const record: IExerciseRecord = {
        id: genId(),
        date: date ?? todayStr(),
        exerciseType: movement.name,
        movementId: movement.id,
        duration,
        calories,
        met: movement.met,
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

  const dayTotal = useMemo(() => {
    const today = todayStr();
    const list = records.filter((r) => r.date === today);
    const total = list.reduce((acc, r) => acc + r.calories, 0);
    const duration = list.reduce((acc, r) => acc + r.duration, 0);
    return { today, list, totalCalories: total, totalDuration: duration };
  }, [records]);

  // 最近7天总运动时长（小时），用于活动等级判定
  const weeklyHours = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 3600 * 1000;
    const list = records.filter((r) => now - r.createdAt <= sevenDaysMs);
    const totalMin = list.reduce((acc, r) => acc + r.duration, 0);
    return Math.round((totalMin / 60) * 10) / 10;
  }, [records]);

  return { records, addRecord, removeRecord, getDayRecords, dayTotal, weeklyHours };
}
