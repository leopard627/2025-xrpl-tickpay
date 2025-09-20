"use client";

import React from 'react';

interface StreamingChartProps {
  data: number[];
  label: string;
  color?: string;
  maxValue?: number;
}

const StreamingChart: React.FC<StreamingChartProps> = ({
  data,
  label,
  color = '#2EE6A6',
  maxValue
}) => {
  const points = data.slice(-60); // 최근 60초
  const max = maxValue || Math.max(...points, 1);
  const width = 300;
  const height = 100;

  // SVG 경로 생성
  const pathData = points.map((value, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - (value / max) * height;
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-[#0B1220] p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[#C9CDD6]">{label}</span>
        <span className="text-[#2EE6A6] font-mono">
          {points.length > 0 ? points[points.length - 1].toFixed(2) : '0.00'}
        </span>
      </div>

      <div className="relative">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* 그리드 라인 */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1A2332" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" />

          {/* 데이터 라인 */}
          {points.length > 1 && (
            <>
              {/* 그라데이션 영역 */}
              <defs>
                <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
                fill={`url(#gradient-${label})`}
              />

              {/* 실제 라인 */}
              <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* 현재 값 점 */}
              {points.length > 0 && (
                <circle
                  cx={((points.length - 1) / (points.length - 1)) * width}
                  cy={height - (points[points.length - 1] / max) * height}
                  r="3"
                  fill={color}
                />
              )}
            </>
          )}
        </svg>

        {/* Y축 레이블 */}
        <div className="absolute left-0 top-0 text-xs text-[#C9CDD6]">
          {max.toFixed(1)}
        </div>
        <div className="absolute left-0 bottom-0 text-xs text-[#C9CDD6]">
          0
        </div>

        {/* X축 레이블 */}
        <div className="absolute bottom-0 right-0 text-xs text-[#C9CDD6]">
          {points.length}s
        </div>
      </div>
    </div>
  );
};

export default StreamingChart;