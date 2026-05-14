import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import { Notification } from '../types';
import { Bell, X, Check, Trash2, Clock, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useFirebase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!notifications.length) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      }
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm';
    return 'Just now';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[70] h-screen w-80 border-l border-slate-100 bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-8">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase italic">Alerts</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Telemetry</p>
                </div>
                <button 
                  onClick={onClose}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900 transition-all transform active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {notifications.filter(n => !n.read).length} Unread
                </span>
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Mark all as read
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {loading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 rounded-2xl bg-slate-50 animate-pulse" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
                    <Inbox size={48} className="mb-4 text-slate-900" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">No Transmissions</p>
                    <p className="text-[10px] text-slate-500 mt-2">Standing by for protocol updates</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={`relative group p-4 rounded-2xl border transition-all cursor-pointer ${
                        n.read ? 'bg-white border-slate-100' : 'bg-slate-50 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          {n.type.replace('_', ' ')}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                          {getTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold ${n.read ? 'text-slate-400' : 'text-slate-900'}`}>
                        {n.title}
                      </h4>
                      <p className={`mt-1 text-[10px] leading-relaxed ${n.read ? 'text-slate-400' : 'text-slate-600'}`}>
                        {n.message}
                      </p>
                      {!n.read && (
                        <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
