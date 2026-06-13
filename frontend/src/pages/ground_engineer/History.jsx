import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, RefreshCw, Search } from 'lucide-react';

export default function EngineerHistory() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'today', 'weekly', 'monthly', 'all'
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sessions?status=submitted&inspector_id=${user.id}`);
      if (res.data.success) {
        setInspections(res.data.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getFiltered = () => {
    const now = new Date();
    const todayStr = new Date().toISOString().split('T')[0];
    return inspections.filter(i => {
      const matchSearch = i.train_number.includes(searchTerm) || i.train_name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      const date = new Date(i.inspection_date);
      if (timeFilter === 'today') {
        return i.inspection_date === todayStr;
      } else if (timeFilter === 'weekly') {
        const diff = (now - date) / (1000 * 3600 * 24);
        return diff <= 7;
      } else if (timeFilter === 'monthly') {
        const diff = (now - date) / (1000 * 3600 * 24);
        return diff <= 30;
      }
      return true;
    });
  };

  const downloadSessionReport = (sessionId, trainNo) => {
    const url = `${api.defaults.baseURL || 'http://localhost:5050/api'}/reports/session/${sessionId}`;
    const token = localStorage.getItem('accessToken');
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `inspection_report_${trainNo}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(() => alert('Failed to download report'));
  };

  const filtered = getFiltered();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inspection History</h1>
          <p className="text-slate-500 text-sm mt-1">Access all your completed bogie thermal inspections and download colorful PDF reports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1 shadow-sm">
            {['today', 'weekly', 'monthly', 'all'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${timeFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button onClick={fetchHistory} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">Your Logged Submissions</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by train no or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Loading history logs...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No completed inspections logged for this period</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Train No.</th>
                  <th className="p-4">Train Name</th>
                  <th className="p-4">Inspection Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ins) => (
                  <tr key={ins.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-blue-600">{ins.train_number}</td>
                    <td className="p-4 font-bold text-slate-900">{ins.train_name}</td>
                    <td className="p-4 text-slate-500 font-medium">{ins.inspection_date}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Submitted
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => downloadSessionReport(ins.id, ins.train_number)}
                        className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
