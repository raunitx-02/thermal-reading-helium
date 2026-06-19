import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import api from '../api';
import {
  LayoutDashboard,
  Train,
  Users,
  History,
  FileSpreadsheet,
  LogOut,
  Bell,
  Menu,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showConfirm } = useModal();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const superAdminLinks = [
    { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  const branchAdminLinks = [
    { to: '/branch-admin/dashboard', label: 'Team', icon: Users },
    { to: '/branch-admin/trains', label: 'Configure Rakes', icon: Train }
  ];

  const supervisorLinks = [
    { to: '/supervisor/dashboard', label: 'Inspections Logs', icon: LayoutDashboard },
    { to: '/supervisor/ground-engineers', label: 'Ground Team', icon: Users },
    { to: '/supervisor/assignments', label: 'Assign Rakes', icon: FileSpreadsheet },
    { to: '/supervisor/trains', label: 'Configure Rakes', icon: Train }
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
        <div className="flex items-center gap-3">
          <img src="/ir-logo.png" className="w-8 h-8 object-contain shrink-0" alt="IR logo" />
          <div className="flex flex-col">
            <h2 className="font-bold text-base text-slate-900 leading-tight">
              Indian Railways
            </h2>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block mt-0.5 leading-none">
              SAVE LIFE SMARTLY
            </span>
          </div>
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
              <span className="px-2 py-0.5 text-[10px] bg-red-600 text-white font-bold rounded-full">
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
          <div className="absolute bottom-28 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xl p-4 max-h-72 overflow-y-auto z-50 animate-ios-spring">
            <h3 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2 mb-3 flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600" /> Notifications
              </span>
              <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-950 hover:bg-slate-100 p-1 rounded-full transition">✕</button>
            </h3>
            {notifications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[11px] text-slate-400 font-medium">No recent notifications</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map(n => {
                  const isAlert = n.type === 'alert' || n.title?.toLowerCase().includes('critical') || n.title?.toLowerCase().includes('breach');
                  const isSuccess = n.message?.toLowerCase().includes('success') || n.message?.toLowerCase().includes('all clear');
                  
                  let bgClass = 'bg-blue-50/30 border-blue-100/50';
                  let iconColor = 'text-blue-500';
                  let badgeColor = 'bg-blue-50 border border-blue-100';
                  let Icon = Info;
                  
                  if (isAlert) {
                    bgClass = 'bg-red-50/30 border-red-100/50';
                    iconColor = 'text-red-500';
                    badgeColor = 'bg-red-50 border border-red-100';
                    Icon = AlertTriangle;
                  } else if (isSuccess) {
                    bgClass = 'bg-emerald-50/30 border-emerald-100/50';
                    iconColor = 'text-emerald-500';
                    badgeColor = 'bg-emerald-50 border border-emerald-100';
                    Icon = CheckCircle2;
                  }
                  
                  return (
                    <div 
                      key={n.id} 
                      className={`p-2.5 rounded-xl border text-[10px] transition-all hover:bg-slate-50/80 flex gap-2.5 ${bgClass} ${n.is_read ? 'opacity-65' : 'font-medium shadow-sm'}`}
                    >
                      <div className={`p-1.5 rounded-lg ${badgeColor} shrink-0 flex items-center justify-center h-7 w-7`}>
                        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <p className="font-bold text-slate-900 truncate">{n.title}</p>
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1 animate-pulse" />
                          )}
                        </div>
                        <p className="text-slate-600 mt-0.5 leading-normal text-[9px] break-words">{n.message}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-[8px] text-slate-400 font-semibold">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(n.created_at * 1000).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              <p className="text-xs font-bold text-slate-900 truncate" title={user?.name}>
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {user?.role === 'branch_admin' ? 'Admin' : user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'ground_engineer' ? 'Ground Engineer' : user?.role}
              </p>
            </div>
          </div>


        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar - Rendered strictly on mobile viewports */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 text-slate-900 w-full z-45 shrink-0">
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
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full" />
              )}
            </button>
          </div>
        ) : (
          <div className="w-5" />
        )}
      </div>

      {/* Desktop Sidebar wrapper - Rendered strictly on desktop viewports */}
      <aside className="hidden md:block w-64 h-screen shrink-0 sticky top-0 overflow-y-auto z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobile && mobileOpen && (
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
