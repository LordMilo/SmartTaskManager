import React, { useState } from 'react';
import { Member, Language } from '../types';
import { GlassCard } from './GlassCard';
import { Trash2, UserPlus, Shield, Phone, Lock } from 'lucide-react';
import { generateId, TRANSLATIONS } from '../utils';

interface TeamManagerProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onRemoveMember: (id: string) => void;
  lang: Language;
  currentUser: Member;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ members, onAddMember, onRemoveMember, lang, currentUser }) => {
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Gardener');
  const t = TRANSLATIONS[lang];
  
  const isAdmin = currentUser.isAdmin;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddMember({
      id: generateId(),
      name: newName,
      role: newRole,
      phoneNumber: newPhone,
      avatar: `https://picsum.photos/seed/${Math.random()}/200/200`
    });
    setNewName('');
    setNewPhone('');
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto space-y-6 pb-28 pt-4 px-1 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t.gardenCrew}</h2>
          <p className="text-stone-500 dark:text-stone-400">{t.manageTeam}</p>
        </div>

        {isAdmin ? (
          <GlassCard className="mb-6">
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-2 items-end">
              <div className="w-full space-y-1">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">{t.name}</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none"
                  placeholder="..."
                />
              </div>
              <div className="w-full md:w-1/3 space-y-1">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">{t.phoneNumber}</label>
                <input 
                  type="text" 
                  value={newPhone} 
                  onChange={e => setNewPhone(e.target.value)} 
                  className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none"
                  placeholder="0XX..."
                />
              </div>
              <div className="w-full md:w-1/3 space-y-1">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">{t.role}</label>
                <select 
                  value={newRole} 
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none"
                >
                  <option>Head Gardener</option>
                  <option>Gardener</option>
                  <option>Botanist</option>
                  <option>Laborer</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full md:w-auto px-4 py-2 h-[42px] bg-stone-800 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus size={18} /> {t.add}
              </button>
            </form>
          </GlassCard>
        ) : (
          <div className="mb-6 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/50 dark:bg-stone-900/50 text-center text-stone-500 text-sm flex items-center justify-center gap-2">
            <Lock size={14} /> {t.adminOnly}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map(member => (
            <GlassCard key={member.id} className="flex items-center justify-between group" hoverEffect>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full border-2 border-white dark:border-stone-600 shadow-sm object-cover" />
                  {member.isAdmin && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-stone-900 p-0.5 rounded-full border border-white">
                      <Shield size={10} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 dark:text-stone-100">{member.name}</h3>
                  <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                      <Shield size={10} /> {member.role}
                      </div>
                      {member.phoneNumber && (
                          <div className="flex items-center gap-1 text-[10px] text-stone-400">
                          <Phone size={8} /> {member.phoneNumber}
                          </div>
                      )}
                  </div>
                </div>
              </div>
              {isAdmin && member.id !== currentUser.id && (
                <button 
                  onClick={() => onRemoveMember(member.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};