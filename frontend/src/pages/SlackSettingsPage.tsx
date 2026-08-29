import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Slack, CheckCircle2, AlertCircle, Send, Trash2, Link, Zap, RefreshCw } from 'lucide-react';

export const SlackSettingsPage: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState<{
    connected: boolean;
    integration: {
      hasWebhook: boolean;
      hasAccessToken?: boolean;
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

    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setMsg({ type: 'success', text: 'Slack OAuth connection successful!' });
    } else if (params.get('error')) {
      setMsg({ type: 'error', text: `Slack connection error: ${params.get('error')}` });
    }
  }, []);

  const handleOAuthConnect = async () => {
    try {
      setSaving(true);
      const res = await api.get('/slack/auth-url');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to initiate Slack OAuth flow. Check SLACK_CLIENT_ID.' });
    } finally {
      setSaving(false);
    }
  };

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
      await api.post('/slack/connect', { webhookUrl });
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Slack className="w-5 h-5 text-[#4A154B]" />
            <span>Slack Integration Settings</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Receive automated real-time Slack alerts for email delivery, rate limits, and worker health.
          </p>
        </div>
        <button
          onClick={fetchSlackStatus}
          disabled={loading}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-[#f8fafc] p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl border ${
              status.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
          >
            <Slack className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>Integration Status:</span>
              {status.connected ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  ● Connected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">
                  ○ Disconnected
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {status.connected
                ? `Connected via ${status.integration?.teamName ? `Workspace: ${status.integration.teamName}` : 'Incoming Webhook'}`
                : 'No Slack workspace currently linked to your account.'}
            </div>
          </div>
        </div>

        {status.connected && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendTestAlert}
              disabled={testing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testing ? 'Sending...' : 'Send Test Alert'}</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
              title="Disconnect Slack"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Connection Methods Container */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6 shadow-sm">
        {/* Method 1: OAuth */}
        <div className="p-4 rounded-xl bg-[#f8fafc] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Method 1: Connect via Slack OAuth (1-Click)</span>
            </h4>
            <p className="text-xs text-gray-500">
              Sign in with your Slack account to grant bot permissions automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOAuthConnect}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs border border-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <Slack className="w-4 h-4 text-[#4A154B]" />
            <span>Connect Slack OAuth</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Or Use Incoming Webhook URL
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Method 2: Webhook Form */}
        <form onSubmit={handleSaveWebhook} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-emerald-600" />
              <span>Slack Incoming Webhook URL</span>
            </label>
            <p className="text-xs text-gray-500">
              Paste your Slack Incoming Webhook URL (starts with <code>https://hooks.slack.com/services/...</code>).
            </p>
          </div>

          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !webhookUrl}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow transition-colors"
            >
              {saving ? 'Saving...' : 'Save Webhook URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


