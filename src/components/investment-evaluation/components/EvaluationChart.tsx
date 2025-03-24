import React from 'react';
import { EvaluationResult, EvaluationStage } from '../../../types';
import { STAGE_NAMES, STAGE_WEIGHTS } from '../types';

interface EvaluationChartProps {
  result: EvaluationResult;
  language: 'zh' | 'en';
}

const EvaluationChart: React.FC<EvaluationChartProps> = ({ result, language }) => {
  const { stageScores } = result;
  
  // 根据分数获取颜色
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {language === 'zh' ? '各阶段评分' : 'Stage Scores'}
      </h3>
      
      <div className="space-y-3">
        {Object.entries(stageScores).map(([stage, stageScore]: [string, { score: number }]) => (
          <div key={stage} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {STAGE_NAMES[stage as EvaluationStage][language]} 
                ({STAGE_WEIGHTS[stage as EvaluationStage]}%)
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stageScore.score}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className={`${getScoreColor(stageScore.score)} h-2.5 rounded-full`} 
                style={{ width: `${stageScore.score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvaluationChart;