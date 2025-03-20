// 风险评估问题类型定义
export interface Question {
  id: string;
  textZh: string;
  textEn: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "date";
  options?: {
    zh: string[];
    en: string[];
  };
  required: boolean;
  category:
  | "financial"
  | "goal"
  | "psychological"
  | "experience"
  | "demographic";
}

// 风险评估结果类型定义
export interface RiskAssessmentResult {
  score: number;
  type: string;
  name: string;
  description: string;
  recommendation: string;
  needsVerification?: boolean; // 标记是否需要进一步验证
  needsWarning?: boolean; // 标记是否需要显示风险警告
}

// 风险评估答案类型定义
export type RiskAssessmentAnswers = Record<string, any>;

// 风险类型定义
export interface RiskProfile {
  name: string;
  description: string;
  recommendation: string;
  scoreRange: [number, number];
}
