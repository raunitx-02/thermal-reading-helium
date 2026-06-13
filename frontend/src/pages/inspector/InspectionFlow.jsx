import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { Save, Lock, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';

export default function InspectionFlow() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Progress tracker
  const [currentIdx, setCurrentIdx] = useState(0); // Index of current zone to inspect
  const [tempInput, setTempInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  
  // Submit state
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      if (res.data.success) {
        setSession(res.data.data);
        const fetchedReadings = res.data.data.readings || [];
        setReadings(fetchedReadings);
        
        // Find first zone that doesn't have a recorded temperature
        const firstUnreadIdx = fetchedReadings.findIndex(r => r.temperature === null || r.temperature === undefined);
        setCurrentIdx(firstUnreadIdx !== -1 ? firstUnreadIdx : 0);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const currentZone = readings[currentIdx];

  const handleSaveReading = async (e) => {
    if (e) e.preventDefault();
    if (!tempInput || isNaN(tempInput)) return;
    
    try {
      const tempNum = parseFloat(tempInput);
      const res = await api.post('/sessions/reading', {
        session_id: sessionId,
        zone_id: currentZone.zone_id,
        temperature: tempNum,
        notes: noteInput
      });

      if (res.data.success) {
        // Update reading local list
        setReadings(prev => prev.map((r, idx) => idx === currentIdx ? {
          ...r,
          temperature: tempNum,
          status: res.data.data.status,
          notes: noteInput
        } : r));
        
        setTempInput('');
        setNoteInput('');
        setMessage('Auto-saved.');
        setTimeout(() => setMessage(''), 2000);
        
        // Auto-advance if not last
        if (currentIdx < readings.length - 1) {
          setCurrentIdx(prev => prev + 1);
        }
      }
    } catch (_) {}
  };

  const handleSubmitSession = async (e) => {
    e.preventDefault();
    // Validate all zones are inspected
    const incomplete = readings.some(r => r.temperature === null || r.temperature === undefined);
    if (incomplete) {
      alert('All zones must be inspected before submission.');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await api.post(`/sessions/${sessionId}/submit`, { remarks });
      if (res.data.success) {
        alert('Inspection logs locked and submitted successfully.');
        navigate('/inspector/dashboard');
      }
    } catch (_) {}
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Initializing checklist flow...
      </div>
    );
  }

  const progressPct = readings.length > 0
    ? Math.round((readings.filter(r => r.temperature !== null).length / readings.length) * 100)
    : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button onClick={() => navigate('/inspector/dashboard')} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-sans">Zone Diagnostics Checklist</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">{session?.train_number} - {session?.train_name} ({session?.inspection_date})</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>Inspection Progress</span>
          <span>{progressPct}% ({readings.filter(r => r.temperature !== null).length}/{readings.length} zones)</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Diagnostics controller input */}
        <div className="md:col-span-2 space-y-6">
          {currentZone ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase font-bold">
                    Coach: {currentZone.coach_number} ({currentZone.coach_type})
                  </span>
                  <h3 className="font-bold text-base text-slate-905 text-slate-900 mt-2">{currentZone.zone_name}</h3>
                  <p className="text-xs text-slate-500 capitalize font-medium">{currentZone.zone_type} Zone</p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block font-semibold">Current Step</span>
                  <span className="text-slate-900 font-black">{currentIdx + 1} / {readings.length}</span>
                </div>
              </div>

              {/* Threshold limits helper info */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-100 rounded-lg p-3 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Normal Range</span>
                  <span className="text-slate-700 font-semibold">{currentZone.normal_min}°C - {currentZone.normal_max}°C</span>
                </div>
                <div>
                  <span className="text-orange-605 text-orange-600 block text-[9px] uppercase font-bold">Warning Level</span>
                  <span className="text-orange-500 font-semibold">&gt;= {currentZone.warning_threshold}°C</span>
                </div>
                <div>
                  <span className="text-red-650 text-red-650 text-red-600 block text-[9px] uppercase font-bold">Critical Level</span>
                  <span className="text-red-500 font-semibold">&gt;= {currentZone.critical_threshold}°C</span>
                </div>
              </div>

              <form onSubmit={handleSaveReading} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-505 text-slate-500 uppercase mb-2">Record Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    autoFocus
                    placeholder="e.g. 45.5"
                    value={tempInput}
                    onChange={(e) => setTempInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg py-3 px-4 text-base font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 text-slate-500 uppercase mb-2">Sensor Notes / Observation (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. slight dust build-up"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg py-2.5 px-4 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => prev - 1)}
                    className="px-4 py-2 border border-slate-200 text-xs text-slate-550 text-slate-600 hover:bg-slate-50 rounded-lg transition disabled:opacity-40 shadow-sm"
                  >
                    Previous Zone
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2 px-6 transition shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Save & Next
                  </button>
                </div>
              </form>

              {message && (
                <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> {message}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs py-12 shadow-sm font-semibold">
              No zones configured for this train.
            </div>
          )}

          {/* Locked submission box */}
          {progressPct === 100 && (
            <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-r-xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Complete Submissions
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                All sensor diagnostic temperatures have been logged. Lock and finalize the logs. Once finalized, logs are sealed.
              </p>
              <form onSubmit={handleSubmitSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Shift In-charge General Remarks</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="All systems check completed. No critical breaches found."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-lg py-2.5 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock className="w-4 h-4" /> Seal & Submit Inspection
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Sidebar listing of coach-zones status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1 shadow-sm">
          <h3 className="font-semibold text-xs text-slate-655 text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2.5">
            Logs Checklist
          </h3>
          <div className="space-y-2">
            {readings.map((r, idx) => (
              <div
                key={r.id || idx}
                onClick={() => setCurrentIdx(idx)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex justify-between items-center ${
                  idx === currentIdx
                    ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                    : r.temperature !== null
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <div>
                  <p className="font-semibold truncate max-w-[120px]">{r.zone_name}</p>
                  <span className="text-[9px] text-slate-450 uppercase mt-0.5 block font-semibold">{r.coach_number}</span>
                </div>
                <span className={`font-mono font-bold ${
                  r.status === 'critical' ? 'text-red-605 text-red-600' : r.status === 'warning' ? 'text-orange-600' : 'text-slate-500'
                }`}>
                  {r.temperature !== null ? `${r.temperature}°C` : '--'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
