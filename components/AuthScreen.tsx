import React, { useState } from 'react';
import { Member, Language } from '../types';
import { TRANSLATIONS, generateId } from '../utils';
import { Phone, User, LogIn, Sprout } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface AuthScreenProps {
  onLogin: (member: Member) => void;
  existingMembers: Member[];
  lang: Language;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, existingMembers, lang }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const t = TRANSLATIONS[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError(t.phoneRequired);
      return;
    }

    // Check if user exists
    const existingUser = existingMembers.find(m => m.phoneNumber === phone);

    if (existingUser) {
      // Login existing
      onLogin(existingUser);
    } else {
      // Register new
      if (!name.trim()) {
         setError('Name is required for new registration');
         return;
      }

      const isAdmin = phone === '9999'; // Demo Admin Logic

      const newUser: Member = {
        id: generateId(),
        name: name,
        phoneNumber: phone,
        role: isAdmin ? 'Head Gardener' : 'Gardener',
        avatar: `https://picsum.photos/seed/${phone}/200/200`,
        isAdmin: isAdmin
      };
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-stone-900 dark:to-emerald-950 -z-20" />
       <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/30 rounded-full blur-[100px] animate-blob -z-10" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-lime-400/30 rounded-full blur-[100px] animate-blob animation-delay-2000 -z-10" />

       <GlassCard className="w-full max-w-md p-8 animate-slide-up border-white/50 dark:border-stone-700">
         <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-2xl shadow-lg flex items-center justify-center text-white mb-4">
              <Sprout size={32} />
           </div>
           <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Smart Task <span className="text-emerald-600 dark:text-emerald-400">Manager</span></h1>
           <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{t.loginSubtitle}</p>
         </div>

         <form onSubmit={handleLogin} className="space-y-4">
           <div className="space-y-1">
             <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase flex items-center gap-1">
               <User size={12} /> {t.name}
             </label>
             <input 
               type="text" 
               value={name}
               onChange={e => setName(e.target.value)}
               className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none transition-all"
               placeholder="John Doe"
             />
           </div>

           <div className="space-y-1">
             <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase flex items-center gap-1">
               <Phone size={12} /> {t.phoneNumber}
             </label>
             <input 
               type="tel" 
               value={phone}
               onChange={e => setPhone(e.target.value)}
               className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none transition-all"
               placeholder="081-XXX-XXXX"
             />
             <p className="text-[10px] text-stone-400 dark:text-stone-500 text-right">{t.adminNote}</p>
           </div>

           {error && <p className="text-red-500 text-xs text-center">{error}</p>}

           <button 
             type="submit" 
             className="w-full py-3 bg-stone-800 dark:bg-stone-700 text-white font-bold rounded-xl hover:bg-stone-700 dark:hover:bg-stone-600 shadow-lg shadow-stone-400/50 dark:shadow-black/50 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4"
           >
             <LogIn size={18} /> {t.login}
           </button>
         </form>
       </GlassCard>
    </div>
  );
};