import React from "react";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 text-left w-full animate-pulse">
      <div className="h-8 bg-[#c3c6d7]/40 rounded-lg w-1/3 mb-2"></div>
      <div className="h-4 bg-[#c3c6d7]/30 rounded-lg w-1/2 mb-6"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#c3c6d7]/50 rounded-xl p-5 h-32 flex flex-col justify-between">
            <div className="h-4 bg-[#c3c6d7]/30 rounded w-1/2"></div>
            <div className="h-8 bg-[#c3c6d7]/40 rounded w-1/3"></div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#c3c6d7]/50 rounded-xl p-6 h-64 mt-6">
        <div className="h-4 bg-[#c3c6d7]/30 rounded w-1/4 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-[#c3c6d7]/20 rounded w-full"></div>
          <div className="h-4 bg-[#c3c6d7]/20 rounded w-full"></div>
          <div className="h-4 bg-[#c3c6d7]/20 rounded w-full"></div>
          <div className="h-4 bg-[#c3c6d7]/20 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}
