import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, ArrowRight, Loader2, ListTodo, History, Clock, FileText, Plus, Trash2, PanelLeftClose, PanelLeft, Settings, Sun, Moon, CalendarCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PomodoroTimer } from './components/PomodoroTimer';

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
    const newStates = { ...currentCheckboxes, [index]: isChecked };
    setCurrentCheckboxes(newStates);
    
    if (activeTab !== 'new' && activeTab !== 'profile') {
      const newHistory = history.map(item => 
        item.id === activeTab ? { ...item, checkboxStates: newStates } : item
      );
      saveHistory(newHistory);
    }
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{profile.name || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile.occupation || 'Student'}</p>
            </div>
            <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
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
              <h2 className="text-xl font-bold flex flex-wrap items-center gap-1.5 whitespace-pre-wrap">
                {activeTab === 'new' ? (
                  <>
                    <span className="text-slate-800 dark:text-slate-100">Welcome back</span>
                    {profile.name && <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{profile.name}</span>}
                    <span className="text-slate-800 dark:text-slate-100">. 🕊️</span>
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
                <div className="h-[400px] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 shadow-sm transition-colors">
                  <div className="w-16 h-16 mb-4 bg-blue-50 dark:bg-blue-900/30 text-blue-400 dark:text-blue-500 rounded-xl flex items-center justify-center">
                    <ListTodo className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Your Plan Awaits</h3>
                  <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    Write down your tasks on the left, and I'll generate a prioritized plan and schedule using AI.
                  </p>
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

