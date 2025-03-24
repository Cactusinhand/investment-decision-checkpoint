// 基础类型定义
export interface UserProfile {
  id: string;
  name: string;
  riskTolerance: string;
  preferredStrategies: string[];
}

export interface InvestmentDecision {
  id: string;
  name: string;
  stage: number;
  answers: Record<string, any>;
  completed: boolean;
  reviewScheduled?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  options?: string[];
  required: boolean;
  help?: string;
  terms?: string[];
}

// 风险评估相关类型
export interface RiskAssessmentResult {
  name: string;
  score: number;
  description: string;
  recommendation: string;
}

// API分析结果类型
export interface DeepSeekAnalysisResult {
  consistencyScore: number;
  conflictPoints: string[];
  suggestions: string[];
  reasoningPath?: string;
}

// 评估相关类型
export interface StageScore {
  score: number;
  strengths: string[];
  weaknesses: string[];
  details?: any;
}

export type EvaluationRating = 'system' | 'stable' | 'cautious' | 'high-risk';

export interface EvaluationResult {
  totalScore: number;
  rating: EvaluationRating;
  stageScores: Record<string, StageScore>;
  overallStrengths: string[];
  overallWeaknesses: string[];
  recommendations: string[];
  apiEnhanced?: boolean;
}

export enum EvaluationStep {
  VALIDATING = 'validating',
  BASIC_SCORING = 'basic_scoring',
  API_ANALYSIS = 'api_analysis',
  FINALIZING = 'finalizing',
  COMPLETE = 'complete'
}

export enum EvaluationStage {
  GOALS_AND_RISK = '1',
  INVESTMENT_METHOD = '2',
  TRADING_RULES = '3',
  RISK_MANAGEMENT = '4',
  INFO_VALIDATION = '5',
  COGNITIVE_BIAS = '6',
  DOCUMENTATION = '7'
}
