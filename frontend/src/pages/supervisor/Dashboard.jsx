import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Users, FileText, CheckSquare, Calendar, Download, RefreshCw, Eye, Search } from 'lucide-react';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState([]);
  const [trains, setTrains] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time filter state
  const [timeFilter, setTimeFilter] = useState('today'); // 'today', 'weekly', 'monthly', 'all'
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSupervisorData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [engRes, trainRes, inspectRes] = await Promise.all([
        api.get(`/users?role=ground_engineer&parent_id=${user.id}`),
        api.get('/trains'),
        api.get('/sessions?status=submitted')
      ]);

      if (engRes.data.success) setEngineers(engRes.data.data);
      if (trainRes.data.success) setTrains(trainRes.data.data);
      if (inspectRes.data.success) setInspections(inspectRes.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  // Compute KPI statistics dynamically
  const todayStr = new Date().toISOString().split('T')[0];
  const inspectedToday = inspections.filter(i => i.inspection_date === todayStr).length;
  const leftToday = Math.max(0, trains.length - inspectedToday);

  // Filter completed inspections based on range
  const getFilteredInspections = () => {
    const now = new Date();
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
      return true; // all time
    });
  };

  const downloadSessionReport = (sessionId, trainNo) => {
    const url = `${api.defaults.baseURL || 'http://localhost:5050/api'}/reports/session/${sessionId}`;
    // Fetch with authorization header and download blob
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

  const filteredInspections = getFilteredInspections();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Supervisor Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Track daily inspections, download colourful PDF reports, and supervise ground activities</p>
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
          <button onClick={fetchSupervisorData} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Ground Engineers</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-blue-50 text-blue-600 border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{engineers.length}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Inspected Today</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-emerald-50 text-emerald-600 border-emerald-100">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{inspectedToday}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Inspection Left Today</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-amber-50 text-amber-600 border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{leftToday}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Active Trains</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-purple-50 text-purple-600 border-purple-100">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{trains.length}</h3>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">
            Inspection Submissions ({timeFilter.toUpperCase()})
          </h2>
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
          <p className="text-slate-400 text-xs text-center py-12">Loading inspection reports...</p>
        ) : filteredInspections.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No inspections logged for this period</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Train No.</th>
                  <th className="p-4">Train Name</th>
                  <th className="p-4">Inspection Date</th>
                  <th className="p-4">Completed By (Ground Engineer)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((ins) => (
                  <tr key={ins.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-blue-600">{ins.train_number}</td>
                    <td className="p-4 font-bold text-slate-900">{ins.train_name}</td>
                    <td className="p-4 text-slate-550 text-slate-500 font-semibold">{ins.inspection_date}</td>
                    <td className="p-4 font-bold text-blue-600">
                      {ins.inspector_name || 'Ground Engineer'}
                    </td>
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
                        <Download className="w-3.5 h-3.5" /> PDF Report
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
