'use client';

import React from 'react';
import { RoleCategory } from '@/types';

interface RadarChartProps {
  coverage: Record<RoleCategory, number>;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ coverage, size = 220 }) => {
  const axes: { key: RoleCategory; label: string }[] = [
    { key: 'frontend', label: 'Frontend' },
    { key: 'backend', label: 'Backend' },
    { key: 'ai_ml', label: 'AI / ML' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'design', label: 'Design' },
    { key: 'devops', label: 'DevOps' },
  ];

  const center = size / 2;
  const radius = (size / 2) - 34;
  const totalAxes = axes.length;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = radius * Math.min(1, Math.max(0, value));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Build grid rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Polygon points
  const pointsString = axes
    .map((axis, i) => {
      const val = coverage[axis.key] || 0;
      const { x, y } = getCoordinates(i, val);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background concentric rings */}
        {rings.map((ring, idx) => {
          const ringPoints = axes
            .map((_, i) => {
              const { x, y } = getCoordinates(i, ring);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polygon
              key={idx}
              points={ringPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={ring === 1.0 ? 'none' : '3 3'}
            />
          );
        })}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={pointsString}
          fill="rgba(59, 130, 246, 0.25)"
          stroke="#2563eb"
          strokeWidth="2.5"
          className="transition-all duration-300"
        />

        {/* Data vertices */}
        {axes.map((axis, i) => {
          const val = coverage[axis.key] || 0;
          const { x, y } = getCoordinates(i, val);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#1d4ed8"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, 1.22);
          return (
            <text
              key={i}
              x={x}
              y={y + 3}
              textAnchor="middle"
              className="text-[10px] font-semibold fill-slate-600 select-none"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
