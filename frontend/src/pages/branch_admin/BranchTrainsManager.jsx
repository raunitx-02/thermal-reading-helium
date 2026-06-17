import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Train, Plus, RefreshCw, Trash2, Shield, Search } from 'lucide-react';

export default function BranchTrainsManager() {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [trainNo, setTrainNo] = useState(''); // Rake Number
  const [trainName, setTrainName] = useState('MEMU'); // Rake Type
  const [route, setRoute] = useState(''); // Route/Division
  const [frequency, setFrequency] = useState('Daily');

  const [showRakeTypeDropdown, setShowRakeTypeDropdown] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);

  const fetchBranchTrains = async () => {
    setLoading(true);
    try {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trainNo || !trainName || !route) {
      showAlert('Required Fields', 'Please fill out all fields.', 'warning');
      return;
    }

    try {
      const res = await api.post('/trains', {
        train_number: trainNo,
        train_name: trainName,
        route,
        division: user.city || user.division,
        frequency,
        custom_safe_max: 20.0,
        custom_warning_max: 25.0,
        custom_critical_max: 25.0
      });

      if (res.data.success) {
        showAlert('Success', 'Rake registered and configured successfully', 'success');
        setShowModal(false);
        fetchBranchTrains();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Failed to add rake', 'error');
    }
  };

  const handleDeactivate = async (id) => {
    const confirmed = await showConfirm(
      'Confirm Action',
      'Are you sure you want to deactivate this Rake?',
      'warning',
      'Yes, Deactivate',
      'Cancel'
    );
    if (!confirmed) return;
    try {
      const res = await api.delete(`/trains/${id}`);
      if (res.data.success) {
        showAlert('Success', 'Rake deactivated', 'success');
        fetchBranchTrains();
      }
    } catch (_) {}
  };

  const startAdd = () => {
    setTrainNo('');
    setTrainName('MEMU');
    setRoute('');
    setFrequency('Daily');
    setShowRakeTypeDropdown(false);
    setShowFrequencyDropdown(false);
    setShowModal(true);
  };

  const filtered = trains.filter(t => 
    t.train_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.train_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Keyframe animation for smooth dropdown transition */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .dropdown-animate {
          animation: slideDown 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: top;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Rake Configurations</h1>
          <p className="text-slate-500 text-sm mt-1">Configure active rakes, division ownership, and safety criteria for government inspections</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={startAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Rake
          </button>
          <button onClick={fetchBranchTrains} className="p-2.5 bg-white border border-slate-200 text-slate-605 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid list */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900 font-sans">Rakes Registered under {user.city} Branch</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by rake no., type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Loading rake listings...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No rakes added under your branch yet</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Rake Number</th>
                  <th className="p-4">Rake Type</th>
                  <th className="p-4">Route / Division</th>
                  <th className="p-4">Inspection Criteria</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-blue-650 text-blue-600">{t.train_number}</td>
                    <td className="p-4 font-bold text-slate-900">{t.train_name}</td>
                    <td className="p-4 font-semibold text-slate-650 text-slate-500">{t.route}</td>
                    <td className="p-4 font-semibold text-emerald-600">
                      <span className="inline-flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Relative Rise &lt;= 25°C (RDSO)
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDeactivate(t.id)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition" title="Deactivate Rake">
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

      {/* Add Rake Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Train className="w-5 h-5 text-blue-600" /> Add & Register Rake
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rake Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Rake number (e.g. 218113 / 208272 / 218114)"
                  value={trainNo}
                  onChange={(e) => setTrainNo(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Rake Type Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rake Type</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRakeTypeDropdown(!showRakeTypeDropdown);
                      setShowFrequencyDropdown(false);
                    }}
                    className="w-full flex items-center justify-between border border-slate-200 hover:border-slate-350 rounded-lg p-2.5 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-blue-500 h-[38px]"
                  >
                    <span>{trainName}</span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </button>
                  {showRakeTypeDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden dropdown-animate">
                      {['MEMU', 'DEMU', 'LHB'].map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setTrainName(option);
                            setShowRakeTypeDropdown(false);
                          }}
                          className={`p-2.5 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 cursor-pointer ${
                            trainName === option ? 'bg-blue-50/50 text-blue-600' : 'text-slate-700'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Frequency Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFrequencyDropdown(!showFrequencyDropdown);
                      setShowRakeTypeDropdown(false);
                    }}
                    className="w-full flex items-center justify-between border border-slate-200 hover:border-slate-350 rounded-lg p-2.5 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-blue-500 h-[38px]"
                  >
                    <span>{frequency}</span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </button>
                  {showFrequencyDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden dropdown-animate">
                      {['Daily', 'Weekly', 'Bi-Weekly'].map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setFrequency(option);
                            setShowFrequencyDropdown(false);
                          }}
                          className={`p-2.5 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 cursor-pointer ${
                            frequency === option ? 'bg-blue-50/50 text-blue-600' : 'text-slate-700'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Route / Division</label>
                <input
                  type="text"
                  required
                  placeholder="Enter operating division or route (e.g. Mumbai City Branch)"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" /> RDSO Standard Acceptance Criteria
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  As per RDSO guidelines, the temperature rise relative to the ambient temperature is assessed:
                  <br />
                  • <strong>Acceptable:</strong> Temperature Rise &le; 25°C
                  <br />
                  • <strong>Investigate & Attend:</strong> Temperature Rise &gt; 25°C
                </p>
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
                  className="px-5 py-2 rounded-lg text-xs font-bold shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Register Rake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
