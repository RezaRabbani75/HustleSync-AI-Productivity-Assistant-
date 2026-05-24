import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, ArrowRight, Loader2, ListTodo, History, Clock, FileText, Plus, Trash2, PanelLeftClose, PanelLeft, Settings, Sun, Moon, CalendarCheck, Code2, Palette, Briefcase, GraduationCap, Upload, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PomodoroTimer } from './components/PomodoroTimer';
import { ConsistencyHeatmap } from './components/ConsistencyHeatmap';

type HistoryItem = {
  id: string;
  date: number;
  brainDump: string;
  result: string;
  checkboxStates?: Record<number, boolean>;
};

type UserProfile = {
  name: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  exp?: number;
  photo?: string;
};

const RANKS = [
  { maxExp: 100, title: 'Beginner' },
  { maxExp: 250, title: 'Novice' },
  { maxExp: 500, title: 'Apprentice' },
  { maxExp: 1000, title: 'Adept' },
  { maxExp: 2000, title: 'Expert' },
  { maxExp: Infinity, title: 'Master' }
];

const getLevelInfo = (exp: number = 0) => {
  let prevMax = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (exp < RANKS[i].maxExp) {
       return {
         level: i + 1,
         title: RANKS[i].title,
         currentLevelExp: exp - prevMax,
         expForNextLevel: RANKS[i].maxExp - prevMax,
         progress: ((exp - prevMax) / (RANKS[i].maxExp - prevMax)) * 100
       };
    }
    prevMax = RANKS[i].maxExp;
  }
  return {
    level: RANKS.length,
    title: RANKS[RANKS.length - 1].title,
    currentLevelExp: exp - prevMax,
    expForNextLevel: 1, 
    progress: 100
  };
};

const QUOTES = [
  "Small steps everyday lead to massive changes.",
  "You don't have to be perfect to be amazing.",
  "Focus on being productive instead of busy.",
  "Your direction is more important than your speed.",
  "Take a deep breath. You've got this.",
  "Progress, not perfection.",
  "Every expert was once a beginner.",
  "Rest is a productive part of the process.",
  "Do what you can, with what you have, where you are.",
  "A year from now you will wish you had started today."
];

const GREETINGS = [
  { prefix: "Welcome back", suffix: ". 🕊️" },
  { prefix: "Let's get started again", suffix: " 🚀" },
  { prefix: "What're your plans for today", suffix: "? 🤔" },
  { prefix: "Everything's all set", suffix: "! ✨" }
];

const QUICK_TEMPLATES = [
  { label: "Front-End Sprint", icon: Code2, text: "I need to finish the responsive layout using Tailwind, fix the React state bugs, and push the code to GitHub." },
  { label: "Design Duties", icon: Palette, text: "I need to brainstorm concepts for the upcoming campus event, design three alternative posters, and organize the creative assets." },
  { label: "Internship Prep", icon: Briefcase, text: "I have to update my CV, compile my latest project links into a portfolio, and review Python and Data Analytics basics for the interview." },
  { label: "Exam Cram", icon: GraduationCap, text: "I need to review the algorithm materials, practice 3 past exam papers, and summarize my study notes." }
];

function cleanIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .trim();
}

function parseTimeString(timeStr: string, defaultAmPm?: 'AM' | 'PM'): { hours: number; minutes: number } | null {
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3] || defaultAmPm;
  
  if (hours >= 12) {
    return { hours, minutes };
  }
  
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
}

function parseTimeRange(rangeStr: string): { start: { hours: number; minutes: number } | null; end: { hours: number; minutes: number } | null } {
  const parts = rangeStr.split(/[-–—to]+/i);
  if (parts.length < 2) return { start: null, end: null };
  
  const startStr = parts[0].trim();
  const endStr = parts[1].trim();
  
  const ampmStartMatch = startStr.toUpperCase().match(/(AM|PM)/);
  const ampmEndMatch = endStr.toUpperCase().match(/(AM|PM)/);
  
  const startAmPm = ampmStartMatch ? ampmStartMatch[1] as 'AM' | 'PM' : undefined;
  const endAmPm = ampmEndMatch ? ampmEndMatch[1] as 'AM' | 'PM' : undefined;

  let computedStartAmPm = startAmPm;
  let computedEndAmPm = endAmPm;

  if (!startAmPm && endAmPm) {
    const rawStartHour = parseInt((startStr.match(/\d+/) || ['0'])[0], 10);
    const rawEndHour = parseInt((endStr.match(/\d+/) || ['0'])[0], 10);
    
    if (endAmPm === 'PM') {
      if (rawStartHour > rawEndHour && rawStartHour !== 12) {
        computedStartAmPm = 'AM';
      } else {
        computedStartAmPm = 'PM';
      }
    } else {
      computedStartAmPm = 'AM';
    }
  }

  const start = parseTimeString(startStr, computedStartAmPm);
  const end = parseTimeString(endStr, computedEndAmPm);
  
  return { start, end };
}

function extractChecklistItems(markdown: string): string[] {
  const lines = markdown.split('\n');
  const items: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    const checkedMatch = trimmed.match(/^[-*•]\s*\[\s*[xX ]?\s*\]\s+(.+)/);
    if (checkedMatch && checkedMatch[1]) {
      items.push(checkedMatch[1].trim());
    } else {
      const parsedMatch = trimmed.match(/^\d+\.\s+[-*•]\s*\[\s*[xX ]?\s*\]\s+(.+)/);
      if (parsedMatch && parsedMatch[1]) {
        items.push(parsedMatch[1].trim());
      }
    }
  }
  return items;
}

export default function App() {
  const [brainDump, setBrainDump] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'profile' | string>('new');
  const [currentCheckboxes, setCurrentCheckboxes] = useState<Record<number, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('hustlesync_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('hustlesync_theme', newTheme);
  };

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('hustlesync_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return { name: 'Sarah', dateOfBirth: '', gender: '', occupation: '' };
  });

  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    if (activeTab === 'profile') {
      setDraftProfile(profile);
    }
  }, [activeTab, profile]);

  const hasProfileChanges = JSON.stringify(profile) !== JSON.stringify(draftProfile);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraftProfile({ ...draftProfile, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    setProfile(draftProfile);
    localStorage.setItem('hustlesync_profile', JSON.stringify(draftProfile));
  };

  useEffect(() => {
    const saved = localStorage.getItem('hustlesync_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem('hustlesync_history', JSON.stringify(items));
  };

  const handleCheckboxChange = (index: number, isChecked: boolean) => {
    const wasChecked = currentCheckboxes[index] || false;
    const newStates = { ...currentCheckboxes, [index]: isChecked };
    setCurrentCheckboxes(newStates);
    
    if (activeTab !== 'new' && activeTab !== 'profile') {
      const newHistory = history.map(item => 
        item.id === activeTab ? { ...item, checkboxStates: newStates } : item
      );
      saveHistory(newHistory);
    }

    if (isChecked && !wasChecked) {
      updateExp(10);
    } else if (!isChecked && wasChecked) {
      updateExp(-10);
    }
  };

  const updateExp = (amount: number) => {
    setProfile(prev => {
      const newExp = Math.max(0, (prev.exp || 0) + amount);
      const newProfile = { ...prev, exp: newExp };
      localStorage.setItem('hustlesync_profile', JSON.stringify(newProfile));
      return newProfile;
    });
    setDraftProfile(prev => {
      return { ...prev, exp: Math.max(0, (prev.exp || 0) + amount) };
    });
  };

  const handleTemplateClick = (text: string) => {
    if (activeTab === 'new') {
      setBrainDump((prev) => (prev ? `${prev}\n\n${text}` : text));
    }
  };

  const handleExportToCalendar = () => {
    if (!result) return;

    const lines = result.split('\n');
    const events: Array<{
      summary: string;
      start: { hours: number; minutes: number };
      end: { hours: number; minutes: number };
      description: string;
    }> = [];

    // 1. Extract checklist items for description
    const checklistItems = extractChecklistItems(result);
    const checklistDesc = checklistItems.length > 0 
      ? `\n\n🧩 ACTIONABLE PLANS:\n${checklistItems.map(item => `[ ] ${item}`).join('\n')}` 
      : '';

    // 2. Parse daily schedule table lines
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        const cells = trimmed.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length >= 2) {
          const timeCell = cells[0];
          const activityCell = cells[1];
          const focusBreakCell = cells[2] || '';

          // Range indicator: e.g. "4:00 PM - 5:30 PM", "9:00 - 10:30", "12:00 PM to 1:00 PM"
          const isTimeRange = /[-–—to]+/i.test(timeCell) && /\d+/.test(timeCell);
          if (isTimeRange) {
            const { start, end } = parseTimeRange(timeCell);
            if (start && end) {
              events.push({
                summary: activityCell.replace(/^[🎯⏳💼🧠☕\s]+|[🎯⏳💼🧠☕\s]+$/g, '').trim(),
                start,
                end,
                description: `Activity: ${activityCell}\nMode: ${focusBreakCell}${checklistDesc}`
              });
            }
          }
        }
      } else {
        const listMatch = trimmed.match(/^[-*•]?\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\s*[-–—]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[:\s-]\s*(.+)/i);
        if (listMatch) {
          const timePart = listMatch[1];
          const activityPart = listMatch[2];
          const { start, end } = parseTimeRange(timePart);
          if (start && end) {
            events.push({
              summary: activityPart.replace(/^[🎯⏳💼🧠☕\s]+|[🎯⏳💼🧠☕\s]+$/g, '').trim(),
              start,
              end,
              description: `Activity: ${activityPart}${checklistDesc}`
            });
          }
        }
      }
    }

    if (events.length === 0) {
      const now = new Date();
      const startHour = now.getHours();
      const startMin = now.getMinutes();
      const endHour = (startHour + 3) % 24;
      events.push({
        summary: "HustleSync General Session",
        start: { hours: startHour, minutes: startMin },
        end: { hours: endHour, minutes: startMin },
        description: `Complete HustleSync Session Setup:${checklistDesc}`
      });
    }

    // 3. Generate standard .ics string
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dPrefix = `${year}${month}${day}`;

    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HustleSync//Productivity Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n') + '\r\n';

    events.forEach((evt, idx) => {
      const sTime = `${dPrefix}T${String(evt.start.hours).padStart(2, '0')}${String(evt.start.minutes).padStart(2, '0')}00`;
      const eTime = `${dPrefix}T${String(evt.end.hours).padStart(2, '0')}${String(evt.end.minutes).padStart(2, '0')}00`;
      
      icsContent += [
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${idx}@hustlesync`,
        `DTSTAMP:${timestamp}`,
        `SUMMARY:${cleanIcsText(evt.summary)}`,
        `DTSTART:${sTime}`,
        `DTEND:${eTime}`,
        `DESCRIPTION:${cleanIcsText(evt.description)}`,
        'END:VEVENT'
      ].join('\r\n') + '\r\n';
    });

    icsContent += 'END:VCALENDAR\r\n';

    // 4. Trigger download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hustlesync-schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainDump.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brainDump }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate plan');
      }

      const data = await response.json();
      setResult(data.result);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        date: Date.now(),
        brainDump,
        result: data.result,
        checkboxStates: {}
      };
      saveHistory([newItem, ...history]);
      setCurrentCheckboxes({});
      setActiveTab(newItem.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      setBrainDump(item.brainDump);
      setResult(item.result);
      setCurrentCheckboxes(item.checkboxStates || {});
      setActiveTab(id);
      setError(null);
    }
  };

  const startNew = () => {
    setBrainDump('');
    setResult(null);
    setCurrentCheckboxes({});
    setActiveTab('new');
    setError(null);
  };
  
  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    saveHistory(newHistory);
    if (activeTab === id) {
      startNew();
    }
  };

  return (
    <div className={`${theme} h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 flex overflow-hidden transition-colors duration-300`}>
      
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0 opacity-0 overflow-hidden'} transition-all duration-300 ease-in-out bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">HustleSync</h1>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors lg:hidden"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6">
          <div className="px-4 shrink-0">
            <button 
              onClick={startNew}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === 'new' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>

          <div className="pb-4">
            <h2 className="px-6 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              History
            </h2>
            
            {history.length === 0 ? (
              <div className="px-6 text-sm text-slate-500 italic">No previous plans yet.</div>
            ) : (
              <ul className="space-y-1 px-3 mt-1">
                {history.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => loadHistoryItem(item.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 group transition-colors ${
                        activeTab === item.id 
                          ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">
                          {item.brainDump.split('\n')[0].substring(0, 30) || 'Untitled Plan'}
                        </p>
                        <p className="text-xs opacity-60 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div 
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 dark:hover:text-red-400 rounded transition-opacity shrink-0"
                        onClick={(e) => deleteHistoryItem(e, item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="p-6 mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-4 shadow-sm">
             <p className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 font-bold mb-1.5 uppercase tracking-wider">Quick Reminder</p>
             <p className="text-xs leading-relaxed italic text-slate-600 dark:text-slate-300">"{quote}"</p>
          </div>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
              activeTab === 'profile' 
                ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 text-blue-700 dark:text-white' 
                : 'bg-transparent border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/80 hover:border-slate-300/50 dark:hover:border-slate-700/50 text-slate-600 dark:text-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm relative overflow-visible">
              {profile.photo ? (
                 <img src={profile.photo} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                 profile.name ? profile.name.charAt(0).toUpperCase() : 'U'
              )}
              <div className="absolute -bottom-1 -right-1 z-10 bg-slate-900 border-2 border-white dark:border-slate-800 text-[9px] font-bold text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {getLevelInfo(profile.exp).level}
              </div>
            </div>
            <div className="flex-1 overflow-hidden h-full flex flex-col justify-center">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200 leading-tight mb-1">{profile.name || 'User'}</p>
              
              <div className="w-full flex flex-col gap-1">
                 <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap leading-none">
                    <span>{getLevelInfo(profile.exp).title}</span>
                    <span>{getLevelInfo(profile.exp).currentLevelExp} / {getLevelInfo(profile.exp).expForNextLevel} EXP</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full" 
                      style={{ width: `${getLevelInfo(profile.exp).progress}%` }} 
                    />
                 </div>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
        {/* Decorative ambient background */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 mix-blend-multiply dark:mix-blend-screen transition-colors duration-300"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/4 mix-blend-multiply dark:mix-blend-screen transition-colors duration-300"></div>
        
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center shadow-sm shrink-0 relative z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="text-xl font-bold flex flex-wrap items-center whitespace-pre-wrap">
                {activeTab === 'new' ? (
                  <>
                    <span className="text-slate-800 dark:text-slate-100">{greeting.prefix}{profile.name ? ', ' : ''}</span>
                    {profile.name && <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{profile.name.split(' ')[0]}</span>}
                    <span className="text-slate-800 dark:text-slate-100">{greeting.suffix}</span>
                  </>
                ) : activeTab === 'profile' ? (
                  <span className="text-slate-800 dark:text-slate-100">Profile Settings ⚙️</span>
                ) : (
                  <span className="text-slate-800 dark:text-slate-100">Past Session 📅</span>
                )}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 italic">
                {activeTab === 'new' ? `"Relax, we'll tackle this one step at a time. Dump your tasks below."` : 
                 activeTab === 'profile' ? `Update your personal details here.` : 
                 `"Here is what we planned together."`}
              </p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-none"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
          {activeTab === 'profile' ? (
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in duration-300 transition-colors">
              <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {draftProfile.photo ? (
                      <img src={draftProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                        {draftProfile.name ? draftProfile.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Upload className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Profile Photo</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Upload a new photo, recommended 256 x 256px.</p>
                    <label className="inline-block px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors shadow-sm focus-within:ring-2 focus-within:ring-blue-600">
                      <span>Choose Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={draftProfile.name}
                    onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={draftProfile.dateOfBirth}
                    onChange={(e) => setDraftProfile({ ...draftProfile, dateOfBirth: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                  <select
                    value={draftProfile.gender}
                    onChange={(e) => setDraftProfile({ ...draftProfile, gender: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Occupation / Field of Study</label>
                  <input
                    type="text"
                    value={draftProfile.occupation}
                    onChange={(e) => setDraftProfile({ ...draftProfile, occupation: e.target.value })}
                    placeholder="e.g. Computer Science Student"
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-700 dark:text-slate-200"
                  />
                </div>
                {hasProfileChanges && (
                  <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start">
              
              {/* Left Column: Input */}
            <div className="lg:col-span-5 flex flex-col gap-6 relative">
              <div className="sticky top-0">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  
                  {/* Quick Templates */}
                  {activeTab === 'new' && (
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {QUICK_TEMPLATES.map((template, idx) => {
                        const Icon = template.icon;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleTemplateClick(template.text)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-700/50 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-all whitespace-nowrap shrink-0 group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <Icon className="w-3.5 h-3.5 text-blue-500/70 group-hover:text-blue-600 dark:text-blue-400/70 dark:group-hover:text-blue-400 transition-colors" />
                            {template.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="relative group">
                    {activeTab === 'new' && (
                       <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
                    )}
                    <textarea
                      className={`relative w-full h-[400px] p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200 leading-relaxed ${activeTab !== 'new' ? 'bg-slate-50 dark:bg-slate-950 opacity-80 cursor-not-allowed' : ''}`}
                      placeholder="e.g. I need to finish my thesis literature review by Friday, apply to 3 internships, do laundry, email Professor Smith, and try to exercise."
                      value={brainDump}
                      onChange={(e) => setBrainDump(e.target.value)}
                      disabled={loading || activeTab !== 'new'}
                    />
                  </div>

                  {activeTab === 'new' && (
                    <button
                      type="submit"
                      disabled={loading || !brainDump.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-blue-100 group-hover:text-white transition-colors" />
                          <span>Sync My Hustle</span>
                          <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </>
                      )}
                    </button>
                  )}
                  
                  {activeTab !== 'new' && (
                    <button
                      type="button"
                      onClick={startNew}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Start New Plan</span>
                    </button>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 text-sm flex items-start gap-3 transition-colors">
                      <div className="mt-0.5 font-bold">!</div>
                      <p>{error}</p>
                    </div>
                  )}
                </form>
                
                {activeTab !== 'new' && (
                  <div className="mt-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <PomodoroTimer taskName="Focus Session" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Output */}
            <div className="lg:col-span-7 pb-10">
              {result ? (
                (() => {
                  let checkboxCounter = 0;
                  return (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 fade-in duration-500 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50/50 dark:bg-blue-900/10 px-2.5 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/20">Action Plan</span>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">Personalized Hustle Schedule</h3>
                        </div>
                        <button
                          onClick={handleExportToCalendar}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition-all border border-blue-100 dark:border-blue-900/30 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
                        >
                          <CalendarCheck className="w-4 h-4" />
                          <span>Export to Calendar</span>
                        </button>
                      </div>
                      <div className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-slate-400 prose-h3:mt-8 prose-h3:mb-4 prose-h3:flex prose-h3:items-center prose-h3:gap-2 first:prose-h3:mt-0 prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-300 prose-ul:list-none prose-ul:pl-0 prose-li:my-2 prose-li:flex prose-li:items-start prose-li:gap-3 max-w-none text-slate-700 dark:text-slate-200">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h3: ({node, ...props}) => <h3 className="border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-500 dark:text-slate-400" {...props} />,
                            table: ({node, ...props}) => (
                              <div className="w-full my-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
                                <table className="min-w-full text-left divide-y divide-slate-200 dark:divide-slate-700 m-0" {...props} />
                              </div>
                            ),
                            thead: ({node, ...props}) => <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]" {...props} />,
                            th: ({node, ...props}) => <th className="px-4 py-3 whitespace-nowrap" {...props} />,
                            td: ({node, ...props}) => <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800/50" {...props} />,
                            tbody: ({node, ...props}) => <tbody className="bg-white dark:bg-slate-900" {...props} />,
                            input: ({node, checked, ...props}) => {
                              if (props.type === 'checkbox') {
                                 const currentIndex = checkboxCounter++;
                                 const isChecked = currentCheckboxes[currentIndex] ?? checked;
                                 return <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-blue-600 focus:ring-2 cursor-pointer flex-shrink-0" checked={isChecked} onChange={(e) => handleCheckboxChange(currentIndex, e.target.checked)} {...props} disabled={false} />
                              }
                              return <input defaultChecked={checked} {...props} />
                            },
                            li: ({node, ...props}) => {
                               return <li className="text-sm font-medium text-slate-700 dark:text-slate-300" {...props} />
                            }
                          }}
                        >
                          {result}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="h-[280px] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 shadow-sm transition-colors">
                    <div className="w-14 h-14 mb-3 bg-blue-50 dark:bg-blue-900/30 text-blue-400 dark:text-blue-500 rounded-xl flex items-center justify-center">
                      <ListTodo className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Your Plan Awaits</h3>
                    <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                      Write down your tasks on the left, and I'll generate a prioritized plan and schedule using AI.
                    </p>
                  </div>
                  
                  <ConsistencyHeatmap history={history} />
                </div>
              )}
            </div>
          </div>
          )}
        </main>
      </div>
    </div>
  );
}

