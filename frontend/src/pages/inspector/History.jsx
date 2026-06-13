import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { History, Eye, Calendar, RefreshCw, FileText, CheckCircle } from 'lucide-react';

export default function InspectorHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailModal, setDetailModal] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sessions?inspector_id=${user.id}`);
      if (res.data.success) setSessions(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenDetails = async (id) => {
    try {
      const res = await api.get(`/sessions/${id}`);
      if (res.data.success) {
        setSelectedSession(res.data.data);
        setDetailModal(true);
      }
    } catch (_) {}
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">My Submission Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Chronological history of your submitted train diagnostics</p>
        </div>
        <button onClick={fetchHistory} className="p-2.5 bg-white border border-slate-205 border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition self-start shadow-sm animate-none">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <History className="w-4 h-4 text-blue-600" /> Past Submissions
        </h2>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Loading history trails...</p>
        ) : sessions.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No inspection sessions submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Train Number</th>
                  <th className="py-2.5 px-4">Train Name</th>
                  <th className="py-2.5 px-4">Zones Logged</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 font-bold"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {s.inspection_date}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600 font-mono">{s.train_number}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{s.train_name}</td>
                    <td className="py-3.5 px-4">{s.readings_count || 0} zones</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold ${s.status === 'submitted' ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {s.status === 'submitted' ? <CheckCircle className="w-3.5 h-3.5 stroke-[3px]" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        {s.status === 'submitted' ? 'Locked' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => handleOpenDetails(s.id)} className="text-slate-400 hover:text-slate-700 transition">
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Preview Modal */}
      {detailModal && selectedSession && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-xl p-6 relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setDetailModal(false)} className="absolute top-4 right-4 text-slate-405 text-slate-400 hover:text-slate-900">
              ✕
            </button>
            <h3 className="font-bold text-lg text-slate-905 text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 font-sans">
              <FileText className="w-5 h-5 text-blue-600" /> Inspection Session Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6 text-slate-500 font-semibold">
              <div>Train: <span className="text-slate-900 font-bold">{selectedSession.train_number} - {selectedSession.train_name}</span></div>
              <div>Route: <span className="text-slate-900 font-bold">{selectedSession.route}</span></div>
              <div>Date: <span className="text-slate-900 font-bold">{selectedSession.inspection_date}</span></div>
              <div>Submitted at: <span className="text-slate-900 font-bold">{new Date(selectedSession.submitted_at * 1000).toLocaleString()}</span></div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zone Temperatures</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {selectedSession.readings?.map(r => (
                  <div key={r.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-[120px]">{r.zone_name}</p>
                      <span className="text-[10px] text-slate-450 uppercase mt-0.5 block font-semibold">{r.coach_number}</span>
                    </div>
                    <span className={`font-mono font-bold ${
                      r.status === 'critical' ? 'text-red-600' : r.status === 'warning' ? 'text-orange-600' : 'text-emerald-600'
                    }`}>
                      {r.temperature}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedSession.remarks && (
              <div className="mt-6 p-3 bg-slate-50 border border-slate-250 border-slate-200 rounded-lg text-xs">
                <span className="font-bold text-slate-500 block mb-1">Inspector Remarks</span>
                <p className="text-slate-700 italic font-medium">{selectedSession.remarks}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
