// src/components/investment-evaluation/utils/apiUtils.ts
import { DeepSeekAnalysisResult } from '../../../types';
import { API_TIMEOUT, API_RETRY_COUNT } from '../constants';

/**
 * 分析投资逻辑一致性
 * 检查买卖规则与风险管理之间的逻辑一致性
 */
export const analyzeLogicConsistency = async (
  apiKey: string,
  buyRules: string,
  sellRules: string,
  stopLossRules: string,
  riskManagement: string,
  language = 'en'
): Promise<DeepSeekAnalysisResult> => {
  try {
    const prompt = language === 'zh' 
      ? `作为投资专家，请分析以下投资策略的逻辑一致性：
      买入规则：${buyRules}
      卖出规则：${sellRules}
      止损规则：${stopLossRules}
      风险管理：${riskManagement}
      
      请评估这些规则之间的逻辑一致性，并以JSON格式返回：
      1. 一致性评分(0-100)，表示规则间的逻辑自洽程度
      2. 冲突点列表，指出规则间可能存在的矛盾
      3. 改进建议列表，针对发现的问题提出具体建议
      4. 推理路径，简要说明你的分析过程`
      : `As an investment expert, please analyze the logical consistency of the following investment strategy:
      Buy Rules: ${buyRules}
      Sell Rules: ${sellRules}
      Stop Loss Rules: ${stopLossRules}
      Risk Management: ${riskManagement}
      
      Please evaluate the logical consistency between these rules and return in JSON format:
      1. Consistency score (0-100) indicating the logical coherence between rules
      2. List of conflict points, highlighting potential contradictions
      3. List of improvement suggestions for the identified issues
      4. Reasoning path briefly explaining your analysis process`;
    
    // 调用DeepSeek API
    const response = await fetchWithRetry('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an investment expert analyzing investment strategies. Respond only in JSON format.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 检测并移除Markdown代码块标记
    let jsonContent = content;
    // 移除开头的```json或```等标记
    if (jsonContent.startsWith('```')) {
      const firstLineEnd = jsonContent.indexOf('\n');
      if (firstLineEnd !== -1) {
        jsonContent = jsonContent.substring(firstLineEnd + 1);
      }
    }
    // 移除结尾的```标记
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.substring(0, jsonContent.lastIndexOf('```'));
    }
    // 移除结尾的可能存在的换行符
    jsonContent = jsonContent.trim();
    
    console.log('处理后的JSON内容:', jsonContent);
    const result = JSON.parse(jsonContent);
    
    return {
      consistencyScore: result.consistency_score || result.consistencyScore,
      conflictPoints: result.conflict_points || result.conflictPoints || [],
      suggestions: result.improvement_suggestions || result.suggestions || [],
      reasoningPath: result.reasoning_path || result.reasoningPath
    };
  } catch (error) {
    console.error('Logic consistency analysis failed:', error);
    // 返回降级结果
    return fallbackLogicAnalysis(buyRules, sellRules, stopLossRules, riskManagement);
  }
};

/**
 * 分析风险一致性
 * 检查风险承受能力与风险管理措施的匹配度
 */
export const analyzeRiskConsistency = async (
  apiKey: string,
  riskTolerance: string,
  riskIdentification: string,
  maxLoss: string,
  language = 'en'
): Promise<DeepSeekAnalysisResult> => {
  try {
    const prompt = language === 'zh'
      ? `作为风险管理专家，请分析以下投资风险管理的一致性：
      风险承受能力：${riskTolerance}
      风险识别：${riskIdentification}
      最大可接受损失：${maxLoss}
      
      请评估风险承受能力与风险管理措施的匹配度，并以JSON格式返回：
      1. 一致性评分(0-100)，表示风险承受能力与风险管理措施的匹配程度
      2. 冲突点列表，指出可能存在的不匹配之处
      3. 改进建议列表，针对发现的问题提出具体建议
      4. 推理路径，简要说明你的分析过程`
      : `As a risk management expert, please analyze the consistency of the following investment risk management:
      Risk Tolerance: ${riskTolerance}
      Risk Identification: ${riskIdentification}
      Maximum Acceptable Loss: ${maxLoss}
      
      Please evaluate the match between risk tolerance and risk management measures, and return in JSON format:
      1. Consistency score (0-100) indicating the match between risk tolerance and risk management measures
      2. List of conflict points, highlighting potential mismatches
      3. List of improvement suggestions for the identified issues
      4. Reasoning path briefly explaining your analysis process`;
    
    // 调用DeepSeek API
    const response = await fetchWithRetry('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a risk management expert analyzing investment strategies. Respond only in JSON format.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 检测并移除Markdown代码块标记
    let jsonContent = content;
    // 移除开头的```json或```等标记
    if (jsonContent.startsWith('```')) {
      const firstLineEnd = jsonContent.indexOf('\n');
      if (firstLineEnd !== -1) {
        jsonContent = jsonContent.substring(firstLineEnd + 1);
      }
    }
    // 移除结尾的```标记
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.substring(0, jsonContent.lastIndexOf('```'));
    }
    // 移除结尾的可能存在的换行符
    jsonContent = jsonContent.trim();
    
    console.log('处理后的JSON内容:', jsonContent);
    const result = JSON.parse(jsonContent);
    
    return {
      consistencyScore: result.consistency_score || result.consistencyScore,
      conflictPoints: result.conflict_points || result.conflictPoints || [],
      suggestions: result.improvement_suggestions || result.suggestions || [],
      reasoningPath: result.reasoning_path || result.reasoningPath
    };
  } catch (error) {
    console.error('Risk consistency analysis failed:', error);
    // 返回降级结果
    return fallbackRiskAnalysis(riskTolerance, riskIdentification, maxLoss);
  }
};

/**
 * 分析认知偏差
 * 检查用户对认知偏差的认识和缓解措施
 */
export const analyzeCognitiveBiases = async (
  apiKey: string,
  biasesAwareness: string,
  biasMitigation: string,
  language = 'en'
): Promise<DeepSeekAnalysisResult> => {
  try {
    const prompt = language === 'zh'
      ? `作为行为金融学专家，请分析以下投资者对认知偏差的认识和应对措施：
      认知偏差认识：${biasesAwareness}
      偏差缓解措施：${biasMitigation}
      
      请评估投资者对认知偏差的认识和缓解措施的有效性，并以JSON格式返回：
      1. 有效性评分(0-100)，表示对认知偏差的认识和缓解措施的有效程度
      2. 潜在问题列表，指出可能存在的认知盲点
      3. 改进建议列表，针对发现的问题提出具体建议
      4. 推理路径，简要说明你的分析过程`
      : `As a behavioral finance expert, please analyze the following investor's awareness and mitigation measures for cognitive biases:
      Cognitive Bias Awareness: ${biasesAwareness}
      Bias Mitigation Measures: ${biasMitigation}
      
      Please evaluate the effectiveness of the investor's awareness and mitigation measures for cognitive biases, and return in JSON format:
      1. Effectiveness score (0-100) indicating the effectiveness of bias awareness and mitigation measures
      2. List of potential issues, highlighting possible cognitive blind spots
      3. List of improvement suggestions for the identified issues
      4. Reasoning path briefly explaining your analysis process`;
    
    // 调用DeepSeek API
    const response = await fetchWithRetry('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a behavioral finance expert analyzing cognitive biases. Respond only in JSON format.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 检测并移除Markdown代码块标记
    let jsonContent = content;
    // 移除开头的```json或```等标记
    if (jsonContent.startsWith('```')) {
      const firstLineEnd = jsonContent.indexOf('\n');
      if (firstLineEnd !== -1) {
        jsonContent = jsonContent.substring(firstLineEnd + 1);
      }
    }
    // 移除结尾的```标记
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.substring(0, jsonContent.lastIndexOf('```'));
    }
    // 移除结尾的可能存在的换行符
    jsonContent = jsonContent.trim();
    
    console.log('处理后的JSON内容:', jsonContent);
    const result = JSON.parse(jsonContent);
    
    return {
      consistencyScore: result.effectiveness_score || result.consistencyScore,
      conflictPoints: result.potential_issues || result.conflictPoints || [],
      suggestions: result.improvement_suggestions || result.suggestions || [],
      reasoningPath: result.reasoning_path || result.reasoningPath
    };
  } catch (error) {
    console.error('Cognitive bias analysis failed:', error);
    // 返回降级结果
    return fallbackBiasAnalysis(biasesAwareness, biasMitigation);
  }
};

// 辅助函数：带重试的fetch
async function fetchWithRetry(url: string, options: RequestInit, retries = API_RETRY_COUNT): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying API call, ${retries} attempts left`);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

 // 降级分析函数 - 逻辑一致性
export function fallbackLogicAnalysis(
  buyRules: string,
  sellRules: string,
  stopLossRules: string,
  riskManagement: string,
  language: 'zh' | 'en' = 'zh'
): DeepSeekAnalysisResult {
  // 简单的规则检查
  const hasNumericBuyRules = /\d+%|\d+\.\d+/.test(buyRules);
  const hasNumericSellRules = /\d+%|\d+\.\d+/.test(sellRules);
  const hasNumericStopLoss = /\d+%|\d+\.\d+/.test(stopLossRules);
  const hasRiskMitigation = /(对冲|分散|止损|hedge|diversif|stop[ -]loss)/i.test(riskManagement);
  
  // 计算基础分数
  let score = 60; // 基础分
  if (hasNumericBuyRules) score += 10;
  if (hasNumericSellRules) score += 10;
  if (hasNumericStopLoss) score += 10;
  if (hasRiskMitigation) score += 10;
  
  // 确保分数在0-100范围内
  score = Math.max(0, Math.min(100, score));
  
  // 生成冲突点和建议
  const conflictPoints = [];
  const suggestions = [];
  
  if (!hasNumericBuyRules) {
    conflictPoints.push(language === 'zh' ? '买入规则缺乏具体数值标准' : 'Buy rules lack specific numerical standards');
    suggestions.push(language === 'zh' ? '为买入规则添加具体的数值标准，如PE比率、价格阈值等' : 'Add specific numerical standards to buy rules, such as PE ratio, price thresholds, etc.');
  }
  
  if (!hasNumericSellRules) {
    conflictPoints.push(language === 'zh' ? '卖出规则缺乏具体数值标准' : 'Sell rules lack specific numerical standards');
    suggestions.push(language === 'zh' ? '为卖出规则添加具体的数值标准，如目标价格、止盈比例等' : 'Add specific numerical standards to sell rules, such as target prices, profit-taking percentages, etc.');
  }
  
  if (!hasNumericStopLoss) {
    conflictPoints.push(language === 'zh' ? '止损规则缺乏具体数值标准' : 'Stop-loss rules lack specific numerical standards');
    suggestions.push(language === 'zh' ? '为止损规则添加具体的数值标准，如最大损失比例等' : 'Add specific numerical standards to stop-loss rules, such as maximum loss percentage, etc.');
  }
  
  if (!hasRiskMitigation) {
    conflictPoints.push(language === 'zh' ? '风险管理措施不足' : 'Insufficient risk management measures');
    suggestions.push(language === 'zh' ? '添加具体的风险缓解措施，如资产分散、对冲策略等' : 'Add specific risk mitigation measures, such as asset diversification, hedging strategies, etc.');
  }
  
  return {
    consistencyScore: score / 10, // 转换为0-10分制
    conflictPoints,
    suggestions,
    reasoningPath: language === 'zh' ? '基于规则的明确性和量化程度进行评估，量化的规则更有助于保持投资纪律性' : 'Evaluation based on the clarity and quantification of rules, quantified rules are more conducive to maintaining investment discipline'
  };
}

// 降级分析函数 - 风险一致性
export function fallbackRiskAnalysis(
  riskTolerance: string,
  riskIdentification: string,
  maxLoss: string,
  language: 'zh' | 'en' = 'zh'
): DeepSeekAnalysisResult {
  // 简单的规则检查
  const hasNumericRiskTolerance = /\d+%|\d+\.\d+/.test(riskTolerance);
  const hasDetailedRiskIdentification = riskIdentification.length > 30;
  const hasNumericMaxLoss = /\d+%|\d+\.\d+/.test(maxLoss);
  
  // 计算基础分数
  let score = 60; // 基础分
  if (hasNumericRiskTolerance) score += 10;
  if (hasDetailedRiskIdentification) score += 15;
  if (hasNumericMaxLoss) score += 15;
  
  // 确保分数在0-100范围内
  score = Math.max(0, Math.min(100, score));
  
  // 生成冲突点和建议
  const conflictPoints = [];
  const suggestions = [];
  
  if (!hasNumericRiskTolerance) {
    conflictPoints.push(language === 'zh' ? '风险承受能力描述不够具体' : 'Risk tolerance description is not specific enough');
    suggestions.push(language === 'zh' ? '量化风险承受能力，如可接受的最大回撤比例或波动率' : 'Quantify risk tolerance, such as acceptable maximum drawdown percentage or volatility');
  }
  
  if (!hasDetailedRiskIdentification) {
    conflictPoints.push(language === 'zh' ? '风险识别不够全面' : 'Risk identification is not comprehensive');
    suggestions.push(language === 'zh' ? '详细列出可能面临的市场风险、流动性风险、政策风险等' : 'List in detail the potential market risks, liquidity risks, policy risks, etc.');
  }
  
  if (!hasNumericMaxLoss) {
    conflictPoints.push(language === 'zh' ? '最大可接受损失未量化' : 'Maximum acceptable loss is not quantified');
    suggestions.push(language === 'zh' ? '明确设定最大可接受损失的具体比例或金额' : 'Clearly set a specific percentage or amount for the maximum acceptable loss');
  }
  
  return {
    consistencyScore: score / 10, // 转换为0-10分制
    conflictPoints,
    suggestions,
    reasoningPath: language === 'zh' ? '基于风险描述的具体性和量化程度进行评估，明确的风险界定有助于制定匹配的风险管理策略' : 'Evaluation based on the specificity and quantification of risk descriptions, clear risk definitions help formulate matching risk management strategies'
  };
}

// 降级分析函数 - 认知偏差
export function fallbackBiasAnalysis(
  biasesAwareness: string,
  biasMitigation: string,
  language: 'zh' | 'en' = 'zh'
): DeepSeekAnalysisResult {
  // 简单的规则检查
  const mentionsBiasTypes = /(锚定|过度自信|确认偏误|损失厌恶|羊群效应|anchoring|overconfidence|confirmation|loss aversion|herding)/i.test(biasesAwareness);
  const hasMitigationMeasures = biasMitigation.length > 30;
  const hasSpecificMeasures = /(规则|机械化|第三方|反向思考|rules|mechanical|third party|contrarian)/i.test(biasMitigation);
  
  // 计算基础分数
  let score = 60; // 基础分
  if (mentionsBiasTypes) score += 15;
  if (hasMitigationMeasures) score += 10;
  if (hasSpecificMeasures) score += 15;
  
  // 确保分数在0-100范围内
  score = Math.max(0, Math.min(100, score));
  
  // 生成冲突点和建议
  const conflictPoints = [];
  const suggestions = [];
  
  if (!mentionsBiasTypes) {
    conflictPoints.push(language === 'zh' ? '未明确识别具体的认知偏差类型' : 'Specific types of cognitive biases not clearly identified');
    suggestions.push(language === 'zh' ? '列出可能影响决策的主要认知偏差，如锚定效应、过度自信、确认偏误等' : 'List the main cognitive biases that may affect decision-making, such as anchoring effect, overconfidence, confirmation bias, etc.');
  }
  
  if (!hasMitigationMeasures) {
    conflictPoints.push(language === 'zh' ? '缺乏详细的偏差缓解措施' : 'Lack of detailed bias mitigation measures');
    suggestions.push(language === 'zh' ? '详细描述如何应对每种认知偏差的具体措施' : 'Describe in detail specific measures to address each cognitive bias');
  }
  
  if (!hasSpecificMeasures) {
    conflictPoints.push(language === 'zh' ? '缓解措施缺乏可操作性' : 'Mitigation measures lack operability');
    suggestions.push(language === 'zh' ? '添加具体可执行的措施，如设置机械化交易规则、引入第三方审核等' : 'Add specific executable measures, such as setting up mechanical trading rules, introducing third-party reviews, etc.');
  }
  
  return {
    consistencyScore: score / 10, // 转换为0-10分制
    conflictPoints,
    suggestions,
    reasoningPath: language === 'zh' ? '基于对认知偏差的认识深度和缓解措施的具体性进行评估，具体可操作的措施更有效' : 'Evaluation based on the depth of understanding of cognitive biases and the specificity of mitigation measures, specific operable measures are more effective'
  };
}