# 轻食计 · AI 健康饮食助手

> 每一口，都算数。

一个 AI 驱动的个人健康与饮食管理网页应用。围绕「算得准、吃得明白、练得科学」设计，帮助用户管理体重、记录饮食、追踪运动，并获得 AI 饮食与训练建议。

- **在线体验（妙搭托管版）**：https://4kpfkq7xujwwt.doubaoapps.com/app/app_17e5mtw4dg4
- **开源版本**：本仓库，可直接克隆到本地运行、二次开发

## 功能

| 模块 | 能力 |
| --- | --- |
| 身体数据 | 身高体重（可选年龄、性别、腰围、颈围）→ 实时计算 BMI、体脂率（简易法 + 海军法估算）、基础代谢 BMR、每日总消耗 TDEE |
| 目标管理 | 设置增肌 / 减脂目标与目标体重，展示当前值与目标值的进度差 |
| 饮食记录 | 按早/午/晚/加餐记录；日常食物按克、餐厅食物按份/个（如麦当劳单品填个数而非克重），自动汇总热量与三大营养素 |
| 食物库 | 内置精简常用食物（日常 + 餐厅两类），支持自定义增删改；联网搜索到的食物可一键存入自定义食物库 |
| AI 拍照识别 | 拍摄食物照片，识别食物种类与份量，确认后计入热量（默认一人份，可手动改分量） |
| AI 饮食推荐 | 根据目标体重、TDEE 与增肌/减脂目标，生成全日或单餐（早/午/晚/加餐）推荐，支持一键添加 |
| 运动记录 | 20 种常见运动按 MET 值计算消耗，实时展示热量缺口 / 盈余 |
| 训练计划 | 居家无器械 与 健身房 两种场景；根据每周运动时长（<3h 新手 / ≥3h 进阶）给出不同强度计划 |
| 安全兜底 | 减脂目标热量不低于 BMR 的 80%，全程提示「健康管理参考，不构成医疗建议」 |

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | React 19 + TypeScript 5.9 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS v4 + CVA |
| 组件 | shadcn/ui（基于 Radix UI），整体风格为 Ant Design 色系（主色 #1677ff） |
| 路由 | react-router-dom v7 |
| 图表 | echarts / echarts-for-react / recharts |
| 动画 | framer-motion / gsap / @formkit/auto-animate |
| 表单 | react-hook-form + zod |
| 图标 | lucide-react |

## 快速开始

环境要求：Node.js 18+（实测 Node 22 / npm 10 通过）。

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器 → http://localhost:8001
npx vite build       # 打包静态文件 → dist/client/（用任意静态服务器打开）
```

想换端口：

```bash
# macOS / Linux
CLIENT_DEV_PORT=5173 npm run dev
# Windows PowerShell
$env:CLIENT_DEV_PORT="5173"; npm run dev
```

### 关于 `npm run build`

`npm run build` 调用的是 `scripts/build.sh`（需 bash），它除了 vite 打包，还会把 `public/`、`shared/capabilities`、`shared/static` 分别归位到 `dist/output`、`dist/output_capabilities`、`dist/output_static` —— 这是妙搭平台的交付目录结构。

- 只想拿到静态网站：直接用 `npx vite build`，用 `dist/client/` 部署即可。
- 想在 Windows 上跑完整平台打包：用 Git Bash 或 WSL 执行 `bash scripts/build.sh`。

## 目录结构

```
src/
├── index.tsx                     # 应用入口
├── app.tsx                       # 路由配置
├── index.css / tailwind-theme.css / typography.css（全局样式与主题变量）
├── components/
│   ├── BottomTabBar.tsx          # 底部标签栏
│   ├── CalorieRing.tsx           # 热量环
│   ├── DietRecommendation.tsx    # AI 饮食推荐组件
│   ├── EmptyState.tsx
│   ├── HealthDisclaimer.tsx      # 健康免责声明
│   ├── Layout.tsx                # 页面外框
│   ├── NutrientProgress.tsx      # 三大营养素进度条
│   └── ui/                       # shadcn/ui 组件库（55 个）
├── pages/
│   ├── HomePage/                 # 首页（身体数据 + 今日概览）
│   ├── DietPage/                 # 饮食记录
│   ├── FoodPickerPage/           # 选食物（食物库 / 搜索 / 自定义）
│   ├── FoodEditPage/             # 添加 / 编辑食物
│   ├── ExercisePage/             # 运动记录
│   ├── TrainingPage/             # 训练计划
│   ├── ProfilePage/              # 目标体重与个人设置
│   ├── ExamplePage/              # 示例页（可删）
│   └── NotFoundPage/
├── hooks/                        # useProfile / useGoal / useDietRecords / useExerciseRecords / useFoodLibrary / useTrainingPref / use-mobile
├── data/                         # foods.ts（内置食物库）met.ts（运动 MET 表）
└── lib/                          # calculations.ts（BMI/BMR/TDEE/体脂）constants.ts / storage.ts / utils.ts

shared/
├── capabilities/                 # 平台能力声明（AI 相关，4 个）
├── static/                       # 需鉴权的静态资源目录（当前为空）
└── plugin-types.ts               # 插件类型定义

scripts/
├── dev.mjs                       # 开发服务器启动器（含日志与端口清理）
├── build.sh                      # 平台交付打包脚本（需 bash）
└── setup-git-hooks.mjs           # 本地 git hook 安装
```

## 数据存储

当前版本**没有后端、没有账号体系**，所有数据（身体数据、目标、饮食与运动记录、自定义食物库）保存在浏览器 `localStorage`。

- 优点：开箱即用，不传服务器，隐私安全。
- 局限：换设备 / 换浏览器 / 清缓存不共享。

如需做多端同步或账号体系，把 `src/lib/storage.ts` 的读写层换掉即可——它是全应用唯一的数据进出口，页面与 hooks 都只依赖它，接 REST / 数据库不会牵连 UI。

## AI 能力说明

AI 功能（拍照识别、联网搜索、饮食推荐、训练计划生成）在原始版本中通过妙搭平台的插件体系调用，对应 `shared/capabilities/` 下的 4 个声明文件：

| 能力文件 | 对应功能 |
| --- | --- |
| `food_image_recognition_1.json` | AI 拍照识别食物 |
| `food_nutrition_search_1.json` | 联网搜索食物营养数据 |
| `ai_diet_recommendation_1.json` | AI 饮食推荐 |
| `personalized_fitness_plan_generator_1.json` | 个性化训练计划 |

脱离妙搭自行部署时，这些调用不可用，需要接入自己的 AI 服务（大模型 / 图像识别 / 搜索 API）。接入点集中在 `src/lib/constants.ts` 的 `PLUGIN_*` 常量与组件内的 `capabilityClient` 调用处。

不受影响的部分：BMI、体脂率、BMR、TDEE 等本地计算，饮食与运动记录，内置食物库，训练计划模板。

> 敏感配置（如 API Key）请通过环境变量注入，不要提交到仓库。

## 已验证

以下是克隆本仓库后的实测记录（2026-11，Windows / Node 22.23 / npm 10.9）：

- `npm install`：成功，878 个包，约 45 秒
- `npx vite build`：成功，2290 个模块，约 1.3 秒，产物在 `dist/client/`
- `npm run dev`：成功，`http://localhost:8001` 返回 200，首页正常渲染（无白屏）

### 与平台原版的差异

为使“克隆下来就能跑”成立，开放源码相对原版做了两处最小修正，均不影响平台内运行：

1. `@radix-ui/react-navigation-menu` 原声明为 `^2.1.13`（平台私有版本线），公共 npm 只有 1.x（最新 1.4.1），已改为 `^1.4.1`；否则 `npm install` 会报 `ETARGET` 直接失败。
2. `scripts/dev.mjs` 原本用 `spawn('npx')` 启动 vite，这在 Windows 上会因 `npx` 是 `.cmd` 脚本而报 `ENOENT`/`EINVAL`，已改为直接用 `process.execPath` 调 `node_modules/vite/bin/vite.js`，Windows / macOS / Linux 通用。
3. `vite.config.ts` 增加了一个品牌兜底插件：平台发布时会把 HTML 里的应用名占位符注入为真值，脱离平台则不会，导致标题显示为占位符。插件仅补上标题与描述，**不碰** 与运行路径、环境、鉴权相关的占位符。

字体方面：平台预设会把字体请求指向 `miaoda.feishu.cn/fonts` 镜像。若需完全自托管，请把 `index.css` / 主题变量里的 `font-family` 换成本地字体并引入自己的字体文件。

## 免责声明

本项目为健康管理工具，所有计算与建议仅供参考，**不构成医疗建议、诊断或治疗方案**。减脂 / 增肌请结合自身健康状况，必要时咨询医生或注册营养师。

## License

[MIT](LICENSE)

## 致谢

- UI 组件：[shadcn/ui](https://ui.shadcn.com/) 与 [Radix UI](https://www.radix-ui.com/)
- 图标：[Lucide](https://lucide.dev/)
- 本项目最初由妙搭（Miaoda）平台生成原型，导出后整理开源。
