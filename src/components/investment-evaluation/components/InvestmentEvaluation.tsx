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
import { AlertCircle, Loader2 } from 'lucide-react';
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

/**
 * InvestmentEvaluation Component
 * 
 * This component orchestrates the evaluation process for a given investment decision.
 * It handles:
 * - Displaying the evaluation progress.
 * - Triggering input validation and type validation.
 * - Performing synchronous rule-based scoring.
 * - Optionally performing asynchronous API-enhanced analysis (if apiKey is provided).
 * - Displaying validation errors.
 * - Displaying the final evaluation result.
 * - Handling user interactions like starting evaluation, saving results, and closing.
 */
const InvestmentEvaluation: React.FC<InvestmentEvaluationProps> = ({
  /** The investment decision object to be evaluated. */
  decision,
  /** The current application language ('en' or 'zh'). */
  language,
  /** Callback function triggered when the evaluation is complete and the user confirms saving. */
  onComplete,
  /** Callback function to close the evaluation modal/view. */
  onClose,
  /** The translations object for UI text. */
  translations,
  /** Optional DeepSeek API key for enhanced analysis. */
  apiKey
}) => {
  /** State representing the current phase and progress of the evaluation process. */
  const [state, setState] = useState<EvaluationState>({
    isEvaluating: false,
    currentStep: EvaluationStep.VALIDATING, // Start at validation step
    progress: 0,
    error: null
  });
  
  /** Loading state specifically for the asynchronous API analysis part. */
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  
  /** Stores the final evaluation result object. Initialized if the decision already has results. */
  const [result, setResult] = useState<EvaluationResult | null>(decision.evaluationResult || null);
  
  /** Stores an array of field IDs that failed type validation. */
  const [typeErrors, setTypeErrors] = useState<string[]>([]);
  
  /** Effect to initialize the result state if the decision passed in already has evaluation results. */
  useEffect(() => {
    if (decision.evaluated && decision.evaluationResult) {
      setResult(decision.evaluationResult);
      // If results exist, set state to Complete to show results immediately
       setState({
        isEvaluating: false,
        currentStep: EvaluationStep.COMPLETE,
        progress: 100,
        error: null
      });
    }
  }, [decision]);
  
  /** 
   * Asynchronously starts the multi-step evaluation process.
   * Handles validation, basic scoring, optional API analysis, and state updates.
   */
  const startEvaluation = async () => {
      try {
        setIsLoadingAPI(false); // Reset API loading state
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
          
          setIsLoadingAPI(true); // Set API loading state to true
          const enhancedResult = await evaluateInvestmentDecision(decision, apiKey, language);
          setIsLoadingAPI(false); // Set API loading state to false after call completes
          
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
        setIsLoadingAPI(false); // Ensure loading state is false on error
        console.error('评估过程出错:', error);
        setState(prev => ({
          ...prev,
          isEvaluating: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    };
    
  /** 
   * Handler function called when the user confirms saving the evaluation results.
   * Currently, it just calls the onComplete callback passed via props.
   * In a real app, this might involve saving the result back to a central store or backend.
   */
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
  
  // If evaluation is complete (either just finished or loaded existing results), show the results display.
  if (state.currentStep === EvaluationStep.COMPLETE && result) {
    return (
      <EvaluationResultDisplay
        decision={decision}
        result={result}
        language={language}
        onClose={onClose}
        onSave={handleSaveResult}
        translations={translations}
      />
    );
  }
  
  // Otherwise, show the evaluation process view (progress bar or start button).
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
        
        {/* 显示评估过程或开始评估按钮 */}
        {state.isEvaluating || isLoadingAPI ? (
          <EvaluationProcess state={state} language={language} isLoadingAPI={isLoadingAPI} />
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="mb-6 text-center text-gray-600 dark:text-gray-300">
              {language === 'zh' 
                ? '点击下方按钮开始评估您的投资决策' 
                : 'Click the button below to start evaluating your investment decision'}
            </p>
            <Button 
              onClick={startEvaluation}
              disabled={isLoadingAPI || state.isEvaluating}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoadingAPI ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {language === 'zh' ? 'API分析中...' : 'Analyzing with API...'}</>
              ) : (
                language === 'zh' ? '开始评估' : 'Start Evaluation'
              )}
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          onClick={onClose}
          disabled={state.isEvaluating || isLoadingAPI}
        >
          {language === 'zh' ? '取消' : 'Cancel'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InvestmentEvaluation;