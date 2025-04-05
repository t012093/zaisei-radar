import React, { useState, useCallback } from 'react';
import { MetricType, MunicipalityType, FilterCriteria } from '../types';

interface FilterPanelProps {
  onFilterChange: (criteria: FilterCriteria) => void;
  onMetricChange: (metric: MetricType) => void;
  selectedMetric: MetricType;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  onMetricChange,
  selectedMetric
}) => {
  const [municipalityTypes, setMunicipalityTypes] = useState<MunicipalityType[]>([]);
  const [prefectures, setPrefectures] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  // フィルター条件の変更を通知
  const updateFilters = useCallback(() => {
    onFilterChange({
      types: municipalityTypes,
      prefectures,
      searchText: searchText ? searchText.trim() : undefined,
    });
  }, [municipalityTypes, prefectures, searchText, onFilterChange]);

  // 自治体種別の選択を切り替え
  const handleTypeToggle = useCallback((type: MunicipalityType) => {
    setMunicipalityTypes(current => {
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return updated;
    });
  }, []);

  // 都道府県の選択を切り替え
  const handlePrefectureToggle = useCallback((prefecture: string) => {
    setPrefectures(current => {
      const updated = current.includes(prefecture)
        ? current.filter(p => p !== prefecture)
        : [...current, prefecture];
      return updated;
    });
  }, []);

  // テキストフィルターの更新（遅延実行）
  const handleSearchTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchText(newValue);
  }, []);

  // 指標の変更
  const handleMetricChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onMetricChange(e.target.value as MetricType);
  }, [onMetricChange]);

  // フィルターのリセット
  const handleReset = useCallback(() => {
    setMunicipalityTypes([]);
    setPrefectures([]);
    setSearchText('');
  }, []);

  // フィルター条件が変更されたら親コンポーネントに通知
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters();
    }, 300); // 300ms遅延で実行

    return () => clearTimeout(timeoutId);
  }, [municipalityTypes, prefectures, searchText, updateFilters]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          分析指標
        </label>
        <select
          value={selectedMetric}
          onChange={handleMetricChange}
          className="form-select block w-full"
        >
          <option value={MetricType.FINANCIAL_INDEX}>財政力指数</option>
          <option value={MetricType.EXPENSE_RATIO}>経常収支比率</option>
          <option value={MetricType.DEBT_PAYMENT_RATIO}>実質公債費比率</option>
          <option value={MetricType.FUTURE_BURDEN_RATIO}>将来負担比率</option>
          <option value={MetricType.LASPEYRES_INDEX}>ラスパイレス指数</option>
          <option value={MetricType.TOTAL_SCORE}>総合評価</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          テキスト検索
        </label>
        <input
          type="text"
          value={searchText}
          onChange={handleSearchTextChange}
          placeholder="自治体名や都道府県名で検索"
          className="form-input block w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          自治体種別
        </label>
        <div className="space-y-2">
          {Object.values(MunicipalityType).map(type => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={municipalityTypes.includes(type)}
                onChange={() => handleTypeToggle(type)}
                className="form-checkbox"
              />
              <span className="ml-2">
                {type === MunicipalityType.PREFECTURE ? '都道府県' :
                 type === MunicipalityType.DESIGNATED_CITY ? '政令指定都市' :
                 type === MunicipalityType.CAPITAL_CITY ? '県庁所在地' : '市町村'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleReset}
        className="button button-secondary w-full"
      >
        フィルターをリセット
      </button>
    </div>
  );
};

export default FilterPanel;
