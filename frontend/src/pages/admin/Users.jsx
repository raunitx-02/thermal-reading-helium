import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, ShieldAlert, Check, RefreshCw, X } from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_users`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_users`);
      const parsed = cached ? JSON.parse(cached) : [];
      return parsed.length === 0;
    } catch (_) {
      return true;
    }
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('inspector');
  const [division, setDivision] = useState('Mumbai');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchUsers = async () => {
    if (!users || users.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
        const email = user?.email || 'guest';
        localStorage.setItem(`cache_${email}_users`, JSON.stringify(res.data.data));
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name, email, role, division, phone, employee_id: null,
      is_active: isActive ? 1 : 0
    };
    if (password) payload.password = password;
    
    try {
      let res;
      if (editUser) {
        res = await api.put(`/users/${editUser.id}`, payload);
      } else {
        res = await api.post('/users', payload);
      }
      if (res.data.success) {
        setModalOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (_) {}
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setDivision(user.division);
    setPhone(user.phone || '');
    setIsActive(user.is_active === 1);
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('inspector');
    setDivision('Mumbai');
    setPhone('');
    setIsActive(true);
  };

  const handleDeactivate = async (id) => {
    if (confirm('Deactivate user? This will log them out immediately.')) {
      try {
        const res = await api.delete(`/users/${id}`);
        if (res.data.success) fetchUsers();
      } catch (_) {}
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">User Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage Admin and Inspector profiles and system authorizations</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2.5 px-4 transition self-start shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-105 border-slate-100 pb-3">
          <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Staff Accounts</h2>
          <button onClick={fetchUsers} className="text-slate-405 text-slate-400 hover:text-slate-700 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <p className="text-slate-405 text-slate-400 text-xs py-8 text-center animate-pulse">Loading accounts...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-750 text-slate-700 font-medium">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{u.division}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold ${u.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                        {u.is_active ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3">
                      <button onClick={() => handleOpenEdit(u)} className="text-slate-400 hover:text-slate-700 transition">
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button onClick={() => handleDeactivate(u.id)} className="text-slate-400 hover:text-red-600 transition">
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-slate-900 mb-6 font-sans">
              {editUser ? 'Modify User Profile' : 'Register New User'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@thermalportal.in"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              {editUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Password (leave blank to keep unchanged)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="inspector">Inspector</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Division</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="Mumbai, Pune"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              {editUser && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-blue-600 rounded bg-white border-slate-200 w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-slate-700">Account is Active</label>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg py-2.5 transition mt-4 shadow-sm"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
