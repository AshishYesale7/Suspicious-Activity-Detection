import React from 'react';
import { Severity } from '../utils/detectionTypes';

interface SystemStatusProps {
  isDetecting: boolean;
  alertLevel: Severity;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ isDetecting, alertLevel }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">System Status</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span>Camera Status</span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-500">
            Active
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Detection Status</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDetecting
                ? 'bg-emerald-500/20 text-emerald-500'
                : 'bg-gray-500/20 text-gray-500'
            }`}
          >
            {isDetecting ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Alert Level</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
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