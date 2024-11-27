import React from 'react';
import { Activity } from 'lucide-react';
import { Severity } from '../utils/detectionTypes';

interface SystemStatusProps {
  isDetecting: boolean;
  alertLevel: Severity;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ isDetecting, alertLevel }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold">Status</h2>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Camera</span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500">
            Active
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Detection</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isDetecting
                ? 'bg-emerald-500/20 text-emerald-500'
                : 'bg-gray-500/20 text-gray-500'
            }`}
          >
            {isDetecting ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Alert</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              {
                none: 'bg-gray-500/20 text-gray-500',
                low: 'bg-yellow-500/20 text-yellow-500',
                medium: 'bg-orange-500/20 text-orange-500',
                high: 'bg-red-500/20 text-red-500'
              }[alertLevel]
            }`}
          >
            {alertLevel === 'none' ? 'Normal' : 
             alertLevel.charAt(0).toUpperCase() + alertLevel.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;