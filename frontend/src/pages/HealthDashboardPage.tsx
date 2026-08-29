import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { HealthStatus, QueueCounts } from '../types';
import { Activity, Database, HardDrive, Search, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export const HealthDashboardPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [queueStats, setQueueStats] = useState<QueueCounts | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const [hRes, qRes] = await Promise.all([
        api.get<HealthStatus>('/health'),
        api.get<{ counts: QueueCounts }>('/queue-stats'),
      ]);
      setHealth(hRes.data);
      setQueueStats(qRes.data.counts);
    } catch (err) {
      console.error('Failed to fetch health status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Infrastructure Health & BullMQ Metrics</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time status of database, cache, search cluster & message queue.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors border border-slate-700 flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Health</span>
        </button>
      </div>

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PostgreSQL */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-slate-400">PostgreSQL DB</div>
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-base font-bold text-white uppercase">
              {health?.services.postgres || 'Checking...'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Relational state & email job records</p>
        </div>

        {/* Redis */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-slate-400">Redis Cache</div>
            <HardDrive className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-base font-bold text-white uppercase">
              {health?.services.redis || 'Checking...'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Atomic rate limit counters & queue backing</p>
        </div>

        {/* Elasticsearch */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-slate-400">Elasticsearch</div>
            <Search className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-base font-bold text-white uppercase">
              {health?.services.elasticsearch || 'Checking...'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Full-text email search cluster</p>
        </div>
      </div>

      {/* BullMQ Queue Metrics Container */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>BullMQ Engine Counters</span>
          <span className="text-xs font-mono text-slate-400">email-scheduler-queue</span>
        </h2>

        {queueStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-blue-400">{queueStats.active}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1 uppercase">Active</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-amber-400">{queueStats.delayed}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1 uppercase">Delayed</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-purple-400">{queueStats.waiting}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1 uppercase">Waiting</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-emerald-400">{queueStats.completed}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1 uppercase">Completed</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-rose-400">{queueStats.failed}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1 uppercase">Failed</div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Retrieving BullMQ queue job counts...
          </div>
        )}
      </div>
    </div>
  );
};
