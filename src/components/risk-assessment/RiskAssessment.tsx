import React, { useState } from 'react';
import { Button } from '../ui/button';
import { X, AlertTriangle } from 'lucide-react';
import { riskAssessmentQuestions } from './RiskAssessmentQuestions';
import { RiskAssessmentAnswers, RiskAssessmentResult, Question } from './types';
import { calculateRiskScore, checkRequiredAnswers } from './utils';

interface RiskAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'zh' | 'en';
  onComplete?: (result: RiskAssessmentResult) => void;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  isOpen,
  onClose,
  language,
  onComplete
}) => {
  const [answers, setAnswers] = useState<RiskAssessmentAnswers>({});
  const [result, setResult] = useState<RiskAssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 处理答案变化
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // 提交评估
  const submitAssessment = () => {
    // 检查是否所有必填问题都已回答
    const unansweredQuestions = checkRequiredAnswers(answers);

    if (unansweredQuestions.length > 0) {
      setError(language === 'zh' ? '请回答所有必填问题后再提交' : 'Please answer all required questions before submitting');
      return;
    }

    const calculatedResult = calculateRiskScore(answers, language);
    setResult(calculatedResult);

    if (onComplete) {
      onComplete(calculatedResult);
    }
  };

  // 关闭评估
  const closeAssessment = () => {
    setAnswers({});
    setResult(null);
    onClose();
  };

  // 渲染问题
  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';
    const questionText = language === 'zh' ? question.textZh : question.textEn;
    const options = question.options ? question.options[language] : [];

    switch (question.type) {
      case 'radio':
        return (
          <div className="mb-4" key={question.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {questionText} {question.required && <span className="text-red-500">*</span>}
            </label>
            {options.map((option: string) => (
              <div key={option} className="flex items-center mb-2">
                <input
                  type="radio"
                  id={`${question.id}-${option}`}
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600"
                />
                <label
                  htmlFor={`${question.id}-${option}`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-200"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="mb-4" key={question.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {questionText} {question.required && <span className="text-red-500">*</span>}
            </label>
            {options.map((option: string) => (
              <div key={option} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`${question.id}-${option}`}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const newValue = Array.isArray(value)
                      ? value.includes(option)
                        ? value.filter((v: string) => v !== option)
                        : [...value, option]
                      : [option];
                    handleAnswerChange(question.id, newValue);
                  }}
                  className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
                />
                <label
                  htmlFor={`${question.id}-${option}`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-200"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // 渲染评估结果
  const renderResult = () => {
    if (!result) return null;

    const resultTitle = language === 'zh' ? '风险评估结果' : 'Risk Assessment Result';
    const scoreLabel = language === 'zh' ? '您的风险承受能力评分' : 'Your Risk Tolerance Score';
    const typeLabel = language === 'zh' ? '风险类型' : 'Risk Type';
    const descriptionLabel = language === 'zh' ? '特征描述' : 'Description';
    const recommendationLabel = language === 'zh' ? '投资建议' : 'Investment Recommendation';
    const doneButtonLabel = language === 'zh' ? '完成' : 'Done';

    // 风险验证与警告文本
    const verificationTitle = language === 'zh' ? '策略一致性确认' : 'Strategy Consistency Check';
    const verificationText = language === 'zh'
      ? '您选择了"加仓摊低成本"的策略，但您的投资经验相对有限。请确认您是否了解这种策略在市场持续下跌时可能带来的风险。'
      : 'You have chosen an "add on dips" strategy, but your investment experience is relatively limited. Please confirm that you understand the risks this strategy may pose in a continuously declining market.';

    const warningTitle = language === 'zh' ? '风险警示' : 'Risk Warning';
    const warningText = language === 'zh'
      ? '考虑到您的年龄段(>50岁)，高风险投资策略可能不适合您的整体财务规划。建议您考虑降低风险敞口或确保这部分投资在您的整体资产中占比不高。'
      : 'Given your age group (>50 years), high-risk investment strategies may not be suitable for your overall financial planning. We recommend considering reducing risk exposure or ensuring that this investment represents a small portion of your overall assets.';

    return (
      <div className="mt-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{resultTitle}</h3>
        <p className="mb-2 text-gray-700 dark:text-gray-300">
          {scoreLabel}: <span className="font-bold">{result.score}</span>
        </p>
        <p className="mb-2 text-gray-700 dark:text-gray-300">
          {typeLabel}: <span className="font-bold">{result.name}</span>
        </p>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {descriptionLabel}: {result.description}
        </p>

        {/* 风险验证提示 */}
        {result.needsVerification && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {verificationTitle}
            </h4>
            <p className="text-yellow-700 dark:text-yellow-400">{verificationText}</p>
          </div>
        )}

        {/* 风险警告 */}
        {result.needsWarning && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {warningTitle}
            </h4>
            <p className="text-red-700 dark:text-red-400">{warningText}</p>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{recommendationLabel}</h4>
          <p className="text-blue-700 dark:text-blue-400">{result.recommendation}</p>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={closeAssessment}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {doneButtonLabel}
          </Button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  // 翻译标题和说明
  const title = language === 'zh' ? '风险承受能力评估' : 'Risk Tolerance Assessment';
  const subtitle = language === 'zh'
    ? '请回答以下问题以评估您的风险承受能力。此评估将帮助我们了解您对投资风险的态度。'
    : 'Please answer the following questions to assess your risk tolerance. This assessment will help us understand your attitude towards investment risks.';

  // 翻译分类标题
  const categoryTitles = {
    zh: {
      financial: '一、财务能力评估',
      goal: '二、投资目标与期限',
      psychological: '三、心理承受测试',
      experience: '四、投资经验与知识',
      demographic: '五、个人基本信息'
    },
    en: {
      financial: 'I. Financial Capacity Assessment',
      goal: 'II. Investment Goals & Time Horizon',
      psychological: 'III. Psychological Risk Tolerance',
      experience: 'IV. Investment Experience & Knowledge',
      demographic: 'V. Personal Information'
    }
  };

  // 按类别分组问题
  const categorizedQuestions = {
    financial: riskAssessmentQuestions.filter(q => q.category === 'financial'),
    goal: riskAssessmentQuestions.filter(q => q.category === 'goal'),
    psychological: riskAssessmentQuestions.filter(q => q.category === 'psychological'),
    experience: riskAssessmentQuestions.filter(q => q.category === 'experience'),
    demographic: riskAssessmentQuestions.filter(q => q.category === 'demographic'),
  };

  const submitButtonText = language === 'zh' ? '提交评估' : 'Submit Assessment';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={closeAssessment}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {result ? (
            // 显示评估结果
            renderResult()
          ) : (
            // 显示评估问卷
            <div>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                {subtitle}
              </p>

              {/* 财务能力评估 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {categoryTitles[language].financial}
                </h3>
                {categorizedQuestions.financial.map(renderQuestion)}
              </div>

              {/* 投资目标与期限 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {categoryTitles[language].goal}
                </h3>
                {categorizedQuestions.goal.map(renderQuestion)}
              </div>

              {/* 心理承受测试 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {categoryTitles[language].psychological}
                </h3>
                {categorizedQuestions.psychological.map(renderQuestion)}
              </div>

              {/* 投资经验与知识 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {categoryTitles[language].experience}
                </h3>
                {categorizedQuestions.experience.map(renderQuestion)}
              </div>

              {/* 人口统计学修正项 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {categoryTitles[language].demographic}
                </h3>
                {categorizedQuestions.demographic.map(renderQuestion)}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={submitAssessment}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitButtonText}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment; 