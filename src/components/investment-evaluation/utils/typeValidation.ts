import { Question } from '../types';

// 检查输入值类型是否符合预期
export const validateAnswerType = (
  questionId: string, 
  value: any, 
  questions: { [key: number]: Question[] }
): boolean => {
  // 找到对应的问题
  const stage = parseInt(questionId.split('-')[0], 10);
  const question = questions[stage]?.find(q => q.id === questionId);
  
  if (!question) return false;
  
  switch (question.type) {
    case 'text':
      return typeof value === 'string';
      
    case 'textarea':
      return typeof value === 'string';
      
    case 'radio':
      return typeof value === 'string' && question.options?.includes(value);
      
    case 'checkbox':
      return Array.isArray(value) && 
             value.every(v => typeof v === 'string' && question.options?.includes(v));
             
    case 'select':
      return typeof value === 'string' && question.options?.includes(value);
      
    case 'date':
      // 日期需要是字符串且可转换为日期对象
      return typeof value === 'string' && !isNaN(new Date(value).getTime());
      
    default:
      return false;
  }
};

// 验证所有答案类型
export const validateAllAnswerTypes = (
  answers: Record<string, any>,
  questions: { [key: number]: Question[] }
): string[] => {
  const errors: string[] = [];
  
  Object.entries(answers).forEach(([questionId, value]) => {
    if (!validateAnswerType(questionId, value, questions)) {
      errors.push(questionId);
    }
  });
  
  return errors;
};