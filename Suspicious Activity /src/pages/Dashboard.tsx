import { useState } from 'react';
import Webcam from 'react-webcam';
import { useQuery } from '@tanstack/react-query';
import { detectActivity } from '../api/detection';

export function Dashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { data: detectionResult } = useQuery({
    queryKey: ['detection'],
    queryFn: detectActivity,
    enabled: isMonitoring
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Live Monitoring</h2>
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {isMonitoring && (
            <Webcam
              audio={false}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-2 rounded-md ${
              isMonitoring 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      {detectionResult && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Detection Results</h3>
          <pre className="bg-gray-50 p-4 rounded-md">
            {JSON.stringify(detectionResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}