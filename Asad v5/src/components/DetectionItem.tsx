import React from 'react';
import { AlertTriangle, AlertCircle, Flame, UserX, Package } from 'lucide-react';
import { Detection } from '../utils/detectionTypes';

interface DetectionItemProps {
  detection: Detection;
}

const DetectionItem: React.FC<DetectionItemProps> = ({ detection }) => {
  const getIcon = () => {
    const baseClass = "w-5 h-5";
    
    if (detection.type === 'Fire') {
      return <Flame className={`${baseClass} text-red-500`} />;
    }
    if (detection.type === 'Fighting') {
      return <UserX className={`${baseClass} text-red-500`} />;
    }
    if (detection.type === 'Theft') {
      return <Package className={`${baseClass} text-orange-500`} />;
    }
    
    switch (detection.severity) {
      case 'high':
        return <AlertTriangle className={`${baseClass} text-red-500`} />;
      case 'medium':
        return <AlertCircle className={`${baseClass} text-orange-500`} />;
      case 'low':
        return <AlertTriangle className={`${baseClass} text-yellow-500`} />;
      default:
        return <AlertTriangle className={`${baseClass} text-gray-500`} />;
    }
  };

  const getSeverityClass = () => {
    const baseClass = "flex items-start gap-3 p-3 rounded-lg ";
    switch (detection.severity) {
      case 'high':
        return baseClass + 'bg-red-500/10 border-l-4 border-red-500';
      case 'medium':
        return baseClass + 'bg-orange-500/10 border-l-4 border-orange-500';
      case 'low':
        return baseClass + 'bg-yellow-500/10 border-l-4 border-yellow-500';
      default:
        return baseClass + 'bg-gray-700/50';
    }
  };

  return (
    <div className={getSeverityClass()}>
      {getIcon()}
      <div>
        <p className="font-medium">{detection.type}</p>
        <p className="text-sm text-gray-400">{detection.details}</p>
        <p className="text-sm text-gray-400">
          Confidence: {(detection.confidence * 100).toFixed(1)}%
        </p>
        <p className="text-sm text-gray-400">
          {new Date(detection.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default DetectionItem;