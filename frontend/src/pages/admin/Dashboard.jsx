import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Train, ShieldAlert, CheckCircle2, AlertTriangle, Users,
  RefreshCw
} from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#10b981'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get(`/dashboard/charts?days=${days}`)
      ]);
      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (chartRes.data.success) setCharts(chartRes.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [days]);

  if (loading && !summary) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading stats...</span>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Trains', val: summary?.totalTrains || 0, icon: Train, bg: 'bg-blue-55 bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Completed Today', val: summary?.completedInspections || 0, icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { title: 'Pending Logs', val: summary?.pendingInspections || 0, icon: AlertTriangle, bg: 'bg-amber-50 text-amber-605 text-amber-600 border-amber-100' },
    { title: 'Active Warnings', val: summary?.activeAlerts || 0, icon: ShieldAlert, bg: 'bg-red-50 text-red-600 border-red-100', animate: true },
    { title: 'Avg Compliance', val: `${summary?.complianceRate || 100}%`, icon: Users, bg: 'bg-purple-50 text-purple-650 text-purple-650 text-purple-600 border-purple-100' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time Bogie Thermal Health and compliance stats</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
          >
            <option value={7}>Last 7 Days</option>
            <option value={15}>Last 15 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
          <button onClick={fetchDashboard} className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`p-5 bg-white border border-slate-200 rounded-xl shadow-sm shadow-slate-100/50 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
              card.animate && card.val > 0 ? 'ring-1 ring-red-500/50' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider leading-snug block select-none break-words min-w-0 flex-1" title={card.title}>
                {card.title}
              </span>
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.animate && card.val > 0 ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">{card.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Inspections Trend Line Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold text-lg text-slate-900 mb-6">Inspection & Alert Trends</h3>
          <div className="h-[400px] w-full flex-1">
            {charts?.trendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#000000' }} />
                  <Legend />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="alerts" name="Alerts Triggered" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">No trend data</div>
            )}
          </div>
        </div>

        {/* Alerts Distribution Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-lg text-slate-900 mb-6">Breach Level Distribution</h3>
            <div className="h-[320px] w-full flex items-center justify-center">
              {charts?.alertDistribution && charts.alertDistribution.some(a => a.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.alertDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {charts.alertDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#000000' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-xs">No active anomalies recorded</p>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Red: Critical (&gt;=85°C)</span>
            <span>Orange: Warning (&gt;=70°C)</span>
          </div>
        </div>
      </div>

      {/* Lower Row: Anomaly Trains Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-lg text-slate-900 mb-6">Worst Performing Trains (Top 5 Anomaly Counts)</h3>
        <div className="h-72 w-full">
          {charts?.worstTrains && charts.worstTrains.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.worstTrains}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#000000' }} />
                <Bar dataKey="value" name="Breaches" fill="#ef4444" radius={[4, 4, 0, 0]}>
                  {charts.worstTrains.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#f97316" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-xs">All trains operating under normal thresholds</div>
          )}
        </div>
      </div>
    </div>
  );
}
