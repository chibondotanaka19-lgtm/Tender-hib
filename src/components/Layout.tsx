import React, { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { LogIn, User, LogOut, LayoutDashboard, Search, PlusCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationsPanel } from './NotificationsPanel';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LayoutProps {
  children: React.ReactNode;
  setCurrentPage: (page: any) => void;
  navigateToHome: () => void;
  navigateToDashboard: () => void;
  navigateToProfile: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, navigateToHome, navigateToDashboard, navigateToProfile }) => {
  const { user, profile, signOut, signInWithGoogle, loading } = useFirebase();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'consumer' | 'organization'>('consumer');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle(selectedRole, selectedRole === 'organization' ? orgName : undefined);
      setShowAuthModal(false);
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 lg:flex">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-100 bg-white px-6 py-10 lg:flex">
        <div 
          className="mb-10 flex cursor-pointer items-center gap-3 px-2" 
          onClick={navigateToHome}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-black italic shadow-lg">H</div>
          <span className="text-xl font-black tracking-tighter text-slate-900">TenderHub</span>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <NavItem icon={<Search size={22} />} label="Home" onClick={navigateToHome} />
          <NavItem icon={<LayoutDashboard size={22} />} label="Dashboard" onClick={navigateToDashboard} />
          <NavItem 
            icon={
              <div className="relative">
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-black ring-2 ring-black">
                    {unreadCount}
                  </span>
                )}
              </div>
            } 
            label="Alerts" 
            onClick={() => setShowNotifications(true)} 
          />
          <NavItem icon={<PlusCircle size={22} />} label="Create" onClick={() => profile?.role === 'organization' ? navigateToDashboard() : setShowAuthModal(true)} />
          <NavItem icon={<User size={22} />} label="Profile" onClick={navigateToProfile} />
        </div>

        <div className="mt-auto border-t border-slate-100 pt-6">
          {user ? (
            <button 
              onClick={signOut}
              className="flex w-full items-center gap-4 rounded-xl px-2 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium"
            >
              <LogOut size={22} />
              <span>Log Out</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex w-full items-center gap-4 rounded-xl bg-slate-900 px-4 py-3 text-white transition-all hover:bg-slate-800"
            >
              <LogIn size={22} />
              <span className="font-bold text-sm">Sign In</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md lg:hidden">
        <span className="text-xl font-black tracking-tighter text-slate-900" onClick={navigateToHome}>TenderHub</span>
        <div className="flex items-center gap-4">
          {user && (
            <button onClick={() => setShowNotifications(true)} className="relative p-1 text-slate-900">
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>
          )}
          {user ? (
            <div className="h-8 w-8 rounded-full bg-slate-100 p-0.5" onClick={navigateToProfile}>
               {user.photoURL ? (
                  <img src={user.photoURL} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold">{(user.displayName || 'U')[0]}</div>
                )}
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-slate-900"><LogIn size={24} /></button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64">
        <div className="mx-auto max-w-2xl px-0 pt-0 pb-24 lg:px-4 lg:py-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-slate-100 bg-white px-2 lg:hidden">
        <button onClick={navigateToHome} className="p-2 text-slate-900"><Search size={26} /></button>
        <button onClick={navigateToDashboard} className="p-2 text-slate-900"><LayoutDashboard size={26} /></button>
        <button onClick={() => profile?.role === 'organization' ? navigateToDashboard() : setShowAuthModal(true)} className="p-2 text-slate-900"><PlusCircle size={26} /></button>
        <button onClick={navigateToProfile} className="p-2 text-slate-900"><User size={26} /></button>
      </nav>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        role={selectedRole}
        setRole={setSelectedRole}
        orgName={orgName}
        setOrgName={setOrgName}
        onLogin={handleLogin}
      />

      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
};

const NavItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-4 rounded-xl px-2 py-4 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all group"
  >
    <div className="transition-transform group-hover:scale-110 group-hover:text-slate-900">{icon}</div>
    <span className="font-semibold text-lg">{label}</span>
  </button>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'consumer' | 'organization';
  setRole: (role: 'consumer' | 'organization') => void;
  orgName: string;
  setOrgName: (name: string) => void;
  onLogin: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, role, setRole, orgName, setOrgName, onLogin }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-2xl"
          >
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900">Welcome to Tender Hub</h2>
              <p className="mt-2 text-slate-500">Secure and transparent bidding for everyone.</p>
              
              <div className="mt-8 space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Identify as</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setRole('consumer')}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${role === 'consumer' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                      Consumer / Bidder
                    </button>
                    <button 
                      onClick={() => setRole('organization')}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${role === 'organization' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                      Organization
                    </button>
                  </div>
                </div>

                {role === 'organization' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Organization Name</label>
                    <input 
                      type="text" 
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. BuildCorp Ltd"
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-900/50"
                    />
                  </motion.div>
                )}

                <button 
                  onClick={onLogin}
                  disabled={role === 'organization' && !orgName}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                  id="modal-google-btn"
                >
                  <LogIn size={20} />
                  Continue with Google
                </button>
              </div>
            </div>
            <div className="bg-slate-50 px-8 py-4 text-center">
              <button onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-900">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
