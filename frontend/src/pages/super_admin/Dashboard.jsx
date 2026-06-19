import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import api from '../../api';
import { Users, MapPin, Plus, Search, RefreshCw, Edit, Bell, LogOut, ChevronRight, X, Power, Check, ChevronDown, Mail, Phone, Briefcase } from 'lucide-react';

const RAILWAY_ZONES_PARSED = [
  { acronym: 'CR', name: 'Central Railway', division: 'Mumbai', value: 'Central Railway (CR) - Mumbai' },
  { acronym: 'ECR', name: 'East Central Railway', division: 'Hajipur', value: 'East Central Railway (ECR) - Hajipur' },
  { acronym: 'ECoR', name: 'East Coast Railway', division: 'Bhubaneswar', value: 'East Coast Railway (ECoR) - Bhubaneswar' },
  { acronym: 'ER', name: 'Eastern Railway', division: 'Kolkata', value: 'Eastern Railway (ER) - Kolkata' },
  { acronym: 'NCR', name: 'North Central Railway', division: 'Prayagraj', value: 'North Central Railway (NCR) - Prayagraj' },
  { acronym: 'NER', name: 'North Eastern Railway', division: 'Gorakhpur', value: 'North Eastern Railway (NER) - Gorakhpur' },
  { acronym: 'NFR', name: 'Northeast Frontier Railway', division: 'Maligaon, Guwahati', value: 'Northeast Frontier Railway (NFR) - Maligaon, Guwahati' },
  { acronym: 'NR', name: 'Northern Railway', division: 'New Delhi', value: 'Northern Railway (NR) - New Delhi' },
  { acronym: 'NWR', name: 'North Western Railway', division: 'Jaipur', value: 'North Western Railway (NWR) - Jaipur' },
  { acronym: 'SCR', name: 'South Central Railway', division: 'Secunderabad', value: 'South Central Railway (SCR) - Secunderabad' },
  { acronym: 'SECR', name: 'South East Central Railway', division: 'Bilaspur', value: 'South East Central Railway (SECR) - Bilaspur' },
  { acronym: 'SER', name: 'South Eastern Railway', division: 'Garden Reach, Kolkata', value: 'South Eastern Railway (SER) - Garden Reach, Kolkata' },
  { acronym: 'SWR', name: 'South Western Railway', division: 'Hubballi', value: 'South Western Railway (SWR) - Hubballi' },
  { acronym: 'SR', name: 'Southern Railway', division: 'Chennai', value: 'Southern Railway (SR) - Chennai' },
  { acronym: 'WCR', name: 'West Central Railway', division: 'Jabalpur', value: 'West Central Railway (WCR) - Jabalpur' },
  { acronym: 'WR', name: 'Western Railway', division: 'Mumbai Central', value: 'Western Railway (WR) - Mumbai Central' },
  { acronym: 'Metro', name: 'Metro Railway, Kolkata', division: 'Kolkata', value: 'Metro Railway, Kolkata - Kolkata' },
  { acronym: 'SCoR', name: 'South Coast Railway', division: 'Visakhapatnam', value: 'South Coast Railway (SCoR) - Visakhapatnam' }
];

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();

  const [branchAdmins, setBranchAdmins] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_branchAdmins`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [states, setStates] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_states`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [districts, setDistricts] = useState([]);
  const [summary, setSummary] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_summary`);
      return cached ? JSON.parse(cached) : { totalAdmins: 0, totalCities: 728 };
    } catch (_) {
      return { totalAdmins: 0, totalCities: 728 };
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const email = user?.email || 'guest';
      const cached = localStorage.getItem(`cache_${email}_branchAdmins`);
      return cached ? JSON.parse(cached).length === 0 : true;
    } catch (_) {
      return true;
    }
  });

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  // Stats Modal states
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [expandedState, setExpandedState] = useState(null);

  // Searchable dropdown states
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const [zoneSearchText, setZoneSearchText] = useState('');

  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearchText, setStateSearchText] = useState('');

  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [districtSearchText, setDistrictSearchText] = useState('');

  // Depo Officers popup states
  const [selectedDepo, setSelectedDepo] = useState(null);
  const [depoOfficers, setDepoOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [showDepoModal, setShowDepoModal] = useState(false);

  useEffect(() => {
    if (!zoneDropdownOpen && !stateDropdownOpen && !districtDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (zoneDropdownOpen && !e.target.closest('.zone-dropdown-container')) {
        setZoneDropdownOpen(false);
      }
      if (stateDropdownOpen && !e.target.closest('.state-dropdown-container')) {
        setStateDropdownOpen(false);
      }
      if (districtDropdownOpen && !e.target.closest('.district-dropdown-container')) {
        setDistrictDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [zoneDropdownOpen, stateDropdownOpen, districtDropdownOpen]);

  const fetchStates = async () => {
    try {
      const res = await api.get('/geo/states');
      if (res.data.success) {
        setStates(res.data.data);
        const email = user?.email || 'guest';
        localStorage.setItem(`cache_${email}_states`, JSON.stringify(res.data.data));
      }
    } catch (_) {}
  };

  const fetchDistricts = async (state) => {
    if (!state) {
      setDistricts([]);
      return;
    }
    try {
      const res = await api.get(`/geo/districts?state=${encodeURIComponent(state)}`);
      if (res.data.success) setDistricts(res.data.data);
    } catch (_) {}
  };

  const fetchBranchAdmins = async () => {
    const hasCache = (() => {
      try {
        const email = user?.email || 'guest';
        const cached = localStorage.getItem(`cache_${email}_branchAdmins`);
        return cached ? JSON.parse(cached).length > 0 : false;
      } catch (_) {
        return false;
      }
    })();
    if (!hasCache) {
      setLoading(true);
    }
    try {
      const [userRes, geoSumRes] = await Promise.all([
        api.get('/users?role=branch_admin'),
        api.get('/geo/summary')
      ]);
      const email = user?.email || 'guest';
      if (userRes.data.success) {
        setBranchAdmins(userRes.data.data);
        localStorage.setItem(`cache_${email}_branchAdmins`, JSON.stringify(userRes.data.data));
      }
      if (geoSumRes.data.success) {
        const total = geoSumRes.data.data.totalCities || 728;
        const appointed = userRes.data.data.length;
        const newSummary = {
          totalAdmins: appointed,
          totalCities: total
        };
        setSummary(newSummary);
        localStorage.setItem(`cache_${email}_summary`, JSON.stringify(newSummary));
      }
    } catch (_) {}
    setLoading(false);
  };

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) setNotifications(res.data.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchBranchAdmins();
    fetchStates();
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchDistricts(selectedState);
    setSelectedCity('');
  }, [selectedState]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchName || !selectedZone || !name || !email || !selectedState || !selectedCity) {
      showAlert('Required Fields', 'Please fill out all required fields', 'warning');
      return;
    }

    try {
      if (editingAdmin) {
        // Edit Branch Admin
        const res = await api.put(`/users/${editingAdmin.id}`, {
          name,
          email,
          password: password || undefined,
          phone,
          division: branchName,
          zone: selectedZone,
          state: selectedState,
          city: selectedCity
        });
        if (res.data.success) {
          showAlert('Success', 'Branch Admin updated successfully', 'success');
          setShowModal(false);
          fetchBranchAdmins();
        }
      } else {
        // Create new Branch Admin
        const res = await api.post('/users', {
          name,
          email,
          role: 'branch_admin',
          division: branchName,
          zone: selectedZone,
          phone,
          state: selectedState,
          city: selectedCity
        });
        if (res.data.success) {
          showAlert('Success', 'Branch Admin appointed successfully. Activation invite sent to email.', 'success');
          setShowModal(false);
          fetchBranchAdmins();
        }
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const startEdit = (admin) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setPassword('');
    setPhone(admin.phone || '');
    setBranchName(admin.division || '');
    setSelectedZone(admin.zone || '');
    setSelectedState(admin.state || '');
    setSelectedCity(admin.city || '');
    setShowModal(true);
  };

  const startAdd = () => {
    setEditingAdmin(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setBranchName('');
    setSelectedZone('');
    setSelectedState('');
    setSelectedCity('');
    setShowModal(true);
  };

  const handleShowDepoOfficers = async (admin) => {
    setSelectedDepo(admin.division);
    setShowDepoModal(true);
    setLoadingOfficers(true);
    try {
      const res = await api.get(`/users?division=${encodeURIComponent(admin.division)}`);
      if (res.data.success) {
        const officers = res.data.data.filter(u => u.role === 'branch_admin');
        setDepoOfficers(officers);
      }
    } catch (_) {
      setDepoOfficers([]);
    }
    setLoadingOfficers(false);
  };

  const handleToggleActive = async (admin) => {
    const actionText = admin.is_active === 1 ? 'deactivate' : 'activate';
    const confirmed = await showConfirm(
      'Confirm Action',
      `Are you sure you want to ${actionText} this branch admin?`,
      'warning',
      'Yes, Proceed',
      'Cancel'
    );
    if (!confirmed) return;

    try {
      const res = await api.put(`/users/${admin.id}/toggle-active`);
      if (res.data.success) {
        showAlert('Success', res.data.message, 'success');
        fetchBranchAdmins();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const filteredAdmins = branchAdmins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.division?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.zone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredZones = RAILWAY_ZONES_PARSED.filter(z => 
    z.acronym.toLowerCase().includes(zoneSearchText.toLowerCase()) ||
    z.name.toLowerCase().includes(zoneSearchText.toLowerCase()) ||
    z.division.toLowerCase().includes(zoneSearchText.toLowerCase())
  );

  const filteredStates = states.filter(s => 
    s.toLowerCase().includes(stateSearchText.toLowerCase())
  );

  const filteredDistricts = districts.filter(d => 
    d.toLowerCase().includes(districtSearchText.toLowerCase())
  );

  // Group branch admins state-wise and district-wise
  const getStatsData = () => {
    const data = {};
    branchAdmins.forEach(admin => {
      const state = admin.state || 'Other State';
      const city = admin.city || 'Other District';
      if (!data[state]) {
        data[state] = { total: 0, districts: {} };
      }
      data[state].total += 1;
      data[state].districts[city] = (data[state].districts[city] || 0) + 1;
    });

    return Object.entries(data).map(([stateName, info]) => ({
      state: stateName,
      total: info.total,
      districts: Object.entries(info.districts).map(([distName, count]) => ({
        name: distName,
        count
      }))
    })).sort((a, b) => b.total - a.total);
  };

  const stateStats = getStatsData();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Dynamic styles for iOS bouncy transitions */}
      <style>{`
        @keyframes iosSpring {
          0% { transform: scale(0.92) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-ios-spring {
          animation: iosSpring 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>

      {/* Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Heat flow Management and Analysis</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor Every Steps Smartly</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <button onClick={startAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition shadow-sm">
            <Plus className="w-4 h-4" /> Add New Depo
          </button>
          
          <button onClick={fetchBranchAdmins} className="p-2.5 bg-white border border-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition shadow-sm" title="Refresh List">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotif(!showNotif);
                if (!showNotif) handleMarkRead();
              }}
              className={`p-2.5 border border-slate-200 text-slate-550 text-slate-505 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition relative shadow-sm ${showNotif ? 'bg-slate-100' : 'bg-white'}`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
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
                        <p className="text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[8px] text-slate-400 mt-1 block">
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

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
        {/* Clickable Branch Admins Appointed */}
        <div 
          onClick={() => setShowStatsModal(true)}
          className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md cursor-pointer group active:scale-[0.98]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Branch Admins Created</span>
              <span className="text-[9px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 block">View Distribution &rarr;</span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-blue-50 text-blue-600 border-blue-100 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{summary.totalAdmins}</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Cover Cities</span>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 bg-emerald-50 text-emerald-600 border-emerald-100">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{summary.totalCities}</h3>
          </div>
        </div>
      </div>

      {/* Main Table list */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">Branch Administrators List</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, city, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-12">Fetching appointments...</p>
        ) : filteredAdmins.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-12">No branch administrators appointed yet</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Branch/Depo</th>
                  <th className="p-4">Zone</th>
                  <th className="p-4">State</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${admin.is_active === 0 ? 'bg-slate-50/70 opacity-60' : ''}`}>
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {admin.name}
                        {admin.is_active === 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-red-100 text-red-600 rounded font-semibold uppercase">Deactivated</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono">{admin.email}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleShowDepoOfficers(admin)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left focus:outline-none"
                      >
                        {admin.division || 'N/A'}
                      </button>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{admin.zone || 'N/A'}</td>
                    <td className="p-4 font-medium text-slate-700">{admin.state || 'N/A'}</td>
                    <td className="p-4 font-medium text-slate-700">{admin.city || 'N/A'}</td>
                    <td className="p-4 text-slate-500">{admin.phone || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => startEdit(admin)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition"
                          title="Edit Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(admin)}
                          className={`p-1.5 rounded-lg transition ${
                            admin.is_active === 1 
                              ? 'text-red-500 hover:bg-red-50 hover:text-red-650' 
                              : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-650'
                          }`}
                          title={admin.is_active === 1 ? 'Deactivate Admin' : 'Activate Admin'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative my-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingAdmin ? 'Edit Administrator Details' : 'Fill the Admin Details'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Branch/Depo Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Mumbai Central Depo"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="relative zone-dropdown-container">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Zone</label>
                <button
                  type="button"
                  onClick={() => setZoneDropdownOpen(!zoneDropdownOpen)}
                  className="w-full flex items-center justify-between border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-left h-10"
                >
                  <div className="flex items-center gap-2 text-slate-700 truncate pr-4">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {selectedZone ? (
                        (() => {
                          const found = RAILWAY_ZONES_PARSED.find(z => z.value === selectedZone);
                          return found ? `${found.acronym} • ${found.name} (${found.division})` : selectedZone;
                        })()
                      ) : (
                        <span className="text-slate-400">Search or Select Zone...</span>
                      )}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${zoneDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {zoneDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 flex flex-col max-h-64 animate-ios-spring">
                    {/* Search Input */}
                    <div className="relative mb-2 shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Type zone name or acronym..."
                        value={zoneSearchText}
                        onChange={(e) => setZoneSearchText(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white h-9"
                      />
                    </div>

                    {/* Options List */}
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                      {filteredZones.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-xs">No zones match your search</div>
                      ) : (
                        filteredZones.map((z) => {
                          const isSelected = selectedZone === z.value;
                          return (
                            <button
                              key={z.value}
                              type="button"
                              onClick={() => {
                                setSelectedZone(z.value);
                                setZoneDropdownOpen(false);
                                setZoneSearchText('');
                              }}
                              className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg text-xs transition-colors border ${
                                isSelected
                                  ? 'bg-blue-50/65 text-blue-600 border-blue-200 font-semibold shadow-sm'
                                  : 'hover:bg-slate-50 text-slate-700 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 w-full">
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-extrabold text-blue-600 uppercase tracking-wide shrink-0">{z.acronym}</span>
                                    <span className="text-slate-400 shrink-0">•</span>
                                    <span className="font-semibold text-slate-800 truncate">{z.name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                                    ({z.division})
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="E.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email ID</label>
                  <input
                    type="email"
                    required
                    placeholder="E.g. rajesh@indianrailways.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {editingAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep same"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* State & City selectors (Cascading custom dropdowns) */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="relative state-dropdown-container">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select State</label>
                  <button
                    type="button"
                    onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                    className="w-full flex items-center justify-between border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-left h-10"
                  >
                    <div className="flex items-center gap-2 text-slate-700 truncate pr-4">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">
                        {selectedState || <span className="text-slate-400 font-normal">Search or Select State...</span>}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${stateDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {stateDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 flex flex-col max-h-64 animate-ios-spring">
                      {/* Search Input */}
                      <div className="relative mb-2 shrink-0">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Type state name..."
                          value={stateSearchText}
                          onChange={(e) => setStateSearchText(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white h-9"
                        />
                      </div>

                      {/* Options List */}
                      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {filteredStates.length === 0 ? (
                          <div className="text-center py-4 text-slate-400 text-xs">No states match your search</div>
                        ) : (
                          filteredStates.map((s) => {
                            const isSelected = selectedState === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setSelectedState(s);
                                  setStateDropdownOpen(false);
                                  setStateSearchText('');
                                }}
                                className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg text-xs transition-colors border ${
                                  isSelected
                                    ? 'bg-blue-50/65 text-blue-600 border-blue-200 font-bold shadow-sm'
                                    : 'hover:bg-slate-50 text-slate-700 border-transparent font-semibold'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 w-full">
                                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                  <span className="truncate">{s}</span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative district-dropdown-container">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select District/City</label>
                  <button
                    type="button"
                    disabled={!selectedState}
                    onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                    className={`w-full flex items-center justify-between border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 text-left h-10 ${
                      !selectedState ? 'bg-slate-50 cursor-not-allowed text-slate-400' : 'bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-4">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">
                        {selectedCity || <span className="text-slate-400 font-normal">Search or Select District...</span>}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${districtDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {districtDropdownOpen && selectedState && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 flex flex-col max-h-64 animate-ios-spring">
                      {/* Search Input */}
                      <div className="relative mb-2 shrink-0">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Type district name..."
                          value={districtSearchText}
                          onChange={(e) => setDistrictSearchText(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white h-9"
                        />
                      </div>

                      {/* Options List */}
                      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {filteredDistricts.length === 0 ? (
                          <div className="text-center py-4 text-slate-400 text-xs">No districts match your search</div>
                        ) : (
                          filteredDistricts.map((d) => {
                            const isSelected = selectedCity === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  setSelectedCity(d);
                                  setDistrictDropdownOpen(false);
                                  setDistrictSearchText('');
                                }}
                                className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg text-xs transition-colors border ${
                                  isSelected
                                    ? 'bg-blue-50/65 text-blue-600 border-blue-200 font-bold shadow-sm'
                                    : 'hover:bg-slate-50 text-slate-700 border-transparent font-semibold'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 w-full">
                                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                  <span className="truncate">{d}</span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {editingAdmin ? 'Save Changes' : 'Appoint Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* iOS-Style Bouncy Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden transition-all transform scale-100 animate-ios-spring flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Depo Administrators</h2>
                <p className="text-xs text-slate-400 mt-0.5">State & district-wise distribution of active admins</p>
              </div>
              <button 
                onClick={() => { setShowStatsModal(false); setExpandedState(null); }} 
                className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable List) */}
            <div className="flex-1 overflow-y-auto pr-1 mt-4 custom-scrollbar space-y-2">
              {stateStats.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No branch admins assigned to any state yet.
                </div>
              ) : (
                stateStats.map((item) => (
                  <div key={item.state} className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => setExpandedState(expandedState === item.state ? null : item.state)}
                      className="w-full flex items-center justify-between py-4 px-4 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200" />
                        <span className="font-extrabold text-slate-800 text-sm tracking-tight">{item.state}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-50 text-blue-600 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {item.total} Admin{item.total > 1 ? 's' : ''}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${expandedState === item.state ? 'rotate-90 text-blue-600' : ''}`} />
                      </div>
                    </button>

                    {/* Collapsible content (Accordion) */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        expandedState === item.state ? 'max-h-[300px] opacity-100 border-t border-slate-100/50 bg-white/70 px-4 py-3' : 'max-h-0 opacity-0 pointer-events-none'
                      }`}
                    >
                      <div className="space-y-2 pl-4 border-l-2 border-blue-100">
                        {item.districts.map(d => (
                          <div key={d.name} className="flex justify-between items-center py-1 text-xs hover:translate-x-1 transition-transform duration-200">
                            <span className="text-slate-600 font-semibold">{d.name}</span>
                            <span className="text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                              {d.count} Admin{d.count > 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-4 mt-4 text-center shrink-0">
              <button 
                onClick={() => { setShowStatsModal(false); setExpandedState(null); }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Depo Officers List Modal */}
      {showDepoModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden transition-all transform scale-100 animate-ios-spring flex flex-col max-h-[80vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedDepo} Depo Administrators</h2>
                <p className="text-xs text-slate-400 mt-0.5">List of all active branch administrators assigned to this depo</p>
              </div>
              <button 
                onClick={() => { setShowDepoModal(false); setDepoOfficers([]); }} 
                className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 mt-4 custom-scrollbar">
              {loadingOfficers ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Fetching depo administrators...
                </div>
              ) : depoOfficers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No branch administrators appointed to this depo yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {depoOfficers.map((officer) => {
                    const initials = officer.name
                      ? officer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : 'U';
                    
                    return (
                      <div 
                        key={officer.id} 
                        className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition duration-200"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Blue colored Avatar for Branch Admins */}
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 bg-blue-50 border border-blue-100 text-blue-600 shadow-sm shadow-blue-100/50">
                            {initials}
                          </div>
                          
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight truncate">{officer.name}</h4>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-350" /> {officer.email}
                              </span>
                              {officer.phone && (
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-350" /> {officer.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Role Badge */}
                        <div className="shrink-0 pl-2">
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100/65 text-blue-700">
                            Branch Admin
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-4 mt-4 text-center shrink-0">
              <button 
                onClick={() => { setShowDepoModal(false); setDepoOfficers([]); }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close List
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
