// ---- plugin:food_nutrition_search_1 ----
// ============================================================
// 插件 food_nutrition_search_1 (食物营养数据搜索) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface FoodNutritionSearchOneInput {
  /** 需要搜索营养数据的食物名称 */
  food_name: string;
}

/**
 * capabilityClient.load('food_nutrition_search_1').callStream<FoodNutritionSearchOneOutput>('searchSummary', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 FoodNutritionSearchOneOutput 一致，外面没有 data / choices / message 包装：
 *   {"summary":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.summary ?? ''; }
 */
export interface FoodNutritionSearchOneOutput {
  /** [object Object] */
  summary: string;
}
// ---- end:food_nutrition_search_1 ----

// ---- plugin:personalized_fitness_plan_generator_1 ----
// ============================================================
// 插件 personalized_fitness_plan_generator_1 (个性化健身计划生成) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface PersonalizedFitnessPlanGeneratorOneInput {
  /** 训练场景，如：健身房、居家、户外等 */
  training_scenario: string;
  /** 用户训练经验水平，如：新手、初级、中级、高级等 */
  training_experience: string;
  /** 用户身体数据，包含身高、体重、年龄、性别、体脂率等相关信息 */
  body_data: string;
  /** 用户健身目标，可选值：增肌、减脂 */
  fitness_goal: string;
}

/**
 * capabilityClient.load('personalized_fitness_plan_generator_1').callStream<PersonalizedFitnessPlanGeneratorOneOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 PersonalizedFitnessPlanGeneratorOneOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export interface PersonalizedFitnessPlanGeneratorOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  response?: string;
}
// ---- end:personalized_fitness_plan_generator_1 ----

// ---- plugin:food_image_recognition_1 ----
// ============================================================
// 插件 food_image_recognition_1 (食物图像识别) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface FoodImageRecognitionOneInput {
  /** 用户拍摄/上传的食物图片 */
  food_image: string[];
}

/**
 * capabilityClient.load('food_image_recognition_1').callStream<FoodImageRecognitionOneOutput>('imageUnderstanding', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 FoodImageRecognitionOneOutput 一致，外面没有 data / choices / message 包装：
 *   {"reasoningContent":"","response":"示例文本","content":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.reasoningContent ?? ''; }
 */
export interface FoodImageRecognitionOneOutput {
  /** [object Object] */
  reasoningContent?: string;
  /** [object Object] */
  response?: string;
  /** [object Object] */
  content: string;
}
// ---- end:food_image_recognition_1 ----

// ---- plugin:ai_diet_recommendation_1 ----
// ============================================================
// 插件 ai_diet_recommendation_1 (AI 饮食智能推荐) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface AiDietRecommendationOneInput {
  /** 用户的目标体重（单位：kg） */
  target_weight: string;
  /** 用户每日总消耗能量TDEE（单位：大卡） */
  daily_tdee: string;
  /** 用户的健身目标，可选值为增肌/减脂/维持体重 */
  fitness_goal: string;
  /** 用户的饮食偏好或禁忌（可选） */
  dietary_preferences?: string;
}

/**
 * capabilityClient.load('ai_diet_recommendation_1').callStream<AiDietRecommendationOneOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 AiDietRecommendationOneOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export interface AiDietRecommendationOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  response?: string;
}
// ---- end:ai_diet_recommendation_1 ----
