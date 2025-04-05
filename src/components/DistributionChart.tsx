import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Rectangle,
  RectangleProps,
  Text
} from 'recharts';
import { Municipality, MetricType } from '../types';
import { getIndicatorInfo, getMetricValue } from '../utils/dataProcessing';

interface DistributionChartProps {
  data: Municipality[];
  metric: MetricType;
}

interface HistogramData {
  range: string;
  displayRange: string;
  count: number;
  binStart: number;
  binEnd: number;
  percentage: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: HistogramData;
    value: number;
  }>;
}

// 固定の範囲を定義
const FIXED_RANGES = [
  { start: 0.06, end: 0.19 },
  { start: 0.19, end: 0.31 },
  { start: 0.31, end: 0.44 },
  { start: 0.44, end: 0.56 },
  { start: 0.56, end: 0.69 },
  { start: 0.69, end: 0.81 },
  { start: 0.81, end: 0.94 },
  { start: 0.94, end: 1.06 },
  { start: 1.06, end: 1.19 },
  { start: 1.19, end: 1.31 },
  { start: 1.31, end: 1.44 },
  { start: 1.44, end: 1.56 },
  { start: 1.56, end: 1.69 },
  { start: 1.69, end: 1.81 },
  { start: 1.81, end: 1.90 }
];

const formatNumber = (value: number): string => {
  return value.toFixed(2);
};

const formatRange = (start: number, end: number, unit: string): string => {
  return `${formatNumber(start)} ～ ${formatNumber(end)}${unit}`;
};

const formatDisplayNumber = (value: number): string => {
  if (value === 0) return '0';
  if (value < 0.1) return value.toFixed(2);
  if (value < 1) return value.toFixed(2);
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
};

// カスタムX軸ラベル
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <Text
      x={x}
      y={y}
      width={60}
      textAnchor="middle"
      verticalAnchor="start"
      fontSize={11}
    >
      {payload.value}
    </Text>
  );
};

const DistributionChart: React.FC<DistributionChartProps> = ({ data, metric }) => {
  const info = getIndicatorInfo(metric);
  const values = React.useMemo(() => data.map(m => getMetricValue(m, metric)), [data, metric]);
  
  // 統計情報の計算
  const stats = React.useMemo(() => {
    const sortedValues = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    const median = sortedValues[Math.floor(values.length / 2)];
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      min: sortedValues[0],
      max: sortedValues[sortedValues.length - 1]
    };
  }, [values]);

  // ヒストグラムのデータを生成
  const histogramData = React.useMemo(() => {
    const bins = FIXED_RANGES.map(range => ({
      start: range.start,
      end: range.end,
      count: 0
    }));

    // 各値を適切なビンに振り分け
    values.forEach(value => {
      const binIndex = bins.findIndex((bin, index) => {
        if (index === bins.length - 1) {
          return value >= bin.start && value <= bin.end;
        }
        return value >= bin.start && value < bin.end;
      });
      
      if (binIndex >= 0) {
        bins[binIndex].count++;
      }
    });

    // グラフ用のデータ形式に変換
    return bins.map((bin): HistogramData => ({
      range: formatDisplayNumber(bin.start),
      displayRange: formatRange(bin.start, bin.end, info.unit),
      count: bin.count,
      binStart: bin.start,
      binEnd: bin.end,
      percentage: (bin.count / values.length * 100).toFixed(1)
    }));
  }, [values, info.unit]);

  // グラデーション定義
  const colors = React.useMemo(() => {
    const maxCount = Math.max(...histogramData.map(d => d.count));
    return histogramData.map(item => {
      const intensity = item.count / maxCount;
      return `rgba(59, 130, 246, ${0.4 + intensity * 0.6})`; // 青色のグラデーション
    });
  }, [histogramData]);

  // カスタムバーコンポーネント
  const CustomBar = React.memo((props: RectangleProps) => (
    <Rectangle {...props} rx={4} ry={4} />
  ));
  CustomBar.displayName = 'CustomBar';

  // カスタムツールチップ
  const CustomTooltip = React.memo(({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const { count, displayRange, percentage } = data;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900">
          {displayRange}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {count}件 <span className="text-gray-500">({percentage}%)</span>
        </p>
      </div>
    );
  });
  CustomTooltip.displayName = 'CustomTooltip';

  // Y軸の最大値を計算（余白を含める）
  const yAxisDomain: [number, number] = [0, Math.ceil(Math.max(...histogramData.map(d => d.count)) * 1.1)];

  return (
    <div className="h-[500px] p-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">分布状況</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-gray-600">平均</div>
            <div className="font-medium">{formatNumber(stats.mean)}{info.unit}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-gray-600">中央値</div>
            <div className="font-medium">{formatNumber(stats.median)}{info.unit}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-gray-600">標準偏差</div>
            <div className="font-medium">{formatNumber(stats.stdDev)}{info.unit}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-gray-600">最小値</div>
            <div className="font-medium">{formatNumber(stats.min)}{info.unit}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-gray-600">最大値</div>
            <div className="font-medium">{formatNumber(stats.max)}{info.unit}</div>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="75%">
        <BarChart
          data={histogramData}
          margin={{
            top: 20,
            right: 30,
            left: 70,
            bottom: 40
          }}
          barCategoryGap={1}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            angle={0}
            interval={0}
            height={60}
            tick={<CustomXAxisTick />}
            tickMargin={10}
            label={{
              value: info.unit,
              position: 'bottom',
              offset: 25,
              style: { fontSize: 12 }
            }}
          />
          <YAxis
            domain={yAxisDomain}
            label={{ 
              value: '自治体数', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
              offset: -45
            }}
            tickMargin={8}
            allowDecimals={false}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar
            dataKey="count"
            shape={<CustomBar />}
            maxBarSize={45}
          >
            {histogramData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

DistributionChart.displayName = 'DistributionChart';

export default DistributionChart;
