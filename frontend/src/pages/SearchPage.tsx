import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, ExternalLink, Mail, RefreshCw, Sparkles } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      setLoading(true);
      const res = await api.get(`/emails/search?q=${encodeURIComponent(query)}`);
      setResults(res.data.results || []);
      setSearched(true);
    } catch (err) {
      console.error('Elasticsearch search error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-brand-400" />
          <span>Elasticsearch Email Search</span>
        </h1>
        <p className="text-sm text-slate-400">
          Full-text index search over subjects, HTML bodies & recipient addresses.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email subjects, body content, or recipient email address..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-xl"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 transition-all flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Search</span>
        </button>
      </form>

      {/* Results Container */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 pb-3">
          <span>Elasticsearch Query Results</span>
          <span>{results.length} Matches Found</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Querying Elasticsearch cluster index...
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Mail className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              {searched && query ? `No emails matching '${query}'` : 'No indexed emails found'}
            </p>
            <p className="text-xs text-slate-500">
              Emails are automatically indexed into Elasticsearch upon dispatch.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-brand-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{item.subject}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.sentAt).toLocaleString()}
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  <span className="text-slate-400 font-semibold">Recipient: </span>
                  <span className="text-brand-300">{item.recipient}</span>
                </div>

                <div className="text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl font-mono truncate">
                  {item.body}
                </div>

                {item.previewUrl && (
                  <div className="pt-1 flex justify-end">
                    <a
                      href={item.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Ethereal Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
