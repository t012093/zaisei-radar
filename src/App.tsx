import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { processRawData, filterData } from './utils/dataProcessing';
import { Municipality, MetricType, METRICS, FilterCriteria, MUNICIPALITY_TYPES, RawCSVData } from './types';
import { calculateRankings } from './utils/financialCalculations';
import DistributionChart from './components/DistributionChart';
import RankingChart from './components/RankingChart';
import StatsCard from './components/StatsCard';
import FilterPanel from './components/FilterPanel';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingView from './components/LoadingView';
import MunicipalitySearch from './components/MunicipalitySearch';
import MunicipalityDetail from './components/MunicipalityDetail';
import MunicipalityDetailLoader from './components/MunicipalityDetailSkeleton';
import Papa from 'papaparse';
import './App.css';

const App: React.FC = () => {
  const [data, setData] = useState<Municipality[]>([]);
  const [filteredData, setFilteredData] = useState<Municipality[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(METRICS.FINANCIAL_INDEX);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const files = [
          '/全国主要財政資料.csv',
          '/政令指定都市の主要財政指標.csv',
          '/道府県庁所在市の主要財政指標.csv',
          '/市町村財政資料.csv'
        ];

        const responses = await Promise.all(
          files.map(file => fetch(file).then(res => {
            if (!res.ok) throw new Error(`Failed to load ${file}`);
            return res.text();
          }))
        );

        const allData = await Promise.all(responses.map((text, index) => {
          return new Promise<Municipality[]>((resolve) => {
            Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                const type = index === 0 ? MUNICIPALITY_TYPES.PREFECTURE :
                           index === 1 ? MUNICIPALITY_TYPES.DESIGNATED_CITY :
                           index === 2 ? MUNICIPALITY_TYPES.CAPITAL_CITY :
                           MUNICIPALITY_TYPES.MUNICIPALITY;
                
                const result = processRawData(results.data as RawCSVData[], type);
                resolve(result.success && result.data ? result.data : []);
              },
              error: (error) => {
                console.error('CSV Parse Error:', error);
                resolve([]);
              }
            });
          });
        }));

        let combinedData = allData.flat();
        
        if (combinedData.length === 0) {
          throw new Error('データの読み込みに失敗しました');
        }

        combinedData = calculateRankings(combinedData);
        
        setData(combinedData);
        setFilteredData(combinedData);

      } catch (err) {
        console.error('Data loading error:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = useCallback((criteria: FilterCriteria) => {
    const filtered = filterData(data, criteria);
    setFilteredData(calculateRankings(filtered));
  }, [data]);

  const handleMetricChange = useCallback((metric: MetricType) => {
    setSelectedMetric(metric);
  }, []);

  const handleMunicipalitySelect = useCallback((municipality: Municipality) => {
    setDetailLoading(true);
    
    // データから最新の自治体情報を取得
    const updatedMunicipality = data.find(m => m.id === municipality.id);
    
    if (updatedMunicipality) {
      setSelectedMunicipality(updatedMunicipality);
      
      // スクロール処理を遅延実行
      setTimeout(() => {
        const detailElement = document.getElementById('municipality-detail');
        if (detailElement) {
          detailElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
        setDetailLoading(false);
      }, 100);
    } else {
      console.error('Municipality not found:', municipality.id);
      setDetailLoading(false);
    }
  }, [data]);

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">地方財政状況分析</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-3">
            <ErrorBoundary>
              <FilterPanel
                onFilterChange={handleFilterChange}
                onMetricChange={handleMetricChange}
                selectedMetric={selectedMetric}
              />
            </ErrorBoundary>
          </div>

          <div className="lg:col-span-9">
            <div className="mb-8">
              <ErrorBoundary>
                <StatsCard
                  data={filteredData}
                  metric={selectedMetric}
                />
              </ErrorBoundary>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-4">
                <ErrorBoundary>
                  <DistributionChart
                    data={filteredData}
                    metric={selectedMetric}
                  />
                </ErrorBoundary>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <ErrorBoundary>
                  <RankingChart
                    data={filteredData}
                    metric={selectedMetric}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <ErrorBoundary>
              <MunicipalitySearch
                municipalities={data}
                onSelect={handleMunicipalitySelect}
              />
            </ErrorBoundary>
          </div>

          {(selectedMunicipality || detailLoading) && (
            <div id="municipality-detail" className="bg-white rounded-lg shadow">
              <ErrorBoundary>
                <Suspense fallback={<MunicipalityDetailLoader />}>
                  {detailLoading ? (
                    <MunicipalityDetailLoader />
                  ) : (
                    selectedMunicipality && (
                      <MunicipalityDetail
                        municipality={selectedMunicipality}
                        totalMunicipalities={data.length}
                      />
                    )
                  )}
                </Suspense>
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
