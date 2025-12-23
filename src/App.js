import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle, Circle, Plus, Trash2, TrendingUp, Calendar, Bell, Home, Target, Award, Download, Moon, Sun, Zap, Clock, X, Edit2, Save } from 'lucide-react';

const style = document.createElement('style');
style.textContent = `
  @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
  
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
  
  .dark {
    color-scheme: dark;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  .dark ::-webkit-scrollbar-track {
    background: #374151;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;
document.head.appendChild(style);

const DB_NAME = 'HabitTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'habits';

class HabitDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async getAll() {
    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(habit) {
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.add(habit);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(habit) {
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.put(habit);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id) {
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const CATEGORIES = [
  { name: 'Health', color: '#10b981', icon: '💪' },
  { name: 'Productivity', color: '#3b82f6', icon: '⚡' },
  { name: 'Learning', color: '#8b5cf6', icon: '📚' },
  { name: 'Mindfulness', color: '#ec4899', icon: '🧘' },
  { name: 'Social', color: '#f59e0b', icon: '👥' },
  { name: 'Other', color: '#6b7280', icon: '📌' }
];

const App = () => {
  const [habits, setHabits] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Health');
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const initDB = async () => {
      try {
        const habitDB = new HabitDB();
        await habitDB.init();
        setDb(habitDB);
        const savedHabits = await habitDB.getAll();
        setHabits(savedHabits);
        if ('Notification' in window && Notification.permission === 'granted') {
          setNotificationsEnabled(true);
        }
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };
    initDB();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        showToast('Notifications enabled!');
      }
    }
  };

  const installPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      showToast('App installed!');
    }
  };

  const addHabit = async () => {
    if (newHabitName.trim() && db) {
      try {
        const newHabit = {
          name: newHabitName.trim(),
          category: newHabitCategory,
          completionDates: {},
          createdAt: new Date().toISOString()
        };
        const id = await db.add(newHabit);
        setHabits([...habits, { ...newHabit, id }]);
        setNewHabitName('');
        setShowAddModal(false);
        showToast('Habit added!');
      } catch (error) {
        showToast('Failed to add', 'error');
      }
    }
  };

  const updateHabit = async () => {
    if (editingHabit && db) {
      try {
        await db.update(editingHabit);
        setHabits(habits.map(h => h.id === editingHabit.id ? editingHabit : h));
        setEditingHabit(null);
        showToast('Updated!');
      } catch (error) {
        showToast('Update failed', 'error');
      }
    }
  };

  const deleteHabit = async (id) => {
    if (db && confirm('Delete this habit?')) {
      try {
        await db.delete(id);
        setHabits(habits.filter(h => h.id !== id));
        setEditingHabit(null);
        showToast('Deleted');
      } catch (error) {
        showToast('Delete failed', 'error');
      }
    }
  };

  const toggleDay = async (habitId, dateStr) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !db) return;
    try {
      const updatedHabit = {
        ...habit,
        completionDates: {
          ...habit.completionDates,
          [dateStr]: !habit.completionDates[dateStr]
        }
      };
      await db.update(updatedHabit);
      setHabits(habits.map(h => h.id === habitId ? updatedHabit : h));
      if (!habit.completionDates[dateStr]) {
        showToast('Great job! 🎉');
      }
    } catch (error) {
      showToast('Update failed', 'error');
    }
  };

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const getStreak = (habit) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (habit.completionDates[dateStr]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getBestStreak = (habit) => {
    const dates = Object.keys(habit.completionDates).filter(d => habit.completionDates[d]).sort();
    let bestStreak = 0;
    let currentStreak = 0;
    let lastDate = null;
    dates.forEach(dateStr => {
      const currentDate = new Date(dateStr);
      if (lastDate && (currentDate - lastDate) / 86400000 === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      lastDate = currentDate;
    });
    return bestStreak;
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const getChartData = () => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const completed = habits.reduce((sum, h) => sum + (h.completionDates[dateStr] ? 1 : 0), 0);
      last30Days.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        completed,
        total: habits.length
      });
    }
    return last30Days;
  };

  const getCategoryData = () => {
    const categoryCount = {};
    habits.forEach(h => {
      const cat = h.category || 'Other';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
      color: CATEGORIES.find(c => c.name === name)?.color || '#6b7280'
    }));
  };

  const getCompletionRate = () => {
    const last30Days = getChartData();
    const totalPossible = last30Days.reduce((sum, day) => sum + day.total, 0);
    const totalCompleted = last30Days.reduce((sum, day) => sum + day.completed, 0);
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  };

  const getTodayStats = () => {
    const todayStr = getTodayString();
    const completed = habits.reduce((sum, h) => sum + (h.completionDates[todayStr] ? 1 : 0), 0);
    return { completed, total: habits.length };
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-2xl font-semibold text-purple-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`px-6 py-4 rounded-xl shadow-2xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white font-medium`}>
              {toast.message}
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingHabit) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {editingHabit ? 'Edit Habit' : 'New Habit'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingHabit(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    value={editingHabit ? editingHabit.name : newHabitName}
                    onChange={(e) => editingHabit 
                      ? setEditingHabit({...editingHabit, name: e.target.value})
                      : setNewHabitName(e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Morning Exercise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => editingHabit
                          ? setEditingHabit({...editingHabit, category: cat.name})
                          : setNewHabitCategory(cat.name)
                        }
                        className={`p-3 rounded-lg border-2 transition ${
                          (editingHabit ? editingHabit.category : newHabitCategory) === cat.name
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{cat.icon}</div>
                        <div className="text-xs font-medium">{cat.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingHabit(null);
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingHabit ? updateHabit : addHabit}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg"
                  >
                    {editingHabit ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Habit Tracker Pro</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Build better habits daily</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {installPrompt && (
                  <button onClick={installPWA} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Install</span>
                  </button>
                )}
                {!notificationsEnabled && (
                  <button onClick={requestNotifications} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Bell className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                  {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b dark:border-gray-700 sticky top-20 z-30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { id: 'home', icon: Home, label: 'Dashboard' },
                { id: 'habits', icon: CheckCircle, label: 'Habits' },
                { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                { id: 'calendar', icon: Calendar, label: 'Calendar' }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-purple-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Today</p>
                      <p className="text-4xl font-bold mt-2">{getTodayStats().completed}/{getTodayStats().total}</p>
                      <p className="text-purple-200 text-sm mt-1">
                        {getTodayStats().total > 0 ? `${Math.round((getTodayStats().completed / getTodayStats().total) * 100)}%` : '0%'}
                      </p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-purple-300 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Habits</p>
                      <p className="text-4xl font-bold mt-2">{habits.length}</p>
                      <p className="text-blue-200 text-sm mt-1">Active</p>
                    </div>
                    <Target className="w-12 h-12 text-blue-300 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-green-100 text-sm">30-Day</p>
                      <p className="text-4xl font-bold mt-2">{getCompletionRate()}%</p>
                      <p className="text-green-200 text-sm mt-1">Rate</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-300 opacity-50" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Best</p>
                      <p className="text-4xl font-bold mt-2">{habits.length > 0 ? Math.max(...habits.map(h => getBestStreak(h))) : 0}</p>
                      <p className="text-yellow-200 text-sm mt-1">Streak</p>
                    </div>
                    <Zap className="w-12 h-12 text-yellow-300 opacity-50" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                    <Clock className="w-6 h-6 mr-2 text-purple-600" />
                    Today's Habits
                  </h2>
                  <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <Plus className="w-5 h-5" />
                    <span>Add</span>
                  </button>
                </div>
                
                {habits.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No habits yet!</p>
                    <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition">
                      Create Your First Habit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {habits.map(habit => {
                      const todayStr = getTodayString();
                      const isCompleted = habit.completionDates[todayStr];
                      const category = CATEGORIES.find(c => c.name === habit.category) || CATEGORIES[5];
                      return (
                        <div
                          key={habit.id}
                          onClick={() => toggleDay(habit.id, todayStr)}
                          className={`rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] ${
                            isCompleted
                              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                              : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-300'
                          }`}
                        >
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`p-3 rounded-xl ${isCompleted ? 'bg-green-500' : 'bg-white dark:bg-gray-600'}`}>
                                {isCompleted ? <CheckCircle className="w-6 h-6 text-white" /> : <Circle className="w-6 h-6 text-gray-400" />}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl">{category.icon}</span>
                                  <span className="font-semibold text-gray-800 dark:text-white">{habit.name}</span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  🔥 {getStreak(habit)} day streak
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingHabit(habit);
                              }}
                              className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition"
                            >
                              <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Habits</h2>
                <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition">
                  <Plus className="w-5 h-5 inline mr-2" />
                  New Habit
                </button>
              </div>

              {habits.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                  <Target className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No habits to manage</p>
                  <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition">
                    Create Your First Habit
                  </button>
                </div>
              ) : (
                habits.map(habit => {
                  const category = CATEGORIES.find(c => c.name === habit.category) || CATEGORIES[5];
                  return (
                    <div key={habit.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{habit.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{habit.category}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => setEditingHabit(habit)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => deleteHabit(habit.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span className="text-gray-700 dark:text-gray-300">{getStreak(habit)} days</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-orange-500" />
                          <span className="text-gray-700 dark:text-gray-300">Best: {getBestStreak(habit)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {getLast7Days().map(date => {
                          const dateStr = date.toISOString().split('T')[0];
                          const isCompleted = habit.completionDates[dateStr];
                          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                          return (
                            <button
                              key={dateStr}
                              onClick={() => toggleDay(habit.id, dateStr)}
                              className={`p-3 rounded-lg text-center transition ${
                                isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              <div className="text-xs font-medium">{dayName}</div>
                              <div className="text-lg font-bold">{date.getDate()}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">30-Day Completion Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="completed" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
                    <Line type="monotone" dataKey="total" stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Habits by Category</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={getCategoryData()} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {getCategoryData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Completion by Habit</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={habits.map(h => ({
                      name: h.name.length > 12 ? h.name.substring(0, 12) + '...' : h.name,
                      completions: Object.keys(h.completionDates).filter(d => h.completionDates[d]).length,
                      streak: getStreak(h)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="completions" fill="#8b5cf6" name="Total Completions" />
                      <Bar dataKey="streak" fill="#10b981" name="Current Streak" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-bold text-gray-600 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getCalendarDays().map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }
                  
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dateStr = date.toISOString().split('T')[0];
                  const today = new Date();
                  const isToday = date.toDateString() === today.toDateString();
                  const isFuture = date > today;
                  
                  const completed = habits.reduce((sum, h) => sum + (h.completionDates[dateStr] ? 1 : 0), 0);
                  const total = habits.length;
                  const percentage = total > 0 ? (completed / total) * 100 : 0;
                  
                  return (
                    <div
                      key={day}
                      className={`aspect-square p-2 rounded-lg text-center transition ${
                        isFuture 
                          ? 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed' 
                          : percentage === 100 
                            ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' 
                            : percentage >= 50 
                              ? 'bg-yellow-400 text-white cursor-pointer hover:bg-yellow-500' 
                              : percentage > 0 
                                ? 'bg-orange-400 text-white cursor-pointer hover:bg-orange-500' 
                                : 'bg-gray-100 dark:bg-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600'
                      } ${isToday ? 'ring-2 ring-purple-600' : ''}`}
                    >
                      <div className="font-bold text-lg">{day}</div>
                      {!isFuture && total > 0 && (
                        <div className="text-xs mt-1">{Math.round(percentage)}%</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">100%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">50-99%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">1-49%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">0%</span>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t dark:border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
            <p className="font-medium">Habit Tracker Pro - Build Better Habits Every Day</p>
            <p className="text-sm mt-1">Powered by IndexedDB • Works Offline • PWA Ready</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
