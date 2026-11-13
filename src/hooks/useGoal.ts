import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet } from '@/lib/storage';

export interface IGoal {
  type: 'muscle' | 'fat';
  targetWeight?: number;
  durationWeeks?: number;
  updatedAt: number;
}

const KEY = 'goal';
const DEFAULT: IGoal = {
  type: 'fat',
  updatedAt: 0,
};

export function useGoal() {
  const [goal, setGoalState] = useState<IGoal>(() => storageGet(KEY, DEFAULT));

  useEffect(() => {
    storageSet(KEY, goal);
  }, [goal]);

  const setGoal = useCallback((next: Partial<IGoal>) => {
    setGoalState((prev) => ({ ...prev, ...next, updatedAt: Date.now() }));
  }, []);

  return { goal, setGoal };
}
