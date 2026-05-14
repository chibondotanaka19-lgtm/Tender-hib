import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Tender } from '../types';
import { Search, Filter, ArrowRight, Tag, Clock, Building2, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onTenderClick: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onTenderClick }) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('open');
  const [deadlineStart, setDeadlineStart] = useState('');
  const [deadlineEnd, setDeadlineEnd] = useState('');

  const categories = ['All', 'Construction', 'Information Technology', 'Healthcare', 'Energy', 'Public Works', 'Logistics', 'Agriculture', 'Entertainment'];
  const statuses = ['All', 'open', 'closed', 'under-review', 'awarded'];

  useEffect(() => {
    const fetchTenders = async () => {
      setLoading(true);
      try {
        const path = 'tenders';
        const q = query(
          collection(db, path),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tender));
        setTenders(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'tenders');
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  const filteredTenders = tenders.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchesStatus = activeStatus === 'All' || t.status === activeStatus;
    
    let matchesDeadline = true;
    if (deadlineStart) {
      matchesDeadline = matchesDeadline && new Date(t.deadline) >= new Date(deadlineStart);
    }
    if (deadlineEnd) {
      matchesDeadline = matchesDeadline && new Date(t.deadline) <= new Date(deadlineEnd);
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDeadline;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Category Story Bar */}
      <div className="sticky top-16 z-30 flex items-center gap-4 overflow-x-auto border-b border-slate-100 bg-white/80 px-4 py-4 scrollbar-hide backdrop-blur-md lg:top-0">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="flex flex-col items-center gap-1.5 group min-w-[70px]"
          >
            <div className={`h-16 w-16 rounded-full p-[2px] transition-all ${activeCategory === cat ? 'bg-gradient-to-tr from-emerald-500 via-blue-500 to-purple-500' : 'bg-slate-100'}`}>
              <div className="h-full w-full rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                <Tag size={24} className={activeCategory === cat ? 'text-slate-900' : ''} />
              </div>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest truncate w-full text-center ${activeCategory === cat ? 'text-slate-900' : 'text-slate-400'}`}>
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Main Feed */}
      <section className="mx-auto max-w-xl py-6">
        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse space-y-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div className="h-4 w-32 rounded bg-slate-100" />
                </div>
                <div className="aspect-square w-full rounded-2xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-14 pb-20">
            {filteredTenders.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-20 text-center px-4 text-slate-400">
                <Search size={48} className="text-slate-100 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No tenders found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              filteredTenders.map((tender) => (
                <article 
                  key={tender.id}
                  className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between px-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                        {tender.organizationName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-none">{tender.organizationName}</h3>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{tender.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post Visual Content */}
                  <div 
                    className="relative aspect-square w-full bg-slate-50 overflow-hidden lg:rounded-2xl cursor-pointer shadow-sm border border-slate-100"
                    onClick={() => onTenderClick(tender.id)}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-transparent to-black/5">
                      <div className="mb-6 p-4 rounded-full bg-white text-emerald-500 shadow-xl transition-transform group-hover:scale-110">
                        <Building2 size={48} />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 line-clamp-3 uppercase leading-tight max-w-sm">
                        {tender.title}
                      </h2>
                      <div className="mt-6 flex items-center gap-2">
                        <span className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                          tender.status === 'open' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tender.status}
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <ArrowRight size={20} />
                    </div>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 px-4 py-3">
                    <button 
                      onClick={() => onTenderClick(tender.id)}
                      className="text-slate-900 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
                    >
                      <Plus className="stroke-[2.5]" size={28} />
                    </button>
                    <div className="ml-auto flex items-center gap-4 text-slate-400">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <Clock size={14} className="text-emerald-600" />
                        {new Date(tender.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Post Caption */}
                  <div className="px-4 text-sm">
                    <p className="inline font-bold text-slate-900 mr-2">{tender.organizationName}</p>
                    <span className="text-slate-600 leading-relaxed">
                       {tender.description}
                    </span>
                    <button 
                      onClick={() => onTenderClick(tender.id)}
                      className="mt-2 block text-emerald-600 font-bold uppercase tracking-tighter text-[10px] hover:underline"
                    >
                      View detailed brief and quote...
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};
