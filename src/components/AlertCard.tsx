'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

export interface AlertCardProps {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alertType: 'budget_depleted' | 'low_ctr' | 'high_costs' | 'campaign_paused' | 'high_frequency';
  campaignName?: string;
  campaignId?: string;
  createdAt: string;
  isResolved: boolean;
  metadata?: Record<string, any>;
  onResolve?: (alertId: string) => void;
  onIgnore?: (alertId: string) => void;
  onViewCampaign?: (campaignId: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  id,
  title,
  message,
  severity,
  alertType,
  campaignName,
  campaignId,
  createdAt,
  isResolved,
  metadata,
  onResolve,
  onIgnore,
  onViewCampaign,
}) => {
  // Severity configuration
  const severityConfig = {
    low: {
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-500',
    },
    medium: {
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-500',
    },
    high: {
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: ExclamationCircleIcon,
      iconColor: 'text-orange-500',
    },
    critical: {
      color: 'bg-red-50 border-red-200 text-red-800',
      icon: ExclamationCircleIcon,
      iconColor: 'text-red-500',
    },
  };

  // Alert type configuration
  const alertTypeConfig = {
    budget_depleted: {
      icon: '💰',
      label: 'Budget Alert',
      action: 'Review Budget',
    },
    low_ctr: {
      icon: '📉',
      label: 'CTR Alert',
      action: 'Optimize Now',
    },
    high_costs: {
      icon: '⚠️',
      label: 'Cost Alert',
      action: 'Review Costs',
    },
    campaign_paused: {
      icon: '⏸️',
      label: 'Status Alert',
      action: 'Reactivate',
    },
    high_frequency: {
      icon: '🔄',
      label: 'Frequency Alert',
      action: 'Adjust Targeting',
    },
  };

  const config = severityConfig[severity];
  const typeConfig = alertTypeConfig[alertType];
  const IconComponent = config.icon;

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  // Get metric values for display
  const getMetricDisplay = () => {
    if (!metadata) return null;

    switch (alertType) {
      case 'budget_depleted':
        return metadata.budget_usage ? `${metadata.budget_usage.toFixed(1)}% budget used` : null;
      case 'low_ctr':
        return metadata.current_ctr ? `${metadata.current_ctr.toFixed(2)}% CTR` : null;
      case 'high_costs':
        return metadata.current_cpc ? `$${metadata.current_cpc.toFixed(2)} CPC` : null;
      case 'high_frequency':
        return metadata.current_frequency ? `${metadata.current_frequency.toFixed(2)} frequency` : null;
      default:
        return null;
    }
  };

  const metricDisplay = getMetricDisplay();

  return (
    <div className={`border rounded-lg p-4 ${config.color} ${isResolved ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Alert Icon */}
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <IconComponent className="h-6 w-6" />
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{typeConfig.icon}</span>
              <span className="text-sm font-medium text-gray-900">
                {typeConfig.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                severity === 'critical' ? 'bg-red-100 text-red-800' :
                severity === 'high' ? 'bg-orange-100 text-orange-800' :
                severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </span>
            </div>

            {/* Alert Message */}
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-2">
              {message}
            </p>

            {/* Campaign Info */}
            {campaignName && (
              <div className="text-sm text-gray-500 mb-2">
                Campaign: <span className="font-medium">{campaignName}</span>
              </div>
            )}

            {/* Metric Display */}
            {metricDisplay && (
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Current:</span> {metricDisplay}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-400">
              {timeAgo}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isResolved && (
          <div className="flex items-center space-x-2 ml-4">
            {campaignId && onViewCampaign && (
              <button
                onClick={() => onViewCampaign(campaignId)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                View
              </button>
            )}
            
            {onResolve && (
              <button
                onClick={() => onResolve(id)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <WrenchScrewdriverIcon className="h-3 w-3 mr-1" />
                Fix Now
              </button>
            )}
            
            {onIgnore && (
              <button
                onClick={() => onIgnore(id)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <XMarkIcon className="h-3 w-3 mr-1" />
                Ignore
              </button>
            )}
          </div>
        )}

        {/* Resolved Badge */}
        {isResolved && (
          <div className="flex items-center ml-4">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span className="ml-1 text-sm text-green-600">Resolved</span>
          </div>
        )}
      </div>

      {/* Metadata Details (collapsible) */}
      {metadata && Object.keys(metadata).length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            View Details
          </summary>
          <div className="mt-2 p-2 bg-white rounded border text-xs">
            <pre className="whitespace-pre-wrap text-gray-600">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
};

export default AlertCard; 