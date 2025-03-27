import { 
  InvestmentDecision, 
  EvaluationResult,
  EvaluationRating,
  StageScore,
  Question,
  EvaluationStep,
  EvaluationStage,
  DeepSeekAnalysisResult
} from '../../types';
import { RATING_RANGES, MIN_VALID_ANSWER_LENGTH } from '../../constants';

// 评估状态
export interface EvaluationState {
  isEvaluating: boolean;
  currentStep: EvaluationStep;
  progress: number;
  error: string | null;
}

// 组件Props
export interface InvestmentEvaluationProps {
  decision: InvestmentDecision;
  language: 'zh' | 'en';
  onComplete: (result: EvaluationResult) => void;
  onClose: () => void;
  translations?: any;
  apiKey?: string;
}

// 阶段权重配置
export const STAGE_WEIGHTS: Record<EvaluationStage, number> = {
  [EvaluationStage.GOALS_AND_RISK]: 20,
  [EvaluationStage.INVESTMENT_METHOD]: 15,
  [EvaluationStage.TRADING_RULES]: 20,
  [EvaluationStage.RISK_MANAGEMENT]: 25,
  [EvaluationStage.INFO_VALIDATION]: 10,
  [EvaluationStage.COGNITIVE_BIAS]: 5,
  [EvaluationStage.DOCUMENTATION]: 5
};

// 阶段名称多语言配置
export const STAGE_NAMES: Record<EvaluationStage, Record<'zh' | 'en', string>> = {
  [EvaluationStage.GOALS_AND_RISK]: {
    zh: '目标与风险',
    en: 'Goal & Risk'
  },
  [EvaluationStage.INVESTMENT_METHOD]: {
    zh: '投资方法',
    en: 'Investment Method'
  },
  [EvaluationStage.TRADING_RULES]: {
    zh: '买卖规则',
    en: 'Buy/Sell Rules'
  },
  [EvaluationStage.RISK_MANAGEMENT]: {
    zh: '风险管理',
    en: 'Risk Management'
  },
  [EvaluationStage.INFO_VALIDATION]: {
    zh: '信息验证',
    en: 'Information Validation'
  },
  [EvaluationStage.COGNITIVE_BIAS]: {
    zh: '认知偏差',
    en: 'Cognitive Bias'
  },
  [EvaluationStage.DOCUMENTATION]: {
    zh: '文档审查',
    en: 'Documentation Review'
  }
};

// 导出所需常量，以修复导入错误
export { RATING_RANGES, MIN_VALID_ANSWER_LENGTH };
// 重新导出类型
export { EvaluationStep, EvaluationStage };
export type { 
  DeepSeekAnalysisResult, 
  EvaluationResult,
  EvaluationRating,
  StageScore,
  InvestmentDecision,
  Question
};