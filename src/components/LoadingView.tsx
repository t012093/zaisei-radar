import React from 'react';
import { ChartSkeleton, StatsSkeleton } from './SkeletonLoader';

const LoadingView: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-8 animate-pulse"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="mb-8">
            <StatsSkeleton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </div>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">データを読み込んでいます...</p>
          <p className="text-sm text-gray-500 mt-2">
            初回読み込みには時間がかかる場合があります
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingView;
