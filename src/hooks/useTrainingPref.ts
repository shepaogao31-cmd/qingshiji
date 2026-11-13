import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet } from '@/lib/storage';

export interface ITrainingPref {
  scene: 'home' | 'gym';
  level: 'beginner' | 'advanced';
  weeklyHours: number;
  updatedAt: number;
}

const KEY = 'training_pref';
const DEFAULT: ITrainingPref = {
  scene: 'home',
  level: 'beginner',
  weeklyHours: 0,
  updatedAt: 0,
};

export function useTrainingPref() {
  const [pref, setPrefState] = useState<ITrainingPref>(() => storageGet(KEY, DEFAULT));

  useEffect(() => {
    storageSet(KEY, pref);
  }, [pref]);

  const setPref = useCallback((next: Partial<ITrainingPref>) => {
    setPrefState((prev) => ({ ...prev, ...next, updatedAt: Date.now() }));
  }, []);

  // 根据周运动小时数自动判定等级（以每周3小时为界）
  const autoLevel = useCallback((hours: number): 'beginner' | 'advanced' => {
    return hours >= 3 ? 'advanced' : 'beginner';
  }, []);

  return { pref, setPref, autoLevel };
}
