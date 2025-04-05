import React from 'react';
import { Municipality, MetricType, FinancialHealthStatus } from '../types';
import { calculateStatistics, getIndicatorInfo } from '../utils/dataProcessing';

interface StatsCardProps {
  data: Municipality[];
  metric: MetricType;
}

const StatsCard: React.FC<StatsCardProps> = ({ data, metric }) => {
  const stats = calculateStatistics(data, metric);
  const info = getIndicatorInfo(metric);

  const formatValue = (value: number): string => {
    if (Math.abs(value) >= 1000) {
      return value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
    }
    return value.toFixed(2);
  };

  const getHealthStatusColor = (status: FinancialHealthStatus): string => {
    switch (status) {
      case FinancialHealthStatus.HEALTHY:
        return 'text-green-600';
      case FinancialHealthStatus.CAUTION:
        return 'text-yellow-600';
      case FinancialHealthStatus.WARNING:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getValueColor = (value: number): string => {
    if (info.higherIsBetter) {
      if (value >= (info.warningThreshold ?? 0)) {
        return 'text-green-600';
      } else if (value >= (info.dangerThreshold ?? 0)) {
        return 'text-yellow-600';
      }
      return 'text-red-600';
    } else {
      if (value <= (info.warningThreshold ?? 0)) {
        return 'text-green-600';
      } else if (value <= (info.dangerThreshold ?? 0)) {
        return 'text-yellow-600';
      }
      return 'text-red-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">
            {info.label}の基本統計情報
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">対象データ数</span>
              <span className="font-medium">{stats.count}団体</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平均値</span>
              <span className={`font-medium ${getValueColor(stats.mean)}`}>
                {formatValue(stats.mean)}{info.unit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">中央値</span>
              <span className={`font-medium ${getValueColor(stats.median)}`}>
                {formatValue(stats.median)}{info.unit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">最小値</span>
              <span className={`font-medium ${getValueColor(stats.min)}`}>
                {formatValue(stats.min)}{info.unit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">最大値</span>
              <span className={`font-medium ${getValueColor(stats.max)}`}>
                {formatValue(stats.max)}{info.unit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">標準偏差</span>
              <span className="font-medium">
                {formatValue(stats.standardDeviation)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">分布情報</h3>
          {stats.quartiles && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">四分位数分布</div>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 h-full bg-green-500"
                    style={{ width: '25%' }}
                  />
                  <div
                    className="absolute left-1/4 h-full bg-blue-500"
                    style={{ width: '25%' }}
                  />
                  <div
                    className="absolute left-1/2 h-full bg-yellow-500"
                    style={{ width: '25%' }}
                  />
                  <div
                    className="absolute left-3/4 h-full bg-red-500"
                    style={{ width: '25%' }}
                  />
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>{formatValue(stats.min)}</span>
                  <span>{formatValue(stats.quartiles.q1)}</span>
                  <span>{formatValue(stats.quartiles.q2)}</span>
                  <span>{formatValue(stats.quartiles.q3)}</span>
                  <span>{formatValue(stats.max)}</span>
                </div>
              </div>

              {info.description && (
                <div className="mt-4 text-sm text-gray-600">
                  <h4 className="font-medium mb-2">指標の説明</h4>
                  <p>{info.description}</p>
                  {info.warningThreshold && info.dangerThreshold && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"/>
                        <span>注意基準: {info.warningThreshold}{info.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"/>
                        <span>危険基準: {info.dangerThreshold}{info.unit}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
