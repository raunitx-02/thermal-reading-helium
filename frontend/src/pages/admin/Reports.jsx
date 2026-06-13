import React, { useState, useEffect } from 'react';
import api from '../../api';
import { FileDown, Calendar, Search, FileText, AlertTriangle, UserCheck, History } from 'lucide-react';

export default function Reports() {
  const [type, setType] = useState('daily');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainId, setTrainId] = useState('');
  const [trains, setTrains] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Fetch trains for dropdown filter
  useEffect(() => {
    const fetchTrains = async () => {
      try {
        const res = await api.get('/trains');
        if (res.data.success) setTrains(res.data.data);
      } catch (_) {}
    };
    fetchTrains();
  }, []);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      let url = `/reports/data?type=${type}&startDate=${startDate}&endDate=${endDate}`;
      if (trainId) url += `&train_id=${trainId}`;
      const res = await api.get(url);
      if (res.data.success) setData(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  const handleDownload = (format) => {
    let url = `http://localhost:5050/api/reports/download?format=${format}&type=${type}&startDate=${startDate}&endDate=${endDate}`;
    if (trainId) url += `&train_id=${trainId}`;
    
    // Attach auth token if available (the API route needs it)
    const token = localStorage.getItem('accessToken');
    if (token) url += `&token=${token}`;
    window.open(url, '_blank');
  };

  const reportTypes = [
    { key: 'daily', label: 'Daily Inspection Report', desc: 'Summary of inspections logged per day', icon: FileText },
    { key: 'alerts', label: 'Alerts & Exception Report', desc: 'All temperature breaches and resolution status', icon: AlertTriangle },
    { key: 'kpi', label: 'Inspector KPI Activity Report', desc: 'Submission timelines and compliance scores', icon: UserCheck },
    { key: 'history', label: 'Coach & Zone History Report', desc: 'Detailed chronological logs of temperatures', icon: History }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Export & Download Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Generate government-compliant PDF and Excel sheets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6 h-fit shadow-sm">
          <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
            Report Parameters
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Report Type</label>
              <div className="space-y-2">
                {reportTypes.map((rt) => (
                  <label
                    key={rt.key}
                    onClick={() => setType(rt.key)}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition text-left ${
                      type === rt.key ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <rt.icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">{rt.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{rt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Filter by Train (Optional)</label>
              <select
                value={trainId}
                onChange={(e) => setTrainId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="">All Trains</option>
                {trains.map(t => (
                  <option key={t.id} value={t.id}>{t.train_number} - {t.train_name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2.5 transition mt-4 flex items-center justify-center gap-2 shadow-sm"
            >
              <Search className="w-4 h-4" /> Run Query
            </button>
          </div>
        </div>

        {/* Right columns: Query Preview & Export options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action header */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">
              Query matched: <strong className="text-slate-900">{data.length}</strong> records
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleDownload('pdf')}
                disabled={data.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold text-xs rounded-lg py-2.5 px-4 transition border border-slate-200 shadow-sm"
              >
                <FileDown className="w-4 h-4 text-red-500" /> Export PDF
              </button>
              <button
                onClick={() => handleDownload('xlsx')}
                disabled={data.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100/50 border border-emerald-200 disabled:opacity-40 text-emerald-600 font-semibold text-xs rounded-lg py-2.5 px-4 transition shadow-sm"
              >
                <FileDown className="w-4 h-4 text-emerald-600" /> Export Excel
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm min-h-[480px] flex flex-col">
            <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Preview Table</h3>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Running report queries...</div>
            ) : data.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-semibold">No records match parameters. Adjust filters and try again.</div>
            ) : (
              <div className="overflow-x-auto max-h-[60vh] flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      {Object.keys(data[0]).map((k) => (
                        <th key={k} className="py-2.5 px-4">{k.replace('_', ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {data.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50">
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className="py-3 px-4 truncate max-w-[200px]">
                            {val === null || val === undefined ? 'N/A' : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
