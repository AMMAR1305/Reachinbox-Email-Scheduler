import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Send, Plus, ChevronDown, LogOut, Slack, Activity } from 'lucide-react';

export type ActiveTab = 'scheduled' | 'sent' | 'compose' | 'detail' | 'slack' | 'health';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  scheduledCount: number;
  sentCount: number;
  onOpenCompose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  scheduledCount,
  sentCount,
  onOpenCompose,
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'AH';
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-5 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* ONG / Brand Logo */}
        <div className="flex items-center gap-2 px-1">
          <div className="text-2xl font-black tracking-wider text-gray-900 font-mono flex items-center">
            <span>ONG</span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#f4f6f8] hover:bg-gray-200/70 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              {user?.avatar && !avatarError ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-white shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#00a859] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {getInitials(user?.name, user?.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-gray-900 truncate">
                  {user?.name || 'User Profile'}
                </div>
                <div className="text-[11px] text-gray-500 truncate">
                  {user?.email || 'user@domain.io'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
          </button>


          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-800">{user?.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <button
          onClick={onOpenCompose}
          className={`w-full py-2.5 px-4 rounded-full border font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
            activeTab === 'compose'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
              : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'
          }`}
        >
          <span>Compose</span>
        </button>


        {/* CORE Navigation Section */}
        <div className="space-y-1 pt-2">
          <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            CORE
          </div>

          {/* Scheduled Nav */}
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'bg-[#e6f4ea] text-emerald-800'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>Scheduled</span>
            </div>
            <span className="text-xs font-semibold text-gray-400">{scheduledCount}</span>
          </button>

          {/* Sent Nav */}
          <button
            onClick={() => setActiveTab('sent')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-[#e6f4ea] text-emerald-800'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Sent</span>
            </div>
            <span className="text-xs font-semibold text-gray-400">{sentCount}</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-gray-400 px-2 text-center">
        ReachInbox Email Scheduler &bull; v1.0
      </div>
    </aside>
  );
};


