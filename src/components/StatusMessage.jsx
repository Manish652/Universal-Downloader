import { AlertCircle, Info } from 'lucide-react';

const StatusMessage = ({ status, error }) => {
  if (!status && !error) return null;

  return (
    <div className="mt-6 space-y-3">
      {status && (
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 flex items-start gap-3 animate-in fade-in">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-300 text-sm">{status}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default StatusMessage;
