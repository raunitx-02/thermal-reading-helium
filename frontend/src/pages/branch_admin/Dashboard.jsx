import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserPlus, RefreshCw, Trash2, Edit, Search } from 'lucide-react';

export default function BranchAdminDashboard() {
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const fetchSupervisors = async () => {
    setLoading(true);
    try {
      // Fetch only supervisors created by this branch admin
      const res = await api.get(`/users?role=supervisor&parent_id=${user.id}`);
      if (res.data.success) {
        setSupervisors(res.data.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || (!editingSupervisor && !password)) {
      alert('Please fill out all required fields');
      return;
    }

    const name = `${firstName} ${lastName}`.trim();

    try {
      if (editingSupervisor) {
        // Edit Supervisor
        const res = await api.put(`/users/${editingSupervisor.id}`, {
          name,
          email,
          password: password || undefined,
          phone,
          employee_id: employeeId
        });
        if (res.data.success) {
          alert('Supervisor updated successfully');
          setShowModal(false);
          fetchSupervisors();
        }
      } else {
        // Create Supervisor
        const res = await api.post('/users', {
          name,
          email,
          password,
          role: 'supervisor',
          division: user.city || user.division, // Inherit division/city
          phone,
          employee_id: employeeId,
          parent_id: user.id
        });
        if (res.data.success) {
          alert('Supervisor created successfully');
          setShowModal(false);
          fetchSupervisors();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const startEdit = (supervisor) => {
    setEditingSupervisor(supervisor);
    const names = supervisor.name.split(' ');
    setFirstName(names[0] || '');
    setLastName(names.slice(1).join(' ') || '');
    setEmail(supervisor.email);
    setPassword('');
    setPhone(supervisor.phone || '');
    setEmployeeId(supervisor.employee_id || '');
    setShowModal(true);
  };

  const startAdd = () => {
    setEditingSupervisor(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setEmployeeId('');
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this supervisor?')) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        alert('Supervisor deactivated');
        fetchSupervisors();
      }
    } catch (_) {}
  };

  const filtered = supervisors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Branch Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Registered Branch: <span className="font-bold text-blue-600">{user.city || user.division}</span>, {user.state}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={startAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition shadow-sm">
            <UserPlus className="w-4 h-4" /> Add Supervisor
          </button>
          <button onClick={fetchSupervisors} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Count Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Supervisors Appointed</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-blue-50 text-blue-600 border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{supervisors.length}</h3>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">Manage Supervisor Profiles</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Loading supervisors...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No supervisors assigned to your branch yet</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email ID</th>
                  <th className="p-4">Mobile Number</th>
                  <th className="p-4">Employee ID</th>
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
                    <td className="p-4 font-semibold text-slate-600">{s.employee_id || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
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
              {editingSupervisor ? 'Edit Supervisor Details' : 'Add New Supervisor'}
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
                  placeholder="supervisor@thermalportal.in"
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

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee ID</label>
                <input
                  type="text"
                  placeholder="E.g. IR-SUP-12"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required={!editingSupervisor}
                  placeholder={editingSupervisor ? 'Leave blank to keep same' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50"
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
