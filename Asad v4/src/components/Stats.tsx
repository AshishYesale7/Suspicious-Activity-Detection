import React from 'react';
import { Activity } from 'lucide-react';
import { Stats } from '../utils/detectionTypes';

interface StatsProps {
  stats: Stats;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-semibold">Detection Stats</h2>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span>Fighting Incidents</span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-500">
            {stats.fighting}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Theft Attempts</span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-500">
            {stats.theft}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Fire Hazards</span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-500">
            {stats.fire}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Suspicious Activities</span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-500">
            {stats.suspicious}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Stats;