import React, { useMemo } from 'react';
import { Municipality, METRICS, FinancialHealthStatus } from '../types';
import { getIndicatorInfo, getMetricValue } from '../utils/dataProcessing';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface MunicipalityDetailProps {
  municipality: Municipality;
  className?: string;
  totalMunicipalities?: number;
}

const MunicipalityDetail: React.FC<MunicipalityDetailProps> = ({
  municipality,
  className = '',
  totalMunicipalities
}) => {
  const metrics = [
    METRICS.FINANCIAL_INDEX,
    METRICS.EXPENSE_RATIO,
    METRICS.DEBT_PAYMENT_RATIO,
    METRICS.FUTURE_BURDEN_RATIO,
    METRICS.LASPEYRES_INDEX
  ];

  const getHealthStatusInfo = (status: FinancialHealthStatus) => {
    switch (status) {
      case FinancialHealthStatus.HEALTHY:
        return {
          label: '健全',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: '財政状況は良好です'
        };
      case FinancialHealthStatus.CAUTION:
        return {
          label: '要注意',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: '一部指標に注意が必要です'
        };
      case FinancialHealthStatus.WARNING:
        return {
          label: '要改善',
          color: 'bg-red-100 text-red-800 border-red-200',
          description: '財政状況の改善が必要です'
        };
      default:
        return {
          label: '不明',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: '評価できません'
        };
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'prefecture':
        return '都道府県';
      case 'designated_city':
        return '政令指定都市';
      case 'capital_city':
        return '県庁所在地';
      default:
        return '市町村';
    }
  };

  const formatValue = (value: number, unit: string = ''): string => {
    if (Math.abs(value) >= 1000) {
      return `${value.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}${unit}`;
    }
    return `${value.toFixed(2)}${unit}`;
  };

  const radarData = useMemo(() => {
    return metrics.map(metric => {
      const info = getIndicatorInfo(metric);
      const value = getMetricValue(municipality, metric);
      return {
        metric: info.label,
        value: value,
        fullMark: 100,
        info: info.description
      };
    });
  }, [municipality]);

  const healthStatus = getHealthStatusInfo(municipality.evaluation?.healthStatus ?? FinancialHealthStatus.WARNING);

  const formatRank = (rank: number): string => {
    if (!totalMunicipalities) return `${rank}位`;
    const percentile = ((rank / totalMunicipalities) * 100).toFixed(1);
    return `${rank}位 / ${totalMunicipalities}（上位${percentile}%）`;
  };

  return (
    <section 
      className={`bg-white rounded-lg shadow-lg p-6 animate-fade-in ${className}`}
      aria-labelledby="municipality-detail-title"
    >
      {/* ヘッダー */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 id="municipality-detail-title" className="text-2xl font-bold">
            {municipality.name}
          </h2>
          <span 
            className="px-3 py-1 rounded-full text-sm border"
            title={`自治体区分: ${getTypeLabel(municipality.type)}`}
          >
            {getTypeLabel(municipality.type)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">{municipality.prefecture}</span>
          <span className="text-gray-400">|</span>
          <span 
            className={`px-2 py-1 rounded-md text-sm ${healthStatus.color}`}
            title={healthStatus.description}
          >
            {healthStatus.label}
          </span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 指標一覧 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">財政指標</h3>
          <div className="space-y-4">
            {metrics.map(metric => {
              const info = getIndicatorInfo(metric);
              const value = getMetricValue(municipality, metric);
              const progress = Math.min(100, (value / (info.referenceValue ?? 100)) * 100);
              const isGood = value >= (info.warningThreshold ?? 0);
              const isCaution = !isGood && value >= (info.dangerThreshold ?? 0);

              return (
                <div 
                  key={metric} 
                  className="bg-gray-50 p-4 rounded-lg"
                  role="group"
                  aria-labelledby={`metric-${metric}-label`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span id={`metric-${metric}-label`} className="font-medium">
                      {info.label}
                    </span>
                    <span className="text-lg" aria-label={`値: ${formatValue(value, info.unit)}`}>
                      {formatValue(value, info.unit)}
                    </span>
                  </div>
                  <div 
                    className="relative h-2 bg-gray-200 rounded overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`absolute left-0 top-0 h-full ${
                        isGood
                          ? 'bg-green-500'
                          : isCaution
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {info.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {info.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* レーダーチャートと総合評価 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">総合評価</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#4b5563', fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]}
                  tick={{ fill: '#4b5563', fontSize: 10 }}
                />
                <Radar
                  name="財政指標"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 shadow-lg rounded border">
                          <p className="font-medium">{data.metric}</p>
                          <p className="text-sm text-gray-600">{`値: ${formatValue(data.value)}`}</p>
                          {data.info && (
                            <p className="text-xs text-gray-500 mt-1">{data.info}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <p className="text-base text-gray-700">
              総合スコア: {municipality.evaluation?.totalScore.toFixed(1)}点
            </p>
            <p className="text-sm text-gray-600">
              全国順位: {formatRank(municipality.evaluation?.rank ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MunicipalityDetail;
