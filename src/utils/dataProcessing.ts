import { 
  Municipality, 
  MetricType, 
  RawCSVData, 
  MunicipalityType, 
  ProcessResult,
  FilterCriteria, 
  MetricStatistics,
  MetricInfo,
  REFERENCE_VALUES,
  INDICATOR_WEIGHTS
} from '../types';

import { 
  evaluateFinancialHealth, 
  calculateRankings 
} from './financialCalculations';

export {
  evaluateFinancialHealth,
  calculateRankings
};

// 文字列の安全な正規化
const normalizeString = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.toLowerCase().trim();
};

// データの処理
export function processRawData(rawData: RawCSVData[], type: MunicipalityType): ProcessResult<Municipality[]> {
  try {
    const processedData = rawData.map(row => {
      const baseMetrics = {
        value: 0,
        hasData: false,
        isEstimate: false,
        year: new Date().getFullYear(),
      };

      const municipality: Municipality = {
        id: row.団体コード,
        name: row.団体名,
        prefecture: row.都道府県名,
        type: type,
        basic: {
          code: row.団体コード,
          prefecture: row.都道府県名,
          name: row.団体名,
          type: type
        },
        current: {
          financialIndex: { ...baseMetrics, value: parseFloat(row.財政力指数) || 0 },
          expenseRatio: { ...baseMetrics, value: parseFloat(row.経常収支比率) || 0 },
          debtPaymentRatio: { ...baseMetrics, value: parseFloat(row.実質公債費比率) || 0 },
          futureBurdenRatio: { ...baseMetrics, value: parseFloat(row.将来負担比率) || 0 },
          laspeyresIndex: { ...baseMetrics, value: parseFloat(row.ラスパイレス指数) || 0 }
        }
      };

      // 財政評価を追加
      municipality.evaluation = evaluateFinancialHealth(municipality);

      return municipality;
    });

    return {
      success: true,
      data: processedData
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

export function getMetricValue(municipality: Municipality, metric: MetricType): number {
  switch (metric) {
    case MetricType.FINANCIAL_INDEX:
      return municipality.current.financialIndex.value;
    case MetricType.EXPENSE_RATIO:
      return municipality.current.expenseRatio.value;
    case MetricType.DEBT_PAYMENT_RATIO:
      return municipality.current.debtPaymentRatio.value;
    case MetricType.FUTURE_BURDEN_RATIO:
      return municipality.current.futureBurdenRatio.value;
    case MetricType.LASPEYRES_INDEX:
      return municipality.current.laspeyresIndex.value;
    case MetricType.TOTAL_SCORE:
      return municipality.evaluation?.totalScore ?? 0;
    default:
      return 0;
  }
}

export function filterData(data: Municipality[], criteria: FilterCriteria): Municipality[] {
  return data.filter(municipality => {
    // 自治体種別でのフィルタリング
    if (criteria.types && criteria.types.length > 0) {
      if (!criteria.types.includes(municipality.type)) {
        return false;
      }
    }

    // 都道府県でのフィルタリング
    if (criteria.prefectures && criteria.prefectures.length > 0) {
      if (!criteria.prefectures.includes(municipality.prefecture)) {
        return false;
      }
    }

    // テキスト検索
    if (criteria.searchText) {
      const searchLower = normalizeString(criteria.searchText);
      const nameLower = normalizeString(municipality.name);
      const prefectureLower = normalizeString(municipality.prefecture);
      
      if (searchLower && !nameLower.includes(searchLower) && !prefectureLower.includes(searchLower)) {
        return false;
      }
    }

    // 指標の範囲でのフィルタリング
    if (criteria.metricRange && criteria.metricRange.metric) {
      const value = getMetricValue(municipality, criteria.metricRange.metric);
      if (criteria.metricRange.min !== undefined && value < criteria.metricRange.min) {
        return false;
      }
      if (criteria.metricRange.max !== undefined && value > criteria.metricRange.max) {
        return false;
      }
    }

    return true;
  });
}

export function calculateStatistics(data: Municipality[], metric: MetricType): MetricStatistics {
  const values = data.map(m => getMetricValue(m, metric)).filter(v => !isNaN(v));
  
  if (values.length === 0) {
    return {
      metric,
      count: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      min: 0,
      max: 0,
      percentiles: {},
      quartiles: { q1: 0, q2: 0, q3: 0 }
    };
  }

  values.sort((a, b) => a - b);

  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  const median = values[Math.floor(values.length / 2)];
  const min = values[0];
  const max = values[values.length - 1];

  // 標準偏差の計算
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const averageSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  const standardDeviation = Math.sqrt(averageSquaredDiff);

  // パーセンタイルの計算
  const percentiles: { [key: number]: number } = {};
  [10, 25, 50, 75, 90].forEach(p => {
    const index = Math.floor((p / 100) * (values.length - 1));
    percentiles[p] = values[index];
  });

  // 四分位数の計算
  const q1Index = Math.floor(values.length * 0.25);
  const q2Index = Math.floor(values.length * 0.5);
  const q3Index = Math.floor(values.length * 0.75);

  return {
    metric,
    count: values.length,
    mean,
    median,
    standardDeviation,
    min,
    max,
    percentiles,
    quartiles: {
      q1: values[q1Index],
      q2: values[q2Index],
      q3: values[q3Index]
    }
  };
}

export function getIndicatorInfo(metric: MetricType): MetricInfo {
  const refValues = REFERENCE_VALUES[metric === MetricType.FINANCIAL_INDEX ? 'FINANCIAL_INDEX' :
                                  metric === MetricType.EXPENSE_RATIO ? 'EXPENSE_RATIO' :
                                  metric === MetricType.DEBT_PAYMENT_RATIO ? 'DEBT_PAYMENT_RATIO' :
                                  metric === MetricType.FUTURE_BURDEN_RATIO ? 'FUTURE_BURDEN_RATIO' :
                                  'LASPEYRES_INDEX'];
  
  switch (metric) {
    case MetricType.FINANCIAL_INDEX:
      return {
        label: '財政力指数',
        description: '財政力を示す指標で、1に近いほど財政力が高い',
        unit: '',
        higherIsBetter: true,
        warningThreshold: refValues.WARNING,
        dangerThreshold: refValues.DANGER,
        weight: INDICATOR_WEIGHTS.FINANCIAL_INDEX,
        referenceValue: refValues.IDEAL
      };
    case MetricType.EXPENSE_RATIO:
      return {
        label: '経常収支比率',
        description: '財政構造の弾力性を示す指標で、低いほど財政に余裕がある',
        unit: '%',
        higherIsBetter: false,
        warningThreshold: refValues.WARNING,
        dangerThreshold: refValues.DANGER,
        weight: INDICATOR_WEIGHTS.EXPENSE_RATIO,
        referenceValue: refValues.IDEAL
      };
    case MetricType.DEBT_PAYMENT_RATIO:
      return {
        label: '実質公債費比率',
        description: '借入金の返済額の大きさを示す指標',
        unit: '%',
        higherIsBetter: false,
        warningThreshold: refValues.WARNING,
        dangerThreshold: refValues.DANGER,
        weight: INDICATOR_WEIGHTS.DEBT_PAYMENT_RATIO,
        referenceValue: refValues.IDEAL
      };
    case MetricType.FUTURE_BURDEN_RATIO:
      return {
        label: '将来負担比率',
        description: '将来の財政負担の大きさを示す指標',
        unit: '%',
        higherIsBetter: false,
        warningThreshold: refValues.WARNING,
        dangerThreshold: refValues.DANGER,
        weight: INDICATOR_WEIGHTS.FUTURE_BURDEN_RATIO,
        referenceValue: refValues.IDEAL
      };
    case MetricType.LASPEYRES_INDEX:
      return {
        label: 'ラスパイレス指数',
        description: '国家公務員の給与水準を100とした場合の地方公務員の給与水準',
        unit: '',
        higherIsBetter: true,
        warningThreshold: refValues.WARNING,
        dangerThreshold: refValues.DANGER,
        weight: INDICATOR_WEIGHTS.LASPEYRES_INDEX,
        referenceValue: refValues.IDEAL
      };
    case MetricType.TOTAL_SCORE:
      return {
        label: '総合評価',
        description: '財政指標の総合的な評価スコア',
        unit: '点',
        higherIsBetter: true,
        warningThreshold: 50,
        dangerThreshold: 30,
        weight: 1.0,
        referenceValue: 100
      };
    default:
      return {
        label: '不明な指標',
        description: '',
        unit: '',
        higherIsBetter: true,
        weight: 0
      };
  }
}
