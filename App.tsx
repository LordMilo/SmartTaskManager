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
import { Sun, Moon, Settings, Cloud, X, Languages, LogOut, Shield, Database, Save, Loader2, CheckCircle2 } from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'Alice Green', role: 'Head Gardener', phoneNumber: '9999', isAdmin: true, avatar: 'https://picsum.photos/seed/alice/200/200' },
  { id: '2', name: 'Bob Soil', role: 'Landscaper', phoneNumber: '0812345678', avatar: 'https://picsum.photos/seed/bob/200/200' },
  { id: '3', name: 'Charlie Leaf', role: 'Botanist', phoneNumber: '0898765432', avatar: 'https://picsum.photos/seed/charlie/200/200' },
];

const INITIAL_ROUTINES: Routine[] = [
  { id: 'r1', title: 'Morning Watering', description: 'Water the rose garden and front lawn.', defaultPriority: Priority.URGENT },
  { id: 'r2', title: 'Weekly Pruning', description: 'Trim hedges and remove dead leaves.', defaultPriority: Priority.NORMAL },
  { id: 'r3', title: 'Soil Check', description: 'Measure pH levels in vegetable patch.', defaultPriority: Priority.MEDIUM },
  { id: 'r4', title: 'Compost Turning', description: 'Aerate the compost pile.', defaultPriority: Priority.NORMAL },
];

const INITIAL_TASKS: Task[] = [
  // Today's Tasks
  { id: 't1', title: 'รดน้ำต้นไม้หน้าบ้าน', description: 'รดให้ชุ่ม โดยเฉพาะกระถางแขวนที่ระเบียง', priority: Priority.NORMAL, status: Status.TODO, dueDate: new Date().toISOString().split('T')[0], assigneeId: undefined, attachments: [] },
  { id: 't2', title: 'ตัดหญ้าสนามหลังบ้าน', description: 'ปรับระดับใบมีดเป็น 2 นิ้ว อย่าลืมเก็บเศษหญ้า', priority: Priority.MEDIUM, status: Status.DOING, dueDate: new Date().toISOString().split('T')[0], assigneeId: '2', attachments: [] },
  { id: 't3', title: 'ซ่อมก๊อกน้ำรั่ว', description: 'ก๊อกน้ำตรงแปลงผักรั่วซึมมาก ต้องเปลี่ยนวาล์ว', priority: Priority.URGENT, status: Status.TODO, dueDate: new Date().toISOString().split('T')[0], assigneeId: undefined, attachments: [] },
];

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
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [routines, setRoutines] = useState<Routine[]>(INITIAL_ROUTINES);
  
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
    if (currentUser) {
      setMembers(prevMembers => {
        if (!prevMembers.find(m => m.id === currentUser.id)) {
          return [...prevMembers, currentUser];
        }
        return prevMembers;
      });
    }
  }, [currentUser]);

  // --- Helpers ---
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Handlers ---

  const handleLogin = (member: Member) => {
    setCurrentUser(member);
    localStorage.setItem('gardenos_user', JSON.stringify(member));
    
    // Add member if new
    if (!members.find(m => m.id === member.id)) {
      setMembers([...members, member]);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gardenos_user');
    if (useGDrive) googleService.handleSignOut();
  };

  const handleMoveTask = (taskId: string, newStatus: Status) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      
      const updates: Partial<Task> = { status: newStatus };
      
      // Auto-assign logic: If moving to DOING and no assignee, assign to current user
      // Or if moving FROM Todo TO Doing (Accepting), assign to current user
      if (newStatus === Status.DOING && currentUser) {
         updates.assigneeId = currentUser.id;
      }
      
      return { ...task, ...updates };
    }));
  };

  const handleAddTask = (newTask: Task) => {
    // Use functional update to ensure we have latest state
    setTasks(prev => [...prev, newTask]);
    // Optionally sync
    if (useGDrive && googleConfig.sheetId) {
       setTasks(prev => {
         const updated = [...prev, newTask];
         if (useGDrive && googleConfig.sheetId) syncToSheets(updated);
         return updated;
       });
    }
  };

  const handleRoutineStart = (task: Task, routineId: string) => {
    handleAddTask(task);
    // Log the routine as started for today (Local Time)
    const today = getLocalDateStr();
    setCompletedRoutineLog(prev => [...prev, { id: routineId, date: today }]);
  };

  const handleAttachProof = async (taskId: string, file: File) => {
    let attachment: Attachment = {
       id: generateId(),
       type: file.type.startsWith('video') ? 'video' : 'image',
       url: URL.createObjectURL(file), // Default local preview
       name: file.name,
       createdAt: new Date().toISOString()
    };

    if (useGDrive) {
      try {
        setIsSyncing(true);
        const driveData = await googleService.uploadFile(file);
        attachment.url = URL.createObjectURL(file); // Keep local blob for immediate speed
        console.log("Uploaded to Drive:", driveData);
      } catch (err) {
        console.error("Upload failed", err);
        alert("Upload to Drive failed. Using local preview.");
      } finally {
        setIsSyncing(false);
      }
    }

    setTasks(prev => prev.map(t => 
       t.id === taskId 
       ? { ...t, attachments: [...t.attachments, attachment] }
       : t
    ));
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

  if (!currentUser) {
    return (
      <>
        <Background />
        <AuthScreen onLogin={handleLogin} existingMembers={members} lang={lang} />
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
              onAddMember={(m) => setMembers([...members, m])} 
              onRemoveMember={(id) => setMembers(prev => prev.filter(m => m.id !== id))}
              lang={lang}
              currentUser={currentUser}
            />
          )}
          {currentView === 'ROUTINES' && (
             <RoutineManager 
               routines={routines}
               currentUser={currentUser}
               onActivate={handleRoutineStart}
               onAddRoutine={(r) => setRoutines([...routines, r])}
               onEditRoutine={(r) => setRoutines(prev => prev.map(item => item.id === r.id ? r : item))}
               onDeleteRoutine={(id) => setRoutines(prev => prev.filter(r => r.id !== id))}
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