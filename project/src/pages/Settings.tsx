import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    sensitivity: 0.5,
    emailAlerts: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications" className="ml-3 text-sm text-gray-700">
                Enable notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailAlerts"
                name="emailAlerts"
                checked={settings.emailAlerts}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailAlerts" className="ml-3 text-sm text-gray-700">
                Enable email alerts
              </label>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Detection Sensitivity</h3>
          <div className="mt-4">
            <input
              type="range"
              id="sensitivity"
              name="sensitivity"
              min="0"
              max="1"
              step="0.1"
              value={settings.sensitivity}
              onChange={handleChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <button
          type="button"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;