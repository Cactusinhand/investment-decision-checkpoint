/** @jsxImportSource react */
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card';
import {
  CheckCircle,
  ChevronRight,
  GripVertical,
  Loader2,
  Save,
  ListChecks,
  BookOpen,
  BarChart,
  User,
  LogOut,
  AlertTriangle,
  Check,
  X,
  Edit,
  Trash2,
  Sun,
  Moon,
  Laptop,
  Globe,
  AlertCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data & Types
interface UserProfile {
  id: string;
  name: string;
  riskTolerance: string;
  preferredStrategies: string[];
}

interface InvestmentDecision {
  id: string;
  name: string;
  stage: number;
  answers: Record<string, any>;
  completed: boolean;
  reviewScheduled?: string; // ISO Date String
}

// Mock Questions for each stage.
// In a real app, these would come from a database or a configuration file.
interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  options?: string[]; // For select and checkbox
  required: boolean;
  help?: string; // 添加帮助文本字段，用于提供填写指导
  terms?: string[]; // 添加术语字段，用于提供专业术语解释
}

// 添加问题的中文翻译
const questionTranslations = {
  // 阶段1: 目标与风险
  'What are your primary investment goals?': '您的主要投资目标是什么？',
  'What is your time horizon for this investment?': '您的投资期限是多久？',
  'How would you describe your risk tolerance?': '您的风险承受能力是？',
  'What are your liquidity needs for this investment?': '您的流动性需求是什么？',

  // 阶段2: 投资方法
  'Which investment method(s) will you use?': '您将使用哪种投资方法？',
  'Why do you believe this method is suitable for your goals?': '为什么您认为这种方法适合您的目标？',
  'What are the key metrics you will use to evaluate potential investments?': '您将使用哪些关键指标来评估潜在投资？',

  // 阶段3: 买卖规则
  'What specific criteria will trigger a buy decision?': '什么具体标准将触发买入决策？',
  'What specific criteria will trigger a sell decision (profit taking)?': '什么具体标准将触发获利卖出决策？',
  'What specific criteria will trigger a sell decision (loss mitigation)?': '什么具体标准将触发止损卖出决策？',
  'How will you manage position sizing?': '您将如何管理仓位？',

  // 阶段4: 风险管理
  'What are the major risks associated with this investment?': '与这项投资相关的主要风险是什么？',
  'How will you monitor these risks?': '您将如何监控这些风险？',
  'What methods will you use to mitigate these risks?': '您将使用哪些方法来降低这些风险？',
  'What is the maximum potential loss you are willing to accept?': '您愿意接受的最大潜在损失是多少？',

  // 阶段5: 信息验证
  'What sources of information will you use for research?': '您将使用哪些信息来源进行研究？',
  'How will you verify the accuracy of this information?': '您将如何验证这些信息的准确性？',
  'What are the key assumptions underlying your investment thesis?': '您的投资理论的关键假设是什么？',

  // 阶段6: 认知偏差自查
  'Are you anchoring on the initial purchase price?': '您是否依赖于初始购买价格？',
  'Are you overconfident in your ability to predict performance?': '您是否对预测表现的能力过于自信？',
  'Are you following the crowd (herd behavior)?': '您是否存在羊群效应？',
  'Are you ignoring potential losses?': '您是否忽视潜在损失？',
  'Have you considered opposing viewpoints?': '您是否考虑过相反观点？',
  'What measures will you take to address identified biases?': '您将采取哪些措施来解决已识别的偏见？',

  // 阶段7: 文档化与审查
  'Summarize your investment decision and rationale': '总结您的投资决策及其理由',
  'What potential factors could change your investment thesis?': '哪些潜在因素可能改变您的投资理论？',
  'When will you review this investment decision?': '您何时将审查这项投资决策？',
  'Who else will review this decision (if applicable)?': '谁将与您一起审核这个决策？',

  // 通用
  'Select an option': '选择一个选项',
  'For example': '例如',
};

// 添加专业术语解释对象
const termDefinitions = {
  en: {
    // 投资术语
    'investment goals': 'Specific financial objectives you want to achieve through investing, such as wealth preservation, income generation, or capital growth.',
    'time horizon': 'The length of time you expect to hold an investment before needing the funds.',
    'risk tolerance': 'Your ability and willingness to endure market volatility and potential losses.',
    'liquidity needs': 'How quickly you might need to convert your investments to cash without significant loss of value.',
    'fundamental analysis': 'An investment approach that evaluates securities by examining related economic, financial, and other qualitative/quantitative factors.',
    'technical analysis': 'A trading discipline that evaluates investments and identifies trading opportunities by analyzing statistical trends gathered from trading activity.',
    'quantitative analysis': 'The use of mathematical and statistical methods to evaluate investment opportunities and manage risk.',
    'passive investing': 'An investment strategy that aims to maximize returns by minimizing buying and selling, typically through index tracking.',
    'position sizing': 'The determination of how many shares or contracts to trade or how much money to allocate to a particular investment.',
    'stop-loss orders': 'An order placed with a broker to buy or sell a security when it reaches a certain price, designed to limit an investor\'s loss on a position.',
    'diversification': 'A risk management strategy that mixes a variety of investments within a portfolio to reduce exposure to any single asset or risk.',
    'options hedging': 'Using options contracts to protect against potential losses in an investment portfolio.',
    'herd behavior': 'The tendency of investors to follow and copy what other investors are doing, often ignoring rational analysis.',
    'anchoring bias': 'The tendency to rely too heavily on the first piece of information encountered (such as purchase price) when making decisions.',

    // 指标和比率
    'PE': 'Price-to-Earnings ratio, a valuation ratio that compares a company\'s share price to its earnings per share.',
    'PB': 'Price-to-Book ratio, a valuation metric that compares a company\'s market value to its book value.',
    'ROE': 'Return on Equity, a measure of financial performance calculated by dividing net income by shareholders\' equity.',
    'MACD': 'Moving Average Convergence Divergence, a trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price.',
    'RSI': 'Relative Strength Index, a momentum oscillator that measures the speed and change of price movements.',
    'volatility': 'A statistical measure of the dispersion of returns for a given security or market index, often measured using standard deviation.',
    'Sharpe ratio': 'A measure that indicates the average return earned in excess of the risk-free rate per unit of volatility or total risk.',
  },
  zh: {
    // 投资术语
    'investment goals': '投资目标：通过投资想要实现的特定财务目标，如财富保值、收入生成或资本增长。',
    'time horizon': '投资期限：在需要资金之前，预计持有投资的时长。',
    'risk tolerance': '风险承受能力：承受市场波动和潜在损失的能力和意愿。',
    'liquidity needs': '流动性需求：在不产生重大价值损失的情况下，将投资快速转换为现金的需求程度。',
    'fundamental analysis': '基本面分析：通过研究相关的经济、财务和其他定性/定量因素来评估证券的投资方法。',
    'technical analysis': '技术分析：通过分析从交易活动中收集的统计趋势来评估投资并识别交易机会的交易学科。',
    'quantitative analysis': '量化分析：使用数学和统计方法评估投资机会并管理风险的方法。',
    'passive investing': '被动投资：通过最小化买卖活动来最大化回报的投资策略，通常通过跟踪指数实现。',
    'position sizing': '仓位管理：确定交易多少股份或合约，或向特定投资分配多少资金的决策。',
    'stop-loss orders': '止损单：向经纪人下达的当证券达到某个价格时买入或卖出的订单，旨在限制投资者在某个头寸上的损失。',
    'diversification': '多元化：一种风险管理策略，在投资组合中混合各种投资，以减少对任何单一资产或风险的敞口。',
    'options hedging': '期权对冲：使用期权合约保护投资组合免受潜在损失的策略。',
    'herd behavior': '羊群效应：投资者倾向于跟随和模仿其他投资者的行为，通常忽视理性分析。',
    'anchoring bias': '锚定偏差：在决策时过度依赖首先获得的信息（如购买价格）的倾向。',

    // 指标和比率
    'PE': 'PE：市盈率，比较公司股价与每股收益的估值比率。',
    'PB': 'PB：市净率，比较公司市值与账面价值的估值指标。',
    'ROE': 'ROE：净资产收益率，通过净收入除以股东权益计算的财务绩效指标。',
    'MACD': 'MACD：移动平均线收敛/发散指标，一种趋势跟踪动量指标，显示证券价格两个移动平均线之间的关系。',
    'RSI': 'RSI：相对强弱指数，一种动量振荡器，测量价格变动的速度和变化。',
    'volatility': '波动率：给定证券或市场指数回报分散程度的统计度量，通常使用标准差衡量。',
    'Sharpe ratio': '夏普比率：每单位波动率或总风险获得的超过无风险收益率的平均回报指标。',
  }
};

// 英文和中文对应的帮助示例
const helpExamples = {
  en: {
    '1-1': 'Wealth preservation/8% annual return/accumulating funds for a specific project',
    '1-4': 'Need to liquidate 20% of position at any time/long-term lock-in with no short-term needs',
    '2-2': '"Quantitative analysis can avoid subjective bias, matching mid-to-long term return goals"',
    '2-3': 'PE/PB/ROE (fundamentals); MACD/RSI (technical); Volatility/Sharpe ratio (quantitative)',
    '3-1': 'Price breaks above 200-day moving average + RSI<30',
    '3-2': 'Reaching target price (e.g., PE>industry average by 20%)',
    '3-3': 'Breaking below support level (e.g., -15% from cost basis)',
    '3-4': 'Single investment ≤5% of total funds, dynamic rebalancing quarterly',
    '4-1': 'Regulatory changes/industry downcycle/liquidity drought',
    '4-2': 'Monthly tracking of industry policies/setting volatility alert thresholds',
    '4-4': '10% of total principal/30% of single investment',
    '5-2': 'Cross-reference multiple data sources/focus on audit opinions/verify historical prediction accuracy',
    '5-3': '"Industry growth rate maintains above 5%" or "monetary policy remains accommodative"',
    '6-6': 'Set mechanical stop-loss rules/introduce reverse viewpoint stress testing/force risk-reward ratio recording',
    '7-1': '"Based on industry recovery expectations, selecting undervalued high-dividend securities through quantitative screening, target holding period 2 years"',
    '7-2': 'Fed rate hikes beyond expectations/management changes/technological substitution emerging',
    '7-4': 'Investment committee/independent risk officer/financial advisor',
  },
  zh: {
    '1-1': '财富保值/年化8%收益/特定项目资金积累',
    '1-4': '需随时变现20%仓位/长期锁定无短期需求',
    '2-2': '"量化分析可规避主观偏差，匹配中长期收益目标"',
    '2-3': 'PE/PB/ROE（基本面）；MACD/RSI（技术面）；波动率/夏普比率（量化）',
    '3-1': '股价突破200日均线+RSI<30',
    '3-2': '达到目标价（如PE>行业均值20%）',
    '3-3': '跌破支撑位（如-15%成本价）',
    '3-4': '单笔投资≤总资金5%，动态再平衡每季度',
    '4-1': '政策监管变化/行业周期下行/流动性枯竭',
    '4-2': '月度跟踪行业政策/设置波动率预警阈值',
    '4-4': '总本金10%/单笔投资30%',
    '5-2': '交叉比对多源数据/关注审计意见/验证历史预测准确性',
    '5-3': '"行业年增长率保持5%以上"或"货币政策维持宽松"',
    '6-6': '设定机械止损规则/引入反向观点压力测试/强制记录风险收益比',
    '7-1': '"基于行业复苏预期，通过定量筛选低估值高分红标的，目标持有2年"',
    '7-2': '美联储加息超预期/公司管理层变动/技术替代出现',
    '7-4': '投资委员会/独立风控官/财务顾问',
  }
};

const rawQuestions: { [key: number]: Question[] } = {
  1: [
    {
      id: '1-1',
      text: 'What are your primary investment goals?',
      type: 'textarea',
      required: true,
      help: '例如：财富保值/年化8%收益/特定项目资金积累',
      terms: ['investment goals']
    },
    {
      id: '1-2',
      text: 'What is your time horizon for this investment?',
      type: 'radio',
      options: ['Short-term (<1 year)', 'Medium-term (1-5 years)', 'Long-term (>5 years)'],
      required: true,
      terms: ['time horizon']
    },
    {
      id: '1-3',
      text: 'How would you describe your risk tolerance?',
      type: 'radio',
      options: ['Conservative (fluctuation <10%)', 'Moderate (fluctuation 10-25%)', 'Aggressive (fluctuation >25%)'],
      required: true,
      terms: ['risk tolerance']
    },
    {
      id: '1-4',
      text: 'What are your liquidity needs for this investment?',
      type: 'textarea',
      required: true,
      help: '例如：需随时变现20%仓位/长期锁定无短期需求',
      terms: ['liquidity needs']
    },
  ],
  2: [
    {
      id: '2-1',
      text: 'Which investment method(s) will you use?',
      type: 'checkbox',
      options: ['Fundamental Analysis (financial reports, industry position)', 'Technical Analysis (trend lines, volume)', 'Quantitative Analysis (factor backtest)', 'Passive Investing (index tracking)'],
      required: true,
      terms: ['fundamental analysis', 'technical analysis', 'quantitative analysis', 'passive investing']
    },
    {
      id: '2-2',
      text: 'Why do you believe this method is suitable for your goals?',
      type: 'textarea',
      required: true,
      help: '例如："量化分析可规避主观偏差，匹配中长期收益目标"'
    },
    {
      id: '2-3',
      text: 'What are the key metrics you will use to evaluate potential investments?',
      type: 'textarea',
      required: true,
      help: '例如：PE/PB/ROE（基本面）；MACD/RSI（技术面）；波动率/夏普比率（量化）',
      terms: ['PE', 'PB', 'ROE', 'MACD', 'RSI', 'volatility', 'Sharpe ratio']
    },
  ],
  3: [
    {
      id: '3-1',
      text: 'What specific criteria will trigger a buy decision?',
      type: 'textarea',
      required: true,
      help: '例如：股价突破200日均线+RSI<30',
      terms: ['RSI']
    },
    {
      id: '3-2',
      text: 'What specific criteria will trigger a sell decision (profit taking)?',
      type: 'textarea',
      required: true,
      help: '例如：达到目标价（如PE>行业均值20%）',
      terms: ['PE']
    },
    {
      id: '3-3',
      text: 'What specific criteria will trigger a sell decision (loss mitigation)?',
      type: 'textarea',
      required: true,
      help: '例如：跌破支撑位（如-15%成本价）'
    },
    {
      id: '3-4',
      text: 'How will you manage position sizing?',
      type: 'textarea',
      required: true,
      help: '例如：单笔投资≤总资金5%，动态再平衡每季度',
      terms: ['position sizing']
    },
  ],
  4: [
    {
      id: '4-1',
      text: 'What are the major risks associated with this investment?',
      type: 'textarea',
      required: true,
      help: '例如：政策监管变化/行业周期下行/流动性枯竭'
    },
    {
      id: '4-2',
      text: 'How will you monitor these risks?',
      type: 'textarea',
      required: true,
      help: '例如：月度跟踪行业政策/设置波动率预警阈值',
      terms: ['volatility']
    },
    {
      id: '4-3',
      text: 'What methods will you use to mitigate these risks?',
      type: 'checkbox',
      options: ['Stop-loss Orders', 'Diversification (across 3+ unrelated industries)', 'Options Hedging'],
      required: true,
      terms: ['stop-loss orders', 'diversification', 'options hedging']
    },
    {
      id: '4-4',
      text: 'What is the maximum potential loss you are willing to accept?',
      type: 'text',
      required: true,
      help: '例如：总本金10%/单笔投资30%'
    },
  ],
  5: [
    {
      id: '5-1',
      text: 'What sources of information will you use for research?',
      type: 'checkbox',
      options: ['Company Filings', 'Bloomberg/Reuters Data', 'Analyst Reports', 'Independent Third-party Audits'],
      required: true
    },
    {
      id: '5-2',
      text: 'How will you verify the accuracy of this information?',
      type: 'textarea',
      required: true,
      help: '例如：交叉比对多源数据/关注审计意见/验证历史预测准确性'
    },
    {
      id: '5-3',
      text: 'What are the key assumptions underlying your investment thesis?',
      type: 'textarea',
      required: true,
      help: '例如："行业年增长率保持5%以上"或"货币政策维持宽松"'
    },
  ],
  6: [
    {
      id: '6-1',
      text: 'Are you anchoring on the initial purchase price?',
      type: 'radio',
      options: ['Yes', 'No'],
      required: true,
      terms: ['anchoring bias']
    },
    {
      id: '6-2',
      text: 'Are you overconfident in your ability to predict performance?',
      type: 'radio',
      options: ['Yes', 'No'],
      required: true
    },
    {
      id: '6-3',
      text: 'Are you following the crowd (herd behavior)?',
      type: 'radio',
      options: ['Yes', 'No'],
      required: true,
      terms: ['herd behavior']
    },
    {
      id: '6-4',
      text: 'Are you ignoring potential losses?',
      type: 'radio',
      options: ['Yes', 'No'],
      required: true
    },
    {
      id: '6-5',
      text: 'Have you considered opposing viewpoints?',
      type: 'radio',
      options: ['Yes', 'No'],
      required: true
    },
    {
      id: '6-6',
      text: 'What measures will you take to address identified biases?',
      type: 'textarea',
      required: true,
      help: '例如：设定机械止损规则/引入反向观点压力测试/强制记录风险收益比',
      terms: ['stop-loss orders']
    },
  ],
  7: [
    {
      id: '7-1',
      text: 'Summarize your investment decision and rationale',
      type: 'textarea',
      required: true,
      help: '例如："基于行业复苏预期，通过定量筛选低估值高分红标的，目标持有2年"'
    },
    {
      id: '7-2',
      text: 'What potential factors could change your investment thesis?',
      type: 'textarea',
      required: true,
      help: '例如：美联储加息超预期/公司管理层变动/技术替代出现'
    },
    {
      id: '7-3',
      text: 'When will you review this investment decision?',
      type: 'radio',
      options: ['Monthly', 'Quarterly', 'Event-driven (e.g., earnings release)'],
      required: true
    },
    {
      id: '7-4',
      text: 'Who else will review this decision (if applicable)?',
      type: 'text',
      required: false,
      help: '例如：投资委员会/独立风控官/财务顾问'
    },
  ],
};

// Translations
const translations = {
  en: {
    appName: 'Investment Decision App',
    loginRegister: 'Login / Register',
    enterCredentials: 'Enter your credentials to access the Investment Decision App.',
    email: 'Email',
    password: 'Password',
    register: 'Register',
    login: 'Login',
    welcome: 'Welcome',
    logout: 'Logout',
    profile: 'Profile',
    riskTolerance: 'Risk Tolerance',
    preferredStrategies: 'Preferred Strategies',
    activeDecisions: 'Active Decisions',
    noActiveDecisions: 'No active decisions.',
    completedDecisions: 'Completed Decisions',
    noCompletedDecisions: 'No completed decisions.',
    decisionSummary: 'Decision Summary',
    youHaveMade: 'You have made',
    decisions: 'investment decisions.',
    areCompleted: 'decisions are completed.',
    newInvestmentCheckpoint: 'New Investment Checkpoint',
    decisionJournal: 'Decision Journal',
    noDecisionsRecorded: 'No decisions recorded yet.',
    editDecision: 'Edit Decision',
    decisionName: 'Decision Name',
    stage: 'Stage',
    reviewScheduled: 'Review Scheduled',
    enterDecisionName: 'Enter decision name (required)',
    pleaseEnterDecisionName: 'Please enter a decision name.',
    previous: 'Previous',
    next: 'Next',
    completeDecision: 'Complete Decision',
    saving: 'Saving...',
    error: 'Error',
    pleaseAnswerAll: 'Please answer all required questions before proceeding.',
    failedToSave: 'Failed to save decision. Please try again.',
    anErrorOccurred: 'An error occurred while saving. Please check your connection.',
    decisionNotFound: 'Decision not found.',
    goalAndRisk: 'Goal & Risk Definition',
    investmentMethod: 'Investment Method Selection',
    buySellRules: 'Buy/Sell Rule Establishment',
    riskAssessment: 'Risk Assessment & Management',
    informationValidation: 'Information Validation',
    cognitiveBias: 'Cognitive Bias Checking',
    documentationReview: 'Documentation & Review',
    shortTerm: 'Short-term',
    mediumTerm: 'Medium-term',
    longTerm: 'Long-term',
    conservative: 'Conservative',
    moderate: 'Moderate',
    aggressive: 'Aggressive',
    fundamentalAnalysis: 'Fundamental Analysis',
    technicalAnalysis: 'Technical Analysis',
    quantitativeAnalysis: 'Quantitative Analysis',
    passiveInvesting: 'Passive Investing',
    companyFilings: 'Company Filings',
    financialNews: 'Financial News Outlets',
    analystReports: 'Analyst Reports',
    independentResearch: 'Independent Research',
    yes: 'Yes',
    no: 'No',
    stage1Title: 'Stage 1: Goal & Risk Definition',
    stage2Title: 'Stage 2: Investment Method Selection',
    stage3Title: 'Stage 3: Buy/Sell Rule Establishment',
    stage4Title: 'Stage 4: Risk Assessment & Management',
    stage5Title: 'Stage 5: Information Validation',
    stage6Title: 'Stage 6: Cognitive Bias Checking',
    stage7Title: 'Stage 7: Documentation & Review',
    shortTermWithPeriod: 'Short-term (<1 year)',
    mediumTermWithPeriod: 'Medium-term (1-5 years)',
    longTermWithPeriod: 'Long-term (>5 years)',
    conservativeWithDetail: 'Conservative (fluctuation <10%)',
    moderateWithDetail: 'Moderate (fluctuation 10-25%)',
    aggressiveWithDetail: 'Aggressive (fluctuation >25%)',
    fundamentalAnalysisWithDetail: 'Fundamental Analysis (financial reports, industry position)',
    technicalAnalysisWithDetail: 'Technical Analysis (trend lines, volume)',
    quantitativeAnalysisWithDetail: 'Quantitative Analysis (factor backtest)',
    passiveInvestingWithDetail: 'Passive Investing (index tracking)',
    stopLossOrders: 'Stop-loss Orders',
    diversification: 'Diversification (across 3+ unrelated industries)',
    optionsHedging: 'Options Hedging',
    companyFilingsDetail: 'Company Filings',
    bloombergReutersData: 'Bloomberg/Reuters Data',
    analystReportsDetail: 'Analyst Reports',
    independentThirdPartyAudits: 'Independent Third-party Audits',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    eventDriven: 'Event-driven (e.g., earnings release)',
    helpText: 'For example',
    selectOption: 'Select an option',
  },
  zh: {
    appName: '投资决策应用',
    loginRegister: '登录/注册',
    enterCredentials: '输入您的凭据以访问投资决策应用。',
    email: '电子邮件',
    password: '密码',
    register: '注册',
    login: '登录',
    welcome: '欢迎',
    logout: '登出',
    profile: '个人资料',
    riskTolerance: '风险承受能力',
    preferredStrategies: '偏好策略',
    activeDecisions: '进行中的决策',
    noActiveDecisions: '没有进行中的决策。',
    completedDecisions: '已完成的决策',
    noCompletedDecisions: '没有已完成的决策。',
    decisionSummary: '决策摘要',
    youHaveMade: '您已做出',
    decisions: '项投资决策。',
    areCompleted: '项决策已完成。',
    newInvestmentCheckpoint: '新的投资检查点',
    decisionJournal: '决策日志',
    noDecisionsRecorded: '尚未记录任何决策。',
    editDecision: '编辑决策',
    decisionName: '决策名称',
    stage: '阶段',
    reviewScheduled: '预定审查',
    enterDecisionName: '输入决策名称（必填）',
    pleaseEnterDecisionName: '请输入决策名称。',
    previous: '上一步',
    next: '下一步',
    completeDecision: '完成决策',
    saving: '保存中...',
    error: '错误',
    pleaseAnswerAll: '请先回答所有必填问题，然后再继续。',
    failedToSave: '无法保存决策。请重试。',
    anErrorOccurred: '保存时发生错误。请检查您的连接。',
    decisionNotFound: '找不到决策。',
    goalAndRisk: '目标与风险定义',
    investmentMethod: '投资方法选择',
    buySellRules: '买卖规则建立',
    riskAssessment: '风险评估与管理',
    informationValidation: '信息验证',
    cognitiveBias: '认知偏差检查',
    documentationReview: '文档与审查',
    shortTerm: '短期',
    mediumTerm: '中期',
    longTerm: '长期',
    conservative: '保守型',
    moderate: '适中型',
    aggressive: '激进型',
    fundamentalAnalysis: '基本面分析',
    technicalAnalysis: '技术分析',
    quantitativeAnalysis: '量化分析',
    passiveInvesting: '被动投资',
    companyFilings: '公司文件',
    financialNews: '财经新闻',
    analystReports: '分析师报告',
    independentResearch: '独立研究',
    yes: '是',
    no: '否',
    stage1Title: '阶段1：目标与风险定义',
    stage2Title: '阶段2：投资方法选择',
    stage3Title: '阶段3：买卖规则建立',
    stage4Title: '阶段4：风险评估与管理',
    stage5Title: '阶段5：信息验证',
    stage6Title: '阶段6：认知偏差自查',
    stage7Title: '阶段7：文档化与审查',
    shortTermWithPeriod: '短期（<1年）',
    mediumTermWithPeriod: '中期（1-5年）',
    longTermWithPeriod: '长期（>5年）',
    conservativeWithDetail: '保守型（波动<10%）',
    moderateWithDetail: '适中型（波动10-25%）',
    aggressiveWithDetail: '激进型（波动>25%）',
    fundamentalAnalysisWithDetail: '基本面分析（财报、行业地位）',
    technicalAnalysisWithDetail: '技术分析（趋势线、成交量）',
    quantitativeAnalysisWithDetail: '量化分析（因子回测）',
    passiveInvestingWithDetail: '被动投资（指数跟踪）',
    stopLossOrders: '止损单',
    diversification: '分散投资（跨3个非相关行业）',
    optionsHedging: '期权对冲',
    companyFilingsDetail: '公司年报',
    bloombergReutersData: '彭博/路透数据',
    analystReportsDetail: '卖方研报',
    independentThirdPartyAudits: '独立第三方审计',
    monthly: '月度',
    quarterly: '季度',
    eventDriven: '事件驱动（如财报发布）',
    helpText: '例如',
    selectOption: '选择一个选项',
  },
};

// Animation Variants
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
  exit: { opacity: 0, y: -50, transition: { duration: 0.3 } },
};

// 为阶段切换添加的动画
const stageVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -50, transition: { duration: 0.3, ease: "easeIn" } }
};

// Helper function to simulate saving data (replace with actual API calls)
const saveData = async (data: any) => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));
  // In a real app, you'd send this data to your backend
  console.log('Saving data:', data);
  return { success: true, data }; // Return a success/failure indicator
};

// 添加选项文本到翻译键的映射
const optionToTranslationKey: { [key: string]: string } = {
  'Short-term (<1 year)': 'shortTermWithPeriod',
  'Medium-term (1-5 years)': 'mediumTermWithPeriod',
  'Long-term (>5 years)': 'longTermWithPeriod',
  'Conservative (fluctuation <10%)': 'conservativeWithDetail',
  'Moderate (fluctuation 10-25%)': 'moderateWithDetail',
  'Aggressive (fluctuation >25%)': 'aggressiveWithDetail',
  'Fundamental Analysis (financial reports, industry position)': 'fundamentalAnalysisWithDetail',
  'Technical Analysis (trend lines, volume)': 'technicalAnalysisWithDetail',
  'Quantitative Analysis (factor backtest)': 'quantitativeAnalysisWithDetail',
  'Passive Investing (index tracking)': 'passiveInvestingWithDetail',
  'Stop-loss Orders': 'stopLossOrders',
  'Diversification (across 3+ unrelated industries)': 'diversification',
  'Options Hedging': 'optionsHedging',
  'Company Filings': 'companyFilingsDetail',
  'Bloomberg/Reuters Data': 'bloombergReutersData',
  'Analyst Reports': 'analystReportsDetail',
  'Independent Third-party Audits': 'independentThirdPartyAudits',
  'Monthly': 'monthly',
  'Quarterly': 'quarterly',
  'Event-driven (e.g., earnings release)': 'eventDriven',
  'Yes': 'yes',
  'No': 'no'
};

// 添加英文术语与中文术语的对照映射
const termTranslations: { [key: string]: string } = {
  // 英文 -> 中文
  'investment goals': '投资目标',
  'time horizon': '投资期限',
  'risk tolerance': '风险承受能力',
  'liquidity needs': '流动性需求',
  'fundamental analysis': '基本面分析',
  'technical analysis': '技术分析',
  'quantitative analysis': '量化分析',
  'passive investing': '被动投资',
  'position sizing': '仓位管理',
  'stop-loss orders': '止损单',
  'diversification': '分散投资',
  'options hedging': '期权对冲',
  'herd behavior': '羊群效应',
  'anchoring bias': '锚定偏差',
  'PE': 'PE',
  'PB': 'PB',
  'ROE': 'ROE',
  'MACD': 'MACD',
  'RSI': 'RSI',
  'volatility': '波动率',
  'Sharpe ratio': '夏普比率',
};

// 反向映射: 中文 -> 英文
const reverseTermTranslations: { [key: string]: string } = Object.entries(termTranslations).reduce(
  (acc, [en, zh]) => {
    acc[zh] = en;
    return acc;
  },
  {} as { [key: string]: string }
);

const App: React.FC = () => {
  // State
  const [user, setUser] = useState<UserProfile | null>({
    id: 'user123',
    name: 'John Doe',
    riskTolerance: 'Moderate',
    preferredStrategies: ['Value Investing', 'Growth Investing'],
  });
  const [currentDecision, setCurrentDecision] = useState<InvestmentDecision | null>(null);
  const [decisions, setDecisions] = useState<InvestmentDecision[]>([]); // Load from local storage
  const [currentStage, setCurrentStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState<'en' | 'zh'>('en'); // 'en' for English, 'zh' for Chinese
  const [translatedQuestions, setTranslatedQuestions] = useState<{ [key: number]: Question[] }>(rawQuestions);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Simulate logged-in state


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

  // Helper Functions

  // Initialize a new decision or load an existing one
  const startNewDecision = useCallback((decisionId?: string) => {
    if (!isLoggedIn) return; // Prevent if not logged in

    if (decisionId) {
      // Load existing decision
      const existingDecision = decisions.find((d) => d.id === decisionId);
      if (existingDecision) {
        setCurrentDecision(existingDecision);
        setCurrentStage(existingDecision.stage);
        setIsEditing(true);
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

  // Handle input changes within a stage
  const handleInputChange = (questionId: string, value: any) => {
    if (!currentDecision) return;

    setCurrentDecision((prev) =>
      prev
        ? {
          ...prev,
          answers: { ...prev.answers, [questionId]: value },
        }
        : null
    );
  };

  // Move to the next stage
  const handleNextStage = async () => {
    if (!currentDecision) return;

    // 验证决策名称是否已填写
    if (!currentDecision.name || currentDecision.name.trim() === '') {
      setError(translations[language].pleaseEnterDecisionName || '请输入决策名称');
      return;
    }

    // Basic validation: Check for required fields in the current stage
    const currentQuestions = translatedQuestions[currentStage] || [];
    const isCurrentStageValid = currentQuestions.every((q) => {
      if (q.required) {
        const answer = currentDecision.answers[q.id];
        if (q.type === 'checkbox') {
          return Array.isArray(answer) && answer.length > 0;
        }
        return answer !== undefined && answer !== null && answer !== '';
      }
      return true; // Optional questions are always valid
    });

    if (!isCurrentStageValid) {
      setError(translations[language].pleaseAnswerAll);
      return;
    }
    setError(null);

    if (currentStage < 7) {
      // Save current stage and move to next
      const updatedDecision: InvestmentDecision = {
        ...currentDecision,
        stage: currentStage + 1,
      };
      setCurrentDecision(updatedDecision);
      setCurrentStage(currentStage + 1);
    }
  };

  // Move to the previous stage
  const handlePreviousStage = () => {
    if (currentStage > 1 && currentDecision) {
      setCurrentDecision({ ...currentDecision, stage: currentStage - 1 });
      setCurrentStage(currentStage - 1);
    }
  };

  // Complete the decision-making process
  const handleCompleteDecision = async () => {
    if (!currentDecision) return;

    // 验证决策名称是否已填写
    if (!currentDecision.name || currentDecision.name.trim() === '') {
      setError(translations[language].pleaseEnterDecisionName || '请输入决策名称');
      return;
    }

    // Final validation
    const currentQuestions = translatedQuestions[7] || [];
    const isCurrentStageValid = currentQuestions.every((q) => {
      if (q.required) {
        const answer = currentDecision.answers[q.id];
        if (q.type === 'checkbox') {
          return Array.isArray(answer) && answer.length > 0;
        }
        return answer !== undefined && answer !== null && answer !== '';
      }
      return true; // Optional questions are always valid
    });

    if (!isCurrentStageValid) {
      setError(translations[language].pleaseAnswerAll);
      return;
    }
    setError(null);
    setLoading(true);
    setIsSaving(true);
    try {
      const completedDecision: InvestmentDecision = {
        ...currentDecision,
        completed: true,
      };

      // Save the completed decision
      const saveResult = await saveData(completedDecision); // Simulate API call
      if (saveResult.success) {
        if (isEditing) {
          // Update the existing decision
          setDecisions(
            decisions.map((d) => (d.id === completedDecision.id ? completedDecision : d))
          );
        } else {
          // Add new decision
          setDecisions([...decisions, completedDecision]);
        }

        setCurrentDecision(null);
        setCurrentStage(1);
        setIsEditing(false);
      } else {
        setError(translations[language].failedToSave);
      }
    } catch (err) {
      setError(translations[language].anErrorOccurred);
      console.error(err);
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  const handleDeleteDecision = (decisionId: string) => {
    setDecisions(decisions.filter((d) => d.id !== decisionId));
    if (currentDecision?.id === decisionId) {
      setCurrentDecision(null);
      setCurrentStage(1);
    }
  };

  const handleLogout = () => {
    // Clear user data and decisions
    setUser(null);
    setDecisions([]);
    setCurrentDecision(null);
    setCurrentStage(1);
    localStorage.removeItem('investmentDecisions');
    setIsLoggedIn(false); // Update login state
    // Redirect to login page (if applicable)
  };

  const getTranslatedText = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key];
  };

  // 修改renderTermWithTooltip函数
  const renderTermWithTooltip = (term: string) => {
    const termLower = term.toLowerCase();

    // 查找对应的术语定义
    let termDefinition;
    let displayTerm = term; // 保留显示的原始术语文本

    if (language === 'zh') {
      // 如果是中文环境，尝试找对应的中文术语解释
      termDefinition = termDefinitions.zh[termLower];

      // 如果没找到，可能是因为termLower是中文，需要转换为英文再查找
      if (!termDefinition && reverseTermTranslations[term]) {
        const enTerm = reverseTermTranslations[term].toLowerCase();
        termDefinition = termDefinitions.zh[enTerm];
      }

      // 如果仍未找到，尝试查找英文术语的中文描述
      if (!termDefinition) {
        Object.entries(termTranslations).forEach(([en, zh]) => {
          if (zh.toLowerCase() === termLower ||
            zh.includes(term) ||
            term.includes(zh)) {
            termDefinition = termDefinitions.zh[en.toLowerCase()];
          }
        });
      }
    } else {
      // 如果是英文环境，尝试找对应的英文术语解释
      termDefinition = termDefinitions.en[termLower];

      // 如果没找到，可能是因为termLower是英文，需要转换为中文再查找
      if (!termDefinition && termTranslations[termLower]) {
        const zhTerm = termTranslations[termLower].toLowerCase();
        termDefinition = termDefinitions.en[zhTerm];
      }

      // 如果仍未找到，尝试查找中文术语的英文描述
      if (!termDefinition) {
        Object.entries(reverseTermTranslations).forEach(([zh, en]) => {
          if (en.toLowerCase() === termLower ||
            en.includes(term) ||
            term.includes(en)) {
            termDefinition = termDefinitions.en[en.toLowerCase()];
          }
        });
      }
    }

    if (!termDefinition) return term;

    return (
      <span key={term} className="relative group inline-block">
        <span className="border-b border-dotted border-gray-500 cursor-help">
          {displayTerm}
        </span>
        <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute z-10 w-64 p-3 bg-white dark:bg-gray-800 text-sm rounded-md shadow-lg text-gray-800 dark:text-gray-200 -top-1 left-full ml-2 border border-gray-200 dark:border-gray-700 transition-opacity duration-200">
          {termDefinition}
        </span>
      </span>
    );
  };

  // 处理问题文本，识别并添加术语提示
  const renderTextWithTermTooltips = (text: string, terms?: string[]) => {
    if (!terms || terms.length === 0) return text;

    // 如果在中文环境下，对术语进行转换和扩展
    let effectiveTerms = [...terms];
    let additionalTerms: string[] = [];

    if (language === 'zh') {
      // 为英文术语添加对应的中文术语
      terms.forEach(term => {
        const termLower = term.toLowerCase();

        // 添加直接映射的中文术语
        if (termTranslations[termLower]) {
          additionalTerms.push(termTranslations[termLower]);
        }

        // 针对原文中可能包含的部分中文术语进行匹配
        Object.entries(termTranslations).forEach(([en, zh]) => {
          if (en.toLowerCase() === termLower) {
            // 查找部分匹配的中文术语
            const parts = zh.split(/[：（）\s]/); // 拆分中文术语（按各种可能的分隔符）
            parts.forEach(part => {
              if (part && part.length > 1 && !additionalTerms.includes(part)) {
                additionalTerms.push(part);
              }
            });
          }
        });
      });
    } else {
      // 为中文术语添加对应的英文术语
      terms.forEach(term => {
        if (reverseTermTranslations[term]) {
          additionalTerms.push(reverseTermTranslations[term]);
        }

        // 针对原文中可能包含的部分英文术语进行匹配
        Object.entries(reverseTermTranslations).forEach(([zh, en]) => {
          if (zh === term) {
            // 查找部分匹配的英文术语
            const parts = en.split(/[\-\s()]/); // 拆分英文术语（按空格、连字符等）
            parts.forEach(part => {
              if (part && part.length > 2 && !additionalTerms.includes(part)) {
                additionalTerms.push(part);
              }
            });
          }
        });
      });
    }

    // 合并所有识别到的术语
    effectiveTerms = [...effectiveTerms, ...additionalTerms];

    // 对术语按长度排序，先处理较长的术语避免部分匹配问题
    const sortedTerms = effectiveTerms.sort((a, b) => b.length - a.length);

    let textParts: (string | React.ReactNode)[] = [text];

    for (const term of sortedTerms) {
      const termLower = term.toLowerCase();
      const newParts: (string | React.ReactNode)[] = [];

      for (const part of textParts) {
        if (typeof part === 'string') {
          // 创建一个正则表达式来匹配术语，同时处理可能的中文词边界
          // 注意：中文没有明确的词边界，所以直接匹配术语
          const regex = new RegExp(`(${term})`, 'gi');
          const splitParts = part.split(regex);

          splitParts.forEach((splitPart, index) => {
            if (splitPart.toLowerCase() === termLower ||
              (language === 'zh' && splitPart === term)) {
              newParts.push(renderTermWithTooltip(splitPart));
            } else if (splitPart) {
              newParts.push(splitPart);
            }
          });
        } else {
          newParts.push(part);
        }
      }

      textParts = newParts;
    }

    return <>{textParts}</>;
  };

  // 渲染问题组件
  const renderQuestion = (question: Question) => {
    const value = currentDecision?.answers[question.id];
    const text = question.text;

    switch (question.type) {
      case 'text':
        return (
          <div className="mb-4">
            <label
              htmlFor={question.id}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {renderTextWithTermTooltips(text, question.terms)} {question.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              id={question.id}
              value={value || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              placeholder={question.help || text}
              required={question.required}
              className="dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            {question.help && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {translations[language].helpText}: {question.help}
              </p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div className="mb-4">
            <label
              htmlFor={question.id}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {renderTextWithTermTooltips(text, question.terms)} {question.required && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              id={question.id}
              value={value || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              placeholder={question.help || text}
              required={question.required}
              className="min-h-[100px] dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            {question.help && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {translations[language].helpText}: {question.help}
              </p>
            )}
          </div>
        );
      case 'select':
        return (
          <div className="mb-4">
            <label
              htmlFor={question.id}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {renderTextWithTermTooltips(text, question.terms)} {question.required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={question.id}
              value={value || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              required={question.required}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-800 dark:text-white"
            >
              <option value="">{translations[language].selectOption || translations['en'].selectOption}</option>
              {question.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {question.help && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {translations[language].helpText}: {question.help}
              </p>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {renderTextWithTermTooltips(text, question.terms)} {question.required && <span className="text-red-500">*</span>}
            </label>
            {question.options?.map((option: string) => {
              const displayOption = option;
              const translatedOption = (() => {
                // 尝试使用映射获取翻译键
                const translationKey = optionToTranslationKey[option];
                if (translationKey && translations[language][translationKey]) {
                  return translations[language][translationKey];
                }
                // 回退到普通翻译
                return translations[language][option.toLowerCase() as keyof typeof translations['en']] || option;
              })();

              // 增强对选项中术语的识别
              let termsInOption: string[] = [];

              // 1. 首先检查问题中定义的术语
              if (question.terms) {
                // 检查英文术语
                question.terms.forEach(term => {
                  // 检查英文原始术语
                  if (option.toLowerCase().includes(term.toLowerCase())) {
                    termsInOption.push(term);
                  }

                  // 检查对应的中文术语
                  if (termTranslations[term.toLowerCase()]) {
                    const zhTerm = termTranslations[term.toLowerCase()];
                    // 检查翻译后的选项文本中是否包含中文术语
                    if (translatedOption.includes(zhTerm)) {
                      termsInOption.push(zhTerm);
                    }

                    // 额外检查中文术语的部分词
                    const zhTermParts = zhTerm.split(/[：（）\s]/);
                    zhTermParts.forEach(part => {
                      if (part && part.length > 1 && translatedOption.includes(part)) {
                        termsInOption.push(part);
                      }
                    });
                  }
                });
              }

              // 2. 直接从选项文本中查找可能的术语
              // 检查选项是否包含术语的关键字，如"stop-loss"、"diversification"等
              Object.entries(termTranslations).forEach(([enTerm, zhTerm]) => {
                // 在英文环境检查英文术语
                if (language === 'en') {
                  // 检查完整术语
                  if (option.toLowerCase().includes(enTerm.toLowerCase()) &&
                    !termsInOption.includes(enTerm)) {
                    termsInOption.push(enTerm);
                  }

                  // 检查术语的部分词
                  const enTermParts = enTerm.split(/[\-\s()]/);
                  enTermParts.forEach(part => {
                    if (part && part.length > 2 &&
                      option.toLowerCase().includes(part.toLowerCase()) &&
                      !termsInOption.includes(part)) {
                      termsInOption.push(part);
                    }
                  });
                }

                // 在中文环境检查中文术语
                if (language === 'zh') {
                  // 检查完整术语
                  if (translatedOption.includes(zhTerm) &&
                    !termsInOption.includes(zhTerm)) {
                    termsInOption.push(zhTerm);
                  }

                  // 检查术语的各部分
                  const zhTermParts = zhTerm.split(/[：（）\s]/);
                  zhTermParts.forEach(part => {
                    if (part && part.length > 1 &&
                      translatedOption.includes(part) &&
                      !termsInOption.includes(part)) {
                      termsInOption.push(part);
                    }
                  });
                }
              });

              return (
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
                      handleInputChange(question.id, newValue);
                    }}
                    className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
                  />
                  <label
                    htmlFor={`${question.id}-${option}`}
                    className="text-sm font-medium text-gray-900 dark:text-gray-200"
                  >
                    {termsInOption.length > 0
                      ? renderTextWithTermTooltips(translatedOption, termsInOption)
                      : translatedOption}
                  </label>
                </div>
              );
            })}
            {question.help && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {translations[language].helpText}: {question.help}
              </p>
            )}
          </div>
        );
      case 'radio':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {renderTextWithTermTooltips(text, question.terms)} {question.required && <span className="text-red-500">*</span>}
            </label>
            {question.options?.map((option: string) => {
              const displayOption = option;
              const translatedOption = (() => {
                // 尝试使用映射获取翻译键
                const translationKey = optionToTranslationKey[option];
                if (translationKey && translations[language][translationKey]) {
                  return translations[language][translationKey];
                }
                // 回退到普通翻译
                return translations[language][option.toLowerCase() as keyof typeof translations['en']] || option;
              })();

              // 增强对选项中术语的识别
              let termsInOption: string[] = [];

              // 1. 首先检查问题中定义的术语
              if (question.terms) {
                // 检查英文术语
                question.terms.forEach(term => {
                  // 检查英文原始术语
                  if (option.toLowerCase().includes(term.toLowerCase())) {
                    termsInOption.push(term);
                  }

                  // 检查对应的中文术语
                  if (termTranslations[term.toLowerCase()]) {
                    const zhTerm = termTranslations[term.toLowerCase()];
                    // 检查翻译后的选项文本中是否包含中文术语
                    if (translatedOption.includes(zhTerm)) {
                      termsInOption.push(zhTerm);
                    }

                    // 额外检查中文术语的部分词
                    const zhTermParts = zhTerm.split(/[：（）\s]/);
                    zhTermParts.forEach(part => {
                      if (part && part.length > 1 && translatedOption.includes(part)) {
                        termsInOption.push(part);
                      }
                    });
                  }
                });
              }

              // 2. 直接从选项文本中查找可能的术语
              // 检查选项是否包含术语的关键字，如"stop-loss"、"diversification"等
              Object.entries(termTranslations).forEach(([enTerm, zhTerm]) => {
                // 在英文环境检查英文术语
                if (language === 'en') {
                  // 检查完整术语
                  if (option.toLowerCase().includes(enTerm.toLowerCase()) &&
                    !termsInOption.includes(enTerm)) {
                    termsInOption.push(enTerm);
                  }

                  // 检查术语的部分词
                  const enTermParts = enTerm.split(/[\-\s()]/);
                  enTermParts.forEach(part => {
                    if (part && part.length > 2 &&
                      option.toLowerCase().includes(part.toLowerCase()) &&
                      !termsInOption.includes(part)) {
                      termsInOption.push(part);
                    }
                  });
                }

                // 在中文环境检查中文术语
                if (language === 'zh') {
                  // 检查完整术语
                  if (translatedOption.includes(zhTerm) &&
                    !termsInOption.includes(zhTerm)) {
                    termsInOption.push(zhTerm);
                  }

                  // 检查术语的各部分
                  const zhTermParts = zhTerm.split(/[：（）\s]/);
                  zhTermParts.forEach(part => {
                    if (part && part.length > 1 &&
                      translatedOption.includes(part) &&
                      !termsInOption.includes(part)) {
                      termsInOption.push(part);
                    }
                  });
                }
              });

              return (
                <div key={option} className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`${question.id}-${option}`}
                    name={question.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => {
                      handleInputChange(question.id, e.target.value);
                    }}
                    className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600"
                  />
                  <label
                    htmlFor={`${question.id}-${option}`}
                    className="text-sm font-medium text-gray-900 dark:text-gray-200"
                  >
                    {termsInOption.length > 0
                      ? renderTextWithTermTooltips(translatedOption, termsInOption)
                      : translatedOption}
                  </label>
                </div>
              );
            })}
            {question.help && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {translations[language].helpText}: {question.help}
              </p>
            )}
          </div>
        );
      case 'date':
        return (
          <div className="mb-4">
            <label
              htmlFor={question.id}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {renderTextWithTermTooltips(text, question.terms)} {question.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="date"
              id={question.id}
              value={value || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              required={question.required}
              className="dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            {question.help && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {translations[language].helpText}: {question.help}
              </p>
            )}
          </div>
        );
      default:
        return <p className="text-gray-900 dark:text-white">Question type not supported: {question.type}</p>;
    }
  };

  // Render different content based on application state
  if (!isLoggedIn) {
    // Render login/registration page (simplified for this example)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
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
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 dark:text-white"
                >
                  {translations[language].email}
                </label>
                <Input
                  id="email"
                  placeholder={translations[language].email}
                  className="dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 dark:text-white"
                >
                  {translations[language].password}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={translations[language].password}
                  className="dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
              onClick={() => setIsLoggedIn(true)} // Simulate login
            >
              {translations[language].login}
            </Button>
            <Button
              variant="outline"
              className="w-full text-gray-900 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
              onClick={() => setIsLoggedIn(true)} // Simulate registration
            >
              {translations[language].register}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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
            <span className="text-gray-600 dark:text-gray-300">
              {translations[language].welcome}, {user?.name}
            </span>
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
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

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
                  <p className="text-gray-900 dark:text-white">{user?.riskTolerance}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {translations[language].preferredStrategies}:
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {user?.preferredStrategies.join(', ')}
                  </p>
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
                {decisions.filter((d) => !d.completed).length > 0 ? (
                  <ul className="space-y-2">
                    {decisions
                      .filter((d) => !d.completed)
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
                {decisions.filter((d) => d.completed).length > 0 ? (
                  <ul className="space-y-2">
                    {decisions
                      .filter((d) => d.completed)
                      .map((decision) => (
                        <li
                          key={decision.id}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-200 dark:bg-gray-700"
                        >
                          <span className="text-gray-900 dark:text-white truncate">
                            {decision.name ||
                              `${translations[language].decisionName} ${decision.id.slice(
                                -4
                              )}`}
                          </span>
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
                <motion.div
                  key={`decision-${currentDecision.id}`}
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
                              ? `${translations[language].editDecision}: ${currentDecision.name ||
                              `${translations[language].decisionName} ${currentDecision.id.slice(
                                -4
                              )}`
                              }`
                              : translations[language].newInvestmentCheckpoint}
                          </CardTitle>
                          <CardDescription className="text-gray-500 dark:text-gray-400 mt-2">
                            <div className="mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {translations[language].decisionName} <span className="text-red-500">*</span>
                              </label>
                              <Input
                                value={currentDecision.name || ''}
                                onChange={(e) => setCurrentDecision({
                                  ...currentDecision,
                                  name: e.target.value
                                })}
                                placeholder={translations[language].enterDecisionName}
                                className="dark:bg-gray-800 dark:text-white"
                                required
                              />
                            </div>
                          </CardDescription>
                        </div>
                        {isEditing && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              if (currentDecision) {
                                handleDeleteDecision(currentDecision.id);
                              }
                            }}
                            className="ml-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        )}
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
                            {translatedQuestions[currentStage]?.map((question) =>
                              renderQuestion(question)
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
                              decision.completed
                                ? 'bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-700'
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startNewDecision(decision.id)}
                                className={cn(
                                  'text-gray-900 dark:text-white',
                                  decision.completed
                                    ? 'bg-green-300/50 hover:bg-green-400/50 dark:bg-green-700/50 dark:hover:bg-green-600/50'
                                    : 'bg-yellow-300/50 hover:bg-yellow-400/50 dark:bg-yellow-700/50 dark:hover:bg-yellow-600/50'
                                )}
                              >
                                {translations[language].editDecision}
                              </Button>
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
    </div>
  );
};

export default App;
