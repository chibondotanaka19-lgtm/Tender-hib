import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, collectionGroup } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { useFirebase } from '../contexts/FirebaseContext';
import { Tender, Bid } from '../types';
import { Plus, LayoutDashboard, FileText, Send, Clock, Building2, ChevronRight, Tag, ArrowUpRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  onTenderClick: (id: string) => void;
  onCreate: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTenderClick, onCreate }) => {
  const { profile } = useFirebase();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [consumerBids, setConsumerBids] = useState<Bid[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'activity' | 'messages'>('activity');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      setLoading(true);
      try {
        // Fetch Tenders or Bids
        if (profile.role === 'organization') {
          const path = 'tenders';
          const q = query(
            collection(db, path),
            where('organizationId', '==', profile.uid),
            orderBy('createdAt', 'desc')
          );
          const snap = await getDocs(q);
          setTenders(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Tender)));
        } else {
          const bidsQuery = query(
            collectionGroup(db, 'bids'),
            where('userId', '==', profile.uid),
            orderBy('createdAt', 'desc')
          );
          const bidsSnap = await getDocs(bidsQuery);
          setConsumerBids(bidsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Bid)));
        }

        // Fetch Recent Messages via Collection Group
        try {
          const msgQuery = query(
            collectionGroup(db, 'messages'),
            where('receiverId', '==', profile.uid),
            orderBy('createdAt', 'desc')
          );
          const msgSnap = await getDocs(msgQuery);
          // Group by bid (to show only latest message per conversation)
          const latestMsgs: any[] = [];
          const seenBids = new Set();
          msgSnap.docs.forEach(doc => {
            const data = doc.data();
            const bidId = doc.ref.parent.parent?.id;
            if (bidId && !seenBids.has(bidId)) {
              seenBids.add(bidId);
              latestMsgs.push({ id: doc.id, bidId, tenderId: doc.ref.parent.parent?.parent.parent?.id, ...data });
            }
          });
          setRecentMessages(latestMsgs);
        } catch (e) {
          console.warn("Messages collectionGroup query failed (likely index):", e);
        }

      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, profile.role === 'organization' ? 'tenders' : 'bids');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-slate-500">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Profile Header */}
      <header className="px-4 pt-10 pb-12 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8 sm:gap-16">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full p-[3px] bg-gradient-to-tr from-emerald-500 via-blue-500 to-purple-500">
                <div className="h-full w-full rounded-full border-4 border-white bg-slate-900 flex items-center justify-center text-white text-3xl font-black">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-black">
                <CheckCircle2 size={16} />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{profile.name}</h1>
                <div className="flex gap-2">
                  {profile.role === 'organization' && (
                    <button 
                      onClick={onCreate}
                      className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-800"
                    >
                      New Tender
                    </button>
                  )}
                  <button className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all">
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex justify-center sm:justify-start gap-8 sm:gap-12">
                <div className="text-center sm:text-left">
                  <span className="block text-lg font-black text-slate-900 leading-none">
                    {profile.role === 'organization' ? tenders.length : consumerBids.length}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {profile.role === 'organization' ? 'Tenders' : 'Bids'}
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="block text-lg font-black text-emerald-600 leading-none">
                    {profile.role === 'organization' 
                      ? tenders.filter(t => t.status === 'awarded').length 
                      : consumerBids.filter(b => b.status === 'accepted').length}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Winning</span>
                </div>
              </div>

              <div className="text-sm">
                <p className="font-bold text-slate-900 uppercase tracking-tighter text-[10px] underline decoration-emerald-500/50 underline-offset-4">{profile.role === 'organization' ? 'Enterprise Issuer' : 'Consortium Bidder'}</p>
                <p className="text-slate-500 mt-2 text-xs">Building the future of infrastructure through transparent procurement.</p>
                <a href="#" className="text-emerald-600 font-bold block mt-3 text-xs hover:underline">tenderhub.app/{profile.uid.slice(0, 8)}</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Feed / Tabs */}
      <div className="mx-auto max-w-2xl">
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 border-t-2 -mt-[1px] transition-all ${
              activeTab === 'activity' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
            }`}
          >
            <LayoutDashboard size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">ACTIVITY</span>
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 border-t-2 -mt-[1px] transition-all ${
              activeTab === 'messages' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
            }`}
          >
            <Send size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">MESSAGES</span>
            {recentMessages.length > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            )}
          </button>
        </div>

        {/* Content Grid */}
        <section className="py-8 px-4 sm:px-0">
          {loading ? (
            <div className="grid grid-cols-3 gap-1 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-slate-50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : activeTab === 'messages' ? (
            <div className="space-y-4">
              {recentMessages.length > 0 ? recentMessages.map(msg => (
                <div 
                  key={msg.id}
                  onClick={() => onTenderClick(msg.tenderId)}
                  className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-sm relative overflow-hidden group"
                >
                  <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-lg transition-all">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{msg.senderName}</h3>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate pr-4">{msg.content}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </div>
              )) : (
                <div className="text-center py-20 opacity-20">
                  <Send size={48} className="mx-auto mb-4 text-slate-900" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-900">No messages yet</p>
                </div>
              )}
            </div>
          ) : profile.role === 'organization' ? (
            <div className="grid grid-cols-3 gap-1 sm:gap-4">
              {tenders.length > 0 ? tenders.map(t => (
                <div 
                  key={t.id}
                  onClick={() => onTenderClick(t.id)}
                  className="group relative aspect-square bg-slate-50 overflow-hidden rounded-lg cursor-pointer border border-slate-100 hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-gradient-to-b from-transparent to-black/[0.02]">
                    <div className="p-2 rounded-full bg-white text-slate-400 mb-2 group-hover:text-emerald-600 transition-all shadow-sm">
                      <Building2 size={24} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter line-clamp-2 px-1">
                      {t.title}
                    </span>
                  </div>
                  <div className={`absolute top-2 right-2 h-2 w-2 rounded-full ${t.status === 'open' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
              )) : (
                <div className="col-span-3 text-center py-20 opacity-20">
                  <FileText size={48} className="mx-auto mb-4 text-slate-900" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-900">No tenders posted yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {consumerBids.length > 0 ? consumerBids.map(bid => (
                <div 
                  key={bid.id}
                  onClick={() => onTenderClick(bid.tenderId)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-sm relative overflow-hidden group"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-all">
                    <Send size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{bid.tenderTitle}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        {bid.organizationName || 'Verified Issuer'}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-2 italic px-2 border-l border-emerald-500/30">Applied: {new Date(bid.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                    bid.status === 'accepted' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' :
                    bid.status === 'rejected' ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {bid.status === 'accepted' && <CheckCircle2 size={12} />}
                    {bid.status}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </div>
              )) : (
                <div className="text-center py-20 opacity-20">
                  <Send size={48} className="mx-auto mb-4 text-slate-900" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-900">No active bids yet</p>
                </div>
              )}
            </div>
          ) }
        </section>
      </div>
    </div>
  );
};
