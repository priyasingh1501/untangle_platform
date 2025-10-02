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
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to access email expense settings');
        setLoading(false);
        return;
      }

      const response = await fetch(buildApiUrl('/api/email-expense/settings'), {
        headers: {
          'Authorization': `Bearer ${token}`
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
      console.error('Error fetching email settings:', err);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E49C9]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forwarding Email Display */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3 font-jakarta tracking-wider">
          YOUR UNIQUE FORWARDING EMAIL
        </label>
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-1 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 font-mono text-sm text-text-primary backdrop-blur-sm">
            {forwardingEmail}
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1E49C9] text-white rounded-lg hover:bg-[#1E49C9]/90 transition-colors border border-[rgba(255,255,255,0.2)] font-jakarta tracking-wider"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <p className="text-sm text-text-secondary font-jakarta">
          Forward your receipts and invoices to this email address to automatically log expenses.
        </p>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="font-semibold text-text-primary mb-3 font-jakarta tracking-wide">How to Use:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary font-jakarta">
          <li>Copy your unique forwarding email above</li>
          <li>Forward receipts, invoices, or expense emails to this address</li>
          <li>Our AI will automatically extract expense details</li>
          <li>Review and confirm the parsed information</li>
        </ol>
      </div>

      {/* Settings */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary flex items-center space-x-2 mb-4 font-jakarta tracking-wide">
          <Settings className="h-5 w-5 text-[#1E49C9]" />
          <span>Settings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auto Parse */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-text-primary font-jakarta tracking-wider">Auto-parse emails</label>
              <p className="text-xs text-text-secondary font-jakarta">Automatically extract expense data from emails</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoParse}
                onChange={(e) => handleSettingChange('autoParse', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[rgba(0,0,0,0.2)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1E49C9]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgba(255,255,255,0.2)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E49C9]"></div>
            </label>
          </div>

          {/* Default Category */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2 font-jakarta tracking-wider">Default Category</label>
            <select
              value={settings.defaultCategory}
              onChange={(e) => handleSettingChange('defaultCategory', e.target.value)}
              className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E49C9]/30 text-text-primary font-jakarta backdrop-blur-sm"
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
            <label className="block text-sm font-medium text-text-primary mb-2 font-jakarta tracking-wider">Default Payment Method</label>
            <select
              value={settings.defaultPaymentMethod}
              onChange={(e) => handleSettingChange('defaultPaymentMethod', e.target.value)}
              className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E49C9]/30 text-text-primary font-jakarta backdrop-blur-sm"
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
              <label className="text-sm font-medium text-text-primary font-jakarta tracking-wider">Require confirmation</label>
              <p className="text-xs text-text-secondary font-jakarta">Review expenses before they're logged</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireConfirmation}
                onChange={(e) => handleSettingChange('requireConfirmation', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[rgba(0,0,0,0.2)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1E49C9]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgba(255,255,255,0.2)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E49C9]"></div>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)]">
          <h4 className="font-semibold text-text-primary mb-4 font-jakarta tracking-wide">Notifications</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-text-primary font-jakarta tracking-wider">Success notifications</label>
                <p className="text-xs text-text-secondary font-jakarta">Get notified when expenses are successfully logged</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationOnSuccess}
                  onChange={(e) => handleSettingChange('notificationOnSuccess', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[rgba(0,0,0,0.2)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1E49C9]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgba(255,255,255,0.2)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E49C9]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-text-primary font-jakarta tracking-wider">Failure notifications</label>
                <p className="text-xs text-text-secondary font-jakarta">Get notified when email parsing fails</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationOnFailure}
                  onChange={(e) => handleSettingChange('notificationOnFailure', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[rgba(0,0,0,0.2)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1E49C9]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgba(255,255,255,0.2)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E49C9]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg p-4 backdrop-blur-sm">
        <h4 className="font-semibold text-text-primary mb-3 font-jakarta tracking-wide">Usage Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#1E49C9] font-mono">{stats.totalEmailsProcessed}</div>
            <div className="text-sm text-text-secondary font-jakarta">Emails Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#1E49C9] font-mono">{stats.totalExpensesCreated}</div>
            <div className="text-sm text-text-secondary font-jakarta">Expenses Created</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[#1E49C9] font-mono">
              {stats.lastEmailReceived 
                ? new Date(stats.lastEmailReceived).toLocaleDateString()
                : 'Never'
              }
            </div>
            <div className="text-sm text-text-secondary font-jakarta">Last Email</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.3)] rounded-lg p-4 flex items-center space-x-2 backdrop-blur-sm">
          <AlertCircle className="h-5 w-5 text-[#FF6B6B]" />
          <span className="text-[#FF6B6B] font-jakarta">{error}</span>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2 bg-[#1E49C9] text-white rounded-lg hover:bg-[#1E49C9]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[rgba(255,255,255,0.2)] font-jakarta tracking-wider"
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
  );
};

export default EmailExpenseSettings;
