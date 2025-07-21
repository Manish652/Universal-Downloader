import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Loader2, Sparkles, Zap, Globe } from 'lucide-react';
import DownloaderOptions from './DownloaderOptions';
import VideoInfoCard from './VideoInfoCard';
import ProgressBar from './ProgressBar';
import StatusMessage from './StatusMessage';

const UniversalDownloader = () => {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('both');
  const [quality, setQuality] = useState('720');
  const [format, setFormat] = useState('mp4');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadId, setDownloadId] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  
  const containerRef = useRef(null);
  const API_BASE = 'http://localhost:4000';

  // Floating particles animation effect
  useEffect(() => {
    const particles = [];
    const container = containerRef.current;
    if (!container) return;

    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: linear-gradient(45deg, #60a5fa, #a855f7);
        border-radius: 50%;
        animation: float-${i} ${8 + i * 2}s ease-in-out infinite;
        opacity: 0.3;
        pointer-events: none;
      `;
      container.appendChild(particle);
      particles.push(particle);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float-0 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(30px, -30px) rotate(180deg); } }
      @keyframes float-1 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-20px, -40px) rotate(-180deg); } }
      @keyframes float-2 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(40px, -20px) rotate(180deg); } }
      @keyframes float-3 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-30px, -35px) rotate(-180deg); } }
      @keyframes float-4 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(25px, -45px) rotate(180deg); } }
      @keyframes float-5 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-35px, -25px) rotate(-180deg); } }
    `;
    document.head.appendChild(style);

    return () => {
      particles.forEach(particle => particle.remove());
      style.remove();
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (url && isValidUrl(url) && url !== videoInfo?.url) {
        fetchVideoInfo();
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [url]);

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const fetchVideoInfo = async () => {
    if (!isValidUrl(url)) return;
    setFetchingInfo(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        const info = await response.json();
        setVideoInfo({ ...info, url });
      } else {
        setVideoInfo(null);
      }
    } catch (error) {
      setVideoInfo(null);
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim() || !isValidUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setStatus('Initializing quantum download...');
    setError('');
    setProgress(0);

    try {
      const response = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type, quality, format })
      });

      const data = await response.json();

      if (response.ok) {
        setDownloadId(data.downloadId);
        setStatus('🚀 Download in hyperdrive...');

        const pollProgress = async () => {
          try {
            const progressResponse = await fetch(`${API_BASE}/progress/${data.downloadId}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              setProgress(progressData.progress || 0);
              if (progressData.status === 'completed') {
                setLoading(false);
                setStatus('🎉 Mission accomplished! Download ready.');
                setProgress(100);
                setDownloadId(null);
              } else if (progressData.status === 'failed') {
                setLoading(false);
                setError(progressData.error || 'Houston, we have a problem');
                setStatus('');
                setDownloadId(null);
              } else {
                setTimeout(pollProgress, 1200);
              }
            }
          } catch (error) {
            setLoading(false);
            setDownloadId(null);
            setError('Connection lost in the digital void');
          }
        };
        setTimeout(pollProgress, 800);
      } else {
        setError(data.details || data.error || 'Download mission failed');
        setLoading(false);
        setStatus('');
      }
    } catch (error) {
      setError('Network anomaly detected. Check server status.');
      setLoading(false);
      setStatus('');
    }
  };

  const cancelDownload = async () => {
    if (downloadId) {
      try {
        await fetch(`${API_BASE}/download/${downloadId}`, { method: 'DELETE' });
      } catch (error) {}
    }
    setLoading(false);
    setStatus('Mission aborted by user command');
    setProgress(0);
    setDownloadId(null);
  };

  const clearMessages = () => {
    setStatus('');
    setError('');
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950/50 to-purple-950/50 px-4 py-8 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div 
        ref={containerRef}
        className="relative w-full max-w-3xl bg-slate-900/80 backdrop-blur-2xl text-white p-10 rounded-3xl shadow-2xl border border-slate-700/50 hover:border-slate-600/70 transition-all duration-500 group"
      >
        {/* Header with enhanced styling */}
        <div className="text-center mb-10 relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"></div>
          
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 mr-4">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              NEXUS
            </h1>
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 ml-4">
              <Globe className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <p className="text-slate-300 text-lg font-medium mb-2">Universal Media Downloader</p>
          <p className="text-slate-500 text-sm flex items-center justify-center">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered • Lightning Fast • Universal
          </p>
        </div>

        {/* Enhanced URL input */}
        <div className="mb-8 relative group">
          <div className={`relative transition-all duration-300 ${isUrlFocused ? 'transform scale-[1.02]' : ''}`}>
            <input
              type="text"
              placeholder="Paste any media URL here... ✨"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                clearMessages();
              }}
              onFocus={() => setIsUrlFocused(true)}
              onBlur={() => setIsUrlFocused(false)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-800/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-slate-700/50 focus:border-blue-400/50 transition-all duration-300 text-lg backdrop-blur-sm"
            />
            {fetchingInfo && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>

        {videoInfo && (
          <div className="transform transition-all duration-500 animate-in slide-in-from-bottom-4">
            <VideoInfoCard videoInfo={videoInfo} />
          </div>
        )}

        <div className="mb-8">
          <DownloaderOptions
            type={type}
            setType={setType}
            format={format}
            setFormat={setFormat}
            quality={quality}
            setQuality={setQuality}
            clearMessages={clearMessages}
          />
        </div>

        {/* Enhanced download button */}
        <button
          onClick={loading ? cancelDownload : handleDownload}
          disabled={!url.trim() || fetchingInfo}
          className={`relative w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center space-x-3 overflow-hidden group ${
            loading
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25'
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-purple-500/25'
          } transform hover:scale-[1.02] active:scale-[0.98]`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {loading ? (
            <>
              <X className="w-6 h-6 z-10" />
              <span className="z-10">Abort Mission</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6 z-10" />
              <span className="z-10">Launch Download</span>
              <Sparkles className="w-5 h-5 z-10 opacity-70" />
            </>
          )}
        </button>

        {loading && (
          <div className="mt-6 transform transition-all duration-500 animate-in slide-in-from-bottom-2">
            <ProgressBar progress={progress} />
          </div>
        )}

        <StatusMessage status={status} error={error} />

        {/* Enhanced footer */}
        <div className="mt-10 p-6 bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-2xl border border-slate-600/30 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-3">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
          <p className="text-sm text-slate-300 text-center leading-relaxed">
            <span className="inline-block mr-2">🌐</span>
            <strong>Multi-Platform Support:</strong> YouTube, Vimeo, Twitter, Instagram, TikTok & 50+ sites
            <br />
            <span className="inline-block mr-2 mt-2">🔒</span>
            <strong>Privacy First:</strong> All downloads processed locally on your device
          </p>
        </div>
      </div>
    </div>
  );
};

export default UniversalDownloader;
