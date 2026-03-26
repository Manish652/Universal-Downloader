import { Clock, ExternalLink, Film, User } from 'lucide-react';

function formatDuration(sec) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

const VideoInfoCard = ({ videoInfo }) => {
  const duration = formatDuration(videoInfo.duration);
  const filesize = formatFileSize(videoInfo.filesize);

  return (
    <div className="flex gap-4 p-5">
      {/* Thumbnail */}
      {videoInfo.thumbnail && (
        <div className="flex-shrink-0">
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-36 h-24 rounded-xl object-cover shadow-lg border border-slate-600/50"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-bold text-base leading-snug mb-2 line-clamp-2">
          {videoInfo.title}
        </h3>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {videoInfo.uploader && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate max-w-[140px]">{videoInfo.uploader}</span>
            </div>
          )}

          {duration && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{duration}</span>
            </div>
          )}

          {filesize && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Film className="w-3.5 h-3.5 text-green-400" />
              <span>~{filesize}</span>
            </div>
          )}
        </div>

        {/* Quality Badges */}
        {videoInfo.formats?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[...new Set(
              videoInfo.formats
                .filter(f => f.quality)
                .map(f => f.quality)
                .sort((a, b) => b - a)
                .slice(0, 6)
            )].map(q => (
              <span
                key={q}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${q >= 1080
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : q >= 720
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-600/60 text-slate-400 border border-slate-600'
                  }`}
              >
                {q}p
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoInfoCard;
