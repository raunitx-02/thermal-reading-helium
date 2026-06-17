import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Mail, Lock, AlertTriangle, Train } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      let dest = '/login';
      if (user.role === 'super_admin') dest = '/super-admin/dashboard';
      else if (user.role === 'branch_admin') dest = '/branch-admin/dashboard';
      else if (user.role === 'supervisor') dest = '/supervisor/dashboard';
      else if (user.role === 'ground_engineer') dest = '/ground-engineer/dashboard';
      if (dest !== '/login') {
        navigate(dest, { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(email, password);
      if (data.success) {
        const role = data.data.user.role;
        let dest = '/login';
        if (role === 'super_admin') dest = '/super-admin/dashboard';
        else if (role === 'branch_admin') dest = '/branch-admin/dashboard';
        else if (role === 'supervisor') dest = '/supervisor/dashboard';
        else if (role === 'ground_engineer') dest = '/ground-engineer/dashboard';
        navigate(dest);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden px-4">
      {/* Light decorative blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-orange-100/40 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl shadow-slate-100/60 rounded-xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <img src="/ir-logo.png" className="w-24 h-24 object-contain mb-3" alt="IR Logo" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Indian Railways</h1>
          <p className="text-blue-600 font-bold text-xs mt-1">Save Life Smartly</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@thermalportal.in"
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-350 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-350 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-lg py-2.5 transition mt-2 flex items-center justify-center gap-2 shadow-sm"
          >
            <Shield className="w-4 h-4" />
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-450">
            Confidential System. Unauthorized access is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
