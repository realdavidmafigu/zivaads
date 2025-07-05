'use client';

import React, { useEffect, useState } from 'react';
import { AIInsight, PerformanceMetrics, generateAIInsights } from '@/lib/ai-explanations';

interface AIInsightsProps {
  metrics: PerformanceMetrics;
  campaigns?: any[];
  className?: string;
}

export default function AIInsights({ metrics, campaigns = [], className = '' }: AIInsightsProps) {
  const [aiInsight, setAIInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!metrics || Object.keys(metrics).length === 0) {
      setAIInsight('Connect your Facebook ads to get started with performance insights.');
      return;
    }

    setLoading(true);
    setError(null);
    
    fetch('/api/ai-explain-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics, campaigns }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setAIInsight(data.insight || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('AI insights error:', err);
        setError('Could not fetch AI insights. Showing local suggestions.');
        setLoading(false);
      });
  }, [metrics, campaigns]);

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
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getZimbabweContext = (insight: AIInsight): string => {
    // Add Zimbabwe-specific context to insights
    if (insight.what.includes('expensive') || insight.what.includes('costs you a lot')) {
      return ' In Zimbabwe, where internet costs are high, this is especially important to optimize.';
    }
    if (insight.what.includes('click-through rate is low')) {
      return ' Zimbabwean users are very selective about clicking ads, so your ad needs to be compelling.';
    }
    if (insight.what.includes('performing well')) {
      return ' This is great for the Zimbabwean market where competition is growing!';
    }
    return '';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl">🤖</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            <p className="text-sm text-gray-600">What's happening and what to do about it</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your campaign data...</p>
        </div>
      </div>
    );
  }

  if (aiInsight) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl">🤖</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            <p className="text-sm text-gray-600">What's happening and what to do about it</p>
          </div>
        </div>
        <div className="mb-4 text-gray-800 whitespace-pre-line">{aiInsight}</div>
      </div>
    );
  }

  if (error) {
    // Fallback to local insights when API fails
    const localInsights = generateAIInsights(metrics);
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl">🤖</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            <p className="text-sm text-gray-600">What's happening and what to do about it</p>
          </div>
        </div>
        <div className="text-yellow-600 mb-4 text-sm">⚠️ Using local insights (AI service temporarily unavailable)</div>
        
        {/* Campaign Overview */}
        {campaigns.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">📊 Campaign Overview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Campaigns</p>
                <p className="font-semibold text-gray-900">{campaigns.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Active</p>
                <p className="font-semibold text-green-600">{campaigns.filter(c => c.status === 'ACTIVE').length}</p>
              </div>
              <div>
                <p className="text-gray-600">Paused</p>
                <p className="font-semibold text-yellow-600">{campaigns.filter(c => c.status === 'PAUSED').length}</p>
              </div>
              <div>
                <p className="text-gray-600">Learning</p>
                <p className="font-semibold text-blue-600">{campaigns.filter(c => c.status === 'LEARNING').length}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {localInsights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}>
              <div className="flex items-start gap-3">
                <span className="text-lg">{getPriorityIcon(insight.priority)}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{insight.what}</h4>
                  <p className="text-sm text-gray-700 mb-2">{insight.why}{getZimbabweContext(insight)}</p>
                  <p className="text-sm font-medium text-gray-900">{insight.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Campaign-Specific Tips */}
        {campaigns.length > 1 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">🎯 Multi-Campaign Strategy</h4>
            <ul className="text-sm text-green-900 space-y-1">
              <li>• Compare performance across your {campaigns.length} campaigns</li>
              <li>• Identify your best performing campaign and learn from it</li>
              <li>• Consider reallocating budget from low performers to high performers</li>
              <li>• Test different objectives and audiences across campaigns</li>
            </ul>
          </div>
        )}

        {/* Additional Tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tips for Zimbabwe</h4>
          <ul className="text-sm text-blue-900 space-y-1">
            <li>• Test your ads during peak internet hours (evenings and weekends)</li>
            <li>• Use local language and cultural references when possible</li>
            <li>• Consider mobile-first design since most users are on phones</li>
            <li>• Start with small budgets and scale up when you find what works</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl">🤖</div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
          <p className="text-sm text-gray-600">What's happening and what to do about it</p>
        </div>
      </div>

      {/* Campaign Overview */}
      {campaigns.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">📊 Campaign Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Campaigns</p>
              <p className="font-semibold text-gray-900">{campaigns.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Active</p>
              <p className="font-semibold text-green-600">{campaigns.filter(c => c.status === 'ACTIVE').length}</p>
            </div>
            <div>
              <p className="text-gray-600">Paused</p>
              <p className="font-semibold text-yellow-600">{campaigns.filter(c => c.status === 'PAUSED').length}</p>
            </div>
            <div>
              <p className="text-gray-600">Learning</p>
              <p className="font-semibold text-blue-600">{campaigns.filter(c => c.status === 'LEARNING').length}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-8">
        <p className="text-gray-600">Connect your Facebook ads to get started with performance insights.</p>
      </div>
    </div>
  );
} 