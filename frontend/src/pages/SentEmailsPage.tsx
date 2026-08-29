import React, { useState, useEffect } from 'react';
import { SentEmail } from '../types';
import { api } from '../services/api';
import { CheckCircle2, ExternalLink, RefreshCw, Eye, Mail, XCircle } from 'lucide-react';

export const SentEmailsPage: React.FC = () => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

  const fetchSent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/emails/sent');
      setEmails(res.data.sent || []);
    } catch (err) {
      console.error('Failed to fetch sent emails', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSent();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Sent Emails Log</span>
          </h1>
          <p className="text-sm text-slate-400">
            Delivered dispatches with Ethereal SMTP preview links and message IDs.
          </p>
        </div>

        <button
          onClick={fetchSent}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors border border-slate-700 flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Fetching sent email records...
          </div>
        ) : emails.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Mail className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No sent emails recorded yet</p>
            <p className="text-xs text-slate-500">Emails dispatched by worker will be logged here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Dispatched At</th>
                  <th className="px-6 py-4">Ethereal Preview</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {emails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white truncate max-w-[200px]">
                      {email.recipient}
                    </td>
                    <td className="px-6 py-4 text-slate-200 truncate max-w-[250px]">
                      {email.subject}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(email.sentAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {email.previewUrl ? (
                        <a
                          href={email.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>Open Ethereal Mail</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium">Delivered</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="View Full Content"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email View Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-xl w-full space-y-4 border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Sent Email Log Details</h3>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">To Recipient:</span>
                <span className="text-white font-medium">{selectedEmail.recipient}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Subject:</span>
                <span className="text-white font-medium">{selectedEmail.subject}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Ethereal Message ID:</span>
                <span className="font-mono text-slate-400">{selectedEmail.etherealMsgId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Message Body:</span>
                <div
                  className="mt-1 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-sans max-h-60 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              {selectedEmail.previewUrl ? (
                <a
                  href={selectedEmail.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Ethereal Preview URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : <div />}

              <button
                onClick={() => setSelectedEmail(null)}
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
