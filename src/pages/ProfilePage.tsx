import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { ArrowLeft, Building2, Mail, User, Save, CheckCircle2, Phone, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { profile, user } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [name, setName] = useState(profile?.name || '');
  const [organizationName, setOrganizationName] = useState(profile?.organizationName || '');
  const [contactEmail, setContactEmail] = useState(profile?.contactEmail || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [description, setDescription] = useState(profile?.description || '');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        ...profile,
        name,
        organizationName: profile.role === 'organization' ? organizationName : undefined,
        contactEmail,
        phoneNumber,
        description,
      };
      
      await setDoc(userRef, updatedData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Note: In a real app, you'd want to refresh the profile in the context
      // Since our context listens to auth but not necessarily doc changes in real-time,
      // it will update on next session or if we manually add matching logic.
      // For now, let's reload to be simple if needed, or assume it's just local.
      window.location.reload(); 
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all transform active:scale-90"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <header className="mt-8 mb-12">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">Identity Matrix</h1>
          <p className="mt-3 text-sm font-bold text-slate-400 uppercase tracking-widest">Configure your digital credentials and organization signature.</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[40px] bg-white p-10 shadow-xl border border-slate-100"
        >
          <form onSubmit={handleUpdate} className="space-y-10">
            <div className="flex items-center gap-6 pb-10 border-b border-slate-100">
              <div className="h-24 w-24 rounded-full bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-lg">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{profile.name}</h2>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{profile.role} ACCESS</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-emerald-600 transition-colors flex items-center gap-2">
                  <User size={12} />
                  Legal Handle
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-5 text-slate-900 font-bold outline-none border border-transparent focus:border-slate-950/20 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Mail size={12} />
                  System Email
                </label>
                <input 
                  type="email" 
                  disabled
                  value={profile.email}
                  className="mt-4 w-full rounded-2xl bg-slate-100 px-6 py-5 text-slate-400 font-bold cursor-not-allowed border border-transparent"
                />
              </div>

              {profile.role === 'organization' && (
                <>
                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-emerald-600 transition-colors flex items-center gap-2">
                      <Building2 size={12} />
                      Organization Entity
                    </label>
                    <input 
                      type="text" 
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-5 text-slate-900 font-bold outline-none border border-transparent focus:border-slate-950/20 focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-emerald-600 transition-colors flex items-center gap-2">
                        <Mail size={12} />
                        Public Comms
                      </label>
                      <input 
                        type="email" 
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@org.com"
                        className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-5 text-slate-900 font-bold outline-none border border-transparent focus:border-slate-950/20 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                    <div className="group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-emerald-600 transition-colors flex items-center gap-2">
                        <Phone size={12} />
                        Dial Protocol
                      </label>
                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-5 text-slate-900 font-bold outline-none border border-transparent focus:border-slate-950/20 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-emerald-600 transition-colors flex items-center gap-2">
                      <FileText size={12} />
                      Corporate Blueprint
                    </label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Tell us about your organization..."
                      className="mt-4 w-full rounded-2xl bg-slate-50 px-6 py-5 text-slate-600 font-medium outline-none border border-transparent focus:border-slate-950/20 focus:bg-white transition-all shadow-inner resize-none italic"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-900 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 shadow-xl"
              >
                {loading ? 'Transmitting...' : success ? (
                  <>
                    <CheckCircle2 size={18} />
                    Sync Successful
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update Matrix
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
