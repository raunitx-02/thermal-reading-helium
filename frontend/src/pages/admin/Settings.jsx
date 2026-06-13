import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Settings, Save, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/settings', { settings });
      if (res.data.success) {
        setMessage('System settings successfully synchronized.');
      }
    } catch (_) {
      setMessage('Failed to update system settings.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-slate-500 text-sm">
        <span className="animate-spin mr-2">⏳</span> Loading settings...
      </div>
    );
  }

  const findVal = (key) => settings.find(s => s.key === key)?.value || '';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Portal Configuration</h1>
        <p className="text-slate-500 text-sm mt-1">Configure threshold levels, automatic notifications, and shifts</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-650" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Temperature thresholds */}
        <div className="bg-white border border-slate-205 border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Default Temperature Thresholds (°C)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Warning Level Threshold</label>
              <input
                type="number"
                value={findVal('default_warning_threshold')}
                onChange={(e) => handleChange('default_warning_threshold', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-905 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Critical Level Threshold</label>
              <input
                type="number"
                value={findVal('default_critical_threshold')}
                onChange={(e) => handleChange('default_critical_threshold', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-905 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="w-4 h-4 text-blue-500" /> Automated Alarms & Reminders
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Email Alerts</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Send instant email notification to administrators on anomaly breach</p>
              </div>
              <input
                type="checkbox"
                checked={findVal('email_alerts_enabled') === 'true'}
                onChange={(e) => handleChange('email_alerts_enabled', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 accent-blue-600 rounded bg-white border-slate-200 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Daily Submission Reminders</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Remind inspectors at start of shift to complete logs</p>
              </div>
              <input
                type="checkbox"
                checked={findVal('inspector_reminder_enabled') === 'true'}
                onChange={(e) => handleChange('inspector_reminder_enabled', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 accent-blue-600 rounded bg-white border-slate-200 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: General */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-4 h-4 text-slate-400" /> Division Details & Sessions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Division Name</label>
              <input
                type="text"
                value={findVal('division_name')}
                onChange={(e) => handleChange('division_name', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Auto-logout Timeout (minutes)</label>
              <input
                type="number"
                value={findVal('idle_timeout_minutes')}
                onChange={(e) => handleChange('idle_timeout_minutes', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg py-2.5 px-6 transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Synchronizing...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
