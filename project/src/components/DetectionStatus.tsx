import React from 'react';
import { DetectionResult } from '../types/detection';

interface Props {
  result: DetectionResult | null;
  isConnected: boolean;
}

const DetectionStatus: React.FC<Props> = ({ result, isConnected }) => {
  if (!isConnected) {
    return (
      <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-yellow-500 text-white">
        Reconnecting...
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div
      className={`absolute top-4 right-4 px-4 py-2 rounded-full ${
        result.isSuspicious ? 'bg-red-500' : 'bg-green-500'
      } text-white`}
    >
      {result.isSuspicious ? 'Suspicious' : 'Normal'}
      {' '}({(result.confidence * 100).toFixed(1)}%)
    </div>
  );
};

export default DetectionStatus;