import {
  AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  ClipboardPaste, Clock, Download, Film, Layers, Loader2,
  RefreshCw, Settings2, Sparkles, Trash2, X, Zap
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import DownloaderOptions from './DownloaderOptions';
import ProgressBar from './ProgressBar';
import VideoInfoCard from './VideoInfoCard';

const API_BASE = 'http://localhost:4000';

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

function formatBytes(bytes) {
  if (!bytes) return '?';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDuration(sec) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const STATUS = { IDLE: 'idle', DOWNLOADING: 'downloading', COMPLETED: 'completed', FAILED: 'failed' };

const TABS = [
  { id: 'download', label: 'Downloader', icon: Download },
  { id: 'merge', label: 'Merge Videos', icon: Film },
];

const UniversalDownloader = ({ activeTab = 'download', onTabChange = () => {} }) => {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('both');
  const [quality, setQuality] = useState('720');
  const [format, setFormat] = useState('mp4');
  const [audioQuality, setAudioQuality] = useState('192K');

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [downloadId, setDownloadId] = useState(null);
  const [speed, setSpeed] = useState('—');
  const [eta, setEta] = useState('—');
  const [downloaded, setDownloaded] = useState('');
  const [totalSize, setTotalSize] = useState('');

  const [videoInfo, setVideoInfo] = useState(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [showFormats, setShowFormats] = useState(false);

  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');

  const [downloadHistory, setDownloadHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bh_history') || '[]');
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);

  const [queueStatus, setQueueStatus] = useState(null);
  const [showQueue, setShowQueue] = useState(false);

  const pollRef = useRef(null);

  // Auto-fetch video info on URL change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (url && isValidUrl(url) && url !== videoInfo?.url) fetchVideoInfo(url);
    }, 800);
    return () => clearTimeout(timer);
  }, [url]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('bh_history', JSON.stringify(downloadHistory));
  }, [downloadHistory]);

  // Clean up poll on unmount
  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  // Queue status polling
  useEffect(() => {
    if (!showQueue) return;
    const interval = setInterval(fetchQueueStatus, 2000);
    fetchQueueStatus();
    return () => clearInterval(interval);
  }, [showQueue]);

  const clearMessages = useCallback(() => {
    setStatus('');
    setError('');
    if (downloadStatus === STATUS.COMPLETED || downloadStatus === STATUS.FAILED) {
      setDownloadStatus(STATUS.IDLE);
      setProgress(0);
      setSpeed('—');
      setEta('—');
    }
  }, [downloadStatus]);

  const fetchVideoInfo = async (infoUrl) => {
    setFetchingInfo(true);
    setError('');
    setVideoInfo(null);
    try {
      const res = await fetch(`${API_BASE}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: infoUrl })
      });
      if (res.ok) {
        const info = await res.json();
        setVideoInfo({ ...info, url: infoUrl });
        // Auto-apply best format from available formats
        if (info.formats?.length && type !== 'audio') {
          const best = info.formats.find(f => f.quality >= parseInt(quality)) || info.formats[0];
          if (best) setFormat(best.ext);
        }
      }
    } catch { /* ignore */ }
    finally { setFetchingInfo(false); }
  };

  const fetchQueueStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/queue/status`);
      if (res.ok) setQueueStatus(await res.json());
    } catch { /* ignore */ }
  };

  const addToHistory = (item) => {
    setDownloadHistory(prev => [
      { ...item, timestamp: new Date().toISOString() },
      ...prev
    ].slice(0, 20));
  };

  const startPoll = (id) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/progress/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            // Download not found, might have completed and been cleaned up
            setLoading(false);
            setDownloadStatus(STATUS.COMPLETED);
            setStatus('Download completed!');
            setProgress(100);
            setDownloadId(null);
            return;
          }
          throw new Error('HTTP ' + res.status);
        }

        const d = await res.json();

        if (d.progress !== undefined) setProgress(d.progress || 0);
        if (d.speed && d.speed !== '0 B/s') setSpeed(d.speed);
        if (d.eta && d.eta !== 'calculating...') setEta(d.eta);

        if (d.status === 'completed') {
          setLoading(false);
          setDownloadStatus(STATUS.COMPLETED);
          setStatus('✅ Download completed!');
          setProgress(100);
          setSpeed('—');
          setEta('—');
          setDownloadId(null);
        } else if (d.status === 'failed') {
          setLoading(false);
          setDownloadStatus(STATUS.FAILED);
          setError(d.error || 'Download failed');
          setStatus('');
          setDownloadId(null);
        } else {
          // Still going
          if (d.status === 'queued') setStatus('Queued — waiting for slot...');
          else setStatus('Downloading...');
          pollRef.current = setTimeout(poll, 800);
        }
      } catch (e) {
        setLoading(false);
        setDownloadStatus(STATUS.FAILED);
        setError('Connection lost to server.');
        setDownloadId(null);
      }
    };

    pollRef.current = setTimeout(poll, 800);
  };

  const handleDownload = async () => {
    if (batchMode) { await handleBatchDownload(); return; }

    if (!url.trim() || !isValidUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setDownloadStatus(STATUS.DOWNLOADING);
    setStatus('Initializing...');
    setError('');
    setProgress(0);
    setSpeed('—');
    setEta('—');

    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type, quality, format, audioQuality })
      });

      const data = await res.json();

      if (res.ok) {
        setDownloadId(data.downloadId);
        setStatus('Download queued...');
        addToHistory({ url, type, quality: type === 'audio' ? audioQuality : quality + 'p', format });
        startPoll(data.downloadId);
      } else {
        setError(data.details || data.error || 'Download failed');
        setLoading(false);
        setDownloadStatus(STATUS.FAILED);
        setStatus('');
      }
    } catch {
      setError('Network error. Is the server running?');
      setLoading(false);
      setDownloadStatus(STATUS.FAILED);
      setStatus('');
    }
  };

  const handleBatchDownload = async () => {
    const urls = batchUrls.split('\n').filter(u => u.trim() && isValidUrl(u.trim()));
    if (!urls.length) { setError('No valid URLs found'); return; }

    setLoading(true);
    setStatus(`Queuing ${urls.length} downloads...`);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/download/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ ${data.count} downloads queued!`);
        setBatchUrls('');
        setTimeout(() => setLoading(false), 3000);
      } else {
        setError('Batch download failed');
        setLoading(false);
      }
    } catch {
      setError('Failed to queue batch downloads');
      setLoading(false);
    }
  };

  const cancelDownload = async () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (downloadId) {
      try { await fetch(`${API_BASE}/download/${downloadId}`, { method: 'DELETE' }); } catch { }
    }
    setLoading(false);
    setDownloadStatus(STATUS.IDLE);
    setStatus('Download cancelled');
    setProgress(0);
    setDownloadId(null);
    setSpeed('—');
    setEta('—');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (isValidUrl(text.trim())) {
        setUrl(text.trim());
        clearMessages();
      }
    } catch { setError('Clipboard access denied. Paste manually.'); }
  };

  const clearHistory = () => {
    setDownloadHistory([]);
    localStorage.removeItem('bh_history');
  };

  const reDownload = (item) => {
    setUrl(item.url);
    setFormat(item.format);
    setBatchMode(false);
    clearMessages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDownloading = loading && downloadStatus === STATUS.DOWNLOADING;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">BlackHole</h1>
              <p className="text-xs text-slate-400">Universal Media Downloader</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${showQueue ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              Queue
              {queueStatus?.queue?.active > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1 leading-none">
                  {queueStatus.queue.active}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${showHistory ? 'bg-purple-600 border-purple-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              History
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Mode Tabs */}
        <div className="flex gap-3">
          {[
            { label: 'Single Download', value: false },
            { label: 'Batch Download', value: true },
          ].map(({ label, value }) => (
            <button
              key={String(value)}
              onClick={() => { setBatchMode(value); clearMessages(); }}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${batchMode === value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* URL Input */}
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 shadow-xl">
          <label className="block text-white font-semibold mb-3 text-sm">
            {batchMode ? 'Paste URLs (one per line)' : 'Media URL'}
          </label>

          {batchMode ? (
            <textarea
              placeholder={`https://youtube.com/watch?v=...\nhttps://vimeo.com/...\nhttps://twitter.com/...`}
              value={batchUrls}
              onChange={(e) => setBatchUrls(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600 h-32 resize-none font-mono text-sm"
            />
          ) : (
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); clearMessages(); }}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600 transition-all"
                />
                {fetchingInfo && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  </div>
                )}
              </div>
              <button
                onClick={pasteFromClipboard}
                title="Paste from clipboard"
                className="px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-sm font-medium"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span className="hidden sm:inline">Paste</span>
              </button>
              {url && (
                <button
                  onClick={() => { setUrl(''); setVideoInfo(null); clearMessages(); }}
                  title="Clear"
                  className="px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 hover:bg-red-900/40 hover:border-red-700 text-slate-400 hover:text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Video Info Card */}
        {videoInfo && !batchMode && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
            <VideoInfoCard videoInfo={videoInfo} />
            {videoInfo.formats?.length > 0 && (
              <div className="px-5 pb-4 border-t border-slate-700/50">
                <button
                  onClick={() => setShowFormats(!showFormats)}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 mt-3"
                >
                  {showFormats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showFormats ? 'Hide' : 'Show'} Available Formats ({videoInfo.formats.length})
                </button>
                {showFormats && (
                  <div className="mt-3 max-h-36 overflow-y-auto space-y-1">
                    {videoInfo.formats.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-slate-700/50 rounded-lg px-3 py-1.5 text-slate-300">
                        <span>{f.ext?.toUpperCase()} · {f.quality ? f.quality + 'p' : 'audio'}</span>
                        <span className="text-slate-500">{formatBytes(f.filesize)}{f.fps ? ` · ${f.fps}fps` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Download Options */}
        {!batchMode && (
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 shadow-xl">
            <DownloaderOptions
              type={type} setType={setType}
              format={format} setFormat={setFormat}
              quality={quality} setQuality={setQuality}
              audioQuality={audioQuality} setAudioQuality={setAudioQuality}
              clearMessages={clearMessages}
            />
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={isDownloading ? cancelDownload : handleDownload}
          disabled={(!url.trim() && !batchMode) || (!batchUrls.trim() && batchMode) || fetchingInfo}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-xl
            ${isDownloading
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-blue-900/40'
            }`}
        >
          {isDownloading ? (
            <>
              <X className="w-5 h-5" />
              Cancel Download
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              {batchMode ? 'Queue Batch Downloads' : 'Start Download'}
              <Sparkles className="w-4 h-4 opacity-70" />
            </>
          )}
        </button>

        {/* Progress Panel */}
        {isDownloading && (
          <div className="bg-slate-800/70 rounded-2xl p-5 border border-slate-700 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white font-semibold flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                {status}
              </p>
              <span className="text-blue-400 font-mono font-bold">{Math.round(progress)}%</span>
            </div>
            <ProgressBar progress={progress} />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Speed', value: speed },
                { label: 'ETA', value: eta },
                { label: 'Progress', value: `${Math.round(progress)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-700/60 rounded-xl p-3 text-center">
                  <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wide">{label}</p>
                  <p className="text-white font-mono text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status / Error Messages */}
        {status && !isDownloading && (
          <div className={`rounded-xl p-4 flex items-center gap-3 border ${
            downloadStatus === STATUS.COMPLETED
              ? 'bg-green-900/30 border-green-700/50'
              : 'bg-blue-900/30 border-blue-700/50'
          }`}>
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-300">{status}</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl p-4 flex items-start gap-3 bg-red-900/30 border border-red-700/50">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Error</p>
              <p className="text-red-400 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Queue Status */}
        {showQueue && queueStatus && (
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 shadow-xl">
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Download Queue
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Waiting', value: queueStatus.queue.waiting, color: 'text-yellow-400' },
                { label: 'Active', value: queueStatus.queue.active, color: 'text-blue-400' },
                { label: 'Done', value: queueStatus.queue.completed, color: 'text-green-400' },
                { label: 'Failed', value: queueStatus.queue.failed, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-700/60 rounded-xl p-3 text-center">
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            {queueStatus.activeDownloads?.length > 0 && (
              <div className="space-y-2">
                {queueStatus.activeDownloads.map(dl => (
                  <div key={dl.downloadId} className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-300 font-medium">ID: {dl.downloadId.slice(-8)}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{dl.status} · {dl.speed}</p>
                    </div>
                    <span className="text-blue-400 font-mono font-bold">{Math.round(dl.progress || 0)}%</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={fetchQueueStatus}
              className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        )}

        {/* Download History */}
        {showHistory && (
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Download History
              </h3>
              {downloadHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            {downloadHistory.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No downloads yet</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {downloadHistory.map((item, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Download className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-sm truncate">{item.url}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {item.type} · {item.quality} · {item.format?.toUpperCase()}
                        {item.timestamp && ` · ${new Date(item.timestamp).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => reDownload(item)}
                      title="Download again"
                      className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pb-6 text-center text-xs text-slate-600">
        BlackHole 2.1 · Powered by yt-dlp
      </div>
    </div>
  );
};

export default UniversalDownloader;
