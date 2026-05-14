import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { X, Mail, Phone, Building2, User as UserIcon, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, isOpen, onClose }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg bg-white border border-slate-100 rounded-[40px] shadow-2xl overflow-hidden pointer-events-auto">
              <div className="relative p-8 sm:p-12">
                <button 
                  onClick={onClose}
                  className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 transition-all transform active:scale-90"
                >
                  <X size={20} />
                </button>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="h-12 w-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Decrypting Profile</p>
                  </div>
                ) : userProfile ? (
                  <div className="space-y-10">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-slate-100 p-1">
                          <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl font-black border-4 border-white">
                            {userProfile.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white">
                          <ShieldCheck size={16} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{userProfile.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mt-1">
                          {userProfile.role === 'organization' ? 'System Issuer' : 'Consortium Bidder'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <ProfileField 
                        icon={<Mail size={16} />} 
                        label="Comms Channel" 
                        value={userProfile.contactEmail || userProfile.email} 
                      />
                      {userProfile.phoneNumber && (
                        <ProfileField 
                          icon={<Phone size={16} />} 
                          label="Secure Line" 
                          value={userProfile.phoneNumber} 
                        />
                      )}
                      {userProfile.organizationName && (
                        <ProfileField 
                          icon={<Building2 size={16} />} 
                          label="Affiliation" 
                          value={userProfile.organizationName} 
                        />
                      )}
                    </div>

                    {userProfile.description && (
                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Mission Directive</p>
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                          "{userProfile.description}"
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                      <button 
                        onClick={onClose}
                        className="px-10 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-800 active:scale-95 shadow-lg"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-20">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Profile Redacted</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ProfileField: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-all shadow-inner">
    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);
