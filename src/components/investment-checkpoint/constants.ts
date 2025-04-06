import { Question } from '../../types';

// Move the rawQuestions, questionTranslations, helpExamples, and termDefinitions from App.tsx
export const rawQuestions: { [key: number]: Question[] } = {
  1: [
    {
      id: '1-1',
      text: 'What are your primary investment goals?',
      type: 'textarea',
      required: true,
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
    },
    {
      id: '2-3',
      text: 'What are the key metrics you will use to evaluate potential investments?',
      type: 'textarea',
      required: true,
    },
  ],
  3: [
    {
      id: '3-1',
      text: 'What specific criteria will trigger a buy decision?',
      type: 'textarea',
      required: true,
    },
    {
      id: '3-2',
      text: 'What specific criteria will trigger a sell decision (profit taking)?',
      type: 'textarea',
      required: true,
    },
    {
      id: '3-3',
      text: 'What specific criteria will trigger a sell decision (loss mitigation)?',
      type: 'textarea',
      required: true,
    },
    {
      id: '3-4',
      text: 'How will you manage position sizing?',
      type: 'textarea',
      required: true,
      terms: ['position sizing']
    },
  ],
  4: [
    {
      id: '4-1',
      text: 'What are the major risks associated with this investment?',
      type: 'textarea',
      required: true,
    },
    {
      id: '4-2',
      text: 'How will you monitor these risks?',
      type: 'textarea',
      required: true,
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
    },
  ],
  5: [
    {
      id: '5-1',
      text: 'What sources of information will you use for research?',
      type: 'checkbox',
      options: [
        'Company Filings',
        'Bloomberg/Reuters Data',
        'Analyst Reports',
        'Independent Third-party Audits',
        'Social Media (e.g., Douyin, Xiaohongshu)'
      ],
      required: true
    },
    {
      id: '5-2',
      text: 'How will you verify the accuracy of this information?',
      type: 'textarea',
      required: true,
    },
    {
      id: '5-3',
      text: 'What are the key assumptions underlying your investment thesis?',
      type: 'textarea',
      required: true,
    },
  ],
  6: [
    {
      id: '6-1',
      text: 'Are you anchoring on the initial purchase price?',
      type: 'radio',
      options: ['Yes', 'No'],
      required: true
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
    },
  ],
  7: [
    {
      id: '7-1',
      text: 'Summarize your investment decision and rationale',
      type: 'textarea',
      required: true,
    },
    {
      id: '7-2',
      text: 'What potential factors could change your investment thesis?',
      type: 'textarea',
      required: true,
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
    },
  ],
};

export const questionTranslations = {
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
  'How will you manage position sizing?': '您将如何仓位管理？',

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

export const helpExamples = {
  en: {
    '1-1': 'For example: Wealth preservation/8% annual return/Fund accumulation for specific projects',
    // '1-2': 'For example: Short-term (<1 year)/Medium-term (1-5 years)/Long-term (>5 years)',
    // '1-3': 'For example: I can accept up to 15% temporary decrease in my investment value',
    '1-4': 'For example: 20% of the position needs to be liquidated at any time/locked in for the long term with no short-term demand',
    // '2-1': 'For example: Fundamental analysis/Technical analysis/Quantitative analysis',
    '2-2': 'For example: This method has historical data supporting its effectiveness for my time horizon',
    '2-3': 'For example: PE ratio below 15, ROE above 15%, stable revenue growth',
    '3-1': 'For example: PE ratio below industry average, positive free cash flow, growing revenue',
    '3-2': 'For example: Target price reached, deteriorating fundamentals, better opportunities elsewhere',
    '3-3': 'For example: 15% loss from purchase price, break of key support level, deteriorating business metrics',
    '3-4': 'For example: Maximum 5% of portfolio in a single position, sizing based on volatility',
    '4-1': 'For example: Business model disruption, regulatory changes, economic recession',
    '4-2': 'For example: Regular review of financial statements, industry news, economic indicators',
    // '4-3': 'For example: Diversification across sectors, stop-loss orders, hedging with options',
    '4-4': 'For example: 20% of the invested capital',
    // '5-1': 'For example: Company filings, industry reports, expert interviews, economic data',
    '5-2': 'For example: Cross-reference multiple sources, verify data directly when possible',
    '5-3': 'For example: The company will maintain its market share, the industry will grow at 5% annually',
    // '6-1': 'For example: I am constantly comparing current price to my purchase price',
    // '6-2': 'For example: I believe I can predict near-term price movements accurately',
    // '6-3': 'For example: I am investing because everyone is talking about this opportunity',
    // '6-4': 'For example: I focus mostly on potential gains and give less weight to possible losses',
    // '6-5': 'For example: I have actively sought out and considered bearish analysis',
    '6-6': 'For example: Setting strict rules before investing, getting second opinions',
    '7-1': 'For example: I am investing in Company X because of its strong competitive position...',
    '7-2': 'For example: Major regulatory changes, loss of key competitive advantage, better alternatives',
    // '7-3': 'For example: Quarterly for the first year, then semi-annually',
    '7-4': 'For example: Investment committee, financial advisor, trusted colleague'
  },
  zh: {
    '1-1': '例如： 财富保值/年化8%收益/特定项目资金积累',
    // '1-2': '例如： 短期（<1年）/中期（1-5年）/长期（>5年）',
    // '1-3': '例如： 我可以接受投资价值最多15%的暂时下降',
    '1-4': '例如： 需随时变现 20% 仓位 / 长期锁定无短期需求',
    // '2-1': '例如： 基本面分析/技术分析/量化分析',
    '2-2': '例如： 这种方法有历史数据支持其在我的投资期限内的有效性',
    '2-3': '例如： 市盈率低于15，净资产收益率高于15%，稳定的收入增长',
    '3-1': '例如： 市盈率低于行业平均水平，自由现金流为正，收入增长',
    '3-2': '例如： 达到目标价格，基本面恶化，其他地方有更好的机会',
    '3-3': '例如： 从购买价格损失15%，突破关键支撑位，业务指标恶化',
    '3-4': '例如： 单一头寸最多占投资组合的5%，基于波动性调整仓位',
    '4-1': '例如： 商业模式颠覆，监管变化，经济衰退',
    '4-2': '例如： 定期审查财务报表，行业新闻，经济指标',
    // '4-3': '例如： 跨行业多元化，止损单，期权对冲',
    '4-4': '例如： 投资资本的20%',
    // '5-1': '例如： 公司文件，行业报告，专家访谈，经济数据',
    '5-2': '例如： 交叉引用多个来源，尽可能直接验证数据',
    '5-3': '例如： 该公司将保持其市场份额，该行业将以每年5%的速度增长',
    // '6-1': '例如： 我不断将当前价格与我的购买价格进行比较',
    // '6-2': '例如： 我相信我可以准确预测近期价格走势',
    // '6-3': '例如： 我投资是因为每个人都在谈论这个机会',
    // '6-4': '例如： 我主要关注潜在收益，较少考虑可能的损失',
    // '6-5': '例如： 我已积极寻求并考虑了看跌分析',
    '6-6': '例如： 在投资前设定严格规则，获取第二意见',
    '7-1': '例如： 我投资于X公司是因为其强大的竞争地位...',
    '7-2': '例如： 重大监管变化，失去关键竞争优势，有更好的替代方案',
    // '7-3': '例如： 第一年每季度，然后每半年',
    '7-4': '例如： 投资委员会，财务顾问，值得信任的同事'
  }
};

export const termDefinitions = {
  en: {
    'investment goals': 'Specific financial objectives that an investor aims to achieve through their investment activities.',
    'time horizon': 'The length of time an investor expects to hold an investment before needing the funds.',
    'risk tolerance': 'An investor\'s ability and willingness to endure declines in the value of their investments.',
    'liquidity needs': 'The extent to which an investor requires the ability to quickly convert investments into cash without significant loss in value.',
    'fundamental analysis': 'A method of evaluating securities by analyzing financial statements, management, competitive advantages, and market trends.',
    'technical analysis': 'A trading discipline that evaluates investments and identifies trading opportunities by analyzing statistical trends gathered from trading activity.',
    'quantitative analysis': 'The use of mathematical and statistical models to evaluate investments and markets.',
    'passive investing': 'An investment strategy that aims to maximize returns by minimizing buying and selling, typically through index funds.',
    'stop-loss orders': 'An order placed with a broker to sell a security when it reaches a certain price, designed to limit an investor\'s loss.',
    'diversification': 'The practice of spreading investments across various financial instruments, industries, and categories to reduce risk.',
    'options hedging': 'The use of options contracts to protect against potential losses in investment positions.',
    'position sizing': 'The determination of how many shares or contracts to trade in a particular security.',
    'herd behavior': 'The tendency of investors to follow and copy what other investors are doing, often leading to market bubbles or crashes.',
    'anchoring bias': 'The tendency to rely too heavily on the first piece of information encountered (the "anchor") when making decisions.',
    'pe': 'Price-to-Earnings ratio, a valuation ratio of a company\'s current share price compared to its per-share earnings.',
    'pb': 'Price-to-Book ratio, a ratio used to compare a company\'s market value to its book value.',
    'roe': 'Return on Equity, a measure of financial performance calculated by dividing net income by shareholders\' equity.',
    'macd': 'Moving Average Convergence Divergence, a trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price.',
    'rsi': 'Relative Strength Index, a momentum oscillator that measures the speed and change of price movements.',
    'volatility': 'A statistical measure of the dispersion of returns for a given security or market index.',
    'sharpe ratio': 'A measure that indicates the average return earned in excess of the risk-free rate per unit of volatility or total risk.',
    'dcf': 'Discounted Cash Flow, a valuation method used to estimate the value of an investment based on its expected future cash flows.',
    'irr': 'Internal Rate of Return, a metric used in capital budgeting to estimate the profitability of potential investments.',
    'market cap': 'Market Capitalization, the total market value of a company\'s outstanding shares of stock.',
    'beta': 'A measure of a stock\'s volatility in relation to the overall market.',
    'alpha': 'A measure of the active return on an investment compared to a market index or benchmark that represents the market\'s performance.',
    'etf': 'Exchange-Traded Fund, a type of investment fund traded on stock exchanges, similar to stocks.',
    'bull market': 'A financial market of a group of securities in which prices are rising or are expected to rise.',
    'bear market': 'A market condition in which the prices of securities are falling, and widespread pessimism causes the negative sentiment to be self-sustaining.',
  },
  zh: {
    '投资目标': '投资者通过投资活动希望实现的具体财务目标。',
    '投资期限': '投资者在需要资金之前预期持有投资的时间长度。',
    '风险承受能力': '投资者承受和接受投资价值下降的能力和意愿。',
    '流动性需求': '投资者需要能够快速将投资转换为现金而不会显著损失价值的程度。',
    '基本面分析': '通过分析财务报表、管理层、竞争优势和市场趋势来评估证券的方法。',
    '技术分析': '通过分析从交易活动中收集的统计趋势来评估投资并识别交易机会的交易纪律。',
    '量化分析': '使用数学和统计模型评估投资和市场的方法。',
    '被动投资': '通过最小化买卖操作来最大化回报的投资策略，通常通过指数基金实现。',
    '止损单': '与经纪人下达的订单，在证券达到某个价格时卖出，旨在限制投资者的损失。',
    '分散投资': '将投资分散到各种金融工具、行业和类别中以降低风险的做法。',
    '期权对冲': '使用期权合约保护投资头寸免受潜在损失的方法。',
    '仓位管理': '确定在特定证券中交易多少股份或合约的决策。',
    '羊群效应': '投资者追随和复制其他投资者行为的倾向，常导致市场泡沫或崩盘。',
    '锚定偏差': '在决策时过度依赖首次获取的信息（"锚点"）的倾向。',
    '市盈率': '当前股价与每股收益的比率，是公司估值的指标之一。',
    '市净率': '用于比较公司市值与账面价值的比率。',
    '净资产收益率': '通过净收入除以股东权益计算的财务绩效指标。',
    'macd指标': '移动平均线收敛/发散指标，显示证券价格两个移动平均线关系的趋势跟踪动量指标。',
    '相对强弱指数': '衡量价格变动速度和变化的动量振荡器。',
    '波动率': '衡量特定证券或市场指数回报分散程度的统计指标。',
    '夏普比率': '衡量每单位波动性或总风险所赚取的超过无风险收益率的平均回报的指标。',
    '贴现现金流': '一种根据预期未来现金流估计投资价值的估值方法。',
    '内部收益率': '资本预算中用于估计潜在投资盈利能力的指标。',
    '市值': '公司所有流通股票的总市场价值。',
    '贝塔系数': '衡量股票相对于整体市场波动性的指标。',
    '阿尔法值': '衡量投资相对于代表市场表现的市场指数或基准的主动回报的指标。',
    '交易所交易基金': '一种在股票交易所交易的投资基金，类似于股票。',
    '牛市': '证券价格上涨或预期上涨的金融市场状况。',
    '熊市': '证券价格下跌，普遍悲观情绪导致负面情绪自我维持的市场状况。',
  }
};

export const termTranslations = {
  'investment goals': '投资目标',
  'time horizon': '投资期限',
  'risk tolerance': '风险承受能力',
  'liquidity needs': '流动性需求',
  'fundamental analysis': '基本面分析',
  'technical analysis': '技术分析',
  'quantitative analysis': '量化分析',
  'passive investing': '被动投资',
  'stop-loss orders': '止损单',
  'diversification': '分散投资',
  'options hedging': '期权对冲',
  'position sizing': '仓位管理',
  'herd behavior': '羊群效应',
  'anchoring bias': '锚定偏差',
  'PE': '市盈率',
  'PB': '市净率',
  'ROE': '净资产收益率',
  'MACD': 'MACD指标',
  'RSI': '相对强弱指数',
  'volatility': '波动率',
  'Sharpe ratio': '夏普比率',
  'DCF': '贴现现金流',
  'NPV': '净现值',
  'IRR': '内部收益率',
  'EBITDA': '息税折旧摊销前利润',
  'EPS': '每股收益',
  'dividend yield': '股息率',
  'beta': '贝塔系数',
  'alpha': '阿尔法值',
  'market cap': '市值',
  'ETF': '交易所交易基金',
  'bull market': '牛市',
  'bear market': '熊市',
  'market timing': '择时交易',
  'dollar cost averaging': '定投策略',
  'momentum': '动量',
  'reversal': '反转',
  'moving average': '移动平均线',
  'support level': '支撑位',
  'resistance level': '阻力位',
  'breakout': '突破',
  'correction': '回调',
  'sector rotation': '行业轮动',
  'confirmation bias': '确认偏误',
  'recency bias': '近因偏误',
  'loss aversion': '损失厌恶',
  'sunk cost fallacy': '沉没成本谬误',
  'overconfidence bias': '过度自信偏误'
};


// 添加选项翻译映射
export const optionToTranslationKey: Record<string, string> = {
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
  'Social Media (e.g., Douyin, Xiaohongshu)': 'socialMediaDetail',
  'Monthly': 'monthly',
  'Quarterly': 'quarterly',
  'Event-driven (e.g., earnings release)': 'eventDriven',
  'Yes': 'yes',
  'No': 'no'
};

// 添加逆向映射: 中文 -> 英文
export const reverseTermTranslations: { [key: string]: string } = Object.entries(termTranslations).reduce(
  (acc, [en, zh]) => {
    acc[zh] = en;
    return acc;
  },
  {} as { [key: string]: string }
);

// 在这里添加分散投资的映射
reverseTermTranslations['分散投资'] = 'diversification';