import React from 'react';
import { ViewState, Language } from '../types';
import { LayoutDashboard, CalendarDays, Users, ListChecks, Plus } from 'lucide-react';
import { TRANSLATIONS } from '../utils';

interface NavigationProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onAddTask: () => void;
  lang: Language;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView, onAddTask, lang }) => {
  const t = TRANSLATIONS[lang];

  const NavButton = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`
        flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 w-16
        ${currentView === view 
          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-inner' 
          : 'text-stone-500 dark:text-stone-400 hover:bg-white/30 dark:hover:bg-white/10 hover:text-stone-700 dark:hover:text-stone-200'}
      `}
    >
      <Icon size={24} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 flex justify-center pointer-events-none">
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-white/50 dark:border-stone-700/50 shadow-2xl dark:shadow-black/50 rounded-2xl flex items-center p-2 gap-1 pointer-events-auto">
        <NavButton view="KANBAN" icon={LayoutDashboard} label={t.board} />
        <NavButton view="CALENDAR" icon={CalendarDays} label={t.calendar} />
        
        {/* Floating Action Button (Center) */}
        <div className="relative -top-8 mx-2">
          <button 
            onClick={onAddTask}
            className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-lime-500 dark:from-emerald-600 dark:to-lime-600 rounded-full shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/50 text-white flex items-center justify-center hover:scale-110 transition-transform duration-200"
          >
            <Plus size={32} />
          </button>
        </div>

        <NavButton view="ROUTINES" icon={ListChecks} label={t.routines} />
        <NavButton view="TEAM" icon={Users} label={t.team} />
      </div>
    </div>
  );
};