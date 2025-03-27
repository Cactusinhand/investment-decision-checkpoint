// src/components/investment-evaluation/components/EvaluationRadarChart.tsx
import React, { useEffect, useRef } from 'react';
import { EvaluationResult, EvaluationStage } from '../../../types';
import { STAGE_NAMES, STAGE_WEIGHTS } from '../types';

interface EvaluationRadarChartProps {
  result: EvaluationResult;
  language: 'zh' | 'en';
  className?: string;
}

const EvaluationRadarChart: React.FC<EvaluationRadarChartProps> = ({ 
  result, 
  language,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { stageScores } = result;
  
  // 绘制雷达图
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置画布尺寸 - 使用更紧凑的尺寸
    const size = Math.min(canvas.parentElement?.clientWidth || 300, 350);
    canvas.width = size;
    canvas.height = size;
    
    // 雷达图参数
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;
    
    // 获取所有阶段
    const stages = Object.keys(stageScores).sort();
    const stageCount = stages.length;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景网格
    drawRadarGrid(ctx, centerX, centerY, radius, stageCount);
    
    // 绘制数据区域
    drawRadarData(ctx, centerX, centerY, radius, stages, stageScores, stageCount);
    
    // 绘制标签
    drawRadarLabels(ctx, centerX, centerY, radius, stages, stageCount, language);
    
  }, [result, language]);
  
  // 绘制雷达图网格
  const drawRadarGrid = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    stageCount: number
  ) => {
    // 根据canvas的className判断是否为暗色模式
    const isDarkMode = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDarkMode ? '#4b5563' : '#e5e7eb'; // 暗色模式使用深色网格线，亮色模式使用浅灰色
    ctx.lineWidth = 1;
    
    // 绘制同心圆
    const gridLevels = 5; // 网格层级
    for (let i = 1; i <= gridLevels; i++) {
      const levelRadius = (radius * i) / gridLevels;
      ctx.beginPath();
      ctx.arc(centerX, centerY, levelRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 绘制分数标签
      ctx.fillStyle = isDarkMode ? '#d1d5db' : '#6b7280'; // 暗色模式使用更亮的文本颜色
      ctx.font = 'bold 10px sans-serif'; // 使用粗体增强可读性
      ctx.textAlign = 'center';
      
      // 只在顶部绘制分数标签，避免遮挡
      ctx.fillText(
        `${Math.round((i / gridLevels) * 100)}`, 
        centerX, 
        centerY - levelRadius - 5
      );
      
      // 在右侧也绘制一个分数标签，增强可读性
      if (i === gridLevels) {
        ctx.textAlign = 'left';
        ctx.fillText(
          `${Math.round((i / gridLevels) * 100)}`, 
          centerX + levelRadius + 5, 
          centerY
        );
      }
    }
    
    // 绘制轴线
    for (let i = 0; i < stageCount; i++) {
      const angle = (i * 2 * Math.PI) / stageCount - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };
  
  // 绘制雷达图数据
  const drawRadarData = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    stages: string[],
    stageScores: Record<string, { score: number }>,
    stageCount: number
  ) => {
    // 根据canvas的className判断是否为暗色模式
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // 暗色模式使用更亮的蓝色，亮色模式使用标准蓝色
    const fillColor = isDarkMode ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)';
    const strokeColor = isDarkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)';
    
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    
    for (let i = 0; i < stageCount; i++) {
      const stage = stages[i];
      const score = stageScores[stage].score / 100; // 归一化分数
      const angle = (i * 2 * Math.PI) / stageCount - Math.PI / 2;
      const x = centerX + radius * score * Math.cos(angle);
      const y = centerY + radius * score * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // 闭合路径
    const firstStage = stages[0];
    const firstScore = stageScores[firstStage].score / 100;
    const firstAngle = -Math.PI / 2; // 第一个点的角度
    const firstX = centerX + radius * firstScore * Math.cos(firstAngle);
    const firstY = centerY + radius * firstScore * Math.sin(firstAngle);
    ctx.lineTo(firstX, firstY);
    
    ctx.fill();
    ctx.stroke();
    
    // 绘制数据点
    for (let i = 0; i < stageCount; i++) {
      const stage = stages[i];
      const score = stageScores[stage].score / 100;
      const angle = (i * 2 * Math.PI) / stageCount - Math.PI / 2;
      const x = centerX + radius * score * Math.cos(angle);
      const y = centerY + radius * score * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2); // 增大数据点尺寸
      ctx.fillStyle = strokeColor;
      ctx.fill();
      
      // 在数据点旁边显示具体分数
      ctx.fillStyle = isDarkMode ? '#d1d5db' : '#4b5563';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 计算分数标签位置，稍微偏离数据点
      const labelDistance = 15;
      const labelX = centerX + (radius * score + labelDistance) * Math.cos(angle);
      const labelY = centerY + (radius * score + labelDistance) * Math.sin(angle);
      
      // 显示具体分数
      ctx.fillText(`${Math.round(score * 100)}`, labelX, labelY);
    }
  };
  
  // 绘制雷达图标签
  const drawRadarLabels = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    stages: string[],
    stageCount: number,
    language: 'zh' | 'en'
  ) => {
    // 根据canvas的className判断是否为暗色模式
    const isDarkMode = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDarkMode ? '#e5e7eb' : '#4b5563'; // 暗色模式使用浅色文本，亮色模式使用深灰色文本
    ctx.font = 'bold 12px sans-serif'; // 使用粗体增强可读性
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < stageCount; i++) {
      const stage = stages[i];
      const angle = (i * 2 * Math.PI) / stageCount - Math.PI / 2;
      const labelRadius = radius + 25; // 增加标签距离，避免遮挡
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      // 获取阶段名称
      const stageName = STAGE_NAMES[stage as EvaluationStage][language];
      const weight = STAGE_WEIGHTS[stage as EvaluationStage];
      
      // 根据角度调整文本对齐方式，特别优化右侧文本
      if (angle > -Math.PI / 4 && angle < Math.PI / 4) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        // 左侧文本额外偏移
        const x = centerX + (labelRadius + 5) * Math.cos(angle);
        const y = centerY + (labelRadius + 5) * Math.sin(angle);
        ctx.fillText(`${stageName} (${weight * 100}%)`, x, y);
        continue;
      } else if (angle >= 3 * Math.PI / 4 || angle < -3 * Math.PI / 4) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
      } else {
        // 右侧文本特殊处理，增加偏移量避免遮挡
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        // 右侧文本额外偏移
        const x = centerX + (labelRadius + 10) * Math.cos(angle);
        const y = centerY + (labelRadius + 0) * Math.sin(angle);
        ctx.fillText(`${stageName} (${weight * 100}%)`, x, y);
        continue;
      }
      
      // 绘制阶段名称和权重
      ctx.fillText(`${stageName} (${weight * 100}%)`, x, y);
    }
  }
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {language === 'zh' ? '评分雷达图' : 'Score Radar Chart'}
      </h3>
      <div className="relative w-full max-w-sm aspect-square">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          id="radar-chart"
        />
      </div>
    </div>
  );
};
export default EvaluationRadarChart;