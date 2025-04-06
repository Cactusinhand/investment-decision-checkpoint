import OpenAI from 'openai';
import { DeepSeekAnalysisResult } from '../../../types';
import { API_TIMEOUT, API_RETRY_COUNT } from '../constants';
import { fallbackLogicAnalysis, fallbackRiskAnalysis, fallbackBiasAnalysis } from '../utils/apiUtils';

/**
 * @fileoverview Functions for interacting with the DeepSeek API to enhance investment decision evaluation.
 * Provides analysis for logic consistency, risk consistency, and cognitive biases.
 * Includes retry logic and fallbacks to local analysis if API calls fail.
 */

/**
 * Creates an OpenAI client instance configured for the DeepSeek API.
 * @param apiKey - The user's DeepSeek API key.
 * @returns An configured OpenAI client instance.
 */
const createClient = (apiKey: string): OpenAI => {
  return new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey,
    timeout: API_TIMEOUT,
    dangerouslyAllowBrowser: true, // Necessary for client-side usage
  });
};

/**
 * Analyzes the logical consistency between buy, sell, stop-loss rules, and risk management strategies.
 * Uses the DeepSeek API with retry logic and falls back to local analysis on failure.
 *
 * @param args - Arguments for logic consistency analysis.
 * @param args.buyRules - The user's defined buy rules.
 * @param args.sellProfitRules - The user's defined rules for taking profit.
 * @param args.sellLossRules - The user's defined rules for cutting losses (stop-loss).
 * @param args.riskMgmtSummary - A summary of the user's risk management plan.
 * @param apiKey - The DeepSeek API key.
 * @param language - The language for the API prompt ('zh' or 'en').
 * @returns A promise resolving to the analysis result.
 */
export const analyzeLogicConsistency = async (
  args: { buyRules: string; sellProfitRules: string; sellLossRules: string; riskMgmtSummary: string },
  apiKey: string,
  language: 'zh' | 'en' = 'zh'
): Promise<DeepSeekAnalysisResult> => {
  // Destructure args at the beginning for clarity and easier use in fallbacks
  const { buyRules, sellProfitRules, sellLossRules, riskMgmtSummary } = args;
  console.log(`[${new Date().toISOString()}] Calling analyzeLogicConsistency API`);
  console.log(`API Params: apiKey=${apiKey ? 'Provided' : 'Not Provided'}, language=${language}`);
  console.log(`Buy Rules: ${buyRules.substring(0, 50)}${buyRules.length > 50 ? '...' : ''}`);
  console.log(`Sell Profit Rules: ${sellProfitRules.substring(0, 50)}${sellProfitRules.length > 50 ? '...' : ''}`);
  console.log(`Stop Loss Rules: ${sellLossRules.substring(0, 50)}${sellLossRules.length > 50 ? '...' : ''}`);
  console.log(`Risk Management: ${riskMgmtSummary.substring(0, 50)}${riskMgmtSummary.length > 50 ? '...' : ''}`);

  const client = createClient(apiKey);
  let retries = 0;

  const systemPrompt = language === 'zh'
    ? `你是一位投资策略分析师。评估投资决策的买入、卖出（止盈）、止损规则与风险管理策略之间的逻辑一致性。请仅返回JSON格式。`
    : `You are an investment strategy analyst. Evaluate the logical consistency between buy rules, sell (profit-taking) rules, stop-loss rules, and the risk management strategy. Return results in JSON format only.`;

  const userPrompt = language === 'zh'
    ? `评估以下策略的逻辑一致性：
      买入规则：${buyRules}
      止盈规则：${sellProfitRules}
      止损规则：${sellLossRules}
      风险管理摘要：${riskMgmtSummary}

      返回JSON对象，包含字段：consistencyScore (0-10 分数), conflictPoints (string[] 矛盾点), suggestions (string[] 建议), reasoningPath (string 分析过程)`
    : `Evaluate the logical consistency of the following strategy:
      Buy rules: ${buyRules}
      Profit-taking rules: ${sellProfitRules}
      Stop-loss rules: ${sellLossRules}
      Risk management summary: ${riskMgmtSummary}

      Return a JSON object with fields: consistencyScore (0-10 score), conflictPoints (string[] conflicts), suggestions (string[] suggestions), reasoningPath (string analysis process)`;

  console.log(`[${new Date().toISOString()}] Sending API request. System prompt length: ${systemPrompt.length}, User prompt length: ${userPrompt.length}`);

  while (retries <= API_RETRY_COUNT) {
    try {
      console.log(`[${new Date().toISOString()}] Sending analyzeLogicConsistency request (Attempt ${retries + 1}/${API_RETRY_COUNT + 1})`);
      console.log(`Model: deepseek-chat`);

      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "deepseek-chat",
        response_format: { type: "json_object" } // Request JSON output
      });

      const content = completion.choices[0].message.content;
      console.log(`[${new Date().toISOString()}] analyzeLogicConsistency request successful!`);
      console.log('API Raw Response:', completion);
      console.log('API Content:', content);

      if (!content) {
         throw new Error('API returned empty content.');
      }

      try {
        // JSON mode should return valid JSON directly
        const parsedResult = JSON.parse(content);
        console.log(`[${new Date().toISOString()}] Successfully parsed JSON result:`, parsedResult);
        // Basic validation of expected fields
        if (typeof parsedResult.consistencyScore !== 'number' || !Array.isArray(parsedResult.conflictPoints) || !Array.isArray(parsedResult.suggestions)) {
            console.warn("API response missing expected fields, using fallback structure.");
            // Use destructured args for fallback call
            return fallbackLogicAnalysis(buyRules, sellProfitRules, sellLossRules, riskMgmtSummary, language);
        }
        return parsedResult;
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] JSON parsing failed:`, parseError);
        console.error('Content that failed parsing:', content);
        // If parsing fails even in JSON mode, use fallback
        console.warn('API response was not valid JSON despite requesting JSON format, using fallback.');
        // Use destructured args for fallback call
        return fallbackLogicAnalysis(buyRules, sellProfitRules, sellLossRules, riskMgmtSummary, language);
      }
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] API call failed (Attempt ${retries + 1}/${API_RETRY_COUNT + 1}):`, error);
      if (error.response) {
        console.error('API Response Status:', error.response.status);
        console.error('API Response Data:', error.response.data);
      }

      retries++;

      if (retries > API_RETRY_COUNT) {
        console.error(`[${new Date().toISOString()}] API call failed after all retries. Using fallback logic.`);
        // Use destructured args for fallback call
        return fallbackLogicAnalysis(buyRules, sellProfitRules, sellLossRules, riskMgmtSummary, language);
      }

      console.log(`[${new Date().toISOString()}] Waiting 1 second before retry...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  // Should be unreachable due to fallback logic, but satisfies TypeScript
  console.error(`[${new Date().toISOString()}] Reached theoretically unreachable code in analyzeLogicConsistency. Using fallback.`);
  // Use destructured args for fallback call
  return fallbackLogicAnalysis(buyRules, sellProfitRules, sellLossRules, riskMgmtSummary, language);
};

/**
 * Analyzes the consistency between stated risk tolerance, identified risks, and maximum acceptable loss.
 * Uses the DeepSeek API with retry logic and falls back to local analysis on failure.
 *
 * @param args - Arguments for risk consistency analysis.
 * @param args.riskTolerance - The user's stated risk tolerance level.
 * @param args.riskIdentification - The risks identified by the user.
 * @param args.maxLoss - The maximum loss the user is willing to accept.
 * @param apiKey - The DeepSeek API key.
 * @param language - The language for the API prompt ('zh' or 'en').
 * @returns A promise resolving to the analysis result.
 */
export const analyzeRiskConsistency = async (
  args: { riskTolerance: string; riskIdentification: string; maxLoss: string },
  apiKey: string,
  language: 'zh' | 'en' = 'zh'
): Promise<DeepSeekAnalysisResult> => {
  // Destructure args at the beginning
  const { riskTolerance, riskIdentification, maxLoss } = args;
  console.log(`[${new Date().toISOString()}] Calling analyzeRiskConsistency API`);
  console.log(`API Params: apiKey=${apiKey ? 'Provided' : 'Not Provided'}, language=${language}`);
  console.log(`Risk Tolerance: ${riskTolerance.substring(0, 50)}${riskTolerance.length > 50 ? '...' : ''}`);
  console.log(`Risk Identification: ${riskIdentification.substring(0, 50)}${riskIdentification.length > 50 ? '...' : ''}`);
  console.log(`Max Loss Tolerance: ${maxLoss.substring(0, 50)}${maxLoss.length > 50 ? '...' : ''}`);

  const client = createClient(apiKey);
  let retries = 0;

  const systemPrompt = language === 'zh'
    ? `你是一位投资风险管理专家。评估用户的风险承受能力、识别的风险以及最大可接受损失之间的一致性。请仅返回JSON格式。`
    : `You are an investment risk management expert. Evaluate the consistency between the user's risk tolerance, identified risks, and maximum acceptable loss. Return results in JSON format only.`;

  const userPrompt = language === 'zh'
    ? `评估以下风险相关信息的一致性：
      风险承受能力：${riskTolerance}
      已识别风险：${riskIdentification}
      最大可接受损失：${maxLoss}

      返回JSON对象，包含字段：consistencyScore (0-10 分数), conflictPoints (string[] 矛盾点), suggestions (string[] 建议), reasoningPath (string 分析过程)`
    : `Evaluate the consistency of the following risk-related information:
      Risk Tolerance: ${riskTolerance}
      Identified Risks: ${riskIdentification}
      Maximum Acceptable Loss: ${maxLoss}

      Return a JSON object with fields: consistencyScore (0-10 score), conflictPoints (string[] conflicts), suggestions (string[] suggestions), reasoningPath (string analysis process)`;

  console.log(`[${new Date().toISOString()}] Sending API request. System prompt length: ${systemPrompt.length}, User prompt length: ${userPrompt.length}`);

  while (retries <= API_RETRY_COUNT) {
    try {
      console.log(`[${new Date().toISOString()}] Sending analyzeRiskConsistency request (Attempt ${retries + 1}/${API_RETRY_COUNT + 1})`);
      console.log(`Model: deepseek-chat`);

      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "deepseek-chat",
        response_format: { type: "json_object" } // Request JSON output
      });

      const content = completion.choices[0].message.content;
      console.log(`[${new Date().toISOString()}] analyzeRiskConsistency request successful!`);
      console.log('API Raw Response:', completion);
      console.log('API Content:', content);

       if (!content) {
         throw new Error('API returned empty content.');
      }

      try {
        const parsedResult = JSON.parse(content);
        console.log(`[${new Date().toISOString()}] Successfully parsed JSON result:`, parsedResult);
        // Basic validation
        if (typeof parsedResult.consistencyScore !== 'number' || !Array.isArray(parsedResult.conflictPoints) || !Array.isArray(parsedResult.suggestions)) {
            console.warn("API response missing expected fields, using fallback structure.");
            // Use destructured args for fallback call
            return fallbackRiskAnalysis(riskTolerance, riskIdentification, maxLoss, language);
        }
        return parsedResult;
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] JSON parsing failed:`, parseError);
        console.error('Content that failed parsing:', content);
        console.warn('API response was not valid JSON despite requesting JSON format, using fallback.');
        // Use destructured args for fallback call
        return fallbackRiskAnalysis(riskTolerance, riskIdentification, maxLoss, language);
      }
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] API call failed (Attempt ${retries + 1}/${API_RETRY_COUNT + 1}):`, error);
       if (error.response) {
        console.error('API Response Status:', error.response.status);
        console.error('API Response Data:', error.response.data);
      }

      retries++;

      if (retries > API_RETRY_COUNT) {
        console.error(`[${new Date().toISOString()}] API call failed after all retries. Using fallback risk analysis.`);
        // Use destructured args for fallback call
        return fallbackRiskAnalysis(riskTolerance, riskIdentification, maxLoss, language);
      }

      console.log(`[${new Date().toISOString()}] Waiting 1 second before retry...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.error(`[${new Date().toISOString()}] Reached theoretically unreachable code in analyzeRiskConsistency. Using fallback.`);
  // Use destructured args for fallback call
  return fallbackRiskAnalysis(riskTolerance, riskIdentification, maxLoss, language);
};

/**
 * Analyzes the user's awareness of cognitive biases and the effectiveness of their mitigation plan.
 * Uses the DeepSeek API with retry logic and falls back to local analysis on failure.
 *
 * @param args - Arguments for cognitive bias analysis.
 * @param args.biasChecks - User's answers to specific bias check questions (e.g., {'6-1': 'Yes', ...}).
 * @param args.mitigationPlan - The user's plan to mitigate identified or potential biases.
 * @param apiKey - The DeepSeek API key.
 * @param language - The language for the API prompt ('zh' or 'en').
 * @returns A promise resolving to the analysis result.
 */
export const analyzeCognitiveBiases = async (
   args: { biasChecks: Record<string, any>; mitigationPlan: string },
  apiKey: string,
  language: 'zh' | 'en' = 'zh'
): Promise<DeepSeekAnalysisResult> => {
  // Destructure args at the beginning
  const { biasChecks, mitigationPlan } = args;
  // Convert biasChecks object to a readable string format for the prompt
  const biasAwarenessSummary = Object.entries(biasChecks)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
    
  console.log(`[${new Date().toISOString()}] Calling analyzeCognitiveBiases API`);
  console.log(`API Params: apiKey=${apiKey ? 'Provided' : 'Not Provided'}, language=${language}`);
  console.log(`Bias Awareness: ${biasAwarenessSummary}`);
  console.log(`Bias Mitigation Plan: ${mitigationPlan.substring(0, 50)}${mitigationPlan.length > 50 ? '...' : ''}`);

  const client = createClient(apiKey);
  let retries = 0;

  const systemPrompt = language === 'zh'
    ? `你是一位行为金融学专家。评估用户对潜在认知偏差的认识程度以及其制定的应对措施的有效性。请仅返回JSON格式。`
    : `You are a behavioral finance expert. Evaluate the user's awareness of potential cognitive biases and the effectiveness of their mitigation plan. Return results in JSON format only.`;

  const userPrompt = language === 'zh'
    ? `评估以下关于认知偏差的信息：
      认知偏差自我检查结果：${biasAwarenessSummary}
      应对偏差的措施：${mitigationPlan}

      返回JSON对象，包含字段：consistencyScore (0-10 分数，代表偏差应对的有效性), conflictPoints (string[] 指出识别到的偏差或措施的不足), suggestions (string[] 改进建议), reasoningPath (string 分析过程)`
    : `Evaluate the following information regarding cognitive biases:
      Cognitive Bias Self-Check Results: ${biasAwarenessSummary}
      Measures to Address Biases: ${mitigationPlan}

      Return a JSON object with fields: consistencyScore (0-10 score, representing effectiveness of bias mitigation), conflictPoints (string[] identified biases or mitigation weaknesses), suggestions (string[] improvement suggestions), reasoningPath (string analysis process)`;

  console.log(`[${new Date().toISOString()}] Sending API request. System prompt length: ${systemPrompt.length}, User prompt length: ${userPrompt.length}`);

  while (retries <= API_RETRY_COUNT) {
    try {
      console.log(`[${new Date().toISOString()}] Sending analyzeCognitiveBiases request (Attempt ${retries + 1}/${API_RETRY_COUNT + 1})`);
      console.log(`Model: deepseek-chat`);

      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "deepseek-chat",
        response_format: { type: "json_object" } // Request JSON output
      });

      const content = completion.choices[0].message.content;
      console.log(`[${new Date().toISOString()}] analyzeCognitiveBiases request successful!`);
      console.log('API Raw Response:', completion);
      console.log('API Content:', content);

      if (!content) {
         throw new Error('API returned empty content.');
      }

      try {
        const parsedResult = JSON.parse(content);
        console.log(`[${new Date().toISOString()}] Successfully parsed JSON result:`, parsedResult);
         // Basic validation
        if (typeof parsedResult.consistencyScore !== 'number' || !Array.isArray(parsedResult.conflictPoints) || !Array.isArray(parsedResult.suggestions)) {
            console.warn("API response missing expected fields, using fallback structure.");
            // Use constructed biasAwarenessSummary and destructured mitigationPlan for fallback call
            return fallbackBiasAnalysis(biasAwarenessSummary, mitigationPlan, language);
        }
        return parsedResult;
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] JSON parsing failed:`, parseError);
        console.error('Content that failed parsing:', content);
         console.warn('API response was not valid JSON despite requesting JSON format, using fallback.');
         // Use constructed biasAwarenessSummary and destructured mitigationPlan for fallback call
        return fallbackBiasAnalysis(biasAwarenessSummary, mitigationPlan, language);
      }
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] API call failed (Attempt ${retries + 1}/${API_RETRY_COUNT + 1}):`, error);
       if (error.response) {
        console.error('API Response Status:', error.response.status);
        console.error('API Response Data:', error.response.data);
      }

      retries++;

      if (retries > API_RETRY_COUNT) {
        console.error(`[${new Date().toISOString()}] API call failed after all retries. Using fallback bias analysis.`);
        // Use constructed biasAwarenessSummary and destructured mitigationPlan for fallback call
        return fallbackBiasAnalysis(biasAwarenessSummary, mitigationPlan, language);
      }

      console.log(`[${new Date().toISOString()}] Waiting 1 second before retry...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.error(`[${new Date().toISOString()}] Reached theoretically unreachable code in analyzeCognitiveBiases. Using fallback.`);
  // Use constructed biasAwarenessSummary and destructured mitigationPlan for fallback call
  return fallbackBiasAnalysis(biasAwarenessSummary, mitigationPlan, language);
};

/**
 * Helper function to safely parse JSON, removing potential markdown formatting.
 * @deprecated JSON mode in API calls should handle this. Kept for reference.
 * @param content - The raw string content from the API.
 * @returns The parsed JSON object or null if parsing fails.
 */
/*
const safeJsonParse = (content: string | null): any | null => {
  if (!content) return null;
  try {
    // Remove potential markdown code block fences
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.substring(7);
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.substring(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.substring(0, jsonContent.length - 3);
    }
    jsonContent = jsonContent.trim();
    return JSON.parse(jsonContent);
  } catch (e) {
    console.error("Safe JSON parse failed:", e);
    console.error("Content attempted:", content);
    return null;
  }
};
*/