import React, { useRef, useState, useEffect } from 'react';
import { Task, Member, Language, Attachment, Status } from '../types';
import { X, Calendar, User, Flag, Paperclip, Cloud, PlayCircle, Volume2, Square, Loader2, Download, Maximize2, CheckCircle2, RotateCcw, Play, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { TRANSLATIONS, formatDate, formatDateTime, getPriorityColor } from '../utils';
import { ttsService } from '../services/ttsService';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  members: Member[];
  onAttach: (taskId: string, file: File) => void;
  onMove: (taskId: string, status: Status) => void;
  useGDrive: boolean;
  lang: Language;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, onClose, task, members, onAttach, onMove, useGDrive, lang 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // State for Lightbox viewing
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset states when modal closes or task changes
  useEffect(() => {
    if (!isOpen) {
      ttsService.stop();
      setIsSpeaking(false);
      setIsLoadingAudio(false);
      setPreviewAttachment(null);
    }
  }, [isOpen]);

  // Reset zoom when attachment changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [previewAttachment]);

  if (!isOpen || !task) return null;

  const assignee = members.find(m => m.id === task.assigneeId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAttach(task.id, e.target.files[0]);
    }
  };

  const handleStatusChange = (newStatus: Status) => {
    onMove(task.id, newStatus);
    // Close modal immediately after accepting (Moving to DOING)
    if (newStatus === Status.DOING) {
        onClose();
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      const assigneeName = assignee ? assignee.name : t.unassigned;
      const textToSpeak = `${t.taskName}: ${task.title}. ${t.description}: ${task.description || t.noTasks}. ${t.assignTo} ${assigneeName}. ${t.dueDate} ${formatDate(task.dueDate, lang)}.`;
      
      await ttsService.speak(textToSpeak, () => setIsSpeaking(false));
      setIsSpeaking(true);
    } catch (error) {
      console.error("Failed to speak details", error);
      alert(`TTS Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Zoom Logic
  const handleWheel = (e: React.WheelEvent) => {
    if (previewAttachment?.type === 'image') {
      e.stopPropagation();
      const delta = -Math.sign(e.deltaY) * 0.25;
      setZoom(prev => {
          const next = Math.max(1, Math.min(prev + delta, 5)); // Max zoom 5x
          if (next === 1) setPan({x:0, y:0});
          return next;
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      if (zoom > 1) {
          setIsDragging(true);
          dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.preventDefault();
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (isDragging && zoom > 1) {
          setPan({
              x: e.clientX - dragStartRef.current.x,
              y: e.clientY - dragStartRef.current.y
          });
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/40 dark:bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-stone-900/95 backdrop-blur-xl border border-white dark:border-stone-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                {t[task.priority]}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                {t[task.status.toLowerCase() as keyof typeof t]}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 leading-tight">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <X size={24} className="text-stone-500 dark:text-stone-400" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* TTS Button Row */}
          <div className="flex justify-end mb-4">
             <button
               onClick={handleSpeak}
               disabled={isLoadingAudio}
               className={`
                 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm
                 ${isSpeaking || isLoadingAudio
                   ? 'bg-amber-500 text-white shadow-amber-200 dark:shadow-amber-900/20' 
                   : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'}
               `}
             >
               {isLoadingAudio ? <Loader2 size={16} className="animate-spin" /> : isSpeaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
               {isLoadingAudio ? t.loadingAudio : (isSpeaking ? t.stopReading : t.readAloud)}
             </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="bg-stone-50 dark:bg-stone-950/50 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.description}</h3>
                <p className="text-stone-700 dark:text-stone-300 text-sm whitespace-pre-wrap">
                  {task.description || "-"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs text-stone-500">{t.assignTo}</p>
                  <div className="flex items-center gap-2">
                    {assignee && <img src={assignee.avatar} className="w-5 h-5 rounded-full" alt="" />}
                    <span className="font-medium text-stone-800 dark:text-stone-200">{assignee?.name || t.unassigned}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-stone-500">{t.dueDate}</p>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{formatDate(task.dueDate, lang)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="mb-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                 <Paperclip size={16} /> {t.attachments} ({task.attachments.length})
               </h3>
               
               {/* Hide Add Media button if status is TODO */}
               {task.status !== Status.TODO && (
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="text-xs flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
                 >
                   {t.addMedia}
                 </button>
               )}

               <input 
                  type="file" 
                  accept="image/*,video/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                />
             </div>

             {task.attachments.length === 0 ? (
               <div className="h-32 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl flex flex-col items-center justify-center text-stone-400 gap-2">
                 <Paperclip size={24} className="opacity-50" />
                 <span className="text-sm">{t.noAttachments}</span>
               </div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {task.attachments.map((att) => (
                   <div 
                      key={att.id} 
                      onClick={() => setPreviewAttachment(att)}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 cursor-pointer"
                   >
                     {att.type === 'video' ? (
                        <video 
                          src={att.url} 
                          className="w-full h-full object-cover" 
                          muted 
                          playsInline
                        />
                     ) : (
                        <img src={att.url} alt="attachment" className="w-full h-full object-cover" />
                     )}
                     
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                       <p className="text-[10px] text-white/80 truncate">{formatDateTime(att.createdAt, lang)}</p>
                       {useGDrive && (
                         <div className="absolute top-2 right-2 bg-blue-500/80 p-1 rounded-md">
                           <Cloud size={10} className="text-white" />
                         </div>
                       )}
                       {/* Center Icon Overlay */}
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         {att.type === 'video' ? (
                            <PlayCircle size={32} className="text-white/90 drop-shadow-md" />
                         ) : (
                            <Maximize2 size={24} className="text-white/90 drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 backdrop-blur-sm">
           {task.status === Status.TODO && (
              <button 
                onClick={() => handleStatusChange(Status.DOING)}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                <Play size={18} fill="currentColor" /> {t.accept}
              </button>
           )}
           
           {task.status === Status.DONE && (
              <button 
                onClick={() => handleStatusChange(Status.TODO)}
                className="w-full py-3 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-sm hover:bg-stone-300 dark:hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} /> {t.markAsTodo || "Reopen"}
              </button>
           )}
        </div>
      </div>

      {/* Lightbox Viewer Overlay (Full Screen) */}
      {previewAttachment && (
        <div 
           className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" 
           onClick={() => setPreviewAttachment(null)} 
        >
           {/* Close Button */}
           <button 
             onClick={() => setPreviewAttachment(null)}
             className="absolute top-4 right-4 z-[130] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm shadow-lg"
           >
             <X size={28} />
           </button>

           <div 
             className="relative w-full h-full flex items-center justify-center pointer-events-auto overflow-hidden" 
             onClick={(e) => e.stopPropagation()} 
             onWheel={handleWheel}
           >
              {/* Image/Video Container */}
              <div className="w-full h-full flex items-center justify-center">
                {previewAttachment.type === 'video' ? (
                   <video 
                     src={previewAttachment.url} 
                     controls 
                     autoPlay 
                     className="w-full h-full object-contain"
                   />
                ) : (
                   <div 
                     className="w-full h-full flex items-center justify-center"
                     style={{ cursor: zoom > 1 ? 'grab' : 'default', touchAction: 'none' }}
                     onPointerDown={handlePointerDown}
                     onPointerMove={handlePointerMove}
                     onPointerUp={handlePointerUp}
                     onPointerLeave={handlePointerUp}
                   >
                     <img 
                       src={previewAttachment.url} 
                       alt="Preview" 
                       className="w-full h-full object-contain transition-transform duration-100 ease-out will-change-transform select-none"
                       style={{ 
                         transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` 
                       }}
                       draggable={false}
                     />
                   </div>
                )}
              </div>
              
              {/* Controls and Info Overlay - Positioned at bottom */}
              <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 z-[120] pointer-events-none">
                 <div className="pointer-events-auto flex flex-col items-center gap-4">
                     {/* Zoom Controls (Images Only) */}
                     {previewAttachment.type === 'image' && (
                       <div className="flex items-center gap-2 bg-stone-800/80 backdrop-blur-md p-1.5 rounded-full border border-stone-700 shadow-xl">
                          <button onClick={() => { setZoom(prev => Math.max(1, prev - 0.5)); if(zoom-0.5 <=1) setPan({x:0, y:0}); }} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"><ZoomOut size={20} /></button>
                          <span className="text-white text-xs font-mono w-10 text-center font-bold">{Math.round(zoom * 100)}%</span>
                          <button onClick={() => setZoom(prev => Math.min(5, prev + 0.5))} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"><ZoomIn size={20} /></button>
                          <div className="w-px h-6 bg-white/20 mx-1"></div>
                          <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors" title="Reset"><RefreshCw size={16} /></button>
                       </div>
                     )}

                     <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                         <span className="text-white/90 text-sm font-medium">{previewAttachment.name}</span>
                         <a 
                           href={previewAttachment.url} 
                           download={previewAttachment.name}
                           target="_blank"
                           rel="noreferrer"
                           className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/30 rounded-full text-xs font-bold transition-all"
                           onClick={(e) => e.stopPropagation()}
                         >
                           <Download size={14} /> Download
                         </a>
                     </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};