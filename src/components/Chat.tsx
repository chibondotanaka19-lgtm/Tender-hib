import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Message } from '../types';
import { createNotification } from '../services/notificationService';
import { Send, User, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatProps {
  tenderId: string;
  bidId: string;
  recipientId: string;
  recipientName: string;
}

export const Chat: React.FC<ChatProps> = ({ tenderId, bidId, recipientId, recipientName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesPath = `tenders/${tenderId}/bids/${bidId}/messages`;
    const q = query(
      collection(db, 'tenders', tenderId, 'bids', bidId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, messagesPath);
    });

    return () => unsubscribe();
  }, [tenderId, bidId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const messagesPath = `tenders/${tenderId}/bids/${bidId}/messages`;
    try {
      await addDoc(collection(db, 'tenders', tenderId, 'bids', bidId, 'messages'), {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'System User',
        receiverId: recipientId,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
      });

      // Notify recipient
      await createNotification(
        recipientId,
        'Direct Message',
        `${auth.currentUser.displayName || 'User'} sent you a message regarding a bid.`,
        'message_received',
        bidId
      );

      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, messagesPath);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden" id="chat-container">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white text-lg font-black">
              {recipientName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">{recipientName}</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Secure Channel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-slate-50/30"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
            <Send size={64} className="text-slate-900 mb-4" />
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Protocol Initiated</p>
            <p className="text-[10px] text-slate-500 mt-2">Awaiting first transmission</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col max-w-[85%] space-y-2 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-3xl px-6 py-4 shadow-sm shadow-slate-200/50 transition-all ${
                    isMe 
                      ? 'bg-slate-900 text-white rounded-tr-none font-medium' 
                      : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                  }`}>
                    <p className="text-[14px] leading-relaxed">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-2`}>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {isMe ? 'AUTHORS' : msg.senderName.split(' ')[0]}
                    </span>
                    <span className="text-[8px] font-bold text-slate-300">
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100">
        <div className="relative group">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="w-full rounded-[30px] bg-slate-50 border border-slate-100 pl-8 pr-16 py-5 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 transition-all shadow-inner placeholder:text-slate-400"
            id="chat-input"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3.5 rounded-[22px] bg-slate-900 text-white transition-all disabled:opacity-20 active:scale-95 shadow-lg"
            id="chat-send-btn"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
