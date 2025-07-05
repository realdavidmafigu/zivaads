'use client';

import { useState } from 'react';

export default function TestWhatsAppSubscription() {
  const [phoneNumber, setPhoneNumber] = useState('+263718558160');
  const [message, setMessage] = useState('Hello! This is a test message from Adlense Network.');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  const sendMessage = async () => {
    setLoading(true);
    setStatus('Sending message...');

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          message,
          messageType: 'text'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`✅ Message sent successfully! Message ID: ${result.messageId}`);
      } else {
        setStatus(`❌ Error: ${result.message || result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getSubscribers = async () => {
    setLoading(true);
    setStatus('Fetching subscribers...');

    try {
      const response = await fetch('/api/whatsapp/subscribers');
      const result = await response.json();

      if (response.ok) {
        setSubscribers(result.subscribers || []);
        setStatus(`✅ Found ${result.subscribers?.length || 0} subscribers`);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            📱 WhatsApp Subscription Test
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">How WhatsApp Opt-in Works</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li><strong>User messages your WhatsApp number first</strong> (+263 77 155 5468)</li>
                <li><strong>Your webhook receives the message</strong> and adds them as a subscriber</li>
                <li><strong>You can then send messages</strong> within the 24-hour window</li>
                <li><strong>After 24 hours</strong>, they need to message again to re-subscribe</li>
              </ol>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Send Message Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Send Test Message</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+263718558160"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your message..."
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>

            {/* Subscribers Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Manage Subscribers</h3>
              
              <button
                onClick={getSubscribers}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Get Subscribers'}
              </button>

              {subscribers.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Current Subscribers:</h4>
                  <div className="space-y-2">
                    {subscribers.map((sub, index) => (
                      <div key={index} className="text-sm bg-white p-2 rounded border">
                        <div><strong>Phone:</strong> {sub.phone_number}</div>
                        <div><strong>Subscribed:</strong> {new Date(sub.subscribed_at).toLocaleDateString()}</div>
                        <div><strong>Messages:</strong> {sub.message_count}</div>
                        <div><strong>Status:</strong> {sub.is_active ? '✅ Active' : '❌ Inactive'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Display */}
          {status && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-semibold mb-2">Status:</h4>
              <p className="text-sm">{status}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">📋 Test Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
              <li>First, message <strong>+263 77 155 5468</strong> on WhatsApp with any text</li>
              <li>Wait a few seconds for the webhook to process</li>
              <li>Click "Get Subscribers" to see if you're added</li>
              <li>Try sending a test message using the form above</li>
              <li>Check your WhatsApp to see if you receive the message</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 