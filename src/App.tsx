/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
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
import {
  signInWithGoogle,
  signInWithGitHub,
  signUpOrSignIn,
  signInWithEmail,
  logOut,
  auth,
} from './lib/firebase';
import { storageService, UserProfileIndex, DecisionSummary } from './lib/storage';
import { onAuthStateChanged, fetchSignInMethodsForEmail, sendPasswordResetEmail } from 'firebase/auth';

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

const authErrorMessages: Record<string, { en: string; zh: string }> = {
  'auth/invalid-email': {
    en: 'Invalid email address.',
    zh: '无效的电子邮件地址。',
  },
  'auth/user-not-found': {
    en: 'User not found.',
    zh: '用户不存在。',
  },
  'auth/wrong-password': {
    en: 'Incorrect password.',
    zh: '密码错误。',
  },
  'auth/email-already-in-use': {
    en: 'Email already in use.',
    zh: '电子邮件已被使用。',
  },
};

const App: React.FC = () => {
  // State Variables
  /** User profile information loaded from Firebase auth. */
  const [user, setUser] = useState<UserProfile | UserProfileIndex | null>(null);
  /** The currently active (being edited or viewed) investment decision. */
  const [currentDecision, setCurrentDecision] = useState<InvestmentDecision | null>(null);
  /** List of all investment decision summaries made by the user. Loaded from Firebase Storage. */
  const [decisionSummaries, setDecisionSummaries] = useState<DecisionSummary[]>([]);
  /** Cache for complete investment decisions (lazy loaded) */
  const [decisionsCache, setDecisionsCache] = useState<Map<string, InvestmentDecision>>(new Map());
  /** LRU cache keys to track usage order */
  const [lruKeys, setLruKeys] = useState<string[]>([]);
  /** Maximum cache size */
  const MAX_CACHE_SIZE = 50;
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInMethods, setSignInMethods] = useState<string[]>([]);
  /** Controls the visibility of the Risk Assessment modal/component. */
  const [isRiskAssessmentOpen, setIsRiskAssessmentOpen] = useState(false);
  /** Stores the result from the completed risk assessment. */
  const [riskAssessmentResult, setRiskAssessmentResult] = useState<RiskAssessmentResult | null>(null);
  /** Controls the visibility of the Investment Evaluation modal/component. */
  const [isInvestmentEvaluationOpen, setIsInvestmentEvaluationOpen] = useState(false);
  /** The decision currently being evaluated or whose results are being viewed. */
  const [evaluatingDecision, setEvaluatingDecision] = useState<InvestmentDecision | null>(null);
  /** Loading state for lazy loading complete decision data */
  const [loadingDecisionId, setLoadingDecisionId] = useState<string | null>(null);
  /** Loading state for social login buttons */
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGitHub, setLoadingGitHub] = useState(false);
  /** Track pending requests to prevent duplicates */
  const pendingRequests = useRef<Map<string, Promise<InvestmentDecision | null>>>(new Map());
  /** Stores the DeepSeek API key, loaded from environment variables. */
  const [apiKey, setApiKey] = useState<string>(deepSeekApiKey);

  // Listen for Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        
        // Load user profile index (partial data for fast loading)
        let userProfileIndex = await storageService.loadUserProfileIndex(uid);
        
        // If no profile exists, create one
        if (!userProfileIndex) {
          const fullProfile = {
            id: uid,
            name: firebaseUser.displayName || firebaseUser.email || 'User',
            riskTolerance: 'steady',
            preferredStrategies: [],
          };
          await storageService.saveUserProfile(uid, fullProfile);
          userProfileIndex = {
            id: fullProfile.id,
            name: fullProfile.name,
            riskTolerance: fullProfile.riskTolerance,
            preferredStrategies: fullProfile.preferredStrategies
          };
        }
        
        setUser(userProfileIndex);
        
        // Load user's decision summaries from Firebase Storage (partial data)
        try {
          const summaries = await storageService.loadDecisionSummaries(uid);
          setDecisionSummaries(summaries);
        } catch (error) {
          console.error('Error loading decision summaries from Firebase Storage:', error);
          setDecisionSummaries([]);
        }
        
        // Load user's risk assessment summaries from Firebase Storage (partial data)
        try {
          const riskSummaries = await storageService.loadRiskAssessmentSummaries(uid);
          if (riskSummaries.length > 0) {
            // Use the most recent risk assessment
            const latestSummary = riskSummaries[riskSummaries.length - 1];
            // Load complete data for the latest assessment only
            const fullAssessment = await storageService.loadRiskAssessment(uid, latestSummary.id);
            if (fullAssessment) {
              setRiskAssessmentResult(fullAssessment);
            }
          }
        } catch (error) {
          console.error('Error loading risk assessment summaries from Firebase Storage:', error);
        }

        
        setShowLogin(false);
      } else {
        setUser(null);
        setDecisionSummaries([]);
        clearCache();
      }
      setIsLoggedIn(!!firebaseUser);
    });
    return () => unsubscribe();
  }, []);
  
  
  // Save decisions to Firebase Storage whenever they change
  useEffect(() => {
    const saveDecisions = async () => {
      if (user && decisionsCache.size > 0) {
        try {
          // Save all cached decisions to Firebase Storage
          for (const decision of decisionsCache.values()) {
            await storageService.saveInvestmentDecision(user.id, decision);
          }
        } catch (error) {
          console.error('Error saving decisions to Firebase Storage:', error);
        }
      }
    };
    
    saveDecisions();
  }, [decisionsCache, user]);

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
  const handleRiskAssessmentComplete = async (result: RiskAssessmentResult) => {
    // 保存完整的风险评估结果
    setRiskAssessmentResult(result);

    // 更新用户风险承受能力 - 使用 type 标识符
    if (user) {
      const updatedUser = {
        ...user,
        riskTolerance: result.type // 使用与语言无关的 type
      };
      
      // Save updated user profile to Firebase Storage
      try {
        await storageService.saveUserProfile(user.id, updatedUser);
        setUser(updatedUser);
        
        // Save risk assessment result to Firebase Storage
        await storageService.saveRiskAssessment(user.id, result);
      } catch (error) {
        console.error('Error saving user profile:', error);
        setError(language === 'zh' ? '保存用户档案失败' : 'Failed to save user profile');
      }
    }
  };
  
  /**
   * Callback triggered when the Investment Evaluation component completes.
   * Updates the evaluated decision with the results and closes the evaluation modal.
   * @param result - The evaluation result object.
   */
  const handleInvestmentEvaluationComplete = async (result: EvaluationResult) => {
    if (!evaluatingDecision || !user) return;
    
    try {
      // 更新决策的评估结果
      const updatedDecision: InvestmentDecision = {
        ...evaluatingDecision,
        evaluated: true,
        evaluationScore: result.totalScore,
        evaluationResult: result
      };
      
      // Save decision evaluation to Firebase Storage
      await storageService.saveDecisionEvaluation(user.id, evaluatingDecision.id, result);
      await storageService.saveInvestmentDecision(user.id, updatedDecision);
      
      // 更新决策缓存和摘要
      manageCache(updatedDecision.id, updatedDecision);
      
      // Update summary
      const updatedSummary: DecisionSummary = {
        id: updatedDecision.id,
        name: updatedDecision.name,
        stage: updatedDecision.stage,
        completed: updatedDecision.completed,
        evaluated: updatedDecision.evaluated,
        evaluationScore: updatedDecision.evaluationScore
      };
      await storageService.saveDecisionSummary(user.id, updatedSummary);
      
      setDecisionSummaries(prev => prev.map(d => d.id === updatedDecision.id ? updatedSummary : d));
      
      // 关闭评估模态框
      setIsInvestmentEvaluationOpen(false);
      setEvaluatingDecision(null);
    } catch (error) {
      console.error('Error saving evaluation result:', error);
      setError(language === 'zh' ? '保存评估结果失败' : 'Failed to save evaluation result');
    }
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
   * Manage cache with LRU eviction policy
   */
  const manageCache = useCallback((decisionId: string, decision: InvestmentDecision | null) => {
    if (!decision) return; // Don't cache null/undefined decisions
    
    setLruKeys(prevLruKeys => {
      // Move the key to the end of the array to mark it as recently used
      const newLruKeys = prevLruKeys.filter(key => key !== decisionId);
      newLruKeys.push(decisionId);

      let keyToEvict: string | undefined;
      // If cache exceeds max size, determine which key to evict
      if (newLruKeys.length > MAX_CACHE_SIZE) {
        keyToEvict = newLruKeys.shift(); // Evict the least recently used key
      }

      setDecisionsCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.set(decisionId, decision);
        if (keyToEvict) {
          newCache.delete(keyToEvict);
        }
        return newCache;
      });

      return newLruKeys;
    });
  }, [MAX_CACHE_SIZE]);

  /**
   * Clear cache
   */
  const clearCache = () => {
    setDecisionsCache(new Map());
    setLruKeys([]);
  };

  /**
   * Load complete decision data (lazy loading) with request deduplication
   */
  const loadCompleteDecision = useCallback(async (decisionId: string): Promise<InvestmentDecision | null> => {
    // Check cache first
    if (decisionsCache.has(decisionId)) {
      // Update LRU tracking when accessing cached item
      setLruKeys(prevKeys => {
        const newKeys = prevKeys.filter(key => key !== decisionId);
        return [...newKeys, decisionId];
      });
      return decisionsCache.get(decisionId) || null;
    }
    
    // Check if request is already in progress
    if (pendingRequests.current.has(decisionId)) {
      return pendingRequests.current.get(decisionId) || null;
    }
    
    setLoadingDecisionId(decisionId);
    
    // Create the request promise
    const requestPromise = (async () => {
      try {
        if (!user) return null;
        
        const completeDecision = await storageService.loadInvestmentDecision(user.id, decisionId);
        if (completeDecision) {
          // Use managed cache to add with LRU policy
          manageCache(decisionId, completeDecision);
          return completeDecision;
        }
        return null;
      } catch (error) {
        console.error('Error loading complete decision:', error);
        return null;
      } finally {
        setLoadingDecisionId(null);
        pendingRequests.current.delete(decisionId);
      }
    })();
    
    // Store the promise to prevent duplicate requests
    pendingRequests.current.set(decisionId, requestPromise);
    
    return requestPromise;
  }, [decisionsCache, user, manageCache]);


  /**
   * Handle Google login with loading state
   */
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      const message =
        error.message ||
        translations[language].anErrorOccurred;
      setError(message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  /**
   * Handle GitHub login with loading state
   */
  const handleGitHubLogin = async () => {
    setLoadingGitHub(true);
    setError(null);
    try {
      await signInWithGitHub();
    } catch (error: any) {
      const message =
        error.message ||
        translations[language].anErrorOccurred;
      setError(message);
    } finally {
      setLoadingGitHub(false);
    }
  };

  const handleAuthAction = async (authFunction: (email: string, password: string) => Promise<any>) => {
    if (!email || !password) {
      setError(translations[language].enterCredentials);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authFunction(email, password);
      // `onAuthStateChanged` will handle successful login/registration, closing the dialog.
    } catch (error: any) {
      const message =
        (error.code && authErrorMessages[error.code]?.[language]) ||
        error.message ||
        translations[language].anErrorOccurred;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      setError(translations[language].resetEmailSent);
    } catch (error: any) {
      const message =
        (error.code && authErrorMessages[error.code]?.[language]) ||
        error.message ||
        translations[language].anErrorOccurred;
      setError(message);
    }
  };

  const handleEmailBlur = async () => {
    if (!email) return;
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      setSignInMethods(methods);
    } catch (error: any) {
      const message =
        (error.code && authErrorMessages[error.code]?.[language]) ||
        error.message ||
        translations[language].anErrorOccurred;
      setError(message);
      setSignInMethods([]);
    }
  };

  /** 
   * Initializes a new investment decision process or loads an existing one for editing/viewing.
   * Sets the current decision, stage, and editing mode.
   * @param decisionId - Optional ID of an existing decision to load.
   */
  const startNewDecision = useCallback(async (decisionId?: string) => {
    if (!isLoggedIn) return; // Prevent if not logged in

    if (decisionId) {
      // Load existing decision (lazy load)
      const existingDecision = await loadCompleteDecision(decisionId);
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
  }, [isLoggedIn, language, loadCompleteDecision]);

  // 取消当前决策编辑过程
  const cancelDecision = () => {
    // 如果当前有编辑中的决策，清除它
    setCurrentDecision(null);
    setCurrentStage(1);
    setIsEditing(false);
    setError(null);
  };


  const handleDeleteDecision = async (decisionId: string) => {
    if (user) {
      try {
        // Delete from Firebase Storage
        await storageService.deleteInvestmentDecision(user.id, decisionId);
        // Also delete summary
        try {
          await storageService.deleteDecisionSummary(user.id, decisionId);
        } catch (error) {
          console.warn('Failed to delete decision summary:', error);
        }
        // Update local state
        setDecisionSummaries(decisionSummaries.filter((d) => d.id !== decisionId));
        setDecisionsCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(decisionId);
          return newCache;
        });
        // Also remove from LRU tracking
        setLruKeys(prev => prev.filter(key => key !== decisionId));
        if (currentDecision?.id === decisionId) {
          setCurrentDecision(null);
          setCurrentStage(1);
        }
      } catch (error) {
        console.error('Error deleting decision:', error);
        setError(language === 'zh' ? '删除决策失败' : 'Failed to delete decision');
      }
    }
  };

  const handleLogout = async () => {
    await logOut();
    // Clear user data and decisions
    setDecisionSummaries([]);
    clearCache();
    setCurrentDecision(null);
    setCurrentStage(1);
    setUser(null);
    // Note: We don't clear localStorage as it contains app settings
  };

  const providerDetails = [
    { id: 'github.com', name: 'GitHub', message: translations[language].emailRegisteredWithGithub },
    { id: 'google.com', name: 'Google', message: translations[language].emailRegisteredWithGoogle },
  ];

  const foundProvider = providerDetails.find(p => signInMethods.includes(p.id));

  const providerMessage = foundProvider
    ? `${foundProvider.message} ${translations[language].continueWithProvider.replace('{0}', foundProvider.name)}`
    : '';

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
              <Button onClick={() => setShowLogin(true)} data-testid="login-button">
                {translations[language].login}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <Card className="w-[350px] shadow-lg bg-white dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {translations[language].loginRegister}
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              {translations[language].enterCredentials}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {providerMessage && (
              <div className="mb-4 p-2 text-sm bg-blue-100 border border-blue-400 text-blue-700 rounded">
                {providerMessage}
              </div>
            )}
            <div className="space-y-4">
              <Input
                type="email"
                placeholder={translations[language].email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                className="text-gray-900 dark:text-white dark:bg-gray-700"
              />
              <Input
                type="password"
                placeholder={translations[language].password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-gray-900 dark:text-white dark:bg-gray-700"
              />
              {signInMethods.includes('password') && (
                <Button variant="link" className="p-0" onClick={handlePasswordReset}>
                  {translations[language].forgotPassword}
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white dark:bg-green-700 dark:hover:bg-green-800"
                  onClick={() => handleAuthAction(signUpOrSignIn)}
                  disabled={isLoading}
                >
                  {translations[language].register}
                </Button>
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                  onClick={() => handleAuthAction(signInWithEmail)}
                  disabled={isLoading}
                >
                  {translations[language].login}
                </Button>
              </div>
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                onClick={handleGoogleLogin}
                disabled={loadingGoogle}
              >
                {loadingGoogle ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    {translations[language].signInGoogle}
                  </div>
                ) : (
                  translations[language].signInGoogle
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full text-gray-900 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={handleGitHubLogin}
                disabled={loadingGitHub}
              >
                {loadingGitHub ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2" />
                    {translations[language].signInGitHub}
                  </div>
                ) : (
                  translations[language].signInGitHub
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Dialog>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        {!isLoggedIn && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded" role="alert">
            {translations[language].loginReminder}
          </div>
        )}
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
                        const evaluatedDecisions = Array.from(decisionsCache.values() as InvestmentDecision[]).filter(d => d.completed && d.evaluated && d.evaluationScore !== undefined);
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
                {decisionSummaries.filter((d) => !d.completed || (d.completed && !d.evaluated)).length > 0 ? (
                  <ul className="space-y-2">
                    {decisionSummaries
                      .filter((d) => !d.completed || (d.completed && !d.evaluated))
                      .map((summary) => (
                        <li
                          key={summary.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => startNewDecision(summary.id)}
                        >
                          <span className="text-gray-900 dark:text-white">
                            {summary.name ||
                              `${translations[language].decisionName} ${summary.id.slice(
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
                {decisionSummaries.filter((d) => d.completed && d.evaluated).length > 0 ? (
                  <ul className="space-y-2">
                    {decisionSummaries
                      .filter((d) => d.completed && d.evaluated)
                      .map((summary) => (
                        <li
                          key={summary.id}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-200 dark:bg-gray-700"
                        >
                          <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-white truncate">
                              {summary.name ||
                                `${translations[language].decisionName} ${summary.id.slice(
                                  -4
                                )}`}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {language === 'zh' ? '评分' : 'Score'}: {summary.evaluationScore}
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
                      if (user) {
                        // Save to Firebase Storage
                        await storageService.saveInvestmentDecision(user.id, decision);

                        // Create and save summary
                        const summary: DecisionSummary = {
                          id: decision.id,
                          name: decision.name,
                          stage: decision.stage,
                          completed: decision.completed,
                          evaluated: decision.evaluated,
                          evaluationScore: decision.evaluationScore
                        };
                        await storageService.saveDecisionSummary(user.id, summary);
                        
                        if (isEditing) {
                          manageCache(decision.id, decision);
                          // Update summary
                          setDecisionSummaries(prev => prev.map(d => d.id === decision.id ? summary : d));
                        } else {
                          manageCache(decision.id, decision);
                          // Add new summary
                          setDecisionSummaries(prev => [...prev, summary]);
                        }
                        setCurrentDecision(null);
                        setCurrentStage(1);
                        setIsEditing(false);
                      } else {
                        throw new Error('User not authenticated');
                      }
                    } catch (error) {
                      console.error('Error saving decision:', error);
                      setError(language === 'zh' ? '保存决策失败' : 'Failed to save decision');
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
                      <span className="font-semibold">{decisionSummaries.length}</span>{' '}
                      {translations[language].decisions},{' '}
                      <span className="font-semibold">
                        {decisionSummaries.filter((d) => d.completed).length}
                      </span>{' '}
                      {translations[language].areCompleted}
                    </div>
                    {decisionSummaries.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        {translations[language].noDecisionsRecorded}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {decisionSummaries.slice().reverse().map((summary) => (
                          <Card
                            key={summary.id}
                            className={cn(
                              'p-4 rounded-md',
                              summary.completed && summary.evaluated
                                ? 'bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-700'
                                : summary.completed && !summary.evaluated
                                ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-400 dark:border-blue-700'
                                : 'bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-700',
                              'flex justify-between items-center'
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="text-gray-900 dark:text-white font-medium">
                                {summary.name ||
                                  `${translations[language].decisionName} ${summary.id.slice(
                                    -4
                                  )}`}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {translations[language].stage}: {summary.stage}/7
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {summary.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                              )}
                              <div className="flex gap-2">
                                {/* 查看/编辑按钮 */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startNewDecision(summary.id)}
                                  title={summary.evaluated ? (language === 'zh' ? '已评估的决策只能查看不能编辑' : 'Evaluated decisions can only be viewed, not edited') : ''}
                                  className={cn(
                                    'text-gray-900 dark:text-white',
                                    summary.completed
                                      ? 'bg-green-300/50 hover:bg-green-400/50 dark:bg-green-700/50 dark:hover:bg-green-600/50'
                                      : 'bg-yellow-300/50 hover:bg-yellow-400/50 dark:bg-yellow-700/50 dark:hover:bg-yellow-600/50'
                                  )}
                                  disabled={loadingDecisionId === summary.id}
                                >
                                  {loadingDecisionId === summary.id ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                  ) : summary.completed 
                                    ? (language === 'zh' ? '查看决策' : 'View Decision')
                                    : translations[language].editDecision}
                                </Button>
                                
                                {/* 评估按钮 - 仅对已完成决策显示 */}
                                {summary.completed && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                      onClick={async () => {
                                      const fullDecision = await loadCompleteDecision(summary.id);
                                      if (fullDecision) {
                                        startEvaluateDecision(fullDecision);
                                      }
                                    }}
                                    className={cn(
                                      'text-gray-900 dark:text-white',
                                      summary.evaluated
                                        ? 'bg-blue-300/50 hover:bg-blue-400/50 dark:bg-blue-700/50 dark:hover:bg-blue-600/50'
                                        : 'bg-purple-300/50 hover:bg-purple-400/50 dark:bg-purple-700/50 dark:hover:bg-purple-600/50'
                                    )}
                                  >
                                    {summary.evaluated
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
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl">
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
