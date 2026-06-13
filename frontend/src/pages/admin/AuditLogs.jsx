import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, RefreshCw, Clock, Terminal } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/audit-logs';
      if (search) url += `?search=${search}`;
      const res = await api.get(url);
      if (res.data.success) setLogs(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">System Audit Trail</h1>
          <p className="text-slate-500 text-sm mt-1">Independent system-generated logs tracking all staff activities</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative shadow-sm rounded-lg">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions or users..."
              className="bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 placeholder-slate-400 w-60"
            />
          </div>
          <button type="submit" className="p-2 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm animate-none">
            <RefreshCw className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Terminal className="w-4 h-4 text-blue-600" /> Audit Log Entries
        </h2>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Retrieving system trails...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No audit entries found matching search query.</p>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Operator</th>
                  <th className="py-2.5 px-4">Action Type</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 text-slate-405 text-slate-400 truncate whitespace-nowrap">
                      <span className="flex items-center gap-1.5 font-sans"><Clock className="w-3.5 h-3.5 shrink-0" />
                      {new Date(log.created_at * 1000).toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="font-bold text-slate-900 block">{log.user_name || 'System'}</span>
                      <span className="text-[10px] text-slate-500 block">{log.user_email || 'cron_job'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-655 text-slate-600 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 truncate max-w-[120px] font-sans">
                      {log.entity_type ? `${log.entity_type.toUpperCase()}: ${log.entity_id || 'N/A'}` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">{log.ip_address || '127.0.0.1'}</td>
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
