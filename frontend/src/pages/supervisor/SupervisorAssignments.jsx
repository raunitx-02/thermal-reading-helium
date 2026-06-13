import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, Plus, RefreshCw, Trash2, CheckCircle } from 'lucide-react';

export default function SupervisorAssignments() {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState([]);
  const [trains, setTrains] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedTrain, setSelectedTrain] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState('');

  const fetchAssignmentsData = async () => {
    setLoading(true);
    try {
      const [engRes, trainRes, assignRes] = await Promise.all([
        api.get(`/users?role=ground_engineer&parent_id=${user.id}`),
        api.get('/trains'),
        api.get('/assignments')
      ]);

      if (engRes.data.success) {
        setEngineers(engRes.data.data);
        if (engRes.data.data.length > 0) setSelectedEngineer(engRes.data.data[0].id);
      }
      if (trainRes.data.success) {
        setTrains(trainRes.data.data);
        if (trainRes.data.data.length > 0) setSelectedTrain(trainRes.data.data[0].id);
      }
      if (assignRes.data.success) {
        setAssignments(assignRes.data.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignmentsData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTrain || !selectedEngineer) {
      alert('Please select both a train and a ground engineer');
      return;
    }

    try {
      const res = await api.post('/assignments', {
        train_id: selectedTrain,
        ground_engineer_id: selectedEngineer
      });
      if (res.data.success) {
        alert('Inspection assigned successfully');
        fetchAssignmentsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this assignment?')) return;
    try {
      const res = await api.delete(`/assignments/${id}`);
      if (res.data.success) {
        alert('Assignment cancelled');
        fetchAssignmentsData();
      }
    } catch (_) {}
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inspection Assignments</h1>
          <p className="text-slate-500 text-sm mt-1">Assign active trains to Ground Engineers and track their completion status</p>
        </div>
        <button onClick={fetchAssignmentsData} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assignment Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit space-y-6">
          <h2 className="font-semibold text-lg text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" /> New Assignment
          </h2>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Train Line</label>
              <select
                value={selectedTrain}
                onChange={(e) => setSelectedTrain(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
              >
                {trains.map(t => (
                  <option key={t.id} value={t.id}>{t.train_number} - {t.train_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Ground Engineer</label>
              <select
                value={selectedEngineer}
                onChange={(e) => setSelectedEngineer(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
              >
                {engineers.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2.5 transition shadow-sm mt-4"
            >
              <Plus className="w-4 h-4" /> Assign Inspection
            </button>
          </form>
        </div>

        {/* Assignments List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="font-semibold text-lg text-slate-900">Current Assignments List</h2>
          {loading ? (
            <p className="text-slate-400 text-xs text-center py-12">Fetching assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-12">No active assignments recorded</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition">
                  <div>
                    <span className="text-[10px] font-bold text-blue-650 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase font-mono">
                      {a.train_number}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{a.train_name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{a.route}</p>
                    <p className="text-[10px] text-slate-450 mt-1 font-medium">
                      Assigned to: <span className="font-bold text-slate-700">{a.ground_engineer_name}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${a.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {a.status}
                    </span>
                    {a.status !== 'completed' && (
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg border border-transparent hover:border-red-100 transition" title="Cancel Assignment">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
