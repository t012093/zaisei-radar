import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Municipality, MetricType } from '../types';
import { getIndicatorInfo, getMetricValue } from '../utils/dataProcessing';

interface RankingChartProps {
  data: Municipality[];
  metric: MetricType;
}

const RankingChart: React.FC<RankingChartProps> = ({ data, metric }) => {
  const info = getIndicatorInfo(metric);
  
  // データを指標でソートし、上位20位までを抽出
  const sortedData = [...data]
    .sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric))
    .slice(0, 20)
    .map((municipality, index) => ({
      name: municipality.name,
      value: getMetricValue(municipality, metric),
      prefecture: municipality.prefecture,
      rank: index + 1
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="tooltip-content">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">{data.prefecture}</p>
          <p className="text-sm">
            {info.label}: {data.value.toFixed(2)}{info.unit}
          </p>
          <p className="text-xs text-gray-500">
            第{data.rank}位
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[500px]">
      <h3 className="text-lg font-semibold mb-4">ランキング（上位20位）</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{
            top: 5,
            right: 30,
            left: 100,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={['dataMin', 'dataMax']} />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
            barSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RankingChart;
