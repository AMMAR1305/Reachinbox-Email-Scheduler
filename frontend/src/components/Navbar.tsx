import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            ReachInbox <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">Scheduler</span>
          </h1>
          <p className="text-xs text-slate-400">Enterprise Email Dispatcher</p>
        </div>
      </div>

      {/* Authenticated User & Actions */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Postgres & Redis Online</span>
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-slate-700 object-cover shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200">{user.name}</div>
              <div className="text-[11px] text-slate-400 font-mono max-w-[180px] truncate">
                {user.email}
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout from ReachInbox"
              className="ml-2 p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
