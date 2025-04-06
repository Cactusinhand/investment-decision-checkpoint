// src/components/investment-evaluation/utils/apiUtils.ts
import { DeepSeekAnalysisResult } from '../../../types';

/**
 * @fileoverview Fallback utility functions for API analysis.
 * These functions provide basic, rule-based analysis when the DeepSeek API calls fail
 * or are not available. They ensure that the application can still provide some level
 * of analysis result, maintaining a consistent return type.
 */

/**
 * Fallback function for logic consistency analysis when the API call fails.
 * Provides a basic, rule-based assessment.
 * @param buyRules - User's buy rules.
 * @param sellProfitRules - User's profit-taking rules.
 * @param sellLossRules - User's stop-loss rules.
 * @param riskMgmtSummary - User's risk management summary.
 * @param language - Current language setting.
 * @returns A fallback DeepSeekAnalysisResult object.
 */
export const fallbackLogicAnalysis = (
  buyRules: string,
  sellProfitRules: string,
  sellLossRules: string,
  riskMgmtSummary: string,
  language: 'en' | 'zh' // Explicitly type the language parameter
): DeepSeekAnalysisResult => {
  const result: DeepSeekAnalysisResult = {
    consistencyScore: 5, // Neutral score
    conflictPoints: [],
    suggestions: [],
    reasoningPath: 'Fallback: Basic rule-based analysis applied due to API failure.'
  };

  // Basic Checks (Example)
  if (!sellLossRules && riskMgmtSummary.toLowerCase().includes('risk averse')) {
    result.consistencyScore = 3;
    result.conflictPoints.push(language === 'zh' ? '风险厌恶但缺乏明确止损规则可能不一致。' : 'Risk aversion without clear stop-loss rules might be inconsistent.');
    result.suggestions.push(language === 'zh' ? '考虑添加明确的止损规则来管理下行风险。' : 'Consider adding explicit stop-loss rules to manage downside risk.');
  }
  if (buyRules.includes('high growth') && sellProfitRules.includes('small target')) {
    result.consistencyScore = 4;
    result.conflictPoints.push(language === 'zh' ? '买入高增长目标，但止盈目标过低，可能提前退出。' : 'Buying for high growth but setting low profit targets might lead to premature exits.');
  }

  return result;
};

/**
 * Fallback function for risk consistency analysis when the API call fails.
 * Provides a basic, rule-based assessment.
 * @param riskTolerance - User's stated risk tolerance.
 * @param riskIdentification - Risks identified by the user.
 * @param maxLoss - User's maximum acceptable loss.
 * @param language - Current language setting.
 * @returns A fallback DeepSeekAnalysisResult object.
 */
export const fallbackRiskAnalysis = (
  riskTolerance: string,
  riskIdentification: string,
  maxLoss: string,
  language: 'en' | 'zh' // Explicitly type the language parameter
): DeepSeekAnalysisResult => {
  const result: DeepSeekAnalysisResult = {
    consistencyScore: 6, // Slightly above neutral
    conflictPoints: [],
    suggestions: [],
    reasoningPath: 'Fallback: Basic risk consistency check applied due to API failure.'
  };

  // Basic Checks (Example)
  const maxLossPercentMatch = maxLoss.match(/(\d+)%/);
  const maxLossPercent = maxLossPercentMatch ? parseInt(maxLossPercentMatch[1], 10) : null;

  if (riskTolerance.includes('Conservative') || riskTolerance.includes('保守')) {
    if (!maxLoss || (maxLossPercent && maxLossPercent > 15)) { // Example threshold: 15%
      result.consistencyScore = 3;
      result.conflictPoints.push(language === 'zh' ? '保守型投资者但可接受损失较大或未明确，存在不一致。' : 'Conservative investor profile with high or unspecified max loss tolerance seems inconsistent.');
      result.suggestions.push(language === 'zh' ? '请明确一个与保守型风险偏好匹配的较低的最大可接受损失百分比。' : 'Specify a lower maximum acceptable loss percentage consistent with a conservative risk profile.');
    }
  }

  if (riskTolerance.includes('Aggressive') || riskTolerance.includes('激进')) {
     if (maxLossPercent && maxLossPercent < 10) { // Example threshold: 10%
      result.consistencyScore = 4;
      result.conflictPoints.push(language === 'zh' ? '激进型投资者但最大可接受损失过低，可能限制策略执行。' : 'Aggressive investor profile with very low max loss tolerance might hinder strategy execution.');
    }
    if (!riskIdentification || riskIdentification.split(',').length < 2) {
        result.suggestions.push(language === 'zh' ? '激进策略通常伴随更多风险，建议更全面地识别潜在风险点。' : 'Aggressive strategies often entail more risks; consider a more comprehensive identification of potential risks.')
    }
  }

  return result;
};

/**
 * Fallback function for cognitive bias analysis when the API call fails.
 * Provides a basic assessment based on self-reported checks.
 * @param biasAwarenessSummary - String summary of user's bias self-checks.
 * @param mitigationPlan - User's plan to mitigate biases.
 * @param language - Current language setting.
 * @returns A fallback DeepSeekAnalysisResult object.
 */
export const fallbackBiasAnalysis = (
  biasAwarenessSummary: string,
  mitigationPlan: string,
  language: 'en' | 'zh' // Explicitly type the language parameter
): DeepSeekAnalysisResult => {
  const result: DeepSeekAnalysisResult = {
    // Score represents effectiveness (higher is better)
    consistencyScore: 4, // Lower base score for fallback
    conflictPoints: [],
    suggestions: [],
    reasoningPath: 'Fallback: Basic bias check applied due to API failure.'
  };

  const acknowledgedBiases = (biasAwarenessSummary.match(/Yes|是/g) || []).length;

  if (acknowledgedBiases > 0) {
    result.consistencyScore += 1;
    result.conflictPoints.push(language === 'zh' ? `识别到 ${acknowledgedBiases} 项潜在偏差。` : `Acknowledged ${acknowledgedBiases} potential bias(es).`);
  }

  if (mitigationPlan && mitigationPlan.length > 10) {
    result.consistencyScore += 2;
    result.suggestions.push(language === 'zh' ? '已制定应对偏差的措施，请确保其可执行性。' : 'Mitigation plan defined, ensure it is actionable.');
    if(acknowledgedBiases > 0 && (mitigationPlan.includes('rule') || mitigationPlan.includes('规则'))) {
        result.consistencyScore +=1; // Bonus for rule-based mitigation
    }
  } else {
    result.consistencyScore -= 1;
    result.conflictPoints.push(language === 'zh' ? '缺乏应对认知偏差的具体措施。' : 'Lack of specific measures to address cognitive biases.');
     if(acknowledgedBiases > 0) {
       result.consistencyScore -= 1; // Penalty if biases acknowledged but no plan
        result.conflictPoints.push(language === 'zh' ? '已识别潜在偏差，但未制定应对计划。' : 'Acknowledged potential biases but no mitigation plan defined.');
    }
  }
  
  // Clamp score
  result.consistencyScore = Math.max(0, Math.min(10, result.consistencyScore));

  return result;
};