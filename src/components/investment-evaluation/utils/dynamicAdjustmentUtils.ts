// src/components/investment-evaluation/utils/dynamicAdjustmentUtils.ts
import { InvestmentDecision, EvaluationResult, EvaluationRating, StageScore } from '../../../types';
import { calculateLiquidityScore } from './scoringUtils';

/**
 * 动态调整因子工具
 * 根据用户具体参数动态修正评估结果和建议
 */

// 时间范围调整
interface TimeRangeAdjustment {
  longTerm: {
    allowHigherVolatility: boolean; // 允许更高波动容忍度
    ratingUpgrade: boolean; // 评级可上调一档
  };
  shortTerm: {
    requireHighLiquidity: boolean; // 强制要求高流动性
    liquidityScoreThreshold: number; // 流动性评分阈值
  };
}

// 风险偏好调整
interface RiskPreferenceAdjustment {
  aggressive: {
    riskManagementThreshold: number; // 风险管理评分阈值
    forceHighRiskRating: boolean; // 强制归类为高风险
  };
  conservative: {
    yieldThreshold: number; // 收益目标阈值
    requireStressTest: boolean; // 需要额外压力测试
  };
}

// 行业特性调整
interface IndustryAdjustment {
  tech: {
    infoValidationThreshold: number; // 信息验证评分阈值
  };
  bonds: {
    tradingRulesWeightReduction: number; // 买卖规则权重降低
    liquidityWeightIncrease: number; // 流动性评分权重提高
  };
}

/**
 * 应用时间范围动态调整
 * @param decision 投资决策
 * @param result 评估结果
 * @returns 调整后的评估结果
 */
export const applyTimeRangeAdjustment = (
  decision: InvestmentDecision,
  result: EvaluationResult
): EvaluationResult => {
  const { answers } = decision;
  const timeHorizon = answers['1-2'] || '';
  const liquidityNeeds = answers['1-4'] || '';
  
  // 深拷贝结果以避免修改原对象
  const adjustedResult = { ...result };
  
  // 长期投资者（>5年）：允许更高波动容忍度（评级可上调一档）
  if (timeHorizon.includes('Long-term') || timeHorizon.includes('>5')) {
    // 评级上调一档（除非已经是最高评级）
    if (result.rating === 'cautious') {
      adjustedResult.rating = 'stable';
      adjustedResult.recommendations.push('作为长期投资者，您可以承受更高的短期波动');
    } else if (result.rating === 'stable') {
      adjustedResult.rating = 'system';
      adjustedResult.recommendations.push('长期投资策略完善，可以承受市场波动');
    }
  }
  
  // 短期投资者（<1年）：强制要求流动性评分≥8分（否则降级）
  if (timeHorizon.includes('Short-term') || timeHorizon.includes('<1')) {
    // 检查流动性评分（假设在第一阶段的评分中有相关指标）
    const liquidityScore = calculateLiquidityScore(liquidityNeeds);
    
    if (liquidityScore < 80) { // 8分（满分10分）转换为百分制
      // 评级降低一档（除非已经是最低评级）
      if (result.rating === 'system') {
        adjustedResult.rating = 'stable';
      } else if (result.rating === 'stable') {
        adjustedResult.rating = 'cautious';
      } else if (result.rating === 'cautious') {
        adjustedResult.rating = 'high-risk';
      }
      
      adjustedResult.recommendations.push('短期投资需要更高的流动性准备，建议增加现金储备');
    }
  }
  
  return adjustedResult;
};

/**
 * 应用风险偏好动态调整
 * @param decision 投资决策
 * @param result 评估结果
 * @returns 调整后的评估结果
 */
export const applyRiskPreferenceAdjustment = (
  decision: InvestmentDecision,
  result: EvaluationResult
): EvaluationResult => {
  const { answers } = decision;
  const riskTolerance = answers['1-3'] || '';
  const investmentGoals = answers['1-1'] || '';
  
  // 深拷贝结果以避免修改原对象
  const adjustedResult = { ...result };
  
  // 激进型投资者：若风险管理评分<18/25，直接归类为"高风险"
  if (riskTolerance.includes('Aggressive') || riskTolerance.includes('激进')) {
    // 获取风险管理评分（假设在第四阶段的评分中）
    const riskManagementScore = result.stageScores['4']?.score || 0;
    const riskManagementMaxScore = 25; // 风险管理满分为25分
    
    if (riskManagementScore < 18) {
      adjustedResult.rating = 'high-risk';
      adjustedResult.recommendations.push('您的风险管理策略需要加强，建议完善风险控制措施');
    }
  }
  
  // 保守型投资者：若收益目标>5%年化，需额外压力测试
  if (riskTolerance.includes('Conservative') || riskTolerance.includes('保守')) {
    // 从投资目标中提取收益率信息
    const yieldMatch = investmentGoals.match(/(\d+)%/);
    const yieldPercentage = yieldMatch ? parseInt(yieldMatch[1], 10) : 0;
    
    if (yieldPercentage > 5) {
      adjustedResult.recommendations.push('您的收益目标相对于保守型风险偏好较高，建议进行额外的投资压力测试');
      
      // 如果评级为system或stable，可能需要降级
      if (result.rating === 'system') {
        adjustedResult.rating = 'stable';
      } else if (result.rating === 'stable') {
        adjustedResult.rating = 'cautious';
      }
    }
  }
  
  return adjustedResult;
};