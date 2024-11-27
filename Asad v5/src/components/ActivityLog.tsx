import React from 'react';
import { Bell } from 'lucide-react';
import { Detection } from '../utils/detectionTypes';
import DetectionItem from './DetectionItem';

interface ActivityLogProps {
  detections: Detection[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ detections }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg h-[400px] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-semibold">Activity Log</h2>
      </div>
      <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {detections.length === 0 ? (
          <p className="text-gray-400">No suspicious activities detected</p>
        ) : (
          <div className="space-y-4">
            {detections.map((detection, index) => (
              <DetectionItem key={`${detection.timestamp}-${index}`} detection={detection} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;