import React, { useState } from 'react';
import { Task, Member, Status, Language } from '../types';
import { TaskCard } from './TaskCard';
import { ClipboardList, Loader2, CheckSquare, History, Calendar, Filter } from 'lucide-react';
import { TRANSLATIONS, isSameDay } from '../utils';

interface KanbanBoardProps {
  tasks: Task[];
  members: Member[];
  onMoveTask: (id: string, status: Status) => void;
  onAttachProof: (id: string, file: File) => void;
  onTaskClick: (task: Task) => void;
  useGDrive: boolean;
  lang: Language;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, members, onMoveTask, onAttachProof, onTaskClick, useGDrive, lang }) => {
  // Use a string to handle both Status enum and 'HISTORY'
  const [activeTab, setActiveTab] = useState<string>(Status.TODO);
  
  // History Filters
  const [historyFilterType, setHistoryFilterType] = useState<'daily' | 'monthly'>('daily');
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [historyMonth, setHistoryMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const t = TRANSLATIONS[lang];
  const today = new Date();

  const tabs = [
    { id: Status.TODO, label: t.todo, icon: ClipboardList, color: 'text-stone-600 dark:text-stone-400' },
    { id: Status.DOING, label: t.doing, icon: Loader2, color: 'text-blue-600 dark:text-blue-400' },
    { id: Status.DONE, label: t.done, icon: CheckSquare, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'HISTORY', label: t.history, icon: History, color: 'text-purple-600 dark:text-purple-400' },
  ];

  // MAIN BOARD LOGIC: Only show tasks for TODAY
  const todaysTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), today));
  
  // HISTORY LOGIC
  const completedHistoryTasks = tasks.filter(t => {
     if (t.status !== Status.DONE) return false;

     const taskDate = new Date(t.dueDate);
     if (historyFilterType === 'daily') {
        return isSameDay(taskDate, new Date(historyDate));
     } else {
        // Monthly
        const selectedDate = new Date(historyMonth + '-01');
        return taskDate.getMonth() === selectedDate.getMonth() && 
               taskDate.getFullYear() === selectedDate.getFullYear();
     }
  });

  const getFilteredTasks = () => {
    if (activeTab === 'HISTORY') return completedHistoryTasks;
    return todaysTasks.filter(t => t.status === activeTab);
  };

  const currentTasks = getFilteredTasks();
  const isHistoryMode = activeTab === 'HISTORY';

  return (
    <div className="flex h-full gap-3 pb-4 relative">
      {/* Side Tabs Navigation - Reduced Width */}
      <div className="w-16 md:w-32 flex flex-col gap-2 py-2 shrink-0 transition-all duration-300">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          // Count logic: Show today's count for status tabs, show total filtered for history
          const count = tab.id === 'HISTORY' 
            ? completedHistoryTasks.length 
            : todaysTasks.filter(t => t.status === tab.id).length;
            
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex flex-col md:flex-row items-center md:gap-2 p-2 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-white/60 dark:bg-stone-800/60 shadow-md border border-white/50 dark:border-stone-700' 
                  : 'hover:bg-white/30 dark:hover:bg-stone-800/30 border border-transparent'}
              `}
            >
              <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-transparent'} ${tab.color}`}>
                <Icon size={18} className={tab.id === Status.DOING && isActive ? 'animate-spin-slow' : ''} />
              </div>
              
              <div className="flex flex-col items-center md:items-start w-full overflow-hidden">
                <span className={`text-[9px] md:text-xs font-bold truncate w-full text-center md:text-left ${isActive ? 'text-stone-800 dark:text-stone-100' : 'text-stone-500 dark:text-stone-500'}`}>
                  {tab.label}
                </span>
                <span className={`text-[9px] px-1.5 rounded-full mt-0.5 md:mt-0 transition-colors ${isActive ? 'bg-emerald-500 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>
                  {count}
                </span>
              </div>
              
              {isActive && (
                <div className="absolute left-0 md:left-auto md:right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full md:rounded-l-full md:rounded-r-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar relative">
          <div className="space-y-4">
            {/* Header / Filter Bar */}
            <div className="sticky top-0 z-10 p-3 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/5 shadow-sm space-y-3">
               <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                   {tabs.find(t => t.id === activeTab)?.label}
                 </h2>
                 {!isHistoryMode && (
                   <>
                    <div className="h-1 w-1 rounded-full bg-stone-400"></div>
                    <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">
                      {t.todaysTasks}
                    </span>
                   </>
                 )}
               </div>

               {/* History Filters - Only show when History tab is active */}
               {isHistoryMode && (
                 <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white/40 dark:bg-stone-900/40 p-2 rounded-lg border border-stone-200/50 dark:border-stone-800/50 animate-slide-up">
                    <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-lg shrink-0">
                      <button 
                        onClick={() => setHistoryFilterType('daily')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${historyFilterType === 'daily' ? 'bg-white dark:bg-stone-600 shadow-sm text-stone-800 dark:text-stone-100' : 'text-stone-500'}`}
                      >
                        {t.daily}
                      </button>
                      <button 
                        onClick={() => setHistoryFilterType('monthly')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${historyFilterType === 'monthly' ? 'bg-white dark:bg-stone-600 shadow-sm text-stone-800 dark:text-stone-100' : 'text-stone-500'}`}
                      >
                        {t.monthly}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                      <Calendar size={16} className="text-stone-400" />
                      {historyFilterType === 'daily' ? (
                        <input 
                          type="date" 
                          value={historyDate}
                          onChange={(e) => setHistoryDate(e.target.value)}
                          className="w-full sm:w-auto flex-1 px-3 py-1 rounded-lg bg-white/80 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm outline-none focus:border-emerald-500"
                        />
                      ) : (
                        <input 
                          type="month" 
                          value={historyMonth}
                          onChange={(e) => setHistoryMonth(e.target.value)}
                          className="w-full sm:w-auto flex-1 px-3 py-1 rounded-lg bg-white/80 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm outline-none focus:border-emerald-500"
                        />
                      )}
                    </div>
                 </div>
               )}
            </div>

            {/* Task List */}
            {currentTasks.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-white/5 dark:bg-white/5 animate-fade-in">
                {isHistoryMode ? (
                   <Filter size={32} className="mb-2 opacity-50" />
                ) : (
                   <div className="text-4xl mb-2">🍃</div>
                )}
                <p className="text-lg font-medium">{isHistoryMode ? t.noTasksInList : t.allClear}</p>
                {!isHistoryMode && <p className="text-sm opacity-70">{t.noTasksInList}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
                 {currentTasks.map(task => (
                  <div key={task.id} className={isHistoryMode ? 'opacity-90 hover:opacity-100 transition-opacity' : ''}>
                    <TaskCard 
                      task={task} 
                      members={members} 
                      onMove={isHistoryMode ? () => {} : onMoveTask} // Disable moving in history mode
                      onAttachProof={isHistoryMode ? () => {} : onAttachProof}
                      onClick={onTaskClick}
                      useGDrive={useGDrive}
                      lang={lang}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};