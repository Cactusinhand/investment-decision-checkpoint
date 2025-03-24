// src/components/investment-evaluation/components/InvestmentEvaluation.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '../../ui/card';
import { Button } from '../../ui/button';
import { AlertCircle } from 'lucide-react';
import { 
  InvestmentDecision, 
  InvestmentEvaluationProps,
  EvaluationState,
  EvaluationStep,
  EvaluationResult
} from '../types';
import { 
  evaluateInvestmentDecision, 
  evaluateInvestmentDecisionSync,
  validateDecisionInputs 
} from '../utils/evaluationUtils';
import { validateAllAnswerTypes } from '../utils/typeValidation';
import EvaluationProcess from './EvaluationProcess';
import EvaluationResultDisplay from './EvaluationResult';
import { rawQuestions } from '../../investment-checkpoint/constants';

const InvestmentEvaluation: React.FC<InvestmentEvaluationProps> = ({
  decision,
  language,
  onComplete,
  onClose,
  translations,
  apiKey
}) => {
  // 评估状态
  const [state, setState] = useState<EvaluationState>({
    isEvaluating: false,
    currentStep: EvaluationStep.VALIDATING,
    progress: 0,
    error: null
  });
  
  // 评估结果
  const [result, setResult] = useState<EvaluationResult | null>(null);
  
  // 输入类型错误
  const [typeErrors, setTypeErrors] = useState<string[]>([]);
  
  // 处理评估过程
  useEffect(() => {
    // 如果已有结果或正在评估，不执行
    if (result || state.isEvaluating) return;
    
    const startEvaluation = async () => {
      try {
        setState({
          isEvaluating: true,
          currentStep: EvaluationStep.VALIDATING,
          progress: 10,
          error: null
        });
        
        // 输入验证
        const inputErrors = validateDecisionInputs(decision);
        if (inputErrors.length > 0) {
          throw new Error(language === 'zh' 
            ? `输入验证失败: ${inputErrors[0]}` 
            : `Input validation failed: ${inputErrors[0]}`);
        }
        
        // 类型验证
        const typeErrorList = validateAllAnswerTypes(decision.answers, rawQuestions);
        if (typeErrorList.length > 0) {
          setTypeErrors(typeErrorList);
          throw new Error(language === 'zh'
            ? `${typeErrorList.length}个字段类型验证失败` 
            : `Type validation failed for ${typeErrorList.length} fields`);
        }
        
        // 基础评分
        setState(prev => ({
          ...prev,
          currentStep: EvaluationStep.BASIC_SCORING,
          progress: 30
        }));
        
        // 先进行同步评估获取基础结果
        const basicResult = evaluateInvestmentDecisionSync(decision);
        
        // 如果提供了API密钥，继续API增强评估
        if (apiKey) {
          setState(prev => ({
            ...prev,
            currentStep: EvaluationStep.API_ANALYSIS,
            progress: 60
          }));
          
          // 执行异步API增强评估
          const enhancedResult = await evaluateInvestmentDecision(decision, apiKey, language);
          
          setState(prev => ({
            ...prev,
            currentStep: EvaluationStep.FINALIZING,
            progress: 90
          }));
          
          // 更新为增强评估结果
          setResult(enhancedResult);
        } else {
          // 无API密钥，直接使用基础结果
          setState(prev => ({
            ...prev,
            currentStep: EvaluationStep.FINALIZING,
            progress: 90
          }));
          
          setResult(basicResult);
        }
        
        // 完成评估
        setState(prev => ({
          ...prev,
          isEvaluating: false,
          currentStep: EvaluationStep.COMPLETE,
          progress: 100
        }));
      } catch (error) {
        console.error('评估过程出错:', error);
        setState(prev => ({
          ...prev,
          isEvaluating: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    };
    
    startEvaluation();
  }, [decision, language, apiKey]);
  
  // 保存评估结果
  const handleSaveResult = () => {
    if (!result) return;
    
    // 创建已评估的决策
    const evaluatedDecision: InvestmentDecision = {
      ...decision,
      evaluated: true,
      evaluationScore: result.totalScore,
      evaluationResult: result
    };
    
    // 调用完成回调
    onComplete(result);
  };
  
  // 如果已有结果，显示结果页面
  if (result) {
    return (
      <EvaluationResultDisplay
        decision={decision}
        result={result}
        language={language}
        onClose={onClose}
        onSave={handleSaveResult}
      />
    );
  }
  
  // 否则显示评估过程
  return (
    <Card className="w-full shadow-lg dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          {language === 'zh' ? '投资决策评估' : 'Investment Decision Evaluation'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* 类型错误提示 */}
        {typeErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <p className="font-medium">
                  {language === 'zh' 
                    ? '以下字段的输入类型有误:' 
                    : 'Invalid input types for the following fields:'}
                </p>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {typeErrors.slice(0, 5).map(fieldId => (
                    <li key={fieldId}>{fieldId}</li>
                  ))}
                  {typeErrors.length > 5 && <li>...</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* 评估过程 */}
        <EvaluationProcess state={state} language={language} />
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          onClick={onClose}
          disabled={state.isEvaluating}
        >
          {language === 'zh' ? '取消' : 'Cancel'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InvestmentEvaluation;