import { Language } from './types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const formatDate = (dateString: string, lang: Language = 'en'): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' }).format(date);
};

export const formatDateTime = (dateString: string, lang: Language = 'en'): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
    case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
    case 'NORMAL': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    default: return 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300';
  }
};

export const TRANSLATIONS = {
  en: {
    // Navigation
    board: "Board",
    calendar: "Calendar",
    routines: "Routines",
    team: "Team",
    
    // Status
    todo: "To Do",
    doing: "In Progress",
    done: "Completed",
    
    // Task
    newTask: "New Garden Task",
    taskName: "Task Name",
    description: "Description",
    priority: "Priority",
    dueDate: "Due Date",
    assignTo: "Assign To",
    unassigned: "Unassigned",
    createTask: "Create Task",
    proofAttached: "Media Attached",
    savedToDrive: "Saved to Drive",
    due: "Due",
    back: "Back",
    next: "Next",
    accept: "Accept",
    markAsDone: "Mark as Done",
    markAsTodo: "Reopen Task",
    doingBy: "Responsible",
    
    // Priorities
    URGENT: "Urgent",
    MEDIUM: "Medium",
    NORMAL: "Normal",

    // Team
    gardenCrew: "Garden Crew",
    manageTeam: "Manage your team and assignments",
    name: "Name",
    role: "Role",
    add: "Add",
    adminOnly: "Admin Only",
    
    // Routines
    routineLibrary: "Routine Library",
    routineSubtitle: "One-click task generation for daily chores",
    startRoutine: "Start Routine",
    addRoutine: "Add Routine",
    editRoutine: "Edit Routine",
    deleteRoutine: "Delete Routine",
    routineTitle: "Routine Title",
    save: "Save",
    cancel: "Cancel",
    confirmDeleteRoutine: "Are you sure you want to delete this routine?",
    
    // Calendar
    noTasks: "No tasks",
    
    // Settings
    settings: "Settings",
    language: "Language",
    gDriveSync: "Google Cloud Sync",
    uploadProof: "Sync Sheets & Drive",
    activeSim: "Google Integration Active. Files upload to Drive, Data syncs to Sheet.",
    simMode: "Cloud Sync simulation mode. Files are local only.",
    logout: "Log Out",
    
    // Google Config
    googleConfig: "Google API Configuration",
    clientId: "Client ID",
    apiKey: "API Key",
    sheetId: "Sheet ID",
    connectGoogle: "Connect Google Account",
    syncNow: "Sync to Sheets",
    syncing: "Syncing...",
    synced: "Synced!",
    
    // Detail Modal
    taskDetails: "Task Details",
    attachments: "Attachments",
    addMedia: "Add Photo/Video",
    noAttachments: "No attachments yet",
    close: "Close",

    // Auth
    welcome: "Welcome to GardenOS",
    loginSubtitle: "Sign in with your name and phone number",
    phoneNumber: "Phone Number",
    login: "Login / Register",
    adminAccess: "Admin Access",
    adminNote: "Enter 9999 for Admin demo",
    phoneRequired: "Phone number is required",
    
    // Misc
    allClear: "All Clear!",
    noTasksInList: "No tasks for today.",
    task: "Task",
    tasks: "Tasks",
    
    // History & Filter
    history: "History",
    workHistory: "Work History",
    overdue: "Overdue",
    daily: "Daily",
    monthly: "Monthly",
    selectDate: "Select Date",
    selectMonth: "Select Month",
    todaysTasks: "Today's Tasks",
    completedTasks: "Completed Tasks",

    // TTS
    readAloud: "Read Aloud",
    stopReading: "Stop",
    loadingAudio: "Generating Voice...",
  },
  th: {
    // Navigation
    board: "กระดาน",
    calendar: "ปฏิทิน",
    routines: "กิจวัตร",
    team: "ทีมงาน",
    
    // Status
    todo: "รอดำเนินการ",
    doing: "กำลังทำ",
    done: "เสร็จสิ้น",
    
    // Task
    newTask: "งานสวนใหม่",
    taskName: "ชื่องาน",
    description: "รายละเอียด",
    priority: "ความสำคัญ",
    dueDate: "กำหนดส่ง",
    assignTo: "มอบหมายให้",
    unassigned: "ไม่ระบุ",
    createTask: "สร้างงาน",
    proofAttached: "แนบหลักฐานแล้ว",
    savedToDrive: "บันทึกลง Drive",
    due: "ส่ง",
    back: "ถอยกลับ",
    next: "ถัดไป",
    accept: "รับงาน",
    markAsDone: "ทำเสร็จแล้ว",
    markAsTodo: "ย้อนสถานะงาน",
    doingBy: "ผู้รับผิดชอบ",
    
    // Priorities
    URGENT: "ด่วนที่สุด",
    MEDIUM: "ปานกลาง",
    NORMAL: "ทั่วไป",

    // Team
    gardenCrew: "ทีมงานสวน",
    manageTeam: "จัดการรายชื่อและหน้าที่รับผิดชอบ",
    name: "ชื่อ",
    role: "ตำแหน่ง",
    add: "เพิ่ม",
    adminOnly: "สำหรับหัวหน้าสวน",
    
    // Routines
    routineLibrary: "คลังกิจวัตร",
    routineSubtitle: "สร้างงานประจำวันได้ในคลิกเดียว",
    startRoutine: "เริ่มงาน",
    addRoutine: "เพิ่มกิจวัตร",
    editRoutine: "แก้ไขกิจวัตร",
    deleteRoutine: "ลบกิจวัตร",
    routineTitle: "ชื่อกิจวัตร",
    save: "บันทึก",
    cancel: "ยกเลิก",
    confirmDeleteRoutine: "คุณแน่ใจหรือไม่ว่าจะลบกิจวัตรนี้?",
    
    // Calendar
    noTasks: "ไม่มีงาน",
    
    // Settings
    settings: "การตั้งค่า",
    language: "ภาษา",
    gDriveSync: "เชื่อมต่อ Google Cloud",
    uploadProof: "ซิงค์ Google Sheets & Drive",
    activeSim: "เชื่อมต่อระบบจริงแล้ว: ไฟล์จะถูกอัปโหลดเข้า Drive และข้อมูลลง Sheet",
    simMode: "โหมดจำลอง (ไฟล์เก็บในเครื่อง)",
    logout: "ออกจากระบบ",
    
    // Google Config
    googleConfig: "การตั้งค่า Google API",
    clientId: "Client ID",
    apiKey: "API Key",
    sheetId: "Sheet ID (รหัสสเปรดชีต)",
    connectGoogle: "เข้าสู่ระบบ Google",
    syncNow: "ซิงค์ลง Sheets เดี๋ยวนี้",
    syncing: "กำลังซิงค์...",
    synced: "เรียบร้อย!",
    
    // Detail Modal
    taskDetails: "รายละเอียดงาน",
    attachments: "ไฟล์แนบ (รูป/วิดีโอ)",
    addMedia: "เพิ่มรูป/วิดีโอ",
    noAttachments: "ยังไม่มีไฟล์แนบ",
    close: "ปิด",

    // Auth
    welcome: "ยินดีต้อนรับสู่ GardenOS",
    loginSubtitle: "เข้าสู่ระบบด้วยชื่อและเบอร์โทรศัพท์",
    phoneNumber: "เบอร์โทรศัพท์",
    login: "เข้าสู่ระบบ / ลงทะเบียน",
    adminAccess: "สิทธิ์ผู้ดูแล",
    adminNote: "ใช้เบอร์ 9999 เพื่อทดสอบ Admin",
    phoneRequired: "กรุณากรอกเบอร์โทรศัพท์",
    
    // Misc
    allClear: "โล่งมาก!",
    noTasksInList: "ไม่มีงานสำหรับวันนี้",
    task: "งาน",
    tasks: "งาน",
    
    // History & Filter
    history: "ประวัติงาน",
    workHistory: "ประวัติงานที่เสร็จแล้ว",
    overdue: "งานค้างส่ง",
    daily: "รายวัน",
    monthly: "รายเดือน",
    selectDate: "เลือกวันที่",
    selectMonth: "เลือกเดือน",
    todaysTasks: "งานวันนี้",
    completedTasks: "งานที่เสร็จแล้ว",

    // TTS
    readAloud: "อ่านให้ฟัง",
    stopReading: "หยุด",
    loadingAudio: "กำลังสร้างเสียง...",
  }
};