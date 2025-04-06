import { 
  StageScore, 
  EvaluationRating, 
  EvaluationResult, 
  InvestmentDecision,
  DeepSeekAnalysisResult
} from '../../../types';
import { 
  MIN_VALID_ANSWER_LENGTH, 
  RATING_RANGES, 
  STAGE_WEIGHTS 
} from '../../../constants';

// 导入真实的API函数
import {
  analyzeLogicConsistency,
  analyzeRiskConsistency,
  analyzeCognitiveBiases
} from '../api/deepseekAPI';

/**
 * Evaluates Stage 1: Goals and Risk Definition.
 * Assesses clarity of goals, time horizon appropriateness, and consistency between risk tolerance and liquidity needs.
 * @param answers - The user's answers for the decision.
 * @returns The calculated score, strengths, and weaknesses for Stage 1.
 */
const evaluateStage1 = (answers: Record<string, any>): StageScore => {
  let score = 60; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Goal Clarity
  const goals = answers['1-1'] || '';
  if (goals.length > MIN_VALID_ANSWER_LENGTH) {
    score += 10;
    strengths.push('Investment goals are clearly defined.');
  } else {
    score -= 15;
    weaknesses.push('Investment goals are unclear.');
  }
  
  // Time Horizon Assessment
  const timeHorizon = answers['1-2'] || '';
  if (timeHorizon) {
    if (timeHorizon.includes('Long-term')) {
      score += 10;
      strengths.push('Has a long-term investment perspective.');
    } else if (timeHorizon.includes('Medium-term')) {
      score += 5;
    } else { // Short-term
      if (goals.includes('growth') || goals.includes('高收益')) { // Check for mismatch with high growth goals
        score -= 10;
        weaknesses.push('Short-term horizon may conflict with high-growth expectations.');
      }
    }
  } else {
    score -= 10;
    weaknesses.push('Investment time horizon is not specified.');
  }
  
  // Risk Tolerance & Time Horizon Consistency
  const riskTolerance = answers['1-3'] || '';
  if (riskTolerance) {
    if ((timeHorizon.includes('Short-term') && riskTolerance.includes('Aggressive')) ||
        (timeHorizon.includes('Long-term') && riskTolerance.includes('Conservative'))) {
      score -= 10;
      weaknesses.push('Mismatch between risk tolerance and investment time horizon.');
    } else if ((timeHorizon.includes('Long-term') && riskTolerance.includes('Moderate')) ||
               (timeHorizon.includes('Medium-term') && riskTolerance.includes('Moderate'))) {
      score += 10;
      strengths.push('Risk tolerance is well-aligned with the investment time horizon.');
    }
  } else {
    score -= 10;
    weaknesses.push('Risk tolerance is not specified.');
  }
  
  // Liquidity Needs Assessment
  const liquidityNeeds = answers['1-4'] || '';
  if (liquidityNeeds.length > MIN_VALID_ANSWER_LENGTH) {
    score += 5;
    // Simple check for keywords indicating planning
    if (liquidityNeeds.includes('%') || liquidityNeeds.includes('need access') || liquidityNeeds.includes('保留') || liquidityNeeds.includes('liquid')) {
      strengths.push('Liquidity needs are considered.');
    }
  } else {
    weaknesses.push('Liquidity needs are not specified.');
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

/**
 * Evaluates Stage 2: Investment Method Selection.
 * Assesses the diversity, suitability, and rationale of chosen investment methods and key metrics.
 * @param answers - The user's answers for the decision.
 * @returns The calculated score, strengths, and weaknesses for Stage 2.
 */
const evaluateStage2 = (answers: Record<string, any>): StageScore => {
  let score = 60; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Investment Method Selection
  const methods = Array.isArray(answers['2-1']) ? answers['2-1'] : [];
  if (methods.length > 0) {
    if (methods.length >= 2) {
      score += 10;
      strengths.push('Utilizes multiple investment methods.');
    } else {
      score += 5;
    }
    const hasFundamental = methods.some(m => m.includes('Fundamental'));
    const hasTechnical = methods.some(m => m.includes('Technical'));
    const hasQuantitative = methods.some(m => m.includes('Quantitative'));
    if (hasFundamental && (hasTechnical || hasQuantitative)) {
      score += 5;
      strengths.push('Combines qualitative and quantitative analysis approaches.');
    }
  } else {
    score -= 20;
    weaknesses.push('No investment method selected.');
  }
  
  // Rationale for Method Suitability
  const methodRationale = answers['2-2'] || '';
  if (methodRationale.length > MIN_VALID_ANSWER_LENGTH) {
    // Check if rationale links method to goals
    if (methodRationale.toLowerCase().includes('goal') || methodRationale.includes('目标') ||
        methodRationale.toLowerCase().includes('match') || methodRationale.includes('匹配')) {
      score += 10;
      strengths.push('Method selection is justified and linked to investment goals.');
    } else {
      score += 5; // Basic rationale provided
    }
  } else {
    score -= 10;
    weaknesses.push('Rationale for method selection is not provided or insufficient.');
  }
  
  // Key Metrics Selection
  const metrics = answers['2-3'] || '';
  if (metrics.length > MIN_VALID_ANSWER_LENGTH) {
    const usesFundamentalMetrics = metrics.includes('PE') || metrics.includes('PB') || metrics.includes('ROE') || metrics.includes('市盈率') || metrics.includes('市净率');
    const usesTechnicalMetrics = metrics.includes('MACD') || metrics.includes('RSI') || metrics.includes('moving average') || metrics.includes('均线');
    if (usesFundamentalMetrics && usesTechnicalMetrics) {
      score += 10;
      strengths.push('Utilizes metrics from multiple analysis dimensions (e.g., fundamental, technical).');
    } else if (usesFundamentalMetrics || usesTechnicalMetrics) {
      score += 5;
      strengths.push('Specifies basic evaluation metrics.');
    }
  } else {
    score -= 10;
    weaknesses.push('Key evaluation metrics are not specified.');
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

/**
 * Evaluates Stage 3: Buy/Sell Rule Establishment.
 * Assesses the clarity, specificity, and quantifiability of buy, sell (profit), and sell (loss) rules, and position sizing strategy.
 * @param answers - The user's answers for the decision.
 * @returns The calculated score, strengths, and weaknesses for Stage 3.
 */
const evaluateStage3 = (answers: Record<string, any>): StageScore => {
  let score = 60; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Clarity of Buy Rules
  const buyRules = answers['3-1'] || '';
  if (buyRules.length > MIN_VALID_ANSWER_LENGTH) {
    // Check for common indicators or keywords suggesting specific rules
    if (/(RSI|MACD|PE|PB|below|above)/i.test(buyRules) || /[移动平均线|低于|高于|突破|市盈率|市净率]/.test(buyRules) || /\d+%?/.test(buyRules)) {
      score += 10;
      strengths.push('Buy rules appear specific and potentially quantitative.');
    } else {
      score += 5; // Basic rule provided
    }
  } else {
    score -= 15;
    weaknesses.push('Buy rules are unclear or not specified.');
  }
  
  // Clarity of Profit-Taking Sell Rules
  const sellProfitRules = answers['3-2'] || '';
  if (sellProfitRules.length > MIN_VALID_ANSWER_LENGTH) {
    // Check for percentages, target prices, or valuation keywords
    if (/(\d+%|target|目标价|above|超过|PE>|PB>)/i.test(sellProfitRules)) {
      score += 10;
      strengths.push('Clear criteria for profit-taking are defined.');
    } else {
      score += 5; // Basic rule provided
    }
  } else {
    score -= 10;
    weaknesses.push('Profit-taking sell rules are not specified.');
  }
  
  // Clarity of Stop-Loss Rules
  const sellLossRules = answers['3-3'] || '';
  if (sellLossRules.length > MIN_VALID_ANSWER_LENGTH) {
    // Check for percentages, specific loss terms, or support levels
    if (/(\d+%|stop|loss|止损|跌破|below)/i.test(sellLossRules)) {
      score += 15;
      strengths.push('Clear stop-loss strategy is defined.');
    } else {
      score += 5; // Basic rule provided
    }
  } else {
    score -= 15;
    weaknesses.push('Stop-loss rules are not specified.');
  }
  
  // Position Sizing Strategy
  const positionRules = answers['3-4'] || '';
  if (positionRules.length > MIN_VALID_ANSWER_LENGTH) {
    // Check for percentages or allocation keywords
    if (/%/.test(positionRules) && (/(position size|allocation|single|max)/i.test(positionRules) || /[单笔|单个|仓位]/.test(positionRules))) {
      score += 10;
      strengths.push('Specific position sizing strategy is outlined.');
    } else {
      score += 5; // Basic mention of position management
    }
  } else {
    score -= 10;
    weaknesses.push('Position sizing strategy is not specified.');
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

/**
 * Evaluates Stage 4: Risk Assessment & Management.
 * Assesses the completeness of risk identification, effectiveness of monitoring and mitigation methods, and clarity of maximum loss tolerance.
 * @param answers - The user's answers for the decision.
 * @returns The calculated score, strengths, and weaknesses for Stage 4.
 */
const evaluateRiskManagement = (answers: Record<string, any>): StageScore => {
  let score = 60; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Risk Identification
  const risks = answers['4-1'] || '';
  if (risks.length > MIN_VALID_ANSWER_LENGTH) {
    // Simple check for multiple distinct risks mentioned (using common separators)
    if (risks.split(/[,;/、，；]/).length >= 2) {
      score += 10;
      strengths.push('Identifies multiple potential risks.');
    } else {
      score += 5;
      strengths.push('Identifies at least one potential risk.');
    }
  } else {
    score -= 15;
    weaknesses.push('Major risks associated with the investment are not identified.');
  }
  
  // Risk Monitoring Methods
  const monitoring = answers['4-2'] || '';
  if (monitoring.length > MIN_VALID_ANSWER_LENGTH) {
    // Check for keywords indicating active monitoring
    if (/(review|track|monitor|alert|定期|跟踪|监控|预警)/i.test(monitoring)) {
      score += 10;
      strengths.push('Specifies methods for monitoring identified risks.');
    } else {
      score += 5;
    }
  } else {
    score -= 10;
    weaknesses.push('Risk monitoring methods are not specified.');
  }
  
  // Risk Mitigation Methods
  const mitigations = Array.isArray(answers['4-3']) ? answers['4-3'] : [];
  if (mitigations.length > 0) {
    score += 5; // Base points for having any mitigation
    if (mitigations.includes('Stop-loss Orders') || mitigations.some(m => m.includes('止损'))) {
      score += 10;
      strengths.push('Utilizes stop-loss orders for risk control.');
    }
    if (mitigations.includes('Diversification') || mitigations.some(m => m.includes('分散'))) {
      score += 10;
      strengths.push('Employs diversification to mitigate risk.');
    }
    if (mitigations.includes('Options Hedging') || mitigations.some(m => m.includes('期权'))) {
      score += 5;
      strengths.push('Considers hedging strategies (e.g., options).');
    }
  } else {
    score -= 15;
    weaknesses.push('No risk mitigation methods selected.');
  }
  
  // Maximum Acceptable Loss
  const maxLoss = answers['4-4'] || '';
  if (maxLoss.length > 0) {
    // Check if loss is quantified (e.g., contains %)
    if (/%/.test(maxLoss)) {
      score += 10;
      strengths.push('Maximum acceptable loss is clearly quantified.');
    } else {
      score += 5; // Mentioned, but not quantified
    }
  } else {
    score -= 10;
    weaknesses.push('Maximum acceptable loss is not specified.');
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

/**
 * Evaluates Stage 5: Information Validation.
 * Assesses the credibility of information sources, rigor of verification methods, and identification of key assumptions.
 * @param answers - The user's answers for the decision.
 * @returns The calculated score, strengths, and weaknesses for Stage 5.
 */
const evaluateStage5 = (answers: Record<string, any>): StageScore => {
  let score = 60; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Information Sources
  const sources = Array.isArray(answers['5-1']) ? answers['5-1'] : [];
  if (sources.length > 0) {
    score += 5; // Base points for specifying sources
    // Bonus for using multiple or credible sources
    if (sources.length >= 2 || sources.some(s => s.includes('Filings') || s.includes('Data') || s.includes('Audits') || s.includes('文件') || s.includes('数据') || s.includes('审计'))) {
      score += 10;
      strengths.push('Utilizes multiple or credible information sources.');
    }
     // Penalize if only social media is selected
     if (sources.length === 1 && sources[0].includes('Social Media')) {
      score -= 10;
      weaknesses.push('Relies solely on social media as an information source.');
    } else if (sources.some(s => s.includes('Social Media'))) {
      // Smaller penalty if social media is included with others
      score -= 3;
      weaknesses.push('Includes less credible sources (e.g., social media) without sufficient balance.');
    }
  } else {
    score -= 15;
    weaknesses.push('Information sources are not specified.');
  }
  
  // Information Verification Methods
  const verification = answers['5-2'] || '';
  if (verification.length > MIN_VALID_ANSWER_LENGTH) {
    // Check for keywords indicating active verification
    if (/(cross-reference|verify|validate|audit|交叉|验证|核实|审计)/i.test(verification)) {
      score += 15;
      strengths.push('Specifies methods for verifying information accuracy.');
    } else {
      score += 5; // Basic mention
    }
  } else {
    score -= 10;
    weaknesses.push('Information verification methods are not specified.');
  }
  
  // Key Assumptions Identification
  const assumptions = answers['5-3'] || '';
  if (assumptions.length > MIN_VALID_ANSWER_LENGTH) {
    score += 10;
    strengths.push('Key underlying assumptions are identified.');
  } else {
    score -= 10;
    weaknesses.push('Key assumptions underlying the investment thesis are not identified.');
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

/**
 * Evaluates Stage 6: Cognitive Bias Checking.
 * Assesses self-awareness of potential biases and the definition of measures to address them.
 * @param answers - The user's answers for the decision.
 * @returns The calculated score, strengths, and weaknesses for Stage 6.
 */
const evaluateStage6 = (answers: Record<string, any>): StageScore => {
  let score = 50; // Base score (lower starting point for bias check)
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let checkedBiases = 0;
  let acknowledgedBiases = 0;
  
  // Check answers for bias questions (6-1 to 6-5)
  for (let i = 1; i <= 5; i++) {
    const answer = answers[`6-${i}`];
    if (answer !== undefined) {
      checkedBiases++;
      if (answer === 'Yes' || answer === '是') {
        acknowledgedBiases++;
      }
    }
  }
  
  // Score based on number of biases checked
  score += checkedBiases * 3; // Up to +15 for checking all biases
  if (checkedBiases >= 3) {
    strengths.push('Awareness demonstrated by checking for multiple cognitive biases.');
  }
  if(checkedBiases < 3) {
    weaknesses.push('Limited self-check for potential cognitive biases.');
  }
  
  // Adjust score based on acknowledged biases (acknowledging is good, but needs countermeasures)
  if (acknowledgedBiases > 0) {
    score -= acknowledgedBiases * 2; // Penalty increases if countermeasures are weak
    strengths.push(`Acknowledged potential bias(es) (${acknowledgedBiases}).`);
  }
  
  // Measures to Address Biases
  const measures = answers['6-6'] || '';
  if (measures.length > MIN_VALID_ANSWER_LENGTH) {
    score += 15;
    strengths.push('Defined measures to address identified or potential biases.');
    // Bonus if measures seem strong and acknowledged biases exist
    if (acknowledgedBiases > 0 && /(rule|checklist|反向|强制|second opinion|review)/i.test(measures)) {
        score += acknowledgedBiases * 3; // Reward strong countermeasures more if biases acknowledged
    }
  } else {
    score -= 10;
    weaknesses.push('No measures defined to address potential cognitive biases.');
    if (acknowledgedBiases > 0) {
      score -= 10; // Heavier penalty if biases are acknowledged but no measures defined
      weaknesses.push('Acknowledged biases without defining countermeasures.');
    }
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

/**
 * Evaluates Stage 7: Documentation and Review.
 * Assesses the quality of the decision summary, identification of thesis-changing factors, and review process definition.
 * @param answers - The user's answers for the decision.
 * @returns The calculated score, strengths, and weaknesses for Stage 7.
 */
const evaluateStage7 = (answers: Record<string, any>): StageScore => {
  let score = 60; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Decision Summary Quality
  const summary = answers['7-1'] || '';
  if (summary.length > MIN_VALID_ANSWER_LENGTH * 2) { // Expect a slightly longer summary
    score += 15;
    strengths.push('Investment decision and rationale are summarized.');
  } else if (summary.length > 0) {
      score += 5;
  } else {
    score -= 15;
    weaknesses.push('Investment decision summary/rationale is missing or too brief.');
  }
  
  // Identification of Thesis-Changing Factors
  const changeFactors = answers['7-2'] || '';
  if (changeFactors.length > MIN_VALID_ANSWER_LENGTH) {
    score += 15;
    strengths.push('Potential factors that could invalidate the thesis are considered.');
  } else {
    score -= 15;
    weaknesses.push('Potential thesis-invalidating factors are not identified.');
  }
  
  // Review Process Definition
  const reviewFrequency = answers['7-3'] || '';
  if (reviewFrequency) {
    score += 10;
    strengths.push('A review frequency for the decision is established.');
  } else {
    score -= 10;
    weaknesses.push('The review process/frequency is not defined.');
  }
  
  // Additional Reviewer
  const reviewer = answers['7-4'] || '';
  if (reviewer.length > 3) { // Simple check if a name/role is entered
    score += 5;
    strengths.push('Includes provision for additional review (e.g., peer, advisor).');
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

/**
 * Determines the overall evaluation rating based on the total score.
 * @param score - The total evaluation score (0-100).
 * @returns The corresponding evaluation rating category.
 */
const getRating = (score: number): EvaluationRating => {
  if (score >= RATING_RANGES.system.min) return 'system';
  if (score >= RATING_RANGES.stable.min) return 'stable';
  if (score >= RATING_RANGES.cautious.min) return 'cautious';
  return 'high-risk';
};

/**
 * Integrates results from API analysis into the stage scores.
 * Currently placeholder - adjust scores based on API feedback (e.g., consistency, bias).
 * @param stageScores - The initial scores calculated for each stage.
 * @param apiResults - The results obtained from DeepSeek API calls.
 * @returns The updated stage scores potentially modified by API insights.
 */
const integrateAPIResults = (
  stageScores: Record<string, StageScore>,
  apiResults: {
    logicConsistency?: DeepSeekAnalysisResult;
    riskConsistency?: DeepSeekAnalysisResult;
    cognitiveBiases?: DeepSeekAnalysisResult;
  }
): Record<string, StageScore> => {
  const updatedScores = { ...stageScores };
  
  // Example: Adjust Stage 3 score based on logic consistency API result
  if (apiResults.logicConsistency && updatedScores['3']) {
    const consistencyScore = apiResults.logicConsistency.consistencyScore; // Score from 0-10
    // Adjust score based on consistency (e.g., + (consistencyScore - 5))
    updatedScores['3'].score = Math.max(0, Math.min(100, updatedScores['3'].score + (consistencyScore - 5)));
    if (apiResults.logicConsistency.conflictPoints.length > 0) {
      updatedScores['3'].weaknesses.push(...apiResults.logicConsistency.conflictPoints.map(p => `API: ${p}`));
    }
    if (apiResults.logicConsistency.suggestions.length > 0) {
      // Consider adding suggestions to overall recommendations later
    }
    updatedScores['3'].details = { ...(updatedScores['3'].details || {}), apiLogicConsistency: apiResults.logicConsistency };

  }
  
  // Example: Adjust Stage 4 score based on risk consistency API result
  if (apiResults.riskConsistency && updatedScores['4']) {
      const riskApiScore = apiResults.riskConsistency.consistencyScore; // 0-10
      updatedScores['4'].score = Math.max(0, Math.min(100, updatedScores['4'].score + (riskApiScore - 6))); // Adjust based on API score
      if (apiResults.riskConsistency.conflictPoints.length > 0) {
        updatedScores['4'].weaknesses.push(...apiResults.riskConsistency.conflictPoints.map(p => `API Risk: ${p}`));
      }
      updatedScores['4'].details = { ...(updatedScores['4'].details || {}), apiRiskConsistency: apiResults.riskConsistency };
  }
  
  // Example: Adjust Stage 6 score based on cognitive bias API result
  if (apiResults.cognitiveBiases && updatedScores['6']) {
      const biasScore = apiResults.cognitiveBiases.consistencyScore; // Using score field to represent detected bias severity (0 = low, 10 = high)
      updatedScores['6'].score = Math.max(0, Math.min(100, updatedScores['6'].score - biasScore * 2)); // Penalize more for detected biases
      if (apiResults.cognitiveBiases.conflictPoints.length > 0) { // Using conflict points to list detected biases
          updatedScores['6'].weaknesses.push(...apiResults.cognitiveBiases.conflictPoints.map(p => `API Bias: ${p}`));
      }
      updatedScores['6'].details = { ...(updatedScores['6'].details || {}), apiCognitiveBiases: apiResults.cognitiveBiases };
  }
  
  return updatedScores;
};

/**
 * Generates actionable recommendations based on the evaluation rating and identified weaknesses.
 * @param rating - The overall evaluation rating.
 * @param stageScores - The scores and feedback for each stage.
 * @param answers - The user's answers (used for context in some recommendations).
 * @returns A list of recommendation strings.
 */
const generateRecommendations = (
  rating: EvaluationRating,
  stageScores: Record<string, StageScore>,
  answers: Record<string, any>
): string[] => {
  const recommendations: string[] = [];
  
  // General recommendations based on rating
  switch (rating) {
    case 'high-risk':
      recommendations.push('策略存在重大缺陷，建议暂停投资，重新审视整个决策框架。');
      break;
    case 'cautious':
      recommendations.push('策略有明显漏洞，建议降低初始仓位，优先完善风险管理和信息验证。');
      break;
    case 'stable':
      recommendations.push('策略整体稳健，但部分细节需优化，建议定期复查关键假设。');
      break;
    case 'system':
      recommendations.push('策略系统性强，建议按计划执行，并保持定期审查。');
      break;
  }
  
  // Specific recommendations based on weaknesses in each stage
  for (const stage in stageScores) {
    const { weaknesses } = stageScores[stage];
    if (weaknesses.length > 0) {
      if (stage === '1') {
        if (weaknesses.includes('投资目标不明确')) recommendations.push('明确并量化您的主要投资目标。');
        if (weaknesses.includes('Mismatch between risk tolerance and investment time horizon.')) recommendations.push('重新评估风险承受能力与投资期限的匹配度。');
        if (weaknesses.includes('未明确流动性需求')) recommendations.push('详细说明您对投资流动性的具体要求。');
      }
      if (stage === '2') {
        if (weaknesses.includes('未选择投资方法')) recommendations.push('至少选择一种核心投资分析方法。');
        if (weaknesses.includes('Rationale for method selection is not provided or insufficient.')) recommendations.push('详细阐述您选择该投资方法的原因及其与目标的关联。');
        if (weaknesses.includes('Key evaluation metrics are not specified.')) recommendations.push('明确您将用来评估投资的关键财务或技术指标。');
      }
      if (stage === '3') {
        if (weaknesses.includes('买入规则不明确')) recommendations.push('量化您的买入触发条件，例如具体的价格、指标阈值。');
        if (weaknesses.includes('缺乏获利卖出规则')) recommendations.push('设定明确的止盈目标或条件。');
        if (weaknesses.includes('缺乏止损规则')) recommendations.push('设定明确的止损规则以控制下行风险。');
        if (weaknesses.includes('缺乏仓位管理策略')) recommendations.push('制定清晰的仓位管理规则，如单笔投资上限、总仓位限制等。');
      }
      if (stage === '4') {
        if (weaknesses.includes('Major risks associated with the investment are not identified.')) recommendations.push('全面识别与该投资相关的主要风险（市场、信用、流动性等）。');
        if (weaknesses.includes('Risk monitoring methods are not specified.')) recommendations.push('说明您将如何跟踪和监控已识别的风险。');
        if (weaknesses.includes('No risk mitigation methods selected.')) recommendations.push('选择至少一种风险缓解措施，如止损、分散投资或对冲。');
        if (weaknesses.includes('未明确最大可接受损失')) recommendations.push('量化您可以承受的最大潜在损失（百分比或金额）。');
      }
      if (stage === '5') {
        if (weaknesses.includes('Information sources are not specified.')) recommendations.push('列出您依赖的主要信息来源。');
        if (weaknesses.includes('Relies solely on social media as an information source.')) recommendations.push('避免仅依赖社交媒体信息，寻求更可靠、专业的信源。');
        if (weaknesses.includes('Information verification methods are not specified.')) recommendations.push('建立信息交叉验证的习惯或流程。');
        if (weaknesses.includes('Key assumptions underlying the investment thesis are not identified.')) recommendations.push('明确支撑您投资决策的关键假设条件。');
      }
       if (stage === '6') {
        if (weaknesses.includes('Limited self-check for potential cognitive biases.')) recommendations.push('系统性地检查常见的认知偏差（如锚定、过度自信等）。');
        if (weaknesses.includes('No measures defined to address potential cognitive biases.') || weaknesses.includes('Acknowledged biases without defining countermeasures.')) recommendations.push('针对已识别或潜在的认知偏差，制定具体的应对措施。');
      }
       if (stage === '7') {
        if (weaknesses.includes('Investment decision summary/rationale is missing or too brief.')) recommendations.push('更清晰、完整地记录您的投资决策逻辑。');
        if (weaknesses.includes('Potential thesis-invalidating factors are not identified.')) recommendations.push('思考并记录哪些情况发生可能使您的投资逻辑不再成立。');
        if (weaknesses.includes('The review process/frequency is not defined.')) recommendations.push('设定明确的投资决策复盘周期或触发条件。');
      }
    }
  }
  
  // Add recommendations from API if available
  if (stageScores['3']?.details?.apiLogicConsistency?.suggestions?.length > 0) {
    recommendations.push(...stageScores['3'].details.apiLogicConsistency.suggestions.map((s:string) => `API建议(逻辑): ${s}`));
  }
  if (stageScores['4']?.details?.apiRiskConsistency?.suggestions?.length > 0) {
    recommendations.push(...stageScores['4'].details.apiRiskConsistency.suggestions.map((s:string) => `API建议(风险): ${s}`));
  }
  if (stageScores['6']?.details?.apiCognitiveBiases?.suggestions?.length > 0) {
    recommendations.push(...stageScores['6'].details.apiCognitiveBiases.suggestions.map((s:string) => `API建议(偏差): ${s}`));
  }
  
  // Remove duplicates and limit the number of recommendations
  const uniqueRecommendations = Array.from(new Set(recommendations));
  return uniqueRecommendations.slice(0, 7); // Limit to 7 recommendations
};

/**
 * Calculates the scores for each evaluation stage based on user answers.
 * @param answers - The user's answers for the decision.
 * @returns An object mapping stage numbers to their calculated StageScore.
 */
const evaluateStageScores = (answers: Record<string, any>): Record<string, StageScore> => {
  return {
    '1': evaluateStage1(answers),
    '2': evaluateStage2(answers),
    '3': evaluateStage3(answers),
    '4': evaluateRiskManagement(answers),
    '5': evaluateStage5(answers),
    '6': evaluateStage6(answers),
    '7': evaluateStage7(answers),
  };
};

/**
 * Calculates the total weighted score based on individual stage scores.
 * @param stageScores - An object containing scores for each stage.
 * @returns The calculated total score (0-100).
 */
const calculateTotalScore = (stageScores: Record<string, StageScore>): number => {
  let totalScore = 0;
  let totalWeight = 0;
  
  // Iterate over the string keys of stageScores
  for (const stageStringKey in stageScores) {
    // Ensure the key is directly on the object, not from the prototype chain
    if (Object.prototype.hasOwnProperty.call(stageScores, stageStringKey)) {
      // Convert the string key to a number
      const stageNumKey = parseInt(stageStringKey, 10);

      // Validate if the number is a valid key for STAGE_WEIGHTS
      // Assuming STAGE_WEIGHTS keys are numeric literals from 1 to 7
      if (
        !isNaN(stageNumKey) &&
        stageNumKey >= 1 &&
        stageNumKey <= 7 &&
        Object.prototype.hasOwnProperty.call(STAGE_WEIGHTS, stageNumKey)
      ) {
        // Cast the validated number key to the specific literal union type
        const validStageNumKey = stageNumKey as keyof typeof STAGE_WEIGHTS;
        
        const stageWeight = STAGE_WEIGHTS[validStageNumKey] / 100; // Use validated numeric key
        totalScore += stageScores[stageStringKey].score * stageWeight; // Use original string key for stageScores
        totalWeight += stageWeight;
      } else {
        console.warn(`Skipping invalid or non-numeric stage key from stageScores: ${stageStringKey}`);
      }
    }
  }
  
  // Normalize score in case weights don't sum up to exactly 1 (though they should)
  if (totalWeight > 0 && totalWeight !== 1) {
      console.warn(`Total stage weights (${totalWeight * 100}%) do not sum to 100%. Normalizing score.`);
      totalScore = totalScore / totalWeight;
  }

  return Math.max(0, Math.min(100, Math.round(totalScore)));
};

/**
 * Extracts and aggregates all strengths and weaknesses from individual stage scores.
 * @param stageScores - An object containing scores for each stage.
 * @returns An object containing lists of overall strengths and weaknesses.
 */
const extractOverallStrengthsWeaknesses = (
  stageScores: Record<string, StageScore>
): { strengths: string[], weaknesses: string[] } => {
  const allStrengths: string[] = [];
  const allWeaknesses: string[] = [];
  
  for (const stage in stageScores) {
    allStrengths.push(...stageScores[stage].strengths);
    allWeaknesses.push(...stageScores[stage].weaknesses);
  }
  
  // Optionally add API detected weaknesses here if not added in recommendations
  if (stageScores['3']?.details?.apiLogicConsistency?.conflictPoints?.length > 0) {
     allWeaknesses.push(...stageScores['3'].details.apiLogicConsistency.conflictPoints.map((p:string) => `API Logic Conflict: ${p}`));
  }
   if (stageScores['4']?.details?.apiRiskConsistency?.conflictPoints?.length > 0) {
     allWeaknesses.push(...stageScores['4'].details.apiRiskConsistency.conflictPoints.map((p:string) => `API Risk Conflict: ${p}`));
  }
   if (stageScores['6']?.details?.apiCognitiveBiases?.conflictPoints?.length > 0) {
      allWeaknesses.push(...stageScores['6'].details.apiCognitiveBiases.conflictPoints.map((p:string) => `API Detected Bias: ${p}`));
  }

  return {
    strengths: Array.from(new Set(allStrengths)),
    weaknesses: Array.from(new Set(allWeaknesses)),
  };
};

/**
 * Asynchronously evaluates an investment decision, potentially using API enhancement.
 * This is the main function called by the UI to trigger a full evaluation.
 * @param decision - The investment decision object to evaluate.
 * @param apiKey - Optional API key for DeepSeek enhancement.
 * @param language - The current language for API prompts and potentially results.
 * @returns A promise resolving to the detailed EvaluationResult.
 * @throws If input validation fails or API calls encounter critical errors.
 */
export const evaluateInvestmentDecision = async (
  decision: InvestmentDecision,
  apiKey?: string,
  language: 'zh' | 'en' = 'zh'
): Promise<EvaluationResult> => {
  // 1. Validate Inputs (Basic checks like required fields)
  const validationErrors = validateDecisionInputs(decision);
  if (validationErrors.length > 0) {
    throw new Error(`Input validation failed: ${validationErrors.join(', ')}`);
  }

  // 2. Evaluate Stage Scores (Rule-based scoring)
  const stageScores = evaluateStageScores(decision.answers);

  let finalStageScores = stageScores;
  let apiResults = {};
  let apiEnhanced = false;

  // 3. API Enhanced Analysis (If API key is provided)
  if (apiKey) {
    try {
      // Perform API calls in parallel
      const answers = decision.answers;

      // Prepare arguments for each API call separately
      const logicArgs = {
        buyRules: answers['3-1'] || '',
        sellProfitRules: answers['3-2'] || '',
        sellLossRules: answers['3-3'] || '',
        riskMgmtSummary: answers['4-1'] || '' // example mapping, adjust if needed
      };
      const logicPromise = analyzeLogicConsistency(
        logicArgs,
        apiKey, // API Key is now the second argument
        language
      );

      const riskArgs = {
        riskTolerance: answers['1-3'] || '',
        riskIdentification: answers['4-1'] || '',
        maxLoss: answers['4-4'] || ''
      };
      const riskPromise = analyzeRiskConsistency(
        riskArgs,
        apiKey, // API Key is now the second argument
        language
      );

      // Aggregate bias answers
      const biasChecks = {
        '6-1': answers['6-1'],
        '6-2': answers['6-2'],
        '6-3': answers['6-3'],
        '6-4': answers['6-4'],
        '6-5': answers['6-5']
      };
      const biasMitigationPlan = answers['6-6'] || '';
      const biasArgs = { biasChecks, mitigationPlan: biasMitigationPlan };

      const biasPromise = analyzeCognitiveBiases(
        biasArgs,
        apiKey, // API Key is now the second argument
        language
      );

      const [logicResult, riskResult, biasResult] = await Promise.all([
        logicPromise,
        riskPromise,
        biasPromise
      ]);

      apiResults = { 
        logicConsistency: logicResult, 
        riskConsistency: riskResult, 
        cognitiveBiases: biasResult 
      };
      
      // Integrate API results into scores
      finalStageScores = integrateAPIResults(stageScores, apiResults);
      apiEnhanced = true; // Mark that API was used successfully

    } catch (apiError) {
      console.error("API analysis failed, proceeding with basic evaluation:", apiError);
      // Optionally: add a weakness indicating API failure
      // For now, we just use the basic scores if API fails
    }
  }

  // 4. Calculate Total Score
  const totalScore = calculateTotalScore(finalStageScores);

  // 5. Determine Rating
  const rating = getRating(totalScore);

  // 6. Extract Strengths and Weaknesses
  const { strengths, weaknesses } = extractOverallStrengthsWeaknesses(finalStageScores);

  // 7. Generate Recommendations
  const recommendations = generateRecommendations(rating, finalStageScores, decision.answers);

  return {
    totalScore,
    rating,
    stageScores: finalStageScores,
    overallStrengths: strengths,
    overallWeaknesses: weaknesses,
    recommendations,
    apiEnhanced,
  };
};

/**
 * Synchronously evaluates an investment decision using only rule-based scoring.
 * Used when no API key is available or as a fallback.
 * @param decision - The investment decision object to evaluate.
 * @returns The detailed EvaluationResult based on synchronous scoring.
 */
export const evaluateInvestmentDecisionSync = (
  decision: InvestmentDecision
): EvaluationResult => {
  // 1. Evaluate Stage Scores
  const stageScores = evaluateStageScores(decision.answers);

  // 2. Calculate Total Score
  const totalScore = calculateTotalScore(stageScores);

  // 3. Determine Rating
  const rating = getRating(totalScore);

  // 4. Extract Strengths and Weaknesses
  const { strengths, weaknesses } = extractOverallStrengthsWeaknesses(stageScores);

  // 5. Generate Recommendations
  const recommendations = generateRecommendations(rating, stageScores, decision.answers);

  return {
    totalScore,
    rating,
    stageScores,
    overallStrengths: strengths,
    overallWeaknesses: weaknesses,
    recommendations,
    apiEnhanced: false, // API was not used
  };
};

/**
 * Validates the basic inputs of an investment decision.
 * Currently checks if the decision name is provided.
 * @param decision - The investment decision object.
 * @returns A list of validation error messages (empty if valid).
 */
export const validateDecisionInputs = (
  decision: InvestmentDecision
): string[] => {
  const errors: string[] = [];
  if (!decision.name || decision.name.trim() === '') {
    errors.push('Decision name is required.');
  }
  // Add more basic validations if needed (e.g., checking if answers object exists)
  return errors;
};