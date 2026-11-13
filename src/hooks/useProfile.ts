import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { calcBodyMetrics, calcTargetCalories, calcMacroTargets, type IBodyCalcResult } from '@/lib/calculations';

export interface IProfile {
  height: number;
  weight: number;
  age?: number;
  gender?: 'male' | 'female';
  waist?: number;
  neck?: number;
  updatedAt: number;
}

const KEY = 'profile';
const DEFAULT: IProfile = {
  height: 0,
  weight: 0,
  updatedAt: 0,
};

export function useProfile() {
  const [profile, setProfileState] = useState<IProfile>(() => storageGet(KEY, DEFAULT));

  useEffect(() => {
    storageSet(KEY, profile);
  }, [profile]);

  const setProfile = useCallback((next: Partial<IProfile>) => {
    setProfileState((prev) => ({ ...prev, ...next, updatedAt: Date.now() }));
  }, []);

  const isSet = profile.height > 0 && profile.weight > 0;

  // 派生：基于 profile + 每周运动时长计算身体指标
  const getMetrics = useCallback(
    (weeklyHours: number = 0): IBodyCalcResult | null => {
      if (!isSet) return null;
      return calcBodyMetrics(
        {
          height: profile.height,
          weight: profile.weight,
          age: profile.age,
          gender: profile.gender,
          waist: profile.waist,
          neck: profile.neck,
        },
        weeklyHours,
      );
    },
    [profile, isSet],
  );

  // 目标热量 + 宏量营养素
  const getTargets = useCallback(
    (
      goalType: 'muscle' | 'fat',
      weeklyHours: number = 0,
    ) => {
      const metrics = getMetrics(weeklyHours);
      if (!metrics) return null;
      const { target, warning } = calcTargetCalories(goalType, metrics.tdee, metrics.bmr);
      const macros = calcMacroTargets(goalType, target, profile.weight);
      return { targetCalories: target, warning, macros, metrics };
    },
    [getMetrics, profile.weight],
  );

  return { profile, setProfile, isSet, getMetrics, getTargets };
}
