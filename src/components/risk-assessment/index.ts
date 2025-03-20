import RiskAssessment from './RiskAssessment';
import { RiskAssessmentProvider, useRiskAssessment } from './RiskAssessmentContext';
import { riskAssessmentQuestions, riskAssessmentWeights } from './RiskAssessmentQuestions';
import { riskProfiles } from './RiskProfiles';
import { calculateRiskScore, checkRequiredAnswers } from './utils';

export {
  RiskAssessment,
  RiskAssessmentProvider,
  useRiskAssessment,
  riskAssessmentQuestions,
  riskAssessmentWeights,
  riskProfiles,
  calculateRiskScore,
  checkRequiredAnswers
};

export * from './types'; 