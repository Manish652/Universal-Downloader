import React from 'react';

const DownloaderOptions = ({ type, setType, format, setFormat, quality, setQuality, clearMessages }) => (
  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
      Download Options
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Content Type
        </label>
        <select 
          value={type} 
          onChange={(e) => { setType(e.target.value); clearMessages(); }} 
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="both">Video + Audio</option>
          <option value="video">Video Only</option>
          <option value="audio">Audio Only</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          File Format
        </label>
        <select 
          value={format} 
          onChange={(e) => { setFormat(e.target.value); clearMessages(); }} 
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          {type === 'audio' ? <>
            <option value="mp3">MP3</option>
            <option value="m4a">M4A</option>
          </> : <>
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
          </>}
        </select>
      </div>
      
      {type !== 'audio' && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Video Quality
          </label>
          <select 
            value={quality} 
            onChange={(e) => { setQuality(e.target.value); clearMessages(); }} 
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="1080">1080p (Full HD)</option>
            <option value="720">720p (HD)</option>
            <option value="480">480p (SD)</option>
            <option value="360">360p (Low)</option>
          </select>
        </div>
      )}
    </div>
  </div>
);

export default DownloaderOptions;
