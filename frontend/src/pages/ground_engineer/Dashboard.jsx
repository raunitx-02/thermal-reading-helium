import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Train, Play, RefreshCw, ClipboardList, AlertCircle } from 'lucide-react';

export default function EngineerDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEngineerData = async () => {
    setLoading(true);
    try {
      const [assignRes, draftRes] = await Promise.all([
        api.get(`/assignments?ground_engineer_id=${user.id}&status=assigned`),
        api.get(`/sessions?status=draft&inspector_id=${user.id}`)
      ]);
      if (assignRes.data.success) setAssignments(assignRes.data.data);
      if (draftRes.data.success) setDrafts(draftRes.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchEngineerData();
  }, []);

  const handleStartInspection = async (trainId) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.post('/sessions', { train_id: trainId, inspection_date: todayStr });
      if (res.data.success) {
        navigate(`/ground-engineer/inspection/${res.data.data.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start inspection');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Engineer Assignment Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Review your assigned train lines and launch bogie thermal check sessions</p>
        </div>
        <button onClick={fetchEngineerData} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm animate-none">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Assignments */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4">
            <Train className="w-5 h-5 text-blue-600" /> Assigned Trains Inventory
          </h2>

          {loading ? (
            <p className="text-slate-400 text-xs text-center py-12">Loading assigned schedules...</p>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-400 text-xs">No active assignments allocated by your supervisor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-blue-600 font-mono">{a.train_number}</h3>
                    <p className="text-slate-900 text-xs font-bold mt-1">{a.train_name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">{a.route}</p>
                  </div>
                  <button
                    onClick={() => handleStartInspection(a.train_id)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2 transition shadow-sm"
                  >
                    <Play className="w-4 h-4" /> Start Bogie Check
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inspection drafts */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 h-fit shadow-sm">
          <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4">
            <ClipboardList className="w-5 h-5 text-amber-600" /> Active Draft Sessions
          </h2>

          {drafts.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-12">No open draft sessions</p>
          ) : (
            <div className="space-y-4">
              {drafts.map(draft => (
                <div
                  key={draft.id}
                  onClick={() => navigate(`/ground-engineer/inspection/${draft.id}`)}
                  className="p-3.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-slate-50/50 transition flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-amber-600 font-mono">{draft.train_number}</h4>
                    <p className="text-slate-900 text-[11px] font-bold mt-0.5">{draft.train_name}</p>
                    <span className="text-[9px] text-slate-450 font-medium block mt-1">
                      Date: {draft.inspection_date}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                    Draft
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
