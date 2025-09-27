import React, { useState, useEffect } from 'react';
import { Mail, Copy, Check, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { buildApiUrl } from '../config';

const EmailExpenseSettings = () => {
  const [forwardingEmail, setForwardingEmail] = useState('');
  const [settings, setSettings] = useState({
    autoParse: true,
    defaultCategory: 'other',
    defaultPaymentMethod: 'credit-card',
    requireConfirmation: false,
    notificationOnSuccess: true,
    notificationOnFailure: true
  });
  const [stats, setStats] = useState({
    totalEmailsProcessed: 0,
    totalExpensesCreated: 0,
    lastEmailReceived: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/email-expense/settings'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setForwardingEmail(data.forwardingEmail);
        setSettings(data.settings);
        setStats(data.stats);
      } else {
        setError('Failed to load email settings');
      }
    } catch (err) {
      setError('Error loading email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl('/api/email-expense/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        // Show success message
        setError('');
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      setError('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(forwardingEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Mail className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Email Expense Forwarding</h2>
        </div>

        {/* Forwarding Email Display */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Unique Forwarding Email
          </label>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm">
              {forwardingEmail}
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Forward your receipts and invoices to this email address to automatically log expenses.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Copy your unique forwarding email above</li>
            <li>Forward receipts, invoices, or expense emails to this address</li>
            <li>Our AI will automatically extract expense details</li>
            <li>Review and confirm the parsed information</li>
          </ol>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Parse */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-parse emails</label>
                <p className="text-xs text-gray-500">Automatically extract expense data from emails</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoParse}
                  onChange={(e) => handleSettingChange('autoParse', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Default Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Category</label>
              <select
                value={settings.defaultCategory}
                onChange={(e) => handleSettingChange('defaultCategory', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="food">Food</option>
                <option value="transportation">Transportation</option>
                <option value="housing">Housing</option>
                <option value="utilities">Utilities</option>
                <option value="healthcare">Healthcare</option>
                <option value="entertainment">Entertainment</option>
                <option value="shopping">Shopping</option>
                <option value="education">Education</option>
                <option value="travel">Travel</option>
                <option value="insurance">Insurance</option>
                <option value="taxes">Taxes</option>
                <option value="debt">Debt</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Default Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Payment Method</label>
              <select
                value={settings.defaultPaymentMethod}
                onChange={(e) => handleSettingChange('defaultPaymentMethod', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="credit-card">Credit Card</option>
                <option value="debit-card">Debit Card</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="digital-wallet">Digital Wallet</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Require Confirmation */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Require confirmation</label>
                <p className="text-xs text-gray-500">Review expenses before they're logged</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireConfirmation}
                  onChange={(e) => handleSettingChange('requireConfirmation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Notifications</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Success notifications</label>
                <p className="text-xs text-gray-500">Get notified when expenses are successfully logged</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationOnSuccess}
                  onChange={(e) => handleSettingChange('notificationOnSuccess', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Failure notifications</label>
                <p className="text-xs text-gray-500">Get notified when email parsing fails</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationOnFailure}
                  onChange={(e) => handleSettingChange('notificationOnFailure', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEmailsProcessed}</div>
              <div className="text-sm text-gray-600">Emails Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalExpensesCreated}</div>
              <div className="text-sm text-gray-600">Expenses Created</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {stats.lastEmailReceived 
                  ? new Date(stats.lastEmailReceived).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <div className="text-sm text-gray-600">Last Email</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailExpenseSettings;
