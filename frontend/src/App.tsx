import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { ComposeEmailPage } from './pages/ComposeEmailPage';
import { EmailDetailPage } from './pages/EmailDetailPage';
import { SlackSettingsPage } from './pages/SlackSettingsPage';
import { HealthDashboardPage } from './pages/HealthDashboardPage';
import { RefreshCw } from 'lucide-react';

const getInitialTab = (): ActiveTab => {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('slack')) return 'slack';
  if (path.includes('health')) return 'health';
  if (path.includes('scheduled')) return 'scheduled';
  if (path.includes('compose')) return 'compose';
  return 'sent';
};

const DashboardContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab());
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [scheduledCount, setScheduledCount] = useState(12);
  const [sentCount, setSentCount] = useState(785);

  const setActiveTab = (tab: ActiveTab) => {
    setSelectedEmail(null);
    setActiveTabState(tab);
    const newPath = tab === 'slack' ? '/slack-settings' : tab === 'health' ? '/health' : `/${tab}`;
    window.history.pushState(null, '', newPath);
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getInitialTab());
      setSelectedEmail(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
        <p className="text-xs font-semibold text-gray-500 tracking-wider">
          Loading ReachInbox...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-white flex antialiased overflow-hidden">
      {/* Left Sidebar (Image 5) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedEmail(null);
          setActiveTab(tab);
        }}
        scheduledCount={scheduledCount}
        sentCount={sentCount}
        onOpenCompose={() => {
          setSelectedEmail(null);
          setActiveTab('compose');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white p-6">
        {activeTab === 'compose' ? (
          <ComposeEmailPage
            onBack={() => setActiveTab('sent')}
            onSuccess={() => setActiveTab('scheduled')}
          />
        ) : activeTab === 'slack' ? (
          <SlackSettingsPage />
        ) : activeTab === 'health' ? (
          <HealthDashboardPage />
        ) : selectedEmail ? (
          <EmailDetailPage
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
          />
        ) : (
          <DashboardOverviewPage
            activeTab={activeTab}
            onSelectEmail={(email) => setSelectedEmail(email)}
            onRefreshCounts={(sched, sent) => {
              setScheduledCount(sched);
              setSentCount(sent);
            }}
          />
        )}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;

