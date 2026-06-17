import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Users, UserPlus, RefreshCw, Trash2, Edit, Search, ShieldCheck, ChevronDown, Check, Bell, LogOut } from 'lucide-react';

export default function BranchAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('supervisor');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

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

  const fetchStaff = async () => {
    setLoading(true);
    try {
      // Fetch both supervisors and ground engineers created by this branch admin
      const res = await api.get(`/users?parent_id=${user.id}`);
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || (!editingSupervisor && !password)) {
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
          employee_id: null
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
          password,
          role,
          division: user.city || user.division,
          phone,
          employee_id: null,
          parent_id: user.id
        });
        if (res.data.success) {
          showAlert('Success', 'Team member created successfully', 'success');
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
    setPhone(member.phone || '');
    setRole(member.role || 'supervisor');
    setRoleDropdownOpen(false);
    setShowModal(true);
  };

  const startAdd = () => {
    setEditingSupervisor(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('supervisor');
    setRoleDropdownOpen(false);
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    const confirmed = await showConfirm(
      'Confirm Action',
      'Are you sure you want to deactivate this team member?',
      'warning',
      'Yes, Deactivate',
      'Cancel'
    );
    if (!confirmed) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        showAlert('Success', 'Team member deactivated', 'success');
        fetchStaff();
      }
    } catch (_) {}
  };

  const filtered = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase());
    return activeRoleFilter ? (matchesSearch && s.role === activeRoleFilter) : matchesSearch;
  });

  const supervisorCount = staff.filter(s => s.role === 'supervisor').length;
  const engineerCount = staff.filter(s => s.role === 'ground_engineer').length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
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
            <UserPlus className="w-4 h-4" /> Add Team Member
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
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 max-h-80 overflow-y-auto z-50">
                <h3 className="font-semibold text-xs text-slate-900 border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
                  <span>Notifications</span>
                  <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-955">✕</button>
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

      {/* Quick Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                      {s.role === 'ground_engineer' ? 'Ground Engineer' : 'Supervisor'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-650 border border-red-100'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeactivate(s.id)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition">
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
              {editingSupervisor ? 'Edit Team Member Details' : 'Add New Team Member'}
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
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>Ground Engineer</span>
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
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required={!editingSupervisor}
                  placeholder={editingSupervisor ? 'Enter new password (optional)' : 'Enter secure password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

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
