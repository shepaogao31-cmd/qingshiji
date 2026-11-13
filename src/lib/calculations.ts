import { clamp, round1, round0 } from './utils';
import { getActivityLevelByWeeklyHours } from './constants';

export interface IProfileCalcInput {
  height: number; // cm
  weight: number; // kg
  age?: number;
  gender?: 'male' | 'female';
  waist?: number; // cm
  neck?: number; // cm
}

export interface IBodyCalcResult {
  bmi: number;
  bodyFat: number | null; // 体脂率 %
  bodyFatAccuracy: 'none' | 'basic' | 'high'; // 估算精度
  bmr: number; // 基础代谢 kcal
  bmrAccuracy: 'basic' | 'high';
  tdee: number; // 每日总消耗 kcal
  activityFactor: number;
  activityLevel: string;
}

/**
 * 计算 BMI
 */
export function calcBMI(height: number, weight: number): number {
  if (!height || !weight) return 0;
  const hM = height / 100;
  return round1(weight / (hM * hM));
}

/**
 * 体脂率估算（简易版）：BMI 公式
 * 体脂率 ≈ 1.2×BMI + 0.23×年龄 - 5.4 - 10.8×性别(男=1,女=0)
 */
export function calcBodyFatSimple(
  bmi: number,
  age?: number,
  gender?: 'male' | 'female',
): number | null {
  if (!age || !gender) return null;
  const genderVal = gender === 'male' ? 1 : 0;
  const bf = 1.2 * bmi + 0.23 * age - 5.4 - 10.8 * genderVal;
  return clamp(round1(bf), 3, 60);
}

/**
 * 体脂率（海军法，高精度）
 * 男性: 495 / (1.0324 - 0.19077×log(腰围-颈围) + 0.15456×log(身高)) - 450
 * 女性: 495 / (1.29579 - 0.35004×log(腰围+髂围-颈围) + 0.22100×log(身高)) - 450
 * 女性无髂围时暂用腰围替代
 */
export function calcBodyFatNavy(
  height: number,
  waist: number,
  neck: number,
  gender: 'male' | 'female',
  hip?: number,
): number {
  const log10 = (n: number) => Math.log10(Math.max(n, 1));
  let bodyFat: number;

  if (gender === 'male') {
    const denom =
      1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height);
    bodyFat = 495 / denom - 450;
  } else {
    const hipVal = hip ?? waist; // 无髂围用腰围近似
    const denom =
      1.29579 - 0.35004 * log10(waist + hipVal - neck) + 0.221 * log10(height);
    bodyFat = 495 / denom - 450;
  }

  return clamp(round1(bodyFat), 3, 60);
}

/**
 * BMR（基础代谢）Mifflin-St Jeor 公式
 * 男 = 10×体重(kg) + 6.25×身高(cm) - 5×年龄 + 5
 * 女 = 10×体重(kg) + 6.25×身高(cm) - 5×年龄 - 161
 * 缺年龄/性别时用简化公式并标注
 */
export function calcBMR(
  height: number,
  weight: number,
  age?: number,
  gender?: 'male' | 'female',
): { value: number; accuracy: 'basic' | 'high' } {
  if (age && gender) {
    const base = 10 * weight + 6.25 * height - 5 * age;
    const val = gender === 'male' ? base + 5 : base - 161;
    return { value: round0(Math.max(val, 800)), accuracy: 'high' };
  }
  // 简化版：按中位数年龄30、女性估算，标注为"基础精度"
  const estimatedAge = 30;
  const base = 10 * weight + 6.25 * height - 5 * estimatedAge - 161;
  return { value: round0(Math.max(base, 800)), accuracy: 'basic' };
}

/**
 * TDEE 每日总消耗 = BMR × 活动系数
 * 活动系数根据每周运动小时数自动判定
 */
export function calcTDEE(bmr: number, weeklyHours: number = 0) {
  const level = getActivityLevelByWeeklyHours(weeklyHours);
  return {
    value: round0(bmr * level.factor),
    activityFactor: level.factor,
    activityLevel: level.label,
  };
}

/**
 * 综合计算入口
 */
export function calcBodyMetrics(
  input: IProfileCalcInput,
  weeklyHours: number = 0,
): IBodyCalcResult {
  const { height, weight, age, gender, waist, neck } = input;

  const bmi = calcBMI(height, weight);
  const bmrResult = calcBMR(height, weight, age, gender);

  // 体脂率：有腰围+颈围+性别 → 海军法；有年龄+性别 → 简易法；否则无法估算
  let bodyFat: number | null = null;
  let bodyFatAccuracy: 'none' | 'basic' | 'high' = 'none';

  if (waist && neck && gender) {
    bodyFat = calcBodyFatNavy(height, waist, neck, gender);
    bodyFatAccuracy = 'high';
  } else if (age && gender) {
    bodyFat = calcBodyFatSimple(bmi, age, gender);
    bodyFatAccuracy = 'basic';
  }

  const tdeeResult = calcTDEE(bmrResult.value, weeklyHours);

  return {
    bmi,
    bodyFat,
    bodyFatAccuracy,
    bmr: bmrResult.value,
    bmrAccuracy: bmrResult.accuracy,
    tdee: tdeeResult.value,
    activityFactor: tdeeResult.activityFactor,
    activityLevel: tdeeResult.activityLevel,
  };
}

/**
 * 目标热量计算
 * 减脂：TDEE × 0.8，但不低于 BMR × 0.8（健康安全下限）
 * 增肌：TDEE × 1.15（轻度盈余）
 */
export function calcTargetCalories(
  goalType: 'muscle' | 'fat',
  tdee: number,
  bmr: number,
): { target: number; warning: string | null } {
  if (goalType === 'muscle') {
    return { target: round0(tdee * 1.15), warning: null };
  }
  // 减脂
  const byTdee = tdee * 0.8;
  const minSafe = bmr * 0.8;
  const target = Math.max(byTdee, minSafe);
  const warning = byTdee < minSafe
    ? '减脂目标热量已自动调整至基础代谢的80%（健康安全下限），请勿长时间低于此水平'
    : null;
  return { target: round0(target), warning };
}

/**
 * 三大营养素目标分配（按目标热量）
 * 减脂：蛋白 2.0g/kg体重，脂肪 0.8g/kg体重，剩余碳水
 * 增肌：蛋白 1.8g/kg体重，脂肪 0.8g/kg体重，剩余碳水
 */
export function calcMacroTargets(
  goalType: 'muscle' | 'fat',
  targetCalories: number,
  weight: number,
) {
  const proteinPerKg = goalType === 'fat' ? 2.0 : 1.8;
  const fatPerKg = 0.8;

  const protein = round0(weight * proteinPerKg);
  const fat = round0(weight * fatPerKg);
  const proteinCal = protein * 4;
  const fatCal = fat * 9;
  const carbsCal = Math.max(targetCalories - proteinCal - fatCal, 0);
  const carbs = round0(carbsCal / 4);

  return { protein, fat, carbs };
}

/**
 * 体重目标完成进度百分比
 * 减脂：(初始体重 - 当前体重) / (初始体重 - 目标体重) × 100
 * 增肌：(当前体重 - 初始体重) / (目标体重 - 初始体重) × 100
 * 这里简化为：根据当前体重与目标体重的差距，相对「当前→目标」路径的进度
 * 以一个「起始估算基准」来计算：减脂时起始取当前体重(假设刚开始)，进度 = 已减 / 需减
 * 由于无历史记录，使用简化版：若当前>目标（减脂），进度按 已减量/总量 算，但起始只能假设为当前
 * 为了更友好，展示「距离目标还差多少」为主，进度条以 0~100% 表示完成度
 *
 * 简化公式：
 *   减脂: 进度 = max(0, min(100, (起始体重 - 当前) / (起始体重 - 目标体重) * 100))
 *   增肌: 进度 = max(0, min(100, (当前 - 起始体重) / (目标体重 - 起始体重) * 100))
 *
 * 由于无历史起始体重，以当前体重为「此刻起点」，进度条作为视觉参考
 * 更可靠的展示：直接显示差值和方向
 */
export function calcWeightProgress(
  currentWeight: number,
  targetWeight: number,
  goalType: 'muscle' | 'fat',
  startWeight?: number,
): number {
  if (!currentWeight || !targetWeight) return 0;
  // 没有起始体重时，假设起始为当前（进度为0或已达100）
  const start = startWeight ?? currentWeight;
  if (goalType === 'fat') {
    if (start <= targetWeight) return currentWeight <= targetWeight ? 100 : 0;
    const total = start - targetWeight;
    const lost = start - currentWeight;
    return clamp(round0((lost / total) * 100), 0, 100);
  }
  // 增肌
  if (start >= targetWeight) return currentWeight >= targetWeight ? 100 : 0;
  const total = targetWeight - start;
  const gained = currentWeight - start;
  return clamp(round0((gained / total) * 100), 0, 100);
}

/**
 * 运动消耗计算：MET × 体重(kg) × 时长(h)
 */
export function calcExerciseCalories(
  met: number,
  weight: number,
  durationMinutes: number,
): number {
  const hours = durationMinutes / 60;
  return round0(met * weight * hours);
}
