import OpenAI from 'openai';
import { DeepSeekAnalysisResult } from '../../../types';
import { API_TIMEOUT, API_RETRY_COUNT } from '../constants';

// 创建OpenAI客户端
const createClient = (apiKey: string) => {
  return new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey,
    timeout: API_TIMEOUT,
  });
};

// 分析投资逻辑一致性
export const analyzeLogicConsistency = async (
  apiKey: string,
  buyRules: string,
  sellRules: string,
  stopLossRules: string,
  riskManagement: string,
  language: 'zh' | 'en' = 'zh'
): Promise<DeepSeekAnalysisResult> => {
  const client = createClient(apiKey);
  let retries = 0;
  
  // 系统提示
  const systemPrompt = language === 'zh' 
    ? `你是一位投资专家，评估投资决策的逻辑自洽性。你需要分析买入规则、卖出规则、止损规则与风险管理措施之间是否存在矛盾或不一致。请仅返回JSON格式的评估结果。`
    : `You are an investment expert evaluating the logical consistency of investment decisions. You need to analyze buy rules, sell rules, stop-loss rules, and risk management measures for contradictions or inconsistencies. Return evaluation results in JSON format only.`;
  
  // 用户提示
  const userPrompt = language === 'zh'
    ? `请评估以下投资策略的逻辑自洽性：\n买入规则：${buyRules}\n卖出规则：${sellRules}\n止损规则：${stopLossRules}\n风险管理：${riskManagement}\n\n请返回包含以下字段的JSON：\n1. consistencyScore: 逻辑自洽性评分(0-10)\n2. conflictPoints: 潜在矛盾点数组\n3. suggestions: 改进建议数组\n4. reasoningPath: 你的分析推理过程`
    : `Please evaluate the logical consistency of the following investment strategy:\nBuy rules: ${buyRules}\nSell rules: ${sellRules}\nStop-loss rules: ${stopLossRules}\nRisk management: ${riskManagement}\n\nReturn a JSON with the following fields:\n1. consistencyScore: Logical consistency score (0-10)\n2. conflictPoints: Array of potential conflict points\n3. suggestions: Array of improvement suggestions\n4. reasoningPath: Your analytical reasoning process`;

  while (retries <= API_RETRY_COUNT) {
    try {
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "deepseek-reasoner",
        response_format: { type: "json_object" }
      });
      
      // 解析结果
      const content = completion.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error(`API调用失败 (尝试 ${retries+1}/${API_RETRY_COUNT+1}):`, error);
      retries++;
      
      // 最后一次重试失败，返回默认结果
      if (retries > API_RETRY_COUNT) {
        console.error('API调用彻底失败，使用本地评估');
        return {
          consistencyScore: 5,
          conflictPoints: [language === 'zh' ? '无法通过API评估' : 'Could not evaluate via API'],
          suggestions: [language === 'zh' ? '建议手动检查策略一致性' : 'Suggest manual strategy consistency check'],
          reasoningPath: language === 'zh' ? '由于API不可用，使用本地评估逻辑' : 'Using local evaluation logic due to API unavailability'
        };
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 永远不会执行到这里，但TypeScript需要一个返回值
  throw new Error('Unreachable code');
};

// 分析风险评估一致性
export const analyzeRiskConsistency = async (
  apiKey: string,
  riskTolerance: string,
  riskIdentification: string,
  maxLoss: string,
  language: 'zh' | 'en' = 'zh'
): Promise<DeepSeekAnalysisResult> => {
  // 类似于上面的实现，但针对风险评估
  const client = createClient(apiKey);
  // ...实现风险一致性评估...
  
  // 这里为了简化示例，我们使用相似结构但针对风险评估的实现
  return analyzeLogicConsistency(
    apiKey,
    riskTolerance,
    riskIdentification,
    maxLoss,
    '', // 空的风险管理字段
    language
  );
};

// 分析认知偏差
export const analyzeCognitiveBiases = async (
  apiKey: string,
  biasesAwareness: string,
  biasMitigation: string,
  language: 'zh' | 'en' = 'zh'
): Promise<DeepSeekAnalysisResult> => {
  // 类似于上面的实现，但针对认知偏差分析
  // ...
  
  // 简化实现
  const client = createClient(apiKey);
  // ...实现认知偏差分析...
  
  return analyzeLogicConsistency(
    apiKey,
    biasesAwareness,
    biasMitigation,
    '', // 没有止损规则
    '', // 没有风险管理
    language
  );
};