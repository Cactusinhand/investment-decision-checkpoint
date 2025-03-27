// src/components/investment-evaluation/utils/scoringUtils.ts

/**
 * 计算流动性评分
 * 根据用户的流动性需求回答计算流动性评分
 * @param liquidityNeeds 用户的流动性需求回答
 * @returns 流动性评分（0-100）
 */
export const calculateLiquidityScore = (liquidityNeeds: string): number => {
  // 默认中等流动性评分
  let score = 50;
  
  // 根据用户回答调整评分
  if (liquidityNeeds.includes('High') || liquidityNeeds.includes('高')) {
    // 用户需要高流动性
    score = 30;
  } else if (liquidityNeeds.includes('Low') || liquidityNeeds.includes('低')) {
    // 用户需要低流动性
    score = 90;
  } else if (liquidityNeeds.includes('Medium') || liquidityNeeds.includes('中')) {
    // 用户需要中等流动性
    score = 70;
  }
  
  // 如果提到紧急需求或应急资金，降低评分
  if (liquidityNeeds.includes('Emergency') || liquidityNeeds.includes('紧急') || 
      liquidityNeeds.includes('Urgent') || liquidityNeeds.includes('应急')) {
    score -= 20;
  }
  
  // 确保评分在0-100范围内
  return Math.max(0, Math.min(100, score));
};