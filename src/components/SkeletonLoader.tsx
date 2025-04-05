import React from 'react';

interface SkeletonLoaderProps {
  type: 'card' | 'chart' | 'text';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        );
      case 'text':
        return (
          <div className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC = () => (
  <div className="card">
    <SkeletonLoader type="chart" />
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="card">
    <SkeletonLoader type="card" />
  </div>
);

export const ListSkeleton: React.FC<{ itemCount?: number }> = ({ itemCount = 5 }) => (
  <div className="card">
    <SkeletonLoader type="text" count={itemCount} />
  </div>
);

export default SkeletonLoader;
