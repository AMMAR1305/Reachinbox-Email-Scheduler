import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Star, Clock } from 'lucide-react';
import { api } from '../services/api';
import { ActiveTab } from '../components/Sidebar';

interface DashboardOverviewPageProps {
  activeTab: ActiveTab;
  onSelectEmail: (email: any) => void;
  onRefreshCounts: (scheduled: number, sent: number) => void;
}

export const DashboardOverviewPage: React.FC<DashboardOverviewPageProps> = ({
  activeTab,
  onSelectEmail,
  onRefreshCounts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentList, setSentList] = useState<any[]>([]);
  const [scheduledList, setScheduledList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sentRes, schedRes] = await Promise.all([
        api.get('/emails/sent?limit=50'),
        api.get('/emails/scheduled?limit=50'),
      ]);

      const sents = sentRes.data.sent || [];
      const scheds = schedRes.data.jobs || [];

      setSentList(sents);
      setScheduledList(scheds);
      onRefreshCounts(schedRes.data.total || scheds.length, sentRes.data.total || sents.length);
    } catch (err) {
      console.error('Failed to fetch emails', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const displayedList = activeTab === 'scheduled' ? scheduledList : sentList;
  const filtered = displayedList.filter((item) => {
    const text = `${item.subject || ''} ${item.recipient || (item.recipients ? item.recipients.join(' ') : '')} ${item.body || ''}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-white min-h-screen flex-1 p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Search Bar with Filter & Refresh (Matching Image 5) */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#f4f6f8] border-none text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
          />
        </div>

        <button
          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Filter"
        >
          <Filter className="w-4 h-4" />
        </button>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Email List Items (Matching Image 5) */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">Loading messages...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Clock className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-400 font-medium">
              No {activeTab === 'scheduled' ? 'scheduled' : 'sent'} emails found.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const recipientText = item.recipient || (item.recipients ? item.recipients.join(', ') : 'Recipient');
            const cleanBodySnippet = (item.body || '').replace(/<[^>]*>?/gm, '').slice(0, 75);

            return (
              <div
                key={item.id}
                onClick={() => onSelectEmail(item)}
                className="py-3.5 px-3 flex items-center justify-between hover:bg-gray-50/80 rounded-xl cursor-pointer transition-colors group"
              >
                {/* Left: To Recipient */}
                <div className="w-44 shrink-0 font-semibold text-xs text-gray-900 truncate">
                  To: {recipientText.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </div>

                {/* Center: Badge + Subject + Snippet */}
                <div className="flex-1 flex items-center gap-3 min-w-0 pr-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium shrink-0">
                    {activeTab === 'scheduled' ? item.status : 'Sent'}
                  </span>

                  <div className="text-xs text-gray-800 truncate">
                    <span className="font-semibold">{item.subject}</span>
                    <span className="text-gray-400 font-normal"> - {cleanBodySnippet}...</span>
                  </div>
                </div>

                {/* Right: Ethereal Preview + Star Icon */}
                <div className="flex items-center gap-2">
                  {item.previewUrl && (
                    <a
                      href={item.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 opacity-90 hover:opacity-100 transition-all shadow-sm"
                      title="Open in Ethereal Sandbox"
                    >
                      <span>Ethereal Preview</span>
                      <span className="text-xs">↗</span>
                    </a>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="text-gray-300 hover:text-amber-400 transition-colors p-1"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

