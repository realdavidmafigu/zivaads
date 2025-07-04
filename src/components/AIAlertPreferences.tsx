'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { BellIcon, ClockIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AlertPreferences {
  ai_alerts_enabled: boolean;
  morning_alerts: boolean;
  afternoon_alerts: boolean;
  evening_alerts: boolean;
  alert_frequency: 'daily' | 'weekly' | 'custom';
  custom_times?: string[];
  phone_number?: string;
}

export default function AIAlertPreferences() {
  const [preferences, setPreferences] = useState<AlertPreferences>({
    ai_alerts_enabled: true,
    morning_alerts: true,
    afternoon_alerts: true,
    evening_alerts: true,
    alert_frequency: 'daily',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testAlertLoading, setTestAlertLoading] = useState(false);

  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
      }

      if (data) {
        setPreferences({
          ai_alerts_enabled: data.ai_alerts_enabled ?? true,
          morning_alerts: data.morning_alerts ?? true,
          afternoon_alerts: data.afternoon_alerts ?? true,
          evening_alerts: data.evening_alerts ?? true,
          alert_frequency: data.alert_frequency ?? 'daily',
          custom_times: data.custom_times,
          phone_number: data.phone_number,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_alert_preferences')
        .upsert({
          user_id: user.id,
          ai_alerts_enabled: preferences.ai_alerts_enabled,
          morning_alerts: preferences.morning_alerts,
          afternoon_alerts: preferences.afternoon_alerts,
          evening_alerts: preferences.evening_alerts,
          alert_frequency: preferences.alert_frequency,
          custom_times: preferences.custom_times,
          phone_number: preferences.phone_number,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving preferences:', error);
        setMessage('Error saving preferences');
      } else {
        setMessage('Preferences saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const testAlert = async (alertType: 'morning' | 'afternoon' | 'evening') => {
    try {
      setTestAlertLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/alerts/ai-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertType,
          forceSend: true,
        }),
      });

      if (response.ok) {
        setMessage(`${alertType.charAt(0).toUpperCase() + alertType.slice(1)} test alert sent!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to send test alert');
      }
    } catch (error) {
      console.error('Error sending test alert:', error);
      setMessage('Error sending test alert');
    } finally {
      setTestAlertLoading(false);
    }
  };

  const updatePreference = (key: keyof AlertPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <BellIcon className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">AI Alert Preferences</h3>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md flex items-center ${
          message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message.includes('Error') ? (
            <XMarkIcon className="h-5 w-5 mr-2" />
          ) : (
            <CheckIcon className="h-5 w-5 mr-2" />
          )}
          {message}
        </div>
      )}

      {/* Enable/Disable AI Alerts */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">AI-Powered Daily Alerts</h4>
            <p className="text-sm text-gray-500">Receive brief, jargon-free updates about your campaign performance</p>
          </div>
          <button
            onClick={() => updatePreference('ai_alerts_enabled', !preferences.ai_alerts_enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.ai_alerts_enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.ai_alerts_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {preferences.ai_alerts_enabled && (
        <>
          {/* Alert Times */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Alert Times</h4>
            <div className="space-y-3">
              {[
                { key: 'morning_alerts', label: 'Morning (6 AM - 12 PM)', description: 'Start your day with campaign insights' },
                { key: 'afternoon_alerts', label: 'Afternoon (12 PM - 6 PM)', description: 'Midday performance check' },
                { key: 'evening_alerts', label: 'Evening (6 PM - 12 AM)', description: 'End-of-day summary' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => testAlert(key.replace('_alerts', '') as 'morning' | 'afternoon' | 'evening')}
                      disabled={testAlertLoading}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      {testAlertLoading ? 'Sending...' : 'Test'}
                    </button>
                    <button
                      onClick={() => updatePreference(key as keyof AlertPreferences, !preferences[key as keyof AlertPreferences])}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        preferences[key as keyof AlertPreferences] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          preferences[key as keyof AlertPreferences] ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">WhatsApp Phone Number</h4>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Enter your WhatsApp phone number to receive alerts</p>
              <input
                type="tel"
                value={preferences.phone_number || ''}
                onChange={(e) => updatePreference('phone_number', e.target.value)}
                placeholder="e.g., +263771234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400">Include country code (e.g., +263 for Zimbabwe)</p>
            </div>
          </div>

          {/* Alert Frequency */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Alert Frequency</h4>
            <div className="space-y-2">
              {[
                { value: 'daily', label: 'Daily', description: 'Receive alerts every day' },
                { value: 'weekly', label: 'Weekly', description: 'Receive alerts once a week' },
                { value: 'custom', label: 'Custom', description: 'Set your own schedule' },
              ].map(({ value, label, description }) => (
                <label key={value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="alert_frequency"
                    value={value}
                    checked={preferences.alert_frequency === value}
                    onChange={(e) => updatePreference('alert_frequency', e.target.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 