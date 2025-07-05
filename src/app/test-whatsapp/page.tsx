"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestWhatsAppPage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/test-whatsapp');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setMessage('Error checking WhatsApp status');
    }
  };

  const sendTestMessage = async (messageType: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/test-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber || undefined,
          messageType
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${data.message} (${data.phoneNumber})`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setMessage('❌ Error sending test message');
    } finally {
      setLoading(false);
    }
  };

  const updatePhoneNumber = async () => {
    if (!phoneNumber) {
      setMessage('❌ Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/alerts/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Phone number updated successfully');
        checkWhatsAppStatus(); // Refresh status
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      setMessage('❌ Error updating phone number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WhatsApp Integration Test</h1>
          <p className="text-gray-600">Test your WhatsApp Business API integration and send test messages.</p>
        </div>

        {/* Status Card */}
        {status && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">
                  {status.preferences?.phoneNumber || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">AI Alerts Enabled</p>
                <p className="font-medium">
                  {status.preferences?.aiAlertsEnabled ? '✅ Yes' : '❌ No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Test Mode</p>
                <p className="font-medium">
                  {status.whatsappConfig?.isTestMode ? '✅ Enabled' : '❌ Disabled (Production)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone Number ID</p>
                <p className="font-medium text-sm">
                  {status.whatsappConfig?.phoneNumberId}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Setup */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Phone Number</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (with country code)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+27123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={updatePhoneNumber}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Enter your phone number with country code (e.g., +27123456789 for South Africa)
          </p>
        </div>

        {/* Test Messages */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Messages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => sendTestMessage('text')}
              disabled={loading}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
            >
              <h3 className="font-medium text-gray-900">Simple Text Message</h3>
              <p className="text-sm text-gray-600">Send a basic text message to test the connection</p>
            </button>
            
            <button
              onClick={() => sendTestMessage('test_alert')}
              disabled={loading}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
            >
              <h3 className="font-medium text-gray-900">Test Alert Template</h3>
              <p className="text-sm text-gray-600">Send a test alert using WhatsApp templates</p>
            </button>
            
            <button
              onClick={() => sendTestMessage('budget_alert')}
              disabled={loading}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
            >
              <h3 className="font-medium text-gray-900">Budget Alert</h3>
              <p className="text-sm text-gray-600">Test a budget depletion alert</p>
            </button>
            
            <button
              onClick={() => sendTestMessage('ctr_alert')}
              disabled={loading}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
            >
              <h3 className="font-medium text-gray-900">CTR Alert</h3>
              <p className="text-sm text-gray-600">Test a low CTR performance alert</p>
            </button>
          </div>
        </div>

        {/* AI Daily Alert Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Daily Alert Test</h2>
          <p className="text-gray-600 mb-4">
            Test the AI daily alert system that sends WhatsApp notifications based on your campaign performance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch('/api/alerts/ai-daily', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alertType: 'morning', forceSend: true })
                  });
                  const data = await response.json();
                  if (response.ok) {
                    setMessage(`✅ Morning AI alert sent! WhatsApp: ${data.whatsappSent ? 'Yes' : 'No'}`);
                  } else {
                    setMessage(`❌ ${data.error}`);
                  }
                } catch (error) {
                  setMessage('❌ Error sending AI alert');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Test Morning Alert
            </button>
            
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch('/api/alerts/ai-daily', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alertType: 'afternoon', forceSend: true })
                  });
                  const data = await response.json();
                  if (response.ok) {
                    setMessage(`✅ Afternoon AI alert sent! WhatsApp: ${data.whatsappSent ? 'Yes' : 'No'}`);
                  } else {
                    setMessage(`❌ ${data.error}`);
                  }
                } catch (error) {
                  setMessage('❌ Error sending AI alert');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              Test Afternoon Alert
            </button>
            
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch('/api/alerts/ai-daily', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alertType: 'evening', forceSend: true })
                  });
                  const data = await response.json();
                  if (response.ok) {
                    setMessage(`✅ Evening AI alert sent! WhatsApp: ${data.whatsappSent ? 'Yes' : 'No'}`);
                  } else {
                    setMessage(`❌ ${data.error}`);
                  }
                } catch (error) {
                  setMessage('❌ Error sending AI alert');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Test Evening Alert
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>First, add your phone number in the setup section above</li>
            <li>Try sending a simple text message to test basic connectivity</li>
            <li>Test different alert types to see how they appear in WhatsApp</li>
            <li>Check your WhatsApp app to see if messages are delivered</li>
            <li>If messages aren't received, check your WhatsApp Business API setup</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 