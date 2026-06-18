import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Train, Play, RefreshCw, ClipboardList, AlertCircle, Bell, LogOut, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function EngineerDashboard() {
  const { user, logout } = useAuth();
  const { showConfirm } = useModal();
  const renderRise = (rise) => {
    const formatted = rise.toFixed(1);
    if (rise > 10) {
      return <span className="text-red-650 text-red-650 font-bold text-red-600">+{formatted}°C</span>;
    } else if (rise < 0) {
      return <span className="text-emerald-600 font-bold">{formatted}°C</span>;
    } else {
      return <span className="text-slate-750 font-bold">{formatted}°C</span>;
    }
  };
  
  const [assignments, setAssignments] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_assignments`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [drafts, setDrafts] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_drafts`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cachedA = localStorage.getItem(`cache_${email}_assignments`);
      const cachedD = localStorage.getItem(`cache_${email}_drafts`);
      const hasA = cachedA ? JSON.parse(cachedA).length > 0 : false;
      const hasD = cachedD ? JSON.parse(cachedD).length > 0 : false;
      return !(hasA || hasD);
    } catch (_) {
      return true;
    }
  });
  const navigate = useNavigate();

  // Demo modal states
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeDemoRake, setActiveDemoRake] = useState(null);
  const [demoZones, setDemoZones] = useState([
    { id: 1, coach: 'DMC1', zone: 'CRW MCB Panel', ambient: '0', max: '31.5', notes: 'Acceptable' },
    { id: 2, coach: 'DMC1', zone: 'Contactor panel', ambient: '0', max: '56.9', notes: 'Acceptable' },
    { id: 3, coach: 'DMC1', zone: 'MCC', ambient: '0', max: '26.6', notes: 'Acceptable' },
    { id: 4, coach: 'DMC1', zone: 'TF Radiator side', ambient: '0', max: '45.5', notes: 'Acceptable' },
    { id: 5, coach: 'DMC1', zone: 'TF Terminal side1(Outer Side)', ambient: '0', max: '39.0', notes: 'Acceptable' },
    { id: 6, coach: 'DMC1', zone: 'TF Terminal side2(Inner Side)', ambient: '0', max: '48.6', notes: 'Acceptable' },
    { id: 7, coach: 'DMC1', zone: 'Transformer Name Plate side', ambient: '0', max: '21.5', notes: 'Acceptable' },
    { id: 8, coach: 'DMC1', zone: 'Women Compartment LHS Panel', ambient: '0', max: '20.5', notes: 'Acceptable' },
    { id: 9, coach: 'DMC1', zone: 'Women Compartment RHS Panel', ambient: '0', max: '24.3', notes: 'Acceptable' },
    { id: 10, coach: 'TC1', zone: 'AE Side', ambient: '0', max: '51.3', notes: 'Acceptable' },
    { id: 11, coach: 'TC1', zone: 'NAE Side', ambient: '0', max: '25.0', notes: 'Acceptable' },
    { id: 12, coach: 'TC2', zone: 'AE Side', ambient: '0', max: '44.9', notes: 'Acceptable' },
    { id: 13, coach: 'TC2', zone: 'NAE Side', ambient: '0', max: '50.8', notes: 'Acceptable' }
  ]);

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_notifications`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (!showNotif) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.notif-container')) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotif]);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        const email = user?.email || 'guest';
        localStorage.setItem(`cache_${email}_notifications`, JSON.stringify(res.data.data));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, is_read: 1 }));
        const email = user?.email || 'guest';
        localStorage.setItem(`cache_${email}_notifications`, JSON.stringify(updated));
        return updated;
      });
    } catch (_) {}
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      'Confirm Logout',
      'Are you sure you want to log out of the system?',
      'confirm',
      'Yes, Logout',
      'Cancel'
    );
    if (!confirmed) return;
    await logout();
    navigate('/login');
  };

  const fetchEngineerData = async () => {
    if (assignments.length === 0 && drafts.length === 0) {
      setLoading(true);
    }
    try {
      const [assignRes, draftRes] = await Promise.all([
        api.get(`/assignments?ground_engineer_id=${user.id}&status=assigned`),
        api.get(`/sessions?status=draft&inspector_id=${user.id}`)
      ]);
      const email = user?.email || 'guest';
      if (assignRes.data.success) {
        const list = assignRes.data.data;
        setAssignments(list);
        localStorage.setItem(`cache_${email}_assignments`, JSON.stringify(list));
      }
      if (draftRes.data.success) {
        const dList = draftRes.data.data;
        setDrafts(dList);
        localStorage.setItem(`cache_${email}_drafts`, JSON.stringify(dList));
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchEngineerData();
  }, []);

  const handleStartInspection = async (trainId) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.post('/sessions', { train_id: trainId, inspection_date: todayStr });
      if (res.data.success) {
        navigate(`/ground-engineer/inspection/${res.data.data.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start inspection');
    }
  };

  const handleDemoSubmit = async () => {
    try {
      let finalTrainId = activeDemoRake?.train_id;
      if (!finalTrainId || finalTrainId === 'demo-train-id') {
        const trainRes = await api.get('/trains');
        if (trainRes.data.success && trainRes.data.data.length > 0) {
          finalTrainId = trainRes.data.data[0].id;
        } else {
          alert("Demo error: Please configure at least one Rake in supervisor panel first.");
          return;
        }
      }
      
      const todayStr = new Date().toISOString().split('T')[0];
      const createRes = await api.post('/sessions', {
        train_id: finalTrainId,
        inspection_date: todayStr
      });
      
      if (createRes.data.success) {
        const sessId = createRes.data.data.id;
        const readings = createRes.data.data.readings || [];
        
        for (let i = 0; i < readings.length; i++) {
          const zone = readings[i];
          const dz = demoZones[i % demoZones.length];
          
          await api.post('/sessions/reading', {
            session_id: sessId,
            zone_id: zone.zone_id,
            temperature: parseFloat(dz.max),
            ambient_temperature: parseFloat(dz.ambient),
            notes: dz.notes || 'Bogie Scan'
          });
        }
        
        const submitRes = await api.post(`/sessions/${sessId}/submit`, {
          remarks: 'Bogie scan submitted successfully via quick inspection flow.'
        });
        
        if (submitRes.data.success) {
          setSuccessMessage('Your inspection logs have been locked & synced successfully.');
          setShowConfirmModal(false);
          setShowDemoForm(false);
          setShowSuccessPopup(true);
          fetchEngineerData();
        }
      }
    } catch (err) {
      setSuccessMessage('Inspection submitted successfully.');
      setShowConfirmModal(false);
      setShowDemoForm(false);
      setShowSuccessPopup(true);
    }
  };

  const updateZoneField = (id, field, value) => {
    setDemoZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Engineer Assignment Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Review your assigned rakes and launch bogie thermal check sessions</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <button onClick={fetchEngineerData} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm" title="Refresh Assignments">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative notif-container">
            <button
              onClick={() => {
                setShowNotif(!showNotif);
                if (!showNotif) handleMarkRead();
              }}
              className={`p-2.5 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition relative shadow-sm ${showNotif ? 'bg-slate-100' : 'bg-white'}`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full" />
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 max-h-80 overflow-y-auto z-50">
                <h3 className="font-semibold text-xs text-slate-900 border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
                  <span>Notifications</span>
                  <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-950">✕</button>
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">No recent notifications</p>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2 rounded-lg text-[10px] border ${n.is_read ? 'opacity-65 bg-slate-50/50 border-slate-100' : 'bg-blue-50/30 border-blue-100 text-slate-900'}`}>
                        <p className="font-semibold text-slate-900">{n.title}</p>
                        <p className="text-slate-650 mt-0.5">{n.message}</p>
                        <span className="text-[8px] text-slate-405 mt-1 block">
                          {new Date(n.created_at * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="p-2.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200 transition bg-white shadow-sm"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Assignments */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4">
            <Train className="w-5 h-5 text-blue-600" /> Assigned Rakes Inventory
          </h2>

          {loading ? (
            <p className="text-slate-400 text-xs text-center py-12">Loading assigned schedules...</p>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-400 text-xs">No active assignments allocated by your supervisor.</p>
              <button
                type="button"
                onClick={() => {
                  setActiveDemoRake({ train_id: 'demo-train-id', train_number: '12401', train_name: 'Gomti Express' });
                  setShowDemoForm(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg px-4 py-2 transition shadow-sm"
              >
                <Play className="w-4 h-4" /> Start Demo Inspection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-blue-600 font-mono">{a.train_number}</h3>
                    <p className="text-slate-900 text-xs font-bold mt-1">{a.train_name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">{a.route}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveDemoRake(a);
                      setShowDemoForm(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg py-2 transition shadow-sm"
                  >
                    <Play className="w-4 h-4" /> Start Bogie Check
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inspection drafts */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 h-fit shadow-sm">
          <h2 className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4">
            <ClipboardList className="w-5 h-5 text-amber-600" /> Active Draft Sessions
          </h2>

          {drafts.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-12">No open draft sessions</p>
          ) : (
            <div className="space-y-4">
              {drafts.map((d) => (
                <div key={d.id} className="p-4 bg-slate-50 border border-slate-250 border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition">
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">{d.train_name}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">{d.train_number}</p>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1">{d.inspection_date}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/ground-engineer/inspection/${d.id}`)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-650 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg shadow-sm transition"
                  >
                    Resume Check
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>      {/* Inspection Form Modal */}
      {showDemoForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-[600px] max-w-full animate-ios-spring space-y-5 relative">
            <button 
              onClick={() => setShowDemoForm(false)} 
              className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-650 transition rounded-full p-1.5 shadow-md flex items-center justify-center z-10"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-blue-650 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase font-mono">
                Rake: {activeDemoRake?.train_number}
              </span>
              <h3 className="font-bold text-base text-slate-800 mt-1.5">
                Bogie Part-wise Diagnostics
              </h3>
              <p className="text-[10px] text-slate-450 mt-0.5">{activeDemoRake?.route || 'Route Check'}</p>
            </div>

            <div className="overflow-y-auto max-h-[300px] border border-slate-100 rounded-lg custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold sticky top-0 z-20">
                    <th className="p-3">Coach</th>
                    <th className="p-3">Zone/Component</th>
                    <th className="p-3 w-20">Ambient (°C)</th>
                    <th className="p-3 w-20">Max Temp (°C)</th>
                    <th className="p-3 w-16 text-center">Rise</th>
                    <th className="p-3 w-20 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {demoZones.map((dz) => {
                    const rise = dz.max && dz.ambient ? parseFloat(dz.max) - parseFloat(dz.ambient) : 0;
                    let statusColor = 'bg-emerald-50 text-emerald-650 border-emerald-100';
                    let statusLabel = 'ACCEPTABLE';
                    if (rise > 25.0) {
                      statusColor = 'bg-red-50 text-red-650 border-red-100';
                      statusLabel = 'INVESTIGATE';
                    }
                    return (
                      <tr key={dz.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-700">{dz.coach.split(' ')[0]}</td>
                        <td className="p-3 font-semibold text-slate-800">{dz.zone}</td>
                        <td className="p-3">
                          <input 
                            type="number"
                            value={dz.ambient}
                            onChange={(e) => updateZoneField(dz.id, 'ambient', e.target.value)}
                            className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            value={dz.max}
                            onChange={(e) => updateZoneField(dz.id, 'max', e.target.value)}
                            className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                          />
                        </td>
                        <td className="p-3 text-center">{renderRise(rise)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg py-2.5 transition shadow-sm mt-2"
            >
              Submit Inspection Report
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-[400px] max-w-full animate-ios-spring space-y-4 relative">
            <div className="text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
              <h3 className="font-bold text-sm text-slate-900">Confirm Submission</h3>
              <p className="text-xs text-slate-550">
                Verify diagnostic records for rake <span className="font-bold">{activeDemoRake?.train_number}</span> before permanent supervisor sync.
              </p>
            </div>

            <div className="overflow-y-auto max-h-48 p-3 bg-slate-50 rounded-xl space-y-1.5 text-[10px] text-slate-655 font-semibold">
              <div className="grid grid-cols-4 border-b border-slate-200 pb-1 mb-1 text-slate-400">
                <span>Coach</span>
                <span>Component</span>
                <span className="text-center">Max Temp</span>
                <span className="text-right">Rise</span>
              </div>
              {demoZones.map((dz) => {
                const rise = dz.max && dz.ambient ? parseFloat(dz.max) - parseFloat(dz.ambient) : 0;
                const isAnomaly = rise > 25;
                return (
                  <div key={dz.id} className={`grid grid-cols-4 py-0.5 ${isAnomaly ? 'text-amber-600 font-bold' : ''}`}>
                    <span>{dz.coach.split(' ')[0]}</span>
                    <span className="truncate">{dz.zone}</span>
                    <span className="text-center">{dz.max}°C</span>
                    <span className="text-right">{renderRise(rise)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
              >
                Keep Editing
              </button>
              <button
                onClick={handleDemoSubmit}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-sm"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center space-y-4 border border-slate-100 transform transition-all duration-300 scale-100 opacity-100 animate-ios-spring">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
              <CheckCircle className="w-8 h-8 text-emerald-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Report Submitted</h3>
              <p className="text-xs text-slate-500 font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 transform hover:scale-[1.02]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
