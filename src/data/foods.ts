// EXPORTS: IFood, MOCK_FOODS
export interface IFood {
  id: string
  name: string
  category: 'chinese' | 'fastfood' | 'custom' | 'ai_search' | 'restaurant'
  calories: number // 每100g热量（日常食物）或每份热量（餐厅食物，以servingWeight为一份）
  protein: number  // 每100g或每份的蛋白质
  carbs: number    // 每100g或每份的碳水
  fat: number      // 每100g或每份的脂肪
  source: 'builtin' | 'ai_search' | 'user_custom'
  unitType: 'grams' | 'piece' // 计量方式：克重 / 份数
  servingWeight?: number // 单位为 piece 时，一份的重量（克），用于估算
}

export const MOCK_FOODS: IFood[] = [
  // 日常食物（按克重计，每100g营养）— 只保留最基础最常见的
  { id: '1', name: '白米饭', category: 'chinese', calories: 116, protein: 2.6, carbs: 25.6, fat: 0.3, source: 'builtin', unitType: 'grams' },
  { id: '2', name: '鸡蛋', category: 'chinese', calories: 144, protein: 13.3, carbs: 2.8, fat: 8.8, source: 'builtin', unitType: 'grams' },
  { id: '3', name: '鸡胸肉', category: 'chinese', calories: 133, protein: 19.4, carbs: 2.5, fat: 5, source: 'builtin', unitType: 'grams' },
  { id: '4', name: '牛奶', category: 'chinese', calories: 54, protein: 3, carbs: 3.4, fat: 3.2, source: 'builtin', unitType: 'grams' },
  { id: '5', name: '燕麦片', category: 'chinese', calories: 377, protein: 15, carbs: 61, fat: 7, source: 'builtin', unitType: 'grams' },
  { id: '6', name: '苹果', category: 'chinese', calories: 52, protein: 0.3, carbs: 13.5, fat: 0.2, source: 'builtin', unitType: 'grams' },
  { id: '7', name: '番茄炒蛋', category: 'chinese', calories: 86, protein: 5.4, carbs: 4.2, fat: 5.6, source: 'builtin', unitType: 'grams' },
  { id: '8', name: '清炒时蔬', category: 'chinese', calories: 55, protein: 2.1, carbs: 6.3, fat: 2.8, source: 'builtin', unitType: 'grams' },
  // 餐厅食物（按份/个计，每份营养）— 精简到最常见的
  { id: 'r1', name: '麦当劳巨无霸', category: 'restaurant', calories: 540, protein: 25, carbs: 47, fat: 28, source: 'builtin', unitType: 'piece', servingWeight: 219 },
  { id: 'r2', name: '麦当劳薯条（中）', category: 'restaurant', calories: 310, protein: 4, carbs: 42, fat: 15, source: 'builtin', unitType: 'piece', servingWeight: 114 },
  { id: 'r3', name: '肯德基香辣鸡腿堡', category: 'restaurant', calories: 512, protein: 24, carbs: 50, fat: 24, source: 'builtin', unitType: 'piece', servingWeight: 190 },
  { id: 'r4', name: '星巴克拿铁（中杯）', category: 'restaurant', calories: 190, protein: 12, carbs: 19, fat: 7, source: 'builtin', unitType: 'piece', servingWeight: 473 },
]
