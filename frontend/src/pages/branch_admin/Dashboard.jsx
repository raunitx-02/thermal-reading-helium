import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Users, UserPlus, RefreshCw, Trash2, Edit, Search, ShieldCheck, ChevronDown, Check, Bell, LogOut, Eye, EyeOff, AlertTriangle, CheckCircle2, Clock, Info, Power } from 'lucide-react';

const RAILWAY_ZONES_PARSED = [
  { acronym: 'CR', name: 'Central Railway', division: 'Mumbai', value: 'Central Railway (CR) - Mumbai' },
  { acronym: 'ECR', name: 'East Central Railway', division: 'Hajipur', value: 'East Central Railway (ECR) - Hajipur' },
  { acronym: 'ECoR', name: 'East Coast Railway', division: 'Bhubaneswar', value: 'East Coast Railway (ECoR) - Bhubaneswar' },
  { acronym: 'ER', name: 'Eastern Railway', division: 'Kolkata', value: 'Eastern Railway (ER) - Kolkata' },
  { acronym: 'NCR', name: 'North Central Railway', division: 'Prayagraj', value: 'North Central Railway (NCR) - Prayagraj' },
  { acronym: 'NER', name: 'North Eastern Railway', division: 'Gorakhpur', value: 'North Eastern Railway (NER) - Gorakhpur' },
  { acronym: 'NFR', name: 'Northeast Frontier Railway', division: 'Maligaon, Guwahati', value: 'Northeast Frontier Railway (NFR) - Maligaon, Guwahati' },
  { acronym: 'NR', name: 'Northern Railway', division: 'New Delhi', value: 'Northern Railway (NR) - New Delhi' },
  { acronym: 'NWR', name: 'North Western Railway', division: 'Jaipur', value: 'North Western Railway (NWR) - Jaipur' },
  { acronym: 'SCR', name: 'South Central Railway', division: 'Secunderabad', value: 'South Central Railway (SCR) - Secunderabad' },
  { acronym: 'SECR', name: 'South East Central Railway', division: 'Bilaspur', value: 'South East Central Railway (SECR) - Bilaspur' },
  { acronym: 'SER', name: 'South Eastern Railway', division: 'Garden Reach, Kolkata', value: 'South Eastern Railway (SER) - Garden Reach, Kolkata' },
  { acronym: 'SWR', name: 'South Western Railway', division: 'Hubballi', value: 'South Western Railway (SWR) - Hubballi' },
  { acronym: 'SR', name: 'Southern Railway', division: 'Chennai', value: 'Southern Railway (SR) - Chennai' },
  { acronym: 'WCR', name: 'West Central Railway', division: 'Jabalpur', value: 'West Central Railway (WCR) - Jabalpur' },
  { acronym: 'WR', name: 'Western Railway', division: 'Mumbai Central', value: 'Western Railway (WR) - Mumbai Central' },
  { acronym: 'Metro', name: 'Metro Railway, Kolkata', division: 'Kolkata', value: 'Metro Railway, Kolkata - Kolkata' },
  { acronym: 'SCoR', name: 'South Coast Railway', division: 'Visakhapatnam', value: 'South Coast Railway (SCoR) - Visakhapatnam' }
];

export default function BranchAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const [staff, setStaff] = useState(() => {
    try {
      const cacheKey = user?.id ? `cache_branch_admin_staff_${user.id}` : 'cache_branch_admin_staff';
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cacheKey = user?.id ? `cache_branch_admin_staff_${user.id}` : 'cache_branch_admin_staff';
      const cached = localStorage.getItem(cacheKey);
      return !cached || JSON.parse(cached).length === 0;
    } catch (_) {
      return true;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    try {
      const cacheKey = user?.id ? `cache_branch_admin_notifications_${user.id}` : 'cache_branch_admin_notifications';
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [showNotif, setShowNotif] = useState(false);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('supervisor');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Co-admin location/zone states (mimicking super admin)
  const [states, setStates] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_states`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [districts, setDistricts] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Searchable dropdown states
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const [zoneSearchText, setZoneSearchText] = useState('');

  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearchText, setStateSearchText] = useState('');

  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [districtSearchText, setDistrictSearchText] = useState('');

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

  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.role-dropdown-container')) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [roleDropdownOpen]);

  useEffect(() => {
    if (!zoneDropdownOpen && !stateDropdownOpen && !districtDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (zoneDropdownOpen && !e.target.closest('.zone-dropdown-container')) {
        setZoneDropdownOpen(false);
      }
      if (stateDropdownOpen && !e.target.closest('.state-dropdown-container')) {
        setStateDropdownOpen(false);
      }
      if (districtDropdownOpen && !e.target.closest('.district-dropdown-container')) {
        setDistrictDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [zoneDropdownOpen, stateDropdownOpen, districtDropdownOpen]);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        const cacheKey = user?.id ? `cache_branch_admin_notifications_${user.id}` : 'cache_branch_admin_notifications';
        localStorage.setItem(cacheKey, JSON.stringify(res.data.data));
      }
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

  const fetchStates = async () => {
    try {
      const res = await api.get('/geo/states');
      if (res.data.success) {
        setStates(res.data.data);
        const email = user?.email || 'guest';
        localStorage.setItem(`cache_${email}_states`, JSON.stringify(res.data.data));
      }
    } catch (_) {}
  };

  const fetchDistricts = async (state) => {
    if (!state) {
      setDistricts([]);
      return;
    }
    try {
      const res = await api.get(`/geo/districts?state=${encodeURIComponent(state)}`);
      if (res.data.success) setDistricts(res.data.data);
    } catch (_) {}
  };

  const fetchStaff = async () => {
    const cacheKey = user?.id ? `cache_branch_admin_staff_${user.id}` : 'cache_branch_admin_staff';
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData || JSON.parse(cachedData).length === 0) {
      setLoading(true);
    }
    try {
      // Fetch both supervisors and ground engineers created by this branch admin
      const res = await api.get(`/users?parent_id=${user.id}`);
      if (res.data.success) {
        setStaff(res.data.data);
        localStorage.setItem(cacheKey, JSON.stringify(res.data.data));
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
    fetchStates();
  }, []);

  useEffect(() => {
    fetchDistricts(selectedState);
    setSelectedCity('');
  }, [selectedState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      showAlert('Required Fields', 'Please fill out all required fields', 'warning');
      return;
    }

    const name = `${firstName} ${lastName}`.trim();

    try {
      if (editingSupervisor) {
        const res = await api.put(`/users/${editingSupervisor.id}`, {
          name,
          email,
          password: password || undefined,
          phone,
          role,
          employee_id: null,
          division: user.division || user.city || 'Mumbai',
          zone: user.zone || null,
          state: user.state || null,
          city: user.city || null
        });
        if (res.data.success) {
          showAlert('Success', 'Team member updated successfully', 'success');
          setShowModal(false);
          fetchStaff();
        }
      } else {
        const res = await api.post('/users', {
          name,
          email,
          role,
          division: user.division || user.city || 'Mumbai',
          zone: user.zone || null,
          state: user.state || null,
          city: user.city || null,
          phone,
          employee_id: null,
          parent_id: user.id
        });
        if (res.data.success) {
          showAlert('Success', 'Team member created successfully. Activation invite sent to email.', 'success');
          setShowModal(false);
          fetchStaff();
        }
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const startEdit = (member) => {
    setEditingSupervisor(member);
    const names = member.name.split(' ');
    setFirstName(names[0] || '');
    setLastName(names.slice(1).join(' ') || '');
    setEmail(member.email);
    setPassword('');
    setShowPassword(false);
    setPhone(member.phone || '');
    setRole(member.role || 'supervisor');
    setBranchName(member.division || '');
    setSelectedZone(member.zone || '');
    setSelectedState(member.state || '');
    setSelectedCity(member.city || '');
    setRoleDropdownOpen(false);
    setShowModal(true);
  };

  const startAdd = () => {
    setEditingSupervisor(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setPhone('');
    setRole('supervisor');
    setBranchName('');
    setSelectedZone('');
    setSelectedState('');
    setSelectedCity('');
    setRoleDropdownOpen(false);
    setShowModal(true);
  };

  const handleToggleActive = async (member) => {
    const actionText = member.is_active === 1 ? 'deactivate' : 'activate';
    const confirmed = await showConfirm(
      'Confirm Action',
      `Are you sure you want to ${actionText} this team member?`,
      'warning',
      'Yes, Proceed',
      'Cancel'
    );
    if (!confirmed) return;

    try {
      const res = await api.put(`/users/${member.id}/toggle-active`);
      if (res.data.success) {
        showAlert('Success', res.data.message, 'success');
        fetchStaff();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = await showConfirm(
      'Confirm Permanent Delete',
      'Are you sure you want to permanently delete this team member? All their data (inspection logs, assignments, etc.) will be deleted forever. This action cannot be undone!',
      'warning',
      'Yes, Delete Forever',
      'Cancel'
    );
    if (!confirmed) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        showAlert('Success', 'Team member deleted completely', 'success');
        fetchStaff();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const filteredZones = RAILWAY_ZONES_PARSED.filter(z => 
    z.acronym.toLowerCase().includes(zoneSearchText.toLowerCase()) ||
    z.name.toLowerCase().includes(zoneSearchText.toLowerCase()) ||
    z.division.toLowerCase().includes(zoneSearchText.toLowerCase())
  );

  const filteredStates = states.filter(s => 
    s.toLowerCase().includes(stateSearchText.toLowerCase())
  );

  const filteredDistricts = districts.filter(d => 
    d.toLowerCase().includes(districtSearchText.toLowerCase())
  );

  const filtered = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase());
    return activeRoleFilter ? (matchesSearch && s.role === activeRoleFilter) : matchesSearch;
  });

  const supervisorCount = staff.filter(s => s.role === 'supervisor').length;
  const engineerCount = staff.filter(s => s.role === 'ground_engineer').length;
  const coAdminCount = staff.filter(s => s.role === 'branch_admin').length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Dynamic styles for iOS bouncy transitions */}
      <style>{`
        @keyframes iosSpring {
          0% { transform: scale(0.92) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-ios-spring {
          animation: iosSpring 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="font-bold text-blue-600">{user.division}</span>, {user.zone}
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          <button onClick={startAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition shadow-sm">
            <UserPlus className="w-4 h-4" /> Add Team
          </button>
          <button onClick={fetchStaff} className="p-2.5 bg-white border border-slate-200 text-slate-655 hover:text-slate-900 rounded-lg transition shadow-sm" title="Refresh List">
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
              <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xl p-4 max-h-80 overflow-y-auto z-50 animate-ios-spring">
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
                            <p className="text-slate-650 mt-0.5 leading-normal text-[9px] break-words">{n.message}</p>
                            <div className="flex items-center gap-1 mt-1.5 text-[8px] text-slate-405 font-semibold">
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

      {/* Quick Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div 
          onClick={() => setActiveRoleFilter(activeRoleFilter === 'supervisor' ? null : 'supervisor')}
          className={`p-5 border rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md cursor-pointer select-none ${
            activeRoleFilter === 'supervisor' 
              ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/25' 
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Supervisors Appointed</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-blue-50 text-blue-600 border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{supervisorCount}</h3>
            {activeRoleFilter === 'supervisor' && <span className="text-[10px] text-blue-600 font-bold uppercase">Filtered view active</span>}
          </div>
        </div>

        <div 
          onClick={() => setActiveRoleFilter(activeRoleFilter === 'ground_engineer' ? null : 'ground_engineer')}
          className={`p-5 border rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md cursor-pointer select-none ${
            activeRoleFilter === 'ground_engineer' 
              ? 'bg-orange-50/30 border-orange-500 ring-2 ring-orange-500/25' 
              : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Ground Engineers Appointed</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-orange-50 text-orange-600 border-orange-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{engineerCount}</h3>
            {activeRoleFilter === 'ground_engineer' && <span className="text-[10px] text-orange-600 font-bold uppercase">Filtered view active</span>}
          </div>
        </div>

        <div 
          onClick={() => setActiveRoleFilter(activeRoleFilter === 'branch_admin' ? null : 'branch_admin')}
          className={`p-5 border rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md cursor-pointer select-none ${
            activeRoleFilter === 'branch_admin' 
              ? 'bg-emerald-50/30 border-emerald-500 ring-2 ring-emerald-500/25' 
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Co-admins Appointed</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-emerald-50 text-emerald-600 border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{coAdminCount}</h3>
            {activeRoleFilter === 'branch_admin' && <span className="text-[10px] text-emerald-600 font-bold uppercase">Filtered view active</span>}
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">Manage Team Members</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-405 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Loading team members...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No team members assigned to your branch yet</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email ID</th>
                  <th className="p-4">Mobile Number</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{s.name}</td>
                    <td className="p-4 font-mono">{s.email}</td>
                    <td className="p-4 text-slate-500">{s.phone || 'N/A'}</td>
                    <td className="p-4 font-semibold text-slate-655 capitalize">
                      {s.role === 'ground_engineer' ? 'Ground Engineer' : s.role === 'branch_admin' ? 'Co-admin' : 'Supervisor'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-650 border border-red-100'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition" title="Edit Member">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleActive(s)} 
                        className={`p-1.5 rounded-lg transition ${
                          s.is_active === 1 
                            ? 'text-red-500 hover:bg-red-50 hover:text-red-600' 
                            : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                        title={s.is_active === 1 ? 'Deactivate Member' : 'Activate Member'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(s.id)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-650 rounded-lg transition" title="Delete Member Forever">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingSupervisor ? 'Edit Team Details' : 'Fill the team details'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email ID</label>
                <input
                  type="email"
                  required
                  placeholder="member@thermalportal.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="10 digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="relative role-dropdown-container">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="w-full flex items-center justify-between border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-left h-10 transition font-medium"
                >
                  <div className="flex items-center gap-2 text-slate-700 truncate pr-4">
                    {role === 'supervisor' ? (
                      <>
                        <Users className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Supervisor</span>
                      </>
                    ) : role === 'ground_engineer' ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>Ground Engineer</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Co-admin</span>
                      </>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 flex flex-col gap-1 animate-ios-spring">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('supervisor');
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-left transition ${
                        role === 'supervisor' ? 'bg-blue-50/70 text-blue-755' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Users className={`w-4 h-4 mt-0.5 shrink-0 ${role === 'supervisor' ? 'text-blue-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-semibold text-xs leading-none">Supervisor</p>
                          <p className="text-[10px] text-slate-450 mt-1">Appoints engineers & manages assignments</p>
                        </div>
                      </div>
                      {role === 'supervisor' && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRole('ground_engineer');
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-left transition ${
                        role === 'ground_engineer' ? 'bg-orange-50/75 text-orange-755' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${role === 'ground_engineer' ? 'text-orange-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-semibold text-xs leading-none">Ground Engineer</p>
                          <p className="text-[10px] text-slate-455 mt-1">Performs inspections & records temperatures</p>
                        </div>
                      </div>
                      {role === 'ground_engineer' && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRole('branch_admin');
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-left transition ${
                        role === 'branch_admin' ? 'bg-emerald-50/75 text-emerald-755' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Users className={`w-4 h-4 mt-0.5 shrink-0 ${role === 'branch_admin' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="font-semibold text-xs leading-none">Co-admin</p>
                          <p className="text-[10px] text-slate-455 mt-1">Appoints other branch admins & configures rakes</p>
                        </div>
                      </div>
                      {role === 'branch_admin' && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  </div>
                )}
              </div>

              {role === 'branch_admin' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Branch & Location</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Inherited from your branch
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Branch / Depo</span>
                      <span className="font-bold text-slate-800">{user?.division || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Zone</span>
                      <span className="font-semibold text-slate-700 truncate block" title={user?.zone}>{user?.zone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">State</span>
                      <span className="font-semibold text-slate-700">{user?.state || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">City</span>
                      <span className="font-semibold text-slate-700">{user?.city || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {editingSupervisor && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password (optional)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-2.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition flex items-center"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-655 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {editingSupervisor ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
