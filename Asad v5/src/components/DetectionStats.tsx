import React from 'react';
import { Activity } from 'lucide-react';
import { Stats } from '../utils/detectionTypes';

interface DetectionStatsProps {
  stats: Stats;
}

const DetectionStats: React.FC<DetectionStatsProps> = ({ stats }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold">Stats</h2>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Fighting</span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
            {stats.fighting}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Theft</span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-500">
            {stats.theft}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Fire</span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
            {stats.fire}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Suspicious</span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">
            {stats.suspicious}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DetectionStats;