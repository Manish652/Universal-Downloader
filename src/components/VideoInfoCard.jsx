import React from 'react';
import { Info } from 'lucide-react';

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VideoInfoCard = ({ videoInfo }) => (
  <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Info className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-white mb-2 leading-tight">
          {videoInfo.title}
        </h3>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          {videoInfo.uploader && (
            <span>👤 {videoInfo.uploader}</span>
          )}
          {videoInfo.duration && (
            <span>⏱️ {formatDuration(videoInfo.duration)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default VideoInfoCard;
