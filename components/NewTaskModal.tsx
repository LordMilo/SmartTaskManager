import React, { useState, useRef } from 'react';
import { Member, Priority, Status, Task, Language, Attachment } from '../types';
import { generateId, TRANSLATIONS } from '../utils';
import { X, Calendar, User, Flag, Type, Paperclip, Camera } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  members: Member[];
  lang: Language;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onSave, members, lang }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [assigneeId, setAssigneeId] = useState<string>('');
  
  // Use local date string initialization
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  // File state
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Process initial attachments
    const newAttachments: Attachment[] = files.map(file => ({
      id: generateId(),
      type: file.type.startsWith('video') ? 'video' : 'image',
      url: URL.createObjectURL(file),
      name: file.name,
      createdAt: new Date().toISOString(),
    }));

    const newTask: Task = {
      id: generateId(),
      title,
      description: desc,
      priority,
      status: Status.TODO,
      assigneeId: assigneeId || undefined,
      dueDate,
      attachments: newAttachments,
    };
    onSave(newTask);
    
    // Reset form
    setTitle('');
    setDesc('');
    setPriority(Priority.NORMAL);
    setAssigneeId('');
    setFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/20 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white/80 dark:bg-stone-900/90 backdrop-blur-xl border border-white dark:border-stone-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">{t.newTask}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <X size={20} className="text-stone-500 dark:text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Type size={12} /> {t.taskName}
            </label>
            <input 
              required
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="..."
              className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t.description}</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="..."
              className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
                 <Calendar size={12} /> {t.dueDate}
              </label>
              <input 
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
               <User size={12} /> {t.assignTo}
            </label>
            <select 
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:border-emerald-500 outline-none"
            >
              <option value="">-- {t.unassigned} --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          {/* Add Attachments Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
               <Paperclip size={12} /> {t.attachments}
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="cursor-pointer border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl p-4 flex flex-col items-center justify-center text-stone-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
            >
                <Camera size={24} className="mb-1" />
                <span className="text-xs font-medium">{t.addMedia}</span>
            </div>
            <input 
               type="file" 
               multiple 
               accept="image/*,video/*"
               ref={fileInputRef}
               className="hidden"
               onChange={handleFileChange}
            />
            
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                 {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                       <span className="truncate max-w-[150px]">{f.name}</span>
                       <button 
                         type="button" 
                         onClick={() => removeFile(i)}
                         className="hover:text-red-500 transition-colors"
                       >
                         <X size={14} />
                       </button>
                    </div>
                 ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {t.createTask}
          </button>
        </form>
      </div>
    </div>
  );
};