"use client";
import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase';
import { 
  SparklesIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AIReport {
  id: string;
  user_id: string;
  report_type: string;
  content: string;
  generated_at: string;
  status: 'success' | 'error' | 'pending';
}

export default function AIPerformanceReports() {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('AI Reports: user:', user, 'userError:', userError);
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('ai_performance_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(5);

      console.log('AI Reports: data:', data, 'error:', error);

      if (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to fetch reports');
      } else {
        setReports(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const generateNewReport = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'morning'
        }),
      });

      if (response.ok) {
        await fetchReports(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'daily_summary':
        return <ClockIcon className="h-4 w-4" />;
      case 'weekly_analysis':
        return <DocumentTextIcon className="h-4 w-4" />;
      default:
        return <SparklesIcon className="h-4 w-4" />;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'daily_summary':
        return 'Daily Summary';
      case 'weekly_analysis':
        return 'Weekly Analysis';
      default:
        return 'Performance Report';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
          <p className="text-sm text-gray-600">AI-generated insights about your ad performance</p>
        </div>
        <button
          onClick={generateNewReport}
          disabled={generating}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <SparklesIcon className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {generating ? 'Generating...' : 'Generate Report'}
          </span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
          <p className="text-gray-600 mb-4">Generate your first AI performance report to get started.</p>
          <button
            onClick={generateNewReport}
            disabled={generating}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>Generate First Report</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getReportTypeIcon(report.report_type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getReportTypeLabel(report.report_type)}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatDate(report.generated_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {report.status === 'success' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Success
                    </span>
                  )}
                  {report.status === 'error' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ✗ Error
                    </span>
                  )}
                  {report.status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {report.content.length > 200 
                    ? `${report.content.substring(0, 200)}...` 
                    : report.content
                  }
                </p>
                {report.content.length > 200 && (
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2">
                    Read more →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Reports Link */}
      {reports.length > 0 && (
        <div className="text-center pt-4">
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            View all reports →
          </button>
        </div>
      )}
    </div>
  );
} 