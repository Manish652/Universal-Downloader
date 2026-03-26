import React, { useState } from 'react';
import './App.css';
import MergeVideos from './components/MergeVideos';
import UniversalDownloader from './components/UniversalDownloader';
import { Download, Film } from 'lucide-react';

const TABS = [
  { id: 'download', label: 'Downloader', icon: Download },
  { id: 'merge', label: 'Merge Videos', icon: Film },
];

function App() {
  const [activeTab, setActiveTab] = useState('download');

  return (
    <div className="min-h-screen bg-slate-950">
      {activeTab === 'download' ? (
        <UniversalDownloader activeTab={activeTab} onTabChange={setActiveTab} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Header — matches downloader header */}
          <div className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Film className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-none text-white">BlackHole</h1>
                  <p className="text-xs text-slate-400">Universal Media Downloader</p>
                </div>
              </div>

              {/* Tab switcher in header */}
              <div className="flex gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === id
                        ? id === 'merge'
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow'
                          : 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-6">
            <MergeVideos />
          </div>

          <div className="pb-6 text-center text-xs text-slate-700">
            BlackHole 2.1 · Powered by yt-dlp + ffmpeg
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
