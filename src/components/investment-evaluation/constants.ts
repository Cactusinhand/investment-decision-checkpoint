// 阶段权重配置
export const STAGE_WEIGHTS = {
    1: 0.20, // 第一阶段：目标与风险
    2: 0.15, // 第二阶段：投资方法
    3: 0.20, // 第三阶段：买卖规则
    4: 0.25, // 第四阶段：风险管理
    5: 0.10, // 第五阶段：信息验证
    6: 0.05, // 第六阶段：认知偏差
    7: 0.05, // 第七阶段：文档审查
  };
  
  // 评级区间
  export const RATING_RANGES = {
    system: { min: 85, max: 100 }, // 系统化
    stable: { min: 70, max: 84 },  // 稳健型
    cautious: { min: 55, max: 69 }, // 谨慎型
    'high-risk': { min: 0, max: 54 }  // 高风险
  };
  
  // 需要DeepSeek API分析的关键问题
  export const API_ANALYSIS_QUESTIONS = {
    LOGIC_CONSISTENCY: ['3-1', '3-2', '3-3', '4-1'], // 买卖规则与风险管理一致性
    RISK_ASSESSMENT: ['1-3', '4-1', '4-3', '4-4'],   // 风险评估一致性
    COGNITIVE_BIAS: ['6-1', '6-2'],                  // 认知偏差分析
  };
  
  // API请求超时时间(毫秒)
  export const API_TIMEOUT = 15000;
  
  // API重试次数
  export const API_RETRY_COUNT = 2;
  
  // 最小有效回答长度阈值
  export const MIN_VALID_ANSWER_LENGTH = 10;