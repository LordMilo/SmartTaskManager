import React, { useState } from 'react';
import { Priority, Routine, Status, Task, Language, Member } from '../types';
import { generateId, TRANSLATIONS } from '../utils';
import { GlassCard } from './GlassCard';
import { Play, Droplets, Scissors, Sprout, Sun, Plus, Pencil, Trash2, X, Save, Flag, AlertTriangle } from 'lucide-react';

interface RoutineManagerProps {
  routines: Routine[];
  onActivate: (task: Task, routineId: string) => void;
  onAddRoutine: (routine: Routine) => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (id: string) => void;
  lang: Language;
  currentUser: Member;
  hiddenRoutineIds: string[];
}

export const RoutineManager: React.FC<RoutineManagerProps> = ({ 
  routines, onActivate, onAddRoutine, onEditRoutine, onDeleteRoutine, lang, currentUser, hiddenRoutineIds
}) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  
  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const isAdmin = currentUser.isAdmin;

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);

  const handleOpenModal = (routine?: Routine) => {
    if (routine) {
      setEditingRoutine(routine);
      setTitle(routine.title);
      setDesc(routine.description);
      setPriority(routine.defaultPriority);
    } else {
      setEditingRoutine(null);
      setTitle('');
      setDesc('');
      setPriority(Priority.NORMAL);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoutine(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRoutine) {
      // Edit
      const updatedRoutine: Routine = {
        ...editingRoutine,
        title,
        description: desc,
        defaultPriority: priority,
      };
      onEditRoutine(updatedRoutine);
    } else {
      // Add
      const newRoutine: Routine = {
        id: generateId(),
        title,
        description: desc,
        defaultPriority: priority,
      };
      onAddRoutine(newRoutine);
    }
    handleCloseModal();
  };

  // Trigger Delete Modal
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  // Confirm Delete Action
  const confirmDelete = () => {
    if (deleteId) {
      onDeleteRoutine(deleteId);
      setDeleteId(null);
    }
  };

  const handleActivate = (routine: Routine) => {
    // Use local date string creation to avoid UTC midnight shifting issues
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const task: Task = {
      id: generateId(),
      title: routine.title,
      description: routine.description,
      priority: routine.defaultPriority,
      status: Status.TODO,
      dueDate: todayStr,
      attachments: [],
    };
    onActivate(task, routine.id);
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('water')) return <Droplets className="text-blue-500 dark:text-blue-400" />;
    if (t.includes('prune') || t.includes('trim')) return <Scissors className="text-orange-500 dark:text-orange-400" />;
    if (t.includes('plant')) return <Sprout className="text-emerald-500 dark:text-emerald-400" />;
    return <Sun className="text-yellow-500 dark:text-yellow-400" />;
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto pb-28 pt-2 px-1 animate-fade-in relative">
         <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t.routineLibrary}</h2>
          <p className="text-stone-500 dark:text-stone-400">{t.routineSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Add New Routine Button (Admin Only) */}
          {isAdmin && (
            <button 
              onClick={() => handleOpenModal()}
              className="group relative h-full min-h-[160px] rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white/20 dark:bg-stone-900/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 flex flex-col items-center justify-center gap-2 transition-all duration-300"
            >
              <div className="p-3 rounded-full bg-stone-200 dark:bg-stone-800 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-medium text-stone-600 dark:text-stone-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{t.addRoutine}</span>
            </button>
          )}

          {routines.map(routine => {
            // Hide if routine has been started today
            if (hiddenRoutineIds.includes(routine.id)) return null;

            return (
              <GlassCard key={routine.id} className="relative overflow-hidden group" hoverEffect>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                  {React.cloneElement(getIcon(routine.title) as React.ReactElement<any>, { size: 64 })}
                </div>
                
                {/* Action Buttons (Admin Only) - Improved Click Area and Z-Index */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 z-30 opacity-80 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(routine); }}
                      className="p-2 rounded-full bg-white/90 dark:bg-stone-800/90 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-sm transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(routine.id); }}
                      className="p-2 rounded-full bg-white/90 dark:bg-stone-800/90 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 shadow-sm transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/60 dark:bg-stone-800/80 rounded-xl shadow-sm">
                      {getIcon(routine.title)}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-100 pr-12">{routine.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        routine.defaultPriority === Priority.URGENT 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' 
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {t[routine.defaultPriority as keyof typeof t]}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">{routine.description}</p>

                <button 
                  onClick={() => handleActivate(routine)}
                  className="mt-4 w-full py-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-300 dark:shadow-stone-900"
                >
                  <Play size={14} fill="currentColor" /> {t.startRoutine}
                </button>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Routine Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/20 dark:bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          
          <div className="relative w-full max-w-md bg-white/90 dark:bg-stone-900/95 backdrop-blur-xl border border-white dark:border-stone-700 rounded-2xl shadow-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                {editingRoutine ? t.editRoutine : t.addRoutine}
              </h2>
              <button onClick={handleCloseModal} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">{t.routineTitle}</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="..."
                  className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">{t.description}</label>
                <textarea 
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  rows={3}
                  placeholder="..."
                  className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase flex items-center gap-1">
                  <Flag size={12} /> {t.priority}
                </label>
                <select 
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none"
                >
                  <option value={Priority.NORMAL}>{t.NORMAL}</option>
                  <option value={Priority.MEDIUM}>{t.MEDIUM}</option>
                  <option value={Priority.URGENT}>{t.URGENT}</option>
                </select>
              </div>

              <div className="flex gap-2 mt-6 pt-2">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 dark:bg-black/70 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-2xl p-6 animate-slide-up">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">{t.deleteRoutine}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                   {t.confirmDeleteRoutine}
                </p>
              </div>
              <div className="flex w-full gap-2 mt-2">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30"
                >
                  {t.deleteRoutine || "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};