import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { useFirebase } from '../contexts/FirebaseContext';
import { Tender, Bid } from '../types';
import { Chat } from '../components/Chat';
import { UserProfileModal } from '../components/UserProfileModal';
import { createNotification } from '../services/notificationService';
import { ArrowLeft, Building2, Calendar, DollarSign, Tag, Clock, Send, CheckCircle2, ChevronRight, FileText, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TenderDetailsProps {
  tenderId: string;
  onBack: () => void;
}

export const TenderDetailsPage: React.FC<TenderDetailsProps> = ({ tenderId, onBack }) => {
  const { profile, user } = useFirebase();
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);
  const [activeChatBid, setActiveChatBid] = useState<Bid | null>(null);
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tenderPath = `tenders/${tenderId}`;
        const tenderDoc = await getDoc(doc(db, 'tenders', tenderId));
        if (tenderDoc.exists()) {
          setTender({ id: tenderDoc.id, ...(tenderDoc.data() as object) } as Tender);
          
          if (profile) {
            let bidsQuery;
            const bidsPath = `tenders/${tenderId}/bids`;
            if (profile.role === 'organization' && profile.uid === tenderDoc.data().organizationId) {
              bidsQuery = query(collection(db, 'tenders', tenderId, 'bids'), orderBy('createdAt', 'desc'));
            } else if (profile.role === 'consumer') {
              bidsQuery = query(
                collection(db, 'tenders', tenderId, 'bids'), 
                where('userId', '==', profile.uid)
              );
            }

            if (bidsQuery) {
              const bidsSnap = await getDocs(bidsQuery);
              setBids(bidsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Bid)));
            }
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `tenders/${tenderId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenderId, profile]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.role !== 'consumer' || !tender) return;

    setSubmittingBid(true);
    try {
      const bidsPath = `tenders/${tenderId}/bids`;
      const bidData: Omit<Bid, 'id'> = {
        tenderId,
        tenderTitle: tender.title,
        organizationName: tender.organizationName,
        userId: profile.uid,
        userName: profile.name,
        proposal: bidProposal,
        amount: parseFloat(bidAmount),
        status: 'submitted',
        createdAt: new Date().toISOString(),
      };

      const bidRef = await addDoc(collection(db, 'tenders', tenderId, 'bids'), bidData);
      
      // Notify Organization
      await createNotification(
        tender.organizationId,
        'New Bid Received',
        `${profile.name} has submitted a bid for "${tender.title}"`,
        'bid_submitted',
        bidRef.id
      );

      setBidSuccess(true);
      setTimeout(() => {
        setBidSuccess(false);
        onBack();
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tenders/${tenderId}/bids`);
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleUpdateBidStatus = async (bidId: string, newStatus: 'accepted' | 'rejected') => {
    if (!profile || profile.role !== 'organization' || !tender) return;

    try {
      const bidPath = `tenders/${tenderId}/bids/${bidId}`;
      const bidRef = doc(db, 'tenders', tenderId, 'bids', bidId);
      await setDoc(bidRef, { status: newStatus }, { merge: true });
      
      // Notify Bidder
      const bid = bids.find(b => b.id === bidId);
      if (bid) {
        await createNotification(
          bid.userId,
          `Bid Update: ${newStatus.toUpperCase()}`,
          `Your bid for "${tender.title}" has been ${newStatus}.`,
          'status_changed',
          bid.id
        );
      }

      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: newStatus } as Bid : b));
      
      if (newStatus === 'accepted') {
        const tenderPath = `tenders/${tenderId}`;
        await setDoc(doc(db, 'tenders', tenderId), { status: 'awarded' }, { merge: true });
        setTender(prev => prev ? { ...prev, status: 'awarded' } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tenders/${tenderId}`);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-96 animate-pulse rounded-3xl bg-white border border-slate-100 shadow-sm"></div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold">Tender not found</h2>
        <button onClick={onBack} className="mt-4 text-slate-600 hover:underline">Go back Home</button>
      </div>
    );
  }

  const isTenderOwner = profile?.uid === tender.organizationId;
  const hasAlreadyBid = bids.some(b => b.userId === profile?.uid);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-0 sm:px-4">
        {/* Detail Header */}
        <div className="sticky top-16 z-40 flex items-center justify-between bg-white/80 px-4 py-4 backdrop-blur-md lg:top-0">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-900 transition-all active:scale-90"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Details</h2>
          <div className="w-6" /> {/* Spacer */}
        </div>

        <div className="space-y-8 pb-32">
          {/* Main Visual Header */}
          <section className="px-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-lg">
                {tender.organizationName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-black tracking-tight text-slate-900">{tender.title}</h1>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{tender.organizationName}</p>
              </div>
              <div className={`rounded-xl px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${
                tender.status === 'open' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {tender.status}
              </div>
            </div>

            <div className="aspect-video w-full rounded-3xl bg-slate-50 flex flex-col items-center justify-center p-8 text-center border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl h-full w-full bg-gradient-to-tr from-emerald-500/20 via-blue-500/10 to-purple-500/20" />
               </div>
               <div className="mb-4 p-4 rounded-full bg-white text-slate-300 group-hover:text-emerald-500 transition-colors shadow-sm">
                 <Tag size={48} />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{tender.category}</p>
               <p className="text-4xl font-black text-slate-900 tracking-tighter">${tender.budget.toLocaleString()}</p>
            </div>
          </section>

          {/* Body Content */}
          <section className="px-6 space-y-8">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                The Brief
              </div>
              <p className="text-base leading-relaxed text-slate-600 font-medium">
                {tender.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Left</p>
                <p className="text-lg font-black text-slate-900">
                  {Math.max(0, Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-lg font-black text-emerald-600 uppercase tracking-widest">High Rank</p>
              </div>
            </div>
          </section>

          {/* Action Areas */}
          <section className="px-6 space-y-6">
            {isTenderOwner ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <MessageSquare size={14} />
                  Proposals Feed ({bids.length})
                </div>
                {bids.length > 0 ? (
                  <div className="space-y-4">
                    {bids.map(bid => (
                      <div key={bid.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4 group">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold cursor-pointer hover:bg-slate-200 transition-all"
                            onClick={() => {
                              setSelectedBidderId(bid.userId);
                              setShowProfileModal(true);
                            }}
                          >
                            {bid.userName.charAt(0)}
                          </div>
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              setSelectedBidderId(bid.userId);
                              setShowProfileModal(true);
                            }}
                          >
                            <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{bid.userName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(bid.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className="text-sm font-black text-emerald-600">${bid.amount.toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-slate-500 italic px-4 border-l border-slate-100">"{bid.proposal}"</p>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setActiveChatBid(bid)}
                             className="flex-1 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                           >
                             Open Comms
                           </button>
                           {bid.status === 'submitted' && (
                             <button 
                               onClick={() => handleUpdateBidStatus(bid.id, 'accepted')}
                               className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
                             >
                               Award
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 rounded-[40px] bg-slate-50 border border-slate-100 opacity-60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Applications</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {hasAlreadyBid ? (
                  <div className="p-10 rounded-[40px] bg-slate-900 text-white space-y-8 shadow-2xl">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <p className="text-lg font-black tracking-tight">Active Application</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status: {bids[0].status}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveChatBid(bids[0])}
                      className="w-full py-5 rounded-[28px] bg-white text-black font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                    >
                      Enter Discussion
                    </button>
                  </div>
                ) : tender.status !== 'open' ? (
                  <div className="p-12 rounded-[40px] bg-slate-50 border border-slate-100 text-center opacity-60">
                    <Clock size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Restricted: Closed</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitBid} className="space-y-6">
                    <div className="p-10 rounded-[40px] bg-white border border-slate-100 space-y-8 shadow-xl">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Formal Proposal</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Proposed Budget ($)</label>
                          <input 
                            type="number"
                            required
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-6 py-5 text-lg font-black text-slate-900 outline-none focus:border-slate-900/50 transition-all shadow-inner"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vision & Strategy</label>
                          <textarea 
                            required
                            value={bidProposal}
                            onChange={(e) => setBidProposal(e.target.value)}
                            rows={4}
                            className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-6 py-5 text-sm font-medium text-slate-600 outline-none focus:border-slate-900/50 transition-all shadow-inner resize-none italic"
                            placeholder="Detail your execution plan..."
                          />
                        </div>
                      </div>
                      <button 
                        type="submit"
                        disabled={submittingBid}
                        className="w-full py-5 rounded-[28px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
                      >
                        {submittingBid ? 'Transmitting...' : 'Upload Proposal'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {activeChatBid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-xl p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="w-full max-w-lg"
            >
              <div className="flex justify-end mb-4">
                <button 
                  onClick={() => setActiveChatBid(null)}
                  className="rounded-full bg-white border border-slate-100 p-3 text-slate-900 hover:bg-slate-50 transition-all shadow-xl"
                >
                  <ArrowLeft size={24} />
                </button>
              </div>
              <div className="shadow-2xl rounded-[40px] overflow-hidden border border-slate-100 bg-white">
                <Chat 
                  tenderId={tenderId} 
                  bidId={activeChatBid.id} 
                  recipientId={profile?.role === 'organization' ? activeChatBid.userId : tender.organizationId}
                  recipientName={profile?.role === 'organization' ? activeChatBid.userName : tender.organizationName}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <UserProfileModal 
        isOpen={showProfileModal}
        userId={selectedBidderId || ''}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
