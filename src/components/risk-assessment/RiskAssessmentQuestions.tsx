import { Question } from '../risk-assessment/types';

// 风险评估问题
export const riskAssessmentQuestions: Question[] = [
    {
        id: 'fin-1',
        textZh: '您的可投资资产（不含房产、应急资金）占流动资产的比例是？',
        textEn: 'What percentage of your liquid assets is available for investment (excluding real estate and emergency funds)?',
        type: 'radio',
        options: {
            zh: [
                '<20%（1分）',
                '20%-50%（3分）',
                '50%-80%（5分）',
                '>80%（7分）'
            ],
            en: [
                '<20% (1 point)',
                '20%-50% (3 points)',
                '50%-80% (5 points)',
                '>80% (7 points)'
            ]
        },
        required: true,
        category: 'financial'
    },
    {
        id: 'fin-2',
        textZh: '您的应急资金可维持无收入状态的生活时间？',
        textEn: 'How long could your emergency funds maintain your lifestyle without income?',
        type: 'radio',
        options: {
            zh: [
                '<3个月（1分）',
                '3-6个月（3分）',
                '6-12个月（5分）',
                '>12个月（7分）'
            ],
            en: [
                '<3 months (1 point)',
                '3-6 months (3 points)',
                '6-12 months (5 points)',
                '>12 months (7 points)'
            ]
        },
        required: true,
        category: 'financial'
    },
    {
        id: 'fin-3',
        textZh: '您的负债（房贷、消费贷等）占月收入的比例？',
        textEn: 'What percentage of your monthly income goes to debt payments (mortgage, loans, etc.)?',
        type: 'radio',
        options: {
            zh: [
                '>50%（1分）',
                '30%-50%（3分）',
                '10%-30%（5分）',
                '<10%（7分）'
            ],
            en: [
                '>50% (1 point)',
                '30%-50% (3 points)',
                '10%-30% (5 points)',
                '<10% (7 points)'
            ]
        },
        required: true,
        category: 'financial'
    },
    {
        id: 'goal-1',
        textZh: '您对年化收益的期望是？可接受的最大年度亏损是？',
        textEn: 'What is your expected annual return? What is the maximum annual loss you can accept?',
        type: 'radio',
        options: {
            zh: [
                '收益≤5%，亏损≤3%（保守型，3分）',
                '收益6-10%，亏损≤10%（稳健型，5分）',
                '收益11-15%，亏损≤20%（平衡型，7分）',
                '收益>15%，亏损>20%（进取型，9分）'
            ],
            en: [
                'Return ≤5%, Loss ≤3% (Conservative, 3 points)',
                'Return 6-10%, Loss ≤10% (Steady, 5 points)',
                'Return 11-15%, Loss ≤20% (Balanced, 7 points)',
                'Return >15%, Loss >20% (Progressive, 9 points)'
            ]
        },
        required: true,
        category: 'goal'
    },
    {
        id: 'goal-2',
        textZh: '您计划持有该投资的时间？',
        textEn: 'How long do you plan to hold this investment?',
        type: 'radio',
        options: {
            zh: [
                '<1年（短期，2分）',
                '1-3年（中短期，4分）',
                '3-5年（中期，6分）',
                '>5年（长期，8分）'
            ],
            en: [
                '<1 year (Short-term, 2 points)',
                '1-3 years (Medium-short term, 4 points)',
                '3-5 years (Medium-term, 6 points)',
                '>5 years (Long-term, 8 points)'
            ]
        },
        required: true,
        category: 'goal'
    },
    {
        id: 'psych-1',
        textZh: '如果投资组合单月下跌15%，您会？',
        textEn: 'If your investment portfolio drops 15% in a single month, you would:',
        type: 'radio',
        options: {
            zh: [
                '立即全部卖出（1分）',
                '卖出部分止损（3分）',
                '保持现状（5分）',
                '加仓摊低成本（7分）'
            ],
            en: [
                'Sell everything immediately (1 point)',
                'Sell a portion to stop losses (3 points)',
                'Maintain current positions (5 points)',
                'Buy more to average down (7 points)'
            ]
        },
        required: true,
        category: 'psychological'
    },
    {
        id: 'psych-2',
        textZh: '您能接受连续亏损的时间长度是？',
        textEn: 'How long can you accept consecutive losses?',
        type: 'radio',
        options: {
            zh: [
                '无法接受任何年度亏损（1分）',
                '≤6个月（3分）',
                '6-12个月（5分）',
                '>12个月（7分）'
            ],
            en: [
                'Cannot accept any annual loss (1 point)',
                '≤6 months (3 points)',
                '6-12 months (5 points)',
                '>12 months (7 points)'
            ]
        },
        required: true,
        category: 'psychological'
    },
    {
        id: 'psych-3',
        textZh: '以下哪句话最符合您的态度？',
        textEn: 'Which statement best reflects your attitude?',
        type: 'radio',
        options: {
            zh: [
                '"我只要保本，收益低没关系"（2分）',
                '"希望稳步增值，偶尔小亏损"（4分）',
                '"接受较高波动以换取超额收益"（6分）',
                '"愿意承受剧烈波动追求翻倍机会"（8分）'
            ],
            en: [
                "\"I just want to preserve capital, low returns are fine\" (2 points)",
                "\"I hope for steady growth with occasional small losses\" (4 points)",
                "\"I accept higher volatility for excess returns\" (6 points)",
                "\"I am willing to endure extreme volatility for doubling opportunities\" (8 points)"
            ]
        },
        required: true,
        category: 'psychological'
    },
    {
        id: 'exp-1',
        textZh: '您有几年主动投资（股票、基金等）经验？',
        textEn: 'How many years of active investment experience (stocks, funds, etc.) do you have?',
        type: 'radio',
        options: {
            zh: [
                '无经验（1分）',
                '1-3年（3分）',
                '3-5年（5分）',
                '>5年（7分）'
            ],
            en: [
                'No experience (1 point)',
                '1-3 years (3 points)',
                '3-5 years (5 points)',
                '>5 years (7 points)'
            ]
        },
        required: true,
        category: 'experience'
    },
    {
        id: 'exp-2',
        textZh: '您对以下概念的了解程度？',
        textEn: 'What is your level of understanding of the following concepts?',
        type: 'checkbox',
        options: {
            zh: [
                '市盈率/市净率（+1分）',
                '夏普比率/最大回撤（+2分）',
                '期权对冲策略（+3分）',
                '因子投资模型（+4分）'
            ],
            en: [
                'P/E Ratio / P/B Ratio (+1 point)',
                'Sharpe Ratio / Maximum Drawdown (+2 points)',
                'Options Hedging Strategies (+3 points)',
                'Factor Investment Models (+4 points)'
            ]
        },
        required: true,
        category: 'experience'
    },
    {
        id: 'demo-1',
        textZh: '您的年龄阶段',
        textEn: 'Your age range',
        type: 'radio',
        options: {
            zh: [
                '<30岁（+3分）',
                '30-50岁（+1分）',
                '>50岁（-2分）'
            ],
            en: [
                '<30 years (+3 points)',
                '30-50 years (+1 point)',
                '>50 years (-2 points)'
            ]
        },
        required: true,
        category: 'demographic'
    },
    {
        id: 'demo-2',
        textZh: '您的收入稳定性',
        textEn: 'Your income stability',
        type: 'radio',
        options: {
            zh: [
                '公务员/事业单位（+2分）',
                '企业雇员（+1分）',
                '自由职业/创业（-1分）'
            ],
            en: [
                'Government/Public sector (+2 points)',
                'Corporate employee (+1 point)',
                'Freelancer/Entrepreneur (-1 point)'
            ]
        },
        required: true,
        category: 'demographic'
    }
];

// 评分权重
export const riskAssessmentWeights = {
    'financial': 0.4, // 财务能力权重
    'goal': 0.3,      // 目标期限权重
    'psychological': 0.2, // 心理测试权重
    'experience': 0.1     // 经验知识权重
}; 