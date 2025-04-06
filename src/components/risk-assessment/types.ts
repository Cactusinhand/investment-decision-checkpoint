import { RiskProfileType } from '../../types'; // Import global type

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

// 重写RiskAssessmentResult类型，使其与全局定义完全一致
export interface RiskAssessmentResult {
  name: string;
  score: number;
  description: string;
  recommendation: string;
  type: RiskProfileType; // 使用全局的 RiskProfileType，且为必需
  // 移除可选属性
  // needsVerification?: boolean;
  // needsWarning?: boolean;
}

// 不需要从全局导入
// export { RiskAssessmentResult };
