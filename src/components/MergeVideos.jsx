import {
  AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  Film, GripVertical, HardDrive, Link2, Loader2,
  Plus, RefreshCw, Trash2, Upload, X, Zap
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const API_BASE = 'http://localhost:4000';

function isValidUrl(s) {
  try { new URL(s); return true; } catch { return false; }
}

function formatDuration(sec) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

let idCounter = 0;
function makeItem() {
  return {
    id: ++idCounter,
    mode: 'url',          // 'url' | 'file'
    url: '',
    localPath: null,      // set after backend upload
    originalName: null,
    fileSize: null,
    uploadProgress: null, // 0–100 during upload, null otherwise
    title: null,
    thumbnail: null,
    duration: null,
    status: 'idle',       // 'idle' | 'loading' | 'uploading' | 'ready' | 'error'
    errorMsg: null,
  };
}

export default function MergeVideos() {
  const [items, setItems] = useState([makeItem(), makeItem()]);
  const [outputName, setOutputName] = useState('merged_video');
  const [quality, setQuality] = useState('720');

  const [merging, setMerging] = useState(false);
  const [mergeId, setMergeId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [mergeStatus, setMergeStatus] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const pollRef = useRef(null);
  const fileInputRefs = useRef({});

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  const updateItem = (id, patch) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));

  // ── URL fetch ──────────────────────────────────────────────────────────────
  const fetchInfo = async (id, url) => {
    if (!url || !isValidUrl(url)) return;
    updateItem(id, { status: 'loading', title: null, thumbnail: null, errorMsg: null });
    try {
      const res = await fetch(`${API_BASE}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        const info = await res.json();
        updateItem(id, { title: info.title, thumbnail: info.thumbnail, duration: info.duration, status: 'ready' });
      } else {
        updateItem(id, { status: 'error', errorMsg: 'Could not fetch video info' });
      }
    } catch {
      updateItem(id, { status: 'error', errorMsg: 'Network error' });
    }
  };

  // ── Local file upload ──────────────────────────────────────────────────────
  const uploadFile = (id, file) => {
    if (!file) return;
    updateItem(id, {
      status: 'uploading',
      originalName: file.name,
      fileSize: file.size,
      uploadProgress: 0,
      localPath: null,
      errorMsg: null,
    });

    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/merge/upload`);

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        updateItem(id, { uploadProgress: pct });
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        updateItem(id, {
          status: 'ready',
          localPath: data.localPath,
          originalName: data.originalName,
          fileSize: data.size,
          uploadProgress: 100,
          title: data.originalName,
        });
      } else {
        let msg = 'Upload failed';
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
        updateItem(id, { status: 'error', errorMsg: msg, uploadProgress: null });
      }
    };

    xhr.onerror = () => updateItem(id, { status: 'error', errorMsg: 'Upload failed — network error', uploadProgress: null });
    xhr.send(formData);
  };

  // ── List management ────────────────────────────────────────────────────────
  const addItem = () => setItems(prev => [...prev, makeItem()]);

  const removeItem = (id) => {
    if (items.length <= 2) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const switchMode = (id, mode) => {
    updateItem(id, {
      mode, url: '', localPath: null, originalName: null, fileSize: null,
      uploadProgress: null, title: null, thumbnail: null, duration: null,
      status: 'idle', errorMsg: null,
    });
  };

  const moveItem = (from, to) => {
    setItems(prev => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const onDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver  = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const onDrop      = (e, to)  => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== to) moveItem(dragIdx, to);
    setDragIdx(null); setDragOverIdx(null);
  };
  const onDragEnd   = () => { setDragIdx(null); setDragOverIdx(null); };

  // ── Merge ──────────────────────────────────────────────────────────────────
  const handleMerge = async () => {
    const readyItems = items.filter(it =>
      (it.mode === 'url' && it.url && isValidUrl(it.url)) ||
      (it.mode === 'file' && it.localPath)
    );
    if (readyItems.length < 2) { setError('At least 2 ready items are required.'); return; }

    // Check no ongoing uploads
    if (items.some(it => it.status === 'uploading')) { setError('Wait for all uploads to complete first.'); return; }

    setMerging(true); setDone(false); setError('');
    setProgress(0); setMergeStatus('Initializing...');

    try {
      const res = await fetch(`${API_BASE}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: readyItems.map(it => ({
            ...(it.mode === 'url' ? { url: it.url } : { localPath: it.localPath }),
            title: it.title,
          })),
          quality,
          outputName,
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Merge failed'); setMerging(false); return; }
      setMergeId(data.mergeId);
      startPoll(data.mergeId);
    } catch {
      setError('Network error — is the server running?');
      setMerging(false);
    }
  };

  const startPoll = (id) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/merge/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setMerging(false); setDone(true); setProgress(100);
            setMergeStatus('✅ Merge complete! Saved to ~/Downloads');
            return;
          }
          throw new Error();
        }
        const d = await res.json();
        setProgress(d.progress || 0);
        setMergeStatus(d.status || '');
        if (d.status === 'completed') {
          setMerging(false); setDone(true); setProgress(100);
          setMergeStatus('✅ Merge complete! Saved to ~/Downloads');
        } else if (d.status === 'failed') {
          setMerging(false); setError(d.error || 'Merge failed'); setMergeStatus('');
        } else {
          pollRef.current = setTimeout(poll, 800);
        }
      } catch { setMerging(false); setError('Lost connection to server.'); }
    };
    pollRef.current = setTimeout(poll, 800);
  };

  const cancelMerge = async () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (mergeId) try { await fetch(`${API_BASE}/merge/${mergeId}`, { method: 'DELETE' }); } catch {}
    setMerging(false); setMergeId(null); setProgress(0); setMergeStatus('Cancelled');
  };

  const reset = () => { setDone(false); setMergeId(null); setProgress(0); setMergeStatus(''); setError(''); };

  const validCount = items.filter(it =>
    (it.mode === 'url' && it.url && isValidUrl(it.url)) ||
    (it.mode === 'file' && it.localPath)
  ).length;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 flex items-start justify-between">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Film className="w-5 h-5 text-orange-400" />
            Merge Videos
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Combine multiple videos into one file — from URLs or your local drive.
          </p>
        </div>
        <span className="text-xs text-slate-500 bg-slate-700/60 px-2 py-1 rounded-lg border border-slate-600 flex-shrink-0">
          ffmpeg concat
        </span>
      </div>

      {/* Item List */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={e => onDragStart(e, idx)}
            onDragOver={e => onDragOver(e, idx)}
            onDrop={e => onDrop(e, idx)}
            onDragEnd={onDragEnd}
            className={`bg-slate-800/60 rounded-2xl border transition-all duration-150 overflow-hidden ${
              dragOverIdx === idx && dragIdx !== idx
                ? 'border-orange-500 shadow-lg shadow-orange-900/30 scale-[1.01]'
                : 'border-slate-700'
            } ${dragIdx === idx ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Sequence # + drag handle */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                <span className="text-xs font-bold text-white bg-orange-600 w-6 h-6 rounded-full flex items-center justify-center shadow">
                  {idx + 1}
                </span>
                <button className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5" title="Drag to reorder">
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnail / placeholder */}
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-20 h-14 rounded-lg object-cover border border-slate-600/50 flex-shrink-0"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className={`w-20 h-14 rounded-lg border flex flex-col items-center justify-center flex-shrink-0 ${
                  item.status === 'ready'
                    ? 'bg-green-900/30 border-green-700/50'
                    : item.status === 'error'
                      ? 'bg-red-900/20 border-red-700/30'
                      : 'bg-slate-700/60 border-slate-600'
                }`}>
                  {item.mode === 'file'
                    ? <HardDrive className="w-6 h-6 text-slate-500" />
                    : <Film className="w-6 h-6 text-slate-500" />}
                  {item.status === 'ready' && (
                    <span className="text-green-400 text-[10px] mt-1 font-semibold">READY</span>
                  )}
                </div>
              )}

              {/* Main input area */}
              <div className="flex-1 min-w-0">
                {/* Mode tabs */}
                <div className="flex gap-1 mb-2">
                  <button
                    onClick={() => switchMode(item.id, 'url')}
                    disabled={merging}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      item.mode === 'url'
                        ? 'bg-blue-600/80 text-white border border-blue-500'
                        : 'bg-slate-700 text-slate-400 border border-slate-600 hover:text-white'
                    }`}
                  >
                    <Link2 className="w-3 h-3" /> URL
                  </button>
                  <button
                    onClick={() => switchMode(item.id, 'file')}
                    disabled={merging}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      item.mode === 'file'
                        ? 'bg-orange-600/80 text-white border border-orange-500'
                        : 'bg-slate-700 text-slate-400 border border-slate-600 hover:text-white'
                    }`}
                  >
                    <HardDrive className="w-3 h-3" /> Local File
                  </button>
                </div>

                {/* URL mode */}
                {item.mode === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Paste video URL (YouTube, Vimeo…)`}
                      value={item.url}
                      disabled={merging}
                      onChange={e => updateItem(item.id, { url: e.target.value, title: null, thumbnail: null, status: 'idle' })}
                      onBlur={() => fetchInfo(item.id, item.url)}
                      onKeyDown={e => { if (e.key === 'Enter') fetchInfo(item.id, item.url); }}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600 text-sm disabled:opacity-50"
                    />
                    <button
                      onClick={() => fetchInfo(item.id, item.url)}
                      disabled={!item.url || !isValidUrl(item.url) || item.status === 'loading' || merging}
                      className="px-2.5 rounded-xl bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-400 hover:text-white disabled:opacity-40 transition-all"
                      title="Fetch info"
                    >
                      {item.status === 'loading'
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* File mode */}
                {item.mode === 'file' && (
                  <div>
                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="video/*"
                      ref={el => fileInputRefs.current[item.id] = el}
                      className="hidden"
                      onChange={e => { if (e.target.files[0]) uploadFile(item.id, e.target.files[0]); }}
                    />

                    {item.localPath ? (
                      /* Uploaded — show file info */
                      <div className="flex items-center gap-2 bg-slate-700/60 rounded-xl px-3 py-2 border border-slate-600">
                        <HardDrive className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{item.originalName}</p>
                          <p className="text-slate-500 text-xs">{formatSize(item.fileSize)}</p>
                        </div>
                        <button
                          onClick={() => { switchMode(item.id, 'file'); }}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                          title="Remove file"
                          disabled={merging}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : item.status === 'uploading' ? (
                      /* Uploading progress */
                      <div className="bg-slate-700/60 rounded-xl px-3 py-2.5 border border-slate-600">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-300 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                            Uploading {item.originalName}…
                          </span>
                          <span className="text-orange-400 font-mono">{item.uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300"
                            style={{ width: `${item.uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Pick file zone */
                      <button
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                        disabled={merging}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-600 hover:border-orange-500/60 text-slate-500 hover:text-orange-400 transition-all disabled:opacity-50 text-sm font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        Click to choose video file
                        <span className="text-xs text-slate-600">(MP4, MKV, AVI…)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Metadata row */}
                {item.title && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === 'ready' ? 'bg-green-500' : 'bg-slate-500'}`} />
                    <p className="text-slate-300 text-xs truncate">{item.title}</p>
                    {item.duration && <span className="text-slate-500 text-xs flex-shrink-0">{formatDuration(item.duration)}</span>}
                  </div>
                )}
                {item.errorMsg && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{item.errorMsg}
                  </p>
                )}
              </div>

              {/* Move arrows + remove */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => idx > 0 && moveItem(idx, idx - 1)} disabled={idx === 0 || merging}
                  className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-600 disabled:opacity-30 transition-all" title="Move up">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => idx < items.length - 1 && moveItem(idx, idx + 1)} disabled={idx === items.length - 1 || merging}
                  className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-600 disabled:opacity-30 transition-all" title="Move down">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => removeItem(item.id)} disabled={items.length <= 2 || merging}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-30 transition-all" title="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Video */}
      <button
        onClick={addItem}
        disabled={merging}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-700 hover:border-orange-500/50 text-slate-500 hover:text-orange-400 flex items-center justify-center gap-2 text-sm font-medium transition-all disabled:opacity-40"
      >
        <Plus className="w-4 h-4" />
        Add Another Video
      </button>

      {/* Settings */}
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Output File Name</label>
          <input
            type="text"
            value={outputName}
            onChange={e => setOutputName(e.target.value)}
            disabled={merging}
            placeholder="merged_video"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-slate-600 text-sm disabled:opacity-50"
          />
          <p className="text-slate-600 text-xs mt-1">~/Downloads/{outputName || 'merged_video'}_[timestamp].mp4</p>
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Download Quality (for URLs)</label>
          <select
            value={quality}
            onChange={e => setQuality(e.target.value)}
            disabled={merging}
            className="w-full px-4 py-2.5 bg-slate-700/60 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 cursor-pointer"
          >
            <option value="best">🌟 Best Available</option>
            <option value="2160">4K / 2160p</option>
            <option value="1440">1440p / QHD</option>
            <option value="1080">1080p / Full HD</option>
            <option value="720">720p / HD</option>
            <option value="480">480p / SD</option>
            <option value="360">360p / Low</option>
          </select>
        </div>
      </div>

      {/* Sequence preview */}
      {validCount >= 2 && (
        <div className="bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/50">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Merge Sequence</p>
          <div className="flex flex-wrap items-center gap-2">
            {items.filter(it =>
              (it.mode === 'url' && it.url && isValidUrl(it.url)) ||
              (it.mode === 'file' && it.localPath)
            ).map((it, i, arr) => (
              <div key={it.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-700/80 rounded-lg px-2.5 py-1.5 border border-slate-600">
                  {it.mode === 'file'
                    ? <HardDrive className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    : <Link2 className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                  <span className="text-xs text-white max-w-[120px] truncate">
                    {it.title || it.originalName || it.url.replace(/^https?:\/\//, '').slice(0, 20) + '…'}
                  </span>
                </div>
                {i < arr.length - 1 && <Zap className="w-3 h-3 text-orange-500 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge Button */}
      <button
        onClick={merging ? cancelMerge : handleMerge}
        disabled={!merging && validCount < 2}
        className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg ${
          merging
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-900/30'
        }`}
      >
        {merging ? (
          <><X className="w-5 h-5" />Cancel Merge</>
        ) : (
          <><Film className="w-5 h-5" />Merge {validCount} Video{validCount !== 1 ? 's' : ''} →</>
        )}
      </button>

      {/* Progress */}
      {merging && (
        <div className="bg-slate-800/70 rounded-2xl p-5 border border-slate-700 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-white font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
              {mergeStatus || 'Processing…'}
            </p>
            <span className="text-orange-400 font-mono font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs">{validCount} videos · saved to ~/Downloads</p>
        </div>
      )}

      {/* Done */}
      {done && !merging && (
        <div className="rounded-xl p-4 flex items-center gap-3 bg-green-900/30 border border-green-700/50">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300 flex-1">{mergeStatus}</p>
          <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">New Merge</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 flex items-start gap-3 bg-red-900/30 border border-red-700/50">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">Error</p>
            <p className="text-red-400 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
