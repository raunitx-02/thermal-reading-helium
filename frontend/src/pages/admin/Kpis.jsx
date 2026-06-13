import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Target, Trophy, Clock, Calendar, RefreshCw } from 'lucide-react';

export default function Kpis() {
  const [scoreboard, setScoreboard] = useState([]);
  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Form setup
  const [inspectorId, setInspectorId] = useState('');
  const [dailyTarget, setDailyTarget] = useState(3);
  const [deadline, setDeadline] = useState(17);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  const fetchKpiData = async () => {
    setLoading(true);
    try {
      const [scoreRes, targetRes, userRes] = await Promise.all([
        api.get(`/kpi/scoreboard?date=${date}`),
        api.get('/kpi/targets'),
        api.get('/users?role=inspector')
      ]);
      if (scoreRes.data.success) setScoreboard(scoreRes.data.data);
      if (targetRes.data.success) setTargets(targetRes.data.data);
      if (userRes.data.success) {
        setUsers(userRes.data.data);
        if (userRes.data.data.length > 0) setInspectorId(userRes.data.data[0].id);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchKpiData();
  }, [date]);

  const handleSetTarget = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/kpi/targets', {
        inspector_id: inspectorId,
        target_inspections_per_day: dailyTarget,
        deadline_hour: deadline,
        effective_from: effectiveFrom
      });
      if (res.data.success) {
        alert('KPI target set successfully');
        fetchKpiData();
      }
    } catch (_) {}
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 font-sans">KPI Scoreboard & Targets</h1>
        <p className="text-slate-500 text-sm mt-1">Track daily inspection metrics and enforce deadline compliance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scoreboard List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard
            </h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none"
              />
              <button onClick={fetchKpiData} className="p-2 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm animate-none">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400 text-xs text-center py-12">Loading scoreboard...</p>
          ) : scoreboard.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-12">No inspection submissions logged for this date</p>
          ) : (
            <div className="space-y-4">
              {scoreboard.map((row, index) => {
                const isCompliant = row.inspections_done >= row.target;
                return (
                  <div key={row.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        index === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-200 text-slate-500'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{row.inspector_name}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">{row.employee_id} | {row.division} Div</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:gap-12 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="text-center sm:text-right">
                        <span className="text-[10px] text-slate-450 block uppercase font-bold text-slate-400">Done / Target</span>
                        <span className={`text-sm font-bold ${isCompliant ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {row.inspections_done} / {row.target}
                        </span>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-[10px] text-slate-450 block uppercase font-bold text-slate-400">Anomalies Found</span>
                        <span className="text-sm font-bold text-red-600">{row.violations_found}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-450 block uppercase font-bold text-slate-400">Compliance</span>
                        <span className={`text-sm font-bold ${row.compliance_rate >= 90 ? 'text-emerald-600' : 'text-orange-605 text-orange-600'}`}>
                          {row.compliance_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Set Targets Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between h-fit gap-6 shadow-sm">
          <div>
            <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4">
              <Target className="w-5 h-5 text-blue-600" /> Assign Targets
            </h2>
            <form onSubmit={handleSetTarget} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Inspector</label>
                <select
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.employee_id || 'No ID'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Daily Target (Inspections)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Shift Deadline Hour (24h)</label>
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
                >
                  <option value={12}>12:00 PM (Noon)</option>
                  <option value={15}>03:00 PM</option>
                  <option value={17}>05:00 PM</option>
                  <option value={18}>06:00 PM</option>
                  <option value={20}>08:00 PM</option>
                  <option value={22}>10:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Effective Date</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg py-2.5 transition mt-4 shadow-sm"
              >
                Configure Target
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
