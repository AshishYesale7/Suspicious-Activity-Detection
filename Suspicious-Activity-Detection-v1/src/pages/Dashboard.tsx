import React from 'react';
import VideoFeed from '../components/VideoFeed';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Suspicious Activity Detection
      </h1>
      <VideoFeed />
    </div>
  );
};

export default Dashboard;