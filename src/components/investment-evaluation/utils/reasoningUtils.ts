// src/components/investment-evaluation/utils/reasoningUtils.ts
import { InvestmentDecision } from '../types';
// import { InvestmentDecision } from '../../investment-checkpoint/types';

/**
 * 分析投资一致性得分
 * 检查投资决策内部各部分是否逻辑自洽
 */
export const analyzeDecisionConsistency = (decision: InvestmentDecision): number => {
  const { answers } = decision;
  let consistencyScore = 7; // 基础分7分(满分10分)
  
  // 分析风险容忍度与投资组合是否匹配
  const riskTolerance = answers['1-3'] || '';
  const buyRules = answers['3-1'] || '';
  const sellRules = answers['3-2'] || '';
  const stopLossRules = answers['3-3'] || '';
  
  // 1. 保守型风险偏好但激进买入策略
  const isConservative = riskTolerance.includes('Conservative') || riskTolerance.includes('<10%');
  const hasAggressiveBuyStrategy = buyRules.toLowerCase().includes('leverage') || 
    buyRules.toLowerCase().includes('margin') ||
    buyRules.includes('杠杆') ||
    buyRules.includes('保证金');
  
  if (isConservative && hasAggressiveBuyStrategy) {
    consistencyScore -= 2;
  }
  
  // 2. 分析止损规则是否匹配风险承受能力
  const hasStopLoss = stopLossRules.length > 10 && /\d+%/.test(stopLossRules);
  if (!hasStopLoss && !isConservative) {
    consistencyScore -= 1.5;
  }
  
  // 3. 检查买入和卖出规则的对称性
  const buyHasValuation = /PE|PB|估值|valuation/i.test(buyRules);
  const sellHasValuation = /PE|PB|估值|valuation/i.test(sellRules);
  
  if (buyHasValuation && !sellHasValuation) {
    consistencyScore -= 1;
  }
  
  // 4. 检查是否有完整的买-卖-止损链条
  if (buyRules.length > 10 && sellRules.length > 10 && stopLossRules.length > 10) {
    consistencyScore += 1;
  }
  
  // 5. 检查时间范围与复查频率是否匹配
  const timeHorizon = answers['1-2'] || '';
  const reviewFrequency = answers['7-3'] || '';
  
  const isLongTerm = timeHorizon.includes('Long-term') || timeHorizon.includes('>5');
  const isFrequentReview = reviewFrequency.includes('Monthly');
  
  if (isLongTerm && isFrequentReview) {
    consistencyScore += 0.5; // 长期投资有较高审查频率是好事
  }
  
  // 确保分数在0-10范围内
  return Math.max(0, Math.min(10, consistencyScore));
};

/**
 * 分析认知偏差可能的影响
 * 根据用户回答识别可能存在的认知偏差
 */
export const analyzeCognitiveBiasesImpact = (decision: InvestmentDecision): string[] => {
  const { answers } = decision;
  const potentialBiases: string[] = [];
  
  // 确认偏差：倾向于寻找能证实当前信念的信息
  const verification = answers['5-2'] || '';
  if (!verification.toLowerCase().includes('反向') && 
      !verification.toLowerCase().includes('反对') && 
      !verification.toLowerCase().includes('counter') && 
      !verification.toLowerCase().includes('opposite')) {
    potentialBiases.push('确认偏差：考虑寻找反面证据检验投资假设');
  }
  
  // 损失厌恶：卖出规则严格程度不够
  const sellRules = answers['3-2'] || '';
  const stopLossRules = answers['3-3'] || '';
  
  if ((sellRules.length < 20 || !(/\d+%/.test(sellRules))) &&
      (stopLossRules.length < 20 || !(/\d+%/.test(stopLossRules)))) {
    potentialBiases.push('损失厌恶：卖出标准不够明确，可能导致持有亏损资产过久');
  }
  
  // 过度自信：最大损失容忍度过高
  const maxLoss = answers['4-4'] || '';
  if (/[3-9][0-9]%|100%/.test(maxLoss)) {
    potentialBiases.push('过度自信：设定的最大损失容忍度过高');
  }
  
  // 锚定效应：买卖规则过于依赖特定参考点
  const buyRules = answers['3-1'] || '';
  if (buyRules.includes('历史') || buyRules.includes('以前') || 
      buyRules.includes('historical') || buyRules.includes('previous')) {
    potentialBiases.push('锚定效应：避免过度依赖历史价格作为唯一参考点');
  }
  
  // 从众心理：过度依赖外部观点
  const infoSources = answers['5-1'] || '';
  if (infoSources.toLowerCase().includes('社交媒体') || 
      infoSources.toLowerCase().includes('论坛') || 
      infoSources.toLowerCase().includes('social media') || 
      infoSources.toLowerCase().includes('forum')) {
    potentialBiases.push('从众心理：谨慎使用社交媒体/论坛作为信息来源，易受情绪影响');
  }
  
  return potentialBiases;
};

/**
 * 生成改进建议的高级推理
 */
export const generateAdvancedRecommendations = (
  decision: InvestmentDecision,
  consistencyScore: number,
  biases: string[]
): string[] => {
  const recommendations: string[] = [];
  const { answers } = decision;
  
  // 1. 分析买卖规则的具体改进点
  const buyRules = answers['3-1'] || '';
  const sellRules = answers['3-2'] || '';
  
  if (buyRules.length > 0 && !(/\d+%|\d+\.\d+/).test(buyRules)) {
    recommendations.push('将买入规则定量化，例如"PE<20"或"低于52周均价15%"等数值标准');
  }
  
  if (sellRules.length > 0 && !(/\d+%|\d+\.\d+/).test(sellRules)) {
    recommendations.push('制定明确的卖出阈值，如"获利20%"或"PE>30"等具体标准');
  }
  
  // 2. 基于投资方法给出建议
  const methods = Array.isArray(answers['2-1']) ? answers['2-1'] : [];
  const methodJustification = answers['2-2'] || '';
  
  if (methods.includes('Fundamental Analysis') && methodJustification.length < 50) {
    recommendations.push('完善基本面分析方法论，明确关注的财务指标及其目标区间');
  }
  
  if (methods.includes('Technical Analysis') && (!buyRules.includes('均线') && !buyRules.includes('moving average'))) {
    recommendations.push('技术分析策略应包含明确的技术指标触发条件');
  }
  
  // 3. 针对风险管理提出建议
  const riskMitigation = Array.isArray(answers['4-3']) ? answers['4-3'] : [];
  if (riskMitigation.length <= 1) {
    recommendations.push('采用多层次风险管理策略，结合止损单、分散投资和适当对冲');
  }
  
  // 4. 时间范围与投资标的匹配建议
  const timeHorizon = answers['1-2'] || '';
  const isLongTerm = timeHorizon.includes('Long-term') || timeHorizon.includes('>5');
  
  if (isLongTerm && consistencyScore < 6) {
    recommendations.push('长期投资更需要完整的买卖规则体系和定期审查机制');
  }
  
  // 5. 结合认知偏差的建议
  if (biases.length > 0) {
    const biasRecommendation = biases.length > 2 
      ? '建立决策前检查清单，系统性防范认知偏差' 
      : `考虑针对${biases[0].split('：')[0]}的对策`;
    recommendations.push(biasRecommendation);
  }
  
  return recommendations.slice(0, 3); // 最多返回3条深度建议
};

/**
 * 分析潜在矛盾点
 */
export const analyzeConflictPoints = (decision: InvestmentDecision): string[] => {
  const { answers } = decision;
  const conflicts: string[] = [];
  
  // 1. 风险承受能力与最大损失矛盾
  const riskTolerance = answers['1-3'] || '';
  const maxLoss = answers['4-4'] || '';
  
  const isConservative = riskTolerance.includes('Conservative') || riskTolerance.includes('<10%');
  const hasHighLossTolerance = /[2-9][0-9]%|100%/.test(maxLoss);
  
  if (isConservative && hasHighLossTolerance) {
    conflicts.push('风险承受能力与最大损失容忍度不匹配');
  }
  
  // 2. 投资期限与流动性需求矛盾
  const timeHorizon = answers['1-2'] || '';
  const liquidityNeeds = answers['1-4'] || '';
  
  const isLongTerm = timeHorizon.includes('Long-term') || timeHorizon.includes('>5');
  const needsHighLiquidity = liquidityNeeds.toLowerCase().includes('high') || 
    liquidityNeeds.toLowerCase().includes('immediate') ||
    liquidityNeeds.includes('高流动性') ||
    liquidityNeeds.includes('随时');
  
  if (isLongTerm && needsHighLiquidity) {
    conflicts.push('长期投资目标与高流动性需求存在冲突');
  }
  
  // 3. 买入与卖出规则矛盾
  const buyRules = answers['3-1'] || '';
  const sellRules = answers['3-2'] || '';
  
  const buyOnValuation = buyRules.toLowerCase().includes('低估值') || 
    buyRules.toLowerCase().includes('undervalued');
  const sellNotOnValuation = sellRules.length > 0 && 
    !sellRules.toLowerCase().includes('高估值') && 
    !sellRules.toLowerCase().includes('overvalued');
  
  if (buyOnValuation && sellNotOnValuation) {
    conflicts.push('买入基于估值但卖出未考虑估值回归');
  }
  
  // 4. 方法选择与指标冲突
  const methods = Array.isArray(answers['2-1']) ? answers['2-1'] : [];
  const metrics = answers['2-3'] || '';
  
  const usesTechnical = methods.includes('Technical Analysis');
  const noTechIndicators = !(/MACD|RSI|KDJ|均线|支撑|阻力|moving average|support|resistance/i.test(metrics));
  
  if (usesTechnical && noTechIndicators) {
    conflicts.push('选择了技术分析但未指定相关技术指标');
  }
  
  return conflicts;
};