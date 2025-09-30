import React, { useState } from 'react';

export interface SunburstData {
  name: string;
  value?: number;
  color?: string;
  children?: SunburstData[];
}

interface SunburstChartProps {
  data: SunburstData;
  onSegmentClick?: (node: SunburstData) => void;
  width?: number;
  height?: number;
}

interface ArcData {
  path: string;
  color: string;
  data: SunburstData;
}

const SunburstChart: React.FC<SunburstChartProps> = ({
  data,
  onSegmentClick = () => {},
  width = 256,
  height = 256,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    const d = [
      'M',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(' ');
    return d;
  };

  const createArcs = (
    node: SunburstData,
    level: number,
    startAngle: number,
    endAngle: number,
    totalValue: number,
    maxLevels: number
  ): ArcData[] => {
    let arcs: ArcData[] = [];
    const angleRange = endAngle - startAngle;

    if (level > 0 && node.value) {
      const innerRadius = (level / maxLevels) * radius;
      const outerRadius = ((level + 1) / maxLevels) * radius;
      const path =
        describeArc(centerX, centerY, outerRadius, startAngle, endAngle) +
        ` L ${polarToCartesian(centerX, centerY, innerRadius, startAngle).x} ${polarToCartesian(centerX, centerY, innerRadius, startAngle).y} ` +
        describeArc(centerX, centerY, innerRadius, endAngle, startAngle) +
        ' Z';
      
      arcs.push({
        path,
        color: node.color || '#cccccc',
        data: node,
      });
    }

    if (node.children) {
      let currentAngle = startAngle;
      const childrenTotal = node.children.reduce((acc, child) => acc + (child.value || 0), 0) || 1;

      node.children.forEach(child => {
        const childAngle = (child.value || 0) / childrenTotal * angleRange;
        arcs = arcs.concat(
          createArcs(
            child,
            level + 1,
            currentAngle,
            currentAngle + childAngle,
            totalValue,
            maxLevels
          )
        );
        currentAngle += childAngle;
      });
    }

    return arcs;
  };

  const totalValue = data.children?.reduce((acc, child) => acc + (child.children?.reduce((s, c) => s + (c.value || 0), 0) || 0), 0) || 1;
  const maxLevels = data.children?.[0]?.children ? 2 : 1; // Simple depth calculation
  const allArcs = createArcs(data, 0, 0, 360, totalValue, maxLevels + 1);
  
  const centerText = hoveredSegment || data.name;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g>
        {allArcs.map((arc, i) => (
          <path
            key={i}
            d={arc.path}
            fill={arc.color}
            stroke="#fff"
            strokeWidth="1"
            onClick={() => onSegmentClick(arc.data)}
            onMouseEnter={() => setHoveredSegment(`${arc.data.name}: ${arc.data.value || ''}`)}
            onMouseLeave={() => setHoveredSegment(null)}
            className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
          />
        ))}
      </g>
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dy=".3em"
        className="text-xs font-semibold fill-current text-gray-700 dark:text-gray-200 pointer-events-none"
      >
        {centerText}
      </text>
    </svg>
  );
};

export default SunburstChart;
