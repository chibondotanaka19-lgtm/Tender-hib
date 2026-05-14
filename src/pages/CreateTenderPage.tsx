import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { useFirebase } from '../contexts/FirebaseContext';
import { ArrowLeft, Send, Sparkles, Building2, Calendar, DollarSign, Tag, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface CreateTenderProps {
  onBack: () => void;
}

export const CreateTenderPage: React.FC<CreateTenderProps> = ({ onBack }) => {
  const { profile } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Construction',
    budget: '',
    deadline: '',
  });

  const categories = ['Construction', 'Information Technology', 'Healthcare', 'Energy', 'Public Works', 'Logistics', 'Agriculture', 'Entertainment'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.role !== 'organization') return;

    setLoading(true);
    try {
      const path = 'tenders';
      const tenderData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: formData.budget,
        deadline: new Date(formData.deadline).toISOString(),
        organizationId: profile.uid,
        organizationName: profile.organizationName || profile.name,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, path), tenderData);
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tenders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all transform active:scale-90"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <header className="mt-8 mb-12">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">Issue New Protocol</h1>
          <p className="mt-3 text-sm font-bold text-slate-400 uppercase tracking-widest">Architect the future of infrastructure through transparent bidding.</p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[40px] bg-white p-10 shadow-xl border border-slate-100"
            >
              <div className="space-y-10">
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-emerald-600 transition-colors">Tender Nomenclature</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. PROJECT_QUANTUM_RECON"
                    className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-5 text-slate-900 font-black outline-none border border-transparent focus:border-slate-950/20 focus:bg-white transition-all text-xl uppercase tracking-tight shadow-inner"
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-emerald-600 transition-colors">Mission Narrative</label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={10}
                    placeholder="Full mandate, technical specifications, and delivery metrics..."
                    className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-5 text-slate-600 font-medium outline-none border border-transparent focus:border-slate-950/20 focus:bg-white transition-all resize-none italic shadow-inner"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="rounded-[40px] bg-white p-8 shadow-xl border border-slate-100 space-y-8">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Tag size={12} className="text-emerald-600" />
                  Sector
                </label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-4 text-xs font-black text-slate-900 outline-none border border-transparent hover:border-slate-100 focus:bg-white appearance-none uppercase tracking-widest shadow-inner cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <DollarSign size={12} className="text-emerald-600" />
                  Asset Allocation
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="e.g. 50M - 100M"
                  className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-4 text-xs font-black text-slate-900 outline-none border border-transparent hover:border-slate-100 focus:bg-white uppercase tracking-widest shadow-inner"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Calendar size={12} className="text-emerald-600" />
                  Extraction Date
                </label>
                <input 
                  type="date" 
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-4 text-xs font-black text-slate-900 outline-none border border-transparent hover:border-slate-100 focus:bg-white shadow-inner cursor-pointer"
                />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-900 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-20 shadow-lg"
                >
                  {loading ? 'Transmitting...' : (
                    <>
                      <Send size={16} />
                      Publish Protocol
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-[30px] bg-slate-50 p-6 border border-slate-100 group">
              <div className="flex gap-4">
                <div className="rounded-xl bg-white p-2 text-emerald-600 transition-all shadow-sm">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Protocol Integrity</h4>
                  <p className="mt-2 text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-tighter opacity-60 italic">Once issued, the block is public. Real-time bi-directional telemetry active on submission.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};
