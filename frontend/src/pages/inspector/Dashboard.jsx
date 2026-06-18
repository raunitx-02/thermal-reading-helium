import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Train, Plus, RefreshCw, Calendar, ClipboardList } from 'lucide-react';

export default function InspectorDashboard() {
  const { user } = useAuth();
  const [trains, setTrains] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_inspector_trains`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [drafts, setDrafts] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_inspector_drafts`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const trainsCache = localStorage.getItem(`cache_${email}_inspector_trains`);
      const draftsCache = localStorage.getItem(`cache_${email}_inspector_drafts`);
      const hasTrains = trainsCache ? JSON.parse(trainsCache).length > 0 : false;
      const hasDrafts = draftsCache ? JSON.parse(draftsCache).length > 0 : false;
      return !(hasTrains || hasDrafts);
    } catch (_) {
      return true;
    }
  });
  const navigate = useNavigate();

  const fetchInspectorData = async () => {
    const hasCached = (trains && trains.length > 0) || (drafts && drafts.length > 0);
    if (!hasCached) {
      setLoading(true);
    }
    try {
      const [trainRes, sessionRes] = await Promise.all([
        api.get('/trains'),
        api.get('/sessions?status=draft')
      ]);
      const email = user?.email || 'guest';
      if (trainRes.data.success) {
        setTrains(trainRes.data.data);
        localStorage.setItem(`cache_${email}_inspector_trains`, JSON.stringify(trainRes.data.data));
      }
      if (sessionRes.data.success) {
        setDrafts(sessionRes.data.data);
        localStorage.setItem(`cache_${email}_inspector_drafts`, JSON.stringify(sessionRes.data.data));
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchInspectorData();
  }, []);

  const handleStartInspection = async (trainId) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.post('/sessions', { train_id: trainId, inspection_date: todayStr });
      if (res.data.success) {
        navigate(`/inspector/inspection/${res.data.data.id}`);
      }
    } catch (_) {}
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Inspector Operations Panel</h1>
        <p className="text-slate-500 text-sm mt-1">Select an active train line to run thermal readings checks</p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Initializing active schedules...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Trains Inventory list for new inspection */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4">
              <Train className="w-5 h-5 text-blue-600" /> Train Checklist Inventory
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trains.map((train) => (
                <div key={train.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-blue-600 font-mono">{train.train_number}</h3>
                    <p className="text-slate-900 text-xs font-bold mt-1">{train.train_name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">{train.route} | {train.division} Div</p>
                  </div>
                  <button
                    onClick={() => handleStartInspection(train.id)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Start Reading
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Side: Active Inspection drafts */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 h-fit shadow-sm">
            <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4">
              <ClipboardList className="w-5 h-5 text-amber-600" /> Unfinished Drafts
            </h2>

            {drafts.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">No open draft sessions</p>
            ) : (
              <div className="space-y-4">
                {drafts.map(draft => (
                  <div
                    key={draft.id}
                    onClick={() => navigate(`/inspector/inspection/${draft.id}`)}
                    className="p-3.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-slate-50/50 transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-amber-600 font-mono">{draft.train_number}</h4>
                      <p className="text-slate-900 text-[11px] font-bold mt-0.5">{draft.train_name}</p>
                      <span className="text-[9px] text-slate-450 font-medium flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {draft.inspection_date}
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
      )}
    </div>
  );
}
