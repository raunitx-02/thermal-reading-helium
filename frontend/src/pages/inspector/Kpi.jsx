import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Target, Trophy, Clock, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InspectorKpi() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchKpis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kpi/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-slate-500 text-sm">
        <Clock className="w-5 h-5 animate-spin mr-2" /> Calculating metrics...
      </div>
    );
  }

  const cards = [
    { title: 'Inspections Done', val: stats?.summary?.totalInspections || 0, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { title: 'On-Time rate', val: stats?.summary?.totalOnTime || 0, icon: Clock, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { title: 'Violations Found', val: stats?.summary?.totalViolations || 0, icon: AlertTriangle, color: 'text-red-605 text-red-600 bg-red-50 border-red-100' },
    { title: 'Average Compliance', val: `${stats?.summary?.avgCompliance || 100}%`, icon: Trophy, color: 'text-amber-600 bg-amber-50 border-amber-100' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      <div className="border-b border-slate-205 border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-909 text-slate-900 font-sans">My KPI Metrics Card</h1>
        <p className="text-slate-505 text-slate-500 text-sm mt-1">Track your daily targets, submission schedule compliance, and anomalies detection</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div
            key={i}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm shadow-slate-100/50 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider leading-snug block select-none break-words min-w-0 flex-1">
                {c.title}
              </span>
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 ${c.color.split(' ').slice(1).join(' ')}`}>
                <c.icon className={`w-5 h-5 ${c.color.split(' ')[0]}`} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">{c.val}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-600" /> Compliance Trend (Last 30 days)
        </h3>
        <div className="h-64 w-full">
          {stats?.history && stats.history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#000000' }} />
                <Line type="monotone" dataKey="compliance_rate" name="Compliance %" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-xs text-center py-12">No historical records available</p>
          )}
        </div>
      </div>
    </div>
  );
}
