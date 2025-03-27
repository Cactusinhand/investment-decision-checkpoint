import { 
  InvestmentDecision,
  Question,
  EvaluationStage,
  EvaluationResult,
  DeepSeekAnalysisResult
} from '../../types';

// 本地使用的评估步骤类型
export type LocalEvaluationStep = 
  | 'initial'
  | 'processing'
  | 'complete'
  | 'error';

// 投资检查点组件属性
export interface InvestmentCheckpointProps {
  currentDecision: InvestmentDecision | null;
  isEditing: boolean;
  isSaving: boolean;
  language: 'en' | 'zh';
  onSave: (decision: InvestmentDecision) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean; // 添加只读模式属性
}

// API 分析函数类型
export interface APIAnalysisFunctions {
  analyzeLogicConsistency: (
    apiKey: string,
    buyRules: string,
    sellRules: string,
    stopLossRules: string,
    riskManagement: string,
    language?: string
  ) => Promise<DeepSeekAnalysisResult>;
  
  analyzeRiskConsistency: (
    apiKey: string,
    riskTolerance: string,
    riskIdentification: string,
    maxLoss: string,
    language?: string
  ) => Promise<DeepSeekAnalysisResult>;
  
  analyzeCognitiveBiases: (
    apiKey: string,
    biasesAwareness: string,
    biasMitigation: string,
    language?: string
  ) => Promise<DeepSeekAnalysisResult>;
}

// 评估状态
export interface EvaluationState {
  step: LocalEvaluationStep;
  isProcessing: boolean;
  error: string | null;
  result: EvaluationResult | null;
}

// 最小有效答案长度
export const MIN_VALID_ANSWER_LENGTH = 10;
