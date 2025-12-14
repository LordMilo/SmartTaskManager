import React, { useRef, useState } from 'react';
import { Task, Member, Status, Language } from '../types';
import { GlassCard } from './GlassCard';
import { getPriorityColor, formatDate, TRANSLATIONS } from '../utils';
import { Calendar, User, Camera, CheckCircle, ChevronRight, Volume2, Square, Loader2, Paperclip, Play } from 'lucide-react';
import { ttsService } from '../services/ttsService';

interface TaskCardProps {
  task: Task;
  members: Member[];
  onMove: (taskId: string, newStatus: Status) => void;
  onAttachProof: (taskId: string, file: File) => void;
  onClick: (task: Task) => void;
  useGDrive?: boolean;
  lang: Language;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, members, onMove, onAttachProof, onClick, useGDrive, lang }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assignee = members.find(m => m.id === task.assigneeId);
  const t = TRANSLATIONS[lang];

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Calculate effective attachment count (handling legacy photoProof)
  const attachmentCount = task.attachments.length > 0 
    ? task.attachments.length 
    : (task.photoProof ? 1 : 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAttachProof(task.id, e.target.files[0]);
    }
  };

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      // Construct text to speak
      const textToSpeak = `${task.title}. ${task.description || ''}. ${t.priority} ${t[task.priority]}.`;
      
      // Pass callback to set isSpeaking to false when audio finishes
      await ttsService.speak(textToSpeak, () => setIsSpeaking(false));
      
      setIsSpeaking(true);
    } catch (error) {
      console.error("Failed to speak", error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const isDoing = task.status === Status.DOING;
  const isTodo = task.status === Status.TODO;

  return (
    <GlassCard 
      className={`mb-4 animate-slide-up group relative overflow-hidden cursor-pointer ${isDoing ? 'border-l-4 border-l-blue-500' : ''}`}
      hoverEffect
      onClick={() => onClick(task)}
    >
      {/* Priority Badge */}
      <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
        {t[task.priority]}
      </div>

      <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-1 pr-16">{task.title}</h3>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-3 line-clamp-2">{task.description || "..."}</p>

      {/* Special "Doing By" Section for Tasks In Progress */}
      {isDoing && assignee && (
        <div className="mb-3 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2 border border-blue-100 dark:border-blue-900/30">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{t.doingBy}:</span>
          <div className="flex items-center gap-1">
             <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full object-cover border border-white" />
             <span className="text-xs text-stone-700 dark:text-stone-200 font-medium">{assignee.name}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>{t.due}: {formatDate(task.dueDate, lang)}</span>
        </div>
        
        {/* Standard Assignee Display */}
        {!isDoing && (
          <div className="flex items-center gap-2">
            <User size={14} className="text-emerald-600 dark:text-emerald-400" />
            <div className="flex items-center gap-1">
              {assignee ? (
                <>
                   <img src={assignee.avatar} alt={assignee.name} className="w-4 h-4 rounded-full object-cover" />
                   <span>{assignee.name}</span>
                </>
              ) : (
                <span className="italic text-stone-400 dark:text-stone-500">{t.unassigned}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-stone-200/30 dark:border-stone-700/50 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
           {/* Attachment Button - Hidden in TODO status */}
           {!isTodo && (
             <button 
               onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
               className={`p-1.5 rounded-full transition-colors flex items-center gap-1 ${attachmentCount > 0 ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400'}`}
               title={t.addMedia}
             >
               {attachmentCount > 0 ? <Paperclip size={16} /> : <Camera size={16} />}
               
               {attachmentCount > 0 && <span className="text-[10px] font-bold">{attachmentCount}</span>}
               {attachmentCount === 0 && <span className="text-[10px] font-medium hidden sm:inline">{t.addMedia}</span>}
               
               <input 
                 type="file" 
                 accept="image/*,video/*" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleFileChange}
               />
             </button>
           )}

           {/* TTS Button */}
           <button 
             onClick={handleSpeak}
             disabled={isLoadingAudio}
             className={`p-1.5 rounded-full transition-colors flex items-center gap-1 ${
                isSpeaking || isLoadingAudio
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                  : 'hover:bg-amber-100/50 dark:hover:bg-amber-900/20 text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400'
             }`}
             title={isSpeaking ? t.stopReading : t.readAloud}
           >
             {isLoadingAudio ? <Loader2 size={16} className="animate-spin" /> : isSpeaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
           </button>
        </div>

        <div className="flex gap-1">
          {/* Back Button */}
          {task.status !== Status.TODO && (
             <button 
             onClick={(e) => { e.stopPropagation(); onMove(task.id, task.status === Status.DONE ? Status.DOING : Status.TODO); }}
             className="text-xs px-2 py-1 bg-stone-100/50 dark:bg-stone-800/50 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 text-stone-700 dark:text-stone-300 rounded-md border border-stone-200 dark:border-stone-600 transition-colors"
           >
             {t.back}
           </button>
          )}

          {/* Accept Button for TODO */}
          {task.status === Status.TODO && (
            <button 
              onClick={(e) => { e.stopPropagation(); onMove(task.id, Status.DOING); }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md shadow-sm transition-colors font-bold"
            >
              <Play size={12} fill="currentColor" /> {t.accept}
            </button>
          )}
          
          {/* Next Button for DOING */}
          {task.status === Status.DOING && (
            <button 
              onClick={(e) => { e.stopPropagation(); onMove(task.id, Status.DONE); }}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100/50 dark:bg-emerald-900/30 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/30 text-emerald-800 dark:text-emerald-200 rounded-md border border-emerald-200 dark:border-emerald-700 transition-colors font-medium"
            >
              {t.next} <ChevronRight size={12} />
            </button>
          )}

          {/* Done Indicator */}
          {task.status === Status.DONE && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1">
              <CheckCircle size={14} /> {t.done}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
};