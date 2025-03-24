import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Loader2, X, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { InvestmentDecision } from '../../types';
import type { InvestmentCheckpointProps } from './types';
import { rawQuestions } from './constants';
import { translations } from '../../constants/index';

import { renderQuestion } from './utils';

const stageVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -50, transition: { duration: 0.3, ease: "easeIn" } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
  exit: { opacity: 0, y: -50, transition: { duration: 0.3 } },
};

export const InvestmentCheckpoint: React.FC<InvestmentCheckpointProps> = ({
  currentDecision,
  isEditing,
  isSaving,
  language,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [localDecision, setLocalDecision] = useState<InvestmentDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validatedFields, setValidatedFields] = useState<boolean>(false);

  // Initialize local state when currentDecision changes
  useEffect(() => {
    if (currentDecision) {
      setLocalDecision(currentDecision);
      setCurrentStage(currentDecision.stage);
    }
  }, [currentDecision]);

  const handleInputChange = (questionId: string, value: any) => {
    if (!localDecision) return;

    setLocalDecision((prev) =>
      prev
        ? {
          ...prev,
          answers: { ...prev.answers, [questionId]: value },
        }
        : null
    );
  };

  const handleNextStage = async () => {
    if (!localDecision) return;

    // 设置验证状态为true
    setValidatedFields(true);

    // 验证决策名称是否已填写
    if (!localDecision.name || localDecision.name.trim() === '') {
      setError(translations[language].pleaseEnterDecisionName || '请输入决策名称');
      return;
    }

    // Basic validation: Check for required fields in the current stage
    const currentQuestions = rawQuestions[currentStage] || [];
    const unansweredQuestions = currentQuestions.filter((q) => {
      if (q.required) {
        const answer = localDecision.answers[q.id];
        if (q.type === 'checkbox') {
          return !(Array.isArray(answer) && answer.length > 0);
        }
        return answer === undefined || answer === null || answer === '';
      }
      return false; // 只检查必填问题
    });

    if (unansweredQuestions.length > 0) {
      // 显示具体哪些问题未回答
      setError(translations[language].pleaseAnswerAll);
      // 自动滚动到第一个未回答的问题
      const firstUnansweredQuestionId = unansweredQuestions[0].id;
      const element = document.getElementById(firstUnansweredQuestionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }
    setError(null);
    
    // 成功验证后，重置验证状态为false，进入下一步
    setValidatedFields(false);

    if (currentStage < 7) {
      // Save current stage and move to next
      const updatedDecision: InvestmentDecision = {
        ...localDecision,
        stage: currentStage + 1,
      };
      setLocalDecision(updatedDecision);
      setCurrentStage(currentStage + 1);
    }
  };

  const handlePreviousStage = () => {
    if (currentStage > 1 && localDecision) {
      setLocalDecision({ ...localDecision, stage: currentStage - 1 });
      setCurrentStage(currentStage - 1);
    }
  };

  const handleCompleteDecision = async () => {
    if (!localDecision) return;

    // 设置验证状态为true
    setValidatedFields(true);

    // 验证决策名称是否已填写
    if (!localDecision.name || localDecision.name.trim() === '') {
      setError(translations[language].pleaseEnterDecisionName || '请输入决策名称');
      return;
    }

    // Final validation
    const currentQuestions = rawQuestions[7] || [];
    const unansweredQuestions = currentQuestions.filter((q) => {
      if (q.required) {
        const answer = localDecision.answers[q.id];
        if (q.type === 'checkbox') {
          return !(Array.isArray(answer) && answer.length > 0);
        }
        return answer === undefined || answer === null || answer === '';
      }
      return false; // 只检查必填问题
    });

    if (unansweredQuestions.length > 0) {
      // 显示具体哪些问题未回答
      setError(translations[language].pleaseAnswerAll);
      // 自动滚动到第一个未回答的问题
      const firstUnansweredQuestionId = unansweredQuestions[0].id;
      const element = document.getElementById(firstUnansweredQuestionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }
    setError(null);
    
    // 重置验证状态
    setValidatedFields(false);

    const completedDecision: InvestmentDecision = {
      ...localDecision,
      completed: true,
    };

    try {
      await onSave(completedDecision);
    } catch (err) {
      setError(translations[language].anErrorOccurred);
      console.error(err);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                {isEditing
                  ? `${translations[language].editDecision}: ${localDecision?.name ||
                  `${translations[language].decisionName} ${localDecision?.id.slice(
                    -4
                  )}`
                  }`
                  : translations[language].newInvestmentCheckpoint}
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400 mt-2">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translations[language].decisionName} <span className={validatedFields && (!localDecision?.name || localDecision.name.trim() === '') ? "text-red-500 font-bold animate-pulse" : "text-red-500"}>*</span>
                  </label>
                  <Input
                    type="text"
                    value={localDecision?.name || ''}
                    onChange={(e) => setLocalDecision({
                      ...localDecision,
                      name: e.target.value,
                    })}
                    className={`w-full dark:bg-gray-700 dark:border-gray-600 ${validatedFields && (!localDecision?.name || localDecision.name.trim() === '') ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' : ''}`}
                    placeholder={translations[language].enterDecisionName}
                  />
                  {validatedFields && (!localDecision?.name || localDecision.name.trim() === '') && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {translations[language].pleaseEnterDecisionName}
                    </p>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* 添加关闭按钮 */}
              <button
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>

              {isEditing && onDelete && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (localDecision) {
                      onDelete(localDecision.id);
                    }
                  }}
                  className="ml-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {translations[language].stage}:
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i + 1}
                  className={cn(
                    'w-2 h-2 rounded-full',
                    i + 1 <= currentStage
                      ? 'bg-blue-500 dark:bg-blue-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({currentStage}/7)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stage Content */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {(() => {
                switch (currentStage) {
                  case 1:
                    return translations[language].stage1Title;
                  case 2:
                    return translations[language].stage2Title;
                  case 3:
                    return translations[language].stage3Title;
                  case 4:
                    return translations[language].stage4Title;
                  case 5:
                    return translations[language].stage5Title;
                  case 6:
                    return translations[language].stage6Title;
                  case 7:
                    return translations[language].stage7Title;
                  default:
                    return '';
                }
              })()}
            </h2>
            <AnimatePresence mode="wait">
              <motion.div
                key={`stage-${currentStage}`}
                variants={stageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {rawQuestions[currentStage]?.map((question) =>
                  renderQuestion(
                    question,
                    localDecision,
                    (value) => handleInputChange(question.id, value),
                    language,
                    validatedFields
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={handlePreviousStage}
            disabled={currentStage === 1}
            className={cn(
              'text-gray-900 dark:text-white',
              currentStage === 1
                ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
            )}
          >
            {translations[language].previous}
          </Button>
          {currentStage < 7 ? (
            <Button
              onClick={handleNextStage}
              className="bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {translations[language].next}
            </Button>
          ) : (
            <Button
              onClick={handleCompleteDecision}
              disabled={isSaving}
              className="bg-green-500 hover:bg-green-600 text-white dark:bg-green-700 dark:hover:bg-green-800"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations[language].saving}
                </>
              ) : (
                translations[language].completeDecision
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};