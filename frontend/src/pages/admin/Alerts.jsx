import React, { useState, useEffect } from 'react';
import api from '../../api';
import { ShieldAlert, CheckCircle, Clock, Check, RefreshCw } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unacknowledged'); // 'all', 'unacknowledged', 'acknowledged'

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = '/alerts';
      if (filter === 'unacknowledged') url += '?is_acknowledged=false';
      if (filter === 'acknowledged') url += '?is_acknowledged=true';
      const res = await api.get(url);
      if (res.data.success) setAlerts(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const handleAcknowledge = async (id) => {
    try {
      const res = await api.put(`/alerts/${id}/acknowledge`);
      if (res.data.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: 1 } : a));
        fetchAlerts(); // refresh filter views
      }
    } catch (_) {}
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thermal Alerts Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time alerts generated from high temperature breaches</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1 shadow-sm">
            <button
              onClick={() => setFilter('unacknowledged')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${filter === 'unacknowledged' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Unresolved
            </button>
            <button
              onClick={() => setFilter('acknowledged')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${filter === 'acknowledged' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Resolved
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${filter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All
            </button>
          </div>
          <button onClick={fetchAlerts} className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center text-slate-400 text-sm rounded-xl shadow-sm">
          No thermal alerts found matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white border border-slate-200 border-l-4 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition shadow-sm rounded-r-xl ${
                alert.alert_type === 'critical' ? 'border-l-red-500' : 'border-l-orange-500'
              }`}
            >
              <div className="flex gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg border shrink-0 ${
                  alert.alert_type === 'critical' ? 'bg-red-50 border-red-100 text-red-650 text-red-600' : 'bg-orange-50 border-orange-100 text-orange-600'
                }`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{alert.train_number} - {alert.train_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      alert.alert_type === 'critical' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                    }`}>
                      {alert.alert_type}
                    </span>
                  </div>
                  <p className="text-slate-655 text-slate-600 text-sm mt-1">
                    Coach: <span className="text-slate-900 font-bold">{alert.coach_number}</span> ({alert.coach_type}) | Zone: <span className="text-slate-900 font-bold">{alert.zone_name}</span> ({alert.zone_type})
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(alert.created_at * 1000).toLocaleString()}</span>
                  </div>
                  {alert.notes && (
                    <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                      Remarks: {alert.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-2 w-full md:w-auto">
                <div className="text-right">
                  <span className="text-slate-400 text-xs block font-semibold uppercase">Temperature</span>
                  <span className={`text-2xl font-black ${alert.alert_type === 'critical' ? 'text-red-650 text-red-600' : 'text-orange-600'}`}>
                    {alert.temperature}°C
                  </span>
                </div>

                {alert.is_acknowledged ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
                    <Check className="w-4 h-4 stroke-[3px]" />
                    <span>Resolved by {alert.acknowledged_by_name || 'Admin'}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="mt-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2 px-4 transition w-full md:w-auto shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve Alert
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
