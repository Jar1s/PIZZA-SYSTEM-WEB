'use client';

export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-64 bg-gray-300" />
      
      {/* Content Skeleton */}
      <div className="p-6">
        <div className="h-6 bg-gray-300 rounded mb-3 w-3/4" />
        <div className="h-4 bg-gray-200 rounded mb-2 w-full" />
        <div className="h-4 bg-gray-200 rounded mb-4 w-5/6" />
        
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-300 rounded w-20" />
          <div className="h-10 bg-gray-300 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

