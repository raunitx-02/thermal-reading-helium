import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { Shield, KeyRound, AlertTriangle, CheckCircle, Award } from 'lucide-react';

export default function ActivateAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/verify-activation?token=${token}`);
        if (res.data.success) {
          setUserData(res.data.data);
        } else {
          setError(res.data.message || 'Invalid or expired activation link.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired activation link.');
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/activate', { token, password });
      if (res.data.success) {
        setSuccess('Account activated successfully! Redirecting to login page...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(res.data.message || 'Activation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden px-4">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-emerald-100/40 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl shadow-slate-100/60 rounded-xl p-8 relative z-10 animate-ios-spring">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-3">
            <Award className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Activate Account</h1>
          <p className="text-slate-500 text-sm mt-1 font-sans text-center">Indian Railways Thermal Diagnostics Hub</p>
        </div>

        {verifying ? (
          <div className="text-center py-8 text-slate-500 text-sm font-medium">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            Verifying your activation invite...
          </div>
        ) : error && !userData ? (
          <div className="text-center py-6 space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <Link to="/login" className="inline-block text-xs font-bold text-blue-600 hover:text-blue-700 transition">
              Back to Login Page
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Greeting */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Welcome Onboard</p>
              <p className="text-sm font-bold text-slate-800">{userData?.name}</p>
              <p className="text-[11px] font-medium text-slate-500">{userData?.email}</p>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mt-1.5 inline-block bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Role: {userData?.role === 'ground_engineer' ? 'Ground Engineer' : userData?.role === 'supervisor' ? 'Supervisor' : userData?.role === 'branch_admin' ? 'Admin' : 'Staff'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {!success && (
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Set Login Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-blue-500/10 active:scale-[0.98]"
                >
                  {submitting ? 'Activating Account...' : 'Activate & Save Credentials'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
