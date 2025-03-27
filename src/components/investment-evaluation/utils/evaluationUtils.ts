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

// 评估第一阶段：目标与风险
const evaluateStage1 = (answers: Record<string, any>): StageScore => {
  let score = 60; // 基础分
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // 投资目标明确性
  const goals = answers['1-1'] || '';
  if (goals.length > MIN_VALID_ANSWER_LENGTH) {
    score += 10;
    strengths.push('投资目标明确');
  } else {
    score -= 15;
    weaknesses.push('投资目标不明确');
  }
  
  // 时间期限合理性
  const timeHorizon = answers['1-2'] || '';
  if (timeHorizon) {
    if (timeHorizon.includes('Long-term')) {
      score += 10;
      strengths.push('具有长期投资眼光');
    } else if (timeHorizon.includes('Medium-term')) {
      score += 5;
    } else {
      // 短期投资需要更严格的规划
      if (goals.includes('growth') || goals.includes('高收益')) {
        score -= 10;
        weaknesses.push('短期目标与增长期望不匹配');
      }
    }
  } else {
    score -= 10;
    weaknesses.push('未明确投资期限');
  }
  
  // 风险承受能力与目标匹配度
  const riskTolerance = answers['1-3'] || '';
  if (riskTolerance) {
    if ((timeHorizon.includes('Short-term') && riskTolerance.includes('Aggressive')) ||
        (timeHorizon.includes('Long-term') && riskTolerance.includes('Conservative'))) {
      score -= 10;
      weaknesses.push('风险承受能力与投资期限不匹配');
    } else if ((timeHorizon.includes('Long-term') && riskTolerance.includes('Moderate')) ||
               (timeHorizon.includes('Medium-term') && riskTolerance.includes('Moderate'))) {
      score += 10;
      strengths.push('风险承受能力与投资期限匹配');
    }
  } else {
    score -= 10;
    weaknesses.push('未明确风险承受能力');
  }
  
  // 流动性需求评估
  const liquidityNeeds = answers['1-4'] || '';
  if (liquidityNeeds.length > MIN_VALID_ANSWER_LENGTH) {
    score += 5;
    if (liquidityNeeds.includes('20%') || liquidityNeeds.includes('30%') ||
        liquidityNeeds.includes('need access') || liquidityNeeds.includes('保留')) {
      strengths.push('具有明确的流动性规划');
    }
  } else {
    weaknesses.push('未明确流动性需求');
  }
  
  // 确保分数在0-100范围内
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

// 评估第二阶段：投资方法
const evaluateStage2 = (answers: Record<string, any>): StageScore => {
  let score = 60; // 基础分
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // 投资方法选择
  const methods = Array.isArray(answers['2-1']) ? answers['2-1'] : [];
  if (methods.length > 0) {
    // 多方法结合加分
    if (methods.length >= 2) {
      score += 10;
      strengths.push('结合多种投资方法');
    } else {
      score += 5;
    }
    
    // 检查是否包含基本面分析
    const hasFundamental = methods.some(m => m.includes('Fundamental'));
    // 检查是否包含技术分析
    const hasTechnical = methods.some(m => m.includes('Technical'));
    // 检查是否包含量化分析
    const hasQuantitative = methods.some(m => m.includes('Quantitative'));
    
    // 评价方法选择的合理性
    if (hasFundamental && (hasTechnical || hasQuantitative)) {
      score += 5;
      strengths.push('结合质化与量化分析');
    }
  } else {
    score -= 20;
    weaknesses.push('未选择投资方法');
  }
  
  // 方法合理性解释
  const methodRationale = answers['2-2'] || '';
  if (methodRationale.length > MIN_VALID_ANSWER_LENGTH) {
    if (methodRationale.includes('goal') || methodRationale.includes('目标') ||
        methodRationale.includes('match') || methodRationale.includes('匹配')) {
      score += 10;
      strengths.push('方法选择与投资目标匹配');
    } else {
      score += 5;
    }
  } else {
    score -= 10;
    weaknesses.push('未解释方法选择理由');
  }
  
  // 关键指标选择
  const metrics = answers['2-3'] || '';
  if (metrics.length > MIN_VALID_ANSWER_LENGTH) {
    if ((metrics.includes('PE') || metrics.includes('PB') || metrics.includes('ROE')) &&
        (metrics.includes('MACD') || metrics.includes('RSI') || metrics.includes('moving average'))) {
      score += 10;
      strengths.push('使用多维度指标评估');
    } else if (metrics.includes('PE') || metrics.includes('PB') || metrics.includes('ROE') ||
              metrics.includes('MACD') || metrics.includes('RSI')) {
      score += 5;
      strengths.push('有基本的评估指标');
    }
  } else {
    score -= 10;
    weaknesses.push('未明确评估指标');
  }
  
  // 确保分数在0-100范围内
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

// 评估第三阶段：买卖规则
const evaluateStage3 = (answers: Record<string, any>): StageScore => {
  let score = 60; // 基础分
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // 买入规则明确性
  const buyRules = answers['3-1'] || '';
  if (buyRules.length > MIN_VALID_ANSWER_LENGTH) {
    if (buyRules.includes('RSI') || buyRules.includes('MACD') || buyRules.includes('移动平均线') ||
        buyRules.includes('PE') || buyRules.includes('PB') || buyRules.includes('低于') ||
        buyRules.includes('below') || buyRules.includes('above') || buyRules.includes('突破')) {
      score += 10;
      strengths.push('买入规则具体明确');
    } else {
      score += 5;
    }
  } else {
    score -= 15;
    weaknesses.push('买入规则不明确');
  }
  
  // 获利卖出规则
  const sellProfitRules = answers['3-2'] || '';
  if (sellProfitRules.length > MIN_VALID_ANSWER_LENGTH) {
    if (sellProfitRules.includes('%') || sellProfitRules.includes('目标价') ||
        sellProfitRules.includes('target') || sellProfitRules.includes('超过') ||
        sellProfitRules.includes('above')) {
      score += 10;
      strengths.push('有明确的获利了结标准');
    } else {
      score += 5;
    }
  } else {
    score -= 10;
    weaknesses.push('缺乏获利卖出规则');
  }
  
  // 止损规则
  const sellLossRules = answers['3-3'] || '';
  if (sellLossRules.length > MIN_VALID_ANSWER_LENGTH) {
    if (sellLossRules.includes('%') || sellLossRules.includes('止损') ||
        sellLossRules.includes('stop') || sellLossRules.includes('loss') ||
        sellLossRules.includes('跌破')) {
      score += 15;
      strengths.push('有明确的止损策略');
    } else {
      score += 5;
    }
  } else {
    score -= 15;
    weaknesses.push('缺乏止损规则');
  }
  
  // 仓位管理
  const positionRules = answers['3-4'] || '';
  if (positionRules.length > MIN_VALID_ANSWER_LENGTH) {
    if (positionRules.includes('%') && 
        (positionRules.includes('单笔') || positionRules.includes('单个') || 
        positionRules.includes('position size') || positionRules.includes('allocation'))) {
      score += 10;
      strengths.push('有具体的仓位控制策略');
    } else {
      score += 5;
    }
  } else {
    score -= 10;
    weaknesses.push('缺乏仓位管理策略');
  }
  
  // 确保分数在0-100范围内
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

// 评估第四阶段：风险管理
const evaluateRiskManagement = (answers: Record<string, any>): StageScore => {
  let score = 60; // 基础分
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // 风险识别
  const risks = answers['4-1'] || '';
  if (risks.length > MIN_VALID_ANSWER_LENGTH) {
    if (risks.includes('政策') || risks.includes('监管') || risks.includes('行业') ||
        risks.includes('周期') || risks.includes('流动性') || risks.includes('regulatory') ||
        risks.includes('industry') || risks.includes('liquidity')) {
      score += 10;
      strengths.push('识别了多个风险因素');
    } else {
      score += 5;
    }
  } else {
    score -= 15;
    weaknesses.push('未识别主要风险');
  }
  
  // 风险监控
  const monitoring = answers['4-2'] || '';
  if (monitoring.length > MIN_VALID_ANSWER_LENGTH) {
    if (monitoring.includes('定期') || monitoring.includes('预警') ||
        monitoring.includes('阈值') || monitoring.includes('监控') ||
        monitoring.includes('regular') || monitoring.includes('alert') ||
        monitoring.includes('threshold') || monitoring.includes('monitor')) {
      score += 10;
      strengths.push('有系统化的风险监控机制');
    } else {
      score += 5;
    }
  } else {
    score -= 10;
    weaknesses.push('缺乏风险监控方法');
  }
  
  // 风险缓解方法
  const mitigations = Array.isArray(answers['4-3']) ? answers['4-3'] : [];
  if (mitigations.length > 0) {
    if (mitigations.includes('Stop-loss Orders')) {
      score += 10;
      strengths.push('使用止损单控制风险');
    }
    if (mitigations.includes('Diversification')) {
      score += 10;
      strengths.push('通过多元化降低风险');
    }
    if (mitigations.includes('Options Hedging')) {
      score += 5;
      strengths.push('使用期权对冲风险');
    }
  } else {
    score -= 15;
    weaknesses.push('未选择风险缓解方法');
  }
  
  // 最大可接受损失
  const maxLoss = answers['4-4'] || '';
  if (maxLoss.length > 0) {
    if (maxLoss.includes('%')) {
      score += 10;
      strengths.push('明确量化了可接受损失');
    } else {
      score += 5;
    }
  } else {
    score -= 10;
    weaknesses.push('未明确最大可接受损失');
  }
  
  // 确保分数在0-100范围内
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    strengths,
    weaknesses
  };
};

// 评估第五阶段：信息验证（继续）
const evaluateStage5 = (answers: Record<string, any>): StageScore => {
    let score = 60; // 基础分
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // 信息来源多样性
    const infoSources = answers['5-1'] || '';
    if (infoSources.length > MIN_VALID_ANSWER_LENGTH) {
      // 检查信息来源类型
      const hasPrimarySources = /官方|公司|财报|年报|official|company|report/i.test(infoSources);
      const hasSecondarySources = /分析师|研究|报告|analyst|research/i.test(infoSources);
      const hasMultipleSources = /多|多个|多种|multiple|several|various/i.test(infoSources);
      
      if (hasPrimarySources && hasSecondarySources) {
        score += 10;
        strengths.push('信息来源多样且可靠');
      } else if (hasPrimarySources || hasMultipleSources) {
        score += 5;
        strengths.push('信息来源相对可靠');
      } else {
        weaknesses.push('信息来源可能不足');
      }
    } else {
      score -= 10;
      weaknesses.push('未明确信息来源');
    }
    
    // 交叉验证
    const verification = answers['5-2'] || '';
    if (verification.length > MIN_VALID_ANSWER_LENGTH) {
      if (/交叉|多方|cross|multiple source/i.test(verification)) {
        score += 10;
        strengths.push('进行了交叉验证');
      }
    } else {
      score -= 5;
      weaknesses.push('缺乏交叉验证机制');
    }
    
    // 假设检验
    const assumptions = answers['5-3'] || '';
    if (assumptions.length > MIN_VALID_ANSWER_LENGTH) {
      if (/反例|反向|falsify|counter|challenge|test/i.test(assumptions)) {
        score += 10;
        strengths.push('考虑了假设的可证伪性');
      }
    } else {
      score -= 5;
      weaknesses.push('缺乏关键假设检验');
    }
    
    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      strengths,
      weaknesses
    };
  };
  
  // 评估第六阶段：认知偏差
  const evaluateStage6 = (answers: Record<string, any>): StageScore => {
    let score = 60; // 基础分
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // 认知偏差识别
    const biases = Array.isArray(answers['6-1']) ? answers['6-1'] : [];
    if (biases.length >= 3) {
      score += 15;
      strengths.push('认知偏差识别全面');
    } else if (biases.length === 0) {
      score -= 10;
      weaknesses.push('未识别认知偏差');
    } else {
      score += 5;
      strengths.push('有基本的认知偏差识别');
    }
    
    // 应对措施
    const biasMitigation = answers['6-2'] || '';
    if (biasMitigation.length > MIN_VALID_ANSWER_LENGTH) {
      if (/流程|检查表|第三方|审查|process|checklist|third party|review/i.test(biasMitigation)) {
        score += 15;
        strengths.push('有系统性的偏差应对措施');
      } else {
        score += 5;
        strengths.push('有基本的偏差应对意识');
      }
    } else {
      score -= 10;
      weaknesses.push('缺乏偏差应对措施');
    }
    
    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      strengths,
      weaknesses
    };
  };
  
  // 评估第七阶段：文档审查
  const evaluateStage7 = (answers: Record<string, any>): StageScore => {
    let score = 60; // 基础分
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // 总结完整性
    const summary = answers['7-1'] || '';
    if (summary.length > MIN_VALID_ANSWER_LENGTH * 2) {
      score += 10;
      strengths.push('决策总结完整');
    } else {
      score -= 5;
      weaknesses.push('决策总结不充分');
    }
    
    // 变因分析
    const factors = answers['7-2'] || '';
    if (factors.length > MIN_VALID_ANSWER_LENGTH) {
      if (/\d+|多个|several|multiple/i.test(factors)) {
        score += 10;
        strengths.push('考虑了多个潜在变因');
      }
    } else {
      score -= 5;
      weaknesses.push('缺乏变因分析');
    }
    
    // 审查频率
    const reviewFrequency = answers['7-3'] || '';
    if (reviewFrequency.includes('Monthly')) {
      score += 10;
      strengths.push('定期审查频率合理');
    } else if (reviewFrequency.includes('Quarterly')) {
      score += 5;
      strengths.push('定期审查频率适当');
    } else if (reviewFrequency.includes('Event-driven')) {
      score += 7;
      strengths.push('有事件驱动的审查机制');
    }
    
    // 多人审查
    const reviewers = answers['7-4'] || '';
    if (reviewers.length > MIN_VALID_ANSWER_LENGTH) {
      score += 5;
      strengths.push('有多方审查机制');
    }
    
    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      strengths,
      weaknesses
    };
  };
  
  // 获取评级
  const getRating = (score: number): EvaluationRating => {
    if (score >= RATING_RANGES.system.min) return 'system';
    if (score >= RATING_RANGES.stable.min) return 'stable';
    if (score >= RATING_RANGES.cautious.min) return 'cautious';
    return 'high-risk';
  };
  
  // 整合API分析结果
  const integrateAPIResults = (
    stageScores: Record<string, StageScore>,
    apiResults: {
      logicConsistency?: DeepSeekAnalysisResult;
      riskConsistency?: DeepSeekAnalysisResult;
      cognitiveBiases?: DeepSeekAnalysisResult;
    }
  ): Record<string, StageScore> => {
    const updatedScores = { ...stageScores };
    
    // 整合买卖规则逻辑一致性评估
    if (apiResults.logicConsistency) {
      const { consistencyScore, conflictPoints, suggestions } = apiResults.logicConsistency;
      
      // 买卖规则与风险管理阶段的分数调整
      if (updatedScores['3'] && consistencyScore !== undefined) {
        // 调整买卖规则分数（第三阶段）
        const stage3Score = updatedScores['3'];
        const apiScoreImpact = (consistencyScore - 5) * 3; // -15到+15分的影响
        
        stage3Score.score = Math.max(0, Math.min(100, stage3Score.score + apiScoreImpact));
        
        // 添加API分析发现的问题或优势
        if (consistencyScore <= 3) {
          stage3Score.weaknesses.push('买卖规则逻辑存在严重矛盾');
          if (conflictPoints && conflictPoints.length > 0) {
            stage3Score.weaknesses.push(...conflictPoints.slice(0, 2));
          }
        } else if (consistencyScore >= 8) {
          stage3Score.strengths.push('买卖规则逻辑高度一致');
        }
        
        // 添加API建议
        if (suggestions && suggestions.length > 0) {
          stage3Score.details = {
            ...(stage3Score.details || {}),
            apiSuggestions: suggestions
          };
        }
      }
    }
    
    // 整合风险一致性评估
    if (apiResults.riskConsistency) {
      const { consistencyScore, conflictPoints, suggestions } = apiResults.riskConsistency;
      
      // 风险管理阶段的分数调整（第四阶段）
      if (updatedScores['4'] && consistencyScore !== undefined) {
        const stage4Score = updatedScores['4'];
        const apiScoreImpact = (consistencyScore - 5) * 3; // -15到+15分的影响
        
        stage4Score.score = Math.max(0, Math.min(100, stage4Score.score + apiScoreImpact));
        
        // 添加API分析发现的问题或优势
        if (consistencyScore <= 3) {
          stage4Score.weaknesses.push('风险评估与管理措施不一致');
          if (conflictPoints && conflictPoints.length > 0) {
            stage4Score.weaknesses.push(...conflictPoints.slice(0, 2));
          }
        } else if (consistencyScore >= 8) {
          stage4Score.strengths.push('风险评估与管理措施高度一致');
        }
        
        // 添加API建议
        if (suggestions && suggestions.length > 0) {
          stage4Score.details = {
            ...(stage4Score.details || {}),
            apiSuggestions: suggestions
          };
        }
      }
    }
    
    // 整合认知偏差分析
    if (apiResults.cognitiveBiases) {
      const { consistencyScore, conflictPoints, suggestions } = apiResults.cognitiveBiases;
      
      // 认知偏差阶段的分数调整（第六阶段）
      if (updatedScores['6'] && consistencyScore !== undefined) {
        const stage6Score = updatedScores['6'];
        const apiScoreImpact = (consistencyScore - 5) * 3; // -15到+15分的影响
        
        stage6Score.score = Math.max(0, Math.min(100, stage6Score.score + apiScoreImpact));
        
        // 添加API分析发现
        if (consistencyScore <= 3) {
          stage6Score.weaknesses.push('认知偏差应对措施不充分');
          if (conflictPoints && conflictPoints.length > 0) {
            stage6Score.weaknesses.push(...conflictPoints.slice(0, 2));
          }
        } else if (consistencyScore >= 8) {
          stage6Score.strengths.push('认知偏差识别与应对完善');
        }
        
        // 添加API建议
        if (suggestions && suggestions.length > 0) {
          stage6Score.details = {
            ...(stage6Score.details || {}),
            apiSuggestions: suggestions
          };
        }
      }
    }
    
    return updatedScores;
  };
  
  // 根据评级和弱项生成建议
  const generateRecommendations = (
    rating: EvaluationRating,
    stageScores: Record<string, StageScore>,
    answers: Record<string, any>
  ): string[] => {
    const recommendations: string[] = [];
    const weaknesses: string[] = [];
    
    // 收集所有弱项
    Object.values(stageScores).forEach(stage => {
      weaknesses.push(...stage.weaknesses);
    });
    
    // 基于评级的基本建议
    switch (rating) {
      case 'system':
        recommendations.push('策略高度完备，可直接执行');
        recommendations.push('按原计划投资，定期审查风险敞口');
        break;
      case 'stable':
        recommendations.push('策略整体可行，需优化局部缺陷');
        recommendations.push('补充对冲工具或细化买卖阈值');
        recommendations.push('3个月内复查关键假设');
        break;
      case 'cautious':
        recommendations.push('策略存在显著漏洞，需谨慎执行');
        recommendations.push('降低仓位至50%以下');
        recommendations.push('优先完善风险管理和信息验证流程');
        break;
      case 'high-risk':
        recommendations.push('策略不可执行，需重新设计投资框架');
        recommendations.push('暂停投资，重新设计目标-方法-风险控制的三位一体框架');
        recommendations.push('建议从小仓位尝试，积累经验后再增加投资规模');
        break;
    }
    
    // 基于弱项的具体建议
    if (weaknesses.includes('买入规则缺乏量化标准') || weaknesses.includes('卖出规则缺乏量化标准')) {
      recommendations.push('将买卖规则量化，设定具体数值阈值（如PE<行业30%分位时买入）');
    }
    
    if (weaknesses.includes('单笔投资比例过高')) {
      recommendations.push('控制单笔投资比例，建议不超过总资金的10-15%');
    }
    
    if (weaknesses.includes('风险识别不足') || weaknesses.includes('无风险对冲措施')) {
      recommendations.push('增加多样化分散投资策略，至少覆盖3个不同相关性较低的资产类别');
    }
    
    if (weaknesses.includes('未明确信息来源') || weaknesses.includes('缺乏交叉验证机制')) {
      recommendations.push('建立信息验证流程，使用至少2个独立来源交叉验证关键信息');
    }
    
    // 根据时间范围动态调整建议
    const timeHorizon = answers['1-2'] || '';
    const isLongTerm = timeHorizon.includes('Long-term') || timeHorizon.includes('>5');
    const isShortTerm = timeHorizon.includes('Short-term') || timeHorizon.includes('<1');
    
    if (isLongTerm && rating === 'cautious') {
      recommendations.push('作为长期投资者，可适当提高波动容忍度，但仍需控制总体风险');
    }
    
    if (isShortTerm && rating !== 'high-risk') {
      recommendations.push('短期投资需加强流动性管理，建议预留30%以上资金应对意外');
    }
    
    // 确保建议不重复且数量适中
    const uniqueRecommendations = Array.from(new Set(recommendations));
    return uniqueRecommendations.slice(0, 5); // 最多返回5条建议
  };
  
  // 评估各阶段得分
  const evaluateStageScores = (answers: Record<string, any>): Record<string, StageScore> => {
    return {
      '1': evaluateStage1(answers),
      '2': evaluateStage2(answers),
      '3': evaluateStage3(answers),
      '4': evaluateRiskManagement(answers),
      '5': evaluateStage5(answers),
      '6': evaluateStage6(answers),
      '7': evaluateStage7(answers)
    };
  };
  
  // 计算总分
  const calculateTotalScore = (stageScores: Record<string, StageScore>): number => {
    let totalScore = 0;
    
    // 计算加权总分
    Object.entries(stageScores).forEach(([stage, score]) => {
      const stageNumber = parseInt(stage, 10);
      const weight = STAGE_WEIGHTS[stageNumber as keyof typeof STAGE_WEIGHTS] || 0;
      totalScore += score.score * weight;
    });
    
    // 四舍五入到整数
    return Math.round(totalScore);
  };
  
  // 提取整体强项和弱项
  const extractOverallStrengthsWeaknesses = (
    stageScores: Record<string, StageScore>
  ): { strengths: string[], weaknesses: string[] } => {
    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];
    
    // 收集各阶段的强项和弱项
    Object.entries(stageScores).forEach(([stage, { strengths, weaknesses, score }]) => {
      // 只收集得分较高的强项和得分较低的弱项
      if (score >= 80) {
        switch (stage) {
          case '1': allStrengths.push('目标定义清晰'); break;
          case '2': allStrengths.push('方法选择适当'); break;
          case '3': allStrengths.push('买卖规则明确'); break;
          case '4': allStrengths.push('风险管理完善'); break;
          case '5': allStrengths.push('信息验证充分'); break;
          case '6': allStrengths.push('认知偏差应对完善'); break;
          case '7': allStrengths.push('文档与审查流程完备'); break;
        }
      }
      
      if (score <= 40) {
        switch (stage) {
          case '1': allWeaknesses.push('目标与风险定义不清'); break;
          case '2': allWeaknesses.push('投资方法不适合目标'); break;
          case '3': allWeaknesses.push('买卖规则不明确'); break;
          case '4': allWeaknesses.push('风险管理不完善'); break;
          case '5': allWeaknesses.push('信息验证不足'); break;
          case '6': allWeaknesses.push('认知偏差未有效应对'); break;
          case '7': allWeaknesses.push('决策复盘机制不足'); break;
        }
      }
    });
    
    // 确保不重复且数量适中
    return {
      strengths: Array.from(new Set(allStrengths)).slice(0, 3),
      weaknesses: Array.from(new Set(allWeaknesses)).slice(0, 3)
    };
  };
  
  // 主评估函数：带API增强的完整评估
  export const evaluateInvestmentDecision = async (
    decision: InvestmentDecision,
    apiKey?: string,
    language: 'zh' | 'en' = 'zh'
  ): Promise<EvaluationResult> => {
    // 第一步：基础评分
    const stageScores = evaluateStageScores(decision.answers);
    
    // 第二步：API增强分析（如果提供了API密钥）
    let apiResults = {};
    let apiAssisted = false;
    
    if (apiKey) {
      try {
        apiAssisted = true;
        const apiAnalysisPromises = [];
        
        // 买卖规则与风险管理一致性分析
        const buyRules = decision.answers['3-1'] || '';
        const sellRules = decision.answers['3-2'] || '';
        const riskManagement = decision.answers['4-1'] || '';
        
        if (buyRules && sellRules && riskManagement) {
          // 获取止损规则
          const stopLossRules = decision.answers['3-3'] || '';
          
          apiAnalysisPromises.push(
            analyzeLogicConsistency(
              apiKey,
              buyRules,
              sellRules,
              stopLossRules,
              riskManagement,
              language
            ).then(result => ({ logicConsistency: result }))
          );
        }
        
        // 风险一致性分析：风险承受能力与风险管理措施
        const riskTolerance = decision.answers['1-3'] || '';
        const riskIdentification = decision.answers['4-1'] || '';
        const maxLoss = decision.answers['4-4'] || '';
        
        if (riskTolerance && riskIdentification && maxLoss) {
          apiAnalysisPromises.push(
            analyzeRiskConsistency(
              apiKey,
              riskTolerance,
              riskIdentification,
              maxLoss,
              language
            ).then(result => ({ riskConsistency: result }))
          );
        }
        
        // 认知偏差分析
        const biasesAwareness = decision.answers['6-1'] || '';
        const biasMitigation = decision.answers['6-2'] || '';
        
        if (biasesAwareness && biasMitigation) {
          apiAnalysisPromises.push(
            analyzeCognitiveBiases(
              apiKey,
              biasesAwareness,
              biasMitigation,
              language
            ).then(result => ({ cognitiveBiases: result }))
          );
        }
        
        // 等待所有API分析完成
        const apiResultsArray = await Promise.all(apiAnalysisPromises);
        
        // 合并API结果
        apiResults = apiResultsArray.reduce((acc, result) => ({ ...acc, ...result }), {});
        
        // 整合API分析结果到评分中
        const enhancedStageScores = integrateAPIResults(stageScores, apiResults);
        
        // 更新stageScores
        Object.assign(stageScores, enhancedStageScores);
      } catch (error) {
        console.error('API评估过程中出错:', error);
        // 出错时继续使用基础评分，不中断评估流程
      }
    }
    
    // 第三步：计算总分
    const totalScore = calculateTotalScore(stageScores);
    
    // 第四步：确定评级
    const rating = getRating(totalScore);
    
    // 第五步：提取整体强项和弱项
    const { strengths, weaknesses } = extractOverallStrengthsWeaknesses(stageScores);
    
    // 第六步：生成建议
    const recommendations = generateRecommendations(rating, stageScores, decision.answers);
    
    // 返回完整评估结果
    return {
      totalScore,
      rating,
      stageScores,
      overallStrengths: strengths,
      overallWeaknesses: weaknesses,
      recommendations,
      apiEnhanced: apiAssisted
    };
  };
  
  // 同步版本的评估函数（不使用API）
  export const evaluateInvestmentDecisionSync = (
    decision: InvestmentDecision
  ): EvaluationResult => {
    // 基础评分
    const stageScores = evaluateStageScores(decision.answers);
    
    // 计算总分
    const totalScore = calculateTotalScore(stageScores);
    
    // 确定评级
    const rating = getRating(totalScore);
    
    // 提取整体强项和弱项
    const { strengths, weaknesses } = extractOverallStrengthsWeaknesses(stageScores);
    
    // 生成建议
    const recommendations = generateRecommendations(rating, stageScores, decision.answers);
    
    // 返回完整评估结果
    return {
      totalScore,
      rating,
      stageScores,
      overallStrengths: strengths,
      overallWeaknesses: weaknesses,
      recommendations,
      apiEnhanced: false
    };
  };
  
  // 验证投资决策输入
  export const validateDecisionInputs = (
    decision: InvestmentDecision
  ): string[] => {
    const errors: string[] = [];
    
    // 检查决策名称
    if (!decision.name || decision.name.trim() === '') {
      errors.push('决策名称不能为空');
    }
    
    // 检查核心字段是否存在
    const requiredAnswers = ['1-1', '1-2', '1-3', '1-4', '3-1', '3-2', '3-3', '4-1', '4-3', '4-4'];
    
    for (const questionId of requiredAnswers) {
      const answer = decision.answers[questionId];
      if (
        answer === undefined || 
        answer === null || 
        answer === '' || 
        (Array.isArray(answer) && answer.length === 0)
      ) {
        errors.push(`问题 ${questionId} 需要回答`);
      }
    }
    
    return errors;
  };