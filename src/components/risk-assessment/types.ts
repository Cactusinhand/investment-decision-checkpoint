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

export interface RiskProfile {
  name: string;
  description: string;
  recommendation: string;
  scoreRange: [number, number];
}

// 风险评估答案类型
export interface RiskAssessmentAnswers {
  [key: string]: string | string[];
}

export interface RiskAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'zh';
  onComplete: (result: RiskAssessmentResult) => void;
}

// 重写RiskAssessmentResult类型，保持与../types/index.ts中的兼容
export interface RiskAssessmentResult {
  name: string;
  score: number;
  description: string;
  recommendation: string;
  type?: string;
  needsVerification?: boolean;
  needsWarning?: boolean;
}

// 不需要从全局导入
// export { RiskAssessmentResult };
