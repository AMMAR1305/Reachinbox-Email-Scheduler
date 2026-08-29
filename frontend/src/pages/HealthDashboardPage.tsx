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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>Infrastructure Health & BullMQ Metrics</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time status of PostgreSQL, Redis, Elasticsearch, BullMQ Queue, and Ethereal SMTP.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Health</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Database className="w-5 h-5" />
            </div>
            {health?.services.postgres === 'connected' ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Error
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">PostgreSQL (Prisma)</div>
            <div className="text-xs text-gray-500 mt-0.5">Relational DB & Email Jobs</div>
          </div>
        </div>

        {/* Redis */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <HardDrive className="w-5 h-5" />
            </div>
            {health?.services.redis === 'connected' ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Error
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Redis (BullMQ & Cache)</div>
            <div className="text-xs text-gray-500 mt-0.5">Atomic rate limits & Queues</div>
          </div>
        </div>

        {/* Elasticsearch */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Search className="w-5 h-5" />
            </div>
            {health?.services.elasticsearch === 'connected' ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Fallback (DB)
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Elasticsearch</div>
            <div className="text-xs text-gray-500 mt-0.5">Indexing & Full-text search</div>
          </div>
        </div>


        {/* Queue Metrics */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Activity className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
              Active
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">BullMQ Email Queue</div>
            <div className="text-xs text-gray-500 mt-0.5">{queueStats?.active || 0} active / {queueStats?.waiting || 0} waiting</div>
          </div>
        </div>
      </div>

      {/* BullMQ Queue Metrics Container */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center justify-between">
          <span>BullMQ Engine Counters</span>
          <span className="text-xs font-mono text-gray-400 font-normal">email-scheduler-queue</span>
        </h2>

        {queueStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <div className="text-2xl font-extrabold text-blue-700">{queueStats.active}</div>
              <div className="text-xs font-semibold text-blue-600 mt-1 uppercase">Active</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <div className="text-2xl font-extrabold text-amber-700">{queueStats.delayed}</div>
              <div className="text-xs font-semibold text-amber-600 mt-1 uppercase">Delayed</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-center">
              <div className="text-2xl font-extrabold text-purple-700">{queueStats.waiting}</div>
              <div className="text-xs font-semibold text-purple-600 mt-1 uppercase">Waiting</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <div className="text-2xl font-extrabold text-emerald-700">{queueStats.completed}</div>
              <div className="text-xs font-semibold text-emerald-600 mt-1 uppercase">Completed</div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-center">
              <div className="text-2xl font-extrabold text-rose-700">{queueStats.failed}</div>
              <div className="text-xs font-semibold text-rose-600 mt-1 uppercase">Failed</div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400">
            Retrieving BullMQ queue job counts...
          </div>
        )}
      </div>
    </div>
  );
};
