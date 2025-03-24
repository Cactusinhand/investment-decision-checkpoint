import React from 'react';
import { EvaluationState, EvaluationStep } from '../types';
import { AlertTriangle, CheckCircle, Clock, Database, Cpu, Loader } from 'lucide-react';

interface EvaluationProcessProps {
  state: EvaluationState;
  language: 'zh' | 'en';
}

const EvaluationProcess: React.FC<EvaluationProcessProps> = ({ state, language }) => {
  const { isEvaluating, currentStep, progress, error } = state;
  
  // 步骤名称
  const getStepName = (step: EvaluationStep): string => {
    switch (step) {
      case EvaluationStep.VALIDATING:
        return language === 'zh' ? '验证输入' : 'Validating Input';
      case EvaluationStep.BASIC_SCORING:
        return language === 'zh' ? '基础评分' : 'Basic Scoring';
      case EvaluationStep.API_ANALYSIS:
        return language === 'zh' ? 'AI深度分析' : 'AI Deep Analysis';
      case EvaluationStep.FINALIZING:
        return language === 'zh' ? '整合结果' : 'Finalizing Results';
      case EvaluationStep.COMPLETE:
        return language === 'zh' ? '评估完成' : 'Evaluation Complete';
      default:
        return '';
    }
  };
  
  // 步骤图标
  const getStepIcon = (step: EvaluationStep, isCurrent: boolean) => {
    if (isCurrent && isEvaluating) {
      return <Loader className="animate-spin h-5 w-5" />;
    }
    
    switch (step) {
      case EvaluationStep.VALIDATING:
        return <Database className="h-5 w-5" />;
      case EvaluationStep.BASIC_SCORING:
        return <Clock className="h-5 w-5" />;
      case EvaluationStep.API_ANALYSIS:
        return <Cpu className="h-5 w-5" />;
      case EvaluationStep.FINALIZING:
        return <Database className="h-5 w-5" />;
      case EvaluationStep.COMPLETE:
        return <CheckCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };
  
  // 步骤状态类
  const getStepClass = (step: EvaluationStep): string => {
    const isCurrentStep = step === currentStep;
    const isCompleted = getStepOrder(step) < getStepOrder(currentStep);
    
    if (isCurrentStep) {
      return 'text-blue-500 font-medium';
    } else if (isCompleted) {
      return 'text-green-500';
    } else {
      return 'text-gray-400';
    }
  };
  
  // 步骤顺序
  const getStepOrder = (step: EvaluationStep): number => {
    const order = {
      [EvaluationStep.VALIDATING]: 1,
      [EvaluationStep.BASIC_SCORING]: 2,
      [EvaluationStep.API_ANALYSIS]: 3,
      [EvaluationStep.FINALIZING]: 4,
      [EvaluationStep.COMPLETE]: 5
    };
    
    return order[step] || 0;
  };
  
  const steps = [
    EvaluationStep.VALIDATING,
    EvaluationStep.BASIC_SCORING,
    EvaluationStep.API_ANALYSIS,
    EvaluationStep.FINALIZING,
    EvaluationStep.COMPLETE
  ];
  
  return (
    <div className="w-full">
      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
        <div 
          className="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* 步骤列表 */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div 
            key={step}
            className={`flex items-center space-x-2 ${getStepClass(step)}`}
          >
            <div className="flex-shrink-0">
              {getStepIcon(step, step === currentStep)}
            </div>
            <span>{getStepName(step)}</span>
          </div>
        ))}
      </div>
      
      {/* 错误信息 */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default EvaluationProcess;