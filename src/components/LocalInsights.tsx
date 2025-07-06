'use client';

import React, { useEffect, useState } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon, SparklesIcon, CpuChipIcon } from '@heroicons/react/24/outline';

interface LocalInsight {
  id: string;
  type: 'power' | 'economic' | 'weather' | 'holiday' | 'social' | 'market';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
}

interface LocalInsightsProps {
  className?: string;
}

export default function LocalInsights({ className = '' }: LocalInsightsProps) {
  const [insights, setInsights] = useState<LocalInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAIPowered, setIsAIPowered] = useState<boolean | null>(null);

  useEffect(() => {
    fetchLocalInsights();
  }, []);

  const fetchLocalInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAIPowered(null);
      
      const response = await fetch('/api/local-insights');
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.insights || []);
        
        // Always AI-powered now
        setIsAIPowered(true);
        
        console.log('🧠 AI-powered local insights loaded:', {
          count: data.insights?.length || 0,
          aiPowered: data.aiPowered,
          generatedAt: data.generatedAt
        });
      } else {
        // Handle AI-specific errors
        if (response.status === 503) {
          setError('AI service temporarily unavailable. Please check your OpenAI API configuration.');
        } else {
          setError(data.error || 'Failed to load AI insights');
        }
      }
    } catch (err) {
      console.error('Error fetching AI local insights:', err);
      setError('Unable to load AI insights. Please check your connection and OpenAI API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <InformationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'power':
        return '⚡';
      case 'economic':
        return '💰';
      case 'weather':
        return '🌤️';
      case 'holiday':
        return '🎉';
      case 'social':
        return '👥';
      case 'market':
        return '📊';
      default:
        return '🧠';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-6 w-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">🧠 Local Insights</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-6 w-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">🧠 Local Insights</h3>
        </div>
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchLocalInsights}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">🧠 Local Insights</h3>
          <div className="flex items-center gap-1">
            <CpuChipIcon className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium">AI Powered</span>
          </div>
        </div>
        <button
          onClick={fetchLocalInsights}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>
      
      {insights.length === 0 ? (
        <div className="text-center py-4">
          <SparklesIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No local insights available right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className="text-lg">{getTypeIcon(insight.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {insight.title}
                    </h4>
                    {getPriorityIcon(insight.priority)}
                  </div>
                  <p className="text-xs text-gray-700 mb-1">
                    {insight.description}
                  </p>
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="font-medium">Impact:</span> {insight.impact}
                  </p>
                  <p className="text-xs text-blue-700 font-medium">
                    💡 {insight.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          AI-powered insights analyzing your campaign performance in Zimbabwean context
        </p>
      </div>
    </div>
  );
} 