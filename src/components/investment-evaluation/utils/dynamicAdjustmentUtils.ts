// src/components/investment-evaluation/utils/dynamicAdjustmentUtils.ts
import { InvestmentDecision, EvaluationResult, EvaluationRating, StageScore } from '../../../types';
import { calculateLiquidityScore } from './scoringUtils';

/**
 * @fileoverview Dynamic adjustment utilities for investment evaluation results.
 * These functions modify the base evaluation result based on specific user characteristics
 * like time horizon, risk preference, or investment context (e.g., industry).
 */

/**
 * Defines adjustment parameters based on the investment time horizon.
 */
interface TimeRangeAdjustment {
  longTerm: {
    /** Indicates if a higher tolerance for market volatility is acceptable. */
    allowHigherVolatility: boolean;
    /** Indicates if the overall rating can potentially be upgraded by one level. */
    ratingUpgrade: boolean;
  };
  shortTerm: {
    /** Indicates if a high level of liquidity is mandatory. */
    requireHighLiquidity: boolean;
    /** The minimum acceptable score for liquidity assessment (e.g., 80/100). */
    liquidityScoreThreshold: number;
  };
}

/**
 * Defines adjustment parameters based on the user's risk preference.
 */
interface RiskPreferenceAdjustment {
  aggressive: {
    /** The minimum required score for the risk management stage (e.g., 72/100 or 18/25 if weighted). */
    riskManagementThreshold: number;
    /** Indicates if the rating should be forced to 'high-risk' if the threshold isn't met. */
    forceHighRiskRating: boolean;
  };
  conservative: {
    /** The maximum acceptable target yield before triggering additional scrutiny (e.g., 5%). */
    yieldThreshold: number;
    /** Indicates if an additional stress test recommendation is required if the yield threshold is exceeded. */
    requireStressTest: boolean;
  };
}

/**
 * Defines adjustment parameters based on the specific industry or asset class.
 */
interface IndustryAdjustment {
  tech: {
    /** The minimum required score for the information validation stage for tech investments. */
    infoValidationThreshold: number;
  };
  bonds: {
    /** The factor by which the weight of the trading rules stage should be reduced. */
    tradingRulesWeightReduction: number;
    /** The factor by which the weight or importance of liquidity should be increased. */
    liquidityWeightIncrease: number;
  };
}

// Constants for thresholds (example values, adjust as needed)
const TIME_RANGE_ADJUSTMENT: TimeRangeAdjustment = {
  longTerm: { allowHigherVolatility: true, ratingUpgrade: true },
  shortTerm: { requireHighLiquidity: true, liquidityScoreThreshold: 80 }, // 80/100 score
};

const RISK_PREFERENCE_ADJUSTMENT: RiskPreferenceAdjustment = {
  aggressive: { riskManagementThreshold: 72, forceHighRiskRating: true }, // 72/100 score (approx 18/25)
  conservative: { yieldThreshold: 5, requireStressTest: true }, // 5% target yield
};

// Industry adjustment constants might be more complex, depending on how industry is determined
// const INDUSTRY_ADJUSTMENT: IndustryAdjustment = { ... };

/**
 * Applies dynamic adjustments based on the investment time horizon.
 * Long-term horizons might allow for a rating upgrade due to higher volatility tolerance.
 * Short-term horizons require a high liquidity score, potentially leading to a downgrade.
 * @param decision - The user's investment decision containing answers.
 * @param result - The initial evaluation result.
 * @returns An adjusted EvaluationResult.
 */
export const applyTimeRangeAdjustment = (
  decision: InvestmentDecision,
  result: EvaluationResult
): EvaluationResult => {
  const { answers } = decision;
  const timeHorizon = answers['1-2'] || '';
  const liquidityNeeds = answers['1-4'] || ''; // Used for liquidity score

  // Deep copy the result to avoid modifying the original object
  const adjustedResult: EvaluationResult = JSON.parse(JSON.stringify(result)); // Simple deep copy

  // Long-term investor (>5 years): Potential rating upgrade
  if (timeHorizon.includes('Long-term') || timeHorizon.includes('>5')) {
    if (TIME_RANGE_ADJUSTMENT.longTerm.ratingUpgrade) {
      if (result.rating === 'cautious') {
        adjustedResult.rating = 'stable';
        adjustedResult.recommendations.push('Adjustment: As a long-term investor, you might tolerate higher short-term volatility.');
      } else if (result.rating === 'stable') {
        adjustedResult.rating = 'system';
        adjustedResult.recommendations.push('Adjustment: Long-term strategy appears robust for market fluctuations.');
      }
    }
  }

  // Short-term investor (<1 year): Requires high liquidity score
  if (timeHorizon.includes('Short-term') || timeHorizon.includes('<1')) {
    if (TIME_RANGE_ADJUSTMENT.shortTerm.requireHighLiquidity) {
      // Calculate liquidity score (assuming a function exists that returns 0-100)
      const liquidityScore = calculateLiquidityScore(liquidityNeeds);

      if (liquidityScore < TIME_RANGE_ADJUSTMENT.shortTerm.liquidityScoreThreshold) {
        // Downgrade rating (unless already at lowest)
        if (result.rating === 'system') {
          adjustedResult.rating = 'stable';
        } else if (result.rating === 'stable') {
          adjustedResult.rating = 'cautious';
        } else if (result.rating === 'cautious') {
          adjustedResult.rating = 'high-risk';
        }

        adjustedResult.recommendations.push(`Adjustment: Short-term focus requires stronger liquidity (${liquidityScore}/${TIME_RANGE_ADJUSTMENT.shortTerm.liquidityScoreThreshold} score). Consider increasing cash reserves.`);
      }
    }
  }

  // Ensure recommendations are unique
  adjustedResult.recommendations = Array.from(new Set(adjustedResult.recommendations));

  return adjustedResult;
};

/**
 * Applies dynamic adjustments based on the user's risk preference.
 * Aggressive investors face a stricter check on risk management effectiveness.
 * Conservative investors targeting high yields might trigger warnings or downgrades.
 * @param decision - The user's investment decision containing answers.
 * @param result - The initial evaluation result.
 * @returns An adjusted EvaluationResult.
 */
export const applyRiskPreferenceAdjustment = (
  decision: InvestmentDecision,
  result: EvaluationResult
): EvaluationResult => {
  const { answers } = decision;
  const riskTolerance = answers['1-3'] || '';
  const investmentGoals = answers['1-1'] || '';

  // Deep copy the result
  const adjustedResult: EvaluationResult = JSON.parse(JSON.stringify(result));

  // Aggressive investor: Check risk management score
  if (riskTolerance.includes('Aggressive') || riskTolerance.includes('激进')) {
    const riskManagementScore = result.stageScores['4']?.score || 0; // Stage 4 score (0-100)

    if (riskManagementScore < RISK_PREFERENCE_ADJUSTMENT.aggressive.riskManagementThreshold) {
      if (RISK_PREFERENCE_ADJUSTMENT.aggressive.forceHighRiskRating) {
        adjustedResult.rating = 'high-risk';
      }
      adjustedResult.recommendations.push(`Adjustment: Aggressive stance requires stronger risk controls (Score: ${riskManagementScore}/${RISK_PREFERENCE_ADJUSTMENT.aggressive.riskManagementThreshold}). Enhance mitigation measures.`);
    }
  }

  // Conservative investor: Check yield target
  if (riskTolerance.includes('Conservative') || riskTolerance.includes('保守')) {
    // Extract target yield percentage from goals
    const yieldMatch = investmentGoals.match(/(\d+)%/);
    const targetYield = yieldMatch ? parseInt(yieldMatch[1], 10) : 0;

    if (targetYield > RISK_PREFERENCE_ADJUSTMENT.conservative.yieldThreshold) {
      if (RISK_PREFERENCE_ADJUSTMENT.conservative.requireStressTest) {
        adjustedResult.recommendations.push(`Adjustment: Target yield (${targetYield}%) is high for a conservative profile. Recommend stress testing the investment.`);
      }
      // Optional: Downgrade rating if high yield conflicts with conservative rating
      if (result.rating === 'system' || result.rating === 'stable') {
         // adjustedResult.rating = result.rating === 'system' ? 'stable' : 'cautious'; // Example downgrade logic
         console.warn("High yield target for conservative investor might warrant rating review.");
      }
    }
  }

  // Ensure recommendations are unique
  adjustedResult.recommendations = Array.from(new Set(adjustedResult.recommendations));

  return adjustedResult;
};

// Placeholder for applying industry-specific adjustments if needed
/*
export const applyIndustryAdjustment = (
  decision: InvestmentDecision,
  result: EvaluationResult
): EvaluationResult => {
  // Determine industry from decision data (e.g., decision.industry field or from answers)
  // Apply adjustments based on INDUSTRY_ADJUSTMENT constants
  return result;
};
*/