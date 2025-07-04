'use client';

import React, { useState } from 'react';
import { 
  PerformanceMetrics, 
  convertToSimpleLanguage, 
  ExplanationResult 
} from '@/lib/ai-explanations';

interface PerformanceExplainerProps {
  metrics: PerformanceMetrics;
  className?: string;
  aiExplanation?: string;
}

export default function PerformanceExplainer({ metrics, className = '', aiExplanation }: PerformanceExplainerProps) {
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');
  const explanations = convertToSimpleLanguage(metrics);

  const getOverallSentiment = (): { emoji: string; color: string; text: string } => {
    const sentiments = [
      explanations.ctr.sentiment,
      explanations.cpm.sentiment,
      explanations.cpc.sentiment,
      explanations.frequency.sentiment
    ];
    
    const goodCount = sentiments.filter(s => s === 'good').length;
    const problemCount = sentiments.filter(s => s === 'problem').length;
    
    if (problemCount >= 2) {
      return { emoji: '😟', color: 'red', text: 'Needs attention' };
    } else if (goodCount >= 2) {
      return { emoji: '😊', color: 'green', text: 'Doing well' };
    } else {
      return { emoji: '😐', color: 'yellow', text: 'Okay' };
    }
  };

  const overallSentiment = getOverallSentiment();

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const renderSimpleView = () => (
    <div className="space-y-4">
      {/* Overall Performance */}
      <div className={`p-4 rounded-lg border ${getColorClasses(overallSentiment.color)}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{overallSentiment.emoji}</span>
          <div>
            <h3 className="font-semibold">{overallSentiment.text}</h3>
            <p className="text-sm opacity-80">Grade: {explanations.grade}</p>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Quick Summary</h3>
        <p className="text-blue-900 text-sm">{explanations.summary}</p>
      </div>

      {/* Customer Cost */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-800 mb-2">Customer Cost</h3>
        <p className="text-purple-900 text-sm">{explanations.customerCost}</p>
      </div>

      {/* Individual Metrics */}
      <div className="grid gap-3">
        <MetricCard 
          title="Click Rate" 
          explanation={explanations.ctr}
          technicalValue={`${metrics.ctr.toFixed(2)}%`}
        />
        <MetricCard 
          title="Cost per Click" 
          explanation={explanations.cpc}
          technicalValue={`$${metrics.cpc.toFixed(2)}`}
        />
        <MetricCard 
          title="Cost per 1000 Views" 
          explanation={explanations.cpm}
          technicalValue={`$${metrics.cpm.toFixed(2)}`}
        />
        <MetricCard 
          title="Ad Frequency" 
          explanation={explanations.frequency}
          technicalValue={`${metrics.frequency.toFixed(1)}x`}
        />
      </div>
    </div>
  );

  const renderTechnicalView = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Technical Metrics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">CTR:</span>
            <span className="ml-2 font-mono">{metrics.ctr.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-600">CPC:</span>
            <span className="ml-2 font-mono">${metrics.cpc.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">CPM:</span>
            <span className="ml-2 font-mono">${metrics.cpm.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Frequency:</span>
            <span className="ml-2 font-mono">{metrics.frequency.toFixed(1)}x</span>
          </div>
          <div>
            <span className="text-gray-600">Impressions:</span>
            <span className="ml-2 font-mono">{metrics.impressions.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">Clicks:</span>
            <span className="ml-2 font-mono">{metrics.clicks.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">Reach:</span>
            <span className="ml-2 font-mono">{metrics.reach.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">Spend:</span>
            <span className="ml-2 font-mono">${metrics.spend.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* AI Explanation if available */}
      {aiExplanation && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">AI Explanation</h2>
          <p className="text-blue-900 whitespace-pre-line">{aiExplanation}</p>
        </div>
      )}
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Performance Analysis</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'simple' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setViewMode('technical')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'technical' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Technical
          </button>
        </div>
      </div>
      {/* Content */}
      {viewMode === 'simple' ? renderSimpleView() : renderTechnicalView()}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  explanation: ExplanationResult;
  technicalValue: string;
}

function MetricCard({ title, explanation, technicalValue }: MetricCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getColorClasses(explanation.color)}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{explanation.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm">{title}</h4>
            <span className="text-xs font-mono opacity-70">{technicalValue}</span>
          </div>
          <p className="text-xs leading-relaxed">{explanation.text}</p>
        </div>
      </div>
    </div>
  );
} 