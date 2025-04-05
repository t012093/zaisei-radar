import { 
  Municipality, 
  MetricType, 
  MetricScore, 
  FinancialEvaluation, 
  FinancialHealthStatus, 
  HEALTH_STATUS_THRESHOLDS,
  REFERENCE_VALUES,
  INDICATOR_WEIGHTS
} from '../types';

// 指標ごとのスコアを計算
export function calculateMetricScore(value: number, metric: MetricType): MetricScore {
  const refValues = REFERENCE_VALUES[metric === MetricType.FINANCIAL_INDEX ? 'FINANCIAL_INDEX' :
                                  metric === MetricType.EXPENSE_RATIO ? 'EXPENSE_RATIO' :
                                  metric === MetricType.DEBT_PAYMENT_RATIO ? 'DEBT_PAYMENT_RATIO' :
                                  metric === MetricType.FUTURE_BURDEN_RATIO ? 'FUTURE_BURDEN_RATIO' :
                                  'LASPEYRES_INDEX'];
  const weight = INDICATOR_WEIGHTS[metric === MetricType.FINANCIAL_INDEX ? 'FINANCIAL_INDEX' :
                                 metric === MetricType.EXPENSE_RATIO ? 'EXPENSE_RATIO' :
                                 metric === MetricType.DEBT_PAYMENT_RATIO ? 'DEBT_PAYMENT_RATIO' :
                                 metric === MetricType.FUTURE_BURDEN_RATIO ? 'FUTURE_BURDEN_RATIO' :
                                 'LASPEYRES_INDEX'];

  let normalizedValue: number;

  if (metric === MetricType.LASPEYRES_INDEX) {
    // ラスパイレス指数は100に近いほど良い
    const deviation = Math.abs(value - refValues.IDEAL);
    normalizedValue = Math.max(0, 100 - (deviation / (refValues.DANGER - refValues.IDEAL)) * 100);
  } else if (metric === MetricType.FINANCIAL_INDEX) {
    // 財政力指数
    if (value >= refValues.IDEAL) {
      normalizedValue = 100;
    } else if (value >= refValues.NORMAL) {
      normalizedValue = 80 + (value - refValues.NORMAL) / (refValues.IDEAL - refValues.NORMAL) * 20;
    } else if (value >= refValues.WARNING) {
      normalizedValue = 60 + (value - refValues.WARNING) / (refValues.NORMAL - refValues.WARNING) * 20;
    } else if (value >= refValues.DANGER) {
      normalizedValue = 40 + (value - refValues.DANGER) / (refValues.WARNING - refValues.DANGER) * 20;
    } else {
      normalizedValue = Math.max(0, (value / refValues.DANGER) * 40);
    }
  } else {
    // 経常収支比率、実質公債費比率、将来負担比率
    if (value <= refValues.IDEAL) {
      normalizedValue = 100;
    } else if (value <= refValues.NORMAL) {
      normalizedValue = 80 - (value - refValues.IDEAL) / (refValues.NORMAL - refValues.IDEAL) * 20;
    } else if (value <= refValues.WARNING) {
      normalizedValue = 60 - (value - refValues.NORMAL) / (refValues.WARNING - refValues.NORMAL) * 20;
    } else if (value <= refValues.DANGER) {
      normalizedValue = 40 - (value - refValues.WARNING) / (refValues.DANGER - refValues.WARNING) * 20;
    } else {
      normalizedValue = Math.max(0, 40 - (value - refValues.DANGER) / refValues.DANGER * 40);
    }
  }

  // 0-100の範囲に収める
  normalizedValue = Math.max(0, Math.min(100, normalizedValue));

  return {
    rawValue: value,
    normalizedValue,
    weight: weight,
    weightedScore: normalizedValue * weight
  };
}

// 財政健全度の総合評価
export function evaluateFinancialHealth(municipality: Municipality): FinancialEvaluation {
  const scores: { [key in MetricType]: MetricScore } = {
    [MetricType.FINANCIAL_INDEX]: calculateMetricScore(
      municipality.current.financialIndex.value,
      MetricType.FINANCIAL_INDEX
    ),
    [MetricType.EXPENSE_RATIO]: calculateMetricScore(
      municipality.current.expenseRatio.value,
      MetricType.EXPENSE_RATIO
    ),
    [MetricType.DEBT_PAYMENT_RATIO]: calculateMetricScore(
      municipality.current.debtPaymentRatio.value,
      MetricType.DEBT_PAYMENT_RATIO
    ),
    [MetricType.FUTURE_BURDEN_RATIO]: calculateMetricScore(
      municipality.current.futureBurdenRatio.value,
      MetricType.FUTURE_BURDEN_RATIO
    ),
    [MetricType.LASPEYRES_INDEX]: calculateMetricScore(
      municipality.current.laspeyresIndex.value,
      MetricType.LASPEYRES_INDEX
    ),
    [MetricType.TOTAL_SCORE]: {
      rawValue: 0,
      normalizedValue: 0,
      weight: 0,
      weightedScore: 0
    }
  };

  // 総合スコアの計算（TOTAL_SCOREを除外）
  const totalScore = Object.entries(scores)
    .filter(([key]) => key !== MetricType.TOTAL_SCORE)
    .reduce((sum, [_, score]) => sum + score.weightedScore, 0);

  // 健全度の判定
  let healthStatus: FinancialHealthStatus;
  if (totalScore >= HEALTH_STATUS_THRESHOLDS.HEALTHY) {
    healthStatus = FinancialHealthStatus.HEALTHY;
  } else if (totalScore >= HEALTH_STATUS_THRESHOLDS.CAUTION) {
    healthStatus = FinancialHealthStatus.CAUTION;
  } else {
    healthStatus = FinancialHealthStatus.WARNING;
  }

  // 総合スコアを更新
  scores[MetricType.TOTAL_SCORE] = {
    rawValue: totalScore,
    normalizedValue: totalScore,
    weight: 1,
    weightedScore: totalScore
  };

  return {
    totalScore,
    rank: 0, // ランクは後で設定
    healthStatus,
    scores
  };
}

// 財政評価のランキングを計算
export function calculateRankings(municipalities: Municipality[]): Municipality[] {
  // 総合スコアでソート
  const sorted = [...municipalities].sort((a, b) => {
    const scoreA = a.evaluation?.totalScore || 0;
    const scoreB = b.evaluation?.totalScore || 0;
    return scoreB - scoreA;
  });

  // ランク付け
  return sorted.map((municipality, index) => ({
    ...municipality,
    evaluation: {
      ...municipality.evaluation!,
      rank: index + 1
    }
  }));
}
