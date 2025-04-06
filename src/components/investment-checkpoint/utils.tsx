import React, { JSX } from 'react';
import { InvestmentDecision, Question } from '../../types';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { termDefinitions, termTranslations, optionToTranslationKey, reverseTermTranslations, helpExamples } from './constants';
import { translations } from '../../constants/index';

export const renderTermWithTooltip = (term: string, language: 'en' | 'zh') => {
  // 查找对应的术语定义
  let termDefinition = '';
  
  if (language === 'zh') {
    // 中文环境
    // 1. 直接在中文定义中查找
    termDefinition = termDefinitions.zh[term] || '';
    
    // 2. 如果没找到，尝试寻找匹配的中文术语
    if (!termDefinition) {
      Object.keys(termDefinitions.zh).forEach(key => {
        if (key.includes(term) || term.includes(key)) {
          termDefinition = termDefinitions.zh[key] || '';
        }
      });
    }
    
    // 3. 如果仍未找到，尝试通过英文术语查找
    if (!termDefinition) {
      Object.keys(termTranslations).forEach(enTerm => {
        const zhTerm = termTranslations[enTerm];
        if (zhTerm === term || zhTerm.includes(term) || term.includes(zhTerm)) {
          termDefinition = termDefinitions.zh[zhTerm] || 
                         `${zhTerm}: ${termDefinitions.en[enTerm.toLowerCase()] || ''}`;
        }
      });
    }
  } else {
    // 英文环境
    // 1. 直接在英文定义中查找（考虑小写）
    termDefinition = termDefinitions.en[term.toLowerCase()] || '';
    
    // 2. 尝试模糊匹配英文术语
    if (!termDefinition) {
      Object.keys(termDefinitions.en).forEach(key => {
        if (key.toLowerCase().includes(term.toLowerCase()) || 
            term.toLowerCase().includes(key.toLowerCase())) {
          termDefinition = termDefinitions.en[key] || '';
        }
      });
    }
    
    // 3. 尝试查找中文术语的对应英文
    if (!termDefinition && /[\u4e00-\u9fa5]/.test(term)) {
      const enTerm = reverseTermTranslations[term];
      if (enTerm && termDefinitions.en[enTerm.toLowerCase()]) {
        termDefinition = termDefinitions.en[enTerm.toLowerCase()] || '';
      }
    }
  }

  // 如果没有找到定义，返回原始术语
  if (!termDefinition) return <>{term}</>;

  // 返回带有提示的术语
  return (
    <span className="relative group inline-block" data-testid="term-tooltip">
      <span className="border-b border-dotted border-gray-500 cursor-help text-blue-600 dark:text-blue-400">
        {term}
      </span>
      <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute z-10 w-64 p-3 bg-white dark:bg-gray-800 text-sm rounded-md shadow-lg text-gray-800 dark:text-gray-200 -top-1 left-full ml-2 border border-gray-200 dark:border-gray-700 transition-opacity duration-200">
        {termDefinition}
      </span>
    </span>
  );
};

export const renderTextWithTermTooltips = (text: string, terms: string[] | undefined, language: 'en' | 'zh'): JSX.Element => {
  if (!terms || terms.length === 0) {   
    return <>{text}</>;
  }
  // 准备术语列表
  let effectiveTerms = [...terms];
  let additionalTerms: string[] = [];

  if (language === 'zh') {
    // 中文环境，添加英文术语的中文对应物
    terms.forEach(term => {
      const termLower = term.toLowerCase();
      // 查找术语的中文对应物
      if (termTranslations[termLower]) {
        const zhTerm = termTranslations[termLower];
        additionalTerms.push(zhTerm);
      }
    });
  } else {
    // 英文环境，添加中文术语的英文对应物
    terms.forEach(term => {
      if (/[\u4e00-\u9fa5]/.test(term) && reverseTermTranslations[term]) {
        additionalTerms.push(reverseTermTranslations[term]);
      }
    });
  }

  // 合并所有术语并去重
  effectiveTerms = Array.from(new Set([...effectiveTerms, ...additionalTerms]));
  
  // 按长度降序排序
  const sortedTerms = effectiveTerms.sort((a, b) => b.length - a.length);

  // 创建一个单词边界的正则表达式匹配模式
  // 这将防止匹配单词片段
  const boundaryTerms = sortedTerms.map(term => {
    // 处理中文术语 - 中文没有单词边界概念
    if (/[\u4e00-\u9fa5]/.test(term)) {
      return term;
    }
    
    // 处理英文术语 - 添加单词边界
    return `\\b${term}\\b`;
  });


  let textParts: (string | React.ReactNode)[] = [text];
  // 逐个术语处理
  for (let i = 0; i < sortedTerms.length; i++) {
    const term = sortedTerms[i];
    const boundaryTerm = boundaryTerms[i];
    const newParts: (string | React.ReactNode)[] = [];
    for (const part of textParts) {
      if (typeof part === 'string') {
        // 构建不同的正则表达式
        let regex;
        if (/[\u4e00-\u9fa5]/.test(term)) {
          // 中文术语直接匹配
          regex = new RegExp(`(${term})`, 'g'); 
        } else {
          // 英文术语使用单词边界匹配
          regex = new RegExp(`(${boundaryTerm})`, 'gi');
        }
        
        const splitParts = part.split(regex);
        
        // 只有完全匹配的部分才会被识别为术语
        splitParts.forEach((splitPart) => {
          if (splitPart.toLowerCase() === term.toLowerCase() || 
              splitPart === term) {
            newParts.push(renderTermWithTooltip(splitPart, language));
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

export const getTranslatedOption = (option: string, language: 'en' | 'zh'): string => {
  // 1. 尝试使用映射获取翻译键
  const translationKey = optionToTranslationKey[option];
  if (translationKey && translations[language][translationKey]) {
    return translations[language][translationKey];
  }
  
  // 2. 如果没有映射，尝试直接在translations中找对应项
  if (translations[language][option]) {
    return translations[language][option];
  }
  
  // 3. 尝试将选项转为小写查找
  const lowerOption = option.toLowerCase();
  if (translations[language][lowerOption]) {
    return translations[language][lowerOption];
  }
  
  // 4. 尝试查找特殊情况（Yes/No等简单选项）
  if (option === 'Yes' && translations[language]['yes']) {
    return translations[language]['yes'];
  }
  if (option === 'No' && translations[language]['no']) {
    return translations[language]['no'];
  }
  
  // 5. 如果是中文环境但找不到翻译，检查是否已经是中文
  if (language === 'zh' && /[\u4e00-\u9fa5]/.test(option)) {
    return option; // 已经是中文，直接返回
  }
  
  // 6. 如果是英文环境但找不到翻译，检查是否已经是英文
  if (language === 'en' && !/[\u4e00-\u9fa5]/.test(option)) {
    return option; // 已经是英文，直接返回
  }
  
  // 7. 最后回退到原始选项
  return option;
};

// 彻底解决分散投资问题 - 重写findTermsInOption函数
export const findTermsInOption = (option: string, translatedOption: string, question: Question, language: 'en' | 'zh'): string[] => {
  // 直接处理特殊情况
  // 分散投资（跨3+不相关行业）
  if (option === 'Diversification (across 3+ unrelated industries)' || 
      translatedOption === '分散投资（跨3+不相关行业）') {
    return ['diversification'];
  }
  
  // 处理包含分散投资的选项
  if (language === 'zh' && translatedOption.includes('分散投资')) {
    return ['diversification'];
  }
  
  // 处理仓位管理相关选项
  // if (option.toLowerCase().includes('position sizing') || 
  //     translatedOption.includes('仓位管理')) {
  //   return ['position sizing'];
  // }
  
  // 处理止损单
  if (language === 'zh' && translatedOption.includes('止损单')) {
    return ['stop-loss orders'];
  }
  
  // 处理期权对冲
  if (language === 'zh' && translatedOption.includes('期权对冲')) {
    return ['options hedging'];
  }
  
  // 收集可能的术语
  let termsInOption: string[] = [];
  
  // 预处理选项文本，处理带括号的情况
  const cleanOption = language === 'en' 
    ? option.replace(/\s*\([^)]*\)/g, '') // 去掉英文选项中的括号及内容
    : translatedOption.replace(/（[^）]*）/g, ''); // 去掉中文选项中的括号及内容
    
  // 1. 首先从问题定义的术语中查找
  if (question.terms && question.terms.length > 0) {
    // 复制一份术语列表
    const questionTerms = [...question.terms];
    
    // 准备术语的对应翻译
    let termTranslationMap: {[key: string]: string} = {};
    
    // 对于英文环境，构建英文->中文映射
    if (language === 'en') {
      questionTerms.forEach(term => {
        const termLower = term.toLowerCase();
        if (termTranslations[termLower]) {
          termTranslationMap[termLower] = termTranslations[termLower];
        }
      });
    } 
    // 对于中文环境，构建中文->英文映射
    else {
      questionTerms.forEach(term => {
        if (reverseTermTranslations[term]) {
          termTranslationMap[term] = reverseTermTranslations[term];
        }
      });
    }
    
    // 检查每个术语
    questionTerms.forEach(term => {
      const termLower = term.toLowerCase();
      
      // 1.1 在原始选项文本中查找术语
      const searchTerm = language === 'en' ? termLower : term;
      const searchOptionText = language === 'en' ? cleanOption.toLowerCase() : cleanOption;
      
      if (searchOptionText.includes(searchTerm)) {
        termsInOption.push(term);
      }
      
      // 1.2 在翻译后的选项文本中查找对应术语
      const translatedTerm = termTranslationMap[language === 'en' ? termLower : term];
      if (translatedTerm && translatedOption.includes(translatedTerm)) {
        // 对于英文环境，添加原始英文术语
        // 对于中文环境，添加中文译术语
        if (language === 'en') {
          !termsInOption.includes(term) && termsInOption.push(term);
        } else {
          !termsInOption.includes(translatedTerm) && termsInOption.push(translatedTerm);
        }
      }
    });
  }
  
  // 2. 直接在选项文本中查找常用术语
  // 这将识别那些问题中没有明确定义为术语的投资术语
  
  // 对于英文选项
  if (language === 'en') {
    // 检查英文投资术语
    Object.keys(termDefinitions.en).forEach(enTerm => {
      // 使用单词边界确保完整匹配
      const regex = new RegExp(`\\b${enTerm}\\b`, 'i');
      if (regex.test(cleanOption) && !termsInOption.includes(enTerm)) {
        termsInOption.push(enTerm);
      }
    });
  } 
  // 对于中文选项
  else {
    // 检查中文投资术语
    Object.keys(termDefinitions.zh).forEach(zhTerm => {
      if (cleanOption.includes(zhTerm) && !termsInOption.includes(zhTerm)) {
        termsInOption.push(zhTerm);
      }
    });
    
    // 检查常见术语的中文翻译
    Object.keys(termTranslations).forEach(enTerm => {
      const zhTerm = termTranslations[enTerm];
      if (zhTerm && cleanOption.includes(zhTerm) && !termsInOption.includes(zhTerm)) {
        termsInOption.push(zhTerm);
      }
    });
  }
  
  return termsInOption;
};

// 翻译问题文本
export const getTranslatedQuestion = (question: string, language: 'en' | 'zh'): string => {
  if (language === 'en') {
    return question; // 英文环境直接返回原文本
  }
  
  // 中文环境，查找翻译
  const { questionTranslations } = require('./constants');
  return questionTranslations[question] || question;
};

// Modify renderQuestion to directly use helpExamples based on question ID and language
export const renderQuestion = (
  question: Question,
  decision: InvestmentDecision | null,
  onChange: (value: any) => void,
  language: 'en' | 'zh',
  validated: boolean = false // 添加验证状态参数，默认为false
) => {
  if (!decision) return null;
  const value = decision.answers[question.id];
  const originalText = question.text;
  const translatedText = getTranslatedQuestion(originalText, language);

  // Directly get help example based on question ID and language
  const helpExample = helpExamples[language]?.[question.id] || '';

  // 检查是否为未回答的必填项
  const isUnanswered = validated && question.required && (
    value === undefined || 
    value === null || 
    value === '' || 
    (question.type === 'checkbox' && Array.isArray(value) && value.length === 0)
  );

  // 添加未回答必填项的警告样式
  const requiredFieldClass = isUnanswered 
    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' 
    : '';

  // 必填标记的样式
  const requiredMarkClass = isUnanswered 
    ? 'text-red-500 font-bold animate-pulse' 
    : 'text-red-500';

  switch (question.type) {
    case 'text':
      return (
        <div className="mb-4" id={question.id}>
          <label
            htmlFor={question.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {renderTextWithTermTooltips(translatedText, question.terms, language)} {question.required && <span className={requiredMarkClass}>*</span>}
          </label>
          <Input
            id={question.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={helpExample || translatedText}
            required={question.required}
            className={`dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 ${requiredFieldClass}`}
          />
          {/* Only render help text if it exists */}
          {helpExample && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {helpExample}
            </p>
          )}
          {isUnanswered && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {translations[language].fieldRequired}
            </p>
          )}
        </div>
      );
    case 'textarea':
      return (
        <div className="mb-4" id={question.id}>
          <label
            htmlFor={question.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {renderTextWithTermTooltips(translatedText, question.terms, language)} {question.required && <span className={requiredMarkClass}>*</span>}
          </label>
          <Textarea
            id={question.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={helpExample || translatedText}
            required={question.required}
            className={`min-h-[100px] dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 ${requiredFieldClass}`}
          />
          {/* Only render help text if it exists */}
          {helpExample && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {helpExample}
            </p>
          )}
          {isUnanswered && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {translations[language].fieldRequired}
            </p>
          )}
        </div>
      );
    case 'select':
      return (
        <div className="mb-4" id={question.id}>
          <label
            htmlFor={question.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {renderTextWithTermTooltips(translatedText, question.terms, language)} {question.required && <span className={requiredMarkClass}>*</span>}
          </label>
          <select
            id={question.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={question.required}
            className={`w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 ${requiredFieldClass}`}
          >
            <option value="" disabled>
              {translations[language].selectOption}
            </option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>
                {getTranslatedOption(option, language)}
              </option>
            ))}
          </select>
          {/* Only render help text if it exists */}
          {helpExample && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {helpExample}
            </p>
          )}
          {isUnanswered && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {translations[language].fieldRequired}
            </p>
          )}
        </div>
      );
    case 'radio':
      return (
        <div className="mb-4" id={question.id}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {renderTextWithTermTooltips(translatedText, question.terms, language)} {question.required && <span className={requiredMarkClass}>*</span>}
          </label>
          <div className={`space-y-2 ${isUnanswered ? 'border border-red-300 dark:border-red-600 rounded-md p-2' : ''}`}>
            {question.options?.map((option, index) => {
              const translatedOption = getTranslatedOption(option, language);
              const termsInOption = findTermsInOption(option, translatedOption, question, language);
              return (
                <label
                  key={index}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.required}
                    className="form-radio text-blue-600 dark:text-blue-500 dark:bg-gray-800 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {renderTextWithTermTooltips(translatedOption, termsInOption, language)}
                  </span>
                </label>
              );
            })}
          </div>
          {/* Only render help text if it exists */}
          {helpExample && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {helpExample}
            </p>
          )}
          {isUnanswered && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {translations[language].fieldRequired}
            </p>
          )}
        </div>
      );
    case 'checkbox':
      return (
        <div className="mb-4" id={question.id}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {renderTextWithTermTooltips(translatedText, question.terms, language)} {question.required && <span className={requiredMarkClass}>*</span>}
          </label>
          <div className={`space-y-2 ${isUnanswered ? 'border border-red-300 dark:border-red-600 rounded-md p-2' : ''}`}>
            {question.options?.map((option, index) => {
              const translatedOption = getTranslatedOption(option, language);
              const termsInOption = findTermsInOption(option, translatedOption, question, language);
              return (
                <label
                  key={index}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={(value || []).includes(option)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...(value || []), option]
                        : (value || []).filter((v: string) => v !== option);
                      onChange(newValue);
                    }}
                    className="form-checkbox text-blue-600 dark:text-blue-500 dark:bg-gray-800 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {renderTextWithTermTooltips(translatedOption, termsInOption, language)}
                  </span>
                </label>
              );
            })}
          </div>
          {/* Only render help text if it exists */}
          {helpExample && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {helpExample}
            </p>
          )}
          {isUnanswered && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {translations[language].pleaseSelectAtLeastOne}
            </p>
          )}
        </div>
      );
    default:
      return null;
  }
};