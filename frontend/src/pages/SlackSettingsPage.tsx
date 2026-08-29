import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Slack, CheckCircle2, AlertCircle, Send, Trash2, Link } from 'lucide-react';

export const SlackSettingsPage: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState<{
    connected: boolean;
    integration: {
      hasWebhook: boolean;
      channelId?: string;
      teamName?: string;
      connectedAt?: string;
    } | null;
  }>({ connected: false, integration: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSlackStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/slack/status');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch Slack status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlackStatus();
  }, []);

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/services/')) {
      setMsg({
        type: 'error',
        text: 'Please enter a valid Slack Incoming Webhook URL (starting with https://hooks.slack.com/services/...)',
      });
      return;
    }

    try {
      setSaving(true);
      setMsg(null);
      await api.post('/slack/webhook', { webhookUrl });
      setMsg({ type: 'success', text: 'Slack Incoming Webhook connected successfully!' });
      setWebhookUrl('');
      fetchSlackStatus();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save Slack webhook.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Slack integration?')) return;

    try {
      await api.post('/slack/disconnect');
      setMsg({ type: 'success', text: 'Slack integration disconnected.' });
      fetchSlackStatus();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to disconnect Slack.' });
    }
  };

  const handleSendTestAlert = async () => {
    try {
      setTesting(true);
      setMsg(null);
      const res = await api.post('/slack/test');
      setMsg({ type: 'success', text: res.data.message });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send Slack test notification.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Slack className="w-6 h-6 text-brand-400" />
          <span>Slack Integration Settings</span>
        </h1>
        <p className="text-sm text-slate-400">
          Connect Slack for automated rate-limit alerts & job failure notifications.
        </p>
      </div>

      {/* Main Container */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        {/* Status Box */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border ${
                status.connected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Slack className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Slack Integration Status</span>
                {status.connected ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">
                    Disconnected
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {status.connected
                  ? `Active connection via Webhook / OAuth`
                  : 'No active Slack connection for your account.'}
              </div>
            </div>
          </div>

          {status.connected && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendTestAlert}
                disabled={testing}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testing ? 'Sending...' : 'Test Alert'}</span>
              </button>

              <button
                onClick={handleDisconnect}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                title="Disconnect Slack"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Webhook Connection Form */}
        <form onSubmit={handleSaveWebhook} className="space-y-4 pt-2 border-t border-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-brand-400" />
              <span>Slack Incoming Webhook URL</span>
            </label>
            <p className="text-xs text-slate-400">
              Create a Webhook in your Slack workspace and paste the URL below.
            </p>
          </div>

          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
            className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
          />

          {msg && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white font-semibold text-xs shadow-lg transition-all"
            >
              {saving ? 'Connecting...' : 'Save Webhook URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
