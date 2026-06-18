import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Train, Plus, Trash2, Edit2, Upload, FileSpreadsheet, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function Trains() {
  const { user } = useAuth();
  const [trains, setTrains] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_trains`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_trains`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return !(Array.isArray(parsed) && parsed.length > 0);
      }
      return true;
    } catch (_) {
      return true;
    }
  });
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'coaches'
  
  // Selected Train for details
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [coaches, setCoaches] = useState([]);
  
  // Form modal controls
  const [modalOpen, setModalOpen] = useState(false);
  const [editTrain, setEditTrain] = useState(null);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [route, setRoute] = useState('');
  const [division, setDivision] = useState('Mumbai');
  const [frequency, setFrequency] = useState('Daily');

  // Excel upload control
  const [uploadFile, setUploadFile] = useState(null);
  const [importMessage, setImportMessage] = useState('');

  const fetchTrains = async () => {
    let hasCache = false;
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_trains`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasCache = true;
        }
      }
    } catch (_) {}

    if (!hasCache) {
      setLoading(true);
    }
    try {
      const res = await api.get('/trains');
      if (res.data.success) {
        setTrains(res.data.data);
        const email = user?.email || 'guest';
        localStorage.setItem(`cache_${email}_trains`, JSON.stringify(res.data.data));
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTrains();
  }, []);

  const handleTrainClick = async (train) => {
    setSelectedTrain(train);
    try {
      const res = await api.get(`/trains/${train.id}/coaches`);
      if (res.data.success) {
        setCoaches(res.data.data);
        setActiveTab('coaches');
      }
    } catch (_) {}
  };

  const handleSaveTrain = async (e) => {
    e.preventDefault();
    const payload = { train_number: number, train_name: name, route, division, frequency };
    try {
      let res;
      if (editTrain) {
        res = await api.put(`/trains/${editTrain.id}`, payload);
      } else {
        res = await api.post('/trains', payload);
      }
      if (res.data.success) {
        setModalOpen(false);
        setEditTrain(null);
        resetForm();
        fetchTrains();
      }
    } catch (_) {}
  };

  const resetForm = () => {
    setNumber('');
    setName('');
    setRoute('');
    setDivision('Mumbai');
    setFrequency('Daily');
  };

  const handleOpenEdit = (train) => {
    setEditTrain(train);
    setNumber(train.train_number);
    setName(train.train_name);
    setRoute(train.route);
    setDivision(train.division);
    setFrequency(train.frequency);
    setModalOpen(true);
  };

  const handleDeactivate = async (id) => {
    if (confirm('Are you sure you want to deactivate this train?')) {
      try {
        const res = await api.delete(`/trains/${id}`);
        if (res.data.success) fetchTrains();
      } catch (_) {}
    }
  };

  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      const res = await api.post('/trains/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setImportMessage(res.data.message);
        setUploadFile(null);
        fetchTrains();
      }
    } catch (err) {
      setImportMessage(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Trains & Sensor Zones</h1>
          <p className="text-slate-500 text-sm mt-1">Configure rail systems, passenger coaches, and zone thresholds</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditTrain(null); resetForm(); setModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-750 hover:bg-blue-750 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2.5 px-4 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Train
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Trains List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-semibold text-xs text-slate-755 text-slate-700 uppercase tracking-wider">Active Rail Inventory</h2>
              <button onClick={fetchTrains} className="text-slate-400 hover:text-slate-700 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <p className="text-slate-405 text-slate-400 text-xs py-8 text-center">Loading trains...</p>
            ) : trains.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">No trains configured.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto pr-2">
                {trains.map((train) => (
                  <div key={train.id} className="flex justify-between items-center py-4 hover:bg-slate-50/50 px-2 rounded-lg transition">
                    <div className="cursor-pointer" onClick={() => handleTrainClick(train)}>
                      <h3 className="font-bold text-sm text-blue-600 flex items-center gap-2">
                        <Train className="w-4 h-4" /> {train.train_number}
                      </h3>
                      <p className="text-slate-900 text-xs font-semibold mt-1">{train.train_name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">{train.route} | {train.division} Div</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-slate-105 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                        {train.coach_count} coaches
                      </span>
                      <button onClick={() => handleOpenEdit(train)} className="text-slate-400 hover:text-slate-750 hover:text-slate-700 transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeactivate(train.id)} className="text-slate-400 hover:text-red-650 hover:text-red-600 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Excel Bulk Upload Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel Bulk Import
            </h3>
            <form onSubmit={handleUploadExcel} className="flex flex-col sm:flex-row gap-3">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="bg-white text-xs border border-slate-200 rounded-lg p-2.5 flex-1 text-slate-500 cursor-pointer focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!uploadFile}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs rounded-lg py-2.5 px-4 transition flex items-center gap-2 justify-center shadow-sm"
              >
                <Upload className="w-4 h-4" /> Upload Excel
              </button>
            </form>
            {importMessage && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                {importMessage}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Coaches & Zones preview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Coach Structure & Zones</h2>
            {selectedTrain ? (
              <p className="text-xs text-blue-600 font-bold mt-1">{selectedTrain.train_number} - {selectedTrain.train_name}</p>
            ) : (
              <p className="text-xs text-slate-450 text-slate-450 text-slate-400 mt-1">Select a train from the list to view</p>
            )}
          </div>

          {activeTab === 'coaches' && coaches.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {coaches.map((coach) => (
                <div key={coach.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{coach.coach_number}</span>
                    <span className="text-[10px] bg-slate-200/50 px-2 py-0.5 rounded text-slate-655 text-slate-600 capitalize font-semibold">
                      {coach.coach_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between font-medium">
                    <span>Zones: {coach.zone_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No train selected or no coaches added
            </div>
          )}
        </div>
      </div>

      {/* Train Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-slate-900 mb-6 font-sans">
              {editTrain ? 'Modify Train' : 'Create New Train'}
            </h3>
            <form onSubmit={handleSaveTrain} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Train Number</label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="e.g. 12951"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Train Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajdhani Express"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Route</label>
                <input
                  type="text"
                  required
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  placeholder="Mumbai Central → New Delhi"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Division</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Surat">Surat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Frequency</label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="Daily, Weekly"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg py-2.5 transition mt-4 shadow-sm"
              >
                Save Train
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
