import React from 'react';

// Ultra-fast skeleton loading components for instant perceived performance
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg border animate-pulse">
    <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const CategorySkeleton = () => (
  <div className="flex space-x-4 animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center space-y-2">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    ))}
  </div>
);

// Minimal loading component for instant display
export const FastLoadingSpinner = () => (
  <div className="flex items-center justify-center h-20">
    <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);