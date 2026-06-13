import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserPlus, RefreshCw, Trash2, Edit, Search } from 'lucide-react';

export default function SupervisorEngineers() {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const fetchEngineers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users?role=ground_engineer&parent_id=${user.id}`);
      if (res.data.success) {
        setEngineers(res.data.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchEngineers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || (!editingEngineer && !password)) {
      alert('Please fill out all required fields');
      return;
    }

    const name = `${firstName} ${lastName}`.trim();

    try {
      if (editingEngineer) {
        const res = await api.put(`/users/${editingEngineer.id}`, {
          name,
          email,
          password: password || undefined,
          phone,
          employee_id: employeeId
        });
        if (res.data.success) {
          alert('Ground Engineer updated successfully');
          setShowModal(false);
          fetchEngineers();
        }
      } else {
        const res = await api.post('/users', {
          name,
          email,
          password,
          role: 'ground_engineer',
          division: user.division,
          phone,
          employee_id: employeeId,
          parent_id: user.id
        });
        if (res.data.success) {
          alert('Ground Engineer added successfully');
          setShowModal(false);
          fetchEngineers();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const startEdit = (eng) => {
    setEditingEngineer(eng);
    const names = eng.name.split(' ');
    setFirstName(names[0] || '');
    setLastName(names.slice(1).join(' ') || '');
    setEmail(eng.email);
    setPassword('');
    setPhone(eng.phone || '');
    setEmployeeId(eng.employee_id || '');
    setShowModal(true);
  };

  const startAdd = () => {
    setEditingEngineer(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setEmployeeId('');
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this Ground Engineer?')) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        alert('Ground Engineer deactivated');
        fetchEngineers();
      }
    } catch (_) {}
  };

  const filtered = engineers.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ground Engineers Management</h1>
          <p className="text-slate-500 text-sm mt-1">Supervise and appoint Ground Engineers for bogie inspections</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={startAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition shadow-sm">
            <UserPlus className="w-4 h-4" /> Add Ground Engineer
          </button>
          <button onClick={fetchEngineers} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">Active Engineers Under You</h2>
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
          <p className="text-slate-400 text-xs text-center py-12">Loading engineers...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No ground engineers appointed yet</p>
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
                {filtered.map((eng) => (
                  <tr key={eng.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{eng.name}</td>
                    <td className="p-4 font-mono">{eng.email}</td>
                    <td className="p-4 text-slate-500">{eng.phone || 'N/A'}</td>
                    <td className="p-4 font-semibold text-slate-650">{eng.employee_id || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${eng.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {eng.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => startEdit(eng)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeactivate(eng.id)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition">
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
              {editingEngineer ? 'Edit Engineer Details' : 'Add Ground Engineer'}
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
                  placeholder="engineer@thermalportal.in"
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
                  placeholder="E.g. IR-ENG-88"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required={!editingEngineer}
                  placeholder={editingEngineer ? 'Leave blank to keep same' : 'Password'}
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
                  {editingEngineer ? 'Save Changes' : 'Appoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
