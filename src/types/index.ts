export interface Municipality {
  id: string;
  name: string;
  prefecture: string;
  type: MunicipalityType;
  basic: {
    code: string;
    prefecture: string;
    name: string;
    type: MunicipalityType;
  };
  current: {
    financialIndex: BaseMetrics;
    expenseRatio: BaseMetrics;
    debtPaymentRatio: BaseMetrics;
    futureBurdenRatio: BaseMetrics;
    laspeyresIndex: BaseMetrics;
  };
  evaluation?: FinancialEvaluation;
}

export interface BaseMetrics {
  value: number;
  rank?: number;
  average?: number;
  year?: number;
  hasData?: boolean;
  isEstimate?: boolean;
  quartiles?: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export enum MunicipalityType {
  PREFECTURE = 'prefecture',
  DESIGNATED_CITY = 'designated_city',
  CAPITAL_CITY = 'capital_city',
  MUNICIPALITY = 'municipality'
}

export const MUNICIPALITY_TYPES = {
  PREFECTURE: MunicipalityType.PREFECTURE,
  DESIGNATED_CITY: MunicipalityType.DESIGNATED_CITY,
  CAPITAL_CITY: MunicipalityType.CAPITAL_CITY,
  MUNICIPALITY: MunicipalityType.MUNICIPALITY
} as const;

export enum MetricType {
  FINANCIAL_INDEX = 'financial_index',     // 財政力指数
  EXPENSE_RATIO = 'expense_ratio',         // 経常収支比率
  DEBT_PAYMENT_RATIO = 'debt_ratio',       // 実質公債費比率
  FUTURE_BURDEN_RATIO = 'burden_ratio',    // 将来負担比率
  LASPEYRES_INDEX = 'salary_index',        // ラスパイレス指数
  TOTAL_SCORE = 'total_score'              // 総合スコア
}

export const METRICS = {
  FINANCIAL_INDEX: MetricType.FINANCIAL_INDEX,
  EXPENSE_RATIO: MetricType.EXPENSE_RATIO,
  DEBT_PAYMENT_RATIO: MetricType.DEBT_PAYMENT_RATIO,
  FUTURE_BURDEN_RATIO: MetricType.FUTURE_BURDEN_RATIO,
  LASPEYRES_INDEX: MetricType.LASPEYRES_INDEX,
  TOTAL_SCORE: MetricType.TOTAL_SCORE
} as const;

export interface RawCSVData {
  団体コード: string;
  都道府県名: string;
  団体名: string;
  財政力指数: string;
  経常収支比率: string;
  実質公債費比率: string;
  将来負担比率: string;
  ラスパイレス指数: string;
}

export interface FilterCriteria {
  types?: MunicipalityType[];
  prefectures?: string[];
  searchText?: string;
  metricRange?: {
    metric?: MetricType;
    min?: number;
    max?: number;
  };
}

export interface ProcessResult<T> {
  success: boolean;
  data?: T;
  error?: string | { message: string; code: string; details: unknown };
}

export interface MetricInfo {
  label: string;
  description: string;
  unit: string;
  higherIsBetter: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
  weight?: number;
  referenceValue?: number;
}

export interface Statistics {
  count: number;
  mean: number;
  median: number;
  max: number;
  min: number;
  standardDeviation: number;
}

export interface ChartData {
  name: string;
  value: number;
  type: MunicipalityType;
  prefecture: string;
}

export interface MetricStatistics extends Statistics {
  metric: MetricType;
  percentiles: {
    [key: number]: number;
  };
  quartiles?: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export interface MetricScore {
  rawValue: number;
  normalizedValue: number;
  weight: number;
  weightedScore: number;
}

export interface FinancialEvaluation {
  totalScore: number;
  rank: number;
  healthStatus: FinancialHealthStatus;
  scores: {
    [key in MetricType]: MetricScore;
  };
}

export enum FinancialHealthStatus {
  HEALTHY = 'healthy',
  CAUTION = 'caution',
  WARNING = 'warning'
}

export const HEALTH_STATUS_THRESHOLDS = {
  HEALTHY: 70,
  CAUTION: 50
} as const;

export type Result<T> = {
  success: boolean;
  data?: T;
  error?: string | { message: string; code: string; details: unknown };
};

export const INDICATOR_WEIGHTS = {
  FINANCIAL_INDEX: 0.35,      // 財政力指数（最重要）
  EXPENSE_RATIO: 0.25,        // 経常収支比率（重要）
  DEBT_PAYMENT_RATIO: 0.20,   // 実質公債費比率（重要）
  FUTURE_BURDEN_RATIO: 0.15,  // 将来負担比率（やや重要）
  LASPEYRES_INDEX: 0.05,      // ラスパイレス指数（参考指標）
} as const;

export const REFERENCE_VALUES = {
  FINANCIAL_INDEX: {
    IDEAL: 1.0,      // 理想的な値
    NORMAL: 0.5,     // 標準的な値
    WARNING: 0.3,    // 注意が必要な値
    DANGER: 0.2      // 危険な値
  },
  EXPENSE_RATIO: {
    IDEAL: 75,       // 理想的な値
    NORMAL: 85,      // 標準的な値
    WARNING: 90,     // 注意が必要な値
    DANGER: 95       // 危険な値
  },
  DEBT_PAYMENT_RATIO: {
    IDEAL: 10,       // 理想的な値
    NORMAL: 15,      // 標準的な値
    WARNING: 18,     // 注意が必要な値（早期健全化基準）
    DANGER: 25       // 危険な値（財政再生基準）
  },
  FUTURE_BURDEN_RATIO: {
    IDEAL: 100,      // 理想的な値
    NORMAL: 200,     // 標準的な値
    WARNING: 300,    // 注意が必要な値
    DANGER: 350      // 危険な値（早期健全化基準）
  },
  LASPEYRES_INDEX: {
    IDEAL: 100,      // 理想的な値
    NORMAL: 102,     // 標準的な値
    WARNING: 105,    // 注意が必要な値
    DANGER: 110      // 危険な値
  }
} as const;
