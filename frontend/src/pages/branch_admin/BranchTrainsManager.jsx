import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Train, Plus, RefreshCw, Trash2, Shield, Search } from 'lucide-react';

export default function BranchTrainsManager() {
  const { user } = useAuth();
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [trainNo, setTrainNo] = useState('');
  const [trainName, setTrainName] = useState('');
  const [route, setRoute] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [safeMax, setSafeMax] = useState(60);
  const [warningMax, setWarningMax] = useState(70);
  const [criticalMax, setCriticalMax] = useState(85);
  const [autoFetching, setAutoFetching] = useState(false);

  const fetchBranchTrains = async () => {
    setLoading(true);
    try {
      // Fetch only trains created by this branch admin
      const res = await api.get(`/trains?created_by=${user.id}`);
      if (res.data.success) {
        setTrains(res.data.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchBranchTrains();
  }, []);

  // IRCTC Auto fetch trigger on trainNo input change
  const handleTrainNoChange = async (val) => {
    setTrainNo(val);
    if (val.length === 5) {
      setAutoFetching(true);
      try {
        const res = await api.get(`/geo/irctc/lookup/${val}`);
        if (res.data.success) {
          setTrainName(res.data.data.name);
          setRoute(res.data.data.route);
        }
      } catch (err) {
        // Clear fields on error so user knows it's not found
        setTrainName('');
        setRoute('');
      }
      setAutoFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trainNo || !trainName || !route) {
      alert('Please fill out all fields or select a valid IRCTC Train');
      return;
    }

    try {
      const res = await api.post('/trains', {
        train_number: trainNo,
        train_name: trainName,
        route,
        division: user.city || user.division, // Set division to City
        frequency,
        custom_safe_max: Number(safeMax),
        custom_warning_max: Number(warningMax),
        custom_critical_max: Number(criticalMax)
      });

      if (res.data.success) {
        alert('Train added and configured successfully');
        setShowModal(false);
        fetchBranchTrains();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add train');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this train?')) return;
    try {
      const res = await api.delete(`/trains/${id}`);
      if (res.data.success) {
        alert('Train deactivated');
        fetchBranchTrains();
      }
    } catch (_) {}
  };

  const startAdd = () => {
    setTrainNo('');
    setTrainName('');
    setRoute('');
    setFrequency('Daily');
    setSafeMax(60);
    setWarningMax(70);
    setCriticalMax(85);
    setShowModal(true);
  };

  const filtered = trains.filter(t => 
    t.train_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.train_number.includes(searchTerm)
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Train Configurations</h1>
          <p className="text-slate-500 text-sm mt-1">Configure active trains, route ownership, and temperature thresholds for your branch</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={startAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Train Line
          </button>
          <button onClick={fetchBranchTrains} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid list */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">Trains Registered under {user.city} Branch</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Loading train listings...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No trains added under your branch yet</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Train No.</th>
                  <th className="p-4">Train Name</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Safe Limit (Green)</th>
                  <th className="p-4">Mod Limit (Orange)</th>
                  <th className="p-4">Crit Limit (Red)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-blue-600">{t.train_number}</td>
                    <td className="p-4 font-bold text-slate-900">{t.train_name}</td>
                    <td className="p-4 font-semibold text-slate-600">{t.route}</td>
                    <td className="p-4 text-emerald-650 text-emerald-650 text-emerald-600 font-bold">&lt;= {t.custom_safe_max}°C</td>
                    <td className="p-4 text-orange-600 font-bold">&gt;= {t.custom_warning_max}°C</td>
                    <td className="p-4 text-red-600 font-bold">&gt;= {t.custom_critical_max}°C</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDeactivate(t.id)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition" title="Deactivate Train">
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

      {/* Add Train Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Train className="w-5 h-5 text-blue-600" /> Configure & Add Train Line
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Train Number (5 Digits)</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  placeholder="Enter 5 digit train no. (e.g. 12309)"
                  value={trainNo}
                  onChange={(e) => handleTrainNoChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
                {autoFetching && <span className="text-[10px] text-blue-500 block mt-1 animate-pulse">Auto-fetching IRCTC database...</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Train Name</label>
                  <input
                    type="text"
                    required
                    readOnly
                    placeholder="Auto populated"
                    value={trainName}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-slate-50 font-bold focus:outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Tri-Weekly">Tri-Weekly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Junction Route List</label>
                <input
                  type="text"
                  required
                  readOnly
                  placeholder="Auto populated route details"
                  value={route}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-slate-50 font-semibold focus:outline-none text-slate-700"
                />
              </div>

              {/* Threshold setup */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" /> Set Temperature Limits (°C)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Safe Max (Green)</label>
                    <input
                      type="number"
                      required
                      value={safeMax}
                      onChange={(e) => setSafeMax(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-orange-600 uppercase mb-1">Warning Max (Orange)</label>
                    <input
                      type="number"
                      required
                      value={warningMax}
                      onChange={(e) => setWarningMax(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-red-600 uppercase mb-1">Critical Max (Red)</label>
                    <input
                      type="number"
                      required
                      value={criticalMax}
                      onChange={(e) => setCriticalMax(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>
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
                  disabled={!trainName}
                  className={`px-5 py-2 rounded-lg text-xs font-bold shadow-sm text-white ${trainName ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  Configure & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
