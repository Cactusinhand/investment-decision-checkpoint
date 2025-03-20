import React, { createContext, useState, useContext, ReactNode } from 'react';
import { RiskAssessmentAnswers, RiskAssessmentResult } from './types';

// 风险评估上下文类型
interface RiskAssessmentContextType {
  isOpen: boolean;
  answers: RiskAssessmentAnswers;
  result: RiskAssessmentResult | null;
  openAssessment: () => void;
  closeAssessment: () => void;
  setAnswers: (answers: RiskAssessmentAnswers) => void;
  updateAnswer: (questionId: string, value: any) => void;
  setResult: (result: RiskAssessmentResult | null) => void;
}

// 创建上下文
const RiskAssessmentContext = createContext<RiskAssessmentContextType | undefined>(undefined);

// 上下文提供者Props
interface RiskAssessmentProviderProps {
  children: ReactNode;
}

// 上下文提供者
export const RiskAssessmentProvider: React.FC<RiskAssessmentProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState<RiskAssessmentAnswers>({});
  const [result, setResult] = useState<RiskAssessmentResult | null>(null);

  // 打开评估
  const openAssessment = () => setIsOpen(true);

  // 关闭评估
  const closeAssessment = () => {
    setIsOpen(false);
    setAnswers({});
    setResult(null);
  };

  // 更新单个答案
  const updateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  return (
    <RiskAssessmentContext.Provider
      value={{
        isOpen,
        answers,
        result,
        openAssessment,
        closeAssessment,
        setAnswers,
        updateAnswer,
        setResult
      }}
    >
      {children}
    </RiskAssessmentContext.Provider>
  );
};

// 自定义Hook，用于使用上下文
export const useRiskAssessment = (): RiskAssessmentContextType => {
  const context = useContext(RiskAssessmentContext);
  if (context === undefined) {
    throw new Error('useRiskAssessment must be used within a RiskAssessmentProvider');
  }
  return context;
}; 