export const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export type MealType = (typeof MEAL_ORDER)[number];

export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: '久坐不动', factor: 1.2, desc: '几乎不运动' },
  { key: 'light', label: '轻度活动', factor: 1.375, desc: '每周运动 1-3 小时' },
  { key: 'moderate', label: '中度活动', factor: 1.55, desc: '每周运动 3-5 小时' },
  { key: 'active', label: '高度活跃', factor: 1.725, desc: '每周运动 6-7 小时' },
  { key: 'very_active', label: '极活跃', factor: 1.9, desc: '每周运动 10 小时以上' },
];

export function getActivityLevelByWeeklyHours(hours: number) {
  if (hours <= 1) return ACTIVITY_LEVELS[0];
  if (hours <= 3) return ACTIVITY_LEVELS[1];
  if (hours <= 5) return ACTIVITY_LEVELS[2];
  if (hours <= 7) return ACTIVITY_LEVELS[3];
  return ACTIVITY_LEVELS[4];
}

export const GOAL_LABELS: Record<string, string> = {
  muscle: '增肌',
  fat: '减脂',
};

export const SCENE_LABELS: Record<string, string> = {
  home: '居家无器械',
  gym: '健身房器械',
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: '新手',
  advanced: '进阶',
};

// 插件实例 ID
export const PLUGIN_FOOD_IMAGE = 'food_image_recognition_1';
export const PLUGIN_FOOD_SEARCH = 'food_nutrition_search_1';
export const PLUGIN_PLAN_GENERATE = 'personalized_fitness_plan_generator_1';
export const PLUGIN_DIET_RECOMMENDATION = 'ai_diet_recommendation_1';

// 训练动作库（内置常见动作）
export interface ITrainingAction {
  id: string;
  name: string;
  muscle: string;
  scene: 'home' | 'gym' | 'both';
  level: 'beginner' | 'advanced' | 'both';
  tips: string;
}

export const TRAINING_ACTIONS: ITrainingAction[] = [
  { id: '1', name: '俯卧撑', muscle: '胸/三头肌', scene: 'home', level: 'both', tips: '身体呈一条直线，核心收紧，胸部贴近地面' },
  { id: '2', name: '深蹲', muscle: '腿/臀', scene: 'both', level: 'both', tips: '膝盖与脚尖方向一致，下蹲时大腿与地面平行' },
  { id: '3', name: '平板支撑', muscle: '核心', scene: 'home', level: 'both', tips: '身体呈一条直线，不要塌腰也不要翘臀' },
  { id: '4', name: '仰卧起坐', muscle: '腹部', scene: 'home', level: 'beginner', tips: '双手轻放耳侧，不要抱头拉扯颈部' },
  { id: '5', name: '弓步蹲', muscle: '腿/臀', scene: 'both', level: 'both', tips: '前腿膝盖不超过脚尖，后腿膝盖接近地面' },
  { id: '6', name: '臀桥', muscle: '臀部', scene: 'home', level: 'both', tips: '肩和脚支撑，臀部收紧抬至身体呈一条直线' },
  { id: '7', name: '开合跳', muscle: '全身/心肺', scene: 'home', level: 'beginner', tips: '起跳时手脚同步，落地轻缓冲' },
  { id: '8', name: '卷腹', muscle: '腹部', scene: 'home', level: 'advanced', tips: '上背部离地即可，下背贴地' },
  { id: '9', name: '引体向上', muscle: '背/二头肌', scene: 'gym', level: 'advanced', tips: '核心收紧，用背阔肌发力拉至下巴过杠' },
  { id: '10', name: '卧推', muscle: '胸/三头肌', scene: 'gym', level: 'both', tips: '肩胛骨收紧，杠铃下放至胸中部' },
  { id: '11', name: '硬拉', muscle: '后链/全身', scene: 'gym', level: 'advanced', tips: '背挺直，用腿和臀部发力，杠铃贴近身体' },
  { id: '12', name: '杠铃深蹲', muscle: '腿/臀', scene: 'gym', level: 'both', tips: '杠铃放于斜方肌上，下蹲时膝盖与脚尖同向' },
  { id: '13', name: '哑铃推举', muscle: '肩/三头肌', scene: 'gym', level: 'both', tips: '核心收紧，推举至手臂伸直但不锁肘' },
  { id: '14', name: '高位下拉', muscle: '背/二头肌', scene: 'gym', level: 'beginner', tips: '身体稍后仰，用背阔肌发力将拉杆拉至上胸' },
  { id: '15', name: '哑铃弯举', muscle: '二头肌', scene: 'gym', level: 'beginner', tips: '大臂贴紧身体，仅前臂弯曲' },
];
