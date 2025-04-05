import React, { useMemo } from 'react';
import { Municipality, MetricType } from '../types';
import { getIndicatorInfo, getMetricValue } from '../utils/dataProcessing';

interface StatsCardProps {
  data: Municipality[];
  metric: MetricType;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  data,
  metric,
  className = ''
}) => {
  const info = getIndicatorInfo(metric);

  const stats = useMemo(() => {
    const values = data.map(m => getMetricValue(m, metric));
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = values.length > 0 ? sum / values.length : 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const min = sorted[0] || 0;
    const max = sorted[sorted.length - 1] || 0;

    return { avg, median, min, max };
  }, [data, metric]);

  const formatValue = (value: number): string => {
    if (Math.abs(value) >= 1000) {
      return value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
    }
    return value.toFixed(2);
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <div className="bg-white overflow-hidden rounded-lg shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1 truncate">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  平均値
                </h3>
              </div>
              <div className="mt-1">
                <p className="text-2xl font-semibold text-blue-600">
                  {formatValue(stats.avg)}{info.unit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden rounded-lg shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1 truncate">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  中央値
                </h3>
              </div>
              <div className="mt-1">
                <p className="text-2xl font-semibold text-blue-600">
                  {formatValue(stats.median)}{info.unit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden rounded-lg shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1 truncate">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  最小値
                </h3>
              </div>
              <div className="mt-1">
                <p className="text-2xl font-semibold text-green-600">
                  {formatValue(stats.min)}{info.unit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden rounded-lg shadow">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1 truncate">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  最大値
                </h3>
              </div>
              <div className="mt-1">
                <p className="text-2xl font-semibold text-red-600">
                  {formatValue(stats.max)}{info.unit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
