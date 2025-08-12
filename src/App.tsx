/** @jsxImportSource react */
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card';
import { Dialog } from './components/ui/dialog';
import {
  CheckCircle,
  ChevronRight,
  BookOpen,
  LogOut,
  AlertTriangle,
  X,
  Sun,
  Moon,
  Globe,
  AlertCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence } from 'framer-motion';
import { RiskAssessment } from './components/risk-assessment';
import { riskProfiles } from './components/risk-assessment';
import { InvestmentCheckpoint, rawQuestions, questionTranslations, optionToTranslationKey, helpExamples } from './components/investment-checkpoint';
import { InvestmentEvaluation } from './components/investment-evaluation';
import { InvestmentDecision, RiskAssessmentResult, UserProfile, Question, EvaluationResult } from './types';
import { translations } from './constants/index';
import { signInWithGoogle, signInWithGitHub, logOut, auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const deepSeekApiKey = process.env.REACT_APP_DEEPSEEK_API_KEY || ''; // 或者 process.env.VITE_DEEPSEEK_API_KEY

/**
 * Helper function to simulate saving data (replace with actual API calls)
 * @param data The data to be saved (can be any type).
 * @returns A promise resolving to an object indicating success and the saved data.
 */
const saveData = async (data: any) => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));
  // In a real app, you'd send this data to your backend
  console.log('Saving data:', data);
  return { success: true, data }; // Return a success/failure indicator
};

const App: React.FC = () => {
  // State Variables
  /** User profile information loaded from Firebase auth. */
  const [user, setUser] = useState<UserProfile | null>(null);
  /** The currently active (being edited or viewed) investment decision. */
  const [currentDecision, setCurrentDecision] = useState<InvestmentDecision | null>(null);
  /** List of all investment decisions made by the user. Loaded from local storage. */
  const [decisions, setDecisions] = useState<InvestmentDecision[]>([]);
  /** The current stage (1-7) of the investment checkpoint being displayed. */
  const [currentStage, setCurrentStage] = useState(1);
  /** Loading state, typically for asynchronous operations (e.g., API calls, saving). */
  const [isLoading, setLoading] = useState(false);
  /** Indicates if data is currently being saved (e.g., to local storage or backend). */
  const [isSaving, setIsSaving] = useState(false);
  /** Holds any error message to be displayed to the user. */
  const [error, setError] = useState<string | null>(null);
  /** Controls whether the current decision form is in edit mode or view mode. */
  const [isEditing, setIsEditing] = useState(false);
  /** Current theme setting ('light', 'dark', or 'system' preference). */
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  /** Current language setting ('en' or 'zh'). */
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  /** Translated questions based on the selected language. */
  const [translatedQuestions, setTranslatedQuestions] = useState<{ [key: number]: Question[] }>(rawQuestions);
  /** Authentication status (true if logged in, false otherwise). */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  /** Controls the visibility of the Risk Assessment modal/component. */
  const [isRiskAssessmentOpen, setIsRiskAssessmentOpen] = useState(false);
  /** Stores the result from the completed risk assessment. */
  const [riskAssessmentResult, setRiskAssessmentResult] = useState<RiskAssessmentResult | null>(null);
  /** Controls the visibility of the Investment Evaluation modal/component. */
  const [isInvestmentEvaluationOpen, setIsInvestmentEvaluationOpen] = useState(false);
  /** The decision currently being evaluated or whose results are being viewed. */
  const [evaluatingDecision, setEvaluatingDecision] = useState<InvestmentDecision | null>(null);
  /** Stores the DeepSeek API key, loaded from environment variables. */
  const [apiKey, setApiKey] = useState<string>(deepSeekApiKey);

  // Listen for Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // TODO: Fetch the full user profile from a persistent store (e.g., Firestore)
        // using `firebaseUser.uid` to avoid overwriting existing user data.
        // For now, it resets the profile on each login.
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email || 'User',
          riskTolerance: 'steady',
          preferredStrategies: [],
        });
        setShowLogin(false);
      } else {
        setUser(null);
      }
      setIsLoggedIn(!!firebaseUser);
    });
    return () => unsubscribe();
  }, []);
  
  // Load decisions from local storage on initial load
  useEffect(() => {
    const savedDecisions = localStorage.getItem('investmentDecisions');
    if (savedDecisions) {
      try {
        setDecisions(JSON.parse(savedDecisions));
      } catch (e) {
        console.error("Failed to parse saved decisions:", e);
        // Handle the error, e.g., clear the corrupted data
        localStorage.removeItem('investmentDecisions');
        setDecisions([]); // Reset to an empty array
      }
    }
  }, []);

  // Save decisions to local storage whenever they change
  useEffect(() => {
    if (decisions.length > 0 || localStorage.getItem('investmentDecisions')) {
      localStorage.setItem('investmentDecisions', JSON.stringify(decisions));
    }
  }, [decisions]);

  // Apply theme
  useEffect(() => {
    if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Load language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'zh';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translate questions
  useEffect(() => {
    const translated: { [key: number]: Question[] } = {};
    for (const stage in rawQuestions) {
      translated[parseInt(stage)] = rawQuestions[parseInt(stage)].map(q => {
        // 使用问题翻译对象来翻译问题文本
        const translatedText = language === 'zh'
          ? questionTranslations[q.text] || q.text
          : q.text;

        // 翻译选项
        const translatedOptions = q.options
          ? q.options.map(opt => {
            // 检查是否存在映射键
            const translationKey = optionToTranslationKey[opt];
            if (translationKey && translations[language][translationKey]) {
              return translations[language][translationKey];
            }
            // 回退到一般的翻译查找
            return translations[language][opt.toLowerCase() as keyof typeof translations['en']] || opt;
          })
          : undefined;

        // 翻译帮助文本，确保使用当前语言对应的示例
        const translatedHelp = q.help && helpExamples[language][q.id]
          ? helpExamples[language][q.id]
          : q.help;

        return {
          ...q,
          text: translatedText,
          options: translatedOptions,
          help: translatedHelp,
        }
      });
    }
    setTranslatedQuestions(translated);
  }, [language]);

  // --- Callback Handlers --- //

  /** 
   * Callback triggered when the Risk Assessment component completes.
   * Updates the risk assessment result state and the user's profile risk tolerance.
   * @param result - The result object from the risk assessment.
   */
  const handleRiskAssessmentComplete = (result: RiskAssessmentResult) => {
    // 保存完整的风险评估结果
    setRiskAssessmentResult(result);

    // 更新用户风险承受能力 - 使用 type 标识符
    if (user) {
      setUser({
        ...user,
        riskTolerance: result.type // 使用与语言无关的 type
      });
    }
  };
  
  /**
   * Callback triggered when the Investment Evaluation component completes.
   * Updates the evaluated decision with the results and closes the evaluation modal.
   * @param result - The evaluation result object.
   */
  const handleInvestmentEvaluationComplete = (result: EvaluationResult) => {
    if (!evaluatingDecision) return;
    
    // 更新决策的评估结果
    const updatedDecision: InvestmentDecision = {
      ...evaluatingDecision,
      evaluated: true,
      evaluationScore: result.totalScore,
      evaluationResult: result
    };
    
    // 更新决策列表
    setDecisions(decisions.map(d => 
      d.id === updatedDecision.id ? updatedDecision : d
    ));
    
    // 关闭评估模态框
    setIsInvestmentEvaluationOpen(false);
    setEvaluatingDecision(null);
  };
  
  /**
   * Initiates the evaluation process for a completed decision or opens the results view.
   * Sets the decision to be evaluated and opens the evaluation modal.
   * @param decision - The decision to evaluate or view.
   */
  const startEvaluateDecision = (decision: InvestmentDecision) => {
    // 只能评估已完成的决策
    if (!decision.completed) {
      setError(language === 'zh' ? '只能评估已完成的决策' : 'Can only evaluate completed decisions');
      return;
    }
    
    // 设置当前评估的决策
    setEvaluatingDecision(decision);
    setIsInvestmentEvaluationOpen(true);
  };

  /** 
   * Initializes a new investment decision process or loads an existing one for editing/viewing.
   * Sets the current decision, stage, and editing mode.
   * @param decisionId - Optional ID of an existing decision to load.
   */
  const startNewDecision = useCallback((decisionId?: string) => {
    if (!isLoggedIn) return; // Prevent if not logged in

    if (decisionId) {
      // Load existing decision
      const existingDecision = decisions.find((d) => d.id === decisionId);
      if (existingDecision) {
        setCurrentDecision(existingDecision);
        setCurrentStage(existingDecision.stage);
        // 如果决策已评估，则设置为只读模式（通过isEditing=false表示）
        // 否则设置为编辑模式（通过isEditing=true表示）
        setIsEditing(!existingDecision.evaluated);
      } else {
        setError(translations[language].decisionNotFound); // Set Error
        setCurrentDecision(null);
        setCurrentStage(1);
        setIsEditing(false);
      }
    } else {
      // Create a new decision
      const newDecision: InvestmentDecision = {
        id: `decision-${Date.now()}`, // Unique ID
        name: '',
        stage: 1,
        answers: {},
        completed: false,
      };
      setCurrentDecision(newDecision);
      setCurrentStage(1);
      setIsEditing(false);
    }
    setError(null); // Clear any previous errors
  }, [decisions, language, isLoggedIn]);

  // 取消当前决策编辑过程
  const cancelDecision = () => {
    // 如果当前有编辑中的决策，清除它
    setCurrentDecision(null);
    setCurrentStage(1);
    setIsEditing(false);
    setError(null);
  };


  const handleDeleteDecision = (decisionId: string) => {
    setDecisions(decisions.filter((d) => d.id !== decisionId));
    if (currentDecision?.id === decisionId) {
      setCurrentDecision(null);
      setCurrentStage(1);
    }
  };

  const handleLogout = async () => {
    await logOut();
    // Clear user data and decisions
    setDecisions([]);
    setCurrentDecision(null);
    setCurrentStage(1);
    localStorage.removeItem('investmentDecisions');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {translations[language].appName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <span className="text-gray-600 dark:text-gray-300">
                {translations[language].welcome}, {user?.name}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              title={language === 'en' ? '中文' : 'English'}
            >
              <Globe className="h-5 w-5" />
            </Button>
            {isLoggedIn ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Button onClick={() => setShowLogin(true)}>
                {translations[language].login}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <Card className="w-[350px] shadow-lg dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {translations[language].loginRegister}
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              {translations[language].enterCredentials}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                onClick={signInWithGoogle}
              >
                {translations[language].signInGoogle}
              </Button>
              <Button
                variant="outline"
                className="w-full text-gray-900 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={signInWithGitHub}
              >
                {translations[language].signInGitHub}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Dialog>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert">
            <strong className="font-bold">{translations[language].error}: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <X className="h-6 w-6 text-red-500" />
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  {translations[language].profile}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {translations[language].riskTolerance}:
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="relative group">
                      <p className="text-gray-900 dark:text-white cursor-help border-b border-dotted border-gray-500">
                        {/* Use riskTolerance (type) from user state and find the name from riskProfiles */}
                        {user?.riskTolerance
                          ? riskProfiles[user.riskTolerance]?.[language]?.name || user.riskTolerance
                          : ''}
                      </p>

                      {/* 悬浮提示 - Use riskAssessmentResult.type */}
                      <div className="absolute left-0 w-64 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg 
                                    opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                                    transition-all duration-300 z-10 -translate-y-full -mt-2">
                        {(() => {
                          if (!riskAssessmentResult?.type) {
                            return language === 'zh'
                              ? '点击"评估风险"按钮进行风险评估'
                              : 'Click "Assess Risk" button to evaluate risk';
                          }

                          const profileInfo = riskProfiles[riskAssessmentResult.type]?.[language];

                          return (
                            <>
                              <div className="font-bold mb-1">
                                {language === 'zh' ? '风险类型' : 'Risk Type'}: {profileInfo?.name || riskAssessmentResult.name}
                              </div>
                              <div className="mb-1">
                                {language === 'zh' ? '风险评分' : 'Risk Score'}: {riskAssessmentResult.score}
                              </div>
                              <div className="mb-1 text-xs">
                                {language === 'zh' ? '特征描述' : 'Description'}: {profileInfo?.description || riskAssessmentResult.description}
                              </div>
                              <div className="text-xs">
                                {language === 'zh' ? '投资建议' : 'Recommendation'}: {profileInfo?.recommendation || riskAssessmentResult.recommendation}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRiskAssessmentOpen(true)}
                      className="text-xs"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {language === 'zh' ? '评估风险' : 'Assess Risk'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {translations[language].preferredStrategies}:
                  </span>
                  <div className="relative group">
                    <p className="text-gray-900 dark:text-white cursor-help border-b border-dotted border-gray-500">
                      {/* Directly display user's preferred strategies */}
                      {user?.preferredStrategies && user.preferredStrategies.length > 0
                        ? user.preferredStrategies
                            .map(strategy => {
                              // Translate strategy names if possible
                              if (strategy === 'Value Investing') return translations[language].valueInvesting;
                              if (strategy === 'Growth Investing') return translations[language].growthInvesting;
                              if (strategy === 'Index Investing') return translations[language].indexInvesting;
                              if (strategy === 'Dollar-Cost Averaging') return translations[language].dollarCostAveraging;
                              if (strategy === 'Blue-Chip Investing') return translations[language].blueChipInvesting;
                              if (strategy === 'Conservative Investing') return translations[language].conservativeInvesting;
                              if (strategy === 'Bond Investing') return translations[language].bondInvesting;
                              return strategy; // Fallback to original name
                            })
                            .join(', ')
                        : translations[language].noPreferredStrategies}
                    </p>

                    {/* Keep the tooltip to show recommended strategies based on evaluation */}
                    <div className="absolute left-0 w-64 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg 
                                  opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                                  transition-all duration-300 z-10 -translate-y-full -mt-2">
                      {(() => {
                        const evaluatedDecisions = decisions.filter(d => d.completed && d.evaluated && d.evaluationScore !== undefined);
                        if (evaluatedDecisions.length === 0) {
                          return translations[language].strategyRecommendationHint;
                        }
                        const totalScore = evaluatedDecisions.reduce((sum, decision) => sum + (decision.evaluationScore || 0), 0);
                        const averageScore = Math.round(totalScore / evaluatedDecisions.length);
                        let ratingKey = 'high-risk';
                        if (averageScore >= 85) ratingKey = 'system';
                        else if (averageScore >= 70) ratingKey = 'stable';
                        else if (averageScore >= 55) ratingKey = 'cautious';
                        const ratingTranslations: Record<string, string> = {
                          'system': language === 'zh' ? '系统性' : 'Systematic',
                          'stable': language === 'zh' ? '稳健型' : 'Stable',
                          'cautious': language === 'zh' ? '谨慎型' : 'Cautious',
                          'high-risk': language === 'zh' ? '高风险型' : 'High-risk'
                        };
                        const baseText = translations[language].strategyRecommendationBased;
                        return baseText
                          .replace('{0}', ratingTranslations[ratingKey])
                          .replace('{1}', averageScore.toString());
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-8 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  {translations[language].activeDecisions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {decisions.filter((d) => !d.completed || (d.completed && !d.evaluated)).length > 0 ? (
                  <ul className="space-y-2">
                    {decisions
                      .filter((d) => !d.completed || (d.completed && !d.evaluated))
                      .map((decision) => (
                        <li
                          key={decision.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => startNewDecision(decision.id)}
                        >
                          <span className="text-gray-900 dark:text-white">
                            {decision.name ||
                              `${translations[language].decisionName} ${decision.id.slice(
                                -4
                              )}`}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    {translations[language].noActiveDecisions}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="mt-8 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  {translations[language].completedDecisions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {decisions.filter((d) => d.completed && d.evaluated).length > 0 ? (
                  <ul className="space-y-2">
                    {decisions
                      .filter((d) => d.completed && d.evaluated)
                      .map((decision) => (
                        <li
                          key={decision.id}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-200 dark:bg-gray-700"
                        >
                          <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-white truncate">
                              {decision.name ||
                                `${translations[language].decisionName} ${decision.id.slice(
                                  -4
                                )}`}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {language === 'zh' ? '评分' : 'Score'}: {decision.evaluationScore}
                            </span>
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    {translations[language].noCompletedDecisions}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <AnimatePresence>
              {currentDecision ? (
                <InvestmentCheckpoint
                  currentDecision={currentDecision}
                  isEditing={isEditing}
                  isSaving={isSaving}
                  language={language}
                  readOnly={currentDecision?.evaluated} // 如果决策已评估，则设置为只读模式
                  onSave={async (decision) => {
                    setIsSaving(true);
                    try {
                      const saveResult = await saveData(decision);
                      if (saveResult.success) {
                        if (isEditing) {
                          setDecisions(decisions.map((d) => (d.id === decision.id ? decision : d)));
                        } else {
                          setDecisions([...decisions, decision]);
                        }
                        setCurrentDecision(null);
                        setCurrentStage(1);
                        setIsEditing(false);
                      }
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onCancel={cancelDecision}
                  onDelete={handleDeleteDecision}
                />
              ) : (
                <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">
                      {translations[language].decisionJournal}
                    </CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                      {translations[language].decisionSummary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 text-gray-900 dark:text-white">
                      {translations[language].youHaveMade}{' '}
                      <span className="font-semibold">{decisions.length}</span>{' '}
                      {translations[language].decisions},{' '}
                      <span className="font-semibold">
                        {decisions.filter((d) => d.completed).length}
                      </span>{' '}
                      {translations[language].areCompleted}
                    </div>
                    {decisions.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        {translations[language].noDecisionsRecorded}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {decisions.slice().reverse().map((decision) => (
                          <Card
                            key={decision.id}
                            className={cn(
                              'p-4 rounded-md',
                              decision.completed && decision.evaluated
                                ? 'bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-700'
                                : decision.completed && !decision.evaluated
                                ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-400 dark:border-blue-700'
                                : 'bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-700',
                              'flex justify-between items-center'
                            )}
                          >
                            <div className="flex flex-col">

                              <span className="text-gray-900 dark:text-white font-medium">
                                {decision.name ||
                                  `${translations[language].decisionName} ${decision.id.slice(
                                    -4
                                  )}`}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {translations[language].stage}: {decision.stage}/7
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {decision.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                              )}
                              <div className="flex gap-2">
                                {/* 查看/编辑按钮 */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startNewDecision(decision.id)}
                                  title={decision.evaluated ? (language === 'zh' ? '已评估的决策只能查看不能编辑' : 'Evaluated decisions can only be viewed, not edited') : ''}
                                  className={cn(
                                    'text-gray-900 dark:text-white',
                                    decision.completed
                                      ? 'bg-green-300/50 hover:bg-green-400/50 dark:bg-green-700/50 dark:hover:bg-green-600/50'
                                      : 'bg-yellow-300/50 hover:bg-yellow-400/50 dark:bg-yellow-700/50 dark:hover:bg-yellow-600/50'
                                  )}
                                >
                                  {decision.completed 
                                    ? (language === 'zh' ? '查看决策' : 'View Decision')
                                    : translations[language].editDecision}
                                </Button>
                                
                                {/* 评估按钮 - 仅对已完成决策显示 */}
                                {decision.completed && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEvaluateDecision(decision)}
                                    className={cn(
                                      'text-gray-900 dark:text-white',
                                      decision.evaluated
                                        ? 'bg-blue-300/50 hover:bg-blue-400/50 dark:bg-blue-700/50 dark:hover:bg-blue-600/50'
                                        : 'bg-purple-300/50 hover:bg-purple-400/50 dark:bg-purple-700/50 dark:hover:bg-purple-600/50'
                                    )}
                                  >
                                    {decision.evaluated
                                      ? (language === 'zh' ? '查看评估' : 'View Evaluation')
                                      : (language === 'zh' ? '评估决策' : 'Evaluate')}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => startNewDecision()}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                      {translations[language].newInvestmentCheckpoint}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 风险评估组件 */}
      <RiskAssessment
        isOpen={isRiskAssessmentOpen}
        onClose={() => setIsRiskAssessmentOpen(false)}
        language={language}
        onComplete={handleRiskAssessmentComplete}
      />
      
      {/* 投资评估组件 */}
      {isInvestmentEvaluationOpen && evaluatingDecision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <InvestmentEvaluation
              decision={evaluatingDecision}
              language={language}
              onComplete={handleInvestmentEvaluationComplete}
              onClose={() => {
                setIsInvestmentEvaluationOpen(false);
                setEvaluatingDecision(null);
              }}
              translations={translations}
              apiKey={apiKey}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
