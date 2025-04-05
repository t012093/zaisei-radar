import React, { useCallback, useMemo } from 'react';
import { Municipality, MetricType, METRICS, FilterCriteria, MunicipalityType } from '../types';
import { getIndicatorInfo } from '../utils/dataProcessing';

interface FilterPanelProps {
  onFilterChange: (criteria: FilterCriteria) => void;
  onMetricChange?: (metric: MetricType) => void;
  selectedMetric?: MetricType;
  municipalities: Municipality[];
}

const getUniquePrefectures = (municipalities: Municipality[]): string[] => {
  return Array.from(new Set(municipalities.map(m => m.prefecture))).sort();
};

const getUniqueTypes = (municipalities: Municipality[]): string[] => {
  return Array.from(new Set(municipalities.map(m => m.type))).sort();
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  onMetricChange,
  selectedMetric = METRICS.FINANCIAL_INDEX,
  municipalities
}) => {
  const [filters, setFilters] = React.useState<FilterCriteria>({
    prefectures: [],
    types: [],
    searchText: '',
    metricRange: undefined
  });

  const prefectures = useMemo(() => getUniquePrefectures(municipalities), [municipalities]);
  const types = useMemo(() => getUniqueTypes(municipalities), [municipalities]);

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterCriteria>) => {
      setFilters(prev => {
        const updated = { ...prev, ...newFilters };
        onFilterChange(updated);
        return updated;
      });
    },
    [onFilterChange]
  );

  const handleMetricSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const metric = event.target.value as MetricType;
      onMetricChange?.(metric);
    },
    [onMetricChange]
  );

  const handlePrefectureChange = useCallback(
    (prefecture: string | null) => {
      handleFilterChange({
        prefectures: prefecture ? [prefecture] : []
      });
    },
    [handleFilterChange]
  );

  const handleTypeChange = useCallback(
    (type: string, checked: boolean) => {
      handleFilterChange({
        types: checked 
          ? [...(filters.types || []), type as MunicipalityType]
          : (filters.types || []).filter(t => t !== type)
      });
    },
    [filters.types, handleFilterChange]
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">フィルター</h3>
      
      {/* 指標選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          指標
        </label>
        <select
          value={selectedMetric}
          onChange={handleMetricSelect}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {Object.entries(METRICS).map(([key, value]) => (
            <option key={key} value={value}>
              {getIndicatorInfo(value).label}
            </option>
          ))}
        </select>
      </div>

      {/* 都道府県フィルター */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          都道府県
        </label>
        <select
          value={filters.prefectures?.[0] || ''}
          onChange={(e) => handlePrefectureChange(e.target.value || null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">すべて</option>
          {prefectures.map(prefecture => (
            <option key={prefecture} value={prefecture}>
              {prefecture}
            </option>
          ))}
        </select>
      </div>

      {/* 自治体種別フィルター */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          自治体種別
        </label>
        <div className="space-y-2">
          {types.map(type => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.types?.includes(type as MunicipalityType) || false}
                onChange={(e) => handleTypeChange(type, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                {type === 'prefecture' ? '都道府県' :
                 type === 'designated_city' ? '政令指定都市' :
                 type === 'capital_city' ? '県庁所在地' : '市町村'}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
