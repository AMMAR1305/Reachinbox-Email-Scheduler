import React from 'react';
import { ArrowLeft, Star, Archive, Trash2, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EmailDetailPageProps {
  email: {
    id: string;
    subject?: string;
    recipient?: string;
    recipients?: string[];
    body?: string;
    sentAt?: string;
    scheduledAt?: string;
    createdAt?: string;
    previewUrl?: string | null;
  };
  onBack: () => void;
}

export const EmailDetailPage: React.FC<EmailDetailPageProps> = ({ email, onBack }) => {
  const { user } = useAuth();

  // Safely extract recipient string
  const recipientStr =
    email.recipient ||
    (Array.isArray(email.recipients) && email.recipients.length > 0
      ? email.recipients.join(', ')
      : 'recipient@example.com');

  const displayName = recipientStr.includes('@')
    ? recipientStr.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : recipientStr;

  const dateValue = email.sentAt || email.scheduledAt || email.createdAt || new Date().toISOString();
  const formattedDate = new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subjectText = email.subject || 'No Subject';
  const bodyText = email.body || '';

  return (
    <div className="bg-white min-h-screen flex-1 p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate max-w-xl">
            {subjectText}
          </h1>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-amber-400 transition-colors">
            <Star className="w-4 h-4" />
          </button>
          <button className="hover:text-gray-700 transition-colors">
            <Archive className="w-4 h-4" />
          </button>
          <button className="hover:text-rose-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name[0] : 'U'}
            </div>
          )}
        </div>
      </div>

      {/* Sender Info Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00a859] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            {recipientStr[0] ? recipientStr[0].toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900">
                {displayName}
              </span>
              <span className="text-xs text-gray-400 font-normal">&lt;{recipientStr}&gt;</span>
            </div>
            <button className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600">
              <span>to me</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-medium">
          {formattedDate}
        </div>
      </div>

      {/* Email Body */}
      <div className="space-y-4 text-sm text-gray-800 leading-relaxed pt-2">
        {bodyText.includes('<') ? (
          <div dangerouslySetInnerHTML={{ __html: bodyText }} />
        ) : (
          <div className="space-y-4">
            <p>Hey {user?.name ? user.name.split(' ')[0] : 'there'},</p>
            <p>{bodyText || "You've just RECEIVED something"}</p>
          </div>
        )}

        {/* Highlighted Yellow Callout Banner (Matching Image 4) */}
        <div className="bg-[#fffde7] border-l-4 border-amber-400 p-4 rounded-r-xl space-y-1.5 my-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 investment</span>
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-900">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>To explore securing your private transformation, simply reply right now with <strong>"FLY OUT FIX"</strong></span>
          </div>
        </div>

        <div className="pt-2 text-xs text-gray-600 space-y-1">
          <p>Your coach for world-class performance,</p>
          <p className="font-semibold text-gray-800">Grant</p>
          <p className="italic text-gray-500 pt-1">
            P.S. Always remember that you can develop world class technique! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};
