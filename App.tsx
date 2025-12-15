import React, { useState, useEffect } from 'react';
import { Background } from './components/Background';
import { Navigation } from './components/Navigation';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { TeamManager } from './components/TeamManager';
import { RoutineManager } from './components/RoutineManager';
import { NewTaskModal } from './components/NewTaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { AuthScreen } from './components/AuthScreen';
import { Task, Member, Routine, ViewState, Priority, Status, Language, Attachment } from './types';
import { generateId, TRANSLATIONS } from './utils';
import { googleService } from './services/googleService';
import { supabase } from './services/supabaseClient';
import { Sun, Moon, Settings, Cloud, X, Languages, LogOut, Shield, Database, Save, Loader2, CheckCircle2, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('KANBAN');
  
  // Persistent Login State Initialization
  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    try {
      const savedUser = localStorage.getItem('gardenos_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from storage", e);
      return null;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState<Language>('th');
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  
  // Data State - Start empty, fetch from Supabase
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  
  // Routine Log State (Tracks {routineId, date})
  const [completedRoutineLog, setCompletedRoutineLog] = useState<{id: string, date: string}[]>([]);
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Google Integration State
  const [useGDrive, setUseGDrive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Configs
  const [googleConfig, setGoogleConfig] = useState({ apiKey: '', clientId: '', sheetId: '' });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Ensure persisted user is in the members list
  useEffect(() => {
    if (currentUser && members.length > 0) {
      const exists = members.find(m => m.id === currentUser.id);
      if (!exists) {
        setMembers(prev => [...prev, currentUser]);
      }
    }
  }, [currentUser, members.length]);

  // --- Supabase Data Fetching ---
  const fetchData = async () => {
    setIsLoading(true);
    setDbError(false);
    try {
      // 1. Fetch Members
      const { data: membersData, error: membersError } = await supabase.from('members').select('*');
      if (membersError) throw membersError;

      // 2. Fetch Tasks with Attachments
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`*, attachments(*)`);
      if (tasksError) throw tasksError;

      // 3. Fetch Routines
      const { data: routinesData, error: routinesError } = await supabase.from('routines').select('*');
      if (routinesError) throw routinesError;

      // Map DB types to App types
      if (membersData) {
        const mappedMembers: Member[] = membersData.map((m: any) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          phoneNumber: m.phone_number,
          isAdmin: m.is_admin,
          avatar: m.avatar || `https://picsum.photos/seed/${m.id}/200/200`
        }));
        setMembers(mappedMembers);
      }

      if (tasksData) {
        const mappedTasks: Task[] = tasksData.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority as Priority,
          status: t.status as Status,
          dueDate: t.due_date,
          assigneeId: t.assignee_id || undefined,
          attachments: t.attachments ? t.attachments.map((a: any) => ({
            id: a.id,
            type: a.type,
            url: a.url,
            name: a.name,
            createdAt: a.created_at
          })) : []
        }));
        setTasks(mappedTasks);
      }

      if (routinesData) {
        const mappedRoutines: Routine[] = routinesData.map((r: any) => ({
           id: r.id,
           title: r.title,
           description: r.description,
           defaultPriority: r.default_priority as Priority
        }));
        setRoutines(mappedRoutines);
      }

    } catch (error) {
      // Improved error logging
      console.warn("Supabase connection failed. Switching to Local/Offline Mode.", error);
      setDbError(true);
      
      // Fallback: If we have a user but no data, we are in offline mode. 
      // Existing local state is empty, so user starts fresh in memory.
      // In a real PWA we'd use IndexedDB here.
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helpers ---
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Handlers ---

  const handleLogin = async (member: Member) => {
    setCurrentUser(member);
    localStorage.setItem('gardenos_user', JSON.stringify(member));
    
    // Add member to DB if new
    if (!members.find(m => m.id === member.id)) {
      setMembers([...members, member]);
      
      if (!dbError) {
        try {
          await supabase.from('members').insert({
            id: member.id,
            name: member.name,
            role: member.role,
            phone_number: member.phoneNumber,
            is_admin: member.isAdmin,
            avatar: member.avatar
          });
        } catch (e) {
          console.warn("Offline: Could not save member to DB");
        }
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gardenos_user');
    if (useGDrive) googleService.handleSignOut();
  };

  const handleMoveTask = async (taskId: string, newStatus: Status) => {
    // Optimistic Update
    const oldTasks = [...tasks];
    let updatedTask: Task | undefined;

    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      
      const updates: Partial<Task> = { status: newStatus };
      
      if (newStatus === Status.DOING && currentUser) {
         updates.assigneeId = currentUser.id;
      }
      
      updatedTask = { ...task, ...updates };
      return updatedTask;
    }));

    // DB Update
    if (updatedTask && !dbError) {
      try {
        const { error } = await supabase.from('tasks').update({
          status: newStatus,
          assignee_id: updatedTask.assigneeId || null
        }).eq('id', taskId);

        if (error) throw error;
      } catch (e) {
        console.error("Offline: Failed to update task status in DB", e);
        // We do NOT revert state in offline mode, we keep local changes in memory
        if (!dbError) setDbError(true); 
      }
    }
  };

  const handleAddTask = async (newTask: Task) => {
    // Optimistic Update
    setTasks(prev => [...prev, newTask]);

    if (dbError) return;

    try {
      // 1. Insert Task
      const { error: taskError } = await supabase.from('tasks').insert({
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: newTask.status,
        due_date: newTask.dueDate,
        assignee_id: newTask.assigneeId || null
      });
      if (taskError) throw taskError;

      // 2. Insert Attachments if any
      if (newTask.attachments.length > 0) {
        const { error: attError } = await supabase.from('attachments').insert(
          newTask.attachments.map(a => ({
            id: a.id,
            task_id: newTask.id,
            type: a.type,
            url: a.url, // Note: For production, upload to Storage and use that URL
            name: a.name,
            created_at: a.createdAt
          }))
        );
        if (attError) throw attError;
      }

      // Sync to sheets if enabled
      if (useGDrive && googleConfig.sheetId) {
         const updated = [...tasks, newTask];
         syncToSheets(updated);
      }

    } catch (err) {
      console.warn("Offline: Failed to save task to DB", err);
      setDbError(true);
    }
  };

  const handleRoutineStart = (task: Task, routineId: string) => {
    handleAddTask(task);
    // Log the routine as started for today (Local Time)
    const today = getLocalDateStr();
    setCompletedRoutineLog(prev => [...prev, { id: routineId, date: today }]);
  };

  const handleAttachProof = async (taskId: string, file: File) => {
    // 1. Create Attachment Object
    let attachment: Attachment = {
       id: generateId(),
       type: file.type.startsWith('video') ? 'video' : 'image',
       url: URL.createObjectURL(file), // Local preview
       name: file.name,
       createdAt: new Date().toISOString()
    };

    // 2. Handle Google Drive Upload (Legacy logic preserved)
    if (useGDrive) {
      try {
        setIsSyncing(true);
        const driveData = await googleService.uploadFile(file);
        // For DB persistence, ideally we'd use the Drive Link or upload to Supabase Storage
        // For now, we'll keep the logic but maybe store the preview URL or Drive link if we updated Attachment type
        console.log("Uploaded to Drive:", driveData);
      } catch (err) {
        console.error("Upload failed", err);
        alert("Upload to Drive failed. Using local preview.");
      } finally {
        setIsSyncing(false);
      }
    }

    // 3. Update Local State
    setTasks(prev => prev.map(t => 
       t.id === taskId 
       ? { ...t, attachments: [...t.attachments, attachment] }
       : t
    ));

    // 4. Update Supabase
    if (!dbError) {
      try {
        const { error } = await supabase.from('attachments').insert({
            id: attachment.id,
            task_id: taskId,
            type: attachment.type,
            url: attachment.url, // NOTE: Blobs expire. In Prod, use Supabase Storage public URL
            name: attachment.name,
            created_at: attachment.createdAt
        });
        if (error) throw error;
      } catch (e) {
        console.warn("Offline: Failed to save attachment metadata to DB");
      }
    }
  };

  // New Handlers for Team & Routines to support DB sync
  const handleAddMember = async (newMember: Member) => {
    setMembers(prev => [...prev, newMember]);
    if (!dbError) {
      try {
        await supabase.from('members').insert({
          id: newMember.id,
          name: newMember.name,
          role: newMember.role,
          phone_number: newMember.phoneNumber,
          is_admin: newMember.isAdmin,
          avatar: newMember.avatar
        });
      } catch (e) { console.warn("Offline mode"); }
    }
  };

  const handleRemoveMember = async (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    if (!dbError) {
       try { await supabase.from('members').delete().eq('id', id); } catch(e) {}
    }
  };

  const handleAddRoutine = async (newRoutine: Routine) => {
    setRoutines(prev => [...prev, newRoutine]);
    if (!dbError) {
      try {
        await supabase.from('routines').insert({
          id: newRoutine.id,
          title: newRoutine.title,
          description: newRoutine.description,
          default_priority: newRoutine.defaultPriority
        });
      } catch (e) { console.warn("Offline mode"); }
    }
  };

  const handleEditRoutine = async (updated: Routine) => {
    setRoutines(prev => prev.map(r => r.id === updated.id ? updated : r));
    if (!dbError) {
      try {
        await supabase.from('routines').update({
          title: updated.title,
          description: updated.description,
          default_priority: updated.defaultPriority
        }).eq('id', updated.id);
      } catch(e) { console.warn("Offline mode"); }
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
    if (!dbError) {
       try { await supabase.from('routines').delete().eq('id', id); } catch(e) {}
    }
  };


  const syncToSheets = async (currentTasks: Task[]) => {
    if (!googleConfig.sheetId) return;
    try {
      setIsSyncing(true);
      setSyncStatus('idle');
      await googleService.syncTasks(googleConfig.sheetId, currentTasks);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogle = () => {
    googleService.loadGapi(googleConfig.apiKey, googleConfig.clientId, (success) => {
      if (success) {
        googleService.handleAuthClick();
        setUseGDrive(true);
      } else {
        alert("Failed to load Google Scripts. Check your API Key/Client ID.");
      }
    });
  };

  // --- Loading Screen ---
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-500 font-medium animate-pulse">Connecting to Database...</p>
      </div>
    );
  }

  // --- Login Screen ---
  if (!currentUser) {
    return (
      <>
        <Background />
        <AuthScreen onLogin={handleLogin} existingMembers={members} lang={lang} />
        {dbError && (
          <div className="fixed bottom-4 left-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-xl border border-red-200 dark:border-red-800 shadow-lg flex items-center gap-2 max-w-sm text-sm z-50 animate-slide-up">
            <WifiOff size={18} />
            <p>Could not connect to database. Using offline mode.</p>
          </div>
        )}
      </>
    );
  }

  // Find the active task from the tasks array to ensure we have the latest state
  const activeTaskForModal = selectedTask ? (tasks.find(t => t.id === selectedTask.id) || null) : null;

  // Calculate hidden routines for today (Local Time)
  const todayDate = getLocalDateStr();
  const hiddenRoutineIds = completedRoutineLog
    .filter(log => log.date === todayDate)
    .map(log => log.id);

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <Background />

      {/* Top Bar */}
      <header className="flex-none p-4 flex items-center justify-between z-10 animate-slide-up">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-sm">
             STM
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 leading-none">Smart Task <span className="text-emerald-600 dark:text-emerald-400">Manager</span></h1>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-wide">SMART TASKER</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="hidden md:flex flex-col items-end mr-2">
             <span className="text-sm font-bold text-stone-700 dark:text-stone-200">{currentUser.name}</span>
             <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase">{currentUser.role}</span>
           </div>
           <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white dark:border-stone-700 shadow-sm" />
           
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="p-2.5 bg-white/50 dark:bg-stone-800/50 hover:bg-white dark:hover:bg-stone-800 backdrop-blur-sm rounded-xl ml-2 transition-all shadow-sm"
           >
             <Settings size={20} className="text-stone-600 dark:text-stone-300" />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-0">
        <div className="h-full max-w-7xl mx-auto px-2 md:px-4">
          {currentView === 'KANBAN' && (
            <KanbanBoard 
              tasks={tasks} 
              members={members} 
              onMoveTask={handleMoveTask} 
              onAttachProof={handleAttachProof}
              onTaskClick={setSelectedTask}
              useGDrive={useGDrive}
              lang={lang}
            />
          )}
          {currentView === 'CALENDAR' && <CalendarView tasks={tasks} lang={lang} />}
          {currentView === 'TEAM' && (
            <TeamManager 
              members={members} 
              onAddMember={handleAddMember} 
              onRemoveMember={handleRemoveMember}
              lang={lang}
              currentUser={currentUser}
            />
          )}
          {currentView === 'ROUTINES' && (
             <RoutineManager 
               routines={routines}
               currentUser={currentUser}
               onActivate={handleRoutineStart}
               onAddRoutine={handleAddRoutine}
               onEditRoutine={handleEditRoutine}
               onDeleteRoutine={handleDeleteRoutine}
               lang={lang}
               hiddenRoutineIds={hiddenRoutineIds}
             />
          )}
        </div>
      </main>

      <Navigation 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onAddTask={() => setIsTaskModalOpen(true)}
        lang={lang}
      />

      <NewTaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSave={handleAddTask} 
        members={members}
        lang={lang}
      />

      <TaskDetailModal
        isOpen={!!activeTaskForModal}
        onClose={() => setSelectedTask(null)}
        task={activeTaskForModal}
        members={members}
        onAttach={handleAttachProof}
        onMove={(id, status) => {
           handleMoveTask(id, status);
           if (status === Status.DONE) setSelectedTask(null);
        }}
        useGDrive={useGDrive}
        lang={lang}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
           <div className="absolute inset-0 bg-stone-900/20 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSettingsOpen(false)}></div>
           <div className="relative w-80 h-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl shadow-2xl p-6 animate-slide-left flex flex-col border-l border-white/50 dark:border-stone-800">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                  <Settings className="text-emerald-500" /> {t.settings}
                </h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full">
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              <div className="space-y-8 flex-1">
                 {/* Appearance */}
                 <section className="space-y-3">
                   <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t.language} & Theme</h3>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setLang('en')} 
                        className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${lang === 'en' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'}`}
                      >
                        <span className="text-lg">🇺🇸</span> EN
                      </button>
                      <button 
                        onClick={() => setLang('th')} 
                        className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${lang === 'th' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'}`}
                      >
                        <span className="text-lg">🇹🇭</span> TH
                      </button>
                   </div>
                   
                   <button 
                     onClick={() => setIsDarkMode(!isDarkMode)}
                     className="w-full py-3 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-between px-4 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                   >
                     <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Dark Mode</span>
                     {isDarkMode ? <Moon size={18} className="text-purple-400" /> : <Sun size={18} className="text-orange-400" />}
                   </button>
                 </section>

                 {/* Google Cloud Config */}
                 <section className="space-y-3">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                      <Cloud size={12} /> {t.gDriveSync}
                    </h3>
                    
                    <div className={`p-3 rounded-xl text-xs leading-relaxed border ${useGDrive ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 text-emerald-700 dark:text-emerald-400' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'}`}>
                       {useGDrive ? t.activeSim : t.simMode}
                    </div>

                    {!useGDrive ? (
                       <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder={t.apiKey}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-stone-700 outline-none"
                            value={googleConfig.apiKey}
                            onChange={e => setGoogleConfig({...googleConfig, apiKey: e.target.value})}
                          />
                          <input 
                            type="text" 
                            placeholder={t.clientId}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-stone-700 outline-none"
                            value={googleConfig.clientId}
                            onChange={e => setGoogleConfig({...googleConfig, clientId: e.target.value})}
                          />
                           <input 
                            type="text" 
                            placeholder={t.sheetId}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-stone-700 outline-none"
                            value={googleConfig.sheetId}
                            onChange={e => setGoogleConfig({...googleConfig, sheetId: e.target.value})}
                          />
                          <button 
                            onClick={handleConnectGoogle}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                             {t.connectGoogle}
                          </button>
                       </div>
                    ) : (
                      <div className="space-y-2">
                        <button 
                           onClick={() => syncToSheets(tasks)}
                           disabled={isSyncing}
                           className="w-full py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                           {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                           {isSyncing ? t.syncing : t.syncNow}
                        </button>
                        {syncStatus === 'success' && <p className="text-xs text-center text-emerald-500 font-bold">{t.synced}</p>}
                        {syncStatus === 'error' && <p className="text-xs text-center text-red-500 font-bold">Sync Failed</p>}
                      </div>
                    )}
                 </section>
              </div>

              <button 
                 onClick={handleLogout}
                 className="mt-auto py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <LogOut size={18} /> {t.logout}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;