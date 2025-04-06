import { riskProfiles } from '../components/risk-assessment/RiskProfiles'; // Adjust path if necessary

/**
 * Represents the identifier for different risk profiles.
 * Derived from the keys of the riskProfiles constant.
 */
export type RiskProfileType = keyof typeof riskProfiles; // 'conservative' | 'steady' | 'balanced' | 'progressive' | 'aggressive'

/**
 * Represents the user's profile information.
 */
export interface UserProfile {
  /** Unique identifier for the user. */
  id: string;
  /** User's display name. */
  name: string;
  /** User's assessed risk tolerance level (language-independent identifier). */
  riskTolerance: RiskProfileType;
  /** List of investment strategies the user prefers. */
  preferredStrategies: string[];
}

/**
 * Represents a single investment decision being tracked.
 */
export interface InvestmentDecision {
  /** Unique identifier for the decision. */
  id: string;
  /** User-defined name for the decision. */
  name: string;
  /** The current checkpoint stage the user has reached (1-7). */
  stage: number;
  /** Stores the answers provided by the user for each question ID. */
  answers: Record<string, any>; // Using `any` for flexibility, consider more specific types if possible
  /** Indicates if the decision checkpoint process has been fully completed by the user. */
  completed: boolean;
  /** Optional: Date when the decision is scheduled for review. */
  reviewScheduled?: string;
  /** Indicates if the decision has been evaluated. */
  evaluated?: boolean;
  /** The overall score resulting from the evaluation. */
  evaluationScore?: number;
  /** Detailed results of the evaluation. */
  evaluationResult?: EvaluationResult;
}

/**
 * Represents a single question in the investment checkpoint process.
 */
export interface Question {
  /** Unique identifier for the question (e.g., '1-1', '3-2'). */
  id: string;
  /** The text of the question (typically in English as the base). */
  text: string;
  /** The type of input field required for the question. */
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  /** Available options for 'select', 'checkbox', or 'radio' types. */
  options?: string[];
  /** Indicates if the question must be answered. */
  required: boolean;
  /** Optional: Base help/example text associated with the question (may contain placeholders or be language-specific initially). */
  help?: string;
  /** Optional: List of financial terms related to the question for tooltip display. */
  terms?: string[];
}

/**
 * Represents the result of a user's risk assessment.
 */
export interface RiskAssessmentResult {
  /** The display name of the risk profile (language-specific). */
  name: string;
  /** The language-independent identifier of the risk profile. */
  type: RiskProfileType;
  /** The calculated numerical score of the risk assessment. */
  score: number;
  /** A textual description of the risk profile (language-specific). */
  description: string;
  /** General investment recommendation based on the risk profile (language-specific). */
  recommendation: string;
}

/**
 * Represents the structured result from the DeepSeek API analysis.
 */
export interface DeepSeekAnalysisResult {
  /** Score indicating the logical consistency of the decision (0-10). */
  consistencyScore: number;
  /** List of identified potential conflict points in the decision logic. */
  conflictPoints: string[];
  /** List of suggestions for improving the decision logic. */
  suggestions: string[];
  /** Optional: Explanation of the reasoning path taken by the API. */
  reasoningPath?: string;
}

/**
 * Represents the calculated score and feedback for a single evaluation stage.
 */
export interface StageScore {
  /** The numerical score for the stage (0-100). */
  score: number;
  /** List of identified strengths for this stage. */
  strengths: string[];
  /** List of identified weaknesses for this stage. */
  weaknesses: string[];
  /** Optional: Any additional detailed results or metrics for the stage. */
  details?: any; // Consider defining a more specific type if structure is known
}

/**
 * Represents the overall rating category based on the evaluation score.
 */
export type EvaluationRating = 'system' | 'stable' | 'cautious' | 'high-risk';

/**
 * Represents the complete result of an investment decision evaluation.
 */
export interface EvaluationResult {
  /** The final calculated overall score for the decision (0-100). */
  totalScore: number;
  /** The overall rating category derived from the total score. */
  rating: EvaluationRating;
  /** Scores and feedback for each individual stage. */
  stageScores: Record<string, StageScore>; // Key is the stage number (e.g., '1', '4')
  /** List of overall identified strengths across all stages. */
  overallStrengths: string[];
  /** List of overall identified weaknesses across all stages. */
  overallWeaknesses: string[];
  /** List of actionable recommendations based on the evaluation. */
  recommendations: string[];
  /** Optional flag indicating if the evaluation included API-enhanced analysis. */
  apiEnhanced?: boolean;
}

/**
 * Represents the different steps within the evaluation process UI.
 */
export enum EvaluationStep {
  VALIDATING = 'validating', // Input validation step
  BASIC_SCORING = 'basic_scoring', // Rule-based scoring step
  API_ANALYSIS = 'api_analysis', // API call and analysis step
  FINALIZING = 'finalizing', // Compiling results step
  COMPLETE = 'complete' // Evaluation finished
}

/**
 * Represents the different stages (checkpoints) of the investment decision.
 */
export enum EvaluationStage {
  GOALS_AND_RISK = '1',
  INVESTMENT_METHOD = '2',
  TRADING_RULES = '3',
  RISK_MANAGEMENT = '4',
  INFO_VALIDATION = '5',
  COGNITIVE_BIAS = '6',
  DOCUMENTATION = '7'
}
