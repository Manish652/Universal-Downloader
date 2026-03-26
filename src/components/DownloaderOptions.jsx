import { Film, Headphones, Music, Settings, Video } from 'lucide-react';

const VIDEO_QUALITIES = [
  { value: 'best', label: '🌟 Best Available', desc: 'Auto highest quality' },
  { value: '2160', label: '4K / UHD', desc: '2160p · Largest file' },
  { value: '1440', label: '1440p / QHD', desc: 'Quad HD · Very large' },
  { value: '1080', label: '1080p / Full HD', desc: 'Full HD · Recommended' },
  { value: '720', label: '720p / HD', desc: 'HD · Balanced' },
  { value: '480', label: '480p / SD', desc: 'Standard · Smaller' },
  { value: '360', label: '360p / Low', desc: 'Low · Smallest' },
];

const AUDIO_BITRATES = [
  { value: '320K', label: '320 kbps', desc: 'Studio quality' },
  { value: '256K', label: '256 kbps', desc: 'Very high quality' },
  { value: '192K', label: '192 kbps', desc: 'High quality (default)' },
  { value: '128K', label: '128 kbps', desc: 'Standard quality' },
  { value: '96K', label: '96 kbps', desc: 'Low quality' },
  { value: '64K', label: '64 kbps', desc: 'Very low / voice' },
];

const DownloaderOptions = ({
  type, setType,
  format, setFormat,
  quality, setQuality,
  audioQuality, setAudioQuality,
  clearMessages
}) => {
  const isAudio = type === 'audio';
  const isVideo = type !== 'audio';

  const videoFormats = ['mp4', 'webm', 'mkv', 'avi', 'mov'];
  const audioFormats = ['mp3', 'm4a', 'opus', 'wav', 'flac'];
  const formats = isAudio ? audioFormats : videoFormats;

  const handleTypeChange = (newType) => {
    setType(newType);
    // Reset format to sensible default
    if (newType === 'audio') {
      setFormat('mp3');
      setQuality('best');
    } else {
      setFormat('mp4');
    }
    clearMessages();
  };

  return (
    <div>
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-400" />
        Download Settings
      </h3>

      {/* Content Type Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { value: 'both', label: 'Video + Audio', icon: Film },
          { value: 'video', label: 'Video Only', icon: Video },
          { value: 'audio', label: 'Audio Only', icon: Headphones },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => handleTypeChange(value)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all border ${
              type === value
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${isAudio ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>

        {/* File Format */}
        <div>
          <label className="block text-slate-300 font-semibold mb-2 text-sm flex items-center gap-1">
            <Music className="w-3.5 h-3.5 text-purple-400" />
            File Format
          </label>
          <select
            value={format}
            onChange={(e) => { setFormat(e.target.value); clearMessages(); }}
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          >
            {formats.map(f => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Video Quality */}
        {isVideo && (
          <div>
            <label className="block text-slate-300 font-semibold mb-2 text-sm flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-blue-400" />
              Video Quality
            </label>
            <select
              value={quality}
              onChange={(e) => { setQuality(e.target.value); clearMessages(); }}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
            >
              {VIDEO_QUALITIES.map(q => (
                <option key={q.value} value={q.value}>
                  {q.label} — {q.desc}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Audio Bitrate */}
        {isAudio && (
          <div>
            <label className="block text-slate-300 font-semibold mb-2 text-sm flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-green-400" />
              Audio Bitrate
            </label>
            <select
              value={audioQuality}
              onChange={(e) => { setAudioQuality(e.target.value); clearMessages(); }}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
            >
              {AUDIO_BITRATES.map(b => (
                <option key={b.value} value={b.value}>
                  {b.label} — {b.desc}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloaderOptions;
