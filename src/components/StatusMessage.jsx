import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const StatusMessage = ({ status, error }) => (
  <>
    {status && (
      <div className="mt-6 p-4 bg-green-900/30 border border-green-700/50 rounded-xl flex items-center space-x-3">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-green-300">{status}</span>
      </div>
    )}
    {error && (
      <div className="mt-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
        <div>
          <div className="text-red-300 font-medium">Error</div>
          <div className="text-red-400 text-sm mt-1">{error}</div>
        </div>
      </div>
    )}
  </>
);

export default StatusMessage;
