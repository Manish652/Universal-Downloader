import React from 'react';

const ProgressBar = ({ progress }) => (
  <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
    <div className="flex justify-between items-center mb-3">
      <span className="text-white font-medium">Downloading...</span>
      <span className="text-white font-bold">{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
      <div 
        className="h-full bg-blue-500 transition-all duration-500 ease-out" 
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export default ProgressBar;
