import React from 'react';

interface Props {
  isDetecting: boolean;
  isConnected: boolean;
  onClick: () => void;
}

const ControlButton: React.FC<Props> = ({ isDetecting, isConnected, onClick }) => {
  return (
    <div className="flex justify-center">
      <button
        onClick={onClick}
        className={`px-6 py-2 rounded-lg font-semibold ${
          isDetecting ? 'bg-red-500' : 'bg-blue-500'
        } text-white ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!isConnected}
      >
        {isDetecting ? 'Stop Detection' : 'Start Detection'}
      </button>
    </div>
  );
};

export default ControlButton;