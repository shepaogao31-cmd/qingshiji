import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Home,
  Building2,
  Dumbbell,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { capabilityClient, logger } from '@lark-apaas/client-toolkit-lite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useProfile } from '@/hooks/useProfile';
import { useGoal } from '@/hooks/useGoal';
import { useTrainingPref } from '@/hooks/useTrainingPref';
import { useExerciseRecords } from '@/hooks/useExerciseRecords';
import { TRAINING_ACTIONS, PLUGIN_PLAN_GENERATE, LEVEL_LABELS } from '@/lib/constants';
import EmptyState from '@/components/EmptyState';

function getBuiltInPlan(
  scene: 'home' | 'gym',
  level: 'beginner' | 'advanced',
  goalType: 'muscle' | 'fat',
) {
  const homeBeginner = [
    {
      title: '第1天 · 全身基础',
      duration: '30分钟',
      actions: [
        { name: '俯卧撑（跪姿）', muscle: '胸/三头', sets: '3组 × 10次' },
        { name: '深蹲', muscle: '腿/臀', sets: '3组 × 15次' },
        { name: '平板支撑', muscle: '核心', sets: '3组 × 30秒' },
        { name: '超人式', muscle: '背/后链', sets: '3组 × 12次' },
      ],
    },
    {
      title: '第2天 · 上肢 + 核心',
      duration: '25分钟',
      actions: [
        { name: '靠墙倒立撑', muscle: '肩/三头', sets: '3组 × 8次' },
        { name: '仰卧卷腹', muscle: '腹直肌', sets: '3组 × 15次' },
        { name: '椅子臂屈伸', muscle: '三头肌', sets: '3组 × 10次' },
        { name: '鸟狗式', muscle: '核心稳定', sets: '3组 × 10次/侧' },
      ],
    },
    {
      title: '第3天 · 下肢 + 有氧',
      duration: '35分钟',
      actions: [
        { name: '弓步蹲', muscle: '腿/臀', sets: '3组 × 10次/侧' },
        { name: '臀桥', muscle: '臀大肌', sets: '3组 × 15次' },
        { name: '提踵', muscle: '小腿', sets: '3组 × 20次' },
        { name: '开合跳', muscle: '有氧', sets: '3组 × 30秒' },
      ],
    },
  ];

  const homeAdvanced = [
    {
      title: '第1天 · 推拉复合',
      duration: '45分钟',
      actions: [
        { name: '标准俯卧撑', muscle: '胸/三头', sets: '4组 × 15次' },
        { name: '钻石俯卧撑', muscle: '三头/胸', sets: '3组 × 10次' },
        { name: '引体向上（或反向划船）', muscle: '背/二头', sets: '4组 × 8次' },
        { name: '悬垂举腿', muscle: '下腹', sets: '3组 × 12次' },
      ],
    },
    {
      title: '第2天 · 腿部力量',
      duration: '50分钟',
      actions: [
        { name: '手枪深蹲', muscle: '腿/臀', sets: '3组 × 6次/侧' },
        { name: '保加利亚分腿蹲', muscle: '单腿力量', sets: '4组 × 10次/侧' },
        { name: '单腿臀桥', muscle: '臀大肌', sets: '3组 × 12次/侧' },
        { name: '跳箱', muscle: '爆发', sets: '3组 × 8次' },
      ],
    },
    {
      title: '第3天 · 全身爆发 + 核心',
      duration: '40分钟',
      actions: [
        { name: '波比跳', muscle: '全身有氧', sets: '4组 × 15次' },
        { name: '登山跑', muscle: '核心', sets: '4组 × 30秒' },
        { name: '侧平板', muscle: '腹斜肌', sets: '3组 × 45秒/侧' },
        { name: '火箭推', muscle: '全身爆发', sets: '3组 × 12次' },
      ],
    },
  ];

  const gymBeginner = [
    {
      title: '第1天 · 胸+三头',
      duration: '50分钟',
      actions: [
        { name: '平板杠铃卧推', muscle: '胸大肌', sets: '4组 × 10次' },
        { name: '上斜哑铃飞鸟', muscle: '上胸', sets: '3组 × 12次' },
        { name: '绳索下压', muscle: '三头肌', sets: '3组 × 12次' },
        { name: '窄距俯卧撑', muscle: '三头/胸', sets: '3组 × 10次' },
      ],
    },
    {
      title: '第2天 · 背+二头',
      duration: '50分钟',
      actions: [
        { name: '引体向上（辅助）', muscle: '背阔肌', sets: '4组 × 8次' },
        { name: '杠铃划船', muscle: '背中', sets: '4组 × 10次' },
        { name: '坐姿划船', muscle: '中下背', sets: '3组 × 12次' },
        { name: '杠铃弯举', muscle: '二头肌', sets: '3组 × 12次' },
      ],
    },
    {
      title: '第3天 · 腿+肩',
      duration: '55分钟',
      actions: [
        { name: '杠铃深蹲', muscle: '腿/臀', sets: '4组 × 10次' },
        { name: '腿举', muscle: '股四头肌', sets: '3组 × 12次' },
        { name: '坐姿肩推', muscle: '三角肌', sets: '3组 × 10次' },
        { name: '哑铃侧平举', muscle: '中束', sets: '3组 × 15次' },
      ],
    },
  ];

  const gymAdvanced = [
    {
      title: '第1天 · 胸+三头（推日）',
      duration: '70分钟',
      actions: [
        { name: '平板杠铃卧推', muscle: '胸大肌', sets: '5组 × 8次' },
        { name: '上斜哑铃卧推', muscle: '上胸', sets: '4组 × 10次' },
        { name: '双杠臂屈伸', muscle: '胸/三头', sets: '4组 × 12次' },
        { name: '绳索下压', muscle: '三头', sets: '3组 × 15次' },
        { name: '过顶臂屈伸', muscle: '长头', sets: '3组 × 12次' },
      ],
    },
    {
      title: '第2天 · 背+二头（拉日）',
      duration: '70分钟',
      actions: [
        { name: '引体向上（负重）', muscle: '背阔肌', sets: '5组 × 6次' },
        { name: '硬拉', muscle: '后链/全身', sets: '4组 × 6次' },
        { name: 'T杠划船', muscle: '中背', sets: '4组 × 10次' },
        { name: '单臂哑铃划船', muscle: '背阔厚度', sets: '3组 × 10次' },
        { name: '锤式弯举', muscle: '二头/肱桡', sets: '3组 × 12次' },
      ],
    },
    {
      title: '第3天 · 腿+肩',
      duration: '75分钟',
      actions: [
        { name: '杠铃深蹲', muscle: '腿/臀', sets: '5组 × 6次' },
        { name: '罗马尼亚硬拉', muscle: '腘绳/臀', sets: '4组 × 10次' },
        { name: '站姿杠铃推举', muscle: '三角肌', sets: '4组 × 8次' },
        { name: '哑铃侧平举', muscle: '中束', sets: '4组 × 15次' },
        { name: '面拉', muscle: '后束/肩袖', sets: '3组 × 15次' },
      ],
    },
  ];

  if (scene === 'home') return level === 'beginner' ? homeBeginner : homeAdvanced;
  return level === 'beginner' ? gymBeginner : gymAdvanced;
}

export default function TrainingPage() {
  const navigate = useNavigate();
  const { profile, isSet } = useProfile();
  const { goal } = useGoal();
  const { pref, setPref, autoLevel } = useTrainingPref();
  const { weeklyHours } = useExerciseRecords(profile.weight || 60);

  const [scene, setScene] = useState<'home' | 'gym'>(pref.scene);
  const [level, setLevel] = useState<'beginner' | 'advanced'>(pref.level);
  const [aiPlan, setAiPlan] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPlan, setShowAiPlan] = useState(false);

  const handleSceneChange = (v: string) => {
    const s = v as 'home' | 'gym';
    setScene(s);
    setPref({ scene: s });
  };

  const handleLevelChange = (v: string) => {
    const l = v as 'beginner' | 'advanced';
    setLevel(l);
    setPref({ level: l });
  };

  // 过滤训练动作
  const filteredActions = TRAINING_ACTIONS.filter(
    (a) =>
      (a.scene === scene || a.scene === 'both') &&
      (a.level === level || a.level === 'both'),
  );

  // 按肌群分组
  const groupedByMuscle = filteredActions.reduce<Record<string, typeof filteredActions>>(
    (acc, a) => {
      const key = a.muscle;
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    },
    {},
  );

  const generatePlan = useCallback(async () => {
    if (!isSet) {
      toast.error('请先填写身体数据');
      navigate('/profile');
      return;
    }
    setAiLoading(true);
    setAiPlan('');
    setShowAiPlan(true);
    try {
      const bodyData = `身高：${profile.height}cm，体重：${profile.weight}kg${
        profile.age ? `，年龄：${profile.age}岁` : ''
      }${profile.gender ? `，性别：${profile.gender === 'male' ? '男' : '女'}` : ''}${
        profile.waist ? `，腰围：${profile.waist}cm` : ''
      }${profile.neck ? `，颈围：${profile.neck}cm` : ''}`;

      const executor = (capabilityClient as any).load(PLUGIN_PLAN_GENERATE);
      let full = '';
      for await (const chunk of (executor as any).callStream('textGenerate', {
        body_data: bodyData,
        fitness_goal: goal.type === 'fat' ? '减脂' : '增肌',
        training_scenario: scene === 'home' ? '居家无器械' : '健身房器械',
        training_experience: level === 'beginner' ? '新手' : '进阶',
      })) {
        const piece = chunk.content ?? '';
        if (piece) {
          full += piece;
          setAiPlan(full);
        }
      }
    } catch (err) {
      logger.error('plan generation failed:', String(err));
      toast.error('计划生成失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  }, [isSet, profile, goal.type, scene, level, navigate]);

  // 内置训练计划模板
  const builtInPlan = getBuiltInPlan(scene, level, goal.type);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 pt-4 pb-24">
        {/* 顶部 */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="返回"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h1 className="text-[16px] font-medium text-foreground">训练计划</h1>
          </div>
        </div>

        {/* 场景选择 */}
        <Tabs
          value={scene}
          onValueChange={handleSceneChange}
          className="mt-3"
        >
          <TabsList className="grid h-8 w-full grid-cols-2">
            <TabsTrigger value="home" className="text-xs">
              <Home className="mr-1 size-3.5" />
              居家无器械
            </TabsTrigger>
            <TabsTrigger value="gym" className="text-xs">
              <Building2 className="mr-1 size-3.5" />
              健身房器械
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 经验等级选择 */}
        <Card className="mt-3 border-border shadow-sm">
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <div className="text-xs text-muted-foreground">训练经验</div>
              <div className="text-sm font-medium text-foreground">
                {LEVEL_LABELS[level]}
                <span className="ml-2 text-[11px] text-muted-foreground">
                  (周运动约 {weeklyHours} 小时)
                </span>
              </div>
            </div>
            <Select value={level} onValueChange={handleLevelChange}>
              <SelectTrigger className="h-8 w-36 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner" className="text-xs">
                  新手（{'<'}3小时/周）
                </SelectItem>
                <SelectItem value="advanced" className="text-xs">
                  进阶（≥3小时/周）
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* AI 生成专属计划按钮 */}
        <Card className="mt-3 border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-medium text-foreground">
                AI 生成专属计划
              </div>
              <div className="text-[11px] text-muted-foreground">
                根据你的身体数据和目标，定制个性化方案
              </div>
            </div>
            <Button
              size="sm"
              onClick={generatePlan}
              disabled={aiLoading}
              className="h-7"
            >
              {aiLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-1 size-3.5" />
                  生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI 计划展示区 */}
        {showAiPlan && (aiLoading || aiPlan) && (
          <Card className="mt-3 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-primary" />
                你的专属训练计划
                {aiLoading && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-sm max-w-none text-sm text-foreground dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiPlan || '_正在为你生成专属计划..._'}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 内置训练计划 */}
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            推荐训练计划
          </h3>
          <div className="space-y-2">
            {builtInPlan.map((day, idx) => (
              <Card key={idx} className="border-border shadow-sm">
                <CardContent className="p-0">
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`day-${idx}`} className="border-0">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <Dumbbell className="size-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {day.title}
                          </span>
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            {day.duration}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <div className="space-y-1.5">
                          {day.actions.map((a, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-md bg-muted/40 p-2"
                            >
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {a.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {a.muscle}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {a.sets}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 动作库 */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            常见动作库
          </h3>
          {Object.keys(groupedByMuscle).length === 0 ? (
            <EmptyState title="暂无匹配动作" description="试试切换场景或难度" className="py-6" />
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedByMuscle).map(([muscle, actions]) => (
                <Card key={muscle} className="border-border shadow-sm">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Target className="size-4 text-info" />
                      {muscle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {actions.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-md bg-muted/40 p-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {a.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                          >
                            {a.level === 'both' ? '通用' : a.level === 'beginner' ? '新手' : '进阶'}
                          </Badge>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {a.tips}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
