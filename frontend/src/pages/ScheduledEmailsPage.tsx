import React, { useState, useEffect } from 'react';
import { Badge } from '../components/Badge';
import { EmailJob } from '../types';
import { api } from '../services/api';
import { Clock, RefreshCw, XCircle, Eye, AlertCircle, Trash2 } from 'lucide-react';

export const ScheduledEmailsPage: React.FC = () => {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<EmailJob | null>(null);

  const fetchScheduled = async () => {
    try {
      setLoading(true);
      const res = await api.get('/emails/scheduled');
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch scheduled queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email job?')) return;

    try {
      await api.delete(`/emails/scheduled/${id}`);
      fetchScheduled();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel email job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-400" />
            <span>Scheduled Email Queue</span>
          </h1>
          <p className="text-sm text-slate-400">
            Monitor delayed BullMQ queue execution, status updates & rate limits.
          </p>
        </div>

        <button
          onClick={fetchScheduled}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors border border-slate-700 flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Loading BullMQ queue state...
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No scheduled email jobs in queue</p>
            <p className="text-xs text-slate-500">Scheduled emails will appear here until sent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Subject & Recipients</th>
                  <th className="px-6 py-4">Scheduled Execution</th>
                  <th className="px-6 py-4">Rate Limit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 max-w-[280px]">
                      <div className="font-semibold text-white truncate">{job.subject}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {job.recipients.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {new Date(job.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-purple-400">
                      {job.hourlyLimit} / hr
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {job.status !== 'CANCELLED' && job.status !== 'SENT' && (
                        <button
                          onClick={() => handleCancel(job.id)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Cancel Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full space-y-4 border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Email Job Details</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Job ID:</span>
                <span className="font-mono text-slate-200">{selectedJob.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">BullMQ Job ID:</span>
                <span className="font-mono text-brand-400">{selectedJob.bullJobId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Subject:</span>
                <span className="text-white font-medium">{selectedJob.subject}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Recipients:</span>
                <span className="text-slate-200">{selectedJob.recipients.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Body Content:</span>
                <div className="mt-1 p-3 rounded-xl bg-slate-900 text-slate-300 font-mono overflow-x-auto max-h-40">
                  {selectedJob.body}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
