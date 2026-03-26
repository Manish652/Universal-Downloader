
const ProgressBar = ({ progress }) => {
  return (
    <div className="w-full">
      <div className="relative w-full h-3 bg-slate-700 rounded-full overflow-hidden shadow-inner">
        {/* Animated gradient bar */}
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out shadow-lg"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>

        {/* Glow effect */}
        {progress > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-400 rounded-full blur-md opacity-50"
            style={{ left: `${progress}%`, transition: 'left 0.3s ease-out' }}
          ></div>
        )}
      </div>

      {/* Percentage text */}
      <div className="mt-2 text-right">
        <span className="text-blue-400 font-mono font-bold text-sm">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;
