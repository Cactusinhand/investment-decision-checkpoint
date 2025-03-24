// src/components/investment-evaluation/index.ts
// 导出主要组件
export { default as InvestmentEvaluation } from './components/InvestmentEvaluation';
export { default as EvaluationResult } from './components/EvaluationResult';
export { default as EvaluationProcess } from './components/EvaluationProcess';
export { default as EvaluationChart } from './components/EvaluationChart';

// 导出类型
export * from './types';

// 导出工具函数
export { 
  evaluateInvestmentDecision,
  evaluateInvestmentDecisionSync,
  validateDecisionInputs
} from './utils/evaluationUtils';

export {
  analyzeDecisionConsistency,
  analyzeCognitiveBiasesImpact,
  generateAdvancedRecommendations,
  analyzeConflictPoints
} from './utils/reasoningUtils';

// 导出验证工具
export {
  validateAnswerType,
  validateAllAnswerTypes
} from './utils/typeValidation';

// 导出API客户端
export {
  analyzeLogicConsistency,
  analyzeRiskConsistency,
  analyzeCognitiveBiases
} from './api/deepseekAPI';

// 导出常量（排除已在types中导出的）
export {
  API_ANALYSIS_QUESTIONS,
  API_TIMEOUT,
  API_RETRY_COUNT
} from './constants';