import OpenAI from 'openai';
import { DeepSeekAnalysisResult } from '../../../types';
import { API_TIMEOUT, API_RETRY_COUNT } from '../constants';
import { fallbackLogicAnalysis, fallbackRiskAnalysis, fallbackBiasAnalysis } from '../utils/apiUtils';

// 创建OpenAI客户端
const createClient = (apiKey: string) => {
  return new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey,
    timeout: API_TIMEOUT,
    dangerouslyAllowBrowser: true, // 允许在浏览器环境中使用OpenAI客户端
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
  console.log(`[${new Date().toISOString()}] 开始调用analyzeLogicConsistency API`);
  console.log(`API参数: apiKey=${apiKey ? '已提供' : '未提供'}, language=${language}`);
  console.log(`买入规则: ${buyRules.substring(0, 50)}${buyRules.length > 50 ? '...' : ''}`);
  console.log(`卖出规则: ${sellRules.substring(0, 50)}${sellRules.length > 50 ? '...' : ''}`);
  console.log(`止损规则: ${stopLossRules.substring(0, 50)}${stopLossRules.length > 50 ? '...' : ''}`);
  console.log(`风险管理: ${riskManagement.substring(0, 50)}${riskManagement.length > 50 ? '...' : ''}`);
  
  const client = createClient(apiKey);
  let retries = 0;
  
  // 系统提示
  const systemPrompt = language === 'zh' 
    ? `你是一位投资专家，评估投资决策的逻辑自洽性。你需要分析买入规则、卖出规则、止损规则与风险管理措施之间是否存在矛盾或不一致。请仅返回JSON格式的评估结果。`
    : `You are an investment expert evaluating the logical consistency of investment decisions. You need to analyze buy rules, sell rules, stop-loss rules, and risk management measures for contradictions or inconsistencies. Return evaluation results in JSON format only.`;
  
  // 用户提示
  const userPrompt = language === 'zh'
    ? `请评估以下投资策略的逻辑自洽性：
      买入规则：${buyRules}
      卖出规则：${sellRules}
      止损规则：${stopLossRules}
      风险管理：${riskManagement}
      
      请返回包含以下字段的JSON：
      1. consistencyScore: 逻辑自洽性评分(0-10)
      2. conflictPoints: 潜在矛盾点数组
      3. suggestions: 改进建议数组
      4. reasoningPath: 你的分析推理过程`
    : `Please evaluate the logical consistency of the following investment strategy:
      Buy rules: ${buyRules}
      Sell rules: ${sellRules}
      Stop-loss rules: ${stopLossRules}
      Risk management: ${riskManagement}
      
      Return a JSON with the following fields:
      1. consistencyScore: Logical consistency score (0-10)
      2. conflictPoints: Array of potential conflict points
      3. suggestions: Array of improvement suggestions
      4. reasoningPath: Your analytical reasoning process`;
  
  console.log(`[${new Date().toISOString()}] 准备发送API请求，系统提示长度: ${systemPrompt.length}, 用户提示长度: ${userPrompt.length}`);

  while (retries <= API_RETRY_COUNT) {
    try {
      console.log(`[${new Date().toISOString()}] 发送analyzeLogicConsistency API请求 (尝试 ${retries+1}/${API_RETRY_COUNT+1})`);
      console.log(`请求模型: deepseek-chat`);
      
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "deepseek-chat"
      });
      
      // 解析结果
      const content = completion.choices[0].message.content;
      console.log(`[${new Date().toISOString()}] analyzeLogicConsistency API请求成功!`);
      console.log('API返回完整结果:', completion);
      console.log('API返回内容:', content);
      
      try {
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
        
        console.log(`[${new Date().toISOString()}] 处理后的JSON内容:`, jsonContent);
        const parsedResult = JSON.parse(jsonContent);
        console.log(`[${new Date().toISOString()}] 成功解析JSON结果:`, parsedResult);
        return parsedResult;
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] JSON解析失败:`, parseError);
        console.error('无法解析的内容:', content);
        throw new Error('API返回的内容不是有效的JSON');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] API调用失败 (尝试 ${retries+1}/${API_RETRY_COUNT+1}):`, error);
      console.error('错误详情:', error.message);
      if (error.response) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      }
      
      retries++;
      
      // 最后一次重试失败，使用本地评估逻辑
      if (retries > API_RETRY_COUNT) {
        console.error(`[${new Date().toISOString()}] API调用彻底失败，使用本地评估`);
        return fallbackLogicAnalysis(buyRules, sellRules, stopLossRules, riskManagement, language);
      }
      
      // 等待后重试
      console.log(`[${new Date().toISOString()}] 等待1秒后重试...`);
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
  console.log(`[${new Date().toISOString()}] 开始调用analyzeRiskConsistency API`);
  console.log(`API参数: apiKey=${apiKey ? '已提供' : '未提供'}, language=${language}`);
  console.log(`风险承受能力: ${riskTolerance.substring(0, 50)}${riskTolerance.length > 50 ? '...' : ''}`);
  console.log(`风险识别: ${riskIdentification.substring(0, 50)}${riskIdentification.length > 50 ? '...' : ''}`);
  console.log(`最大损失容忍度: ${maxLoss.substring(0, 50)}${maxLoss.length > 50 ? '...' : ''}`);
  
  const client = createClient(apiKey);
  let retries = 0;
  
  // 系统提示
  const systemPrompt = language === 'zh' 
    ? `你是一位投资风险专家，评估投资决策的风险一致性。你需要分析风险承受能力、风险识别和最大损失容忍度之间是否存在矛盾或不一致。请仅返回JSON格式的评估结果。`
    : `You are an investment risk expert evaluating the risk consistency of investment decisions. You need to analyze risk tolerance, risk identification, and maximum loss tolerance for contradictions or inconsistencies. Return evaluation results in JSON format only.`;
  
  // 用户提示
  const userPrompt = language === 'zh'
    ? `请评估以下投资策略的风险一致性：
      风险承受能力：${riskTolerance}
      风险识别：${riskIdentification}
      最大损失容忍度：${maxLoss}
      
      请返回包含以下字段的JSON：
      1. consistencyScore: 风险一致性评分(0-10)
      2. conflictPoints: 潜在矛盾点数组
      3. suggestions: 改进建议数组
      4. reasoningPath: 你的分析推理过程`
    : `Please evaluate the risk consistency of the following investment strategy:
      Risk tolerance: ${riskTolerance}
      Risk identification: ${riskIdentification}
      Maximum loss tolerance: ${maxLoss}
      
      Return a JSON with the following fields:
      1. consistencyScore: Risk consistency score (0-10)
      2. conflictPoints: Array of potential conflict points
      3. suggestions: Array of improvement suggestions
      4. reasoningPath: Your analytical reasoning process`;
  
  console.log(`[${new Date().toISOString()}] 准备发送API请求，系统提示长度: ${systemPrompt.length}, 用户提示长度: ${userPrompt.length}`);

  while (retries <= API_RETRY_COUNT) {
    try {
      console.log(`[${new Date().toISOString()}] 发送analyzeRiskConsistency API请求 (尝试 ${retries+1}/${API_RETRY_COUNT+1})`);
      console.log(`请求模型: deepseek-chat`);
      
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "deepseek-chat"
      });
      
      console.log(`[${new Date().toISOString()}] analyzeRiskConsistency API请求成功!`);
      console.log('API返回完整结果:', completion);
      
      // 解析结果
      const content = completion.choices[0].message.content;
      console.log('API返回内容:', content);
      
      try {
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
        
        console.log(`[${new Date().toISOString()}] 处理后的JSON内容:`, jsonContent);
        const parsedResult = JSON.parse(jsonContent);
        console.log(`[${new Date().toISOString()}] 成功解析JSON结果:`, parsedResult);
        return parsedResult;
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] JSON解析失败:`, parseError);
        console.error('无法解析的内容:', content);
        throw new Error('API返回的内容不是有效的JSON');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] API调用失败 (尝试 ${retries+1}/${API_RETRY_COUNT+1}):`, error);
      console.error('错误详情:', error.message);
      if (error.response) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      }
      
      retries++;
      
      // 最后一次重试失败，使用本地评估逻辑
      if (retries > API_RETRY_COUNT) {
        console.error(`[${new Date().toISOString()}] API调用彻底失败，使用本地评估`);
        return fallbackRiskAnalysis(riskTolerance, riskIdentification, maxLoss, language);
      }
      
      // 等待后重试
      console.log(`[${new Date().toISOString()}] 等待1秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 永远不会执行到这里，但TypeScript需要一个返回值
  throw new Error('Unreachable code');
};

// 分析认知偏差
export const analyzeCognitiveBiases = async (
  apiKey: string,
  biasesAwareness: string,
  biasMitigation: string,
  language: 'zh' | 'en' = 'zh'
): Promise<DeepSeekAnalysisResult> => {
  console.log(`[${new Date().toISOString()}] 开始调用analyzeCognitiveBiases API`);
  console.log(`API参数: apiKey=${apiKey ? '已提供' : '未提供'}, language=${language}`);
  console.log(`认知偏差意识: ${biasesAwareness.substring(0, 50)}${biasesAwareness.length > 50 ? '...' : ''}`);
  console.log(`偏差缓解措施: ${biasMitigation.substring(0, 50)}${biasMitigation.length > 50 ? '...' : ''}`);
  
  const client = createClient(apiKey);
  let retries = 0;
  
  // 系统提示
  const systemPrompt = language === 'zh' 
    ? `你是一位投资心理学专家，评估投资决策中的认知偏差。你需要分析投资者对自身认知偏差的认识程度以及为减轻这些偏差所采取的措施是否充分有效。请仅返回JSON格式的评估结果。`
    : `You are an investment psychology expert evaluating cognitive biases in investment decisions. You need to analyze the investor's awareness of their cognitive biases and the effectiveness of measures taken to mitigate these biases. Return evaluation results in JSON format only.`;
  
  // 用户提示
  const userPrompt = language === 'zh'
    ? `请评估以下投资者的认知偏差管理：
      认知偏差意识：${biasesAwareness}
      偏差缓解措施：${biasMitigation}
      
      请返回包含以下字段的JSON：
      1. consistencyScore: 认知偏差管理评分(0-10)
      2. conflictPoints: 潜在认知偏差问题数组
      3. suggestions: 改进建议数组
      4. reasoningPath: 你的分析推理过程`
    : `Please evaluate the following investor's cognitive bias management:
      Cognitive bias awareness: ${biasesAwareness}
      Bias mitigation measures: ${biasMitigation}
      
      Return a JSON with the following fields:
      1. consistencyScore: Cognitive bias management score (0-10)
      2. conflictPoints: Array of potential cognitive bias issues
      3. suggestions: Array of improvement suggestions
      4. reasoningPath: Your analytical reasoning process`;
  
  console.log(`[${new Date().toISOString()}] 准备发送API请求，系统提示长度: ${systemPrompt.length}, 用户提示长度: ${userPrompt.length}`);

  while (retries <= API_RETRY_COUNT) {
    try {
      console.log(`[${new Date().toISOString()}] 发送analyzeCognitiveBiases API请求 (尝试 ${retries+1}/${API_RETRY_COUNT+1})`);
      console.log(`请求模型: deepseek-chat`);
      
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "deepseek-chat"
      });
      
      console.log(`[${new Date().toISOString()}] analyzeCognitiveBiases API请求成功!`);
      console.log('API返回完整结果:', completion);
      
      // 解析结果
      const content = completion.choices[0].message.content;
      console.log('API返回内容:', content);
      
      try {
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
        
        console.log(`[${new Date().toISOString()}] 处理后的JSON内容:`, jsonContent);
        const parsedResult = JSON.parse(jsonContent);
        console.log(`[${new Date().toISOString()}] 成功解析JSON结果:`, parsedResult);
        return parsedResult;
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] JSON解析失败:`, parseError);
        console.error('无法解析的内容:', content);
        throw new Error('API返回的内容不是有效的JSON');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] API调用失败 (尝试 ${retries+1}/${API_RETRY_COUNT+1}):`, error);
      console.error('错误详情:', error.message);
      if (error.response) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      }
      
      retries++;
      
      // 最后一次重试失败，使用本地评估逻辑
      if (retries > API_RETRY_COUNT) {
        console.error(`[${new Date().toISOString()}] API调用彻底失败，使用本地评估`);
        return fallbackBiasAnalysis(biasesAwareness, biasMitigation, language);
      }
      
      // 等待后重试
      console.log(`[${new Date().toISOString()}] 等待1秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 永远不会执行到这里，但TypeScript需要一个返回值
  throw new Error('Unreachable code');
};

// 使用从apiUtils.ts导入的fallback函数