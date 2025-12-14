import React from 'react';
import { Task, Status, Language } from '../types';
import { isSameDay, getPriorityColor, TRANSLATIONS, formatDate } from '../utils';
import { GlassCard } from './GlassCard';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  lang: Language;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, lang }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const t = TRANSLATIONS[lang];

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Calendar headers
  const daysEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysTH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const dayHeaders = lang === 'th' ? daysTH : daysEN;

  // Calculate overdue tasks (Status not DONE and due date < today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return task.status !== Status.DONE && dueDate < today;
  });

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    // Padding for prev month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-24 bg-stone-50/30 dark:bg-stone-900/30 border border-stone-100/50 dark:border-stone-800/50"></div>);
    }

    // Days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), date));
      const isToday = isSameDay(date, new Date());

      days.push(
        <div key={`day-${i}`} className={`min-h-[6rem] p-1 border border-stone-200/40 dark:border-stone-800/40 bg-white/30 dark:bg-stone-900/30 backdrop-blur-sm relative transition-colors hover:bg-white/60 dark:hover:bg-stone-800/60 ${isToday ? 'bg-emerald-50/50 dark:bg-emerald-900/20 ring-1 ring-emerald-400 inset-0' : ''}`}>
          <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-500 text-white' : 'text-stone-600 dark:text-stone-400'}`}>
            {i}
          </div>
          <div className="flex flex-col gap-1 overflow-hidden">
            {dayTasks.map(task => (
              <div 
                key={task.id} 
                className={`text-[10px] px-1 py-0.5 rounded truncate border-l-2 ${
                    task.status === Status.DONE ? 'opacity-50 line-through' : ''
                } ${getPriorityColor(task.priority)}`}
                title={task.title}
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar pb-24">
      <div className="flex-none pt-4 px-2 mb-4 animate-fade-in">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {currentDate.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white/50 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-600 dark:text-stone-300"><ChevronLeft /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/50 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-600 dark:text-stone-300"><ChevronRight /></button>
            </div>
        </div>

        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm bg-stone-200 dark:bg-stone-800">
            {dayHeaders.map(d => (
            <div key={d} className="bg-white/80 dark:bg-stone-900 p-2 text-center text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                {d}
            </div>
            ))}
            {renderDays()}
        </div>
      </div>

      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <div className="px-2 pb-4 animate-slide-up">
           <div className="flex items-center gap-2 mb-3 mt-4">
              <AlertCircle size={20} className="text-red-500" />
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">{t.overdue} ({overdueTasks.length})</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {overdueTasks.map(task => (
                <div key={task.id} className="bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-3 flex items-start justify-between">
                   <div>
                      <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100">{task.title}</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t.due}: {formatDate(task.dueDate, lang)}</p>
                   </div>
                   <div className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {t[task.priority]}
                   </div>
                </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};