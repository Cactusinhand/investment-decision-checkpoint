import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Zap,
  BarChart2,
  Cpu,
  Download 
} from 'lucide-react';
import { EvaluationResult } from '../../../types';
import { InvestmentDecision } from '../../../types';
import EvaluationChart from './EvaluationChart';

interface EvaluationResultProps {
  decision: InvestmentDecision;
  result: EvaluationResult;
  language: 'zh' | 'en';
  onClose: () => void;
  onSave: () => void;
}

const EvaluationResultDisplay: React.FC<EvaluationResultProps> = ({
  decision,
  result,
  language,
  onClose,
  onSave
}) => {
  const { 
    totalScore, 
    rating, 
    overallStrengths: strengths, 
    overallWeaknesses: weaknesses, 
    recommendations,
    apiEnhanced: apiAssisted
  } = result;
  
  // 评级名称显示
  const getRatingName = (rating: string): string => {
    switch (rating) {
      case 'system':
        return language === 'zh' ? '系统化' : 'Systematic';
      case 'stable':
        return language === 'zh' ? '稳健型' : 'Stable';
      case 'cautious':
        return language === 'zh' ? '谨慎型' : 'Cautious';
      case 'high-risk':
        return language === 'zh' ? '高风险' : 'High Risk';
      default:
        return '';
    }
  };
  
  // 评级颜色
  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'system':
        return 'bg-green-500 text-white';
      case 'stable':
        return 'bg-blue-500 text-white';
      case 'cautious':
        return 'bg-yellow-500 text-black';
      case 'high-risk':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // 导出评估结果
  const handleExportResult = () => {
    try {
      // 创建可下载的结果对象
      const exportData = {
        decisionName: decision.name,
        evaluationDate: new Date().toISOString(),
        totalScore,
        rating: getRatingName(rating),
        strengths,
        weaknesses,
        recommendations,
        stageScores: result.stageScores
      };
      
      // 创建下载链接
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', `${decision.name}_evaluation.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error('导出评估结果失败:', e);
    }
  };
  
  return (
    <Card className="w-full shadow-lg dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {language === 'zh' ? '投资决策评估结果' : 'Investment Decision Evaluation'}
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              {decision.name}
            </CardDescription>
          </div>
          <Badge variant="outline">
            <span className={`text-md px-3 py-1 ${getRatingColor(rating)}`}>
              {getRatingName(rating)}
            </span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 总分部分 */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'zh' ? '总分' : 'Total Score'}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
            <div 
              className={`h-3 rounded-full ${
                totalScore >= 85 ? 'bg-green-500' : 
                totalScore >= 70 ? 'bg-blue-500' : 
                totalScore >= 55 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${totalScore}%` }}
            ></div>
          </div>
        </div>
        
        {/* 评分图表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EvaluationChart result={result} language={language} />
          
          {/* 雷达图 */}
          <React.Suspense fallback={<div className="h-64 flex items-center justify-center"><span>加载图表中...</span></div>}>
            {/* 动态导入雷达图组件以提高性能 */}
            {(() => {
              const EvaluationRadarChart = React.lazy(() => import('./EvaluationRadarChart'));
              return <EvaluationRadarChart result={result} language={language} />;
            })()}
          </React.Suspense>
        </div>
        
        {/* 强项 */}
        {strengths.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <CheckCircle2 size={16} className="text-green-500" />
              {language === 'zh' ? '强项' : 'Strengths'}
            </h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-300">
              {strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* 弱项 */}
        {weaknesses.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <AlertTriangle size={16} className="text-yellow-500" />
              {language === 'zh' ? '弱项' : 'Weaknesses'}
            </h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-300">
              {weaknesses.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* 建议 */}
        <div className="space-y-2">
          <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-1">
            <Zap size={16} className="text-blue-500" />
            {language === 'zh' ? '建议' : 'Recommendations'}
          </h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800">
            <ul className="list-disc list-inside text-sm space-y-2 text-gray-700 dark:text-gray-200">
              {recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* DeepSeek AI分析提示 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-1 mb-2">
            <Cpu size={16} className="text-blue-500" />
            {language === 'zh' ? 'DeepSeek AI分析' : 'DeepSeek AI Analysis'}
          </h3>
          <div className="text-gray-700 dark:text-gray-200 text-sm">
            {apiAssisted ? (
              <p>
                {language === 'zh' 
                  ? '本评估结果由DeepSeek AI增强分析，包含对投资逻辑一致性、风险评估一致性和认知偏差的深度分析。'
                  : 'This evaluation is enhanced by DeepSeek AI, including deep analysis of investment logic consistency, risk assessment consistency, and cognitive biases.'}
              </p>
            ) : (
              <p>
                {language === 'zh'
                  ? '启用DeepSeek API可获得更深入的投资策略分析，包括逻辑一致性检查、风险评估验证和认知偏差识别。'
                  : 'Enable DeepSeek API to get more in-depth investment strategy analysis, including logic consistency checks, risk assessment validation, and cognitive bias identification.'}
              </p>
            )}
          </div>
        </div>
        
        {/* 评级说明 */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-1 mb-2">
            <Info size={16} />
            {language === 'zh' ? '评级说明' : 'Rating Description'}
          </h3>
          <div className="text-gray-600 dark:text-gray-300">
            {rating === 'system' && (
              <p>{language === 'zh' ? '策略高度完备，可直接执行。' : 'Strategy is highly complete and ready for execution.'}</p>
            )}
            {rating === 'stable' && (
              <p>{language === 'zh' ? '需优化局部缺陷，整体框架可行。' : 'Strategy requires minor optimizations but overall framework is viable.'}</p>
            )}
            {rating === 'cautious' && (
              <p>{language === 'zh' ? '存在显著漏洞，需降低仓位并完善策略。' : 'Strategy has significant gaps, position reduction and refinement needed.'}</p>
            )}
            {rating === 'high-risk' && (
              <p>{language === 'zh' ? '策略不可执行，需重新设计投资框架。' : 'Strategy cannot be executed, investment framework redesign needed.'}</p>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleExportResult}
          className="flex items-center gap-1"
        >
          <Download size={16} />
          {language === 'zh' ? '导出结果' : 'Export Result'}
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          
          <Button
            onClick={onSave}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {language === 'zh' ? '保存并完成' : 'Save & Complete'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EvaluationResultDisplay;