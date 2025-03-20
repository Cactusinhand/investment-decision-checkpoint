import { RiskProfile } from './types';

interface RiskProfiles {
  [key: string]: {
    zh: RiskProfile;
    en: RiskProfile;
  };
}

// 风险类型描述
export const riskProfiles: RiskProfiles = {
  'conservative': {
    zh: {
      name: '保守型',
      description: '极端厌恶亏损，优先保本',
      recommendation: '货币基金+国债>80%',
      scoreRange: [0, 35]
    },
    en: {
      name: 'Conservative',
      description: 'Extremely averse to losses, prioritizes capital preservation',
      recommendation: 'Money market funds + Treasury bonds >80%',
      scoreRange: [0, 35]
    }
  },
  'steady': {
    zh: {
      name: '稳健型',
      description: '接受小幅波动换取稳定收益',
      recommendation: '债券基金+红利股60%+指数ETF',
      scoreRange: [36, 55]
    },
    en: {
      name: 'Steady',
      description: 'Accepts small fluctuations for stable returns',
      recommendation: 'Bond funds + Dividend stocks 60% + Index ETFs',
      scoreRange: [36, 55]
    }
  },
  'balanced': {
    zh: {
      name: '平衡型',
      description: '收益与风险均衡追求',
      recommendation: '股债均衡配置+行业轮动',
      scoreRange: [56, 70]
    },
    en: {
      name: 'Balanced',
      description: 'Seeks balance between returns and risks',
      recommendation: 'Balanced stock-bond allocation + Sector rotation',
      scoreRange: [56, 70]
    }
  },
  'progressive': {
    zh: {
      name: '进取型',
      description: '主动承担风险获取超额收益',
      recommendation: '成长股+杠杆ETF+另类资产',
      scoreRange: [71, 85]
    },
    en: {
      name: 'Progressive',
      description: 'Actively takes on risk for excess returns',
      recommendation: 'Growth stocks + Leveraged ETFs + Alternative assets',
      scoreRange: [71, 85]
    }
  },
  'aggressive': {
    zh: {
      name: '激进型',
      description: '追求极高收益，容忍巨幅波动',
      recommendation: '加密货币+期货+天使投资',
      scoreRange: [86, 100]
    },
    en: {
      name: 'Aggressive',
      description: 'Seeks extremely high returns, tolerates massive volatility',
      recommendation: 'Cryptocurrencies + Futures + Angel investments',
      scoreRange: [86, 100]
    }
  }
}; 