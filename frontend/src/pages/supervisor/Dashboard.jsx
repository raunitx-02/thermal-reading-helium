import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Users, FileText, CheckSquare, Calendar, Download, RefreshCw, Eye, Search, Bell, LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showConfirm } = useModal();
  const getCacheOrFallback = (key, fallback) => {
    try {
      const email = user?.email || 'guest';
      const cache = localStorage.getItem(`cache_${email}_${key}`);
      return cache ? JSON.parse(cache) : fallback;
    } catch (_) {
      return fallback;
    }
  };

  const [engineers, setEngineers] = useState(() => getCacheOrFallback('engineers', []));
  const [trains, setTrains] = useState(() => getCacheOrFallback('trains', []));
  const [inspections, setInspections] = useState(() => getCacheOrFallback('inspections', []));
  const [loading, setLoading] = useState(() => {
    const cachedEngineers = getCacheOrFallback('engineers', []);
    const cachedTrains = getCacheOrFallback('trains', []);
    const cachedInspections = getCacheOrFallback('inspections', []);
    return !(cachedEngineers.length > 0 || cachedTrains.length > 0 || cachedInspections.length > 0);
  });

  // Time filter state
  const [timeFilter, setTimeFilter] = useState('today'); // 'today', 'weekly', 'monthly', 'custom'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (!showNotif) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.notif-container')) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotif]);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) setNotifications(res.data.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (_) {}
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      'Confirm Logout',
      'Are you sure you want to log out of the system?',
      'confirm',
      'Yes, Logout',
      'Cancel'
    );
    if (!confirmed) return;
    await logout();
    navigate('/login');
  };

  const fetchSupervisorData = async () => {
    const hasCache = engineers.length > 0 || trains.length > 0 || inspections.length > 0;
    if (!hasCache) {
      setLoading(true);
    }
    try {
      const [engRes, trainRes, inspectRes] = await Promise.all([
        api.get(`/users?role=ground_engineer&parent_id=${user.id}`),
        api.get('/trains'),
        api.get('/sessions?status=submitted')
      ]);

      const email = user?.email || 'guest';
      if (engRes.data.success) {
        setEngineers(engRes.data.data);
        localStorage.setItem(`cache_${email}_engineers`, JSON.stringify(engRes.data.data));
      }
      if (trainRes.data.success) {
        setTrains(trainRes.data.data);
        localStorage.setItem(`cache_${email}_trains`, JSON.stringify(trainRes.data.data));
      }
      if (inspectRes.data.success) {
        setInspections(inspectRes.data.data);
        localStorage.setItem(`cache_${email}_inspections`, JSON.stringify(inspectRes.data.data));
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  // Compute KPI statistics dynamically
  const todayStr = new Date().toISOString().split('T')[0];
  const inspectedToday = inspections.filter(i => i.inspection_date === todayStr).length;
  const leftToday = Math.max(0, trains.length - inspectedToday);

  // Filter completed inspections based on range
  const getFilteredInspections = () => {
    const now = new Date();
    return inspections.filter(i => {
      const matchSearch = i.train_number.includes(searchTerm) || i.train_name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      const date = new Date(i.inspection_date);
      if (timeFilter === 'today') {
        return i.inspection_date === todayStr;
      } else if (timeFilter === 'weekly') {
        const diff = (now - date) / (1000 * 3600 * 24);
        return diff <= 7;
      } else if (timeFilter === 'monthly') {
        const diff = (now - date) / (1000 * 3600 * 24);
        return diff <= 30;
      } else if (timeFilter === 'custom') {
        if (customRange.from && customRange.to) {
          return i.inspection_date >= customRange.from && i.inspection_date <= customRange.to;
        } else if (customRange.from) {
          return i.inspection_date === customRange.from;
        }
        return true;
      }
      return true;
    });
  };

  const downloadSessionReport = (sessionId, trainNo) => {
    const url = `${api.defaults.baseURL || 'http://localhost:5050/api'}/reports/session/${sessionId}`;
    // Fetch with authorization header and download blob
    const token = localStorage.getItem('accessToken');
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `inspection_report_${trainNo}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(() => alert('Failed to download report'));
  };

  const filteredInspections = getFilteredInspections();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor, Review, Approve Smartly</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1 shadow-sm">
            {['today', 'weekly', 'monthly'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${timeFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {filter}
              </button>
            ))}
            <button
              onClick={() => setShowCalendar(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1 ${timeFilter === 'custom' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <span>
                {timeFilter === 'custom'
                  ? customRange.to && customRange.from !== customRange.to
                    ? `${customRange.from} to ${customRange.to}`
                    : customRange.from || 'Custom Date'
                  : 'Custom Date'}
              </span>
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={fetchSupervisorData} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm" title="Refresh List">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative notif-container">
            <button
              onClick={() => {
                setShowNotif(!showNotif);
                if (!showNotif) handleMarkRead();
              }}
              className={`p-2.5 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition relative shadow-sm ${showNotif ? 'bg-slate-100' : 'bg-white'}`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full" />
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 max-h-80 overflow-y-auto z-50">
                <h3 className="font-semibold text-xs text-slate-900 border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
                  <span>Notifications</span>
                  <button onClick={() => setShowNotif(false)} className="text-slate-455 hover:text-slate-950">✕</button>
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">No recent notifications</p>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2 rounded-lg text-[10px] border ${n.is_read ? 'opacity-65 bg-slate-50/50 border-slate-100' : 'bg-blue-50/30 border-blue-100 text-slate-900'}`}>
                        <p className="font-semibold text-slate-900">{n.title}</p>
                        <p className="text-slate-650 mt-0.5">{n.message}</p>
                        <span className="text-[8px] text-slate-405 mt-1 block">
                          {new Date(n.created_at * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="p-2.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200 transition bg-white shadow-sm"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Ground Engineers</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-blue-50 text-blue-600 border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{engineers.length}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Inspected Today</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-emerald-50 text-emerald-600 border-emerald-100">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{inspectedToday}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Inspection Left Today</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-amber-50 text-amber-600 border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{leftToday}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Active Rakes</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-purple-50 text-purple-600 border-purple-100">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{trains.length}</h3>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">
            Inspection Submissions ({timeFilter === 'custom' 
              ? customRange.to && customRange.from !== customRange.to
                ? `${customRange.from} to ${customRange.to}`
                : customRange.from
              : timeFilter.toUpperCase()})
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by rake no. or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Loading inspection reports...</p>
        ) : filteredInspections.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No inspections logged for this period</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Rake Number</th>
                  <th className="p-4">Rake Type</th>
                  <th className="p-4">Inspection Date</th>
                  <th className="p-4">Completed By (Ground Engineer)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((ins) => (
                  <tr key={ins.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-blue-600">{ins.train_number}</td>
                    <td className="p-4 font-bold text-slate-900">{ins.train_name}</td>
                    <td className="p-4 text-slate-500 font-semibold">{ins.inspection_date}</td>
                    <td className="p-4 font-bold text-blue-600">
                      {ins.inspector_name || 'Ground Engineer'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Submitted
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => downloadSessionReport(ins.id, ins.train_number)}
                        className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 w-80 max-w-full animate-ios-spring space-y-4 relative">
            <button 
              onClick={() => setShowCalendar(false)} 
              className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-650 transition rounded-full p-1.5 shadow-md flex items-center justify-center z-10"
              title="Close Calendar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800">
                {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  className="p-1 hover:bg-slate-100 rounded transition text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className="p-1 hover:bg-slate-100 rounded transition text-slate-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Label Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const firstDayIndex = new Date(year, month, 1).getDay();
                const totalDays = new Date(year, month + 1, 0).getDate();
                
                const cells = [];
                // Pad previous month days
                for (let i = 0; i < firstDayIndex; i++) {
                  cells.push(<div key={`pad-${i}`} className="py-2" />);
                }
                // Month days
                for (let d = 1; d <= totalDays; d++) {
                  const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const isFrom = customRange.from === dayStr;
                  const isTo = customRange.to === dayStr;
                  const isInRange = customRange.from && customRange.to && dayStr > customRange.from && dayStr < customRange.to;
                  const isToday = todayStr === dayStr;

                  let dayStyle = 'text-slate-755 hover:bg-slate-100';
                  if (isFrom || isTo) {
                    dayStyle = 'bg-blue-600 text-white shadow-md rounded-full font-bold';
                  } else if (isInRange) {
                    dayStyle = 'bg-blue-50 text-blue-700 font-bold rounded-none';
                  } else if (isToday) {
                    dayStyle = 'border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full';
                  } else {
                    dayStyle += ' rounded-full';
                  }

                  cells.push(
                    <button
                      key={`day-${d}`}
                      type="button"
                      onClick={() => {
                        if (!customRange.from || (customRange.from && customRange.to)) {
                          setCustomRange({ from: dayStr, to: '' });
                        } else {
                          if (dayStr < customRange.from) {
                            setCustomRange({ from: dayStr, to: '' });
                          } else {
                            setCustomRange(prev => ({ ...prev, to: dayStr }));
                            setTimeFilter('custom');
                            setShowCalendar(false);
                          }
                        }
                      }}
                      className={`py-1.5 text-xs font-semibold transition ${dayStyle}`}
                    >
                      {d}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>

            {/* Calendar Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setCustomRange({ from: '', to: '' });
                  setTimeFilter('today');
                  setShowCalendar(false);
                }}
                className="text-slate-500 hover:text-slate-900 font-bold transition uppercase tracking-wider"
              >
                Reset
              </button>
              {customRange.from && !customRange.to && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomRange(prev => ({ ...prev, to: prev.from }));
                    setTimeFilter('custom');
                    setShowCalendar(false);
                  }}
                  className="bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg font-extrabold hover:bg-blue-100 transition uppercase tracking-wider"
                >
                  Apply Single Day
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
