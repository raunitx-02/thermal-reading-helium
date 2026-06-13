import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import {
  LayoutDashboard,
  Train,
  AlertOctagon,
  Users,
  TrendingUp,
  FileBarChart2,
  Settings,
  History,
  FileSpreadsheet,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) setNotifications(res.data.data);
      } catch (_) {}
    };
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
    await logout();
    navigate('/login');
  };

  const superAdminLinks = [
    { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  const branchAdminLinks = [
    { to: '/branch-admin/dashboard', label: 'Supervisors', icon: Users },
    { to: '/branch-admin/trains', label: 'Configure Trains', icon: Train }
  ];

  const supervisorLinks = [
    { to: '/supervisor/dashboard', label: 'Inspections Logs', icon: LayoutDashboard },
    { to: '/supervisor/ground-engineers', label: 'Ground Engineers', icon: Users },
    { to: '/supervisor/assignments', label: 'Assign Inspections', icon: FileSpreadsheet }
  ];

  const groundEngineerLinks = [
    { to: '/ground-engineer/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/ground-engineer/history', label: 'Inspection History', icon: History }
  ];

  let links = [];
  if (user?.role === 'super_admin') links = superAdminLinks;
  else if (user?.role === 'branch_admin') links = branchAdminLinks;
  else if (user?.role === 'supervisor') links = supervisorLinks;
  else if (user?.role === 'ground_engineer') links = groundEngineerLinks;

  // Generate initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-700 relative">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <img src="/ir-logo.png" className="w-8 h-8 object-contain" alt="IR logo" />
            Indian Railways
          </h2>
          <span className="text-[10px] text-blue-650 text-blue-600 font-bold uppercase tracking-wider block mt-0.5">
            Save Life Smartly
          </span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-500 hover:text-slate-900">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600 shadow-sm shadow-blue-100/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <link.icon className="w-5 h-5 shrink-0" />
              <span>{link.label}</span>
            </div>
            {link.badgeCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-red-655 bg-red-600 text-white font-bold rounded-full">
                {link.badgeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer Profile & Notification Bell & Logout */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 relative">
        {/* Floating notifications above footer */}
        {showNotif && (
          <div className="absolute bottom-28 left-4 right-4 bg-white border border-slate-200 rounded-xl shadow-xl p-4 max-h-64 overflow-y-auto z-50">
            <h3 className="font-semibold text-xs text-slate-900 border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
              <span>Notifications</span>
              <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-950">✕</button>
            </h3>
            {notifications.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-4">No recent notifications</p>
            ) : (
              <div className="space-y-2.5">
                {notifications.map(n => (
                  <div key={n.id} className={`p-2 rounded-lg text-[10px] border ${n.is_read ? 'opacity-65 bg-slate-50/50 border-slate-100' : 'bg-blue-50/30 border-blue-100 text-slate-900'}`}>
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="text-slate-600 mt-0.5">{n.message}</p>
                    <span className="text-[8px] text-slate-400 mt-1 block">
                      {new Date(n.created_at * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* User profile row with Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-905 text-slate-900 truncate" title={user?.name}>
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          {/* Action buttons row */}
          {user?.role !== 'super_admin' && (
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
              <span className="text-[10px] text-slate-400 font-semibold">Active Session</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setShowNotif(!showNotif);
                    if (!showNotif) handleMarkRead();
                  }}
                  className={`p-2 border border-slate-200 text-slate-550 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition relative shadow-sm ${showNotif ? 'bg-slate-100' : 'bg-white'}`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full" />
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-100 text-slate-500 hover:text-red-605 hover:text-red-600 rounded-lg border border-slate-200 transition bg-white shadow-sm"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="flex md:hidden items-center justify-between bg-white border-b border-slate-200 px-6 py-4 text-slate-900">
        <button onClick={() => setMobileOpen(true)} className="text-slate-500 hover:text-slate-900">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-sm flex items-center gap-1.5">
          <img src="/ir-logo.png" className="w-5 h-5 object-contain" alt="IR logo" />
          Indian Railways
        </span>
        {user?.role !== 'super_admin' ? (
          <div className="relative">
            <button onClick={() => { setShowNotif(!showNotif); handleMarkRead(); }} className="relative text-slate-500 hover:text-slate-900">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-655 bg-red-600 rounded-full" />
              )}
            </button>
          </div>
        ) : (
          <div className="w-5" /> // Empty placeholder to balance flex row
        )}
      </div>

      {/* Desktop Sidebar wrapper */}
      <aside className="hidden md:block w-64 h-screen shrink-0 sticky top-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 max-w-xs h-full">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
