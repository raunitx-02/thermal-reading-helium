import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Users, MapPin, Plus, CheckCircle, Search, RefreshCw, Edit, ShieldAlert } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [branchAdmins, setBranchAdmins] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [summary, setSummary] = useState({ totalAdmins: 0, totalCities: 728, citiesLeft: 728 });
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  
  // Search & Filter state
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStates = async () => {
    try {
      const res = await api.get('/geo/states');
      if (res.data.success) setStates(res.data.data);
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

  const fetchBranchAdmins = async () => {
    setLoading(true);
    try {
      const [userRes, geoSumRes] = await Promise.all([
        api.get('/users?role=branch_admin'),
        api.get('/geo/summary')
      ]);
      if (userRes.data.success) {
        setBranchAdmins(userRes.data.data);
      }
      if (geoSumRes.data.success) {
        const total = geoSumRes.data.data.totalCities || 728;
        const appointed = userRes.data.data.length;
        setSummary({
          totalAdmins: appointed,
          totalCities: total,
          citiesLeft: Math.max(0, total - appointed)
        });
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchBranchAdmins();
    fetchStates();
  }, []);

  useEffect(() => {
    fetchDistricts(selectedState);
    setSelectedCity('');
  }, [selectedState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || (!editingAdmin && !password) || !selectedState || !selectedCity) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      if (editingAdmin) {
        // Edit Branch Admin
        const res = await api.put(`/users/${editingAdmin.id}`, {
          name,
          email,
          password: password || undefined,
          phone,
          employee_id: employeeId,
          state: selectedState,
          city: selectedCity
        });
        if (res.data.success) {
          alert('Branch Admin updated successfully');
          setShowModal(false);
          fetchBranchAdmins();
        }
      } else {
        // Create new Branch Admin
        const res = await api.post('/users', {
          name,
          email,
          password,
          role: 'branch_admin',
          division: selectedCity, // Set division to City name
          phone,
          employee_id: employeeId,
          state: selectedState,
          city: selectedCity
        });
        if (res.data.success) {
          alert('Branch Admin appointed successfully');
          setShowModal(false);
          fetchBranchAdmins();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const startEdit = (admin) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setPassword('');
    setPhone(admin.phone || '');
    setEmployeeId(admin.employee_id || '');
    setSelectedState(admin.state || '');
    setSelectedCity(admin.city || '');
    setShowModal(true);
  };

  const startAdd = () => {
    setEditingAdmin(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setEmployeeId('');
    setSelectedState('');
    setSelectedCity('');
    setShowModal(true);
  };

  const filteredStates = states.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  const filteredDistricts = districts.filter(d => d.toLowerCase().includes(citySearch.toLowerCase()));
  const filteredAdmins = branchAdmins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Super Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Manage geographic branches and appoint Branch Admins across India</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={startAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition shadow-sm">
            <Plus className="w-4 h-4" /> Appoint Branch Admin
          </button>
          <button onClick={fetchBranchAdmins} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Branch Admins Appointed</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-blue-50 text-blue-600 border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{summary.totalAdmins}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Cover Cities</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-emerald-50 text-emerald-600 border-emerald-100">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{summary.totalCities}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Appointment Capacity Left</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-amber-50 text-amber-600 border-amber-100">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{summary.citiesLeft}</h3>
          </div>
        </div>
      </div>

      {/* Main Table list */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">Branch Administrators List</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Fetching appointments...</p>
        ) : filteredAdmins.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No branch administrators appointed yet</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">State</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{admin.name}</td>
                    <td className="p-4 font-mono">{admin.email}</td>
                    <td className="p-4 font-semibold text-slate-650">{admin.employee_id || 'N/A'}</td>
                    <td className="p-4 font-medium text-slate-700">{admin.state || 'N/A'}</td>
                    <td className="p-4 font-bold text-blue-600">{admin.city || 'N/A'}</td>
                    <td className="p-4 text-slate-500">{admin.phone || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => startEdit(admin)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingAdmin ? 'Edit Administrator Details' : 'Appoint Branch Administrator'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email ID</label>
                  <input
                    type="email"
                    required
                    placeholder="E.g. rajesh@thermalportal.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required={!editingAdmin}
                    placeholder={editingAdmin ? 'Leave blank to keep same' : 'Minimum 6 characters'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="E.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="E.g. IR-BRN-501"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* State & City selectors (Searchable & Cascading) */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select State</label>
                  <input
                    type="text"
                    placeholder="Search State..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="w-full border border-slate-200 rounded-t-lg p-2 text-[10px] focus:outline-none bg-slate-50"
                  />
                  <select
                    required
                    size={4}
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full border border-t-0 border-slate-200 rounded-b-lg p-2.5 text-xs focus:outline-none h-28"
                  >
                    <option value="" disabled>-- Choose State --</option>
                    {filteredStates.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select District/City</label>
                  <input
                    type="text"
                    placeholder="Search District..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="w-full border border-slate-200 rounded-t-lg p-2 text-[10px] focus:outline-none bg-slate-50"
                    disabled={!selectedState}
                  />
                  <select
                    required
                    size={4}
                    value={selectedCity}
                    disabled={!selectedState}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full border border-t-0 border-slate-200 rounded-b-lg p-2.5 text-xs focus:outline-none h-28"
                  >
                    <option value="" disabled>-- Choose District --</option>
                    {filteredDistricts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
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
                  {editingAdmin ? 'Save Changes' : 'Appoint Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
