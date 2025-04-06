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

// Animation variants for stage transitions
const stageVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -50, transition: { duration: 0.3, ease: "easeIn" } }
};

// Animation variants for the main card appearance/disappearance
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
  exit: { opacity: 0, y: -50, transition: { duration: 0.3 } },
};

/**
 * InvestmentCheckpoint Component
 * 
 * Guides the user through the 7 stages of creating an investment decision.
 * Handles:
 * - Displaying questions for the current stage.
 * - Storing answers locally as the user progresses.
 * - Validating required fields before moving to the next stage or completing.
 * - Navigating between stages (previous/next).
 * - Saving the completed decision.
 * - Cancelling the process.
 * - Deleting an existing decision (if editing).
 * - Displaying validation errors.
 * - Supporting a read-only mode.
 */
export const InvestmentCheckpoint: React.FC<InvestmentCheckpointProps> = ({
  /** The decision object currently being created or edited. Passed from the parent. */
  currentDecision,
  /** Flag indicating if an existing decision is being edited (true) or a new one is being created (false). */
  isEditing,
  /** Flag indicating if a save operation is in progress (shows loading state). */
  isSaving,
  /** Current application language ('en' or 'zh'). */
  language,
  /** Callback function to save the decision (either partially or completed). */
  onSave,
  /** Callback function to cancel the checkpoint process. */
  onCancel,
  /** Optional callback function to delete the current decision (only relevant when isEditing is true). */
  onDelete,
  /** If true, displays the checkpoint in read-only mode, preventing edits. Defaults to false. */
  readOnly = false,
}) => {
  /** Tracks the current stage (1-7) being displayed to the user. */
  const [currentStage, setCurrentStage] = useState(1);
  /** Local copy of the decision being edited/created. Allows changes without directly modifying the parent state until save. */
  const [localDecision, setLocalDecision] = useState<InvestmentDecision | null>(null);
  /** Stores any validation or save error messages to be displayed. */
  const [error, setError] = useState<string | null>(null);
  /** State to track if validation has been triggered (e.g., on Next/Complete click), used for highlighting errors. */
  const [validatedFields, setValidatedFields] = useState<boolean>(false);

  /** Effect to initialize the local state (localDecision, currentStage) when the parent passes a new currentDecision. */
  useEffect(() => {
    if (currentDecision) {
      setLocalDecision(currentDecision);
      setCurrentStage(currentDecision.stage);
    }
  }, [currentDecision]);

  /**
   * Handles input changes for any question.
   * Updates the localDecision state with the new answer.
   * Does nothing if in readOnly mode.
   * @param questionId - The ID of the question being answered.
   * @param value - The new answer value.
   */
  const handleInputChange = (questionId: string, value: any) => {
    if (!localDecision || readOnly) return; // 在只读模式下不允许修改

    setLocalDecision((prev) =>
      prev
        ? {
          ...prev,
          answers: { ...prev.answers, [questionId]: value },
        }
        : null
    );
  };

  /** 
   * Handles moving to the next stage.
   * Performs validation for the current stage's required questions.
   * Updates the localDecision state with the incremented stage number.
   * Scrolls to and focuses the first unanswered required question if validation fails.
   */
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

  /** Handles moving to the previous stage. Updates localDecision state. */
  const handlePreviousStage = () => {
    if (currentStage > 1 && localDecision) {
      setLocalDecision({ ...localDecision, stage: currentStage - 1 });
      setCurrentStage(currentStage - 1);
    }
  };

  /** 
   * Handles completing the decision-making process.
   * Performs final validation for the last stage's required questions.
   * Marks the decision as completed in the local state.
   * Calls the onSave callback with the completed decision.
   * Scrolls to and focuses the first unanswered required question if validation fails.
   */
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
                    onChange={(e) => !readOnly && setLocalDecision({
                      ...localDecision,
                      name: e.target.value,
                    })}
                    disabled={readOnly}
                    className={`w-full dark:bg-gray-700 dark:border-gray-600 ${validatedFields && (!localDecision?.name || localDecision.name.trim() === '') ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' : ''} ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
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
          {readOnly ? (
            // 只读模式下显示翻页和返回按钮
            <>
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
              <div className="flex gap-2">
                {currentStage < 7 && (
                  <Button
                    onClick={handleNextStage}
                    className="bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    {translations[language].next}
                  </Button>
                )}
                <Button
                  onClick={onCancel}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white"
                >
                  {language === 'zh' ? '返回' : 'Back'}
                </Button>
              </div>
            </>
          ) : (
            // 编辑模式下显示正常的导航按钮
            <>
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
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};