import React from 'react';

interface MunicipalityDetailSkeletonProps {
  className?: string;
}

const MunicipalityDetailSkeleton: React.FC<MunicipalityDetailSkeletonProps> = ({
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 animate-pulse ${className}`}>
      {/* ヘッダー */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-5 bg-gray-200 rounded w-20"></div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 指標一覧 */}
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* レーダーチャート */}
        <div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="aspect-square bg-gray-50 rounded-lg"></div>
          <div className="mt-4">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>

      {/* アクセシビリティのための非表示テキスト */}
      <div className="sr-only" role="status" aria-live="polite">
        データを読み込んでいます...
      </div>
    </div>
  );
};

const MunicipalityDetailLoader: React.FC<MunicipalityDetailSkeletonProps> = (props) => {
  return (
    <div aria-busy="true" aria-live="polite">
      <MunicipalityDetailSkeleton {...props} />
    </div>
  );
};

export default MunicipalityDetailLoader;
