'use client';

import React, { useEffect, useState } from 'react';
import { ChartBarIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface APICall {
  endpoint: string;
  timestamp: number;
  duration: number;
  status: 'success' | 'error' | 'pending';
}

interface APICallMonitorProps {
  className?: string;
}

export default function APICallMonitor({ className = '' }: APICallMonitorProps) {
  const [apiCalls, setApiCalls] = useState<APICall[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Monitor fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      let url: string;
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (typeof Request !== 'undefined' && args[0] instanceof Request) {
        url = args[0].url;
      } else if (typeof URL !== 'undefined' && args[0] instanceof URL) {
        url = args[0].toString();
      } else {
        url = '';
      }
      const endpoint = url.replace(window.location.origin, '');
      
      // Add pending call
      const pendingCall: APICall = {
        endpoint,
        timestamp: startTime,
        duration: 0,
        status: 'pending'
      };
      
      setApiCalls(prev => [...prev.slice(-9), pendingCall]); // Keep last 10 calls
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Update call with result
        setApiCalls(prev => prev.map(call => 
          call === pendingCall 
            ? { ...call, duration, status: response.ok ? 'success' : 'error' }
            : call
        ));
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        setApiCalls(prev => prev.map(call => 
          call === pendingCall 
            ? { ...call, duration, status: 'error' }
            : call
        ));
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const getRecentCalls = () => {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    return apiCalls.filter(call => call.timestamp > fiveMinutesAgo);
  };

  const getCallStats = () => {
    const recentCalls = getRecentCalls();
    const totalCalls = recentCalls.length;
    const successCalls = recentCalls.filter(call => call.status === 'success').length;
    const errorCalls = recentCalls.filter(call => call.status === 'error').length;
    const avgDuration = recentCalls.length > 0 
      ? recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length 
      : 0;

    return { totalCalls, successCalls, errorCalls, avgDuration };
  };

  const stats = getCallStats();

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show API Call Monitor"
      >
        <ChartBarIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">API Call Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-green-50 p-2 rounded">
          <div className="text-green-800 font-medium">{stats.totalCalls}</div>
          <div className="text-green-600">Total Calls</div>
        </div>
        <div className="bg-blue-50 p-2 rounded">
          <div className="text-blue-800 font-medium">{stats.successCalls}</div>
          <div className="text-blue-600">Success</div>
        </div>
        <div className="bg-red-50 p-2 rounded">
          <div className="text-red-800 font-medium">{stats.errorCalls}</div>
          <div className="text-red-600">Errors</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-800 font-medium">{Math.round(stats.avgDuration)}ms</div>
          <div className="text-gray-600">Avg Time</div>
        </div>
      </div>
      
      {/* Recent Calls */}
      <div className="max-h-40 overflow-y-auto">
        {getRecentCalls().slice(-5).reverse().map((call, index) => (
          <div key={index} className="flex items-center justify-between py-1 text-xs border-b border-gray-100 last:border-b-0">
            <div className="flex-1 min-w-0">
              <div className="truncate text-gray-900">{call.endpoint}</div>
              <div className="text-gray-500">{new Date(call.timestamp).toLocaleTimeString()}</div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className={`px-1 py-0.5 rounded text-xs ${
                call.status === 'success' ? 'bg-green-100 text-green-800' :
                call.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {call.status === 'pending' ? '...' : call.status === 'success' ? '✓' : '✗'}
              </span>
              {call.duration > 0 && (
                <span className="text-gray-500">{call.duration}ms</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {stats.totalCalls === 0 && (
        <div className="text-center py-4 text-gray-500 text-xs">
          No API calls in the last 5 minutes
        </div>
      )}
    </div>
  );
} 